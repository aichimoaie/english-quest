# CI/CD

Two GitHub Actions workflows live in `.github/workflows/`:

| Workflow | File | Runs on | Purpose |
| --- | --- | --- | --- |
| PR checks | `pr-checks.yml` | pull requests to `main` | Lint, type check, unit tests, and infra format and validate |
| Deploy | `deploy.yml` | push to `main` that touches `infra/**` | Plan and apply OpenTofu for `dev`, then `prod` |

## PR checks

Each area job runs only when its paths change. A `changes` job decides which areas changed, using `dorny/paths-filter`.

| Job | Runs when these paths change | Commands |
| --- | --- | --- |
| Web | `apps/web/**`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` | `pnpm install --frozen-lockfile`, then `pnpm --dir apps/web run lint`, `run typecheck`, `run test` |
| API | `apps/api/**`, `content/**`, `pyproject.toml`, `uv.lock` | `uv sync --locked --directory apps/api`, then `ruff check .`, `ruff format --check .`, `mypy .`, `pytest` (all run with `uv run --directory apps/api`) |
| Infra | `infra/**` | `tofu fmt -check -recursive infra`, then `tofu init -backend=false` and `tofu validate` for each directory in `infra/envs/` |

Any path under `.github/workflows/**` runs all three area jobs.

The `checks` job is the one required status for branch protection. It fails if any job failed or was cancelled, and it accepts skipped jobs. Configure the branch rule for `main` to require **PR checks** only.

### Where the commands are defined

The workflow calls package scripts by name and does not repeat their tool invocations. Two things must match this table:

| Command | Defined in | Status |
| --- | --- | --- |
| `lint`, `typecheck`, `test` scripts in `apps/web/package.json` | Workstream 1 (frontend) | Pending. The `test` script must run once and exit (for example `vitest run`), not in watch mode. |
| `packageManager` field in root `package.json` | Workstream 1 | Pending. `pnpm/action-setup` reads the pnpm version from it. |
| `pnpm-lock.yaml` | Workstream 1 | Pending. `--frozen-lockfile` fails until it is committed. |
| `apps/api/pyproject.toml` with `ruff`, `mypy`, `pytest` in dev dependencies | Workstream 2 (backend) | Pending |
| `apps/api/uv.lock` | Workstream 2 | Pending. `uv sync --locked` fails until it is committed. |
| `infra/envs/dev/` and `infra/envs/prod/` with `.tf` files | Workstream 7 (Azure infrastructure) | Pending. The infra job fails if `infra/envs/` has no directories. |

Until these land, a PR that touches an area whose job depends on a pending item will fail that job. This is expected. The workflow itself is complete.

## Deploy

`deploy.yml` has four jobs in this order: `plan-dev`, `apply-dev`, `plan-prod`, `apply-prod`. `plan-prod` needs `apply-dev`, so a failed dev apply stops prod.

- **Plan jobs** (`plan-dev`, `plan-prod`) have no GitHub environment, so they do not wait for reviewers. They log in with a read-only identity from the repository variable `AZURE_PLAN_CLIENT_ID`, run `tofu init` and `tofu plan -out=tfplan`, write `tofu show -no-color tfplan` to the run's step summary, and upload `tfplan` as a workflow artifact. The plan job never uses the apply identity. The read-only identity may not be able to take the state lock. That is a workstream 7 decision to resolve, not something to widen here.
- **Apply jobs** (`apply-dev`, `apply-prod`) run in the `dev` or `prod` environment, so required reviewers approve them. Reviewers read the plan summary on the run page before they approve. The apply job downloads the artifact and runs `tofu apply tfplan` with the environment's identity. The artifact is kept for seven days.

The plan summary is visible to anyone who can read the run, and a plan can contain sensitive values.

The jobs do nothing unless the repository variable `DEPLOY_ENABLED` is `"true"`. The jobs also require `refs/heads/main`.

### Enable it

Do this after workstream 7 is merged and its outputs exist.

1. **Repository variables** (Settings → Secrets and variables → Actions → Variables):
   - `DEPLOY_ENABLED` = `true`. Leave it unset until the steps below are done.
   - `AZURE_PLAN_CLIENT_ID`: the client ID of the read-only identity used by the plan jobs
   - `AZURE_TENANT_ID`
   - `AZURE_SUBSCRIPTION_ID`
2. **Environments** `dev` and `prod` (Settings → Environments):
   - Deployment branches: `main` only.
   - `prod`: required reviewers. Recommended for `dev` too.
   - Environment variable (not secret), set on each environment with its own apply identity:
     - `AZURE_CLIENT_ID`: the Entra application or managed identity client ID for that environment's apply jobs
3. **Azure federated credentials**:
   - On the read-only plan identity, one credential with the GitHub subject `repo:aichimoaie/english-quest:ref:refs/heads/main`. Grant it read access only.
   - On each apply identity, one credential per environment:
     - `repo:aichimoaie/english-quest:environment:dev` for `apply-dev`
     - `repo:aichimoaie/english-quest:environment:prod` for `apply-prod`
   The apply identities need a role on the target resource group.
4. **Remote state**: `tofu init` in `infra/envs/<env>` needs the state backend. Workstream 7 defines it, and the workflow does not pass backend settings itself. Add them to the workflow only if workstream 7 chooses `-backend-config` flags.

No deploy secrets are stored in the repository. OIDC means no client secret is needed. The azurerm provider reads the `ARM_*` variables set in each job from its identity variables.

### Not yet covered

Application deploys are not in `deploy.yml` yet, because their outputs come from workstream 7:

- Static export of `apps/web` to Azure Static Web Apps (the deployment token or OIDC route depends on the chosen setup)
- API container image build, push, and revision update for Container Apps

Add them as new jobs with the same environment and OIDC pattern when those outputs exist.

## Checking the workflows

- `actionlint` with shellcheck on both files, from the repo root: `uvx --from actionlint-py actionlint -shellcheck <path-to-shellcheck> .github/workflows/*.yml`. Passes on the current files.
- Actions are pinned to a major version, except `astral-sh/setup-uv`, which is pinned to an exact tag (`v10.2.0`) because it has no floating major tag. Permissions are read-only by default. Jobs that need `id-token: write` or `pull-requests: read` declare them.
