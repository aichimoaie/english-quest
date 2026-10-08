"""Exercise DTOs shared by the day, attempt and review routes.

These describe the wire shape only. Workstream 4 (exercise engine) owns the
content schema and grading, and may refine these fields.
"""

from typing import Literal

from english_quest_api.api.common import ApiModel

ExerciseType = Literal[
    "multiple_choice",
    "fill_in_blank",
    "choose_word",
    "spelling_correction",
    "word_matching",
    "sentence_ordering",
    "vocabulary_matching",
    "grammar_correction",
    "listening_comprehension",
    "pronunciation_practice",
    "sentence_transformation",
    "daily_review",
    "mixed_review",
]


class ExercisePrompt(ApiModel):
    """An exercise as the learner sees it. Never includes the answer key."""

    id: str
    type: ExerciseType
    prompt: str
    options: list[str] | None = None


class AnswerSubmission(ApiModel):
    exercise_id: str
    # A typed string, a chosen option, or an ordered list for sentence ordering.
    submitted: str | list[str]


class AnswerResult(ApiModel):
    is_correct: bool
    # Only present once the answer is recorded, so keys are never sent earlier.
    expected: str | list[str] | None = None
    explanation: str
    feedback_key: str
