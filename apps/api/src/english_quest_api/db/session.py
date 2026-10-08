"""Database engine and the request-scoped session dependency.

Commits are explicit: a service calls ``session.commit()`` once its unit of
work is complete. A session that is closed without a commit rolls back, so an
exception in a request never leaves partial writes behind.
"""

import functools
import os
from collections.abc import Generator
from typing import Annotated

from fastapi import Depends
from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker


def database_url() -> str:
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL is not set; point it at the English Quest PostgreSQL database")
    return url


@functools.cache
def get_engine() -> Engine:
    """Created on first use, so importing this module does not require DATABASE_URL."""
    return create_engine(database_url(), pool_pre_ping=True)


@functools.cache
def get_session_factory() -> sessionmaker[Session]:
    return sessionmaker(bind=get_engine(), expire_on_commit=False)


def get_db_session() -> Generator[Session, None, None]:
    """FastAPI dependency: one session per request, closed when the request ends."""
    with get_session_factory()() as session:
        yield session


DbSession = Annotated[Session, Depends(get_db_session)]
