"""Migration round trip and model/migration parity, against a real PostgreSQL."""

from collections.abc import Callable
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import Engine, create_engine, inspect

EXPECTED_TABLES = {
    "users",
    "sessions",
    "days",
    "exercises",
    "exercise_revisions",
    "exercise_revision_answer_keys",
    "day_exercises",
    "learning_sessions",
    "attempts",
    "pronunciation_self_ratings",
    "day_progress",
    "activity_days",
    "topic_mastery",
    "user_vocabulary",
    "alembic_version",
}


def table_names(engine: Engine) -> set[str]:
    return set(inspect(engine).get_table_names())


def test_upgrade_downgrade_upgrade(
    engine: Engine, alembic_cfg: Config, reset_schema: Callable[[], None]
) -> None:
    reset_schema()

    command.upgrade(alembic_cfg, "head")
    assert table_names(engine) == EXPECTED_TABLES

    command.downgrade(alembic_cfg, "base")
    # Alembic keeps its own version table after a downgrade.
    assert table_names(engine) <= {"alembic_version"}

    command.upgrade(alembic_cfg, "head")
    assert table_names(engine) == EXPECTED_TABLES


def test_migrations_run_from_a_database_url_with_percent_escapes(
    database_url: str, monkeypatch: pytest.MonkeyPatch, reset_schema: Callable[[], None]
) -> None:
    reset_schema()
    separator = "&" if "?" in database_url else "?"
    monkeypatch.setenv("MIGRATION_DATABASE_URL", f"{database_url}{separator}application_name=english%20quest")
    config = Config(str(Path(__file__).resolve().parents[2] / "alembic.ini"))

    command.upgrade(config, "head")

    assert "exercise_revision_answer_keys" in table_names(create_engine(database_url))


def test_models_match_migrations(
    engine: Engine, alembic_cfg: Config, reset_schema: Callable[[], None]
) -> None:
    reset_schema()
    command.upgrade(alembic_cfg, "head")

    # `alembic check` raises when the models and the migrated schema differ.
    command.check(alembic_cfg)
