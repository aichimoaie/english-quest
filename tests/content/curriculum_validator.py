"""Runs the curriculum validator (workstream 6, curriculum) over content/days.

The validator is run as a subprocess, the same way CI runs it, so a failure is judged by its exit
code and its own messages rather than by importing its internals.

The command is `python -m english_quest_api.curriculum.validate <content_dir>`. That module name is
an assumption until workstream 6 lands.
"""

from __future__ import annotations

import os
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
CONTENT_DAYS = REPO_ROOT / "content" / "days"
API_SRC = REPO_ROOT / "apps" / "api" / "src"
VALIDATOR_MODULE = API_SRC / "english_quest_api" / "curriculum" / "validate.py"
DEFAULT_COMMAND: tuple[str, ...] = (sys.executable, "-m", "english_quest_api.curriculum.validate")
TIMEOUT_SECONDS = 120


@dataclass(frozen=True)
class ValidatorRun:
    command: tuple[str, ...]
    returncode: int
    stdout: str
    stderr: str

    @property
    def ok(self) -> bool:
        return self.returncode == 0

    def report(self) -> str:
        """Everything a failing test needs to show: the command, the exit code and both streams."""
        return (
            f"command: {' '.join(self.command)}\n"
            f"exit code: {self.returncode}\n"
            f"stdout:\n{self.stdout.rstrip()}\n"
            f"stderr:\n{self.stderr.rstrip()}"
        )


def validator_environment() -> dict[str, str]:
    """The environment the validator runs in: apps/api/src first on PYTHONPATH, as the pytest process has it."""
    existing = os.environ.get("PYTHONPATH")
    paths = [str(API_SRC), existing] if existing else [str(API_SRC)]
    return {**os.environ, "PYTHONPATH": os.pathsep.join(paths)}


def validator_missing_reason() -> str | None:
    """Why the validator cannot run yet, or None when it can."""
    if VALIDATOR_MODULE.exists():
        return None
    return "curriculum validator not on main yet; needs workstreams 2, 4 and 6"


def run_validator(
    content_dir: Path,
    command: tuple[str, ...] | None = None,
    timeout: float = TIMEOUT_SECONDS,
) -> ValidatorRun:
    """Runs the validator over one content directory and captures its output. Never raises on a rejection."""
    resolved = command if command is not None else DEFAULT_COMMAND
    full_command = (*resolved, str(content_dir))
    completed = subprocess.run(
        full_command,
        capture_output=True,
        text=True,
        timeout=timeout,
        cwd=REPO_ROOT,
        env=validator_environment(),
        check=False,
    )
    return ValidatorRun(
        command=full_command,
        returncode=completed.returncode,
        stdout=completed.stdout,
        stderr=completed.stderr,
    )
