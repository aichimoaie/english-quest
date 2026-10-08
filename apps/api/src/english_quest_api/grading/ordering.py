"""ordering family: sentence_ordering.

Credit is all-or-nothing per sentence: 1 only when every fragment is in the
correct order, otherwise 0. Pure module: no I/O, no clock, no randomness.
"""

from collections.abc import Sequence

from english_quest_api.grading.results import (
    EvaluationResult,
    Family,
    InvalidResponseError,
)


def evaluate_ordering(
    *,
    correct_order: Sequence[str],
    ordered_fragment_ids: Sequence[str],
) -> EvaluationResult:
    key = list(correct_order)
    if len(key) < 3 or len(set(key)) != len(key):
        raise ValueError("correct_order needs at least three unique fragment ids")

    response = list(ordered_fragment_ids)
    if not response or len(set(response)) != len(response):
        raise InvalidResponseError("ordered_fragment_ids must be non-empty and unique")
    unknown = set(response) - set(key)
    if unknown:
        raise InvalidResponseError(f"unknown fragment ids: {sorted(unknown)}")

    correct = response == key
    return EvaluationResult(
        credit=1.0 if correct else 0.0,
        feedback_code="correct" if correct else "wrong",
        normalized_response={"ordered_fragment_ids": response},
        family=Family.ORDERING,
    )
