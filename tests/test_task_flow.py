import asyncio

from fastapi import FastAPI
from fastapi.testclient import TestClient
import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from modern_delivery_os.backend.app.api.router import router
from modern_delivery_os.backend.app.db import Base, get_db
from modern_delivery_os.backend.app.models import (  # noqa: F401
    ActivityEvent,
    Artifact,
    InterventionLog,
    Task,
    TaskPlan,
    TaskReview,
    WorkItem,
)
from modern_delivery_os.backend.app.runtime import RuntimeWorker


@pytest.fixture
def session_factory(tmp_path):
    database_path = tmp_path / "delivery-os-test.db"
    engine = create_async_engine(f"sqlite+aiosqlite:///{database_path}", future=True)
    factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    asyncio.run(_create_schema(engine))
    yield factory
    asyncio.run(engine.dispose())


@pytest.fixture
def client(session_factory):
    app = FastAPI()
    app.include_router(router)

    async def override_get_db():
        async with session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


async def _create_schema(engine) -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


def actor_headers(role: str, actor_id: str) -> dict[str, str]:
    return {
        "X-Actor-Role": role,
        "X-Actor-Id": actor_id,
    }


def test_task_flow_bundle_and_teams(client: TestClient):
    create_response = client.post(
        "/api/tasks",
        headers=actor_headers("IntakeCoordinator", "intake-test"),
        json={
            "title": "Build launch metrics view",
            "summary": "Need a modern board-backed delivery workflow",
            "priority": "high",
            "request_type": "project_request",
            "source": "tests",
            "requester": "ops@example.com",
            "tags": ["launch", "metrics"],
            "meta": {},
        },
    )
    assert create_response.status_code == 200
    task_id = create_response.json()["data"]["task_id"]

    qualify_response = client.post(
        f"/api/tasks/{task_id}/qualify",
        headers=actor_headers("IntakeCoordinator", "intake-test"),
        json={"owner_id": "intake-test", "summary": "Qualified for planning"},
    )
    assert qualify_response.status_code == 200
    assert qualify_response.json()["data"]["state"] == "Qualified"

    plan_response = client.post(
        f"/api/tasks/{task_id}/plan",
        headers=actor_headers("ProjectManager", "pm-test"),
        json={
            "goal": "Ship a board and reporting flow",
            "scope": ["Board UI", "API endpoints"],
            "out_of_scope": [],
            "acceptance_criteria": ["Task can be approved", "Artifacts are attached"],
            "required_teams": ["Engineering", "Operations"],
            "estimated_effort": "3 days",
            "risks": ["Scope drift"],
            "assumptions": [],
            "notes": "Keep the control plane lightweight",
            "created_by_id": "pm-test",
        },
    )
    assert plan_response.status_code == 200
    assert plan_response.json()["data"]["version"] == 1

    submit_response = client.post(
        f"/api/tasks/{task_id}/submit-review",
        headers=actor_headers("ProjectManager", "pm-test"),
        json={"actor_id": "pm-test", "plan_version": 1},
    )
    assert submit_response.status_code == 200
    assert submit_response.json()["data"]["state"] == "InReview"

    approve_response = client.post(
        f"/api/tasks/{task_id}/approve",
        headers=actor_headers("SolutionReviewer", "review-test"),
        json={
            "plan_version": 1,
            "reviewer_id": "review-test",
            "comments": ["Looks ready"],
            "summary": "Approved for delivery",
        },
    )
    assert approve_response.status_code == 200
    assert approve_response.json()["data"]["state"] == "Approved"

    work_item_response = client.post(
        f"/api/tasks/{task_id}/work-items",
        headers=actor_headers("DeliveryManager", "delivery-test"),
        json={
            "plan_version": 1,
            "created_by_id": "delivery-test",
            "items": [
                {
                    "title": "Implement dashboard queries",
                    "description": "Add summary and team endpoints",
                    "assigned_team": "Engineering",
                    "priority": "high",
                    "acceptance_criteria": ["Teams endpoint responds"],
                    "sort_order": 1,
                    "meta": {},
                }
            ],
        },
    )
    assert work_item_response.status_code == 200
    work_item = work_item_response.json()["data"]["items"][0]
    assert work_item["status"] == "Assigned"

    progress_response = client.post(
        f"/api/work-items/{work_item['id']}/progress",
        headers=actor_headers("EngineeringTeam", "eng-test"),
        json={
            "status": "InProgress",
            "summary": "Execution started",
            "progress_percent": 45,
            "block_reason": "",
            "actor_id": "eng-test",
            "actor_role": "EngineeringTeam",
            "meta": {},
        },
    )
    assert progress_response.status_code == 200
    assert progress_response.json()["data"]["status"] == "InProgress"

    artifact_response = client.post(
        f"/api/tasks/{task_id}/artifacts",
        headers=actor_headers("EngineeringTeam", "eng-test"),
        json={
            "work_item_id": work_item["id"],
            "type": "document",
            "name": "Delivery summary",
            "path_or_url": "docs/delivery-summary.md",
            "summary": "Control plane delivery notes",
            "version": 1,
            "created_by_role": "EngineeringTeam",
            "created_by_id": "eng-test",
            "meta": {},
        },
    )
    assert artifact_response.status_code == 200

    bundle_response = client.get(f"/api/tasks/{task_id}/bundle")
    assert bundle_response.status_code == 200
    bundle = bundle_response.json()["data"]
    assert bundle["task"]["state"] == "InExecution"
    assert bundle["plan"]["version"] == 1
    assert len(bundle["reviews"]) == 1
    assert len(bundle["work_items"]) == 1
    assert len(bundle["artifacts"]) == 1
    assert any(event["topic"] == "task.execution_started" for event in bundle["activity"])

    dashboard_response = client.get("/api/dashboard/bundle")
    assert dashboard_response.status_code == 200
    dashboard = dashboard_response.json()["data"]
    assert dashboard["summary"]["tasks_total"] == 1
    assert dashboard["teams"][0]["name"] == "Engineering"

    team_response = client.get("/api/teams/Engineering/work-items")
    assert team_response.status_code == 200
    team_payload = team_response.json()["data"]
    assert team_payload["team_name"] == "Engineering"
    assert team_payload["items"][0]["id"] == work_item["id"]


