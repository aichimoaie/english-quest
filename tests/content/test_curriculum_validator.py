"""Content validation harness: the harness itself is tested with stand-in validators, and the real
curriculum validator runs over content/days once both exist on main."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

import pytest
from curriculum_validator import (
    CONTENT_DAYS,
    run_validator,
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


# Real content: skipped until content/days is on main. Once it is, the validator must accept it.


def test_curriculum_validator_accepts_every_day_file() -> None:
    if not CONTENT_DAYS.exists():
        pytest.skip("content/days is not on main yet (workstream 6, curriculum)")

    run = run_validator(CONTENT_DAYS)
    assert run.ok, run.report()
