"""SQLAlchemy models for the MVP schema.

Design rules (see docs/prd/english-quest-prd.md and the architecture reports):

- ``exercise_revisions`` and ``attempts`` are immutable. Database triggers in
  the first migration reject UPDATE and DELETE on both tables, and TRUNCATE on
  ``attempts``.
- Answer keys live in ``exercise_revision_answer_keys``, which only the server
  role can read. Learner-facing queries never touch it.
- ``attempts`` is the source of truth for performance. ``day_progress``,
  ``activity_days``, ``topic_mastery`` and ``user_vocabulary`` are derived and
  can be rebuilt from attempts.
- Kind-specific payloads are JSONB. Structural columns (ids, status, scores,
  timestamps) stay relational so they can be constrained and indexed.
"""

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    Integer,
    Numeric,
    SmallInteger,
    Text,
    UniqueConstraint,
    Uuid,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from english_quest_api.db.base import Base

TIMESTAMP = DateTime(timezone=True)


class User(Base):
    """The course has one learner. The table holds at most one row."""

    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("email = lower(email)", name="email_lowercase"),
        CheckConstraint("single_learner", name="single_learner_only"),
        UniqueConstraint("single_learner", name="uq_users_single_learner"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(Text, unique=True)
    display_name: Mapped[str] = mapped_column(Text)
    password_hash: Mapped[str] = mapped_column(Text)
    # IANA time zone name, for example "Europe/Bucharest". Validated in the app.
    timezone: Mapped[str] = mapped_column(Text)
    single_learner: Mapped[bool] = mapped_column(Boolean, server_default=text("true"))
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now())


