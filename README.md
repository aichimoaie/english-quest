# English Quest

A web app for improving English over a 30-day learning journey.

Product requirements: [docs/prd/english-quest-prd.md](docs/prd/english-quest-prd.md).
Workstream dependency map: [docs/implementation/workstreams.md](docs/implementation/workstreams.md).

## Layout

| Path | What it holds |
|---|---|
| `apps/api` | FastAPI service (Python 3.12, uv). |
| `apps/web` | Next.js web app, static export (workstream 1). |
| `content/` | Curriculum as reviewed YAML and JSON Schemas (workstreams 4 and 6). |
| `deployment/terraform/` | Terraform roots for the Azure MVP and the dev and prod environments (workstream 7). Spin up and down with `scripts/infra.sh`; see [its README](deployment/terraform/README.md). |
| `docs/` | PRD, implementation notes, and ADRs. |

## Run the API locally

Prerequisites: Python 3.12, [uv](https://docs.astral.sh/uv/), and Docker.

```bash
cp .env.example .env                 # local settings; .env is git-ignored
docker compose up -d db              # PostgreSQL 18 on localhost:5432
cd apps/api
uv sync                              # install the API and dev tools
uv run uvicorn english_quest_api.main:create_app --factory --reload --port 8000
```

Then open <http://localhost:8000/api/v1/health> (returns `{"status": "ok"}`) and <http://localhost:8000/docs>.

## Run the web app locally

Prerequisites: Node 22.18 or later and pnpm (the version in the root `package.json`). Node 22.18 is the floor because the fixture scripts run `.mts` files without a loader.

```bash
pnpm install                         # from the repo root
pnpm dev                             # http://localhost:3000
```

In `pnpm dev` and tests, when `NEXT_PUBLIC_API_BASE_URL` is unset, the app uses a temporary fixture server in the browser, so it can be previewed without the API. Fixture state lives in memory and resets on reload. The fixture course data is generated from `content/days` by `apps/web/scripts/build-fixture-content.mts`, which the `pre` scripts run before dev, test, build, typecheck, and lint. Fixtures are not included in production builds, so set `NEXT_PUBLIC_API_BASE_URL` to a running API for any build you deploy or preview against the real one. `pnpm build` writes the static export to `apps/web/out`. The checks are `pnpm lint`, `pnpm typecheck`, and `pnpm test`; CI runs the same commands (see [docs/ci.md](docs/ci.md)).

## Check the API

Run these from `apps/api`:

```bash
uv run ruff check . && uv run ruff format --check .   # lint and format
uv run mypy                                           # type-check src and tests
uv run pytest                                         # unit tests
```

## OpenAPI document

The web client is generated from `apps/api/openapi.json`. Regenerate it after any change to the API surface:

```bash
cd apps/api
uv run export-openapi                # writes apps/api/openapi.json
```

`tests/test_app.py` fails if the committed file is out of date.

## Errors

Every error response is an RFC 9457 problem document with content type `application/problem+json`. Routes whose service has not landed yet return `501 Not Implemented` in that format.
