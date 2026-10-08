"""ordering family: sentence_ordering.

Credit is concordant pairs over total pairs. A pair (a, b) is concordant when a
is placed before b in the response and a comes before b in the correct order.
Fragments missing from the response make their pairs discordant.
Pure module: no I/O, no clock, no randomness.
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

    position = {fragment: index for index, fragment in enumerate(response)}
    total = len(key) * (len(key) - 1) // 2
    concordant = 0
    for i, earlier in enumerate(key):
        for later in key[i + 1 :]:
            if (
                earlier in position
                and later in position
                and position[earlier] < position[later]
            ):
                concordant += 1

    if concordant == total:
        feedback_code = "correct"
    elif concordant:
        feedback_code = "partial"
    else:
        feedback_code = "wrong"
    return EvaluationResult(
        credit=concordant / total,
        feedback_code=feedback_code,
        normalized_response={"ordered_fragment_ids": response},
        family=Family.ORDERING,
    )
