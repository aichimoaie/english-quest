import json
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import ValidationError

from english_quest_api.config import Settings
from english_quest_api.main import DEFAULT_OPENAPI_PATH, create_app, export_openapi

PROBLEM_JSON = "application/problem+json"
WEB_ORIGIN = "http://localhost:3000"
DATABASE_URL = "postgresql+psycopg://u:p@db:5432/eq"
SETTINGS = Settings(database_url=DATABASE_URL, cors_allowed_origins=[WEB_ORIGIN])


@pytest.fixture
def client() -> TestClient:
    return TestClient(create_app(SETTINGS))


def test_health_returns_200(client: TestClient) -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_unknown_route_is_a_problem_document(client: TestClient) -> None:
    response = client.get("/no-such-route")

    assert response.status_code == 404
    assert response.headers["content-type"].startswith(PROBLEM_JSON)
    assert response.json() == {
        "type": "about:blank",
        "title": "Not Found",
        "status": 404,
        "detail": "Not Found",
        "instance": "/no-such-route",
    }


def test_invalid_day_number_is_a_validation_problem(client: TestClient) -> None:
    response = client.get("/api/v1/days/0")

    body = response.json()
    assert response.status_code == 422
    assert response.headers["content-type"].startswith(PROBLEM_JSON)
    assert body["title"] == "Unprocessable Entity"
    assert body["instance"] == "/api/v1/days/0"
    assert body["errors"]


def test_routes_without_a_service_return_501_problem(client: TestClient) -> None:
    response = client.get("/api/v1/days")

    assert response.status_code == 501
    assert response.headers["content-type"].startswith(PROBLEM_JSON)
    assert response.json()["detail"] == "Listing days is not implemented yet."


def test_unhandled_error_does_not_leak_details() -> None:
    app = create_app(SETTINGS)

    def explode() -> None:
        raise RuntimeError("secret internals")

    app.add_api_route("/explode", explode)
    client = TestClient(app, raise_server_exceptions=False)

    response = client.get("/explode")

    assert response.status_code == 500
    assert response.headers["content-type"].startswith(PROBLEM_JSON)
    assert "secret internals" not in response.text
    assert "detail" not in response.json()


def test_unhandled_error_response_carries_cors_headers() -> None:
    app = create_app(SETTINGS)

    def explode() -> None:
        raise RuntimeError("secret internals")

    app.add_api_route("/explode", explode)
    client = TestClient(app, raise_server_exceptions=False)

    response = client.get("/explode", headers={"Origin": WEB_ORIGIN})

    assert response.status_code == 500
    assert response.headers["access-control-allow-origin"] == WEB_ORIGIN


def test_cors_allows_configured_web_origin(client: TestClient) -> None:
    response = client.get("/api/v1/health", headers={"Origin": WEB_ORIGIN})

    assert response.headers["access-control-allow-origin"] == WEB_ORIGIN
    assert response.headers["access-control-allow-credentials"] == "true"


def test_cors_rejects_other_origins(client: TestClient) -> None:
    response = client.get("/api/v1/health", headers={"Origin": "https://evil.example"})

    assert "access-control-allow-origin" not in response.headers


