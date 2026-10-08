"""Authoring model for curriculum day files (content/days/day-NN.yaml).

Each exercise follows the exercise envelope v1 in the exercise engine design
(section 4). Scored kinds are multiple_choice, fill_blank, vocabulary_matching,
spelling_correction, sentence_ordering, listening_comprehension and
pronunciation_practice. The pronunciation_self_rating kind is unscored and
carries no points.
"""

from enum import StrEnum
from typing import Annotated, Literal, Self

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    StringConstraints,
    model_validator,
)

DAY_MIN = 1
DAY_MAX = 30

NonBlank = Annotated[str, StringConstraints(min_length=1, pattern=r"\S")]
EXERCISE_ID = r"^d(\d{2})-[a-z0-9]+(?:-[a-z0-9]+)*$"
LESSON_ID = r"^d(\d{2})-lesson-[a-z0-9]+(?:-[a-z0-9]+)*$"
TOPIC = r"^[a-z]+(\.[a-z_]+)+$"
WORD = r"^[a-z]+(?: [a-z]+)*$"
AUDIO_REF = r"^[a-z0-9]+(?:-[a-z0-9]+)*$"


class LearningArea(StrEnum):
    """The seven learning areas from PRD section 4."""

    PRONUNCIATION = "Pronunciation"
    GRAMMAR = "Grammar"
    VOCABULARY = "Vocabulary"
    SPELLING = "Spelling"
    LISTENING = "Listening"
    SENTENCE_CONSTRUCTION = "Sentence construction"
    REVIEW_AND_RETENTION = "Review and retention"


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


class LessonCard(_Strict):
    title: NonBlank
    body: NonBlank
    examples: list[NonBlank] = Field(default_factory=list, max_length=3)
    watch_out: NonBlank | None = None


class Lesson(_Strict):
    id: Annotated[str, StringConstraints(pattern=LESSON_ID)]
    learning_area: LearningArea
    title: NonBlank
    cards: list[LessonCard] = Field(min_length=1, max_length=6)


class VocabularyItem(_Strict):
    word: Annotated[str, StringConstraints(pattern=WORD)]
    definition: NonBlank
    example: NonBlank
    audio_ref: Annotated[str, StringConstraints(pattern=AUDIO_REF)]


class MatchPair(_Strict):
    word: NonBlank
    meaning: NonBlank


class ExerciseBase(_Strict):
    id: Annotated[str, StringConstraints(pattern=EXERCISE_ID)]
    learning_area: LearningArea
    origin: Literal["original"]
    topics: list[Annotated[str, StringConstraints(pattern=TOPIC)]] = Field(
        min_length=1, max_length=4
    )
    prompt: NonBlank
    explanation: NonBlank


class ScoredExercise(ExerciseBase):
    points: int = Field(ge=1, le=10)


def _normal(text: str) -> str:
    return " ".join(text.split()).casefold()


class _ChoiceExercise(ScoredExercise):
    choices: list[NonBlank] = Field(min_length=2, max_length=4)
    answer: NonBlank

    @model_validator(mode="after")
    def _exactly_one_correct_answer(self) -> Self:
        if len({_normal(choice) for choice in self.choices}) != len(self.choices):
            raise ValueError("choices must be unique")
        if self.answer not in self.choices:
            raise ValueError("answer must be one of the choices")
        return self


class MultipleChoiceExercise(_ChoiceExercise):
    type: Literal["multiple_choice"]


class ListeningComprehensionExercise(_ChoiceExercise):
    type: Literal["listening_comprehension"]
    audio_text: NonBlank


class PronunciationPracticeExercise(_ChoiceExercise):
    """Recognition only: the learner picks the written sentence they hear."""

    type: Literal["pronunciation_practice"]
    audio_text: NonBlank


class PronunciationSelfRatingExercise(ExerciseBase):
    """Unscored: the learner listens, says the sentence aloud and rates it."""

    type: Literal["pronunciation_self_rating"]
    learning_area: Literal[LearningArea.PRONUNCIATION]
    audio_text: NonBlank


class FillBlankExercise(ScoredExercise):
    type: Literal["fill_blank"]
    accepted: list[NonBlank] = Field(min_length=1)


class SpellingCorrectionExercise(ScoredExercise):
    type: Literal["spelling_correction"]
    text: NonBlank
    accepted: list[NonBlank] = Field(min_length=1)


class VocabularyMatchingExercise(ScoredExercise):
    type: Literal["vocabulary_matching"]
    pairs: list[MatchPair] = Field(min_length=2, max_length=6)


class SentenceOrderingExercise(ScoredExercise):
    type: Literal["sentence_ordering"]
    tokens: list[NonBlank] = Field(min_length=3, max_length=12)
    answer: list[NonBlank] = Field(min_length=3)

    @model_validator(mode="after")
    def _answer_uses_every_token_once(self) -> Self:
        if sorted(self.answer) != sorted(self.tokens):
            raise ValueError("answer must use every token exactly once")
        return self


Exercise = Annotated[
    MultipleChoiceExercise
    | ListeningComprehensionExercise
    | PronunciationPracticeExercise
    | PronunciationSelfRatingExercise
    | FillBlankExercise
    | SpellingCorrectionExercise
    | VocabularyMatchingExercise
    | SentenceOrderingExercise,
    Field(discriminator="type"),
]


class Day(_Strict):
    day: int = Field(ge=DAY_MIN, le=DAY_MAX)
    title: NonBlank
    lessons: list[Lesson] = Field(min_length=1, max_length=4)
    vocabulary: list[VocabularyItem] = Field(min_length=1, max_length=12)
    exercises: list[Exercise] = Field(min_length=1)

    @model_validator(mode="after")
    def _ids_are_unique(self) -> Self:
        lesson_ids = [lesson.id for lesson in self.lessons]
        exercise_ids = [exercise.id for exercise in self.exercises]
        if len(set(lesson_ids + exercise_ids)) != len(lesson_ids) + len(exercise_ids):
            raise ValueError("lesson and exercise ids must be unique")
        return self
