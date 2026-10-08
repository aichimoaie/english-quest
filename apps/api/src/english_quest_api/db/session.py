"""Database engine and the request-scoped session dependency.

Commits are explicit: a service calls ``session.commit()`` once its unit of
work is complete. A session that is closed without a commit rolls back, so an
exception in a request never leaves partial writes behind.
"""

import os
from collections.abc import Generator
from typing import Annotated

from fastapi import Depends
from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

# Local development default for a PostgreSQL server on localhost.
# Dev and prod set DATABASE_URL from their own secret store.
LOCAL_DATABASE_URL = "postgresql+psycopg://english_quest:english_quest@localhost:5432/english_quest"


def database_url() -> str:
    return os.environ.get("DATABASE_URL", LOCAL_DATABASE_URL)


# The engine does not connect until first use, so importing this module is cheap.
engine: Engine = create_engine(database_url(), pool_pre_ping=True)

SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


def get_db_session() -> Generator[Session, None, None]:
    """FastAPI dependency: one session per request, closed when the request ends."""
    with SessionLocal() as session:
        yield session


DbSession = Annotated[Session, Depends(get_db_session)]
