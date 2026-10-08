"""choice family: multiple_choice, choose_word, listening_comprehension, and
the recognition step of pronunciation_practice.

Credit is all-or-nothing: the selected set must equal the correct set.
Feedback comes from the first wrong selection (in option order) that has a
misconception code. Pure module: no I/O, no clock, no randomness.
"""

from collections.abc import Mapping, Sequence

from english_quest_api.grading.results import (
    EvaluationResult,
    Family,
    InvalidResponseError,
)


def evaluate_choice(
    *,
    option_ids: Sequence[str],
    correct_option_ids: Sequence[str],
    selected_option_ids: Sequence[str],
    allow_multiple: bool = False,
    misconceptions: Mapping[str, str] | None = None,
) -> EvaluationResult:
    options = list(option_ids)
    correct = frozenset(correct_option_ids)
    if not options or len(set(options)) != len(options):
        raise ValueError("option_ids must be non-empty and unique")
    if not correct or not correct <= set(options):
        raise ValueError("correct_option_ids must be a non-empty subset of option_ids")
    if not allow_multiple and len(correct) != 1:
        raise ValueError("single-select content needs exactly one correct option")

    selected = list(selected_option_ids)
    if not selected or len(set(selected)) != len(selected):
        raise InvalidResponseError("selected_option_ids must be non-empty and unique")
    unknown = set(selected) - set(options)
    if unknown:
        raise InvalidResponseError(f"unknown option ids: {sorted(unknown)}")
    if not allow_multiple and len(selected) > 1:
        raise InvalidResponseError("single-select content accepts one selected option")

    chosen = frozenset(selected)
    normalized_response = {"selected_option_ids": sorted(chosen)}
    if chosen == correct:
        return EvaluationResult(
            credit=1.0,
            feedback_code="correct",
            normalized_response=normalized_response,
            family=Family.CHOICE,
        )

    codes = misconceptions or {}
    feedback_code = "wrong"
    for option in options:
        if option in chosen and option not in correct and option in codes:
            feedback_code = codes[option]
            break
    return EvaluationResult(
        credit=0.0,
        feedback_code=feedback_code,
        normalized_response=normalized_response,
        family=Family.CHOICE,
    )
