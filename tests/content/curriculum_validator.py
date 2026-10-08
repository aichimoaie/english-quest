"""Runs the curriculum validator (workstream 6, curriculum) over content/days.

The validator is run as a subprocess, the same way CI runs it, so a failure is judged by its exit
code and its own messages rather than by importing its internals.

By default the command is `python -m english_quest_api.curriculum.validate <content_dir>`. That
module name is an assumption until workstream 6 lands. Set EQ_CURRICULUM_VALIDATOR to any command
line to use a different validator; the content directory is appended as the last argument.
"""

from __future__ import annotations

import importlib
import os
import shlex
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
CONTENT_DAYS = REPO_ROOT / "content" / "days"
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


def validator_command(environ: dict[str, str] | None = None) -> tuple[str, ...]:
    """The validator command: EQ_CURRICULUM_VALIDATOR if set, otherwise the default module."""
    override = (environ if environ is not None else os.environ).get("EQ_CURRICULUM_VALIDATOR")
    if override:
        return tuple(shlex.split(override))
    return DEFAULT_COMMAND


def validator_missing_reason(command: tuple[str, ...] = DEFAULT_COMMAND) -> str | None:
    """Why the default validator cannot run yet, or None when it can. Overrides are always assumed runnable."""
    if command != DEFAULT_COMMAND:
        return None
    try:
        importlib.import_module("english_quest_api.curriculum.validate")
    except ImportError as error:
        return f"curriculum validator not importable ({error}); needs workstreams 2, 4 and 6 on main"
    return None


def run_validator(
    content_dir: Path,
    command: tuple[str, ...] | None = None,
    timeout: float = TIMEOUT_SECONDS,
) -> ValidatorRun:
    """Runs the validator over one content directory and captures its output. Never raises on a rejection."""
    resolved = command if command is not None else validator_command()
    full_command = (*resolved, str(content_dir))
    completed = subprocess.run(
        full_command,
        capture_output=True,
        text=True,
        timeout=timeout,
        cwd=REPO_ROOT,
        check=False,
    )
    return ValidatorRun(
        command=full_command,
        returncode=completed.returncode,
        stdout=completed.stdout,
        stderr=completed.stderr,
    )
