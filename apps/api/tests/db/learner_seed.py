"""The single learner that database tests seed."""

import uuid

from sqlalchemy import Connection, select
from sqlalchemy.dialects.postgresql import insert as postgresql_insert

from english_quest_api.db import models


def ensure_learner(conn: Connection) -> uuid.UUID:
    """Ensures the single learner exists and returns its id.

    Safe to call repeatedly and concurrently: the insert skips the row when the
    learner already exists, and the id is read back from the table.
    """
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
