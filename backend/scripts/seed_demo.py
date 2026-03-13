import argparse
import asyncio

from companyagents.backend.app.db import async_session, init_db
from companyagents.backend.app.schemas.artifact import ArtifactCreate
from companyagents.backend.app.schemas.plan import PlanCreate
from companyagents.backend.app.schemas.review import ReviewAction
from companyagents.backend.app.schemas.supervisor import InterventionRequest
from companyagents.backend.app.schemas.task import TaskCreate, TaskQualify
from companyagents.backend.app.schemas.work_item import (
    WorkItemCreateBatch,
    WorkItemCreateItem,
    WorkItemProgress,
)
from companyagents.backend.app.services.artifact_service import ArtifactService
from companyagents.backend.app.services.plan_service import PlanService
from companyagents.backend.app.services.review_service import ReviewService
from companyagents.backend.app.services.supervisor_service import SupervisorService
from companyagents.backend.app.services.task_service import TaskService
from companyagents.backend.app.services.work_item_service import WorkItemService


async def seed_task_in_review() -> str:
    async with async_session() as session:
        task_service = TaskService(session)
        plan_service = PlanService(session)

        task = await task_service.create_task(
            TaskCreate(
                title="Audit the customer access escalation flow",
                summary="Map the current escalation workflow and identify review gaps.",
                priority="high",
                requester="demo-requester",
                tags=["audit", "review"],
            )
        )
        await task_service.qualify_task(task.id, TaskQualify(owner_id="intake-demo").owner_id)
        await plan_service.create_plan(
            task.id,
            PlanCreate(
                goal="Prepare a reviewable audit plan for escalation handling.",
                scope=["collect current flow", "identify review points", "outline gaps"],
                acceptance_criteria=[
                    "document current workflow",
                    "highlight weak review points",
                    "list next actions",
                ],
                required_teams=["Security", "Content"],
                risks=["missing incident notes from older requests"],
                created_by_id="pm-demo",
            ),
        )
        await plan_service.submit_for_review(task.id, actor_id="pm-demo", plan_version=1)
        await session.commit()
        return task.id


async def seed_task_in_execution() -> str:
    async with async_session() as session:
        task_service = TaskService(session)
        plan_service = PlanService(session)
        review_service = ReviewService(session)
        work_item_service = WorkItemService(session)
        artifact_service = ArtifactService(session)

        task = await task_service.create_task(
            TaskCreate(
                title="Design a rollout checklist for the new delivery control plane",
                summary="Produce an implementation checklist and supporting artifacts.",
                priority="critical",
                requester="ops-lead",
                tags=["rollout", "operations"],
            )
        )
        await task_service.qualify_task(task.id, owner_id="intake-demo")
        await plan_service.create_plan(
            task.id,
            PlanCreate(
                goal="Build a rollout-ready checklist for the control plane launch.",
                scope=["backend readiness", "frontend readiness", "operational checkpoints"],
                acceptance_criteria=[
                    "backend launch checks defined",
                    "frontend readiness criteria listed",
                    "owner handoffs captured",
                ],
                required_teams=["Engineering", "Operations", "Content"],
                estimated_effort="2d",
                risks=["last-minute environment drift"],
                created_by_id="pm-demo",
            ),
        )
        await plan_service.submit_for_review(task.id, actor_id="pm-demo", plan_version=1)
        await review_service.approve(
            task.id,
            ReviewAction(
                plan_version=1,
                reviewer_id="review-demo",
                comments=["Looks ready for execution."],
                summary="Approved for rollout preparation.",
            ),
        )
        work_items = await work_item_service.create_batch(
            task.id,
            WorkItemCreateBatch(
                plan_version=1,
                created_by_id="delivery-demo",
                items=[
                    WorkItemCreateItem(
                        title="Draft backend readiness checklist",
                        description="Capture API, migration, and health-check steps.",
                        assigned_team="Engineering",
                        priority="high",
                        acceptance_criteria=["list core checks", "include rollback notes"],
                    ),
                    WorkItemCreateItem(
                        title="Prepare launch runbook summary",
                        description="Turn rollout details into an operator-facing runbook.",
                        assigned_team="Operations",
                        priority="high",
                        acceptance_criteria=["operator-ready summary", "handoff owners included"],
                    ),
                ],
            ),
        )
        await work_item_service.update_progress(
            work_items[0].id,
            WorkItemProgress(
                status="InProgress",
                summary="Engineering is drafting launch validation steps.",
                progress_percent=45,
                actor_id="eng-demo",
                actor_role="EngineeringTeam",
            ),
        )
        await artifact_service.create(
            task.id,
            ArtifactCreate(
                work_item_id=work_items[0].id,
                type="document",
                name="backend-rollout-checklist.md",
                path_or_url="/artifacts/demo/backend-rollout-checklist.md",
                summary="Working draft of backend rollout checks.",
                created_by_role="EngineeringTeam",
                created_by_id="eng-demo",
            ),
        )
        await session.commit()
        return task.id


