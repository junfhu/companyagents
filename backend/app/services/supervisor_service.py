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
        await self._log_and_event(task.id, InterventionAction.pause, old_state, task.state, body)
        return task

    async def resume(self, task_id: str, body: InterventionRequest):
        task = await self.task_service.get_task(task_id)
        if task.state != TaskState.Blocked:
            raise ValueError("only blocked tasks can resume")
        target = TaskState.InExecution
        old_state = task.state
        task.state = target
        task.owner_role = STATE_OWNER_ROLE[target]
        task.blocked_reason = ""
        task.updated_at = datetime.now(timezone.utc)
        await self._log_and_event(task.id, InterventionAction.resume, old_state, task.state, body)
        return task

    async def retry(self, task_id: str, body: InterventionRequest):
        task = await self.task_service.get_task(task_id)
        await self._log_and_event(task.id, InterventionAction.retry, task.state, task.state, body)
        return task

    async def escalate(self, task_id: str, body: InterventionRequest):
        task = await self.task_service.get_task(task_id)
        await self._log_and_event(task.id, InterventionAction.escalate, task.state, task.state, body)
        return task

    async def rollback(self, task_id: str, body: InterventionRequest):
        task = await self.task_service.get_task(task_id)
        old_state = task.state
        if task.current_plan_version > 0:
            target = TaskState.Planned
        else:
            target = TaskState.Qualified
        task.state = target
        task.owner_role = STATE_OWNER_ROLE[target]
        task.blocked_reason = ""
        task.updated_at = datetime.now(timezone.utc)
        await self._log_and_event(task.id, InterventionAction.rollback, old_state, task.state, body)
        return task

    async def replan(self, task_id: str, body: InterventionRequest):
        task = await self.task_service.get_task(task_id)
        old_state = task.state
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
    ) -> None:
        role = RoleType(body.actor_role)
        log = InterventionLog(
            id=f"INT-{uuid4().hex[:16].upper()}",
            task_id=task_id,
            action=action,
            reason=body.reason,
            from_state=from_state.value,
            to_state=to_state.value,
            triggered_by_role=role,
            triggered_by_id=body.actor_id,
            meta=body.meta,
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
                "meta": body.meta,
            },
        )

