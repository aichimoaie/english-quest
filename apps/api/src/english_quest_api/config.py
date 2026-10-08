from functools import lru_cache
from typing import Annotated
from urllib.parse import urlsplit

from pydantic import StringConstraints, field_validator
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

    database_url: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
    # Comma-separated in the environment, e.g. CORS_ALLOWED_ORIGINS=https://app.example.com
    cors_allowed_origins: Annotated[list[str], NoDecode]

    @field_validator("cors_allowed_origins", mode="before")
    @classmethod
    def _split_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @field_validator("cors_allowed_origins")
    @classmethod
    def _require_concrete_origins(cls, origins: list[str]) -> list[str]:
        if not origins:
            raise ValueError("at least one web origin is required")
        for origin in origins:
            parts = urlsplit(origin)
            default_port = {"http": 80, "https": 443}.get(parts.scheme)
            if (
                default_port is None
                or not parts.hostname
                or "@" in parts.netloc
                or origin != origin.lower()
                or origin != f"{parts.scheme}://{parts.netloc}"
                or parts.port in (0, default_port)
            ):
                raise ValueError(f"origin must be exactly scheme://host[:port]: {origin!r}")
        return origins


@lru_cache
def get_settings() -> Settings:
    return Settings()
