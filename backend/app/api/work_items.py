from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_db
from ..models.enums import RoleType
from ..security import ActorContext, require_actor
from ..schemas.work_item import WorkItemCreateBatch, WorkItemOut, WorkItemProgress
from ..services.work_item_service import WorkItemService


router = APIRouter(prefix="/api", tags=["work-items"])


def to_work_item_out(work_item) -> WorkItemOut:
    return WorkItemOut(
        id=work_item.id,
        task_id=work_item.task_id,
        plan_version=work_item.plan_version,
        title=work_item.title,
        description=work_item.description,
        assigned_team=work_item.assigned_team,
        owner_role=work_item.owner_role.value,
        status=work_item.status.value,
        priority=work_item.priority,
        acceptance_criteria=work_item.acceptance_criteria or [],
        block_reason=work_item.block_reason,
        sort_order=work_item.sort_order,
        meta=work_item.meta or {},
        created_at=work_item.created_at.isoformat(),
        updated_at=work_item.updated_at.isoformat(),
        completed_at=work_item.completed_at.isoformat() if work_item.completed_at else None,
    )


@router.get("/tasks/{task_id}/work-items", response_model=dict)
async def list_work_items(task_id: str, db: AsyncSession = Depends(get_db)):
    svc = WorkItemService(db)
    items = await svc.list_for_task(task_id)
    return {"ok": True, "data": {"items": [to_work_item_out(item).model_dump() for item in items]}}


@router.post("/tasks/{task_id}/work-items", response_model=dict)
async def create_work_items(
    task_id: str,
    body: WorkItemCreateBatch,
    db: AsyncSession = Depends(get_db),
    actor: ActorContext = Depends(require_actor(RoleType.DeliveryManager, RoleType.System)),
):
    svc = WorkItemService(db)
    try:
        items = await svc.create_batch(task_id, body.model_copy(update={"created_by_id": actor.actor_id}))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {"ok": True, "data": {"count": len(items), "items": [to_work_item_out(item).model_dump() for item in items]}}


@router.post("/work-items/{work_item_id}/progress", response_model=dict)
async def update_work_item_progress(
    work_item_id: str,
    body: WorkItemProgress,
    db: AsyncSession = Depends(get_db),
    actor: ActorContext = Depends(
        require_actor(
            RoleType.DeliveryManager,
            RoleType.EngineeringTeam,
            RoleType.DataTeam,
            RoleType.ContentTeam,
            RoleType.OperationsTeam,
            RoleType.SecurityTeam,
            RoleType.System,
        )
    ),
):
    svc = WorkItemService(db)
    try:
        item = await svc.update_progress(
            work_item_id,
            body.model_copy(update={"actor_id": actor.actor_id, "actor_role": actor.role.value}),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {"ok": True, "data": to_work_item_out(item).model_dump()}