def test_supervisor_resume_and_invalid_retry_policy(client: TestClient):
    create_response = client.post(
        "/api/tasks",
        headers=actor_headers("IntakeCoordinator", "intake-test"),
        json={
            "title": "Recover blocked task",
            "summary": "Need supervisor intervention coverage",
            "priority": "normal",
            "request_type": "project_request",
            "source": "tests",
            "requester": "qa@example.com",
            "tags": [],
            "meta": {},
        },
    )
    task_id = create_response.json()["data"]["task_id"]

    client.post(
        f"/api/tasks/{task_id}/qualify",
        headers=actor_headers("IntakeCoordinator", "intake-test"),
        json={"owner_id": "intake-test", "summary": "Qualified"},
    )
    client.post(
        f"/api/tasks/{task_id}/plan",
        headers=actor_headers("ProjectManager", "pm-test"),
        json={
            "goal": "Keep a replanning path available",
            "scope": ["Investigation"],
            "out_of_scope": [],
            "acceptance_criteria": ["Resume returns to planning"],
            "required_teams": ["Engineering"],
            "estimated_effort": "1 day",
            "risks": [],
            "assumptions": [],
            "notes": "",
            "created_by_id": "pm-test",
        },
    )
    client.post(
        f"/api/tasks/{task_id}/submit-review",
        headers=actor_headers("ProjectManager", "pm-test"),
        json={"actor_id": "pm-test", "plan_version": 1},
    )
    client.post(
        f"/api/tasks/{task_id}/approve",
        headers=actor_headers("SolutionReviewer", "review-test"),
        json={
            "plan_version": 1,
            "reviewer_id": "review-test",
            "comments": ["Proceed"],
            "summary": "Approved for execution",
        },
    )
    work_item_response = client.post(
        f"/api/tasks/{task_id}/work-items",
        headers=actor_headers("DeliveryManager", "delivery-test"),
        json={
            "plan_version": 1,
            "created_by_id": "delivery-test",
            "items": [
                {
                    "title": "Investigate blocker",
                    "description": "Need execution underway before pausing",
                    "assigned_team": "Engineering",
                    "priority": "normal",
                    "acceptance_criteria": [],
                    "sort_order": 1,
                    "meta": {},
                }
            ],
        },
    )
    work_item_id = work_item_response.json()["data"]["items"][0]["id"]
    client.post(
        f"/api/work-items/{work_item_id}/progress",
        headers=actor_headers("EngineeringTeam", "eng-test"),
        json={
            "status": "InProgress",
            "summary": "Execution started",
            "progress_percent": 10,
            "block_reason": "",
            "actor_id": "eng-test",
            "actor_role": "EngineeringTeam",
            "meta": {},
        },
    )

    pause_response = client.post(
        f"/api/tasks/{task_id}/pause",
        headers=actor_headers("WorkflowSupervisor", "supervisor-test"),
        json={
            "reason": "Waiting on stakeholder answer",
            "actor_id": "supervisor-test",
            "actor_role": "WorkflowSupervisor",
            "meta": {},
        },
    )
    assert pause_response.status_code == 200
    assert pause_response.json()["data"]["state"] == "Blocked"

    resume_response = client.post(
        f"/api/tasks/{task_id}/resume",
        headers=actor_headers("WorkflowSupervisor", "supervisor-test"),
        json={
            "reason": "Clarification arrived",
            "actor_id": "supervisor-test",
            "actor_role": "WorkflowSupervisor",
            "meta": {},
        },
    )
    assert resume_response.status_code == 200
    assert resume_response.json()["data"]["state"] == "InExecution"

    invalid_retry_response = client.post(
        f"/api/tasks/{task_id}/retry",
        headers=actor_headers("WorkflowSupervisor", "supervisor-test"),
        json={
            "reason": "Should not work while active",
            "actor_id": "supervisor-test",
            "actor_role": "WorkflowSupervisor",
            "meta": {},
        },
    )
    assert invalid_retry_response.status_code == 400
    assert "only available while a task is blocked" in invalid_retry_response.json()["detail"]


