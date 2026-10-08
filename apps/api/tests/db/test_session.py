"""The request-scoped session dependency rolls back work that was never committed."""

import pytest
from sqlalchemy import Engine, func, select
from sqlalchemy.orm import sessionmaker

from english_quest_api.db import models
from english_quest_api.db import session as session_module


def test_database_url_is_required(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("DATABASE_URL", raising=False)

    with pytest.raises(RuntimeError, match="DATABASE_URL is not set"):
        session_module.database_url()


def test_uncommitted_work_is_rolled_back_when_the_request_ends(
    engine: Engine, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(session_module, "get_session_factory", lambda: sessionmaker(bind=engine))

    dependency = session_module.get_db_session()
    session = next(dependency)
    session.add(
        models.User(
            email="uncommitted@example.com",
            display_name="Never saved",
            password_hash="argon2id-placeholder",
            timezone="UTC",
        )
    )
    session.flush()
    dependency.close()

    with engine.connect() as connection:
        count = connection.execute(
            select(func.count())
            .select_from(models.User.__table__)
            .where(models.User.__table__.c.email == "uncommitted@example.com")
        ).scalar_one()
    assert count == 0
