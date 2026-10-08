"""JSON Schema validation for exercise envelopes, kind blocks and responses.

This is the only module in the exercises package that does I/O: it reads the
versioned schema files from content/schema. The grading package never imports it.
"""

import json
from collections.abc import Callable, Mapping
from pathlib import Path
from typing import Any, Final

from jsonschema import Draft202012Validator
from jsonschema.protocols import Validator

from english_quest_api.exercises.registry import get_kind

# apps/api/src/english_quest_api/exercises/schemas.py -> repository root
DEFAULT_SCHEMA_ROOT: Final = Path(__file__).resolve().parents[5] / "content" / "schema"
ENVELOPE_PATH: Final = "envelope/v1.json"


class SchemaViolationError(ValueError):
    """A document failed JSON Schema validation. ``messages`` lists every problem."""

    def __init__(self, messages: list[str]) -> None:
        self.messages = tuple(messages)
        super().__init__("; ".join(self.messages))


class SchemaStore:
    """Loads and caches the versioned schemas under one content/schema root."""

    def __init__(self, root: Path = DEFAULT_SCHEMA_ROOT) -> None:
        self._root = root
        self._validators: dict[tuple[str, int, str], Validator] = {}
        self._envelope: Validator | None = None

    def _read(self, relative: str) -> dict[str, Any]:
        loaded: dict[str, Any] = json.loads((self._root / relative).read_text(encoding="utf-8"))
        return loaded

    def _part(self, kind: str, kind_version: int, part: str) -> Validator:
        key = (kind, kind_version, part)
        if key not in self._validators:
            schema = self._read(get_kind(kind, kind_version).schema_path)
            self._validators[key] = Draft202012Validator(
                {"$defs": schema["$defs"], "$ref": f"#/$defs/{part}"}
            )
        return self._validators[key]

    def validate_envelope(self, document: Mapping[str, Any]) -> None:
        if self._envelope is None:
            self._envelope = Draft202012Validator(self._read(ENVELOPE_PATH))
        _raise_if_invalid(self._envelope, document)

    def validate_content(self, kind: str, kind_version: int, content: Mapping[str, Any]) -> None:
        _raise_if_invalid(self._part(kind, kind_version, "content"), content)

    def validate_answer_key(
        self, kind: str, kind_version: int, answer_key: Mapping[str, Any]
    ) -> None:
        _raise_if_invalid(self._part(kind, kind_version, "answer_key"), answer_key)

    def validate_response(self, kind: str, kind_version: int, response: Mapping[str, Any]) -> None:
        _raise_if_invalid(self._part(kind, kind_version, "response"), response)

    def validate_exercise(self, document: Mapping[str, Any]) -> None:
        """Validate the envelope, then the content and answer key of the kind block."""
        self.validate_envelope(document)
        topic_names = [topic["topic"] for topic in document["topics"]]
        if len(set(topic_names)) != len(topic_names):
            raise SchemaViolationError(["topics: each topic may appear only once"])
        kind = str(document["kind"])
        kind_version = int(document["kind_version"])
        self.validate_content(kind, kind_version, document["content"])
        self.validate_answer_key(kind, kind_version, document["answer_key"])
        check = _CROSS_FIELD_CHECKS.get(kind)
        if check is not None:
            problems = check(document["content"], document["answer_key"])
            if problems:
                raise SchemaViolationError(problems)


def _unique_id_problems(option_ids: list[str], where: str) -> list[str]:
    if len(set(option_ids)) != len(option_ids):
        return [f"{where}: option ids must be unique"]
    return []


def _choice_problems(
    option_ids: list[str],
    correct_ids: list[str],
    allow_multiple: bool,
) -> list[str]:
    problems = _unique_id_problems(option_ids, "content/options")
    unknown = sorted(set(correct_ids) - set(option_ids))
    if unknown:
        problems.append(f"answer_key/correct_option_ids: not option ids {unknown}")
    if not allow_multiple and len(correct_ids) != 1:
        problems.append("answer_key/correct_option_ids: single select needs one id")
    return problems


def _choice_block(content: Mapping[str, Any], answer_key: Mapping[str, Any]) -> list[str]:
    return _choice_problems(
        [option["id"] for option in content["options"]],
        answer_key["correct_option_ids"],
        bool(content.get("allow_multiple", False)),
    )


def _pronunciation_block(content: Mapping[str, Any], answer_key: Mapping[str, Any]) -> list[str]:
    option_ids = [option["id"] for option in content["recognition_options"]]
    problems = _unique_id_problems(option_ids, "content/recognition_options")
    if answer_key["correct_option_id"] not in option_ids:
        problems.append("answer_key/correct_option_id: not a recognition option id")
    return problems


def _matching_block(content: Mapping[str, Any], answer_key: Mapping[str, Any]) -> list[str]:
    left_ids = [item["id"] for item in content["left"]]
    right_ids = [item["id"] for item in content["right"]]
    pairs: Mapping[str, str] = answer_key["pairs"]
    problems = _unique_id_problems(left_ids, "content/left") + _unique_id_problems(
        right_ids, "content/right"
    )
    if set(pairs) != set(left_ids):
        problems.append("answer_key/pairs: keys must be exactly the left ids")
    if not set(pairs.values()) <= set(right_ids):
        problems.append("answer_key/pairs: values must be right ids")
    if len(set(pairs.values())) != len(pairs):
        problems.append("answer_key/pairs: each right id may appear in only one pair")
    return problems


def _ordering_block(content: Mapping[str, Any], answer_key: Mapping[str, Any]) -> list[str]:
    fragment_ids = [fragment["id"] for fragment in content["fragments"]]
    problems = _unique_id_problems(fragment_ids, "content/fragments")
    if set(answer_key["correct_order"]) != set(fragment_ids):
        problems.append("answer_key/correct_order: must list exactly the fragment ids")
    return problems


_CROSS_FIELD_CHECKS: Final[
    Mapping[str, Callable[[Mapping[str, Any], Mapping[str, Any]], list[str]]]
] = {
    "multiple_choice": _choice_block,
    "choose_word": _choice_block,
    "listening_comprehension": _choice_block,
    "pronunciation_practice": _pronunciation_block,
    "word_matching": _matching_block,
    "vocabulary_matching": _matching_block,
    "sentence_ordering": _ordering_block,
}


def _raise_if_invalid(validator: Validator, instance: Any) -> None:
    messages: list[str] = []
    for error in sorted(validator.iter_errors(instance), key=lambda e: list(e.absolute_path)):
        location = "/".join(str(part) for part in error.absolute_path) or "<root>"
        messages.append(f"{location}: {error.message}")
    if messages:
        raise SchemaViolationError(messages)
