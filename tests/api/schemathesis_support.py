"""Helpers for running Schemathesis against a FastAPI app in-process, with no server to start."""

from __future__ import annotations

from typing import Any

from schemathesis.checks import not_a_server_error
from schemathesis.openapi import from_asgi
from schemathesis.schemas import BaseSchema
from schemathesis.specs.openapi.checks import response_schema_conformance, status_code_conformance

# FastAPI serves its generated OpenAPI document here by default. If the API mounts it elsewhere,
# change this one constant.
OPENAPI_PATH = "/openapi.json"


CONTRACT_CHECKS = [not_a_server_error, status_code_conformance, response_schema_conformance]


def contract_schema(app: Any) -> BaseSchema:
    """Loads the OpenAPI document that the app generates for itself."""
    return from_asgi(OPENAPI_PATH, app)


def validate_case(case: Any) -> None:
    """Makes the request and raises on any failed contract check, including a 5xx response."""
    case.call_and_validate(checks=CONTRACT_CHECKS)
