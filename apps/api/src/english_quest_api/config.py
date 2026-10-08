from functools import lru_cache
from typing import Annotated

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings, read from the environment and from `.env` at the repo root."""

    # The repo-root .env is found when running from apps/api; a .env in the
    # current directory covers running from the repo root.
    model_config = SettingsConfigDict(
        env_file=("../../.env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str
    # Comma-separated in the environment, e.g. CORS_ALLOWED_ORIGINS=https://app.example.com
    cors_allowed_origins: Annotated[list[str], NoDecode]

    @field_validator("cors_allowed_origins", mode="before")
    @classmethod
    def _split_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
