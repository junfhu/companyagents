"""initial schema

Revision ID: 001_initial
Revises: None
Create Date: 2026-03-13
"""

from alembic import op
import sqlalchemy as sa


revision = "001_initial"
down_revision = None
branch_labels = None
depends_on = None


task_state = sa.Enum(
    "New",
    "NeedsClarification",
    "Qualified",
    "Planned",
    "InReview",
    "Approved",
    "Rejected",
    "Dispatched",
    "InExecution",
    "InIntegration",
    "ReadyToReport",
    "Blocked",
    "Done",
    "Cancelled",
    "Archived",
    name="task_state",
)

review_result = sa.Enum(
    "Approved",
    "ChangesRequested",
    "Rejected",
    name="review_result",
)

role_type = sa.Enum(
    "IntakeCoordinator",
    "ProjectManager",
    "SolutionReviewer",
    "DeliveryManager",
    "EngineeringTeam",
    "DataTeam",
    "ContentTeam",
    "OperationsTeam",
    "SecurityTeam",
    "ReportingSpecialist",
    "WorkflowSupervisor",
    "System",
    "Human",
    name="role_type",
)

work_item_status = sa.Enum(
    "Open",
    "Assigned",
    "InProgress",
    "Blocked",
    "Completed",
    "Dropped",
    name="work_item_status",
)

artifact_type = sa.Enum(
    "document",
    "report",
    "repo_diff",
    "test_report",
    "design",
    "dataset",
    "chart",
    "plan",
    "summary",
    "customer_response",
    "runbook",
    "other",
    name="artifact_type",
)

intervention_action = sa.Enum(
    "pause",
    "resume",
    "retry",
    "escalate",
    "rollback",
    "replan",
    "cancel",
    "reassign",
    "force_advance",
    name="intervention_action",
)