def test_permission_checks_reject_wrong_role(client: TestClient):
    create_response = client.post(
        "/api/tasks",
        headers=actor_headers("IntakeCoordinator", "intake-test"),
        json={
            "title": "Permission gate",
            "summary": "Ensure action permissions are enforced",
            "priority": "normal",
            "request_type": "project_request",
            "source": "tests",
            "requester": "qa@example.com",
            "tags": [],
            "meta": {},
        },
    )
    task_id = create_response.json()["data"]["task_id"]

    qualify_response = client.post(
        f"/api/tasks/{task_id}/qualify",
        headers=actor_headers("Human", "requester-test"),
        json={"owner_id": "ignored", "summary": "This should fail"},
    )
    assert qualify_response.status_code == 403
    assert "IntakeCoordinator" in qualify_response.json()["detail"]


def test_runtime_status_endpoint(client: TestClient):
    response = client.get("/api/runtime/status")
    assert response.status_code == 200
    payload = response.json()["data"]
    assert "configured_enabled" in payload
    assert "last_result" in payload
    assert "generated_work_items" in payload["last_result"]
    assert "escalated_tasks" in payload["last_result"]


def test_runtime_control_endpoints(client: TestClient, monkeypatch):
    from modern_delivery_os.backend.app.runtime_state import runtime_worker

    current_status = {
        "enabled": True,
        "running": True,
        "poll_interval_seconds": 2.0,
        "blocked_escalation_seconds": 900.0,
        "actor_id": "runtime-orchestrator",
        "last_run_at": None,
        "last_result": {
            "generated_work_items": 0,
            "dispatched_tasks": 0,
            "ready_to_report_tasks": 0,
            "completed_tasks": 0,
            "escalated_tasks": 0,
        },
    }

    async def fake_run_once():
        current_status["last_result"] = {
            "generated_work_items": 2,
            "dispatched_tasks": 1,
            "ready_to_report_tasks": 0,
            "completed_tasks": 0,
            "escalated_tasks": 0,
        }
        return current_status["last_result"]

    def fake_status():
        return current_status

    async def fake_stop():
        current_status["enabled"] = False
        current_status["running"] = False

    def fake_start():
        current_status["enabled"] = True
        current_status["running"] = True

    monkeypatch.setattr(runtime_worker, "run_once", fake_run_once)
    monkeypatch.setattr(runtime_worker, "status", fake_status)
    monkeypatch.setattr(runtime_worker, "stop", fake_stop)
    monkeypatch.setattr(runtime_worker, "start", fake_start)

    run_response = client.post(
        "/api/runtime/run-once",
        headers=actor_headers("WorkflowSupervisor", "supervisor-test"),
        json={},
    )
    assert run_response.status_code == 200
    assert run_response.json()["data"]["last_result"]["generated_work_items"] == 2

    pause_response = client.post(
        "/api/runtime/pause",
        headers=actor_headers("WorkflowSupervisor", "supervisor-test"),
        json={},
    )
    assert pause_response.status_code == 200
    assert pause_response.json()["data"]["enabled"] is False

    resume_response = client.post(
        "/api/runtime/resume",
        headers=actor_headers("WorkflowSupervisor", "supervisor-test"),
        json={},
    )
    assert resume_response.status_code == 200
    assert resume_response.json()["data"]["enabled"] is True


