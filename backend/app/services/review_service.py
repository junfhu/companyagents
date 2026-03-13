from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import TaskReview
from ..models.enums import ReviewResult, RoleType, TaskState
from ..schemas.review import ReviewAction
from .task_service import TaskService
from .workflow import STATE_OWNER_ROLE, ensure_transition


class ReviewService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.task_service = TaskService(db)

    async def list_reviews(self, task_id: str) -> list[TaskReview]:
        stmt = (
            select(TaskReview)
            .where(TaskReview.task_id == task_id)
            .order_by(desc(TaskReview.review_round), desc(TaskReview.created_at))
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def approve(self, task_id: str, body: ReviewAction) -> tuple[TaskReview, object]:
        task = await self.task_service.get_task(task_id)
        ensure_transition(task.state, TaskState.Approved)
        review = await self._create_review(task_id, body, ReviewResult.Approved)
        task.review_round = max(task.review_round, review.review_round)
        task.state = TaskState.Approved
        task.owner_role = STATE_OWNER_ROLE[TaskState.Approved]
        task.updated_at = datetime.now(timezone.utc)
        await self.task_service._add_event(
            task_id=task.id,
            topic="task.approved",
            actor_role=RoleType.SolutionReviewer,
            actor_id=body.reviewer_id,
            payload={"plan_version": body.plan_version, "review_round": review.review_round},
        )
        return review, task

    async def request_changes(self, task_id: str, body: ReviewAction) -> tuple[TaskReview, object]:
        task = await self.task_service.get_task(task_id)
        ensure_transition(task.state, TaskState.Planned)
        review = await self._create_review(task_id, body, ReviewResult.ChangesRequested)
        task.review_round = max(task.review_round, review.review_round)
        task.state = TaskState.Planned
        task.owner_role = STATE_OWNER_ROLE[TaskState.Planned]
        task.updated_at = datetime.now(timezone.utc)
        await self.task_service._add_event(
            task_id=task.id,
            topic="task.changes_requested",
            actor_role=RoleType.SolutionReviewer,
            actor_id=body.reviewer_id,
            payload={"plan_version": body.plan_version, "review_round": review.review_round},
        )
        return review, task

    async def reject(self, task_id: str, body: ReviewAction) -> tuple[TaskReview, object]:
        task = await self.task_service.get_task(task_id)
        ensure_transition(task.state, TaskState.Rejected)
        review = await self._create_review(task_id, body, ReviewResult.Rejected)
        task.review_round = max(task.review_round, review.review_round)
        task.state = TaskState.Rejected
        task.owner_role = STATE_OWNER_ROLE[TaskState.Rejected]
        task.updated_at = datetime.now(timezone.utc)
        await self.task_service._add_event(
            task_id=task.id,
            topic="task.rejected",
            actor_role=RoleType.SolutionReviewer,
            actor_id=body.reviewer_id,
            payload={"plan_version": body.plan_version, "review_round": review.review_round},
        )
        return review, task

    async def _create_review(self, task_id: str, body: ReviewAction, result: ReviewResult) -> TaskReview:
        prior = await self.list_reviews(task_id)
        review_round = (prior[0].review_round + 1) if prior else 1
        review = TaskReview(
            id=f"RV-{uuid4().hex[:16].upper()}",
            task_id=task_id,
            plan_version=body.plan_version,
            review_round=review_round,
            reviewer_role=RoleType.SolutionReviewer,
            reviewer_id=body.reviewer_id,
            result=result,
            comments=body.comments,
            summary=body.summary,
        )
        self.db.add(review)
        await self.db.flush()
        return review
