resource "azurerm_container_app_environment" "this" {
  name                = "cae-${var.name_prefix}"
  location            = var.location
  resource_group_name = var.resource_group_name
  tags                = var.tags
}

resource "azurerm_container_app" "api" {
  name                         = "ca-${var.name_prefix}-api"
  container_app_environment_id = azurerm_container_app_environment.this.id
  resource_group_name          = var.resource_group_name
  revision_mode                = "Single"
  tags                         = var.tags

  secret {
    name  = "database-url"
    value = var.database_url
  }

  ingress {
    external_enabled = true
    target_port      = var.api_target_port
    transport        = "auto"

    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  template {
    min_replicas = var.min_replicas
    max_replicas = var.max_replicas

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
        value = var.web_origin
      }

      env {
        name  = "APP_ENV"
        value = var.environment
      }
    }
  }

  # CI deploys new API images with `az containerapp update`. OpenTofu keeps the
  # placeholder image it created and does not revert the deployed image on apply.
  lifecycle {
    ignore_changes = [template[0].container[0].image]
  }
}
