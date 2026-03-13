from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from ..db import Base
from .enums import ReviewResult, RoleType


JSONType = JSONB().with_variant(JSON(), "sqlite")


class TaskReview(Base):
    __tablename__ = "task_reviews"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id", ondelete="CASCADE"), index=True, nullable=False)
    plan_version: Mapped[int] = mapped_column(Integer, nullable=False)
    review_round: Mapped[int] = mapped_column(Integer, nullable=False)
    reviewer_role: Mapped[RoleType] = mapped_column(
        Enum(RoleType, name="role_type"),
        nullable=False,
    )
    reviewer_id: Mapped[str] = mapped_column(String(128), default="", nullable=False)
    result: Mapped[ReviewResult] = mapped_column(
        Enum(ReviewResult, name="review_result"),
        nullable=False,
        index=True,
    )
    comments: Mapped[list] = mapped_column(JSONType, default=list, nullable=False)
    summary: Mapped[str] = mapped_column(Text, default="", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
