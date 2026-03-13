from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_db
from ..models.enums import RoleType
from ..security import ActorContext, require_actor
from ..schemas.artifact import ArtifactCreate, ArtifactOut
from ..services.artifact_service import ArtifactService


router = APIRouter(prefix="/api", tags=["artifacts"])


def to_artifact_out(artifact) -> ArtifactOut:
    return ArtifactOut(
        id=artifact.id,
        task_id=artifact.task_id,
        work_item_id=artifact.work_item_id,
        type=artifact.type.value,
        name=artifact.name,
        path_or_url=artifact.path_or_url,
        summary=artifact.summary,
        version=artifact.version,
        created_by_role=artifact.created_by_role.value,
        created_by_id=artifact.created_by_id,
        meta=artifact.meta or {},
        created_at=artifact.created_at.isoformat(),
        updated_at=artifact.updated_at.isoformat(),
    )


@router.get("/tasks/{task_id}/artifacts", response_model=dict)
async def list_artifacts(task_id: str, db: AsyncSession = Depends(get_db)):
    svc = ArtifactService(db)
    items = await svc.list_for_task(task_id)
    return {"ok": True, "data": {"items": [to_artifact_out(item).model_dump() for item in items]}}


@router.post("/tasks/{task_id}/artifacts", response_model=dict)
async def create_artifact(
    task_id: str,
    body: ArtifactCreate,
    db: AsyncSession = Depends(get_db),
    actor: ActorContext = Depends(
        require_actor(
            RoleType.DeliveryManager,
            RoleType.ReportingSpecialist,
            RoleType.EngineeringTeam,
            RoleType.DataTeam,
            RoleType.ContentTeam,
            RoleType.OperationsTeam,
            RoleType.SecurityTeam,
            RoleType.System,
        )
    ),
):
    svc = ArtifactService(db)
    try:
        artifact = await svc.create(
            task_id,
            body.model_copy(update={"created_by_role": actor.role.value, "created_by_id": actor.actor_id}),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {"ok": True, "data": to_artifact_out(artifact).model_dump()}
