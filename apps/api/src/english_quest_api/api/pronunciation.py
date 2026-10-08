"""Pronunciation route: /pronunciation/attempts. Recognition only; never speech-scored."""

from typing import Literal

from fastapi import APIRouter, HTTPException

from english_quest_api.api.common import ApiModel

router = APIRouter(prefix="/pronunciation", tags=["pronunciation"])


class PronunciationAttemptIn(ApiModel):
    item_id: str
    method: Literal["recognition"]
    transcript: str | None = None
    # Wording of the rating options is still open in the PRD; recorded, never scored.
    self_rating: str | None = None


class PronunciationAttemptOut(ApiModel):
    score: int | None = None
    feedback: str


@router.post("/attempts", response_model=PronunciationAttemptOut)
def record_pronunciation_attempt(body: PronunciationAttemptIn) -> PronunciationAttemptOut:
    raise HTTPException(status_code=501, detail="Pronunciation practice is not implemented yet.")
