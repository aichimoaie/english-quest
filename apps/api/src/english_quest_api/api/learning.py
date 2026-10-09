"""Day and attempt routes: /days and /attempts from the API sketch."""

from typing import Annotated, Literal

from fastapi import APIRouter, HTTPException, Path
from pydantic import Field

from english_quest_api.api.common import ApiModel
from english_quest_api.api.exercises import AnswerResult, AnswerSubmission, ExercisePrompt

router = APIRouter(tags=["learning"])

DayNumber = Annotated[int, Path(ge=1, le=30)]
DayStatus = Literal["locked", "current", "completed"]


class DaySummary(ApiModel):
    day_number: int
    title: str
    objective: str
    status: DayStatus
    best_score_pct: int | None = None


class DayVocabulary(ApiModel):
    word: str
    definition: str
    example: str


class LessonCard(ApiModel):
    title: str
    explanation: str
    watch_out: str | None = None
    examples: list[str] = Field(default_factory=list)


class TextScreen(ApiModel):
    """A day intro or reading text. The learner reads it, then presses Start or Next."""

    kind: Literal["text"]
    id: str
    title: str
    cards: list[LessonCard]


class TestScreen(ApiModel):
    """One test: its intro, then its items, then a results screen with that test's score."""

    kind: Literal["test"]
    id: str
    title: str
    intro: str
    exercises: list[ExercisePrompt]


DayScreen = Annotated[TextScreen | TestScreen, Field(discriminator="kind")]


class DayDetail(ApiModel):
    day_number: int
    title: str
    objective: str
    status: DayStatus
    vocabulary: list[DayVocabulary]
    # The screens in the order the learner meets them. The day ends after the last test.
    screens: list[DayScreen]


class AttemptStarted(ApiModel):
    attempt_id: str
    exercises: list[ExercisePrompt]


class AttemptCompleted(ApiModel):
    score_pct: int = Field(ge=0, le=100)
    status: Literal["passed", "not_passed"]
    day_status: DayStatus
    next_day: int | None = None


@router.get("/days", response_model=list[DaySummary])
def list_days() -> list[DaySummary]:
    raise HTTPException(status_code=501, detail="Listing days is not implemented yet.")


@router.get("/days/{day}", response_model=DayDetail)
def get_day(day: DayNumber) -> DayDetail:
    raise HTTPException(status_code=501, detail="Reading a day is not implemented yet.")


@router.post("/days/{day}/attempts", response_model=AttemptStarted, status_code=201)
def start_attempt(day: DayNumber) -> AttemptStarted:
    # 409 when the day is locked, once the learning service exists.
    raise HTTPException(status_code=501, detail="Starting a run is not implemented yet.")


@router.post("/attempts/{attempt_id}/answers", response_model=AnswerResult)
def submit_answer(attempt_id: str, body: AnswerSubmission) -> AnswerResult:
    raise HTTPException(status_code=501, detail="Submitting an answer is not implemented yet.")


@router.post("/attempts/{attempt_id}/complete", response_model=AttemptCompleted)
def complete_attempt(attempt_id: str) -> AttemptCompleted:
    raise HTTPException(status_code=501, detail="Completing a run is not implemented yet.")
