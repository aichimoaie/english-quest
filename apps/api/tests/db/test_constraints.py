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
                answer_key={},
                content_hash=HASH,
            )
        ),
        match="uq_exercise_revisions_exercise_content_hash",
    )


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
