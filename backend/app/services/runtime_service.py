from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
import json
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_settings
from ..models import ActivityEvent, Artifact, InterventionLog, Task, WorkItem
from ..models.enums import InterventionAction, RoleType, TaskState, WorkItemStatus
from ..schemas.supervisor import InterventionRequest
from ..schemas.work_item import WorkItemCreateBatch, WorkItemCreateItem
from .artifact_service import ArtifactService
from .openclaw_service import OpenClawService, OpenClawSettings, OpenClawSyncService
from .plan_service import PlanService
from .supervisor_service import SupervisorService
from .task_service import TaskService
from .work_item_service import WorkItemService


@dataclass
class RuntimeRunSummary:
    generated_work_items: int = 0
    dispatched_tasks: int = 0
    ready_to_report_tasks: int = 0
    completed_tasks: int = 0
    escalated_tasks: int = 0


class RuntimeOrchestrator:
    def __init__(
        self,
        db: AsyncSession,
        actor_id: str = "runtime-orchestrator",
        blocked_escalation_seconds: float = 900.0,
    ):
        self.db = db
        self.actor_id = actor_id
        self.blocked_escalation_seconds = blocked_escalation_seconds
        self.task_service = TaskService(db)
        self.plan_service = PlanService(db)
        self.work_item_service = WorkItemService(db)
        self.artifact_service = ArtifactService(db)
        self.supervisor_service = SupervisorService(db)
        settings = get_settings()
        try:
            openclaw_agent_map = json.loads(settings.openclaw_agent_map_json or "{}")
        except json.JSONDecodeError:
            openclaw_agent_map = {}
        if not isinstance(openclaw_agent_map, dict):
            openclaw_agent_map = {}
        self.openclaw_service = OpenClawService(
            OpenClawSettings(
                enabled=settings.openclaw_enabled,
                command=settings.openclaw_command,
                command_timeout_seconds=settings.openclaw_command_timeout_seconds,
                agents_root=Path(settings.openclaw_agents_root),
                default_dispatch_agent=settings.openclaw_default_dispatch_agent,
                agent_map={str(key): str(value) for key, value in openclaw_agent_map.items()},
            )
        )
        self.openclaw_sync_service = OpenClawSyncService(self.task_service, self.artifact_service, self.openclaw_service)

    async def run_once(self) -> RuntimeRunSummary:
        summary = RuntimeRunSummary()
        await self._dispatch_approved_tasks(summary)
        await self._sync_openclaw_activity()
        await self._escalate_stalled_blocked_tasks(summary)
        await self._advance_ready_to_report(summary)
        await self._complete_ready_tasks(summary)
        return summary

    async def run_for_task(self, task_id: str, mode: str = "all") -> RuntimeRunSummary:
        summary = RuntimeRunSummary()
        task = await self.task_service.get_task(task_id)

        if mode in {"all", "dispatch"}:
            await self._dispatch_task(task, summary)
            task = await self.task_service.get_task(task_id)
            await self._sync_openclaw_activity_for_task(task)

        if mode in {"all", "sweep"}:
            await self._escalate_task_if_stalled(task, summary)
            task = await self.task_service.get_task(task_id)
            await self._sync_openclaw_activity_for_task(task)

        if mode in {"all", "advance"}:
            await self._advance_task_ready_to_report(task, summary)
            task = await self.task_service.get_task(task_id)
            await self._complete_task_if_ready(task, summary)

        return summary

    async def _dispatch_approved_tasks(self, summary: RuntimeRunSummary) -> None:
        stmt = select(Task).where(Task.state == TaskState.Approved).order_by(Task.updated_at.asc())
        result = await self.db.execute(stmt)
        tasks = list(result.scalars().all())

        for task in tasks:
            await self._dispatch_task(task, summary)

    async def _escalate_stalled_blocked_tasks(self, summary: RuntimeRunSummary) -> None:
        if self.blocked_escalation_seconds <= 0:
            return

        cutoff = datetime.now(timezone.utc) - timedelta(seconds=self.blocked_escalation_seconds)
        stmt = (
            select(Task)
            .where(Task.state == TaskState.Blocked)
            .order_by(Task.updated_at.asc())
        )
        result = await self.db.execute(stmt)
        tasks = list(result.scalars().all())

        for task in tasks:
            await self._escalate_task_if_stalled(task, summary)

    async def _advance_ready_to_report(self, summary: RuntimeRunSummary) -> None:
        stmt = (
            select(Task)
            .where(Task.state.in_((TaskState.Dispatched, TaskState.InExecution)))
            .order_by(Task.updated_at.asc())
        )
        result = await self.db.execute(stmt)
        tasks = list(result.scalars().all())

        for task in tasks:
            await self._advance_task_ready_to_report(task, summary)

    async def _complete_ready_tasks(self, summary: RuntimeRunSummary) -> None:
        stmt = select(Task).where(Task.state == TaskState.ReadyToReport).order_by(Task.updated_at.asc())
        result = await self.db.execute(stmt)
        tasks = list(result.scalars().all())

        for task in tasks:
            await self._complete_task_if_ready(task, summary)

    async def _has_runtime_escalation_for_current_block(self, task: Task) -> bool:
        stmt = (
            select(InterventionLog)
            .where(
                InterventionLog.task_id == task.id,
                InterventionLog.action == InterventionAction.escalate,
            )
            .order_by(InterventionLog.created_at.desc())
            .limit(5)
        )
        result = await self.db.execute(stmt)
        logs = list(result.scalars().all())
        expected_block_marker = self._as_utc(task.updated_at).isoformat()
        for item in logs:
            meta = item.meta or {}
            if meta.get("runtime_auto") and meta.get("block_updated_at") == expected_block_marker:
                return True
        return False

    @staticmethod
    def _as_utc(value: datetime) -> datetime:
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)

    def _build_work_items(self, task: Task, plan) -> list[WorkItemCreateItem]:
        teams = [team.strip() for team in (plan.required_teams or []) if team.strip()]
        scope_items = [item.strip() for item in (plan.scope or []) if item and item.strip()]
        acceptance = [item for item in (plan.acceptance_criteria or []) if item]

        if not teams:
            teams = ["Engineering"]
        if not scope_items:
            scope_items = [plan.goal]

        items: list[WorkItemCreateItem] = []
        for index, team in enumerate(teams, start=1):
            scope_item = scope_items[(index - 1) % len(scope_items)]
            title = f"{team}: {scope_item}"
            items.append(
                WorkItemCreateItem(
                    title=title,
                    description=f"Auto-generated from approved plan for task {task.id}. Goal: {plan.goal}",
                    assigned_team=team,
                    priority=task.priority,
                    acceptance_criteria=acceptance[:3],
                    sort_order=index,
                    meta={
                        "auto_generated": True,
                        "generated_by": "runtime_orchestrator",
                    },
                )
            )
        return items

    async def _dispatch_task(self, task: Task, summary: RuntimeRunSummary) -> None:
        if task.state != TaskState.Approved:
            return
        existing = await self.work_item_service.list_for_task(task.id)
        if existing:
            return

        try:
            plan = await self.plan_service.get_latest_plan(task.id)
        except ValueError:
            return

        items = self._build_work_items(task, plan)
        if not items:
            return

        await self.work_item_service.create_batch(
            task.id,
            WorkItemCreateBatch(
                plan_version=plan.version,
                created_by_id=self.actor_id,
                items=items,
            ),
        )
        summary.generated_work_items += len(items)
        summary.dispatched_tasks += 1
        await self._dispatch_openclaw_agent(task, plan.goal, [item.assigned_team for item in items], [item.title for item in items])

    async def _escalate_task_if_stalled(self, task: Task, summary: RuntimeRunSummary) -> None:
        if self.blocked_escalation_seconds <= 0 or task.state != TaskState.Blocked:
            return
        cutoff = datetime.now(timezone.utc) - timedelta(seconds=self.blocked_escalation_seconds)
        task_updated_at = self._as_utc(task.updated_at)
        if task_updated_at > cutoff:
            return
        if await self._has_runtime_escalation_for_current_block(task):
            return

        await self.supervisor_service.escalate(
            task.id,
            InterventionRequest(
                reason="Runtime escalation: task has remained blocked beyond the configured threshold.",
                actor_id=self.actor_id,
                actor_role=RoleType.WorkflowSupervisor.value,
                meta={
                    "runtime_auto": True,
                    "block_updated_at": task_updated_at.isoformat(),
                    "blocked_age_seconds": int(
                        max(
                            0,
                            (datetime.now(timezone.utc) - task_updated_at).total_seconds(),
                        )
                    ),
                },
            ),
        )
        summary.escalated_tasks += 1

    async def _dispatch_openclaw_agent(
        self,
        task: Task,
        goal: str | None,
        teams: list[str],
        work_item_titles: list[str],
    ) -> None:
        if not self.openclaw_service.settings.enabled:
            return

        agent_id = self.openclaw_service.resolve_agent_id(task, teams)
        message = self.openclaw_service.build_dispatch_message(task, goal, teams, work_item_titles)
        result = self.openclaw_service.dispatch_task(task, agent_id, message)
        task.meta = {
            **(task.meta or {}),
            "openclaw_agent_id": agent_id,
            "openclaw_dispatch": {
                "ok": result["ok"],
                "agent_id": agent_id,
                "returncode": result.get("returncode"),
                "output": result.get("output", ""),
                "dispatched_at": datetime.now(timezone.utc).isoformat(),
            },
        }
        task.updated_at = datetime.now(timezone.utc)
        await self.task_service._add_event(
            task_id=task.id,
            topic="openclaw.dispatched" if result["ok"] else "openclaw.dispatch_failed",
            actor_role=RoleType.System,
            actor_id=self.actor_id,
            payload={
                "agent_id": agent_id,
                "ok": result["ok"],
                "output": result.get("output", ""),
            },
            entity_type="openclaw_dispatch",
            entity_id=agent_id,
        )

    async def _sync_openclaw_activity(self) -> None:
        if not self.openclaw_service.settings.enabled:
            return
        stmt = (
            select(Task)
            .where(Task.archived.is_(False))
            .order_by(Task.updated_at.desc())
            .limit(20)
        )
        result = await self.db.execute(stmt)
        tasks = list(result.scalars().all())
        for task in tasks:
            await self._sync_openclaw_activity_for_task(task)

    async def _sync_openclaw_activity_for_task(self, task: Task) -> None:
        if not self.openclaw_service.settings.enabled:
            return
        agent_id = str((task.meta or {}).get("openclaw_agent_id", "")).strip()
        if not agent_id:
            return

        events_stmt = select(ActivityEvent).where(ActivityEvent.task_id == task.id).order_by(ActivityEvent.created_at.asc())
        artifacts_stmt = select(Artifact).where(Artifact.task_id == task.id).order_by(Artifact.created_at.asc())
        events_result = await self.db.execute(events_stmt)
        artifacts_result = await self.db.execute(artifacts_stmt)
        events = list(events_result.scalars().all())
        artifacts = list(artifacts_result.scalars().all())
        imported_count = await self.openclaw_sync_service.ingest_entries(task, agent_id, events, artifacts)
        if imported_count:
            task.meta = {
                **(task.meta or {}),
                "openclaw_last_sync": {
                    "agent_id": agent_id,
                    "imported_count": imported_count,
                    "synced_at": datetime.now(timezone.utc).isoformat(),
                },
            }
            task.updated_at = datetime.now(timezone.utc)

    async def _advance_task_ready_to_report(self, task: Task, summary: RuntimeRunSummary) -> None:
        if task.state not in {TaskState.Dispatched, TaskState.InExecution}:
            return
        work_items = await self.work_item_service.list_for_task(task.id)
        if not work_items:
            return
        if any(item.status != WorkItemStatus.Completed for item in work_items):
            return

        task.state = TaskState.ReadyToReport
        task.owner_role = RoleType.ReportingSpecialist
        task.updated_at = datetime.now(timezone.utc)
        await self.task_service._add_event(
            task_id=task.id,
            topic="task.ready_to_report",
            actor_role=RoleType.System,
            actor_id=self.actor_id,
            payload={"work_item_count": len(work_items)},
        )
        summary.ready_to_report_tasks += 1

    async def _complete_task_if_ready(self, task: Task, summary: RuntimeRunSummary) -> None:
        if task.state != TaskState.ReadyToReport:
            return
        artifact_stmt = (
            select(Artifact)
            .where(Artifact.task_id == task.id)
            .order_by(Artifact.created_at.asc())
            .limit(1)
        )
        artifact_result = await self.db.execute(artifact_stmt)
        artifact = artifact_result.scalar_one_or_none()
        if artifact is None:
            return

        task.state = TaskState.Done
        task.owner_role = RoleType.System
        task.updated_at = datetime.now(timezone.utc)
        await self.task_service._add_event(
            task_id=task.id,
            topic="task.done",
            actor_role=RoleType.System,
            actor_id=self.actor_id,
            payload={"artifact_id": artifact.id},
        )
        summary.completed_tasks += 1
