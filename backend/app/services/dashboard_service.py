from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import ActivityEvent, Task, WorkItem
from ..models.enums import TaskState, WorkItemStatus
from ..schemas.task import TaskOut


class DashboardService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def build_summary(self) -> dict:
        task_total = await self.db.scalar(select(func.count()).select_from(Task))
        active_states = (
            TaskState.New,
            TaskState.NeedsClarification,
            TaskState.Qualified,
            TaskState.Planned,
            TaskState.InReview,
            TaskState.Approved,
            TaskState.Dispatched,
            TaskState.InExecution,
            TaskState.InIntegration,
            TaskState.ReadyToReport,
            TaskState.Blocked,
        )
        active_total = await self.db.scalar(
            select(func.count()).select_from(Task).where(Task.state.in_(active_states))
        )
        blocked_total = await self.db.scalar(
            select(func.count()).select_from(Task).where(Task.state == TaskState.Blocked)
        )
        work_item_total = await self.db.scalar(select(func.count()).select_from(WorkItem))
        work_item_in_progress = await self.db.scalar(
            select(func.count())
            .select_from(WorkItem)
            .where(WorkItem.status == WorkItemStatus.InProgress)
        )

        states_result = await self.db.execute(
            select(Task.state, func.count()).group_by(Task.state).order_by(Task.state.asc())
        )
        by_state = {state.value: count for state, count in states_result.all()}

        teams_result = await self.db.execute(
            select(WorkItem.assigned_team, func.count())
            .where(WorkItem.assigned_team.is_not(None))
            .group_by(WorkItem.assigned_team)
            .order_by(func.count().desc(), WorkItem.assigned_team.asc())
        )
        by_team = {
            team_name: count
            for team_name, count in teams_result.all()
            if team_name is not None
        }

        attention = await self.build_attention()

        return {
            "tasks_total": task_total or 0,
            "tasks_active": active_total or 0,
            "tasks_blocked": blocked_total or 0,
            "work_items_total": work_item_total or 0,
            "work_items_in_progress": work_item_in_progress or 0,
            "by_state": by_state,
            "by_team": by_team,
            "attention": attention,
        }

    async def build_attention(self) -> dict:
        recent_stmt = (
            select(Task).where(Task.archived.is_(False)).order_by(Task.updated_at.desc()).limit(5)
        )
        blocked_stmt = (
            select(Task)
            .where(Task.state == TaskState.Blocked, Task.archived.is_(False))
            .order_by(Task.updated_at.desc())
            .limit(5)
        )
        review_stmt = (
            select(Task)
            .where(Task.state.in_((TaskState.InReview, TaskState.Approved)), Task.archived.is_(False))
            .order_by(Task.updated_at.desc())
            .limit(5)
        )
        priority_stmt = (
            select(Task)
            .where(Task.priority.in_(("critical", "high")), Task.archived.is_(False))
            .order_by(
                case((Task.priority == "critical", 2), (Task.priority == "high", 1), else_=0).desc(),
                Task.updated_at.desc(),
            )
            .limit(5)
        )

        recent = list((await self.db.execute(recent_stmt)).scalars().all())
        blocked = list((await self.db.execute(blocked_stmt)).scalars().all())
        review = list((await self.db.execute(review_stmt)).scalars().all())
        priority = list((await self.db.execute(priority_stmt)).scalars().all())

        return {
            "recent": [self._task_to_out(task) for task in recent],
            "blocked": [self._task_to_out(task) for task in blocked],
            "review": [self._task_to_out(task) for task in review],
            "priority": [self._task_to_out(task) for task in priority],
        }

    async def build_recent_activity(self) -> list[dict]:
        stmt = select(ActivityEvent).order_by(ActivityEvent.created_at.desc()).limit(8)
        result = await self.db.execute(stmt)
        events = list(result.scalars().all())
        return [self._event_to_out(event) for event in events]

    async def build_teams_overview(self) -> dict:
        workload_result = await self.db.execute(
            select(
                WorkItem.assigned_team,
                func.count().label("total"),
                func.sum(case((WorkItem.status == WorkItemStatus.InProgress, 1), else_=0)).label(
                    "in_progress"
                ),
                func.sum(case((WorkItem.status == WorkItemStatus.Blocked, 1), else_=0)).label(
                    "blocked"
                ),
                func.sum(case((WorkItem.status == WorkItemStatus.Completed, 1), else_=0)).label(
                    "completed"
                ),
            )
            .where(WorkItem.assigned_team.is_not(None), WorkItem.assigned_team != "")
            .group_by(WorkItem.assigned_team)
            .order_by(func.count().desc(), WorkItem.assigned_team.asc())
        )
        rows = workload_result.all()

        task_owner_result = await self.db.execute(
            select(Task.owner_team, func.count())
            .where(Task.owner_team.is_not(None), Task.owner_team != "")
            .group_by(Task.owner_team)
        )
        task_owner_counts = {team_name: count for team_name, count in task_owner_result.all()}

        return {
            "items": [
                {
                    "name": team_name,
                    "work_items_total": total or 0,
                    "work_items_in_progress": in_progress or 0,
                    "work_items_blocked": blocked or 0,
                    "work_items_completed": completed or 0,
                    "tasks_owned": task_owner_counts.get(team_name, 0),
                }
                for team_name, total, in_progress, blocked, completed in rows
            ]
        }

    async def build_bundle(self) -> dict:
        summary = await self.build_summary()
        teams = await self.build_teams_overview()
        return {
            "summary": summary,
            "attention": summary["attention"],
            "teams": teams["items"],
            "recent_activity": await self.build_recent_activity(),
        }

    def _task_to_out(self, task: Task) -> dict:
        return TaskOut.model_validate(task).model_dump(mode="json")

    @staticmethod
    def _event_to_out(event: ActivityEvent) -> dict:
        return {
            "id": event.id,
            "task_id": event.task_id,
            "topic": event.topic,
            "entity_type": event.entity_type,
            "entity_id": event.entity_id,
            "actor_role": event.actor_role.value,
            "actor_id": event.actor_id,
            "payload": event.payload or {},
            "meta": event.meta or {},
            "created_at": event.created_at.isoformat(),
        }
