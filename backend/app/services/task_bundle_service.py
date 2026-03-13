from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import ActivityEvent, InterventionLog
from ..schemas.artifact import ArtifactOut
from ..schemas.plan import PlanOut
from ..schemas.review import ReviewOut
from ..schemas.task import TaskOut
from ..schemas.work_item import WorkItemOut
from .artifact_service import ArtifactService
from .plan_service import PlanService
from .review_service import ReviewService
from .supervisor_service import SupervisorService
from .task_service import TaskService
from .work_item_service import WorkItemService


class TaskBundleService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.task_service = TaskService(db)
        self.plan_service = PlanService(db)
        self.review_service = ReviewService(db)
        self.work_item_service = WorkItemService(db)
        self.artifact_service = ArtifactService(db)
        self.supervisor_service = SupervisorService(db)

    async def build_bundle(self, task_id: str) -> dict:
        task = await self.task_service.get_task(task_id)

        try:
            plan = await self.plan_service.get_latest_plan(task_id)
        except ValueError:
            plan = None

        reviews = await self.review_service.list_reviews(task_id)
        work_items = await self.work_item_service.list_for_task(task_id)
        artifacts = await self.artifact_service.list_for_task(task_id)
        interventions = await self.supervisor_service.list_interventions(task_id)

        stmt = (
            select(ActivityEvent)
            .where(ActivityEvent.task_id == task_id)
            .order_by(ActivityEvent.created_at.asc())
        )
        result = await self.db.execute(stmt)
        events = list(result.scalars().all())

        return {
            "task": self._task_to_out(task),
            "plan": self._plan_to_out(plan) if plan else None,
            "reviews": [self._review_to_out(review) for review in reviews],
            "work_items": [self._work_item_to_out(item) for item in work_items],
            "artifacts": [self._artifact_to_out(item) for item in artifacts],
            "interventions": [self._intervention_to_out(item) for item in interventions],
            "activity": [self._event_to_out(event) for event in events],
        }

    @staticmethod
    def _task_to_out(task) -> dict:
        return TaskOut(
            id=task.id,
            title=task.title,
            summary=task.summary,
            state=task.state.value,
            priority=task.priority,
            request_type=task.request_type,
            source=task.source,
            requester=task.requester,
            owner_role=task.owner_role.value,
            owner_team=task.owner_team,
            current_plan_version=task.current_plan_version,
            review_round=task.review_round,
            blocked_reason=task.blocked_reason,
            acceptance_summary=task.acceptance_summary,
            tags=task.tags or [],
            meta=task.meta or {},
            archived=task.archived,
            archived_at=task.archived_at.isoformat() if task.archived_at else None,
            created_at=task.created_at.isoformat(),
            updated_at=task.updated_at.isoformat(),
        ).model_dump()

    @staticmethod
    def _plan_to_out(plan) -> dict:
        return PlanOut(
            id=plan.id,
            task_id=plan.task_id,
            version=plan.version,
            goal=plan.goal,
            scope=plan.scope or [],
            out_of_scope=plan.out_of_scope or [],
            acceptance_criteria=plan.acceptance_criteria or [],
            required_teams=plan.required_teams or [],
            estimated_effort=plan.estimated_effort,
            risks=plan.risks or [],
            assumptions=plan.assumptions or [],
            notes=plan.notes,
            created_by_role=plan.created_by_role.value,
            created_by_id=plan.created_by_id,
            created_at=plan.created_at.isoformat(),
        ).model_dump()

    @staticmethod
    def _review_to_out(review) -> dict:
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
        ).model_dump()

    @staticmethod
    def _work_item_to_out(work_item) -> dict:
        return WorkItemOut(
            id=work_item.id,
            task_id=work_item.task_id,
            plan_version=work_item.plan_version,
            title=work_item.title,
            description=work_item.description,
            assigned_team=work_item.assigned_team,
            owner_role=work_item.owner_role.value,
            status=work_item.status.value,
            priority=work_item.priority,
            acceptance_criteria=work_item.acceptance_criteria or [],
            block_reason=work_item.block_reason,
            sort_order=work_item.sort_order,
            meta=work_item.meta or {},
            created_at=work_item.created_at.isoformat(),
            updated_at=work_item.updated_at.isoformat(),
            completed_at=work_item.completed_at.isoformat() if work_item.completed_at else None,
        ).model_dump()

    @staticmethod
    def _artifact_to_out(artifact) -> dict:
        return ArtifactOut(
            id=artifact.id,
            task_id=artifact.task_id,
            work_item_id=artifact.work_item_id,
            type=artifact.type.value,
            name=artifact.name,
            path_or_url=artifact.path_or_url,
            summary=artifact.summary,
            version=artifact.version,
            created_by_role=artifact.created_by_role.value,
            created_by_id=artifact.created_by_id,
            meta=artifact.meta or {},
            created_at=artifact.created_at.isoformat(),
            updated_at=artifact.updated_at.isoformat(),
        ).model_dump()

    @staticmethod
    def _intervention_to_out(item: InterventionLog) -> dict:
        return {
            "id": item.id,
            "action": item.action.value,
            "reason": item.reason,
            "from_state": item.from_state,
            "to_state": item.to_state,
            "triggered_by_role": item.triggered_by_role.value,
            "triggered_by_id": item.triggered_by_id,
            "meta": item.meta or {},
            "created_at": item.created_at.isoformat(),
        }

    @staticmethod
    def _event_to_out(event: ActivityEvent) -> dict:
        return {
            "id": event.id,
            "topic": event.topic,
            "entity_type": event.entity_type,
            "entity_id": event.entity_id,
            "actor_role": event.actor_role.value,
            "actor_id": event.actor_id,
            "payload": event.payload or {},
            "meta": event.meta or {},
            "created_at": event.created_at.isoformat(),
        }
