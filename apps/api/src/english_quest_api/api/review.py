"""Review routes: /review from the API sketch. Practice only; never changes accuracy."""

from fastapi import APIRouter
from pydantic import Field

from english_quest_api.api.common import ApiModel, not_implemented
from english_quest_api.api.exercises import AnswerResult, AnswerSubmission, ExercisePrompt

router = APIRouter(prefix="/review", tags=["review"])


class ReviewSet(ApiModel):
    items: list[ExercisePrompt] = Field(default_factory=list)


@router.get("/daily", response_model=ReviewSet)
def get_daily_review() -> ReviewSet:
    not_implemented("Daily review")


@router.get("/mixed", response_model=ReviewSet)
def get_mixed_review() -> ReviewSet:
    not_implemented("Mixed review")


@router.post("/answers", response_model=AnswerResult)
def submit_review_answer(body: AnswerSubmission) -> AnswerResult:
    not_implemented("Answering a review item")
