"""Progress routes: /progress, /progress/streak and /vocabulary from the API sketch."""

from datetime import date

from fastapi import APIRouter

from english_quest_api.api.common import ApiModel, not_implemented

router = APIRouter(tags=["progress"])


class Streak(ApiModel):
    current: int
    longest: int


class Progress(ApiModel):
    completed_days: int
    overall_pct: int
    accuracy_pct: int
    streak: Streak
    weak_topics: list[str]
    vocabulary_learned: int


class StreakDetail(Streak):
    last_active_date: date | None = None
    grace_used: bool


class VocabularyItem(ApiModel):
    id: str
    word: str
    definition: str
    example: str
    day_number: int
    times_correct: int
    times_wrong: int


@router.get("/progress", response_model=Progress)
def get_progress() -> Progress:
    not_implemented("Progress")


@router.get("/progress/streak", response_model=StreakDetail)
def get_streak() -> StreakDetail:
    not_implemented("Streak")


@router.get("/vocabulary", response_model=list[VocabularyItem])
def list_vocabulary() -> list[VocabularyItem]:
    not_implemented("Vocabulary")
