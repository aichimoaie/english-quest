from typing import Literal

from fastapi import APIRouter

from english_quest_api.api.common import ApiModel

router = APIRouter(tags=["health"])


class Health(ApiModel):
    status: Literal["ok"]


@router.get("/health", response_model=Health)
def get_health() -> Health:
    return Health(status="ok")
