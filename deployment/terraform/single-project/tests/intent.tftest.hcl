# Plan-level checks for the MVP intent. Providers are mocked, so these run
# offline and never call Azure. Each run plans the single-project root with the
# prod values and asserts the planned attributes.

mock_provider "azurerm" {
  mock_data "azurerm_client_config" {
    defaults = {
      tenant_id = "11111111-1111-1111-1111-111111111111"
      object_id = "22222222-2222-2222-2222-222222222222"
    }
  }
}

mock_provider "azuread" {}
mock_provider "random" {}

variables {
  environment                = "prod"
  subscription_id            = "389d9a64-7cca-46b1-9de0-8214eae2597a"
  tenant_id                  = "704bd4e2-32b5-463a-addd-90b2c21b5d66"
  name_suffix                = "p3d8v"
  key_vault_purge_protection = true
  alert_email_addresses      = ["ops@example.com"]
  enable_budget              = true
  budget_start_date          = "2026-11-01T00:00:00Z"
  budget_contact_emails      = ["ops@example.com"]
}

run "prod_defaults_match_the_approved_plan" {
  command = plan

  assert {
    condition     = var.location == "eastus" && var.static_web_app_location == "eastus2"
    error_message = "API, database and vault stay in East US. The Static Web App uses the documented East US 2 exception."
  }

  assert {
    condition     = var.postgres_version == "18"
    error_message = "PostgreSQL defaults to version 18 (decision D7)."
  }
}

run "postgres_burstable_no_ha" {
  command = plan

  assert {
    condition     = azurerm_postgresql_flexible_server.this.sku_name == "B_Standard_B1ms" && azurerm_postgresql_flexible_server.this.storage_mb == 32768
    error_message = "PostgreSQL must be B1MS with 32 GiB storage (decision: keep the current size)."
  }

  assert {
    condition     = length(azurerm_postgresql_flexible_server.this.high_availability) == 0
    error_message = "PostgreSQL must not enable high availability."
  }

  assert {
    condition     = azurerm_postgresql_flexible_server.this.public_network_access_enabled == true
    error_message = "PostgreSQL uses the public endpoint with the firewall rule. No VNet or private endpoint (owner decision)."
  }
}

run "api_one_replica_external_and_no_registry_secrets" {
  command = plan

  assert {
    condition     = azurerm_container_app.api.template[0].min_replicas == 1
    error_message = "The API must keep a minimum of one replica."
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

run "api_reads_database_url_from_key_vault" {
  command = plan

  assert {
    condition     = [for s in azurerm_container_app.api.secret : s.name == "database-url"][0]
    error_message = "The database URL must come from Key Vault, not from a value in the app."
  }

  assert {
    condition     = azurerm_container_app.api.identity[0].type == "UserAssigned"
    error_message = "The API must run with the user-assigned identity that reads the vault."
  }
}

run "migration_job_is_manual_and_runs_alembic" {
  command = plan

  assert {
    condition     = length(azurerm_container_app_job.migrate.manual_trigger_config) == 1
    error_message = "Migrations run as a job the pipeline starts, not on a schedule."
  }

  assert {
    condition     = contains(azurerm_container_app_job.migrate.template[0].container[0].command, "upgrade") && contains(azurerm_container_app_job.migrate.template[0].container[0].command, "head")
    error_message = "The migration job must run alembic upgrade head."
  }
}

run "logs_and_alerts" {
  command = plan

  assert {
    condition     = azurerm_log_analytics_workspace.this.retention_in_days == 30 && azurerm_log_analytics_workspace.this.daily_quota_gb == 1
    error_message = "Logs keep 30 days with a 1 GB daily cap."
  }

  assert {
    condition     = azurerm_monitor_metric_alert.postgres_cpu.criteria[0].threshold == 80
    error_message = "The PostgreSQL CPU alert must fire above 80%."
  }

  assert {
    condition     = azurerm_monitor_metric_alert.api_no_replica.criteria[0].threshold == 1
    error_message = "The API alert must fire when no replica is running."
  }
}

run "budget_is_resource_group_scoped" {
  command = plan

  assert {
    condition     = length(azurerm_consumption_budget_resource_group.this) == 1
    error_message = "Prod must create the budget."
  }

  assert {
    condition     = anytrue([for n in azurerm_consumption_budget_resource_group.this[0].notification : n.threshold == 80 && n.threshold_type == "Actual"])
    error_message = "The budget must alert at 80% of actual spend."
  }

  assert {
    condition     = anytrue([for n in azurerm_consumption_budget_resource_group.this[0].notification : n.threshold == 100 && n.threshold_type == "Forecasted"])
    error_message = "The budget must alert when spend is forecast to reach 100%."
  }
}

run "dev_has_no_budget" {
  command = plan

  variables {
    environment                = "dev"
    name_suffix                = "k7q2m"
    key_vault_purge_protection = false
    enable_budget              = false
  }

  assert {
    condition     = length(azurerm_consumption_budget_resource_group.this) == 0
    error_message = "The budget is created in prod only."
  }

  assert {
    condition     = azurerm_key_vault.this.purge_protection_enabled == false
    error_message = "Purge protection is on in prod only (decision D8)."
  }
}

run "key_vault_uses_rbac_and_purge_protection_in_prod" {
  command = plan

  assert {
    condition     = azurerm_key_vault.this.rbac_authorization_enabled == true
    error_message = "Key Vault must use role-based access control, not access policies."
  }

  assert {
    condition     = azurerm_key_vault.this.purge_protection_enabled == true
    error_message = "Prod Key Vault must enable purge protection."
  }
}

run "static_web_app_free_tier" {
  command = plan

  assert {
    condition     = azurerm_static_web_app.this.sku_tier == "Free" && azurerm_static_web_app.this.sku_size == "Free"
    error_message = "The Static Web App must use the Free tier."
  }
}
