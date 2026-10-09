# English Quest infrastructure (Terraform)

Azure resources for the MVP, in East US (the Static Web App uses East US 2, see below). Everything is reproducible from this folder. Nothing here has been applied to Azure yet.

## Layout

```
deployment/terraform/
  shared/           Names, tags and IDs that both roots use. Config only, no resources.
  single-project/   The application: resource group, API, migration job, PostgreSQL,
                    Key Vault, Static Web App, logs and alerts, budget.
    vars/dev.tfvars, vars/prod.tfvars
  cicd/             The deploy identity that GitHub Actions signs in as.
    vars/dev.tfvars, vars/prod.tfvars
```

Each environment has its own state key: `english-quest-<env>.tfstate` for `single-project` and `english-quest-cicd-<env>.tfstate` for `cicd`. The script sets the keys.

`cicd` does not read `single-project`'s state. It builds the resource IDs it needs from `shared`, so both roots can be planned before anything exists.

## Spin up and down

Everything runs through `scripts/infra.sh`:

```bash
scripts/infra.sh check            # format, validate, lint. No Azure access.
scripts/infra.sh plan dev         # init both roots and print the plan. Changes nothing.
scripts/infra.sh up dev           # print both plans, then apply after you type: dev
scripts/infra.sh down prod        # print the destroy plans, then destroy after you type: prod
```

`up` and `down` refuse to run unless:

- the Azure CLI is logged in (`az login`), and
- the selected subscription is `389d9a64-7cca-46b1-9de0-8214eae2597a` (`az account set --subscription 389d9a64-7cca-46b1-9de0-8214eae2597a`), and
- `deployment/terraform/backend.hcl` exists (see the bootstrap below), and
- the `vars/<env>.tfvars` files have no `REPLACE-` placeholders left.

`up` applies `single-project` first, then `cicd`. `down` destroys in reverse. If a plan has no changes, the script says so and does not ask for the confirmation. Running `up` twice is safe.

The script never stores secrets. Plan files go to a temporary directory and are deleted on exit.

## One-time bootstrap: the state storage account

This is the only step not in code, because Terraform cannot store its own state before the storage account exists. Create it once, as an operator with rights on the subscription:

```bash
az login
az account set --subscription 389d9a64-7cca-46b1-9de0-8214eae2597a

az group create --name rg-english-quest-tfstate --location eastus

# Name: globally unique, 3 to 24 lowercase letters and digits.
az storage account create --name <state-account-name> \
  --resource-group rg-english-quest-tfstate --location eastus \
  --sku Standard_LRS --min-tls-version TLS1_2 --allow-blob-public-access false

# Keep blob versioning and soft delete on: the state holds the database password.
az storage account blob-service-properties update \
  --account-name <state-account-name> --resource-group rg-english-quest-tfstate \
  --enable-versioning true --enable-delete-retention true --delete-retention-days 7

az storage container create --name tfstate \
  --account-name <state-account-name> --auth-mode login
```

Then copy `backend.hcl.example` to `backend.hcl` (git-ignored) and set the account name. The operator needs **Storage Blob Data Contributor** on that account, because `use_azuread_auth` is on.

Before the first `up`, fill in the `REPLACE-` values in `single-project/vars/<env>.tfvars` and `cicd/vars/<env>.tfvars`: the alert and budget email addresses, and the budget start date.

Also set `operator_ip_address` in `single-project/vars/<env>.tfvars` to your public IPv4 address. Terraform connects to PostgreSQL from your machine to create the API login role and its password, and the server accepts only Azure services and that address. Update the value when your address changes. `scripts/infra.sh` refuses to run if either tfvars file sets a `subscription_id` other than the approved one.

## What the MVP creates

