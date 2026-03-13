from pydantic import BaseModel, Field


class PlanCreate(BaseModel):
    goal: str
    scope: list[str] = Field(default_factory=list)
    out_of_scope: list[str] = Field(default_factory=list)
    acceptance_criteria: list[str] = Field(default_factory=list)
    required_teams: list[str] = Field(default_factory=list)
    estimated_effort: str = ""
    risks: list[str] = Field(default_factory=list)
    assumptions: list[str] = Field(default_factory=list)
    notes: str = ""
    created_by_id: str = "pm-default"


class PlanOut(BaseModel):
    id: str
    task_id: str
    version: int
    goal: str
    scope: list
    out_of_scope: list
    acceptance_criteria: list
    required_teams: list
    estimated_effort: str
    risks: list
    assumptions: list
    notes: str
    created_by_role: str
    created_by_id: str
    created_at: str

