"""The grading package must stay free of I/O, clock and randomness."""

import builtins
import json
import os
import random
import socket
import subprocess
import sys
import time
from collections.abc import Callable
from datetime import date
from typing import Any

import pytest

from english_quest_api.grading.choice import evaluate_choice
from english_quest_api.grading.mastery import AttemptRecord, derive_progress
from english_quest_api.grading.matching import evaluate_matching
from english_quest_api.grading.ordering import evaluate_ordering
from english_quest_api.grading.self_assessed import evaluate_pronunciation
from english_quest_api.grading.text_input import evaluate_text

FORBIDDEN_MODULES = (
    "os",
    "pathlib",
    "io",
    "socket",
    "subprocess",
    "random",
    "secrets",
    "time",
    "sqlalchemy",
    "fastapi",
    "pydantic",
    "urllib",
    "http",
    "json",
    "english_quest_api.exercises",
    "english_quest_api.db",
)

_LOAD_EVERY_GRADING_MODULE = """
import importlib, json, pkgutil, sys
import english_quest_api.grading as grading
before = set(sys.modules)
for module in pkgutil.iter_modules(grading.__path__):
    importlib.import_module(f"english_quest_api.grading.{module.name}")
print(json.dumps(sorted(set(sys.modules) - before)))
"""


def _is_forbidden(module_name: str) -> bool:
    return any(
        module_name == forbidden or module_name.startswith(f"{forbidden}.")
        for forbidden in FORBIDDEN_MODULES
    )


def test_importing_the_grading_package_loads_no_forbidden_modules() -> None:
    completed = subprocess.run(
        [sys.executable, "-c", _LOAD_EVERY_GRADING_MODULE],
        capture_output=True,
        text=True,
        check=True,
    )
    loaded: list[str] = json.loads(completed.stdout)
    assert not [name for name in loaded if _is_forbidden(name)]


def _refuse(name: str) -> Callable[..., Any]:
    def refuse(*args: object, **kwargs: object) -> Any:
        raise AssertionError(f"grading called {name}")

    return refuse


@pytest.fixture
def no_clock_random_or_io(monkeypatch: pytest.MonkeyPatch) -> None:
    for module, attribute in (
        (time, "time"),
        (time, "time_ns"),
        (time, "monotonic"),
        (time, "perf_counter"),
        (random, "random"),
        (random, "randrange"),
        (os, "urandom"),
        (socket, "socket"),
        (builtins, "open"),
    ):
        monkeypatch.setattr(module, attribute, _refuse(f"{module.__name__}.{attribute}"))


def test_scoring_and_derivation_run_without_clock_random_or_io(
    no_clock_random_or_io: None,
) -> None:
    assert evaluate_text(response="Receive", accepted=["receive"]).credit == 1.0
    assert (
        evaluate_choice(
            option_ids=["a", "b"], correct_option_ids=["a"], selected_option_ids=["a"]
        ).credit
        == 1.0
    )
    assert evaluate_matching(answer_key={"a": "x"}, response={"a": "x"}).credit == 1.0
    assert (
        evaluate_ordering(
            correct_order=["a", "b", "c"], ordered_fragment_ids=["a", "b", "c"]
        ).credit
        == 1.0
    )
    recognition = evaluate_choice(
        option_ids=["a", "b"], correct_option_ids=["a"], selected_option_ids=["a"]
    )
    assert evaluate_pronunciation(recognition=recognition, self_rating="skipped").credit == 1.0
    summary = derive_progress(
        [
            AttemptRecord(
                sequence=1,
                exercise_id="ex_a",
                answered_on=date(2026, 10, 1),
                points=1,
                credit=0.0,
                topics=(),
            )
        ],
        today=date(2026, 10, 8),
    )
    assert summary.accuracy == 0.0
