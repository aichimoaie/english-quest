import json
from pathlib import Path
from typing import Any

import pytest
from english_quest_api.exercises.registry import KINDS
from english_quest_api.exercises.schemas import (
    DEFAULT_SCHEMA_ROOT,
    SchemaStore,
    SchemaViolationError,
)
from jsonschema import Draft202012Validator

ROOT = DEFAULT_SCHEMA_ROOT


def _all_schema_files() -> list[Path]:
    return sorted(ROOT.rglob("*.json"))


def test_every_schema_file_is_valid_draft_2020_12() -> None:
    files = _all_schema_files()
    assert len(files) == 1 + len(KINDS)
    for path in files:
        Draft202012Validator.check_schema(json.loads(path.read_text(encoding="utf-8")))


def test_every_registered_kind_has_a_versioned_schema_file() -> None:
    for spec in KINDS.values():
        assert (ROOT / spec.schema_path).is_file(), spec.schema_path


def test_schema_ids_match_their_paths() -> None:
    envelope = json.loads((ROOT / "envelope" / "v1.json").read_text(encoding="utf-8"))
    assert envelope["$id"] == "english-quest/exercise-envelope/v1"
    for spec in KINDS.values():
        document = json.loads((ROOT / spec.schema_path).read_text(encoding="utf-8"))
        assert document["$id"] == f"english-quest/exercise-kind/{spec.kind}/v1"
        assert document["x-family"] == spec.family.value


def _valid_envelope(**overrides: Any) -> dict[str, Any]:
    document: dict[str, Any] = {
        "id": "ex_d03_past_simple_mcq_01",
        "kind": "multiple_choice",
        "kind_version": 1,
        "status": "published",
        "instructions": "Pick one.",
        "difficulty": 1,
        "points": 2,
        "topics": [{"topic": "grammar.tense.past_simple", "weight": 1.0}],
        "content": {
            "allow_multiple": False,
            "question": "Which one?",
            "options": [{"id": "a", "text": "x"}, {"id": "b", "text": "y"}],
        },
        "answer_key": {"correct_option_ids": ["a"]},
    }
    document.update(overrides)
    return document


def test_a_well_formed_envelope_passes() -> None:
    SchemaStore().validate_exercise(_valid_envelope())


@pytest.mark.parametrize(
    "overrides",
    [
        {"points": 11},
        {"status": "archived"},
        {"topics": [{"topic": "Grammar", "weight": 1.0}]},
        {"topics": [{"topic": "grammar.tense", "weight": 0}]},
        {"unexpected": True},
        {"id": "exercise-1"},
    ],
)
def test_bad_envelopes_are_rejected(overrides: dict[str, Any]) -> None:
    with pytest.raises(SchemaViolationError):
        SchemaStore().validate_envelope(_valid_envelope(**overrides))


def test_multiple_choice_needs_between_two_and_six_options() -> None:
    store = SchemaStore()
    one_option = {
        "allow_multiple": False,
        "question": "Q?",
        "options": [{"id": "a", "text": "x"}],
    }
    with pytest.raises(SchemaViolationError):
        store.validate_content("multiple_choice", 1, one_option)


def test_spelling_near_miss_is_capped_at_one_edit() -> None:
    store = SchemaStore()
    key = {"accepted": ["receive"], "near_miss_max_edits": 2}
    with pytest.raises(SchemaViolationError):
        store.validate_answer_key("spelling_correction", 1, key)


def test_fill_blank_sentence_needs_a_gap() -> None:
    with pytest.raises(SchemaViolationError):
        SchemaStore().validate_content(
            "fill_blank", 1, {"sentence": "No gap in this sentence."}
        )


def test_sentence_ordering_needs_three_fragments() -> None:
    content = {"fragments": [{"id": "f1", "text": "a"}, {"id": "f2", "text": "b"}]}
    with pytest.raises(SchemaViolationError):
        SchemaStore().validate_content("sentence_ordering", 1, content)


def test_pronunciation_self_rating_is_an_enum() -> None:
    with pytest.raises(SchemaViolationError):
        SchemaStore().validate_response(
            "pronunciation_practice",
            1,
            {"recognition_option_id": "a", "self_rating": "maybe"},
        )


def test_response_is_checked_against_the_kind_block() -> None:
    with pytest.raises(SchemaViolationError) as error:
        SchemaStore().validate_response(
            "sentence_ordering", 1, {"ordered_fragment_ids": []}
        )
    assert error.value.messages
