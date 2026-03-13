from pydantic import BaseModel, Field


class WorkItemCreateItem(BaseModel):
    title: str
    description: str = ""
    assigned_team: str = ""
    priority: str = "normal"
    acceptance_criteria: list[str] = Field(default_factory=list)
    sort_order: int = 0
    meta: dict = Field(default_factory=dict)


class WorkItemCreateBatch(BaseModel):
    plan_version: int
    created_by_id: str = "delivery-default"
    items: list[WorkItemCreateItem] = Field(default_factory=list)


class WorkItemProgress(BaseModel):
    status: str
    summary: str = ""
    progress_percent: int | None = None
    block_reason: str = ""
    actor_id: str = "execution-default"
    actor_role: str = "EngineeringTeam"
    meta: dict = Field(default_factory=dict)


class WorkItemOut(BaseModel):
    id: str
    task_id: str
    plan_version: int
    title: str
    description: str
    assigned_team: str
    owner_role: str
    status: str
    priority: str
    acceptance_criteria: list
    block_reason: str
    sort_order: int
    meta: dict
    created_at: str
    updated_at: str
    completed_at: str | None

