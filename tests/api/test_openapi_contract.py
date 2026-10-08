"""Schemathesis run against the real API's OpenAPI document (apps/api, workstream 2).

Skips until apps/api is on main with its dependencies installed, and names that dependency in the
skip reason. Once it is there, every operation in the document is generated and checked: a 5xx,
or a response that does not match its declared schema, fails the run.
"""

from __future__ import annotations

from typing import Any

import pytest
from schemathesis_support import contract_schema

try:
    from english_quest_api.main import create_app
except ImportError as error:  # apps/api not on main yet, or its dependencies are not installed
    pytest.skip(f"Needs apps/api (workstream 2, backend foundation): {error}", allow_module_level=True)

schema = contract_schema(create_app())


@schema.parametrize()
def test_api_responses_match_its_openapi_document(case: Any) -> None:
    case.call_and_validate()
