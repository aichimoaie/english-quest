# Automated tests

Shared test configuration and harnesses for English Quest (workstream 9). Each workstream still
writes unit tests for its own modules; this folder holds the tools, the helpers, and the cross-cutting
checks: browser flows, accessibility, layout at phone width, API contract, and content validation.

## Layout

| Path | What it is | Runs with |
|---|---|---|
| `../playwright.config.ts` | Playwright config: `desktop-chrome` and `pixel-7` projects, starts the app when it exists | `pnpm test:e2e` |
| `e2e/support/` | Helpers: `axe.ts` (accessibility), `layout.ts` (no horizontal scroll at 390 px), `readiness.ts` (what is on main) | imported by specs |
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

From the repository root:

```bash
pnpm install                     # JavaScript test tooling
pnpm test:unit                   # Vitest
pnpm typecheck:tests             # tsc over tests/ and playwright.config.ts
pnpm test:e2e:helpers            # Playwright helper tests (no app needed)
pnpm test:e2e                    # all Playwright specs; app-level specs skip until the app is on main

uv run --project tests pytest -c tests/pytest.ini      # Python tests
uv run --project tests --with ruff==0.16.10 ruff check tests
(cd tests && uv run --with mypy==2.4.0 mypy)           # mypy reads its paths from tests/pyproject.toml
```

Playwright uses its bundled Chromium. To use an installed Chrome instead, set `EQ_PW_CHANNEL=chrome`.

## Environment variables

| Variable | Used by | Purpose |
|---|---|---|
| `EQ_BASE_URL` | Playwright | Run against a running or deployed web app. No server is started. |
| `EQ_WEB_COMMAND` | Playwright | Command that serves the web app. Default: build `apps/web` and serve `apps/web/out`. |
| `EQ_API_COMMAND` | Playwright | Command that starts the API. Default: `uvicorn english_quest_api.main:create_app --factory`. |
| `EQ_PW_CHANNEL` | Playwright | Browser channel, for example `chrome`. |
| `EQ_LEARNER_EMAIL`, `EQ_LEARNER_PASSWORD` | Playwright | The one learner account for authenticated specs. Never commit them. |
| `EQ_CURRICULUM_VALIDATOR` | pytest | Command for the curriculum validator. Default: `python -m english_quest_api.curriculum.validate`. |

## What skips, and why

Skipped tests name their dependency in the skip reason.

| Test | Waits for |
|---|---|
| `@smoke` day flow, `@layout` learner pages | `apps/web` (workstream 1) and `apps/api` (workstream 2) on main, or `EQ_BASE_URL`; learner credentials for the authenticated pages |
| `@layout` public page `/login` | `apps/web` and `apps/api` on main, or `EQ_BASE_URL` |
| `test_openapi_contract.py` | `apps/api` on main with its dependencies installed. For the API tests, add `--with-editable apps/api` to the `uv run` command. |
| `test_curriculum_validator_accepts_every_day_file` | `content/days` (workstream 6) and the curriculum validator |

## Assumptions to confirm with other workstreams

These names come from the architecture report and are not yet on main. Change the constant, not the test, if they differ.

- App factory: `english_quest_api.main:create_app` (`apps/api/src/english_quest_api/main.py`).
- Health route: `/api/v1/health`. OpenAPI document: `/openapi.json` (FastAPI default).
- Curriculum validator: `english_quest_api.curriculum.validate`, run with the content directory as its argument.
- Web app: static export in `apps/web/out`, with a `build` script in `apps/web/package.json`.
- Sign-in page: `/login` with fields labelled `Email` and `Password`, and a `Sign in` button.
- Day flow labels (from the prototype's UI text): `Your 30 days` heading, a `Day 1` link or button, `Check answer` and `Continue` buttons, and `Correct` or `Not quite` feedback.

## Not in this folder

- `.gitignore` entries for `node_modules/`, `playwright-report/`, `test-results/`, `.pytest_cache/` (workstream 2 owns `.gitignore`).
- The CI workflow that runs these commands (workstream 8).
- `pnpm-workspace.yaml`, the root `pnpm-lock.yaml`, and the root `package.json` scripts beyond the test ones (workstream 1 owns them).
