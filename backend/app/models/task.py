from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Enum, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from ..db import Base
from .enums import RoleType, TaskState


JSONType = JSONB().with_variant(JSON(), "sqlite")


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    summary: Mapped[str] = mapped_column(Text, default="", nullable=False)
    state: Mapped[TaskState] = mapped_column(
        Enum(TaskState, name="task_state"),
        default=TaskState.New,
        nullable=False,
        index=True,
    )
    priority: Mapped[str] = mapped_column(String(16), default="normal", nullable=False)
    request_type: Mapped[str] = mapped_column(String(64), default="project_request", nullable=False)
    source: Mapped[str] = mapped_column(String(64), default="manual", nullable=False)
    requester: Mapped[str] = mapped_column(String(128), default="", nullable=False)
    owner_role: Mapped[RoleType] = mapped_column(
        Enum(RoleType, name="role_type"),
        default=RoleType.IntakeCoordinator,
        nullable=False,
    )
    owner_team: Mapped[str] = mapped_column(String(128), default="", nullable=False)
    current_plan_version: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    review_round: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    blocked_reason: Mapped[str] = mapped_column(Text, default="", nullable=False)
    acceptance_summary: Mapped[str] = mapped_column(Text, default="", nullable=False)
    tags: Mapped[list] = mapped_column(JSONType, default=list, nullable=False)
    meta: Mapped[dict] = mapped_column(JSONType, default=dict, nullable=False)
    archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

