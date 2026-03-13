import asyncio
from datetime import datetime, timezone

from .db import async_session
from .services.runtime_service import RuntimeOrchestrator


class RuntimeWorker:
    def __init__(
        self,
        session_factory=async_session,
        poll_interval_seconds: float = 2.0,
        actor_id: str = "runtime-orchestrator",
        blocked_escalation_seconds: float = 900.0,
    ) -> None:
        self._session_factory = session_factory
        self._poll_interval_seconds = poll_interval_seconds
        self._actor_id = actor_id
        self._blocked_escalation_seconds = blocked_escalation_seconds
        self._task: asyncio.Task | None = None
        self._stopped = asyncio.Event()
        self._auto_loop_enabled = False
        self._last_run_at: datetime | None = None
        self._last_result: dict = {
            "generated_work_items": 0,
            "dispatched_tasks": 0,
            "ready_to_report_tasks": 0,
            "completed_tasks": 0,
            "escalated_tasks": 0,
        }

    def start(self) -> None:
        if self._task is not None:
            return
        self._stopped.clear()
        self._auto_loop_enabled = True
        self._task = asyncio.create_task(self._run_loop())

    async def stop(self) -> None:
        self._auto_loop_enabled = False
        self._stopped.set()
        if self._task is None:
            return
        self._task.cancel()
        try:
            await self._task
        except asyncio.CancelledError:
            pass
        self._task = None

    async def run_once(self) -> dict:
        async with self._session_factory() as session:
            try:
                summary = await RuntimeOrchestrator(
                    session,
                    actor_id=self._actor_id,
                    blocked_escalation_seconds=self._blocked_escalation_seconds,
                ).run_once()
                await session.commit()
            except Exception:
                await session.rollback()
                raise

        result = {
            "generated_work_items": summary.generated_work_items,
            "dispatched_tasks": summary.dispatched_tasks,
            "ready_to_report_tasks": summary.ready_to_report_tasks,
            "completed_tasks": summary.completed_tasks,
            "escalated_tasks": summary.escalated_tasks,
        }
        self._last_run_at = datetime.now(timezone.utc)
        self._last_result = result
        return result

    async def run_for_task(self, task_id: str, mode: str = "all") -> dict:
        async with self._session_factory() as session:
            try:
                summary = await RuntimeOrchestrator(
                    session,
                    actor_id=self._actor_id,
                    blocked_escalation_seconds=self._blocked_escalation_seconds,
                ).run_for_task(task_id, mode=mode)
                await session.commit()
            except Exception:
                await session.rollback()
                raise

        result = {
            "generated_work_items": summary.generated_work_items,
            "dispatched_tasks": summary.dispatched_tasks,
            "ready_to_report_tasks": summary.ready_to_report_tasks,
            "completed_tasks": summary.completed_tasks,
            "escalated_tasks": summary.escalated_tasks,
        }
        self._last_run_at = datetime.now(timezone.utc)
        self._last_result = result
        return result

    def status(self) -> dict:
        return {
            "enabled": self._auto_loop_enabled,
            "running": self._task is not None and not self._task.done(),
            "poll_interval_seconds": self._poll_interval_seconds,
            "blocked_escalation_seconds": self._blocked_escalation_seconds,
            "actor_id": self._actor_id,
            "last_run_at": self._last_run_at.isoformat() if self._last_run_at else None,
            "last_result": self._last_result,
        }

    async def _run_loop(self) -> None:
        while not self._stopped.is_set():
            try:
                await self.run_once()
            except Exception:
                pass

            try:
                await asyncio.wait_for(self._stopped.wait(), timeout=self._poll_interval_seconds)
            except asyncio.TimeoutError:
                continue
