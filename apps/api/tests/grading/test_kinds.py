"""One table row per authored kind. Each row is a full exercise that must pass
the JSON Schemas and score as expected."""

from typing import Any

import pytest
from english_quest_api.exercises.evaluation import evaluate_exercise
from english_quest_api.exercises.registry import KINDS, SESSION_TYPES, get_kind
from english_quest_api.exercises.schemas import SchemaStore
from english_quest_api.grading.results import Family

# PRD section 5 type names, each mapped to its kind or session composition.
PRD_TYPE_TO_KIND = {
    "Multiple choice": "multiple_choice",
    "Fill in the blank": "fill_blank",
    "Choose the correct word": "choose_word",
    "Spelling correction": "spelling_correction",
    "Word matching": "word_matching",
    "Sentence ordering": "sentence_ordering",
    "Vocabulary matching": "vocabulary_matching",
    "Grammar correction": "grammar_correction",
    "Listening comprehension": "listening_comprehension",
    "Pronunciation practice": "pronunciation_practice",
    "Sentence transformation": "sentence_transformation",
    "Daily review": "daily_review",
    "Mixed review": "mixed_review",
}

OPTIONS_AB = [{"id": "a", "text": "hot"}, {"id": "b", "text": "hat"}]


def _row(
    kind: str,
    content: dict[str, Any],
    answer_key: dict[str, Any],
    response: dict[str, Any],
    credit: float | None,
    code: str,
    *,
    family: Family,
    counts: bool = True,
) -> tuple[
    str, dict[str, Any], dict[str, Any], dict[str, Any], float | None, str, Family, bool
]:
    return kind, content, answer_key, response, credit, code, family, counts


CASES = [
    _row(
        "multiple_choice",
        {
            "allow_multiple": False,
            "question": "Which sentence describes something that finished yesterday?",
            "options": [
                {"id": "a", "text": "I have finished the report yesterday."},
                {"id": "b", "text": "I finished the report yesterday."},
                {"id": "c", "text": "I finish the report yesterday."},
            ],
        },
        {
            "correct_option_ids": ["b"],
            "misconceptions": {"a": "present_perfect_with_finished_time"},
        },
        {"selected_option_ids": ["a"]},
        0.0,
        "present_perfect_with_finished_time",
        family=Family.CHOICE,
    ),
    _row(
        "choose_word",
        {"sentence": "The soup was too ___ to eat.", "options": OPTIONS_AB},
        {"correct_option_ids": ["a"]},
        {"selected_option_ids": ["a"]},
        1.0,
        "correct",
        family=Family.CHOICE,
    ),
    _row(
        "listening_comprehension",
        {
            "question": "What time does the shop open?",
            "options": [
                {"id": "a", "text": "At seven"},
                {"id": "b", "text": "At nine"},
            ],
        },
        {"correct_option_ids": ["b"]},
        {"selected_option_ids": ["a"]},
        0.0,
        "wrong",
        family=Family.CHOICE,
    ),
    _row(
        "fill_blank",
        {"sentence": "She ___ to school every day."},
        {"accepted": ["walks"]},
        {"text": "  WALKS "},
        1.0,
        "correct",
        family=Family.TEXT_INPUT,
    ),
    _row(
        "spelling_correction",
        {
            "sentence": "Please let me know when you recieve the parcel.",
            "misspelled_word": "recieve",
        },
        {"accepted": ["receive"], "near_miss_max_edits": 1},
        {"word": "receve"},
        0.5,
        "near_miss",
        family=Family.TEXT_INPUT,
    ),
    _row(
        "grammar_correction",
        {"sentence": "She have a red bag."},
        {"accepted": ["She has a red bag."]},
        {"text": "she has a red bag"},
        1.0,
        "correct",
        family=Family.TEXT_INPUT,
    ),
    _row(
        "sentence_transformation",
        {"cue": "Make it negative.", "source_sentence": "She likes tea."},
        {"accepted": ["She does not like tea."]},
        {"text": "She doesn't like tea."},
        None,
        "needs_review",
        family=Family.TEXT_INPUT,
    ),
    _row(
        "word_matching",
        {
            "left": [{"id": "a", "text": "hot"}, {"id": "b", "text": "big"}],
            "right": [{"id": "x", "text": "cold"}, {"id": "y", "text": "small"}],
        },
        {"pairs": {"a": "x", "b": "y"}},
        {"pairs": {"a": "x", "b": "x"}},
        0.5,
        "partial",
        family=Family.MATCHING,
    ),
    _row(
        "vocabulary_matching",
        {
            "left": [{"id": "a", "text": "shop"}, {"id": "b", "text": "bread"}],
            "right": [
                {"id": "x", "text": "a place where things are sold"},
                {"id": "y", "text": "food made from flour"},
            ],
        },
        {"pairs": {"a": "x", "b": "y"}},
        {"pairs": {"a": "x", "b": "y"}},
        1.0,
        "correct",
        family=Family.MATCHING,
    ),
    _row(
        "sentence_ordering",
        {
            "fragments": [
                {"id": "f1", "text": "is boiling"},
                {"id": "f2", "text": "The kettle"},
                {"id": "f3", "text": "right now."},
            ]
        },
        {"correct_order": ["f2", "f1", "f3"]},
        {"ordered_fragment_ids": ["f2", "f3", "f1"]},
        2 / 3,
        "partial",
        family=Family.ORDERING,
    ),
    _row(
        "pronunciation_practice",
        {
            "prompt_text": "ship or sheep",
            "recognition_options": [
                {"id": "a", "text": "ship"},
                {"id": "b", "text": "sheep"},
            ],
        },
        {"correct_option_id": "a"},
        {"recognition_option_id": "a", "self_rating": "unsure"},
        1.0,
        "correct",
        family=Family.SELF_ASSESSED,
    ),
]


