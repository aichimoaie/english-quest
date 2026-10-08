"""The /api/v1 router. Other workstreams mount their routers here (auth is workstream 5)."""

from fastapi import APIRouter

from english_quest_api.api import health, learning, progress, pronunciation, review

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health.router)
api_router.include_router(learning.router)
api_router.include_router(review.router)
api_router.include_router(progress.router)
api_router.include_router(pronunciation.router)
