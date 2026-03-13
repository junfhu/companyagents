from .config import get_settings
from .runtime import RuntimeWorker


settings = get_settings()

runtime_worker = RuntimeWorker(
    poll_interval_seconds=settings.runtime_poll_interval_seconds,
    actor_id=settings.runtime_worker_actor_id,
    blocked_escalation_seconds=settings.runtime_blocked_escalation_seconds,
)