class AuthSession(Base):
    """A sign-in. Only the SHA-256 of the opaque cookie token is stored."""

    __tablename__ = "sessions"
    __table_args__ = (
        CheckConstraint("char_length(token_hash) = 64", name="token_hash_sha256_hex"),
        CheckConstraint("expires_at > created_at", name="expires_after_created"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    token_hash: Mapped[str] = mapped_column(Text, unique=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now())
    expires_at: Mapped[datetime] = mapped_column(TIMESTAMP)


class Day(Base):
    """One of the 30 course days. Ordered unlocking is handled by day_progress."""

    __tablename__ = "days"
    __table_args__ = (CheckConstraint("day_number BETWEEN 1 AND 30", name="day_number_range"),)

    day_number: Mapped[int] = mapped_column(SmallInteger, primary_key=True)
    title: Mapped[str] = mapped_column(Text)
    objective: Mapped[str] = mapped_column(Text)
    lesson_md: Mapped[str] = mapped_column(Text)
    review_md: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now())


class Exercise(Base):
    """A stable exercise identity. Its content lives in ``exercise_revisions``."""

    __tablename__ = "exercises"
    __table_args__ = (
        CheckConstraint("id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'", name="id_is_slug"),
        ForeignKeyConstraint(
            ["current_revision_id", "id"],
            ["exercise_revisions.id", "exercise_revisions.exercise_id"],
            name="current_revision_belongs_to_exercise",
            use_alter=True,
        ),
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    current_revision_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now())


class ExerciseRevision(Base):
    """An immutable version of an exercise. An edit inserts a new row."""

    __tablename__ = "exercise_revisions"
    __table_args__ = (
        UniqueConstraint("id", "exercise_id", name="uq_exercise_revisions_id_exercise_id"),
        UniqueConstraint("exercise_id", "revision_no", name="uq_exercise_revisions_exercise_revision_no"),
        UniqueConstraint("exercise_id", "content_hash", name="uq_exercise_revisions_exercise_content_hash"),
        CheckConstraint("revision_no >= 1", name="revision_no_positive"),
        CheckConstraint("kind_version >= 1", name="kind_version_positive"),
        CheckConstraint("char_length(content_hash) = 64", name="content_hash_sha256_hex"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    exercise_id: Mapped[str] = mapped_column(ForeignKey("exercises.id", ondelete="RESTRICT"))
    revision_no: Mapped[int] = mapped_column(Integer)
    # Exercise kind, for example "multiple_choice". Kinds are an app registry,
    # so adding a kind does not need a table change.
    kind: Mapped[str] = mapped_column(Text)
    kind_version: Mapped[int] = mapped_column(SmallInteger)
    envelope: Mapped[dict[str, Any]] = mapped_column(JSONB)
    content: Mapped[dict[str, Any]] = mapped_column(JSONB)
    # SHA-256 of the canonical envelope, content and answer key. Makes imports idempotent.
    content_hash: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now())


class ExerciseRevisionAnswerKey(Base):
    """The answer key of one revision. Only the english_quest_server role can read it."""

    __tablename__ = "exercise_revision_answer_keys"

    exercise_revision_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("exercise_revisions.id", ondelete="RESTRICT"), primary_key=True
    )
    answer_key: Mapped[Any] = mapped_column(JSONB)


class DayExercise(Base):
    """The ordered exercises that make up one day's lesson run."""

    __tablename__ = "day_exercises"
    __table_args__ = (
        UniqueConstraint("day_number", "position", name="uq_day_exercises_day_position"),
        CheckConstraint('"position" >= 1', name="position_positive"),
    )

    day_number: Mapped[int] = mapped_column(
        ForeignKey("days.day_number", ondelete="RESTRICT"), primary_key=True
    )
    exercise_id: Mapped[str] = mapped_column(
        ForeignKey("exercises.id", ondelete="RESTRICT"), primary_key=True, index=True
    )
    position: Mapped[int] = mapped_column(SmallInteger)
    required: Mapped[bool] = mapped_column(Boolean, server_default=text("true"))


class LearningSession(Base):
    """One run: a day's lesson run, a daily review, or a mixed review."""

    __tablename__ = "learning_sessions"
    __table_args__ = (
        CheckConstraint("type IN ('day', 'daily_review', 'mixed_review')", name="type_known"),
        CheckConstraint("(type = 'day') = (day_number IS NOT NULL)", name="day_number_for_day_runs"),
        CheckConstraint("completed_at IS NULL OR completed_at >= started_at", name="completed_after_started"),
        UniqueConstraint("id", "user_id", name="uq_learning_sessions_id_user_id"),
        Index("ix_learning_sessions_user_started", "user_id", "started_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"))
    type: Mapped[str] = mapped_column(Text)
    day_number: Mapped[int | None] = mapped_column(
        ForeignKey("days.day_number", ondelete="RESTRICT"), nullable=True
    )
    # Exercise ids chosen for this run, and why (for review selection).
    plan: Mapped[Any] = mapped_column(JSONB)
    started_at: Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(TIMESTAMP, nullable=True)


class Attempt(Base):
    """A graded answer. Append-only: triggers reject UPDATE, DELETE and TRUNCATE.

    One row per run and exercise, so a run cannot be re-graded. A retry is a
    new learning session with its own rows.
    """

    __tablename__ = "attempts"
    __table_args__ = (
        UniqueConstraint("learning_session_id", "exercise_id", name="uq_attempts_session_exercise"),
        UniqueConstraint("id", "user_id", name="uq_attempts_id_user_id"),
        ForeignKeyConstraint(
            ["learning_session_id", "user_id"],
            ["learning_sessions.id", "learning_sessions.user_id"],
            name="attempt_matches_session_learner",
            ondelete="RESTRICT",
        ),
        ForeignKeyConstraint(
            ["exercise_revision_id", "exercise_id"],
            ["exercise_revisions.id", "exercise_revisions.exercise_id"],
            name="revision_matches_exercise",
            ondelete="RESTRICT",
        ),
        Index(
            "uq_attempts_user_first_answer",
            "user_id",
            "exercise_id",
            unique=True,
            postgresql_where=text("is_first_attempt"),
        ),
        Index("ix_attempts_user_created", "user_id", "created_at"),
        CheckConstraint("is_scored = (points_available IS NOT NULL)", name="scored_matches_points"),
        CheckConstraint("(points_awarded IS NULL) = (points_available IS NULL)", name="points_pair_null"),
        CheckConstraint("points_available >= 0", name="points_available_non_negative"),
        CheckConstraint(
            "points_awarded >= 0 AND points_awarded <= points_available",
            name="points_awarded_within_available",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"))
    learning_session_id: Mapped[uuid.UUID] = mapped_column(Uuid)
    exercise_id: Mapped[str] = mapped_column(ForeignKey("exercises.id", ondelete="RESTRICT"))
    exercise_revision_id: Mapped[uuid.UUID] = mapped_column(Uuid)
    response: Mapped[Any] = mapped_column(JSONB)
    is_scored: Mapped[bool] = mapped_column(Boolean)
    points_awarded: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True)
    points_available: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True)
    feedback_code: Mapped[str] = mapped_column(Text)
    evaluator_version: Mapped[str] = mapped_column(Text)
    # True only for the learner's first-ever answer to this exercise. Accuracy
    # uses these rows alone; the partial unique index above enforces one per exercise.
    is_first_attempt: Mapped[bool] = mapped_column(Boolean)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now())


