# Plan-level checks for the MVP infrastructure intent. The providers are mocked,
# so these run offline and never call Azure. Each run plans one module with the
# inputs the prod environment passes, and asserts the planned values.

mock_provider "azurerm" {
  mock_data "azurerm_client_config" {
    defaults = {
      tenant_id = "11111111-1111-1111-1111-111111111111"
      object_id = "22222222-2222-2222-2222-222222222222"
    }
  }
}

mock_provider "azuread" {}

variables {
  subscription_id       = "00000000-0000-0000-0000-000000000000"
  tenant_id             = "00000000-0000-0000-0000-000000000000"
  budget_start_date     = "2026-11-01T00:00:00Z"
  budget_contact_emails = ["ops@example.com"]
}

run "prod_root_defaults" {
  command = plan

  assert {
    condition     = var.location == "eastus"
    error_message = "Resource group, PostgreSQL, Container Apps and Key Vault must default to East US."
  }

  assert {
    condition     = var.static_web_app_location == "eastus2"
    error_message = "The Static Web App uses the documented East US 2 exception."
  }

  assert {
    condition     = var.budget_amount == 40
    error_message = "The subscription budget must default to 40 USD a month."
  }
}

run "postgres_burstable_no_ha" {
  command = plan

  module {
    source = "../../modules/postgres"
  }

  variables {
    name                = "psql-eq-prod-abcde"
    resource_group_name = "rg-english-quest-prod"
    location            = "eastus"
    postgres_version    = "18"
  }

  assert {
    condition     = azurerm_postgresql_flexible_server.this.sku_name == "B_Standard_B1ms"
    error_message = "PostgreSQL must use the Burstable B1MS SKU."
  }

  assert {
    condition     = azurerm_postgresql_flexible_server.this.storage_mb == 32768
    error_message = "PostgreSQL storage must be 32 GiB."
  }

  assert {
    condition     = length(azurerm_postgresql_flexible_server.this.high_availability) == 0
    error_message = "PostgreSQL must not enable high availability."
  }
}

run "api_container_app_min_one_replica" {
  command = plan

  module {
    source = "../../modules/container_apps"
  }

  variables {
    name_prefix         = "eq-prod"
    environment         = "prod"
    resource_group_name = "rg-english-quest-prod"
    location            = "eastus"
    web_origin          = "https://example.azurestaticapps.net"
    database_url        = "postgresql+psycopg://user:pass@host:5432/db?sslmode=require"
  }

  assert {
    condition     = azurerm_container_app.api.template[0].min_replicas == 1
    error_message = "The API container app must keep a minimum of one replica."
  }

  assert {
    condition     = azurerm_container_app.api.ingress[0].external_enabled == true
    error_message = "The API must have external ingress."
  }

  assert {
    condition     = length(azurerm_container_app.api.registry) == 0
    error_message = "Images come from a public GHCR package, so no registry credentials are configured."
  }
}

run "static_web_app_free_tier" {
  command = plan

  module {
    source = "../../modules/static_web_app"
  }

  variables {
    name                = "swa-eq-prod-abcde"
    resource_group_name = "rg-english-quest-prod"
    location            = "eastus2"
  }

  assert {
    condition     = azurerm_static_web_app.this.sku_tier == "Free" && azurerm_static_web_app.this.sku_size == "Free"
    error_message = "The Static Web App must use the Free tier."
  }
}

run "key_vault_uses_rbac" {
  command = plan

  module {
    source = "../../modules/key_vault"
  }

  variables {
    name                = "kv-eq-prod-abcde"
    resource_group_name = "rg-english-quest-prod"
    location            = "eastus"
    purge_protection_enabled = true
  }

  assert {
    condition     = azurerm_key_vault.this.rbac_authorization_enabled == true
    error_message = "Key Vault must use role-based access control, not access policies."
  }

  assert {
    condition     = azurerm_key_vault.this.purge_protection_enabled == true
    error_message = "Prod Key Vault must enable purge protection."
  }
}

run "deploy_identity_scoped_to_targets" {
  command = plan

  module {
    source = "../../modules/github_oidc"
  }

  variables {
    display_name       = "eq-github-deploy-prod"
    github_owner       = "aichimoaie"
    github_repository  = "english-quest"
    github_environment = "prod"
    container_app_id   = "/subscriptions/0/resourceGroups/rg/providers/Microsoft.App/containerApps/ca"
    static_web_app_id  = "/subscriptions/0/resourceGroups/rg/providers/Microsoft.Web/staticSites/swa"
    postgres_server_id = "/subscriptions/0/resourceGroups/rg/providers/Microsoft.DBforPostgreSQL/flexibleServers/psql"
  }

  assert {
    condition     = azurerm_role_assignment.deploy_container_app.scope == "/subscriptions/0/resourceGroups/rg/providers/Microsoft.App/containerApps/ca"
    error_message = "Contributor must be scoped to the API container app, not the resource group."
  }

  assert {
    condition     = azurerm_role_assignment.deploy_postgres_server.role_definition_name == "Contributor"
    error_message = "The deploy identity needs Contributor on the PostgreSQL server only."
  }

  assert {
    condition     = azuread_application_federated_identity_credential.github_environment.subject == "repo:aichimoaie/english-quest:environment:prod"
    error_message = "The federated credential must trust the prod GitHub environment."
  }
}

run "budget_alerts_at_80_actual_and_100_forecast" {
  command = plan

  module {
    source = "../../modules/budget"
  }

  variables {
    name            = "budget-english-quest-monthly"
    subscription_id = "/subscriptions/00000000-0000-0000-0000-000000000000"
    amount          = 40
    start_date      = "2026-11-01T00:00:00Z"
    contact_emails  = ["ops@example.com"]
  }

  assert {
    condition     = azurerm_consumption_budget_subscription.this.time_grain == "Monthly" && azurerm_consumption_budget_subscription.this.amount == 40
    error_message = "The budget must be a monthly 40 USD subscription budget."
  }

  assert {
    condition     = anytrue([for n in azurerm_consumption_budget_subscription.this.notification : n.threshold == 80 && n.threshold_type == "Actual"])
    error_message = "The budget must alert at 80% of actual spend."
  }

  assert {
    condition     = anytrue([for n in azurerm_consumption_budget_subscription.this.notification : n.threshold == 100 && n.threshold_type == "Forecasted"])
    error_message = "The budget must alert when spend is forecast to reach 100%."
  }
}
