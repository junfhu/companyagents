from ..models.enums import RoleType, TaskState


TASK_TRANSITIONS: dict[TaskState, set[TaskState]] = {
    TaskState.New: {TaskState.NeedsClarification, TaskState.Qualified, TaskState.Cancelled},
    TaskState.NeedsClarification: {TaskState.Qualified, TaskState.Cancelled},
    TaskState.Qualified: {TaskState.Planned, TaskState.Cancelled},
    TaskState.Planned: {TaskState.InReview, TaskState.Cancelled},
    TaskState.InReview: {TaskState.Approved, TaskState.Planned, TaskState.Rejected, TaskState.Cancelled},
    TaskState.Approved: {TaskState.Dispatched, TaskState.Blocked, TaskState.Cancelled},
    TaskState.Dispatched: {TaskState.InExecution, TaskState.Blocked, TaskState.Cancelled},
    TaskState.InExecution: {TaskState.InIntegration, TaskState.Blocked, TaskState.Planned, TaskState.Cancelled},
    TaskState.InIntegration: {TaskState.ReadyToReport, TaskState.InExecution, TaskState.Blocked},
    TaskState.ReadyToReport: {TaskState.Done, TaskState.InIntegration},
    TaskState.Blocked: {TaskState.Planned, TaskState.InExecution, TaskState.Cancelled},
    TaskState.Done: {TaskState.Archived, TaskState.Planned},
    TaskState.Rejected: {TaskState.Planned, TaskState.Cancelled},
    TaskState.Cancelled: set(),
    TaskState.Archived: set(),
}


STATE_OWNER_ROLE: dict[TaskState, RoleType] = {
    TaskState.New: RoleType.IntakeCoordinator,
    TaskState.NeedsClarification: RoleType.IntakeCoordinator,
    TaskState.Qualified: RoleType.ProjectManager,
    TaskState.Planned: RoleType.ProjectManager,
    TaskState.InReview: RoleType.SolutionReviewer,
    TaskState.Approved: RoleType.DeliveryManager,
    TaskState.Rejected: RoleType.SolutionReviewer,
    TaskState.Dispatched: RoleType.DeliveryManager,
    TaskState.InExecution: RoleType.DeliveryManager,
    TaskState.InIntegration: RoleType.DeliveryManager,
    TaskState.ReadyToReport: RoleType.System,
    TaskState.Blocked: RoleType.WorkflowSupervisor,
    TaskState.Done: RoleType.System,
    TaskState.Cancelled: RoleType.System,
    TaskState.Archived: RoleType.System,
}


def ensure_transition(current: TaskState, target: TaskState) -> None:
    allowed = TASK_TRANSITIONS.get(current, set())
    if target not in allowed:
        allowed_text = ", ".join(state.value for state in sorted(allowed, key=lambda item: item.value))
        raise ValueError(f"invalid transition: {current.value} -> {target.value}. allowed: {allowed_text}")
