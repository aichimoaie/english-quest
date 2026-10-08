"""Fixtures for database tests.

These tests run against a real PostgreSQL. Set TEST_DATABASE_URL to a disposable
database: every test run drops and recreates the public schema.
Without it, the database tests are skipped.
"""

import os
import uuid
from collections.abc import Callable, Iterator
from pathlib import Path
from typing import Any

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import Connection, Engine, create_engine, insert, select, text
from sqlalchemy.dialects.postgresql import insert as postgresql_insert

from english_quest_api.db import models

API_ROOT = Path(__file__).resolve().parents[2]


@pytest.fixture(scope="session")
def database_url() -> str:
    url = os.environ.get("TEST_DATABASE_URL")
    if not url:
        pytest.skip("TEST_DATABASE_URL is not set; database tests need a PostgreSQL database")
    return url


@pytest.fixture(scope="session")
def alembic_cfg(database_url: str) -> Config:
    config = Config(str(API_ROOT / "alembic.ini"))
    # configparser treats "%" specially, so escape it in the URL.
    config.set_main_option("sqlalchemy.url", database_url.replace("%", "%%"))
    return config


@pytest.fixture
def reset_schema(engine: Engine) -> Callable[[], None]:
    """Returns a function that empties the public schema."""

    def reset() -> None:
        with engine.begin() as connection:
            connection.execute(text("DROP SCHEMA public CASCADE"))
            connection.execute(text("CREATE SCHEMA public"))

    return reset


@pytest.fixture(scope="session")
def engine(database_url: str, alembic_cfg: Config) -> Iterator[Engine]:
    engine = create_engine(database_url)
    with engine.begin() as connection:
        connection.execute(text("DROP SCHEMA public CASCADE"))
        connection.execute(text("CREATE SCHEMA public"))
    command.upgrade(alembic_cfg, "head")
    yield engine
    engine.dispose()


@pytest.fixture
def conn(engine: Engine) -> Iterator[Connection]:
    """A connection whose work is rolled back after the test."""
    with engine.connect() as connection:
        transaction = connection.begin()
        yield connection
        transaction.rollback()


HASH = "0" * 64


@pytest.fixture
def seed_learner(conn: Connection) -> Callable[[], uuid.UUID]:
    """Returns a function that ensures the single learner exists and returns its id.

    Safe to call repeatedly and concurrently: the insert skips the row when the
    learner already exists, and the id is read back from the table.
    """

    def ensure_learner() -> uuid.UUID:
        conn.execute(
            postgresql_insert(models.User)
            .values(
                email="learner@example.com",
                display_name="Learner",
                password_hash="argon2id-placeholder",
                timezone="Europe/Bucharest",
            )
            .on_conflict_do_nothing(index_elements=["single_learner"])
        )
        return conn.execute(select(models.User.id)).scalar_one()

    return ensure_learner


@pytest.fixture
def seed(conn: Connection, seed_learner: Callable[[], uuid.UUID]) -> dict[str, Any]:
    """Insert one user, day 1, one exercise with a revision, and a day run."""
    user_id = seed_learner()
    revision_id = uuid.uuid4()
    session_id = uuid.uuid4()
    exercise_id = "past-simple-choice"

    conn.execute(
        insert(models.Day).values(
            day_number=1,
            title="Day one",
            objective="Use the past simple",
            lesson_md="Lesson",
            review_md="Review",
        )
    )
    conn.execute(insert(models.Exercise).values(id=exercise_id))
    conn.execute(
        insert(models.ExerciseRevision).values(
            id=revision_id,
            exercise_id=exercise_id,
            revision_no=1,
            kind="multiple_choice",
            kind_version=1,
            envelope={"schema": "english-quest/exercise-envelope/v1"},
            content={"prompt": "Yesterday I ___ home."},
            content_hash=HASH,
        )
    )
    conn.execute(
        insert(models.ExerciseRevisionAnswerKey).values(
            exercise_revision_id=revision_id, answer_key={"correct": "went"}
        )
    )
    conn.execute(
        insert(models.LearningSession).values(
            id=session_id,
            user_id=user_id,
            type="day",
            day_number=1,
            plan={"exercises": [exercise_id]},
        )
    )
    return {
        "user_id": user_id,
        "revision_id": revision_id,
        "session_id": session_id,
        "exercise_id": exercise_id,
    }


@pytest.fixture
def make_attempt() -> Callable[..., dict[str, Any]]:
    """Build attempt column values for the seeded graph; override any column by keyword."""

    def build(seed: dict[str, Any], **overrides: Any) -> dict[str, Any]:
        values: dict[str, Any] = {
            "id": uuid.uuid4(),
            "user_id": seed["user_id"],
            "learning_session_id": seed["session_id"],
            "exercise_id": seed["exercise_id"],
            "exercise_revision_id": seed["revision_id"],
            "response": {"choice": "went"},
            "is_scored": True,
            "points_awarded": 1,
            "points_available": 1,
            "feedback_code": "correct",
            "evaluator_version": "1",
            "is_first_attempt": True,
        }
        values.update(overrides)
        return values

    return build