def test_task_runtime_control_endpoints(client: TestClient, monkeypatch):
    from modern_delivery_os.backend.app.runtime_state import runtime_worker

    async def fake_run_for_task(task_id: str, mode: str = "all"):
        return {
            "generated_work_items": 1 if mode == "all" else 0,
            "dispatched_tasks": 1 if mode == "all" else 0,
            "ready_to_report_tasks": 0,
            "completed_tasks": 0,
            "escalated_tasks": 1 if mode == "sweep" else 0,
        }

    monkeypatch.setattr(runtime_worker, "run_for_task", fake_run_for_task)

    run_response = client.post(
        "/api/runtime/tasks/TASK-TEST/run-once",
        headers=actor_headers("WorkflowSupervisor", "supervisor-test"),
        json={},
    )
    assert run_response.status_code == 200
    assert run_response.json()["data"]["task_id"] == "TASK-TEST"
    assert run_response.json()["data"]["last_result"]["generated_work_items"] == 1

    sweep_response = client.post(
        "/api/runtime/tasks/TASK-TEST/sweep",
        headers=actor_headers("WorkflowSupervisor", "supervisor-test"),
        json={},
    )
    assert sweep_response.status_code == 200
    assert sweep_response.json()["data"]["mode"] == "sweep"
    assert sweep_response.json()["data"]["last_result"]["escalated_tasks"] == 1


def test_runtime_worker_auto_dispatch_and_completion(session_factory):
    async def scenario():
        async with session_factory() as session:
            from modern_delivery_os.backend.app.schemas.artifact import ArtifactCreate
            from modern_delivery_os.backend.app.schemas.plan import PlanCreate
            from modern_delivery_os.backend.app.schemas.review import ReviewAction
            from modern_delivery_os.backend.app.schemas.task import TaskCreate
            from modern_delivery_os.backend.app.schemas.work_item import WorkItemProgress
            from modern_delivery_os.backend.app.services.artifact_service import ArtifactService
            from modern_delivery_os.backend.app.services.plan_service import PlanService
            from modern_delivery_os.backend.app.services.review_service import ReviewService
            from modern_delivery_os.backend.app.services.task_service import TaskService
            from modern_delivery_os.backend.app.services.work_item_service import WorkItemService

            task_service = TaskService(session)
            plan_service = PlanService(session)
            review_service = ReviewService(session)
            work_item_service = WorkItemService(session)

            task = await task_service.create_task(
                TaskCreate(
                    title="Runtime generated execution",
                    summary="Approved work should auto-dispatch into runtime work items",
                    priority="high",
                    requester="ops@example.com",
                )
            )
            await task_service.qualify_task(task.id, owner_id="intake-test")
            await plan_service.create_plan(
                task.id,
                PlanCreate(
                    goal="Ship orchestrated execution",
                    scope=["Create runtime work items", "Advance reporting state"],
                    acceptance_criteria=["Work items auto-created", "Task progresses after completion"],
                    required_teams=["Engineering", "Operations"],
                    created_by_id="pm-test",
                ),
            )
            await plan_service.submit_for_review(task.id, actor_id="pm-test", plan_version=1)
            await review_service.approve(
                task.id,
                ReviewAction(
                    plan_version=1,
                    reviewer_id="review-test",
                    comments=["Auto runtime path approved"],
                    summary="Ready for orchestration",
                ),
            )
            await session.commit()

            worker = RuntimeWorker(session_factory=session_factory, poll_interval_seconds=60, actor_id="runtime-test")
            first_run = await worker.run_once()
            assert first_run["generated_work_items"] == 2
            assert first_run["dispatched_tasks"] == 1

            async with session_factory() as verification_session:
                verification_task_service = TaskService(verification_session)
                verification_work_item_service = WorkItemService(verification_session)
                verification_artifact_service = ArtifactService(verification_session)
                current_task = await verification_task_service.get_task(task.id)
                work_items = await verification_work_item_service.list_for_task(task.id)
                assert current_task.state.value == "Dispatched"
                assert len(work_items) == 2

                for item in work_items:
                    await verification_work_item_service.update_progress(
                        item.id,
                        WorkItemProgress(
                            status="Completed",
                            summary="Completed by runtime test",
                            progress_percent=100,
                            actor_id="eng-test",
                            actor_role="EngineeringTeam",
                        ),
                    )

                await verification_artifact_service.create(
                    task.id,
                    ArtifactCreate(
                        work_item_id=work_items[0].id,
                        type="document",
                        name="runtime-summary.md",
                        path_or_url="/tmp/runtime-summary.md",
                        summary="Runtime completion artifact",
                        created_by_role="EngineeringTeam",
                        created_by_id="eng-test",
                    ),
                )
                await verification_session.commit()

            second_run = await worker.run_once()
            assert second_run["ready_to_report_tasks"] == 1

            third_run = await worker.run_once()
            assert second_run["completed_tasks"] + third_run["completed_tasks"] >= 1

            async with session_factory() as final_session:
                final_task = await TaskService(final_session).get_task(task.id)
                assert final_task.state.value == "Done"

    asyncio.run(scenario())


