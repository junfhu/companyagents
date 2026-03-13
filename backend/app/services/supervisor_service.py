from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import InterventionLog
from ..models.enums import InterventionAction, RoleType, TaskState
from ..schemas.supervisor import InterventionRequest
from .task_service import TaskService
from .workflow import STATE_OWNER_ROLE, ensure_transition


class SupervisorService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.task_service = TaskService(db)

    async def list_interventions(self, task_id: str) -> list[InterventionLog]:
        await self.task_service.get_task(task_id)
        stmt = (
            select(InterventionLog)
            .where(InterventionLog.task_id == task_id)
            .order_by(InterventionLog.created_at.asc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def pause(self, task_id: str, body: InterventionRequest):
        task = await self.task_service.get_task(task_id)
        ensure_transition(task.state, TaskState.Blocked)
        old_state = task.state
        task.state = TaskState.Blocked
        task.owner_role = STATE_OWNER_ROLE[TaskState.Blocked]
        task.blocked_reason = body.reason or "paused by supervisor"
        task.updated_at = datetime.now(timezone.utc)
        resume_target = self._resume_target_for(old_state)
        await self._log_and_event(
            task.id,
            InterventionAction.pause,
            old_state,
            task.state,
            body,
            extra_meta={"resume_target": resume_target.value},
        )
        return task

    async def resume(self, task_id: str, body: InterventionRequest):
        task = await self.task_service.get_task(task_id)
        if task.state != TaskState.Blocked:
            raise ValueError("only blocked tasks can resume")
        target = await self._resolve_resume_target(task_id)
        ensure_transition(task.state, target)
        old_state = task.state
        task.state = target
        task.owner_role = STATE_OWNER_ROLE[target]
        task.blocked_reason = ""
        task.updated_at = datetime.now(timezone.utc)
        await self._log_and_event(
            task.id,
            InterventionAction.resume,
            old_state,
            task.state,
            body,
            extra_meta={"resume_target": target.value},
        )
        return task

    async def retry(self, task_id: str, body: InterventionRequest):
        task = await self.task_service.get_task(task_id)
        if task.state != TaskState.Blocked:
            raise ValueError("retry is only available while a task is blocked")
        await self._log_and_event(task.id, InterventionAction.retry, task.state, task.state, body)
        return task

    async def escalate(self, task_id: str, body: InterventionRequest):
        task = await self.task_service.get_task(task_id)
        if task.state in {TaskState.Cancelled, TaskState.Archived}:
            raise ValueError("cannot escalate a cancelled or archived task")
        await self._log_and_event(task.id, InterventionAction.escalate, task.state, task.state, body)
        return task

    async def rollback(self, task_id: str, body: InterventionRequest):
        task = await self.task_service.get_task(task_id)
        old_state = task.state
        if task.current_plan_version > 0:
            target = TaskState.Planned
        else:
            target = TaskState.Qualified
        ensure_transition(old_state, target)
        task.state = target
        task.owner_role = STATE_OWNER_ROLE[target]
        task.blocked_reason = ""
        task.updated_at = datetime.now(timezone.utc)
        await self._log_and_event(task.id, InterventionAction.rollback, old_state, task.state, body)
        return task

    async def replan(self, task_id: str, body: InterventionRequest):
        task = await self.task_service.get_task(task_id)
        old_state = task.state
        ensure_transition(old_state, TaskState.Planned)
        task.state = TaskState.Planned
        task.owner_role = STATE_OWNER_ROLE[TaskState.Planned]
        task.updated_at = datetime.now(timezone.utc)
        await self._log_and_event(task.id, InterventionAction.replan, old_state, task.state, body)
        return task

    async def _log_and_event(
        self,
        task_id: str,
        action: InterventionAction,
        from_state: TaskState,
        to_state: TaskState,
        body: InterventionRequest,
        extra_meta: dict | None = None,
    ) -> None:
        role = RoleType(body.actor_role)
        meta = dict(body.meta or {})
        if extra_meta:
            meta.update(extra_meta)
        log = InterventionLog(
            id=f"INT-{uuid4().hex[:16].upper()}",
            task_id=task_id,
            action=action,
            reason=body.reason,
            from_state=from_state.value,
            to_state=to_state.value,
            triggered_by_role=role,
            triggered_by_id=body.actor_id,
            meta=meta,
        )
        self.db.add(log)
        await self.task_service._add_event(
            task_id=task_id,
            topic=f"task.{action.value}",
            actor_role=role,
            actor_id=body.actor_id,
            payload={
                "reason": body.reason,
                "from_state": from_state.value,
                "to_state": to_state.value,
                "meta": meta,
            },
        )

    @staticmethod
    def _resume_target_for(previous_state: TaskState) -> TaskState:
        if previous_state in {TaskState.Planned, TaskState.Rejected}:
            return TaskState.Planned
        return TaskState.InExecution

    async def _resolve_resume_target(self, task_id: str) -> TaskState:
        stmt = (
            select(InterventionLog)
            .where(
                InterventionLog.task_id == task_id,
                InterventionLog.action == InterventionAction.pause,
            )
            .order_by(InterventionLog.created_at.desc())
            .limit(1)
        )
        result = await self.db.execute(stmt)
        pause_log = result.scalar_one_or_none()
        if pause_log is None:
            return TaskState.InExecution

        resume_target = (pause_log.meta or {}).get("resume_target")
        if resume_target in {TaskState.Planned.value, TaskState.InExecution.value}:
            return TaskState(resume_target)
        return self._resume_target_for(TaskState(pause_log.from_state))
