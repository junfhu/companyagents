from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    title: str
    summary: str = ""
    priority: str = "normal"
    request_type: str = "project_request"
    source: str = "manual"
    requester: str = ""
    project_id: str | None = None
    tags: list[str] = Field(default_factory=list)
    meta: dict = Field(default_factory=dict)


class TaskQualify(BaseModel):
    owner_id: str = "intake-default"
    summary: str | None = None


class TaskOut(BaseModel):
    id: str
    title: str
    summary: str
    state: str
    priority: str
    request_type: str
    source: str
    requester: str
    owner_role: str
    owner_team: str
    current_plan_version: int
    review_round: int
    blocked_reason: str
    acceptance_summary: str
    tags: list
    meta: dict
    archived: bool
    archived_at: str | None
    created_at: str
    updated_at: str

