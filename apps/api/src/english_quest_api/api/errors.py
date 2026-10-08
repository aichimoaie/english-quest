"""RFC 9457 problem details for every error the API returns."""

import logging
from collections.abc import Mapping
from http import HTTPStatus
from typing import Any

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

PROBLEM_MEDIA_TYPE = "application/problem+json"

logger = logging.getLogger(__name__)


class ProblemDetails(BaseModel):
    """Problem details object, RFC 9457 section 3.1, plus a list of field errors."""

    type: str = "about:blank"
    title: str
    status: int
    detail: str | None = None
    instance: str | None = None
    errors: list[dict[str, Any]] | None = None


def _problem_response(
    request: Request,
    status: int,
    detail: str | None = None,
    errors: list[dict[str, Any]] | None = None,
    headers: Mapping[str, str] | None = None,
) -> JSONResponse:
    title = HTTPStatus(status).phrase
    problem = ProblemDetails(
        title=title,
        status=status,
        detail=detail,
        instance=request.url.path,
        errors=errors,
    )
    return JSONResponse(
        content=problem.model_dump(exclude_none=True),
        status_code=status,
        media_type=PROBLEM_MEDIA_TYPE,
        headers=headers,
    )


async def _http_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, StarletteHTTPException)
    detail = exc.detail if isinstance(exc.detail, str) else None
    return _problem_response(request, exc.status_code, detail, headers=exc.headers)


async def _validation_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, RequestValidationError)
    return _problem_response(
        request,
        HTTPStatus.UNPROCESSABLE_ENTITY,
        detail="The request did not match the API schema.",
        errors=jsonable_encoder(exc.errors()),
    )


async def _unhandled_error_middleware(
    request: Request, call_next: RequestResponseEndpoint
) -> Response:
    # Runs inside CORSMiddleware so the 500 problem document still carries CORS headers.
    try:
        return await call_next(request)
    except Exception:
        # Never send the exception text to the client; it is logged by the server.
        logger.exception("Unhandled error serving %s %s", request.method, request.url.path)
        return _problem_response(request, HTTPStatus.INTERNAL_SERVER_ERROR)


def register_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(StarletteHTTPException, _http_exception_handler)
    app.add_exception_handler(RequestValidationError, _validation_exception_handler)
    app.add_middleware(BaseHTTPMiddleware, dispatch=_unhandled_error_middleware)
