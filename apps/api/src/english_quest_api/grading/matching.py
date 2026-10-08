"""matching family: word_matching and vocabulary_matching.

Credit is the share of pairs the learner got right, so each pair is worth an
equal part of the exercise's points. Pure module: no I/O, no clock, no randomness.
"""

from collections.abc import Mapping

from english_quest_api.grading.results import (
    EvaluationResult,
    Family,
    InvalidResponseError,
)


def evaluate_matching(
    *,
    answer_key: Mapping[str, str],
    response: Mapping[str, str],
) -> EvaluationResult:
    if not answer_key:
        raise ValueError("answer_key must contain at least one pair")
    if len(set(answer_key.values())) != len(answer_key):
        raise ValueError("each right-hand item may appear in only one pair")
    unknown = set(response) - set(answer_key)
    if unknown:
        raise InvalidResponseError(f"unknown left-hand ids: {sorted(unknown)}")

    correct = sum(
        1 for left, right in answer_key.items() if response.get(left) == right
    )
    total = len(answer_key)
    if correct == total:
        feedback_code = "correct"
    elif correct:
        feedback_code = "partial"
    else:
        feedback_code = "wrong"
    return EvaluationResult(
        credit=correct / total,
        feedback_code=feedback_code,
        normalized_response={
            "pairs": {left: response[left] for left in sorted(response)}
        },
        family=Family.MATCHING,
    )
