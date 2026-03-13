from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Artifact
from ..models.enums import ArtifactType, RoleType
from ..schemas.artifact import ArtifactCreate
from .task_service import TaskService


class ArtifactService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.task_service = TaskService(db)

    async def list_for_task(self, task_id: str) -> list[Artifact]:
        stmt = (
            select(Artifact)
            .where(Artifact.task_id == task_id)
            .order_by(Artifact.created_at.asc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def create(self, task_id: str, body: ArtifactCreate) -> Artifact:
        await self.task_service.get_task(task_id)
        artifact = Artifact(
            id=f"AR-{uuid4().hex[:16].upper()}",
            task_id=task_id,
            work_item_id=body.work_item_id,
            type=ArtifactType(body.type),
            name=body.name,
            path_or_url=body.path_or_url,
            summary=body.summary,
            version=body.version,
            created_by_role=RoleType(body.created_by_role),
            created_by_id=body.created_by_id,
            meta=body.meta,
        )
        self.db.add(artifact)
        await self.task_service._add_event(
            task_id=task_id,
            topic="artifact.created",
            actor_role=artifact.created_by_role,
            actor_id=artifact.created_by_id,
            payload={
                "artifact_id": artifact.id,
                "work_item_id": artifact.work_item_id,
                "type": artifact.type.value,
                "name": artifact.name,
            },
            entity_type="artifact",
            entity_id=artifact.id,
        )
        return artifact