@pytest.fixture
def isolated_cwd(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    # Run from an empty directory so no real .env file is picked up.
    monkeypatch.chdir(tmp_path)
    for name in ("CORS_ALLOWED_ORIGINS", "DATABASE_URL"):
        monkeypatch.delenv(name, raising=False)
    return tmp_path


def test_settings_read_from_environment(
    isolated_cwd: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("CORS_ALLOWED_ORIGINS", "https://app.example.com, https://b.example.com")
    monkeypatch.setenv("DATABASE_URL", DATABASE_URL)

    settings = Settings()

    assert settings.cors_allowed_origins == ["https://app.example.com", "https://b.example.com"]
    assert settings.database_url == DATABASE_URL


def test_settings_read_from_dotenv_file(isolated_cwd: Path) -> None:
    (isolated_cwd / ".env").write_text(
        f"CORS_ALLOWED_ORIGINS=https://app.example.com\nDATABASE_URL={DATABASE_URL}\n",
        encoding="utf-8",
    )

    settings = Settings()

    assert settings.cors_allowed_origins == ["https://app.example.com"]
    assert settings.database_url == DATABASE_URL


@pytest.mark.parametrize(
    "environment_values",
    [
        {},
        {"DATABASE_URL": DATABASE_URL},
        {"CORS_ALLOWED_ORIGINS": "https://app.example.com"},
    ],
)
def test_settings_refuse_to_load_without_database_url_and_web_origin(
    isolated_cwd: Path, monkeypatch: pytest.MonkeyPatch, environment_values: dict[str, str]
) -> None:
    for name, value in environment_values.items():
        monkeypatch.setenv(name, value)

    with pytest.raises(ValidationError):
        Settings()


@pytest.mark.parametrize(
    "environment_values",
    [
        {"DATABASE_URL": "", "CORS_ALLOWED_ORIGINS": "https://app.example.com"},
        {"DATABASE_URL": "   ", "CORS_ALLOWED_ORIGINS": "https://app.example.com"},
        {"DATABASE_URL": DATABASE_URL, "CORS_ALLOWED_ORIGINS": ""},
        {"DATABASE_URL": DATABASE_URL, "CORS_ALLOWED_ORIGINS": " , "},
        {"DATABASE_URL": DATABASE_URL, "CORS_ALLOWED_ORIGINS": "*"},
        {"DATABASE_URL": DATABASE_URL, "CORS_ALLOWED_ORIGINS": "https://app.example.com,*"},
        {"DATABASE_URL": DATABASE_URL, "CORS_ALLOWED_ORIGINS": "app.example.com"},
    ],
)
def test_settings_refuse_empty_or_wildcard_values(
    isolated_cwd: Path, monkeypatch: pytest.MonkeyPatch, environment_values: dict[str, str]
) -> None:
    for name, value in environment_values.items():
        monkeypatch.setenv(name, value)

    with pytest.raises(ValidationError):
        Settings()


@pytest.mark.parametrize(
    "origin",
    [
        "https://app.example.com/",
        "https://app.example.com/path",
        "https://app.example.com?x=1",
        "https://app.example.com#top",
        "https://user@app.example.com",
        "https://app.example.com:",
    ],
)
def test_settings_refuse_origins_not_in_scheme_host_port_form(
    isolated_cwd: Path, monkeypatch: pytest.MonkeyPatch, origin: str
) -> None:
    monkeypatch.setenv("DATABASE_URL", DATABASE_URL)
    monkeypatch.setenv("CORS_ALLOWED_ORIGINS", origin)

    with pytest.raises(ValidationError):
        Settings()


@pytest.mark.parametrize("origin", ["https://app.example.com:8443", "http://localhost:3000"])
def test_settings_accept_scheme_host_port_origin(
    isolated_cwd: Path, monkeypatch: pytest.MonkeyPatch, origin: str
) -> None:
    monkeypatch.setenv("DATABASE_URL", DATABASE_URL)
    monkeypatch.setenv("CORS_ALLOWED_ORIGINS", origin)

    assert Settings().cors_allowed_origins == [origin]


def test_openapi_lists_the_section_6_surface(client: TestClient) -> None:
    paths = set(client.get("/openapi.json").json()["paths"])

    assert {
        "/api/v1/health",
        "/api/v1/days",
        "/api/v1/days/{day}",
        "/api/v1/days/{day}/attempts",
        "/api/v1/attempts/{attempt_id}/answers",
        "/api/v1/attempts/{attempt_id}/complete",
        "/api/v1/review/daily",
        "/api/v1/review/mixed",
        "/api/v1/review/answers",
        "/api/v1/progress",
        "/api/v1/progress/streak",
        "/api/v1/vocabulary",
        "/api/v1/pronunciation/attempts",
    } <= paths


def test_committed_openapi_document_is_up_to_date(tmp_path: Path) -> None:
    generated = tmp_path / "openapi.json"
    export_openapi(generated, SETTINGS)

    committed = json.loads(DEFAULT_OPENAPI_PATH.read_text(encoding="utf-8"))

    assert json.loads(generated.read_text(encoding="utf-8")) == committed


def test_app_factory_returns_a_fresh_app() -> None:
    first = create_app(SETTINGS)
    second = create_app(SETTINGS)

    assert isinstance(first, FastAPI)
    assert first is not second
