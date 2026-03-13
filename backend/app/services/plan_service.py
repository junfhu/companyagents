from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Task, TaskPlan
from ..models.enums import RoleType, TaskState
from ..schemas.plan import PlanCreate
from .task_service import TaskService
from .workflow import ensure_transition


class PlanService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.task_service = TaskService(db)

    async def get_latest_plan(self, task_id: str) -> TaskPlan:
        stmt = (
            select(TaskPlan)
            .where(TaskPlan.task_id == task_id)
            .order_by(desc(TaskPlan.version))
            .limit(1)
        )
        result = await self.db.execute(stmt)
        plan = result.scalar_one_or_none()
        if plan is None:
            raise ValueError("plan not found")
        return plan

    async def create_plan(self, task_id: str, body: PlanCreate) -> TaskPlan:
        task = await self.task_service.get_task(task_id)
        if task.state not in {TaskState.Qualified, TaskState.Planned}:
            raise ValueError("task must be Qualified or Planned before creating a plan")

        version = task.current_plan_version + 1
        plan = TaskPlan(
            id=f"PLAN-{uuid4().hex[:16].upper()}",
            task_id=task_id,
            version=version,
            goal=body.goal,
            scope=body.scope,
            out_of_scope=body.out_of_scope,
            acceptance_criteria=body.acceptance_criteria,
            required_teams=body.required_teams,
            estimated_effort=body.estimated_effort,
            risks=body.risks,
            assumptions=body.assumptions,
            notes=body.notes,
            created_by_role=RoleType.ProjectManager,
            created_by_id=body.created_by_id,
        )
        self.db.add(plan)
        task.current_plan_version = version
        task.acceptance_summary = "; ".join(body.acceptance_criteria[:3])
        task.updated_at = datetime.now(timezone.utc)
        await self.task_service.mark_planned(task, body.created_by_id)
        return plan

    async def submit_for_review(self, task_id: str, actor_id: str, plan_version: int) -> Task:
        task = await self.task_service.get_task(task_id)
        if task.current_plan_version != plan_version:
            raise ValueError("plan version does not match current task plan")
        return await self.task_service.transition_to_review(task, actor_id=actor_id, plan_version=plan_version)

