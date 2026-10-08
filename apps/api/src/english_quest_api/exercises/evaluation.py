"""Score one response against one exercise revision.

Dispatches on the kind, unpacks the content, answer key and response, and calls
the family evaluator. Assumes the response has already passed the kind's JSON
Schema. Pure module: no I/O, no clock, no randomness.
"""

from collections.abc import Callable, Mapping
from dataclasses import dataclass
from typing import Any, Final, cast

from english_quest_api.exercises.registry import get_kind
from english_quest_api.grading.choice import evaluate_choice
from english_quest_api.grading.matching import evaluate_matching
from english_quest_api.grading.ordering import evaluate_ordering
from english_quest_api.grading.results import EvaluationResult
from english_quest_api.grading.self_assessed import evaluate_pronunciation
from english_quest_api.grading.text_input import UnmatchedPolicy, evaluate_text

Payload = Mapping[str, Any]


@dataclass(frozen=True, slots=True)
class EvaluationContext:
    """Facts the caller knows about the attempt. None of them change the credit."""

    attempt_index: int = 1
    hints_used: int = 0
    locale: str = "en"


def _choice(
    content: Payload, answer_key: Payload, response: Payload
) -> EvaluationResult:
    return evaluate_choice(
        option_ids=[option["id"] for option in content["options"]],
        correct_option_ids=cast(list[str], answer_key["correct_option_ids"]),
        selected_option_ids=cast(list[str], response["selected_option_ids"]),
        allow_multiple=bool(content.get("allow_multiple", False)),
        misconceptions=cast(Mapping[str, str], answer_key.get("misconceptions", {})),
    )


def _text(
    response_field: str,
    *,
    unmatched: UnmatchedPolicy = UnmatchedPolicy.WRONG,
) -> Callable[[Payload, Payload, Payload], EvaluationResult]:
    def run(
        content: Payload, answer_key: Payload, response: Payload
    ) -> EvaluationResult:
        return evaluate_text(
            response=cast(str, response[response_field]),
            accepted=cast(list[str], answer_key["accepted"]),
            unmatched=unmatched,
        )

    return run


def _matching(
    content: Payload, answer_key: Payload, response: Payload
) -> EvaluationResult:
    return evaluate_matching(
        answer_key=cast(Mapping[str, str], answer_key["pairs"]),
        response=cast(Mapping[str, str], response["pairs"]),
    )


def _ordering(
    content: Payload, answer_key: Payload, response: Payload
) -> EvaluationResult:
    return evaluate_ordering(
        correct_order=cast(list[str], answer_key["correct_order"]),
        ordered_fragment_ids=cast(list[str], response["ordered_fragment_ids"]),
    )


def _pronunciation(
    content: Payload, answer_key: Payload, response: Payload
) -> EvaluationResult:
    recognition = evaluate_choice(
        option_ids=[option["id"] for option in content["recognition_options"]],
        correct_option_ids=[cast(str, answer_key["correct_option_id"])],
        selected_option_ids=[cast(str, response["recognition_option_id"])],
        misconceptions=cast(Mapping[str, str], answer_key.get("misconceptions", {})),
    )
    return evaluate_pronunciation(
        recognition=recognition, self_rating=cast(str, response["self_rating"])
    )


_HANDLERS: Final[
    Mapping[str, Callable[[Payload, Payload, Payload], EvaluationResult]]
] = {
    "multiple_choice": _choice,
    "choose_word": _choice,
    "listening_comprehension": _choice,
    "fill_blank": _text("text"),
    "spelling_correction": _text("word"),
    "grammar_correction": _text("text"),
    "sentence_transformation": _text("text", unmatched=UnmatchedPolicy.NEEDS_REVIEW),
    "word_matching": _matching,
    "vocabulary_matching": _matching,
    "sentence_ordering": _ordering,
    "pronunciation_practice": _pronunciation,
}


def evaluate_exercise(
    *,
    kind: str,
    kind_version: int,
    content: Payload,
    answer_key: Payload,
    response: Payload,
    context: EvaluationContext | None = None,
) -> EvaluationResult:
    """Score the response.

    ``context`` is accepted for the contract but never changes credit.
    """
    get_kind(kind, kind_version)
    return _HANDLERS[kind](content, answer_key, response)
