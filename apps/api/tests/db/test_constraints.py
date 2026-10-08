"""Database-level guarantees: constraints, indexes, and append-only triggers."""

import uuid
from collections.abc import Callable
from typing import Any

import pytest
from sqlalchemy import Connection, insert, text
from sqlalchemy.exc import DBAPIError

from english_quest_api.db import models

HASH = "0" * 64


def assert_rejected(conn: Connection, action: Callable[[], object], match: str) -> None:
    """Run ``action`` inside a savepoint and assert the database rejects it."""
    with pytest.raises(DBAPIError, match=match), conn.begin_nested():
        action()


def insert_other_learner(conn: Connection) -> uuid.UUID:
    """A second learner, for cross-learner checks. Drops the single-learner rule for this test only."""
    conn.execute(text("ALTER TABLE users DROP CONSTRAINT uq_users_single_learner"))
    other_user_id = uuid.uuid4()
    conn.execute(
        insert(models.User).values(
            id=other_user_id,
            email="other@example.com",
            display_name="Other",
            password_hash="argon2id-placeholder",
            timezone="UTC",
        )
    )
    return other_user_id


def read_answer_key_as(conn: Connection, role: str, revision_id: uuid.UUID) -> Any:
    """Reads one answer key as ``role``. The role switch is rolled back before returning."""
    savepoint = conn.begin_nested()
    try:
        conn.execute(text(f"SET LOCAL ROLE {role}"))
        return conn.execute(
            text("SELECT answer_key FROM exercise_revision_answer_keys WHERE exercise_revision_id = :id"),
            {"id": revision_id},
        ).scalar_one()
    finally:
        savepoint.rollback()


def write_answer_key_as_server_role(conn: Connection, revision_id: uuid.UUID) -> None:
    conn.execute(text("SET LOCAL ROLE english_quest_server"))
    conn.execute(
        text("INSERT INTO exercise_revision_answer_keys (exercise_revision_id, answer_key) VALUES (:id, '{}')"),
        {"id": revision_id},
    )


def test_day_number_must_be_between_1_and_30(conn: Connection) -> None:
    assert_rejected(
        conn,
        lambda: conn.execute(
            insert(models.Day).values(day_number=31, title="x", objective="x", lesson_md="x", review_md="x")
        ),
        match="ck_days_day_number_range",
    )


def test_email_is_stored_lowercase(conn: Connection) -> None:
    assert_rejected(
        conn,
        lambda: conn.execute(
            insert(models.User).values(
                email="Learner@Example.com",
                display_name="Learner",
                password_hash="x",
                timezone="UTC",
            )
        ),
        match="ck_users_email_lowercase",
    )


def test_session_stores_only_a_sha256_hash(
    conn: Connection, seed: dict[str, Any], make_attempt: Callable[..., dict[str, Any]]
) -> None:
    assert_rejected(
        conn,
        lambda: conn.execute(
            insert(models.AuthSession).values(
                user_id=seed["user_id"],
                token_hash="not-a-sha256",
                expires_at=text("now() + interval '30 days'"),
            )
        ),
        match="ck_sessions_token_hash_sha256_hex",
    )


def test_exercise_id_must_be_a_slug(conn: Connection) -> None:
    assert_rejected(
        conn,
        lambda: conn.execute(insert(models.Exercise).values(id="Not A Slug")),
        match="ck_exercises_id_is_slug",
    )


def test_day_run_needs_a_day_and_other_runs_do_not(
    conn: Connection, seed: dict[str, Any], make_attempt: Callable[..., dict[str, Any]]
) -> None:
    assert_rejected(
        conn,
        lambda: conn.execute(
            insert(models.LearningSession).values(
                user_id=seed["user_id"], type="day", day_number=None, plan={}
            )
        ),
        match="ck_learning_sessions_day_number_for_day_runs",
    )
    assert_rejected(
        conn,
        lambda: conn.execute(
            insert(models.LearningSession).values(
                user_id=seed["user_id"], type="daily_review", day_number=1, plan={}
            )
        ),
        match="ck_learning_sessions_day_number_for_day_runs",
    )


def test_revision_content_is_unique_per_exercise(
    conn: Connection, seed: dict[str, Any], make_attempt: Callable[..., dict[str, Any]]
) -> None:
    assert_rejected(
        conn,
        lambda: conn.execute(
            insert(models.ExerciseRevision).values(
                id=uuid.uuid4(),
                exercise_id=seed["exercise_id"],
                revision_no=2,
                kind="multiple_choice",
                kind_version=1,
                envelope={},
                content={},
                content_hash=HASH,
            )
        ),
        match="uq_exercise_revisions_exercise_content_hash",
    )


