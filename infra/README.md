# English Quest infrastructure (OpenTofu)

This folder defines the Azure resources for the MVP in East US. There is one root per environment, `envs/dev` and `envs/prod`. Both use the same modules under `modules/` and keep separate remote state keys.

## What gets created

Per environment (`dev` or `prod`):

| Resource | Module | Notes |
| --- | --- | --- |
| Resource group `rg-english-quest-<env>` | `envs/<env>/main.tf` | Holds everything below. |
| Static Web App (Free) `swa-eq-<env>-<suffix>` | `modules/static_web_app` | Hosts the Next.js static export. Region East US 2, see caveats. |
| Container Apps environment `cae-eq-<env>` | `modules/container_apps` | Consumption plan. |
| API container app `ca-eq-<env>-api` | `modules/container_apps` | 0.25 vCPU, 0.5 GiB, min replicas 1, max 2, HTTP ingress on port 8000. |
| PostgreSQL Flexible Server `psql-eq-<env>-<suffix>` | `modules/postgres` | Burstable `B_Standard_B1ms`, 32 GiB, no HA, 7-day backups. Database `english_quest`. |
| Key Vault `kv-eq-<env>-<suffix>` | `modules/key_vault` | Holds `database-url`. |
| Entra app and service principal `eq-github-deploy-<env>` | `modules/github_oidc` | Federated credential for GitHub environment `<env>`, Contributor on the resource group. No client secret. |
| Subscription budget, 40 USD per month | `modules/budget` | Created in `envs/prod` only, because it covers the whole subscription. See the apply order below. |

Container images are on GitHub Container Registry (`ghcr.io`). No Azure Container Registry is created. The GHCR package for the API must be public, because the API app pulls it without credentials.

## One manual bootstrap step: the state storage account

OpenTofu state lives in an Azure Storage account that this code cannot create for itself. Create it once, before the first `tofu init`:

```bash
az login
az account set --subscription <subscription-id>

az group create --name rg-english-quest-tfstate --location eastus

# The name must be globally unique, 3 to 24 lowercase letters and digits.
az storage account create \
  --name <state-account-name> \
  --resource-group rg-english-quest-tfstate \
  --location eastus \
  --sku Standard_LRS \
  --min-tls-version TLS1_2 \
  --allow-blob-public-access false

az storage container create \
  --name tfstate \
  --account-name <state-account-name> \
  --auth-mode login
```

The operator needs the **Storage Blob Data Contributor** role on that account, because `use_azuread_auth` is on.

Then, for each environment, copy the example backend file and fill in the account name:

```bash
cd infra/envs/dev
cp backend.hcl.example backend.hcl        # set storage_account_name
tofu init -backend-config=backend.hcl
```

`backend.hcl` and `terraform.tfvars` are git-ignored. Do not commit them.

## Running an environment

```bash
cd infra/envs/dev                          # or envs/prod
cp terraform.tfvars.example terraform.tfvars   # fill in subscription and tenant IDs
tofu init -backend-config=backend.hcl
tofu plan -out=tfplan
tofu apply tfplan
```

Run `tofu apply` as an identity with rights to create resources, role assignments and Entra applications. Owner on the subscription is the simplest choice. The deploy identity that CI uses is granted Contributor on the resource group only. It is meant for app deploys, not for applying this code, and it cannot create role assignments.

`tofu output` prints the values the CI workflow needs. The sensitive ones need `-raw`:

| Output | GitHub location | Used by |
| --- | --- | --- |
| `azure_client_id`, `azure_tenant_id`, `azure_subscription_id` | environment variables or secrets | `azure/login` with OIDC |
| `resource_group_name`, `api_container_app_name`, `web_static_web_app_name` | environment variables | `az containerapp update`, SWA upload |
| `web_deployment_token` (sensitive) | environment secret | Static Web Apps deploy |
| `api_url`, `web_url` | environment variables | the web build (`NEXT_PUBLIC_API_URL`) and smoke tests |

The GitHub environments must be named `dev` and `prod`, because the federated credentials trust `repo:aichimoaie/english-quest:environment:<env>`.

## Validation

Acceptance for this scaffold, without Azure credentials:

```bash
tofu fmt -check -recursive infra
cd infra/envs/dev  && tofu init -backend=false && tofu validate
cd infra/envs/prod && tofu init -backend=false && tofu validate
```

No plan has been run. Plans need a subscription and a tenant.

## Decisions and caveats

- **Static Web Apps region.** Documented exception: Static Web Apps is not offered in East US. Checked with the Azure CLI, it is offered in Central US, East US 2, West US 2, West Europe and East Asia. The Static Web App uses East US 2. The API and database stay in East US.
- **PostgreSQL version.** The default is `18`. The PRD asks for the newest major version Azure offers in the region. Check the subscription before the first apply and change `postgres_version` if a newer one is offered.
- **Database network access.** The server has public access with the `AllowAzureServices` firewall rule, because Consumption Container Apps have no fixed outbound IP. TLS is required and the password is generated. A private VNet setup is a later hardening step.
- **Key Vault uses access policies, not RBAC.** Access policies let the identity that runs OpenTofu write secrets without User Access Administrator.
- **Secrets in state.** The generated database password and the database URL are in the OpenTofu state, which is why the state account is private with TLS 1.2 minimum. Restrict who can read the `tfstate` container.
- **Container image.** The API app starts with a placeholder image and ignores later image changes, so the CI deploy owns the image tag. Ingress targets port 8000, so the API must listen there.
- **GHCR package visibility.** The API image package on GHCR must be public. The Container App has no registry credentials, so a private package will fail to pull.
- **Connection string driver.** `DATABASE_URL` is `postgresql+psycopg://…?sslmode=require`. The API must use psycopg 3 for this URL.
- **Budget.** The budget starts on `budget_start_date`, which must be the first day of a month. Set `budget_contact_emails` in `envs/prod/terraform.tfvars`. The budget lives only in `envs/prod`, so apply prod once for the subscription budget to exist. Applying dev alone creates no budget alert.
- **Logging.** No Log Analytics workspace is created, because the MVP keeps to the listed resources. Without one, container logs are not kept. Inspect them with `az containerapp logs show` or log streaming. Add a workspace later if that is not enough.
- **Entra permissions.** Creating the app registration and federated credential needs the Application Developer role, or equivalent, in the tenant.

## Not done here

- Custom domains. The hostnames are open in the PRD (open question 14), so no certificate or DNS binding is created yet.
- A CI workflow that runs `tofu`. Workstream 8 owns `.github/workflows/`.
- A plan or apply against a real subscription.