async def seed_task_blocked() -> str:
    async with async_session() as session:
        task_service = TaskService(session)
        plan_service = PlanService(session)
        review_service = ReviewService(session)
        work_item_service = WorkItemService(session)
        supervisor_service = SupervisorService(session)

        task = await task_service.create_task(
            TaskCreate(
                title="Prepare incident response playbook refresh",
                summary="Refresh the response flow and collect escalation ownership.",
                priority="high",
                requester="security-lead",
                tags=["incident", "playbook"],
            )
        )
        await task_service.qualify_task(task.id, owner_id="intake-demo")
        await plan_service.create_plan(
            task.id,
            PlanCreate(
                goal="Refresh the incident response playbook with current ownership.",
                scope=["ownership map", "handoff rules", "escalation path"],
                acceptance_criteria=[
                    "ownership table updated",
                    "handoff sequence documented",
                    "escalation rules validated",
                ],
                required_teams=["Security", "Operations"],
                estimated_effort="1d",
                risks=["missing on-call ownership updates"],
                created_by_id="pm-demo",
            ),
        )
        await plan_service.submit_for_review(task.id, actor_id="pm-demo", plan_version=1)
        await review_service.approve(
            task.id,
            ReviewAction(
                plan_version=1,
                reviewer_id="review-demo",
                comments=["Proceed, but monitor for ownership gaps."],
                summary="Approved with monitoring note.",
            ),
        )
        work_items = await work_item_service.create_batch(
            task.id,
            WorkItemCreateBatch(
                plan_version=1,
                created_by_id="delivery-demo",
                items=[
                    WorkItemCreateItem(
                        title="Collect current on-call ownership",
                        description="Pull the current roster and escalation contacts.",
                        assigned_team="Security",
                        priority="high",
                        acceptance_criteria=["ownership list current", "gaps identified"],
                    )
                ],
            ),
        )
        await work_item_service.update_progress(
            work_items[0].id,
            WorkItemProgress(
                status="Blocked",
                summary="Ownership source is stale.",
                progress_percent=20,
                block_reason="Current on-call roster has not been updated.",
                actor_id="security-demo",
                actor_role="SecurityTeam",
            ),
        )
        await supervisor_service.pause(
            task.id,
            InterventionRequest(
                actor_id="supervisor-demo",
                actor_role="WorkflowSupervisor",
                reason="Waiting for roster confirmation from operations.",
            ),
        )
        await session.commit()
        return task.id


async def seed_task_changes_requested() -> str:
    async with async_session() as session:
        task_service = TaskService(session)
        plan_service = PlanService(session)
        review_service = ReviewService(session)

        task = await task_service.create_task(
            TaskCreate(
                title="Review notification strategy for task escalation alerts",
                summary="Check whether alert routing and escalation thresholds are clear.",
                priority="normal",
                requester="product-ops",
                tags=["alerts", "review"],
            )
        )
        await task_service.qualify_task(task.id, owner_id="intake-demo")
        await plan_service.create_plan(
            task.id,
            PlanCreate(
                goal="Review alert escalation strategy and identify missing controls.",
                scope=["routing rules", "timing thresholds"],
                acceptance_criteria=["routing documented", "threshold gaps identified"],
                required_teams=["Content", "Operations"],
                created_by_id="pm-demo",
            ),
        )
        await plan_service.submit_for_review(task.id, actor_id="pm-demo", plan_version=1)
        await review_service.request_changes(
            task.id,
            ReviewAction(
                plan_version=1,
                reviewer_id="review-demo",
                comments=[
                    "Add examples for after-hours routing.",
                    "Clarify threshold ownership.",
                ],
                summary="Needs clearer threshold ownership before execution.",
            ),
        )
        await session.commit()
        return task.id


async def main() -> None:
    await init_db()
    task_ids = []
    task_ids.append(await seed_task_in_review())
    task_ids.append(await seed_task_in_execution())
    task_ids.append(await seed_task_blocked())
    task_ids.append(await seed_task_changes_requested())
    print("Seeded demo tasks:")
    for task_id in task_ids:
        print(f"- {task_id}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed demo data for the delivery OS scaffold.")
    parser.parse_args()
    asyncio.run(main())
