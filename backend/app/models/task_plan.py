from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from ..db import Base
from .enums import RoleType


JSONType = JSONB().with_variant(JSON(), "sqlite")


class TaskPlan(Base):
    __tablename__ = "task_plans"
    __table_args__ = (
        UniqueConstraint("task_id", "version", name="uq_task_plans_task_version"),
    )

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id", ondelete="CASCADE"), index=True, nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    goal: Mapped[str] = mapped_column(Text, nullable=False)
    scope: Mapped[list] = mapped_column(JSONType, default=list, nullable=False)
    out_of_scope: Mapped[list] = mapped_column(JSONType, default=list, nullable=False)
    acceptance_criteria: Mapped[list] = mapped_column(JSONType, default=list, nullable=False)
    required_teams: Mapped[list] = mapped_column(JSONType, default=list, nullable=False)
    estimated_effort: Mapped[str] = mapped_column(String(64), default="", nullable=False)
    risks: Mapped[list] = mapped_column(JSONType, default=list, nullable=False)
    assumptions: Mapped[list] = mapped_column(JSONType, default=list, nullable=False)
    notes: Mapped[str] = mapped_column(Text, default="", nullable=False)
    created_by_role: Mapped[RoleType] = mapped_column(
        Enum(RoleType, name="role_type"),
        nullable=False,
    )
    created_by_id: Mapped[str] = mapped_column(String(128), default="", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
