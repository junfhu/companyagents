from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_db
from ..models.enums import RoleType
from ..security import ActorContext, require_actor
from ..schemas.plan import PlanCreate, PlanOut
from ..services.plan_service import PlanService


router = APIRouter(prefix="/api/tasks", tags=["plans"])


def to_plan_out(plan) -> PlanOut:
    return PlanOut(
        id=plan.id,
        task_id=plan.task_id,
        version=plan.version,
        goal=plan.goal,
        scope=plan.scope or [],
        out_of_scope=plan.out_of_scope or [],
        acceptance_criteria=plan.acceptance_criteria or [],
        required_teams=plan.required_teams or [],
        estimated_effort=plan.estimated_effort,
        risks=plan.risks or [],
        assumptions=plan.assumptions or [],
        notes=plan.notes,
        created_by_role=plan.created_by_role.value,
        created_by_id=plan.created_by_id,
        created_at=plan.created_at.isoformat(),
    )


@router.get("/{task_id}/plan", response_model=dict)
async def get_latest_plan(task_id: str, db: AsyncSession = Depends(get_db)):
    svc = PlanService(db)
    try:
        plan = await svc.get_latest_plan(task_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="plan not found")
    return {"ok": True, "data": to_plan_out(plan).model_dump()}


@router.post("/{task_id}/plan", response_model=dict)
async def create_plan(
    task_id: str,
    body: PlanCreate,
    db: AsyncSession = Depends(get_db),
    actor: ActorContext = Depends(require_actor(RoleType.ProjectManager, RoleType.System)),
):
    svc = PlanService(db)
    try:
        plan = await svc.create_plan(task_id, body.model_copy(update={"created_by_id": actor.actor_id}))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {"ok": True, "data": {"task_id": task_id, "version": plan.version, "plan_id": plan.id}}


@router.post("/{task_id}/submit-review", response_model=dict)
async def submit_for_review(
    task_id: str,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    actor: ActorContext = Depends(require_actor(RoleType.ProjectManager, RoleType.System)),
):
    plan_version = int(payload.get("plan_version", 0))
    svc = PlanService(db)
    try:
        task = await svc.submit_for_review(task_id, actor_id=actor.actor_id, plan_version=plan_version)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {"ok": True, "data": {"task_id": task.id, "state": task.state.value, "plan_version": plan_version}}
