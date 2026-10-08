"""Score one response against one exercise revision.

Looks up the kind in the registry, which unpacks the content, answer key and
response and calls the family evaluator. Assumes the response has already
passed the kind's JSON Schema. Pure module: no I/O, no clock, no randomness.
"""

from collections.abc import Mapping
from typing import Any

from english_quest_api.exercises.registry import get_kind
from english_quest_api.grading.results import EvaluationResult


def evaluate_exercise(
    *,
    kind: str,
    kind_version: int,
    content: Mapping[str, Any],
    answer_key: Mapping[str, Any],
    response: Mapping[str, Any],
) -> EvaluationResult:
    return get_kind(kind, kind_version).score(content, answer_key, response)
