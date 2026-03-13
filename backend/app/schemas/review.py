from pydantic import BaseModel, Field


class ReviewAction(BaseModel):
    plan_version: int
    reviewer_id: str = "reviewer-default"
    comments: list[str] = Field(default_factory=list)
    summary: str = ""


class ReviewOut(BaseModel):
    id: str
    task_id: str
    plan_version: int
    review_round: int
    reviewer_role: str
    reviewer_id: str
    result: str
    comments: list
    summary: str
    created_at: str

