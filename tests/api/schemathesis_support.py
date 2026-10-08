"""Helpers for running Schemathesis against a FastAPI app in-process, with no server to start."""

from __future__ import annotations

from typing import Any

from schemathesis.openapi import from_asgi
from schemathesis.schemas import BaseSchema

# FastAPI serves its generated OpenAPI document here by default. If the API mounts it elsewhere,
# change this one constant.
OPENAPI_PATH = "/openapi.json"


def contract_schema(app: Any) -> BaseSchema:
    """Loads the OpenAPI document that the app generates for itself."""
    return from_asgi(OPENAPI_PATH, app)
