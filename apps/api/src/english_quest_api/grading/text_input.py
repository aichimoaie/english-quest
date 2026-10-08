"""text_input family: fill_blank, spelling_correction, grammar_correction,
and sentence_transformation.

A typed answer is correct when its normalised form equals a normalised accepted
answer. Otherwise it is wrong, or needs review when the kind says so.
Pure module: no I/O, no clock, no randomness.
"""

from collections.abc import Sequence
from enum import StrEnum

from english_quest_api.grading.normalise import normalise_text
from english_quest_api.grading.results import EvaluationResult, Family


class UnmatchedPolicy(StrEnum):
    """What happens to an answer that matches no accepted answer."""

    WRONG = "wrong"
    NEEDS_REVIEW = "needs_review"


def evaluate_text(
    *,
    response: str,
    accepted: Sequence[str],
    unmatched: UnmatchedPolicy = UnmatchedPolicy.WRONG,
) -> EvaluationResult:
    if not accepted:
        raise ValueError("accepted must contain at least one answer")

    normalised = normalise_text(response)
    accepted_forms = {normalise_text(answer) for answer in accepted}
    normalized_response = {"text": normalised}

    if normalised and normalised in accepted_forms:
        return EvaluationResult(
            credit=1.0,
            feedback_code="correct",
            normalized_response=normalized_response,
            family=Family.TEXT_INPUT,
        )

    if unmatched is UnmatchedPolicy.NEEDS_REVIEW:
        return EvaluationResult(
            credit=None,
            feedback_code="needs_review",
            normalized_response=normalized_response,
            family=Family.TEXT_INPUT,
        )

    return EvaluationResult(
        credit=0.0,
        feedback_code="wrong",
        normalized_response=normalized_response,
        family=Family.TEXT_INPUT,
        feedback_params={"correct_answer": accepted[0]},
    )
