from pydantic import BaseModel, Field


class InterventionRequest(BaseModel):
    reason: str = ""
    actor_id: str = "supervisor-default"
    actor_role: str = "WorkflowSupervisor"
    meta: dict = Field(default_factory=dict)

