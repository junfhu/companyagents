from fastapi import APIRouter, Depends

from ..config import get_settings
from ..models.enums import RoleType
from ..runtime_state import runtime_worker
from ..security import ActorContext, require_actor


router = APIRouter(prefix="/api/runtime", tags=["runtime"])
settings = get_settings()


@router.get("/status", response_model=dict)
async def runtime_status():
    return {
        "ok": True,
        "data": {
            **runtime_worker.status(),
            "configured_enabled": settings.runtime_workers_enabled,
        },
    }


@router.post("/run-once", response_model=dict)
async def runtime_run_once(
    actor: ActorContext = Depends(require_actor(RoleType.WorkflowSupervisor, RoleType.System)),
):
    result = await runtime_worker.run_once()
    return {
        "ok": True,
        "data": {
            **runtime_worker.status(),
            "configured_enabled": settings.runtime_workers_enabled,
            "last_result": result,
            "triggered_by": actor.actor_id,
        },
    }


@router.post("/pause", response_model=dict)
async def runtime_pause(
    actor: ActorContext = Depends(require_actor(RoleType.WorkflowSupervisor, RoleType.System)),
):
    await runtime_worker.stop()
    return {
        "ok": True,
        "data": {
            **runtime_worker.status(),
            "configured_enabled": settings.runtime_workers_enabled,
            "triggered_by": actor.actor_id,
        },
    }


@router.post("/resume", response_model=dict)
async def runtime_resume(
    actor: ActorContext = Depends(require_actor(RoleType.WorkflowSupervisor, RoleType.System)),
):
    runtime_worker.start()
    return {
        "ok": True,
        "data": {
            **runtime_worker.status(),
            "configured_enabled": settings.runtime_workers_enabled,
            "triggered_by": actor.actor_id,
        },
    }


@router.post("/tasks/{task_id}/run-once", response_model=dict)
async def runtime_run_for_task(
    task_id: str,
    actor: ActorContext = Depends(require_actor(RoleType.WorkflowSupervisor, RoleType.System)),
):
    result = await runtime_worker.run_for_task(task_id, mode="all")
    return {
        "ok": True,
        "data": {
            "task_id": task_id,
            "mode": "all",
            "last_result": result,
            "triggered_by": actor.actor_id,
        },
    }


@router.post("/tasks/{task_id}/sweep", response_model=dict)
async def runtime_sweep_task(
    task_id: str,
    actor: ActorContext = Depends(require_actor(RoleType.WorkflowSupervisor, RoleType.System)),
):
    result = await runtime_worker.run_for_task(task_id, mode="sweep")
    return {
        "ok": True,
        "data": {
            "task_id": task_id,
            "mode": "sweep",
            "last_result": result,
            "triggered_by": actor.actor_id,
        },
    }
