"""Proves the Schemathesis wiring works, using fixture apps that do not depend on the real API."""

from __future__ import annotations

from typing import Any

from api_fixtures.tiny_app import app as tiny_app
from schemathesis_support import contract_schema

pytest_plugins = ["pytester"]

schema = contract_schema(tiny_app)


@schema.parametrize()
def test_fixture_app_matches_its_openapi_document(case: Any) -> None:
    case.call_and_validate()


def test_contract_run_reports_a_server_error_as_a_failure(pytester: Any) -> None:
    """Negative control: the same harness must fail on the broken fixture app."""
    pytester.makepyfile(
        test_broken_contract="""
from api_fixtures.broken_app import app
from schemathesis_support import contract_schema

schema = contract_schema(app)


@schema.parametrize()
def test_broken_app_contract(case):
    case.call_and_validate()
"""
    )
    result = pytester.runpytest("-q", "-p", "no:cacheprovider")
    assert result.ret != 0
    result.assert_outcomes(failed=1)
