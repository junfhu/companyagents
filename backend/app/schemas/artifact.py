from pydantic import BaseModel, Field


class ArtifactCreate(BaseModel):
    work_item_id: str | None = None
    type: str
    name: str
    path_or_url: str
    summary: str = ""
    version: int = 1
    created_by_role: str = "System"
    created_by_id: str = "api"
    meta: dict = Field(default_factory=dict)


class ArtifactOut(BaseModel):
    id: str
    task_id: str
    work_item_id: str | None
    type: str
    name: str
    path_or_url: str
    summary: str
    version: int
    created_by_role: str
    created_by_id: str
    meta: dict
    created_at: str
    updated_at: str

