"""Content validation harness: the harness itself is tested with stand-in validators, and the real
curriculum validator runs over content/days once both exist on main."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

import curriculum_validator
import pytest
from curriculum_validator import (
    CONTENT_DAYS,
    run_validator,
    validator_missing_reason,
)

FIXTURES = Path(__file__).parent / "validator_fixtures"
PASS_VALIDATOR = (sys.executable, str(FIXTURES / "pass_validator.py"))
FAIL_VALIDATOR = (sys.executable, str(FIXTURES / "fail_validator.py"))


# Harness tests: these run now, with no curriculum on main.


def test_passing_validator_is_reported_ok(tmp_path: Path) -> None:
    (tmp_path / "day-01.yaml").write_text("day: 1\n")
    run = run_validator(tmp_path, command=PASS_VALIDATOR)
    assert run.ok, run.report()
    assert "validated 1 file(s)" in run.stdout


def test_rejecting_validator_is_reported_with_its_messages(tmp_path: Path) -> None:
    run = run_validator(tmp_path, command=FAIL_VALIDATOR)
    assert not run.ok
    assert run.returncode == 1
    assert "exercise ex_1 has no correct answer" in run.stderr


def test_content_directory_is_passed_as_the_last_argument(tmp_path: Path) -> None:
    run = run_validator(tmp_path, command=PASS_VALIDATOR)
    assert run.command[-1] == str(tmp_path)


def test_slow_validator_times_out_instead_of_hanging(tmp_path: Path) -> None:
    with pytest.raises(subprocess.TimeoutExpired):
        run_validator(
            tmp_path,
            command=(sys.executable, "-c", "import time; time.sleep(5)"),
            timeout=0.2,
        )


def test_absent_api_package_is_reported_as_a_skip(monkeypatch: pytest.MonkeyPatch) -> None:
    def import_absent_package(name: str) -> None:
        raise ModuleNotFoundError("No module named 'english_quest_api'", name="english_quest_api")

    monkeypatch.setattr(curriculum_validator.importlib, "import_module", import_absent_package)
    assert validator_missing_reason() is not None


def test_broken_dependency_of_the_api_fails_instead_of_skipping(monkeypatch: pytest.MonkeyPatch) -> None:
    def import_with_missing_dependency(name: str) -> None:
        raise ModuleNotFoundError("No module named 'fastapi'", name="fastapi")

    monkeypatch.setattr(curriculum_validator.importlib, "import_module", import_with_missing_dependency)
    with pytest.raises(ModuleNotFoundError):
        validator_missing_reason()


# Real content: skipped until the curriculum and its validator are on main.


def test_curriculum_validator_accepts_every_day_file() -> None:
    if not CONTENT_DAYS.exists():
        pytest.skip("content/days is not on main yet (workstream 6, curriculum)")
    missing = validator_missing_reason()
    if missing:
        pytest.skip(missing)

    run = run_validator(CONTENT_DAYS)
    assert run.ok, run.report()
