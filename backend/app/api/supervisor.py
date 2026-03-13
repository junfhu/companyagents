from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_db
from ..models.enums import RoleType
from ..security import ActorContext, require_actor
from ..schemas.supervisor import InterventionRequest
from ..services.supervisor_service import SupervisorService


router = APIRouter(prefix="/api/tasks", tags=["supervisor"])


@router.get("/{task_id}/supervisor", response_model=dict)
async def get_supervisor_state(task_id: str, db: AsyncSession = Depends(get_db)):
    svc = SupervisorService(db)
    try:
        interventions = await svc.list_interventions(task_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {
        "ok": True,
        "data": {
            "task_id": task_id,
            "interventions": [
                {
                    "id": item.id,
                    "action": item.action.value,
                    "reason": item.reason,
                    "from_state": item.from_state,
                    "to_state": item.to_state,
                    "triggered_by_role": item.triggered_by_role.value,
                    "triggered_by_id": item.triggered_by_id,
                    "meta": item.meta or {},
                    "created_at": item.created_at.isoformat(),
                }
                for item in interventions
            ],
        },
    }


@router.post("/{task_id}/pause", response_model=dict)
async def pause_task(
    task_id: str,
    body: InterventionRequest,
    db: AsyncSession = Depends(get_db),
    actor: ActorContext = Depends(require_actor(RoleType.WorkflowSupervisor, RoleType.System)),
):
    svc = SupervisorService(db)
    try:
        task = await svc.pause(
            task_id,
            body.model_copy(update={"actor_id": actor.actor_id, "actor_role": actor.role.value}),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {"ok": True, "data": {"task_id": task.id, "state": task.state.value}}


@router.post("/{task_id}/resume", response_model=dict)
async def resume_task(
    task_id: str,
    body: InterventionRequest,
    db: AsyncSession = Depends(get_db),
    actor: ActorContext = Depends(require_actor(RoleType.WorkflowSupervisor, RoleType.System)),
):
    svc = SupervisorService(db)
    try:
        task = await svc.resume(
            task_id,
            body.model_copy(update={"actor_id": actor.actor_id, "actor_role": actor.role.value}),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {"ok": True, "data": {"task_id": task.id, "state": task.state.value}}


@router.post("/{task_id}/retry", response_model=dict)
async def retry_task(
    task_id: str,
    body: InterventionRequest,
    db: AsyncSession = Depends(get_db),
    actor: ActorContext = Depends(require_actor(RoleType.WorkflowSupervisor, RoleType.System)),
):
    svc = SupervisorService(db)
    try:
        task = await svc.retry(
            task_id,
            body.model_copy(update={"actor_id": actor.actor_id, "actor_role": actor.role.value}),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {"ok": True, "data": {"task_id": task.id, "action": "retry", "state": task.state.value}}


@router.post("/{task_id}/escalate", response_model=dict)
async def escalate_task(
    task_id: str,
    body: InterventionRequest,
    db: AsyncSession = Depends(get_db),
    actor: ActorContext = Depends(require_actor(RoleType.WorkflowSupervisor, RoleType.System)),
):
    svc = SupervisorService(db)
    try:
        task = await svc.escalate(
            task_id,
            body.model_copy(update={"actor_id": actor.actor_id, "actor_role": actor.role.value}),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {"ok": True, "data": {"task_id": task.id, "action": "escalate", "state": task.state.value}}


@router.post("/{task_id}/rollback", response_model=dict)
async def rollback_task(
    task_id: str,
    body: InterventionRequest,
    db: AsyncSession = Depends(get_db),
    actor: ActorContext = Depends(require_actor(RoleType.WorkflowSupervisor, RoleType.System)),
):
    svc = SupervisorService(db)
    try:
        task = await svc.rollback(
            task_id,
            body.model_copy(update={"actor_id": actor.actor_id, "actor_role": actor.role.value}),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {"ok": True, "data": {"task_id": task.id, "action": "rollback", "state": task.state.value}}


@router.post("/{task_id}/replan", response_model=dict)
async def replan_task(
    task_id: str,
    body: InterventionRequest,
    db: AsyncSession = Depends(get_db),
    actor: ActorContext = Depends(require_actor(RoleType.WorkflowSupervisor, RoleType.System)),
):
    svc = SupervisorService(db)
    try:
        task = await svc.replan(
            task_id,
            body.model_copy(update={"actor_id": actor.actor_id, "actor_role": actor.role.value}),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {"ok": True, "data": {"task_id": task.id, "action": "replan", "state": task.state.value}}
