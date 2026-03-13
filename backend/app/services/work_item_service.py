from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import WorkItem
from ..models.enums import RoleType, TaskState, WorkItemStatus
from ..schemas.work_item import WorkItemCreateBatch, WorkItemProgress
from .task_service import TaskService


TEAM_ROLE_MAP: dict[str, RoleType] = {
    "Engineering": RoleType.EngineeringTeam,
    "Data": RoleType.DataTeam,
    "Content": RoleType.ContentTeam,
    "Operations": RoleType.OperationsTeam,
    "Security": RoleType.SecurityTeam,
}


class WorkItemService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.task_service = TaskService(db)

    async def list_for_task(self, task_id: str) -> list[WorkItem]:
        stmt = (
            select(WorkItem)
            .where(WorkItem.task_id == task_id)
            .order_by(WorkItem.sort_order.asc(), WorkItem.created_at.asc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def create_batch(self, task_id: str, body: WorkItemCreateBatch) -> list[WorkItem]:
        task = await self.task_service.get_task(task_id)
        if task.state not in {TaskState.Approved, TaskState.Dispatched, TaskState.InExecution}:
            raise ValueError("task must be Approved, Dispatched, or InExecution before creating work items")
        if body.plan_version != task.current_plan_version:
            raise ValueError("plan version does not match current task plan")

        created: list[WorkItem] = []
        for index, item in enumerate(body.items, start=1):
            owner_role = TEAM_ROLE_MAP.get(item.assigned_team or "", RoleType.DeliveryManager)
            work_item = WorkItem(
                id=f"WI-{uuid4().hex[:16].upper()}",
                task_id=task_id,
                plan_version=body.plan_version,
                title=item.title,
                description=item.description,
                assigned_team=item.assigned_team,
                owner_role=owner_role,
                status=WorkItemStatus.Assigned if item.assigned_team else WorkItemStatus.Open,
                priority=item.priority,
                acceptance_criteria=item.acceptance_criteria,
                sort_order=item.sort_order if item.sort_order else index,
                meta=item.meta,
            )
            self.db.add(work_item)
            created.append(work_item)
            await self.task_service._add_event(
                task_id=task_id,
                topic="work_item.created",
                actor_role=RoleType.DeliveryManager,
                actor_id=body.created_by_id,
                payload={"work_item_id": work_item.id, "assigned_team": work_item.assigned_team},
                entity_type="work_item",
                entity_id=work_item.id,
            )

        await self.db.flush()

        if task.state == TaskState.Approved:
            task.state = TaskState.Dispatched
            task.owner_role = RoleType.DeliveryManager
            task.updated_at = datetime.now(timezone.utc)
            await self.task_service._add_event(
                task_id=task.id,
                topic="task.dispatched",
                actor_role=RoleType.DeliveryManager,
                actor_id=body.created_by_id,
                payload={"work_item_count": len(created)},
            )
        return created

    async def update_progress(self, work_item_id: str, body: WorkItemProgress) -> WorkItem:
        work_item = await self.get_work_item(work_item_id)
        try:
            new_status = WorkItemStatus(body.status)
        except ValueError as exc:
            raise ValueError(f"invalid work item status: {body.status}") from exc

        work_item.status = new_status
        work_item.block_reason = body.block_reason
        work_item.updated_at = datetime.now(timezone.utc)
        if new_status == WorkItemStatus.Completed:
            work_item.completed_at = datetime.now(timezone.utc)

        await self.task_service._add_event(
            task_id=work_item.task_id,
            topic="work_item.progress.updated",
            actor_role=RoleType(body.actor_role),
            actor_id=body.actor_id,
            payload={
                "work_item_id": work_item.id,
                "status": new_status.value,
                "summary": body.summary,
                "progress_percent": body.progress_percent,
                "block_reason": body.block_reason,
                "meta": body.meta,
            },
            entity_type="work_item",
            entity_id=work_item.id,
        )

        task = await self.task_service.get_task(work_item.task_id)
        if task.state == TaskState.Dispatched and new_status in {WorkItemStatus.Assigned, WorkItemStatus.InProgress}:
            task.state = TaskState.InExecution
            task.owner_role = RoleType.DeliveryManager
            task.updated_at = datetime.now(timezone.utc)
            await self.task_service._add_event(
                task_id=task.id,
                topic="task.execution_started",
                actor_role=RoleType.DeliveryManager,
                actor_id="system",
                payload={"source_work_item_id": work_item.id},
            )
        return work_item

    async def get_work_item(self, work_item_id: str) -> WorkItem:
        work_item = await self.db.get(WorkItem, work_item_id)
        if work_item is None:
            raise ValueError("work item not found")
        return work_item
