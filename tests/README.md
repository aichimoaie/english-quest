# Automated tests

Shared test configuration and harnesses for English Quest (workstream 9). Each workstream still
writes unit tests for its own modules; this folder holds the tools, the helpers, and the cross-cutting
checks: browser flows, accessibility, layout at phone width, API contract, and content validation.

## Layout

| Path | What it is | Runs with |
|---|---|---|
| `package.json` | Test scripts and the JavaScript test toolchain (Playwright, axe, Vitest, TypeScript) | `pnpm install` here |
| `playwright.config.ts` | Playwright config: `desktop-chrome` and `pixel-7` projects, starts the app when it exists. The root `playwright.config.ts` re-exports it. | `pnpm test:e2e` |
| `e2e/support/` | Helpers: `axe.ts` (accessibility), `auth.ts` (sign-in), `layout.ts` (no horizontal scroll at 390 px), `overflow.ts` and `violations.ts` (pure checks, unit-tested), `readiness.ts` (what is on main), `static-server.mjs` (serves the static export) | imported by specs |
| `e2e/global-setup.ts`, `e2e/global-teardown.ts` | Migrate and seed the test database; remove the per-run output directory | Playwright |
| `e2e/helpers.spec.ts` | Helper tests with fixed HTML fixtures (`@helper`). Each helper has a negative control. | `pnpm test:e2e:helpers` |
| `e2e/day-flow.spec.ts` | Smoke test of the day flow through the public UI only (`@smoke`) | `pnpm test:e2e` |
| `e2e/no-horizontal-scroll.spec.ts` | Every key page at 390 px (`@layout`) | `pnpm test:e2e` |
| `unit/` | Vitest tests for the pure helpers (`violations.ts`, `overflow.ts`) | `pnpm test:unit` |
| `vitest.config.ts` | Vitest config. It includes `apps/web/**/*.test.*` for workstream 1. | `pnpm test:unit` |
| `pytest.ini`, `pyproject.toml`, `uv.lock` | pytest config and the locked test toolchain | see below |
| `api/` | Schemathesis contract harness (`schemathesis_support.py`) and its tests | pytest |
| `content/` | Curriculum validator harness (`curriculum_validator.py`) and its tests | pytest |
| `fixtures/pages/` | HTML fixtures used as positive and negative controls | |

## Commands

JavaScript commands run from `tests/`, where `package.json` lives:

```bash
cd tests
pnpm install                     # JavaScript test tooling
pnpm test:unit                   # Vitest
pnpm typecheck:tests             # tsc over tests/ and playwright.config.ts
pnpm test:e2e:helpers            # Playwright helper tests (no app needed)
pnpm test:e2e                    # all Playwright specs; app-level specs skip until the app is on main
```

Python commands run from the repository root:

```bash
uv run --project tests pytest -c tests/pytest.ini tests   # Python tests (pass the directory: bare runs also collect apps/api)
uv run --project tests --with ruff==0.16.10 ruff check tests
(cd tests && uv run --with mypy==2.4.0 mypy)           # mypy reads its paths from tests/pyproject.toml
```

Playwright uses its bundled Chromium.

## Environment variables

| Variable | Used by | Purpose |
|---|---|---|
| `EQ_TEST_DATABASE_URL` | Playwright, pytest | The dedicated PostgreSQL test database. The API starts only with it, and never uses the ambient `DATABASE_URL`. The Playwright global setup migrates it and seeds the learner account. The database-backed specs and the contract run fail without it. Helper specs run without it. |
| `EQ_LEARNER_EMAIL`, `EQ_LEARNER_PASSWORD` | Playwright | The one learner account for authenticated specs. Never commit them. |

## What skips, and why

Skipped tests name their dependency in the skip reason.

| Test | Waits for |
|---|---|
| `@smoke` day flow, `@layout` learner pages | `apps/web` (workstream 1) and `apps/api` (workstream 2) on main; learner credentials for the authenticated pages |
| `@layout` public page `/login` | `apps/web` and `apps/api` on main |
| `test_openapi_contract.py` | `apps/api` on main with its dependencies installed. Also needs `EQ_TEST_DATABASE_URL`, and migrates that database with `alembic upgrade head`. For the API tests, add `--with-editable apps/api` to the `uv run` command. |
| `test_curriculum_validator_accepts_every_day_file` | `content/days` (workstream 6) and the curriculum validator |

## Assumptions to confirm with other workstreams

These names come from the architecture report and are not yet on main. Change the constant, not the test, if they differ.

- App factory: `english_quest_api.main:create_app` (`apps/api/src/english_quest_api/main.py`).
- Health route: `/api/v1/health`. OpenAPI document: `/openapi.json` (FastAPI default).
- Curriculum validator: `english_quest_api.curriculum.validate`, run with the content directory as its argument.
- Web app: static export in `apps/web/out`, with a `build` script in `apps/web/package.json`.
- Sign-in page: `/login` with fields labelled `Email` and `Password`, and a `Sign in` button.
- Day flow labels (from the prototype's UI text): `Your 30 days` heading, a `Day 1` link or button, `Check answer` and `Continue` buttons, and `Correct` or `Not quite` feedback. Choice answers are buttons whose pressed state is `aria-pressed`.
- Learner seeding: `tests/e2e/global-setup.ts` runs `alembic upgrade head` and `python -m english_quest_api.seed_learner` against `EQ_TEST_DATABASE_URL`, with `EQ_LEARNER_EMAIL` and `EQ_LEARNER_PASSWORD` in the environment. Workstream 5 (authentication) must provide that command.
- Contract run database: `test_openapi_contract.py` points `DATABASE_URL` at `EQ_TEST_DATABASE_URL`, runs `alembic upgrade head` on it, and only then imports the app. It never uses SQLite. Change the variable name if `apps/api` reads a different one.

## Not in this folder

- `.gitignore` entries for `node_modules/` and `.pytest_cache/` (workstream 2 owns `.gitignore`). The root `.gitignore` lists the web build output (`apps/web/.next/`, `apps/web/out/`) and the CI HTML report (`playwright-report/`). It also lists `test-results/`, which no run writes to now. Traces are off, so typed credentials and cookies never reach a trace. Failure screenshots and error context go to a private per-run temp directory outside the worktree, which each run removes when it ends, in CI as well as locally. CI keeps the HTML report in `playwright-report/`.
- The CI workflow that runs these commands (workstream 8).
- The root `package.json` and `pnpm-workspace.yaml` (workstream 1 owns them). This folder keeps its own `package.json` and `uv.lock` so the test tooling does not touch the root manifest. No pnpm lock file is committed here.
