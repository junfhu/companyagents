from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_db
from ..models.enums import RoleType
from ..security import ActorContext, require_actor
from ..schemas.review import ReviewAction, ReviewOut
from ..services.review_service import ReviewService


router = APIRouter(prefix="/api/tasks", tags=["reviews"])


def to_review_out(review) -> ReviewOut:
    return ReviewOut(
        id=review.id,
        task_id=review.task_id,
        plan_version=review.plan_version,
        review_round=review.review_round,
        reviewer_role=review.reviewer_role.value,
        reviewer_id=review.reviewer_id,
        result=review.result.value,
        comments=review.comments or [],
        summary=review.summary,
        created_at=review.created_at.isoformat(),
    )


@router.get("/{task_id}/reviews", response_model=dict)
async def list_reviews(task_id: str, db: AsyncSession = Depends(get_db)):
    svc = ReviewService(db)
    reviews = await svc.list_reviews(task_id)
    return {"ok": True, "data": {"items": [to_review_out(review).model_dump() for review in reviews]}}


@router.post("/{task_id}/approve", response_model=dict)
async def approve(
    task_id: str,
    body: ReviewAction,
    db: AsyncSession = Depends(get_db),
    actor: ActorContext = Depends(require_actor(RoleType.SolutionReviewer, RoleType.System)),
):
    svc = ReviewService(db)
    try:
        review, task = await svc.approve(
            task_id,
            body.model_copy(update={"reviewer_id": actor.actor_id}),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {
        "ok": True,
        "data": {
            "task_id": task.id,
            "state": task.state.value,
            "review": to_review_out(review).model_dump(),
        },
    }


@router.post("/{task_id}/request-changes", response_model=dict)
async def request_changes(
    task_id: str,
    body: ReviewAction,
    db: AsyncSession = Depends(get_db),
    actor: ActorContext = Depends(require_actor(RoleType.SolutionReviewer, RoleType.System)),
):
    svc = ReviewService(db)
    try:
        review, task = await svc.request_changes(
            task_id,
            body.model_copy(update={"reviewer_id": actor.actor_id}),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {
        "ok": True,
        "data": {
            "task_id": task.id,
            "state": task.state.value,
            "review": to_review_out(review).model_dump(),
        },
    }


@router.post("/{task_id}/reject", response_model=dict)
async def reject(
    task_id: str,
    body: ReviewAction,
    db: AsyncSession = Depends(get_db),
    actor: ActorContext = Depends(require_actor(RoleType.SolutionReviewer, RoleType.System)),
):
    svc = ReviewService(db)
    try:
        review, task = await svc.reject(
            task_id,
            body.model_copy(update={"reviewer_id": actor.actor_id}),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {
        "ok": True,
        "data": {
            "task_id": task.id,
            "state": task.state.value,
            "review": to_review_out(review).model_dump(),
        },
    }
