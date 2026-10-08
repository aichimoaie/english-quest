"""Schemathesis run against the real API's OpenAPI document (apps/api, workstream 2).

Skips until apps/api is on main. Once it is there, the dedicated test PostgreSQL database named by
EQ_TEST_DATABASE_URL is migrated with alembic upgrade head, and every operation in the document is
generated and checked: a 5xx, or a response that does not match its declared schema, fails the run,
and so does any import error in the API.
"""

from __future__ import annotations

import os
import subprocess
from pathlib import Path
from typing import Any

import pytest
from schemathesis_support import contract_schema, validate_case

REPO_ROOT = Path(__file__).resolve().parents[2]
API_MAIN = REPO_ROOT / "apps" / "api" / "src" / "english_quest_api" / "main.py"
if not API_MAIN.exists():
    pytest.skip("Needs apps/api (workstream 2, backend foundation) on main", allow_module_level=True)

TEST_DATABASE_URL = os.environ.get("EQ_TEST_DATABASE_URL")
if TEST_DATABASE_URL:
    os.environ["DATABASE_URL"] = TEST_DATABASE_URL
    subprocess.run(["uv", "run", "--project", "apps/api", "alembic", "upgrade", "head"], cwd=REPO_ROOT, check=True)

    from english_quest_api.main import create_app  # noqa: E402

    schema = contract_schema(create_app())

    @schema.parametrize()
    def test_api_responses_match_its_openapi_document(case: Any) -> None:
        validate_case(case)

else:

    def test_api_responses_match_its_openapi_document() -> None:
        pytest.fail(
            "Set EQ_TEST_DATABASE_URL to the dedicated test PostgreSQL database. The contract run writes to it.",
            pytrace=False,
        )
