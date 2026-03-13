from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_db
from ..models.enums import RoleType
from ..security import ActorContext, require_actor
from ..schemas.task import TaskCreate, TaskOut, TaskQualify
from ..services.task_service import TaskService


router = APIRouter(prefix="/api/tasks", tags=["tasks"])


def to_task_out(task) -> TaskOut:
    return TaskOut(
        id=task.id,
        title=task.title,
        summary=task.summary,
        state=task.state.value,
        priority=task.priority,
        request_type=task.request_type,
        source=task.source,
        requester=task.requester,
        owner_role=task.owner_role.value,
        owner_team=task.owner_team,
        current_plan_version=task.current_plan_version,
        review_round=task.review_round,
        blocked_reason=task.blocked_reason,
        acceptance_summary=task.acceptance_summary,
        tags=task.tags or [],
        meta=task.meta or {},
        archived=task.archived,
        archived_at=task.archived_at.isoformat() if task.archived_at else None,
        created_at=task.created_at.isoformat(),
        updated_at=task.updated_at.isoformat(),
    )


@router.post("", response_model=dict)
async def create_task(
    body: TaskCreate,
    db: AsyncSession = Depends(get_db),
    actor: ActorContext = Depends(require_actor(RoleType.Human, RoleType.IntakeCoordinator, RoleType.System)),
):
    svc = TaskService(db)
    task = await svc.create_task(body)
    return {"ok": True, "data": {"task_id": task.id, "state": task.state.value}}


@router.get("", response_model=dict)
async def list_tasks(state: str | None = Query(default=None), db: AsyncSession = Depends(get_db)):
    svc = TaskService(db)
    try:
        tasks = await svc.list_tasks(state=state)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {"ok": True, "data": {"items": [to_task_out(task).model_dump() for task in tasks]}}


@router.get("/{task_id}", response_model=dict)
async def get_task(task_id: str, db: AsyncSession = Depends(get_db)):
    svc = TaskService(db)
    try:
        task = await svc.get_task(task_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="task not found")
    return {"ok": True, "data": to_task_out(task).model_dump()}


@router.post("/{task_id}/qualify", response_model=dict)
async def qualify_task(
    task_id: str,
    body: TaskQualify,
    db: AsyncSession = Depends(get_db),
    actor: ActorContext = Depends(require_actor(RoleType.IntakeCoordinator, RoleType.System)),
):
    svc = TaskService(db)
    try:
        task = await svc.qualify_task(task_id, owner_id=actor.actor_id, summary=body.summary)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {"ok": True, "data": {"task_id": task.id, "state": task.state.value}}