def test_answer_keys_are_readable_only_through_the_server_role(
    conn: Connection, seed: dict[str, Any]
) -> None:
    conn.execute(text("CREATE ROLE learner_probe NOLOGIN"))
    conn.execute(
        text("GRANT USAGE ON SCHEMA public TO learner_probe, english_quest_server, english_quest_api")
    )
    assert_rejected(
        conn,
        lambda: read_answer_key_as(conn, "learner_probe", seed["revision_id"]),
        match="permission denied",
    )
    assert read_answer_key_as(conn, "english_quest_api", seed["revision_id"]) == {"correct": "went"}


def test_the_server_role_cannot_write_answer_keys(conn: Connection, seed: dict[str, Any]) -> None:
    conn.execute(text("GRANT USAGE ON SCHEMA public TO english_quest_server"))
    assert_rejected(
        conn,
        lambda: write_answer_key_as_server_role(conn, seed["revision_id"]),
        match="permission denied",
    )


def test_only_one_learner_can_exist(conn: Connection, seed: dict[str, Any]) -> None:
    assert_rejected(
        conn,
        lambda: conn.execute(
            insert(models.User).values(
                email="second@example.com",
                display_name="Second",
                password_hash="x",
                timezone="UTC",
            )
        ),
        match="uq_users_single_learner",
    )


def test_learner_seed_is_safe_to_repeat(conn: Connection, seed_learner: Callable[[], uuid.UUID]) -> None:
    first = seed_learner()
    assert seed_learner() == first
    assert conn.execute(text("SELECT count(*) FROM users")).scalar_one() == 1


def test_revisions_are_immutable(
    conn: Connection, seed: dict[str, Any], make_attempt: Callable[..., dict[str, Any]]
) -> None:
    assert_rejected(
        conn,
        lambda: conn.execute(
            text("UPDATE exercise_revisions SET content = '{}' WHERE id = :id"),
            {"id": seed["revision_id"]},
        ),
        match="immutable",
    )
    assert_rejected(
        conn,
        lambda: conn.execute(
            text("DELETE FROM exercise_revisions WHERE id = :id"), {"id": seed["revision_id"]}
        ),
        match="immutable",
    )


def test_attempt_must_reference_a_revision_of_its_exercise(
    conn: Connection, seed: dict[str, Any], make_attempt: Callable[..., dict[str, Any]]
) -> None:
    conn.execute(insert(models.Exercise).values(id="other-exercise"))
    assert_rejected(
        conn,
        lambda: conn.execute(
            insert(models.Attempt).values(**make_attempt(seed, exercise_id="other-exercise"))
        ),
        match="revision_matches_exercise",
    )


def test_a_run_cannot_grade_the_same_exercise_twice(
    conn: Connection, seed: dict[str, Any], make_attempt: Callable[..., dict[str, Any]]
) -> None:
    conn.execute(insert(models.Attempt).values(**make_attempt(seed)))
    assert_rejected(
        conn,
        lambda: conn.execute(insert(models.Attempt).values(**make_attempt(seed, is_first_attempt=False))),
        match="uq_attempts_session_exercise",
    )


def test_only_one_first_answer_per_learner_and_exercise(
    conn: Connection, seed: dict[str, Any], make_attempt: Callable[..., dict[str, Any]]
) -> None:
    conn.execute(insert(models.Attempt).values(**make_attempt(seed)))

    second_run = uuid.uuid4()
    conn.execute(
        insert(models.LearningSession).values(
            id=second_run, user_id=seed["user_id"], type="day", day_number=1, plan={}
        )
    )
    assert_rejected(
        conn,
        lambda: conn.execute(
            insert(models.Attempt).values(**make_attempt(seed, learning_session_id=second_run))
        ),
        match="uq_attempts_user_first_answer",
    )

    # A retry in a new run is allowed and is not a first answer.
    conn.execute(
        insert(models.Attempt).values(
            **make_attempt(seed, learning_session_id=second_run, is_first_attempt=False)
        )
    )


def test_attempts_are_append_only(
    conn: Connection, seed: dict[str, Any], make_attempt: Callable[..., dict[str, Any]]
) -> None:
    attempt_id = uuid.uuid4()
    conn.execute(insert(models.Attempt).values(**make_attempt(seed, id=attempt_id)))
    assert_rejected(
        conn,
        lambda: conn.execute(
            text("UPDATE attempts SET points_awarded = 1, points_available = 1 WHERE id = :id"),
            {"id": attempt_id},
        ),
        match="append-only",
    )
    assert_rejected(
        conn,
        lambda: conn.execute(text("DELETE FROM attempts WHERE id = :id"), {"id": attempt_id}),
        match="append-only",
    )