def test_runtime_worker_escalates_stalled_blocked_task(session_factory):
    async def scenario():
        async with session_factory() as session:
            from modern_delivery_os.backend.app.schemas.plan import PlanCreate
            from modern_delivery_os.backend.app.schemas.review import ReviewAction
            from modern_delivery_os.backend.app.schemas.supervisor import InterventionRequest
            from modern_delivery_os.backend.app.schemas.task import TaskCreate
            from modern_delivery_os.backend.app.schemas.work_item import WorkItemCreateBatch, WorkItemCreateItem
            from modern_delivery_os.backend.app.services.plan_service import PlanService
            from modern_delivery_os.backend.app.services.review_service import ReviewService
            from modern_delivery_os.backend.app.services.supervisor_service import SupervisorService
            from modern_delivery_os.backend.app.services.task_service import TaskService
            from modern_delivery_os.backend.app.services.work_item_service import WorkItemService

            task_service = TaskService(session)
            plan_service = PlanService(session)
            review_service = ReviewService(session)
            work_item_service = WorkItemService(session)
            supervisor_service = SupervisorService(session)

            task = await task_service.create_task(
                TaskCreate(
                    title="Escalate stale blocker",
                    summary="Runtime should escalate blocked tasks that sit too long",
                    priority="high",
                    requester="ops@example.com",
                )
            )
            await task_service.qualify_task(task.id, owner_id="intake-test")
            await plan_service.create_plan(
                task.id,
                PlanCreate(
                    goal="Exercise runtime stale blocker escalation",
                    scope=["Create blocked task"],
                    acceptance_criteria=["Runtime escalation logged once"],
                    required_teams=["Engineering"],
                    created_by_id="pm-test",
                ),
            )
            await plan_service.submit_for_review(task.id, actor_id="pm-test", plan_version=1)
            await review_service.approve(
                task.id,
                ReviewAction(
                    plan_version=1,
                    reviewer_id="review-test",
                    comments=["Proceed"],
                    summary="Approved",
                ),
            )
            await work_item_service.create_batch(
                task.id,
                WorkItemCreateBatch(
                    plan_version=1,
                    created_by_id="delivery-test",
                    items=[
                        WorkItemCreateItem(
                            title="Blocked execution",
                            description="Will be paused and escalated",
                            assigned_team="Engineering",
                            priority="high",
                        )
                    ],
                ),
            )
            await supervisor_service.pause(
                task.id,
                InterventionRequest(
                    reason="Waiting for dependency",
                    actor_id="supervisor-test",
                    actor_role="WorkflowSupervisor",
                    meta={},
                ),
            )
            blocked_task = await task_service.get_task(task.id)
            blocked_task.updated_at = blocked_task.updated_at.replace(year=blocked_task.updated_at.year - 1)
            await session.commit()

            worker = RuntimeWorker(
                session_factory=session_factory,
                poll_interval_seconds=60,
                actor_id="runtime-test",
                blocked_escalation_seconds=1,
            )
            first_run = await worker.run_once()
            second_run = await worker.run_once()
            assert first_run["escalated_tasks"] == 1
            assert second_run["escalated_tasks"] == 0

            interventions = await supervisor_service.list_interventions(task.id)
            runtime_escalations = [item for item in interventions if item.action.value == "escalate" and item.meta.get("runtime_auto")]
            assert len(runtime_escalations) == 1

        async with session_factory() as attention_session:
            from modern_delivery_os.backend.app.services.dashboard_service import DashboardService

            attention = await DashboardService(attention_session).build_attention()
            assert any(item["id"] == task.id for item in attention["stalled"])

    asyncio.run(scenario())
