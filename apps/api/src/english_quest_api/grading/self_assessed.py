"""self_assessed family: pronunciation_practice.

v1 has no speech scoring. A self-rating is recorded for progress and practice
time, but it does not count toward accuracy. The recognition choice inside a
pronunciation item is scored by the choice family and is passed in already
evaluated. Pure module: no I/O, no clock, no randomness.
"""

from english_quest_api.grading.results import EvaluationResult, Family


def evaluate_pronunciation(
    *,
    recognition: EvaluationResult,
    self_rating: str,
) -> EvaluationResult:
    """Combine a scored recognition choice with an unscored self-rating.

    Credit and feedback come from the recognition choice, even when the
    self-rating is skipped. The self-rating is stored in the normalised response.
    """
    return EvaluationResult(
        credit=recognition.credit,
        feedback_code=recognition.feedback_code,
        normalized_response={
            **recognition.normalized_response,
            "self_rating": self_rating,
        },
        family=Family.SELF_ASSESSED,
    )