class PronunciationSelfRating(Base):
    """The learner's self-rating after a pronunciation recognition item.

    Recorded for progress, never scored. The rating labels are an open PRD
    decision (section 18, item 9), so the value is stored as short text.
    """

    __tablename__ = "pronunciation_self_ratings"
    __table_args__ = (
        CheckConstraint("char_length(rating) BETWEEN 1 AND 32", name="rating_length"),
        ForeignKeyConstraint(
            ["attempt_id", "user_id"],
            ["attempts.id", "attempts.user_id"],
            name="rating_matches_attempt_learner",
            ondelete="RESTRICT",
        ),
        Index("ix_pronunciation_self_ratings_user", "user_id"),
    )

    attempt_id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"))
    rating: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now())


class DayProgress(Base):
    """Derived per learner and day. Rebuildable from attempts."""

    __tablename__ = "day_progress"
    __table_args__ = (
        CheckConstraint("status IN ('locked', 'available', 'in_progress', 'completed')", name="status_known"),
        CheckConstraint("status <> 'completed' OR completed_at IS NOT NULL", name="completed_has_timestamp"),
        CheckConstraint(
            "best_score_pct IS NULL OR best_score_pct BETWEEN 0 AND 100",
            name="best_score_range",
        ),
        Index("ix_day_progress_user_status", "user_id", "status"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    day_number: Mapped[int] = mapped_column(
        ForeignKey("days.day_number", ondelete="RESTRICT"), primary_key=True
    )
    status: Mapped[str] = mapped_column(Text)
    best_score_pct: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(TIMESTAMP, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now())


class ActivityDay(Base):
    """One row per learner-local calendar day with any answer. Derived.

    Feeds the streak. Inserts are idempotent (ON CONFLICT DO NOTHING).
    """

    __tablename__ = "activity_days"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    local_date: Mapped[date] = mapped_column(Date, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now())


class TopicMastery(Base):
    """Smoothed accuracy per learner and topic. Derived, rebuildable from attempts."""

    __tablename__ = "topic_mastery"
    __table_args__ = (
        CheckConstraint("char_length(topic) > 0", name="topic_not_empty"),
        CheckConstraint("effective_n >= 0", name="effective_n_non_negative"),
        CheckConstraint("smoothed_accuracy BETWEEN 0 AND 1", name="smoothed_accuracy_range"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    topic: Mapped[str] = mapped_column(Text, primary_key=True)
    effective_n: Mapped[Decimal] = mapped_column(Numeric(10, 4))
    smoothed_accuracy: Mapped[Decimal] = mapped_column(Numeric(5, 4))
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now())


class UserVocabulary(Base):
    """Per learner and lemma. Derived from first-attempt vocabulary answers.

    A word is learned after correct answers on two separate local days.
    """

    __tablename__ = "user_vocabulary"
    __table_args__ = (
        CheckConstraint("char_length(lemma) > 0", name="lemma_not_empty"),
        CheckConstraint("correct_day_count >= 0", name="correct_day_count_non_negative"),
        CheckConstraint("incorrect_count >= 0", name="incorrect_count_non_negative"),
        CheckConstraint("learned_on IS NULL OR correct_day_count >= 2", name="learned_needs_two_days"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    lemma: Mapped[str] = mapped_column(Text, primary_key=True)
    first_seen_on: Mapped[date] = mapped_column(Date)
    last_correct_on: Mapped[date | None] = mapped_column(Date, nullable=True)
    correct_day_count: Mapped[int] = mapped_column(SmallInteger, server_default=text("0"))
    incorrect_count: Mapped[int] = mapped_column(SmallInteger, server_default=text("0"))
    learned_on: Mapped[date | None] = mapped_column(Date, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now())
