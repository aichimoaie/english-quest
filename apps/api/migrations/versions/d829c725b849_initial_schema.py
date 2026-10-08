"""initial schema

Creates the MVP tables: users, sessions, days, exercises and their immutable
revisions, day_exercises, learning_sessions, attempts (append-only),
pronunciation_self_ratings, and the derived day_progress, activity_days,
topic_mastery and user_vocabulary.

Roles. The owner role runs migrations (MIGRATION_DATABASE_URL). The API connects
as the english_quest_api login role (DATABASE_URL), which is a member of the
NOLOGIN english_quest_server role. Only english_quest_server can read answer
keys. Infrastructure sets the english_quest_api password outside this revision.

Revision ID: d829c725b849
Revises:
Create Date: 2026-10-08 20:35:28.046126

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "d829c725b849"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# Content is imported by the owner, so the API role only reads it. Attempts are
# appended, never changed; the triggers below also reject UPDATE and DELETE.
API_TABLE_PRIVILEGES: dict[str, str] = {
    "days": "SELECT",
    "exercises": "SELECT",
    "exercise_revisions": "SELECT",
    "day_exercises": "SELECT",
    "users": "SELECT, INSERT, UPDATE",
    "sessions": "SELECT, INSERT, DELETE",
    "learning_sessions": "SELECT, INSERT, UPDATE",
    "attempts": "SELECT, INSERT",
    "pronunciation_self_ratings": "SELECT, INSERT",
    "day_progress": "SELECT, INSERT, UPDATE, DELETE",
    "activity_days": "SELECT, INSERT, UPDATE, DELETE",
    "topic_mastery": "SELECT, INSERT, UPDATE, DELETE",
    "user_vocabulary": "SELECT, INSERT, UPDATE, DELETE",
}


def upgrade() -> None:
    op.create_table(
        "days",
        sa.Column("day_number", sa.SmallInteger(), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("objective", sa.Text(), nullable=False),
        sa.Column("lesson_md", sa.Text(), nullable=False),
        sa.Column("review_md", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("day_number BETWEEN 1 AND 30", name=op.f("ck_days_day_number_range")),
        sa.PrimaryKeyConstraint("day_number", name=op.f("pk_days")),
    )
    # current_revision_id and its foreign key are added after exercise_revisions exists.
    op.create_table(
        "exercises",
        sa.Column("id", sa.Text(), nullable=False),
        sa.Column("current_revision_id", sa.Uuid(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'", name=op.f("ck_exercises_id_is_slug")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_exercises")),
    )
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("email", sa.Text(), nullable=False),
        sa.Column("display_name", sa.Text(), nullable=False),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column("timezone", sa.Text(), nullable=False),
        sa.Column("single_learner", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("email = lower(email)", name=op.f("ck_users_email_lowercase")),
        sa.CheckConstraint("single_learner", name=op.f("ck_users_single_learner_only")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_users")),
        sa.UniqueConstraint("email", name=op.f("uq_users_email")),
        sa.UniqueConstraint("single_learner", name="uq_users_single_learner"),
    )
    op.create_table(
        "exercise_revisions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("exercise_id", sa.Text(), nullable=False),
        sa.Column("revision_no", sa.Integer(), nullable=False),
        sa.Column("kind", sa.Text(), nullable=False),
        sa.Column("kind_version", sa.SmallInteger(), nullable=False),
        sa.Column("envelope", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("content", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("content_hash", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint(
            "char_length(content_hash) = 64", name=op.f("ck_exercise_revisions_content_hash_sha256_hex")
        ),
        sa.CheckConstraint("kind_version >= 1", name=op.f("ck_exercise_revisions_kind_version_positive")),
        sa.CheckConstraint("revision_no >= 1", name=op.f("ck_exercise_revisions_revision_no_positive")),
        sa.ForeignKeyConstraint(
            ["exercise_id"],
            ["exercises.id"],
            name=op.f("fk_exercise_revisions_exercise_id_exercises"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_exercise_revisions")),
        sa.UniqueConstraint(
            "exercise_id", "content_hash", name="uq_exercise_revisions_exercise_content_hash"
        ),
        sa.UniqueConstraint("exercise_id", "revision_no", name="uq_exercise_revisions_exercise_revision_no"),
        sa.UniqueConstraint("id", "exercise_id", name="uq_exercise_revisions_id_exercise_id"),
    )
    op.create_foreign_key(
        "current_revision_belongs_to_exercise",
        "exercises",
        "exercise_revisions",
        ["current_revision_id", "id"],
        ["id", "exercise_id"],
    )
    op.create_table(
        "exercise_revision_answer_keys",
        sa.Column("exercise_revision_id", sa.Uuid(), nullable=False),
        sa.Column("answer_key", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.ForeignKeyConstraint(
            ["exercise_revision_id"],
            ["exercise_revisions.id"],
            name=op.f("fk_exercise_revision_answer_keys_exercise_revision_id_exercise_revisions"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("exercise_revision_id", name=op.f("pk_exercise_revision_answer_keys")),
    )
    # Learner-facing queries never read answer keys. Only the server role may.
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'english_quest_server') THEN
                CREATE ROLE english_quest_server NOLOGIN;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'english_quest_api') THEN
                CREATE ROLE english_quest_api LOGIN;
            END IF;
        END
        $$;
        """
    )
    op.execute("GRANT english_quest_server TO english_quest_api")
    op.execute("REVOKE ALL ON exercise_revision_answer_keys FROM PUBLIC")
    op.execute("GRANT SELECT ON exercise_revision_answer_keys TO english_quest_server")
    op.create_table(
        "sessions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("token_hash", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("char_length(token_hash) = 64", name=op.f("ck_sessions_token_hash_sha256_hex")),
        sa.CheckConstraint("expires_at > created_at", name=op.f("ck_sessions_expires_after_created")),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name=op.f("fk_sessions_user_id_users"), ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_sessions")),
        sa.UniqueConstraint("token_hash", name=op.f("uq_sessions_token_hash")),
    )
    op.create_index(op.f("ix_sessions_user_id"), "sessions", ["user_id"], unique=False)
    op.create_table(
        "day_exercises",
        sa.Column("day_number", sa.SmallInteger(), nullable=False),
        sa.Column("exercise_id", sa.Text(), nullable=False),
        sa.Column("position", sa.SmallInteger(), nullable=False),
        sa.Column("required", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.CheckConstraint('"position" >= 1', name=op.f("ck_day_exercises_position_positive")),
        sa.ForeignKeyConstraint(
            ["day_number"],
            ["days.day_number"],
            name=op.f("fk_day_exercises_day_number_days"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["exercise_id"],
            ["exercises.id"],
            name=op.f("fk_day_exercises_exercise_id_exercises"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("day_number", "exercise_id", name=op.f("pk_day_exercises")),
        sa.UniqueConstraint("day_number", "position", name="uq_day_exercises_day_position"),
    )
    op.create_index(op.f("ix_day_exercises_exercise_id"), "day_exercises", ["exercise_id"], unique=False)
    op.create_table(
        "learning_sessions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("type", sa.Text(), nullable=False),
        sa.Column("day_number", sa.SmallInteger(), nullable=True),
        sa.Column("plan", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "(type = 'day') = (day_number IS NOT NULL)",
            name=op.f("ck_learning_sessions_day_number_for_day_runs"),
        ),
        sa.CheckConstraint(
            "type IN ('day', 'daily_review', 'mixed_review')", name=op.f("ck_learning_sessions_type_known")
        ),
        sa.CheckConstraint(
            "completed_at IS NULL OR completed_at >= started_at",
            name=op.f("ck_learning_sessions_completed_after_started"),
        ),
        sa.ForeignKeyConstraint(
            ["day_number"],
            ["days.day_number"],
            name=op.f("fk_learning_sessions_day_number_days"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name=op.f("fk_learning_sessions_user_id_users"), ondelete="RESTRICT"
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_learning_sessions")),
        sa.UniqueConstraint("id", "user_id", name="uq_learning_sessions_id_user_id"),
    )
    op.create_index(
        "ix_learning_sessions_user_started", "learning_sessions", ["user_id", "started_at"], unique=False
    )
    op.create_table(
        "attempts",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("learning_session_id", sa.Uuid(), nullable=False),
        sa.Column("exercise_id", sa.Text(), nullable=False),
        sa.Column("exercise_revision_id", sa.Uuid(), nullable=False),
        sa.Column("response", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("is_scored", sa.Boolean(), nullable=False),
        sa.Column("points_awarded", sa.Numeric(precision=6, scale=2), nullable=True),
        sa.Column("points_available", sa.Numeric(precision=6, scale=2), nullable=True),
        sa.Column("feedback_code", sa.Text(), nullable=False),
        sa.Column("evaluator_version", sa.Text(), nullable=False),
        sa.Column("is_first_attempt", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint(
            "(points_awarded IS NULL) = (points_available IS NULL)", name=op.f("ck_attempts_points_pair_null")
        ),
        sa.CheckConstraint(
            "is_scored = (points_available IS NOT NULL)", name=op.f("ck_attempts_scored_matches_points")
        ),
        sa.CheckConstraint("points_available >= 0", name=op.f("ck_attempts_points_available_non_negative")),
        sa.CheckConstraint(
            "points_awarded >= 0 AND points_awarded <= points_available",
            name=op.f("ck_attempts_points_awarded_within_available"),
        ),
        sa.ForeignKeyConstraint(
            ["exercise_id"],
            ["exercises.id"],
            name=op.f("fk_attempts_exercise_id_exercises"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["exercise_revision_id", "exercise_id"],
            ["exercise_revisions.id", "exercise_revisions.exercise_id"],
            name="revision_matches_exercise",
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["learning_session_id", "user_id"],
            ["learning_sessions.id", "learning_sessions.user_id"],
            name="attempt_matches_session_learner",
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name=op.f("fk_attempts_user_id_users"), ondelete="RESTRICT"
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_attempts")),
        sa.UniqueConstraint("learning_session_id", "exercise_id", name="uq_attempts_session_exercise"),
        sa.UniqueConstraint("id", "user_id", name="uq_attempts_id_user_id"),
    )
    op.create_index("ix_attempts_user_created", "attempts", ["user_id", "created_at"], unique=False)
    op.create_index(
        "uq_attempts_user_first_answer",
        "attempts",
        ["user_id", "exercise_id"],
        unique=True,
        postgresql_where=sa.text("is_first_attempt"),
    )
    op.create_table(
        "pronunciation_self_ratings",
        sa.Column("attempt_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("rating", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint(
            "char_length(rating) BETWEEN 1 AND 32", name=op.f("ck_pronunciation_self_ratings_rating_length")
        ),
        sa.ForeignKeyConstraint(
            ["attempt_id", "user_id"],
            ["attempts.id", "attempts.user_id"],
            name="rating_matches_attempt_learner",
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name=op.f("fk_pronunciation_self_ratings_user_id_users"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("attempt_id", name=op.f("pk_pronunciation_self_ratings")),
    )
    op.create_index(
        "ix_pronunciation_self_ratings_user", "pronunciation_self_ratings", ["user_id"], unique=False
    )
    op.create_table(
        "day_progress",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("day_number", sa.SmallInteger(), nullable=False),
        sa.Column("status", sa.Text(), nullable=False),
        sa.Column("best_score_pct", sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint(
            "status <> 'completed' OR completed_at IS NOT NULL",
            name=op.f("ck_day_progress_completed_has_timestamp"),
        ),
        sa.CheckConstraint(
            "status IN ('locked', 'available', 'in_progress', 'completed')",
            name=op.f("ck_day_progress_status_known"),
        ),
        sa.CheckConstraint(
            "best_score_pct IS NULL OR best_score_pct BETWEEN 0 AND 100",
            name=op.f("ck_day_progress_best_score_range"),
        ),
        sa.ForeignKeyConstraint(
            ["day_number"],
            ["days.day_number"],
            name=op.f("fk_day_progress_day_number_days"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name=op.f("fk_day_progress_user_id_users"), ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("user_id", "day_number", name=op.f("pk_day_progress")),
    )
    op.create_index("ix_day_progress_user_status", "day_progress", ["user_id", "status"], unique=False)
    op.create_table(
        "activity_days",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("local_date", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name=op.f("fk_activity_days_user_id_users"), ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("user_id", "local_date", name=op.f("pk_activity_days")),
    )
    op.create_table(
        "topic_mastery",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("topic", sa.Text(), nullable=False),
        sa.Column("effective_n", sa.Numeric(precision=10, scale=4), nullable=False),
        sa.Column("smoothed_accuracy", sa.Numeric(precision=5, scale=4), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("char_length(topic) > 0", name=op.f("ck_topic_mastery_topic_not_empty")),
        sa.CheckConstraint("effective_n >= 0", name=op.f("ck_topic_mastery_effective_n_non_negative")),
        sa.CheckConstraint(
            "smoothed_accuracy BETWEEN 0 AND 1", name=op.f("ck_topic_mastery_smoothed_accuracy_range")
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name=op.f("fk_topic_mastery_user_id_users"), ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("user_id", "topic", name=op.f("pk_topic_mastery")),
    )
    op.create_table(
        "user_vocabulary",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("lemma", sa.Text(), nullable=False),
        sa.Column("first_seen_on", sa.Date(), nullable=False),
        sa.Column("last_correct_on", sa.Date(), nullable=True),
        sa.Column("correct_day_count", sa.SmallInteger(), server_default=sa.text("0"), nullable=False),
        sa.Column("incorrect_count", sa.SmallInteger(), server_default=sa.text("0"), nullable=False),
        sa.Column("learned_on", sa.Date(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("char_length(lemma) > 0", name=op.f("ck_user_vocabulary_lemma_not_empty")),
        sa.CheckConstraint(
            "correct_day_count >= 0", name=op.f("ck_user_vocabulary_correct_day_count_non_negative")
        ),
        sa.CheckConstraint(
            "incorrect_count >= 0", name=op.f("ck_user_vocabulary_incorrect_count_non_negative")
        ),
        sa.CheckConstraint(
            "learned_on IS NULL OR correct_day_count >= 2",
            name=op.f("ck_user_vocabulary_learned_needs_two_days"),
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name=op.f("fk_user_vocabulary_user_id_users"), ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("user_id", "lemma", name=op.f("pk_user_vocabulary")),
    )

    # Immutability is enforced in the database, not only in the application.
    # Attempts are append-only, and exercise revisions never change once written.
    op.execute(
        """
        CREATE FUNCTION forbid_mutation() RETURNS trigger AS $$
        BEGIN
            RAISE EXCEPTION 'table % is append-only or immutable: % is not allowed', TG_TABLE_NAME, TG_OP;
        END;
        $$ LANGUAGE plpgsql;
        """
    )
    op.execute(
        """
        CREATE TRIGGER attempts_append_only
        BEFORE UPDATE OR DELETE ON attempts
        FOR EACH ROW EXECUTE FUNCTION forbid_mutation();
        """
    )
    op.execute(
        """
        CREATE TRIGGER attempts_no_truncate
        BEFORE TRUNCATE ON attempts
        FOR EACH STATEMENT EXECUTE FUNCTION forbid_mutation();
        """
    )
    op.execute(
        """
        CREATE TRIGGER exercise_revisions_immutable
        BEFORE UPDATE OR DELETE ON exercise_revisions
        FOR EACH ROW EXECUTE FUNCTION forbid_mutation();
        """
    )

    for table, privileges in API_TABLE_PRIVILEGES.items():
        op.execute(f"GRANT {privileges} ON {table} TO english_quest_api")


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS exercise_revisions_immutable ON exercise_revisions")
    op.execute("DROP TRIGGER IF EXISTS attempts_no_truncate ON attempts")
    op.execute("DROP TRIGGER IF EXISTS attempts_append_only ON attempts")
    op.execute("DROP FUNCTION IF EXISTS forbid_mutation()")

    op.drop_table("user_vocabulary")
    op.drop_table("topic_mastery")
    op.drop_table("activity_days")
    op.drop_index("ix_day_progress_user_status", table_name="day_progress")
    op.drop_table("day_progress")
    op.drop_index("ix_pronunciation_self_ratings_user", table_name="pronunciation_self_ratings")
    op.drop_table("pronunciation_self_ratings")
    op.drop_index(
        "uq_attempts_user_first_answer", table_name="attempts", postgresql_where=sa.text("is_first_attempt")
    )
    op.drop_index("ix_attempts_user_created", table_name="attempts")
    op.drop_table("attempts")
    op.drop_index("ix_learning_sessions_user_started", table_name="learning_sessions")
    op.drop_table("learning_sessions")
    op.drop_index(op.f("ix_day_exercises_exercise_id"), table_name="day_exercises")
    op.drop_table("day_exercises")
    op.drop_index(op.f("ix_sessions_user_id"), table_name="sessions")
    op.drop_table("sessions")
    # Break the exercises <-> exercise_revisions cycle before dropping either table.
    op.drop_constraint("current_revision_belongs_to_exercise", "exercises", type_="foreignkey")
    op.drop_table("exercise_revision_answer_keys")
    op.drop_table("exercise_revisions")
    op.drop_table("exercises")
    op.drop_table("users")
    op.drop_table("days")
