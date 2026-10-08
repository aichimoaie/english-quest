"""Result and error types shared by every grading family.

Pure module: no I/O, no clock, no randomness.
"""

from collections.abc import Mapping
from dataclasses import dataclass, field
from enum import StrEnum
from typing import Any

NEAR_MISS_CREDIT = 0.5


class Family(StrEnum):
    """The evaluator that scores a kind. A new family needs a new response shape."""

    CHOICE = "choice"
    TEXT_INPUT = "text_input"
    MATCHING = "matching"
    ORDERING = "ordering"
    SELF_ASSESSED = "self_assessed"


class InvalidResponseError(ValueError):
    """A response is well-formed but cannot be scored against this content."""


@dataclass(frozen=True, slots=True)
class EvaluationResult:
    """The outcome of scoring one response.

    ``credit`` is in [0, 1], or ``None`` when the attempt cannot be scored yet
    (``needs_review``). ``recorded`` is ``False`` only when no attempt should be
    stored at all (a skipped self-rating).
    """

    credit: float | None
    feedback_code: str
    normalized_response: Mapping[str, Any]
    family: Family
    family_version: int = 1
    feedback_params: Mapping[str, str] = field(default_factory=dict)
    counts_toward_accuracy: bool = True
    recorded: bool = True
