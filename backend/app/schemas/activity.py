from pydantic import BaseModel


class ActivityEventOut(BaseModel):
    id: str
    task_id: str
    topic: str
    entity_type: str
    entity_id: str
    actor_role: str
    actor_id: str
    payload: dict
    meta: dict
    created_at: str

