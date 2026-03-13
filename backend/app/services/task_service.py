from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import ActivityEvent, Task
from ..models.enums import RoleType, TaskState
from ..realtime import ws_manager
from ..schemas.task import TaskCreate
from .workflow import STATE_OWNER_ROLE, ensure_transition


class TaskService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_task(self, body: TaskCreate) -> Task:
        task_id = f"TASK-{uuid4().hex[:12].upper()}"
        task = Task(
            id=task_id,
            title=body.title.strip(),
            summary=body.summary.strip(),
            priority=body.priority,
            request_type=body.request_type,
            source=body.source,
            requester=body.requester,
            tags=body.tags,
            meta=body.meta,
            state=TaskState.New,
            owner_role=RoleType.IntakeCoordinator,
        )
        self.db.add(task)
        await self.db.flush()
        await self._add_event(
            task_id=task.id,
            topic="task.created",
            actor_role=RoleType.System,
            actor_id="api",
            payload={"state": task.state.value, "title": task.title},
        )
        return task

    async def list_tasks(self, state: str | None = None) -> list[Task]:
        stmt = select(Task).order_by(Task.updated_at.desc())
        if state:
            stmt = stmt.where(Task.state == TaskState(state))
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_task(self, task_id: str) -> Task:
        task = await self.db.get(Task, task_id)
        if task is None:
            raise ValueError("task not found")
        return task

    async def qualify_task(self, task_id: str, owner_id: str, summary: str | None = None) -> Task:
        task = await self.get_task(task_id)
        ensure_transition(task.state, TaskState.Qualified)
        task.state = TaskState.Qualified
        task.owner_role = STATE_OWNER_ROLE[TaskState.Qualified]
        if summary:
            task.summary = summary.strip()
        task.updated_at = datetime.now(timezone.utc)
        await self._add_event(
            task_id=task.id,
            topic="task.qualified",
            actor_role=RoleType.IntakeCoordinator,
            actor_id=owner_id,
            payload={"state": task.state.value},
        )
        return task

    async def mark_planned(self, task: Task, actor_id: str) -> None:
        if task.state == TaskState.Qualified:
            ensure_transition(task.state, TaskState.Planned)
            task.state = TaskState.Planned
            task.owner_role = STATE_OWNER_ROLE[TaskState.Planned]
            task.updated_at = datetime.now(timezone.utc)
            await self._add_event(
                task_id=task.id,
                topic="task.planned",
                actor_role=RoleType.ProjectManager,
                actor_id=actor_id,
                payload={"state": task.state.value, "plan_version": task.current_plan_version},
            )

    async def transition_to_review(self, task: Task, actor_id: str, plan_version: int) -> Task:
        ensure_transition(task.state, TaskState.InReview)
        task.state = TaskState.InReview
        task.owner_role = STATE_OWNER_ROLE[TaskState.InReview]
        task.updated_at = datetime.now(timezone.utc)
        await self._add_event(
            task_id=task.id,
            topic="task.review.requested",
            actor_role=RoleType.ProjectManager,
            actor_id=actor_id,
            payload={"plan_version": plan_version},
        )
        return task

    async def _add_event(
        self,
        task_id: str,
        topic: str,
        actor_role: RoleType,
        actor_id: str,
        payload: dict,
        entity_type: str = "task",
        entity_id: str | None = None,
    ) -> None:
        event = ActivityEvent(
            id=f"EV-{uuid4().hex[:20].upper()}",
            task_id=task_id,
            topic=topic,
            entity_type=entity_type,
            entity_id=entity_id or task_id,
            actor_role=actor_role,
            actor_id=actor_id,
            payload=payload,
        )
        self.db.add(event)
        message = {
            "type": "event",
            "channel": f"task:{task_id}",
            "event": {
                "id": event.id,
                "task_id": task_id,
                "topic": topic,
                "entity_type": entity_type,
                "entity_id": entity_id or task_id,
                "actor_role": actor_role.value,
                "actor_id": actor_id,
                "payload": payload,
            },
        }
        await ws_manager.publish("global", message)
        await ws_manager.publish(f"task:{task_id}", message)
