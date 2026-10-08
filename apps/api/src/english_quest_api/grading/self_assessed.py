"""self_assessed family: pronunciation_practice.

v1 has no speech scoring. A self-rating is recorded for progress and practice
time, but it does not count toward accuracy. The recognition choice inside a
pronunciation item is scored by the choice family and is passed in already
evaluated. Pure module: no I/O, no clock, no randomness.
"""

from dataclasses import replace
from enum import StrEnum

from english_quest_api.grading.results import (
    EvaluationResult,
    Family,
    InvalidResponseError,
)


class SelfRating(StrEnum):
    GOT_IT = "got_it"
    UNSURE = "unsure"
    SKIPPED = "skipped"


def evaluate_self_rating(rating: str) -> EvaluationResult:
    """Score a bare self-rating. Credit is 1.0 for got_it and 0.0 for unsure.

    The rating never counts toward accuracy. A skipped rating records nothing.
    """
    try:
        parsed = SelfRating(rating)
    except ValueError as error:
        raise InvalidResponseError(f"unknown self rating: {rating}") from error

    normalized_response = {"self_rating": parsed.value}
    if parsed is SelfRating.SKIPPED:
        return EvaluationResult(
            credit=None,
            feedback_code="skipped",
            normalized_response=normalized_response,
            family=Family.SELF_ASSESSED,
            counts_toward_accuracy=False,
            recorded=False,
        )
    return EvaluationResult(
        credit=1.0 if parsed is SelfRating.GOT_IT else 0.0,
        feedback_code=parsed.value,
        normalized_response=normalized_response,
        family=Family.SELF_ASSESSED,
        counts_toward_accuracy=False,
    )


def evaluate_pronunciation(
    *,
    recognition: EvaluationResult,
    self_rating: str,
) -> EvaluationResult:
    """Combine a scored recognition choice with an unscored self-rating.

    Credit and feedback come from the recognition choice. The self-rating is
    stored in the normalised response. A skipped rating records nothing.
    """
    rating = evaluate_self_rating(self_rating)
    if not rating.recorded:
        return replace(rating, family=Family.SELF_ASSESSED)
    return EvaluationResult(
        credit=recognition.credit,
        feedback_code=recognition.feedback_code,
        normalized_response={
            **recognition.normalized_response,
            **rating.normalized_response,
        },
        family=Family.SELF_ASSESSED,
        counts_toward_accuracy=recognition.counts_toward_accuracy,
    )
