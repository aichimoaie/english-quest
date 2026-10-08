import argparse
import json
from pathlib import Path
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from english_quest_api.api.errors import register_error_handlers
from english_quest_api.api.router import api_router
from english_quest_api.config import Settings, get_settings

# apps/api/openapi.json, the file the web client is generated from.
DEFAULT_OPENAPI_PATH = Path(__file__).resolve().parents[2] / "openapi.json"


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()

    app = FastAPI(
        title="English Quest API",
        version="0.1.0",
        summary="API for the 30-day English course.",
    )

    # Error handlers are registered first so the catch-all middleware sits inside CORS.
    register_error_handlers(app)
    # The web app runs on its own origin and sends the session cookie, so credentials
    # are allowed and origins must be explicit (never "*").
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type", "Accept"],
    )
    app.include_router(api_router)
    return app


def openapi_document(app: FastAPI) -> dict[str, Any]:
    return app.openapi()


def export_openapi(output: Path = DEFAULT_OPENAPI_PATH, settings: Settings | None = None) -> Path:
    document = openapi_document(create_app(settings))
    output.write_text(json.dumps(document, indent=2) + "\n", encoding="utf-8")
    return output


def export_openapi_cli(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="Write the OpenAPI document as JSON.")
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OPENAPI_PATH,
        help="File to write (default: apps/api/openapi.json).",
    )
    args = parser.parse_args(argv)
    written = export_openapi(args.output)
    print(f"Wrote OpenAPI document to {written}")


if __name__ == "__main__":
    export_openapi_cli()