def test_attempts_cannot_be_truncated(
    conn: Connection, seed: dict[str, Any], make_attempt: Callable[..., dict[str, Any]]
) -> None:
    conn.execute(insert(models.Attempt).values(**make_attempt(seed)))
    assert_rejected(
        conn,
        lambda: conn.execute(text("TRUNCATE attempts, pronunciation_self_ratings")),
        match="append-only",
    )
    remaining = conn.execute(text("SELECT count(*) FROM attempts")).scalar_one()
    assert remaining == 1


def test_attempt_must_belong_to_its_sessions_learner(
    conn: Connection, seed: dict[str, Any], make_attempt: Callable[..., dict[str, Any]]
) -> None:
    other_user_id = insert_other_learner(conn)
    assert_rejected(
        conn,
        lambda: conn.execute(insert(models.Attempt).values(**make_attempt(seed, user_id=other_user_id))),
        match="attempt_matches_session_learner",
    )


def test_points_must_fit_the_available_points(
    conn: Connection, seed: dict[str, Any], make_attempt: Callable[..., dict[str, Any]]
) -> None:
    assert_rejected(
        conn,
        lambda: conn.execute(
            insert(models.Attempt).values(**make_attempt(seed, points_awarded=2, points_available=1))
        ),
        match="ck_attempts_points_awarded_within_available",
    )


def test_scored_attempts_must_have_points(
    conn: Connection, seed: dict[str, Any], make_attempt: Callable[..., dict[str, Any]]
) -> None:
    assert_rejected(
        conn,
        lambda: conn.execute(
            insert(models.Attempt).values(
                **make_attempt(seed, is_scored=True, points_awarded=None, points_available=None)
            )
        ),
        match="ck_attempts_scored_matches_points",
    )


def test_completed_day_needs_a_completion_time(
    conn: Connection, seed: dict[str, Any], make_attempt: Callable[..., dict[str, Any]]
) -> None:
    assert_rejected(
        conn,
        lambda: conn.execute(
            insert(models.DayProgress).values(
                user_id=seed["user_id"], day_number=1, status="completed", completed_at=None
            )
        ),
        match="ck_day_progress_completed_has_timestamp",
    )


def test_vocabulary_is_learned_only_after_two_correct_days(
    conn: Connection, seed: dict[str, Any], make_attempt: Callable[..., dict[str, Any]]
) -> None:
    assert_rejected(
        conn,
        lambda: conn.execute(
            insert(models.UserVocabulary).values(
                user_id=seed["user_id"],
                lemma="shop",
                first_seen_on=text("current_date"),
                correct_day_count=1,
                learned_on=text("current_date"),
            )
        ),
        match="ck_user_vocabulary_learned_needs_two_days",
    )


def test_self_rating_is_recorded_per_attempt(
    conn: Connection, seed: dict[str, Any], make_attempt: Callable[..., dict[str, Any]]
) -> None:
    attempt_id = uuid.uuid4()
    conn.execute(
        insert(models.Attempt).values(
            **make_attempt(seed, id=attempt_id, is_scored=False, points_available=None, points_awarded=None)
        )
    )
    conn.execute(
        insert(models.PronunciationSelfRating).values(
            attempt_id=attempt_id, user_id=seed["user_id"], rating="Needs practice"
        )
    )
    assert_rejected(
        conn,
        lambda: conn.execute(
            insert(models.PronunciationSelfRating).values(
                attempt_id=attempt_id, user_id=seed["user_id"], rating="Got it"
            )
        ),
        match="pk_pronunciation_self_ratings",
    )


def test_self_rating_must_belong_to_the_attempts_learner(
    conn: Connection, seed: dict[str, Any], make_attempt: Callable[..., dict[str, Any]]
) -> None:
    attempt_id = uuid.uuid4()
    conn.execute(insert(models.Attempt).values(**make_attempt(seed, id=attempt_id)))
    other_user_id = insert_other_learner(conn)
    assert_rejected(
        conn,
        lambda: conn.execute(
            insert(models.PronunciationSelfRating).values(
                attempt_id=attempt_id, user_id=other_user_id, rating="Got it"
            )
        ),
        match="rating_matches_attempt_learner",
    )
