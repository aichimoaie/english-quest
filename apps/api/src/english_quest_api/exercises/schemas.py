"""JSON Schema validation for exercise envelopes, kind blocks and responses.

This is the only module in the exercises package that does I/O: it reads the
versioned schema files from content/schema. The grading package never imports it.
"""

import json
from collections.abc import Mapping
from pathlib import Path
from typing import Any, Final

from english_quest_api.exercises.registry import get_kind
from jsonschema import Draft202012Validator
from jsonschema.protocols import Validator

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
        loaded: dict[str, Any] = json.loads(
            (self._root / relative).read_text(encoding="utf-8")
        )
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

    def validate_content(
        self, kind: str, kind_version: int, content: Mapping[str, Any]
    ) -> None:
        _raise_if_invalid(self._part(kind, kind_version, "content"), content)

    def validate_answer_key(
        self, kind: str, kind_version: int, answer_key: Mapping[str, Any]
    ) -> None:
        _raise_if_invalid(self._part(kind, kind_version, "answer_key"), answer_key)

    def validate_response(
        self, kind: str, kind_version: int, response: Mapping[str, Any]
    ) -> None:
        _raise_if_invalid(self._part(kind, kind_version, "response"), response)

    def validate_exercise(self, document: Mapping[str, Any]) -> None:
        """Validate the envelope, then the content and answer key of the kind block."""
        self.validate_envelope(document)
        kind = str(document["kind"])
        kind_version = int(document["kind_version"])
        self.validate_content(kind, kind_version, document["content"])
        self.validate_answer_key(kind, kind_version, document["answer_key"])


def _raise_if_invalid(validator: Validator, instance: Any) -> None:
    messages: list[str] = []
    for error in sorted(
        validator.iter_errors(instance), key=lambda e: list(e.absolute_path)
    ):
        location = "/".join(str(part) for part in error.absolute_path) or "<root>"
        messages.append(f"{location}: {error.message}")
    if messages:
        raise SchemaViolationError(messages)
