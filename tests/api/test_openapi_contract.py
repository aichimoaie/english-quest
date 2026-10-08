"""Schemathesis run against the real API's OpenAPI document (apps/api, workstream 2).

Skips until apps/api is on main. Once it is there, every operation in the document is generated and
checked: a 5xx, or a response that does not match its declared schema, fails the run, and so does
any import error in the API.
"""

from __future__ import annotations

import os
import tempfile
from pathlib import Path
from typing import Any

import pytest
from schemathesis_support import contract_schema

API_MAIN = Path(__file__).resolve().parents[2] / "apps" / "api" / "src" / "english_quest_api" / "main.py"
if not API_MAIN.exists():
    pytest.skip("Needs apps/api (workstream 2, backend foundation) on main", allow_module_level=True)

_contract_database = tempfile.TemporaryDirectory(prefix="eq-contract-")
os.environ["DATABASE_URL"] = f"sqlite:///{_contract_database.name}/contract.sqlite3"

from english_quest_api.main import create_app  # noqa: E402

schema = contract_schema(create_app())


@schema.parametrize()
def test_api_responses_match_its_openapi_document(case: Any) -> None:
    case.call_and_validate()
