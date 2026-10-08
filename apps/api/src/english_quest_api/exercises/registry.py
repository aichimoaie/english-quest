"""Kind registry: the eleven authored kinds, each mapped to one evaluator family.

The thirteen required types are these eleven kinds plus two session
compositions (daily_review and mixed_review), which have no kind of their own.
Pure module: no I/O.
"""

from collections.abc import Mapping
from dataclasses import dataclass
from types import MappingProxyType
from typing import Final

from english_quest_api.grading.results import Family


class UnknownKindError(LookupError):
    """The kind, or the kind version, is not in the registry."""


@dataclass(frozen=True, slots=True)
class KindSpec:
    kind: str
    kind_version: int
    family: Family

    @property
    def schema_path(self) -> str:
        """Path of the kind's JSON Schema, relative to the content/schema root."""
        return f"kinds/v{self.kind_version}/{self.kind}.json"


_SPECS: Final = (
    KindSpec("multiple_choice", 1, Family.CHOICE),
    KindSpec("choose_word", 1, Family.CHOICE),
    KindSpec("listening_comprehension", 1, Family.CHOICE),
    KindSpec("fill_blank", 1, Family.TEXT_INPUT),
    KindSpec("spelling_correction", 1, Family.TEXT_INPUT),
    KindSpec("grammar_correction", 1, Family.TEXT_INPUT),
    KindSpec("sentence_transformation", 1, Family.TEXT_INPUT),
    KindSpec("word_matching", 1, Family.MATCHING),
    KindSpec("vocabulary_matching", 1, Family.MATCHING),
    KindSpec("sentence_ordering", 1, Family.ORDERING),
    KindSpec("pronunciation_practice", 1, Family.SELF_ASSESSED),
)

KINDS: Final[Mapping[str, KindSpec]] = MappingProxyType(
    {spec.kind: spec for spec in _SPECS}
)

SESSION_TYPES: Final = ("daily_review", "mixed_review")


def get_kind(kind: str, kind_version: int) -> KindSpec:
    spec = KINDS.get(kind)
    if spec is None or spec.kind_version != kind_version:
        raise UnknownKindError(f"unknown kind {kind!r} at version {kind_version}")
    return spec
