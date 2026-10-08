"""text_input family: fill_blank, spelling_correction, grammar_correction,
and sentence_transformation.

Accepted answers are matched after ``normalise_text``. The spelling profile may
additionally allow one edit, but only when the content marks it with
``near_miss_max_edits=1``. Pure module: no I/O, no clock, no randomness.
"""

from collections.abc import Sequence
from enum import StrEnum
from typing import Final

from english_quest_api.grading.normalise import edit_distance, normalise_text
from english_quest_api.grading.results import NEAR_MISS_CREDIT, EvaluationResult, Family

MAX_NEAR_MISS_EDITS: Final = 1


class Profile(StrEnum):
    EXACT = "exact"
    SPELLING = "spelling"


class UnmatchedPolicy(StrEnum):
    """What happens to an answer that matches no accepted answer."""

    WRONG = "wrong"
    NEEDS_REVIEW = "needs_review"


def evaluate_text(
    *,
    response: str,
    accepted: Sequence[str],
    profile: Profile = Profile.EXACT,
    near_miss_max_edits: int = 0,
    unmatched: UnmatchedPolicy = UnmatchedPolicy.WRONG,
) -> EvaluationResult:
    if not accepted:
        raise ValueError("accepted must contain at least one answer")
    if not 0 <= near_miss_max_edits <= MAX_NEAR_MISS_EDITS:
        raise ValueError(
            f"near_miss_max_edits must be between 0 and {MAX_NEAR_MISS_EDITS}"
        )
    if near_miss_max_edits and profile is not Profile.SPELLING:
        raise ValueError(
            "near-miss tolerance is only allowed with the spelling profile"
        )

    normalised = normalise_text(response)
    accepted_forms = [normalise_text(answer) for answer in accepted]
    normalized_response = {"text": normalised}
    reveal = {"correct_answer": accepted[0]}

    if normalised and normalised in accepted_forms:
        return EvaluationResult(
            credit=1.0,
            feedback_code="correct",
            normalized_response=normalized_response,
            family=Family.TEXT_INPUT,
        )

    if (
        normalised
        and profile is Profile.SPELLING
        and near_miss_max_edits
        and edit_distance(normalised, accepted_forms[0]) <= near_miss_max_edits
    ):
        return EvaluationResult(
            credit=NEAR_MISS_CREDIT,
            feedback_code="near_miss",
            normalized_response=normalized_response,
            family=Family.TEXT_INPUT,
            feedback_params=reveal,
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
        feedback_params=reveal,
    )