def upgrade() -> None:
    bind = op.get_bind()
    task_state.create(bind, checkfirst=True)
    review_result.create(bind, checkfirst=True)
    role_type.create(bind, checkfirst=True)
    work_item_status.create(bind, checkfirst=True)
    artifact_type.create(bind, checkfirst=True)
    intervention_action.create(bind, checkfirst=True)

    op.create_table(
        "tasks",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False, server_default=""),
        sa.Column("state", task_state, nullable=False, server_default="New"),
        sa.Column("priority", sa.String(length=16), nullable=False, server_default="normal"),
        sa.Column("request_type", sa.String(length=64), nullable=False, server_default="project_request"),
        sa.Column("source", sa.String(length=64), nullable=False, server_default="manual"),
        sa.Column("requester", sa.String(length=128), nullable=False, server_default=""),
        sa.Column("owner_role", role_type, nullable=False, server_default="IntakeCoordinator"),
        sa.Column("owner_team", sa.String(length=128), nullable=False, server_default=""),
        sa.Column("current_plan_version", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("review_round", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("blocked_reason", sa.Text(), nullable=False, server_default=""),
        sa.Column("acceptance_summary", sa.Text(), nullable=False, server_default=""),
        sa.Column("tags", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("meta", sa.JSON(), nullable=False, server_default="{}"),
        sa.Column("archived", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_tasks_state", "tasks", ["state"])
    op.create_index("ix_tasks_archived", "tasks", ["archived"])

    op.create_table(
        "task_plans",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("task_id", sa.String(length=64), sa.ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("goal", sa.Text(), nullable=False),
        sa.Column("scope", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("out_of_scope", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("acceptance_criteria", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("required_teams", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("estimated_effort", sa.String(length=64), nullable=False, server_default=""),
        sa.Column("risks", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("assumptions", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("notes", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_by_role", role_type, nullable=False),
        sa.Column("created_by_id", sa.String(length=128), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("task_id", "version", name="uq_task_plans_task_version"),
    )
    op.create_index("ix_task_plans_task_id", "task_plans", ["task_id"])

    op.create_table(
        "task_reviews",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("task_id", sa.String(length=64), sa.ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False),
        sa.Column("plan_version", sa.Integer(), nullable=False),
        sa.Column("review_round", sa.Integer(), nullable=False),
        sa.Column("reviewer_role", role_type, nullable=False),
        sa.Column("reviewer_id", sa.String(length=128), nullable=False, server_default=""),
        sa.Column("result", review_result, nullable=False),
        sa.Column("comments", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("summary", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_task_reviews_task_id", "task_reviews", ["task_id"])
    op.create_index("ix_task_reviews_result", "task_reviews", ["result"])

    op.create_table(
        "work_items",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("task_id", sa.String(length=64), sa.ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False),
        sa.Column("plan_version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("assigned_team", sa.String(length=128), nullable=False, server_default=""),
        sa.Column("owner_role", role_type, nullable=False, server_default="DeliveryManager"),
        sa.Column("status", work_item_status, nullable=False, server_default="Open"),
        sa.Column("priority", sa.String(length=16), nullable=False, server_default="normal"),
        sa.Column("acceptance_criteria", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("block_reason", sa.Text(), nullable=False, server_default=""),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("meta", sa.JSON(), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_work_items_task_id", "work_items", ["task_id"])
    op.create_index("ix_work_items_assigned_team", "work_items", ["assigned_team"])
    op.create_index("ix_work_items_status", "work_items", ["status"])

    op.create_table(
        "artifacts",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("task_id", sa.String(length=64), sa.ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False),
        sa.Column("work_item_id", sa.String(length=64), sa.ForeignKey("work_items.id", ondelete="CASCADE"), nullable=True),
        sa.Column("type", artifact_type, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("path_or_url", sa.Text(), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False, server_default=""),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_by_role", role_type, nullable=False),
        sa.Column("created_by_id", sa.String(length=128), nullable=False, server_default=""),
        sa.Column("meta", sa.JSON(), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_artifacts_task_id", "artifacts", ["task_id"])
    op.create_index("ix_artifacts_work_item_id", "artifacts", ["work_item_id"])

    op.create_table(
        "activity_events",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("task_id", sa.String(length=64), sa.ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False),
        sa.Column("topic", sa.String(length=128), nullable=False),
        sa.Column("entity_type", sa.String(length=64), nullable=False),
        sa.Column("entity_id", sa.String(length=64), nullable=False),
        sa.Column("actor_role", role_type, nullable=False),
        sa.Column("actor_id", sa.String(length=128), nullable=False, server_default=""),
        sa.Column("payload", sa.JSON(), nullable=False, server_default="{}"),
        sa.Column("meta", sa.JSON(), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_activity_events_task_id", "activity_events", ["task_id"])
    op.create_index("ix_activity_events_topic", "activity_events", ["topic"])
    op.create_index("ix_activity_events_created_at", "activity_events", ["created_at"])

    op.create_table(
        "intervention_logs",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("task_id", sa.String(length=64), sa.ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False),
        sa.Column("action", intervention_action, nullable=False),
        sa.Column("reason", sa.Text(), nullable=False, server_default=""),
        sa.Column("from_state", sa.String(length=64), nullable=False),
        sa.Column("to_state", sa.String(length=64), nullable=False),
        sa.Column("triggered_by_role", role_type, nullable=False),
        sa.Column("triggered_by_id", sa.String(length=128), nullable=False, server_default=""),
        sa.Column("meta", sa.JSON(), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_intervention_logs_task_id", "intervention_logs", ["task_id"])
    op.create_index("ix_intervention_logs_action", "intervention_logs", ["action"])
    op.create_index("ix_intervention_logs_created_at", "intervention_logs", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_intervention_logs_created_at", table_name="intervention_logs")
    op.drop_index("ix_intervention_logs_action", table_name="intervention_logs")
    op.drop_index("ix_intervention_logs_task_id", table_name="intervention_logs")
    op.drop_table("intervention_logs")

    op.drop_index("ix_activity_events_created_at", table_name="activity_events")
    op.drop_index("ix_activity_events_topic", table_name="activity_events")
    op.drop_index("ix_activity_events_task_id", table_name="activity_events")
    op.drop_table("activity_events")

    op.drop_index("ix_artifacts_work_item_id", table_name="artifacts")
    op.drop_index("ix_artifacts_task_id", table_name="artifacts")
    op.drop_table("artifacts")

    op.drop_index("ix_work_items_status", table_name="work_items")
    op.drop_index("ix_work_items_assigned_team", table_name="work_items")
    op.drop_index("ix_work_items_task_id", table_name="work_items")
    op.drop_table("work_items")

    op.drop_index("ix_task_reviews_result", table_name="task_reviews")
    op.drop_index("ix_task_reviews_task_id", table_name="task_reviews")
    op.drop_table("task_reviews")

    op.drop_index("ix_task_plans_task_id", table_name="task_plans")
    op.drop_table("task_plans")

    op.drop_index("ix_tasks_archived", table_name="tasks")
    op.drop_index("ix_tasks_state", table_name="tasks")
    op.drop_table("tasks")

    bind = op.get_bind()
    artifact_type.drop(bind, checkfirst=True)
    intervention_action.drop(bind, checkfirst=True)
    work_item_status.drop(bind, checkfirst=True)
    role_type.drop(bind, checkfirst=True)
    review_result.drop(bind, checkfirst=True)
    task_state.drop(bind, checkfirst=True)
