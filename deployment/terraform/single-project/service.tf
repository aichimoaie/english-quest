# The API runs on Container Apps (Consumption). Logs go to the Log Analytics
# workspace in telemetry.tf.
resource "azurerm_container_app_environment" "this" {
  name                       = "cae-eq-${var.environment}"
  location                   = var.location
  resource_group_name        = azurerm_resource_group.this.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.this.id
  tags                       = module.shared.tags
}

resource "azurerm_container_app" "api" {
  name                         = module.shared.container_app_name
  container_app_environment_id = azurerm_container_app_environment.this.id
  resource_group_name          = azurerm_resource_group.this.name
  revision_mode                = "Single"
  tags                         = module.shared.tags

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.app.id]
  }

  secret {
    name                = "database-url"
    key_vault_secret_id = azurerm_key_vault_secret.database_url.versionless_id
    identity            = azurerm_user_assigned_identity.app.id
  }

  ingress {
    external_enabled = true
    target_port      = 8000
    transport        = "auto"

    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  template {
    # Keep one replica warm. Managed certificates need the app running.
    min_replicas = 1
    max_replicas = 2

    container {
      name   = "api"
      image  = var.api_image
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name        = "DATABASE_URL"
        secret_name = "database-url"
      }

      env {
        name  = "WEB_ORIGIN"
        value = "https://${azurerm_static_web_app.this.default_host_name}"
      }

      env {
        name  = "APP_ENV"
        value = var.environment
      }
    }
  }

  # The deploy pipeline sets new API images with `az containerapp update`.
  # Terraform keeps the image it last saw and does not revert a release.
  lifecycle {
    ignore_changes = [template[0].container[0].image]
  }

  depends_on = [azurerm_role_assignment.app_secrets_user]
}

# Runs `alembic upgrade head` as a separate job. The deploy pipeline starts it
# and waits for it to finish before it updates the API image. The job serves no
# traffic and is never started by Terraform.
resource "azurerm_container_app_job" "migrate" {
  name                         = "job-eq-${var.environment}-migrate"
  location                     = var.location
  resource_group_name          = azurerm_resource_group.this.name
  container_app_environment_id = azurerm_container_app_environment.this.id
  replica_timeout_in_seconds   = 600
  replica_retry_limit          = 0
  tags                         = module.shared.tags

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.app.id]
  }

  secret {
    name                = "database-url"
    key_vault_secret_id = azurerm_key_vault_secret.database_url.versionless_id
    identity            = azurerm_user_assigned_identity.app.id
  }

  manual_trigger_config {
    parallelism              = 1
    replica_completion_count = 1
  }

  template {
    container {
      name    = "migrate"
      image   = var.api_image
      cpu     = 0.25
      memory  = "0.5Gi"
      command = ["alembic", "upgrade", "head"]

      env {
        name        = "MIGRATION_DATABASE_URL"
        secret_name = "database-url"
      }
    }
  }

  lifecycle {
    ignore_changes = [template[0].container[0].image]
  }

  depends_on = [azurerm_role_assignment.app_secrets_user]
}
