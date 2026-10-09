"""Review routes: /review from the API sketch. Practice only; never changes accuracy."""

from fastapi import APIRouter, HTTPException
from pydantic import Field

from english_quest_api.api.common import ApiModel
from english_quest_api.api.exercises import AnswerResult, AnswerSubmission, ExercisePrompt

router = APIRouter(prefix="/review", tags=["review"])


class ReviewItem(ApiModel):
    exercise: ExercisePrompt
    explain: bool


class ReviewSet(ApiModel):
    items: list[ReviewItem] = Field(default_factory=list)


@router.get("/daily", response_model=ReviewSet)
def get_daily_review() -> ReviewSet:
    raise HTTPException(status_code=501, detail="Daily review is not implemented yet.")


@router.get("/mixed", response_model=ReviewSet)
def get_mixed_review() -> ReviewSet:
    raise HTTPException(status_code=501, detail="Mixed review is not implemented yet.")


@router.post("/answers", response_model=AnswerResult)
def submit_review_answer(body: AnswerSubmission) -> AnswerResult:
    raise HTTPException(status_code=501, detail="Answering a review item is not implemented yet.")