def _envelope(
    kind: str, content: dict[str, Any], answer_key: dict[str, Any]
) -> dict[str, Any]:
    return {
        "id": f"ex_{kind}_01",
        "kind": kind,
        "kind_version": 1,
        "status": "published",
        "instructions": "Answer the question.",
        "difficulty": 1,
        "points": 2,
        "topics": [{"topic": "grammar.tense.past_simple", "weight": 1.0}],
        "content": content,
        "answer_key": answer_key,
    }


@pytest.fixture(scope="module")
def store() -> SchemaStore:
    return SchemaStore()


def test_registry_covers_the_thirteen_required_types() -> None:
    assert len(PRD_TYPE_TO_KIND) == 13
    assert set(SESSION_TYPES) == {"daily_review", "mixed_review"}
    assert set(KINDS).isdisjoint(SESSION_TYPES)
    mapped = set(PRD_TYPE_TO_KIND.values())
    assert mapped == set(KINDS) | set(SESSION_TYPES)


def test_every_family_has_at_least_one_kind() -> None:
    assert {spec.family for spec in KINDS.values()} == set(Family)


def test_unknown_kind_version_is_rejected() -> None:
    with pytest.raises(LookupError):
        get_kind("multiple_choice", 2)


def test_each_kind_has_a_table_row() -> None:
    assert {row[0] for row in CASES} == set(KINDS)


@pytest.mark.parametrize(
    ("kind", "content", "answer_key", "response", "credit", "code", "family", "counts"),
    CASES,
)
def test_kind_example_matches_its_schema_and_scores(
    store: SchemaStore,
    kind: str,
    content: dict[str, Any],
    answer_key: dict[str, Any],
    response: dict[str, Any],
    credit: float | None,
    code: str,
    family: Family,
    counts: bool,
) -> None:
    document = _envelope(kind, content, answer_key)
    store.validate_exercise(document)
    store.validate_response(kind, 1, response)

    result = evaluate_exercise(
        kind=kind,
        kind_version=1,
        content=content,
        answer_key=answer_key,
        response=response,
    )
    assert result.family is family
    assert result.feedback_code == code
    assert result.counts_toward_accuracy is counts
    if credit is None:
        assert result.credit is None
    else:
        assert result.credit == pytest.approx(credit)
