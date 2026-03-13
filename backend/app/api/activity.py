from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_db
from ..models import ActivityEvent


router = APIRouter(prefix="/api", tags=["activity"])


@router.get("/tasks/{task_id}/activity", response_model=dict)
async def list_activity(task_id: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(ActivityEvent)
        .where(ActivityEvent.task_id == task_id)
        .order_by(ActivityEvent.created_at.asc())
    )
    result = await db.execute(stmt)
    events = list(result.scalars().all())
    return {
        "ok": True,
        "data": {
            "items": [
                {
                    "id": event.id,
                    "task_id": event.task_id,
                    "topic": event.topic,
                    "entity_type": event.entity_type,
                    "entity_id": event.entity_id,
                    "actor_role": event.actor_role.value,
                    "actor_id": event.actor_id,
                    "payload": event.payload or {},
                    "meta": event.meta or {},
                    "created_at": event.created_at.isoformat(),
                }
                for event in events
            ]
        },
    }