| Resource | Where | Notes |
| --- | --- | --- |
| Resource group `rg-english-quest-<env>` | single-project | Holds everything below. |
| Static Web App (Free) | `storage.tf` | East US 2, the documented exception. |
| Container Apps environment and API app | `service.tf` | 0.25 vCPU, 0.5 GiB, min 1 and max 2 replicas. |
| Migration job `job-eq-<env>-migrate` | `service.tf` | Runs `alembic upgrade head`. The pipeline starts it and waits for it before updating the API image. Terraform never starts it. |
| PostgreSQL Flexible Server, `B_Standard_B1ms`, 32 GiB | `postgres.tf` | No HA, 7-day backups. Public endpoint with TLS required, the `allow-azure-services` firewall rule and the optional operator rule. No VNet, subnet or private endpoint (owner decision). |
| PostgreSQL login roles `english_quest_server` (NOLOGIN) and `english_quest_api` (LOGIN) | `postgres.tf` | Created by Terraform, which sets the API login's generated password. The API role is a member of the server role, which alone reads the answer keys. The migration keeps its `IF NOT EXISTS` guard. |
| Key Vault (RBAC), `database-url` and `api-database-url` secrets | `keyvault.tf` | `database-url` is the administrator login, for the migration job only. `api-database-url` is the restricted API login. Purge protection on in prod only (D8). |
| User-assigned identity | `iam.tf` | Read-only access to the vault (Key Vault Secrets User). The API reads `api-database-url` as `DATABASE_URL`. The migration job reads `database-url` as `MIGRATION_DATABASE_URL`. |
| Log Analytics workspace, 30 days, 1 GB daily cap | `telemetry.tf` | Container logs (D3). |
| Five metric alerts and an action group (email) | `telemetry.tf` | PostgreSQL CPU and storage, API 5xx, API restarts, API has no running replica. |
| Monthly budget, 40 USD, resource-group scope | `budget.tf` | Prod only (D2). 80% of actual and 100% forecast. |
| Entra app `eq-github-deploy-<env>` and federated credential | `cicd/github.tf` | No client secret. Trusts only the matching GitHub environment. |
| Contributor for the deploy identity | `cicd/iam.tf` | On the API app, the Static Web App and the PostgreSQL server only. Not on the resource group. |

Container images stay on GHCR. The GHCR package for the API must be public, because the app pulls it without credentials.

### Domain (decision D6): placeholder

No domain is decided. `single-project/variables.tf` has `custom_domain` with the value `PLACEHOLDER-owner-decision-D6`. Nothing reads it, and no DNS zone, record or custom domain exists. When the owner decides, add the resources in a new file and remove the placeholder.

## Things to check before the first `up`

- **PostgreSQL 18 in East US (D7).** Not verified, because the earlier `list-skus` query returned nothing. Check with `az postgres flexible-server list-skus --location eastus` before applying.
- **Container Apps environment fee.** The earlier price check found a $0.10/hour "Environment Management" meter in the public API. It is believed to apply only to dedicated environments, not Consumption. Confirm in the pricing calculator.
- **Alert metric dimension.** The 5xx alert filters the `Requests` metric on `StatusCodeCategory`. This name is not verified, because no Container App exists yet to list the metric definitions. Confirm it on the first plan after the first apply.
- **Role propagation.** The app identity's vault role can take a minute to take effect. If the first apply fails on the Key Vault reference, run `up` again. It is idempotent.
- **Budget and resource group.** Only prod has a budget (D2). Dev has none.
- **Production down then up (D8, accepted).** Prod has purge protection on. After `down prod`, the Key Vault name stays reserved for the 7-day soft-delete retention, and the Log Analytics workspace name stays reserved for its retention period after deletion. `up prod` fails on those names until they are released. Wait for the retention period, then run `up prod` again. The names are not changed.

## Not in this root

- The deploy workflow (`.github/workflows/`) and `docs/ci.md` still refer to the old `infra/` folder and to OpenTofu. They need a separate change, because the brief keeps this work inside `deployment/terraform` and `scripts`.
- Playwright tests (dev after each deploy, and read-only prod smoke tests) and their pipeline wiring are not in this root.

## Tools

Local checks need Terraform 1.8 or newer (1.9.8 was used to write this), tflint (`scripts/infra.sh check` fails without it), and the Azure CLI for `up`, `down` and `plan`. `scripts/infra.sh check` needs no Azure access. Plans and applies use `azurerm` 4.81.x, `random` 3.9.x and `postgresql` 1.25.x, pinned in the lock file for linux_amd64 and darwin_arm64.

The pull-request infra job runs `scripts/infra.sh check` on this folder. It installs Terraform and tflint for that job.
