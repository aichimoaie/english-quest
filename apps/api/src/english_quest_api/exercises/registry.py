"""Kind registry: the eleven authored kinds, each mapped to one evaluator family
and the function that scores it.

The thirteen required types are these eleven kinds plus two session
compositions (daily_review and mixed_review), which have no kind of their own.
Pure module: no I/O.
"""

from collections.abc import Callable, Mapping
from dataclasses import dataclass
from types import MappingProxyType
from typing import Any, Final, cast

from english_quest_api.grading.choice import evaluate_choice
from english_quest_api.grading.matching import evaluate_matching
from english_quest_api.grading.ordering import evaluate_ordering
from english_quest_api.grading.results import EvaluationResult, Family
from english_quest_api.grading.self_assessed import evaluate_pronunciation
from english_quest_api.grading.text_input import evaluate_text

Payload = Mapping[str, Any]
Scorer = Callable[[Payload, Payload, Payload], EvaluationResult]


class UnknownKindError(LookupError):
    """The kind, or the kind version, is not in the registry."""


@dataclass(frozen=True, slots=True)
class KindSpec:
    kind: str
    kind_version: int
    family: Family
    score: Scorer

    @property
    def schema_path(self) -> str:
        """Path of the kind's JSON Schema, relative to the content/schema root."""
        return f"kinds/v{self.kind_version}/{self.kind}.json"


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


def _text(response_field: str) -> Scorer:
    def score(
        content: Payload, answer_key: Payload, response: Payload
    ) -> EvaluationResult:
        return evaluate_text(
            response=cast(str, response[response_field]),
            accepted=cast(list[str], answer_key["accepted"]),
        )

    return score


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


_SPECS: Final = (
    KindSpec("multiple_choice", 1, Family.CHOICE, _choice),
    KindSpec("choose_word", 1, Family.CHOICE, _choice),
    KindSpec("listening_comprehension", 1, Family.CHOICE, _choice),
    KindSpec("fill_blank", 1, Family.TEXT_INPUT, _text("text")),
    KindSpec("spelling_correction", 1, Family.TEXT_INPUT, _text("word")),
    KindSpec("grammar_correction", 1, Family.TEXT_INPUT, _text("text")),
    KindSpec("sentence_transformation", 1, Family.TEXT_INPUT, _text("text")),
    KindSpec("word_matching", 1, Family.MATCHING, _matching),
    KindSpec("vocabulary_matching", 1, Family.MATCHING, _matching),
    KindSpec("sentence_ordering", 1, Family.ORDERING, _ordering),
    KindSpec("pronunciation_practice", 1, Family.SELF_ASSESSED, _pronunciation),
)

KINDS: Final[Mapping[str, KindSpec]] = MappingProxyType(
    {spec.kind: spec for spec in _SPECS}
)

def get_kind(kind: str, kind_version: int) -> KindSpec:
    spec = KINDS.get(kind)
    if spec is None or spec.kind_version != kind_version:
        raise UnknownKindError(f"unknown kind {kind!r} at version {kind_version}")
    return spec
