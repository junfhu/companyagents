import enum


class TaskState(str, enum.Enum):
    New = "New"
    NeedsClarification = "NeedsClarification"
    Qualified = "Qualified"
    Planned = "Planned"
    InReview = "InReview"
    Approved = "Approved"
    Rejected = "Rejected"
    Dispatched = "Dispatched"
    InExecution = "InExecution"
    InIntegration = "InIntegration"
    ReadyToReport = "ReadyToReport"
    Blocked = "Blocked"
    Done = "Done"
    Cancelled = "Cancelled"
    Archived = "Archived"


class ReviewResult(str, enum.Enum):
    Approved = "Approved"
    ChangesRequested = "ChangesRequested"
    Rejected = "Rejected"


class WorkItemStatus(str, enum.Enum):
    Open = "Open"
    Assigned = "Assigned"
    InProgress = "InProgress"
    Blocked = "Blocked"
    Completed = "Completed"
    Dropped = "Dropped"


class ArtifactType(str, enum.Enum):
    document = "document"
    report = "report"
    repo_diff = "repo_diff"
    test_report = "test_report"
    design = "design"
    dataset = "dataset"
    chart = "chart"
    plan = "plan"
    summary = "summary"
    customer_response = "customer_response"
    runbook = "runbook"
    other = "other"


class InterventionAction(str, enum.Enum):
    pause = "pause"
    resume = "resume"
    retry = "retry"
    escalate = "escalate"
    rollback = "rollback"
    replan = "replan"
    cancel = "cancel"
    reassign = "reassign"
    force_advance = "force_advance"


class RoleType(str, enum.Enum):
    IntakeCoordinator = "IntakeCoordinator"
    ProjectManager = "ProjectManager"
    SolutionReviewer = "SolutionReviewer"
    DeliveryManager = "DeliveryManager"
    EngineeringTeam = "EngineeringTeam"
    DataTeam = "DataTeam"
    ContentTeam = "ContentTeam"
    OperationsTeam = "OperationsTeam"
    SecurityTeam = "SecurityTeam"
    ReportingSpecialist = "ReportingSpecialist"
    WorkflowSupervisor = "WorkflowSupervisor"
    System = "System"
    Human = "Human"
