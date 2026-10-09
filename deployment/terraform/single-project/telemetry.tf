# Container logs and basic alerts. The budget is in budget.tf.

resource "azurerm_log_analytics_workspace" "this" {
  name                = "log-eq-${var.environment}-${var.name_suffix}"
  location            = var.location
  resource_group_name = azurerm_resource_group.this.name
  sku                 = "PerGB2018"
  retention_in_days   = 30

  # Daily ingestion cap in GB. It protects the budget. Ingestion stops at the cap until the next day.
  daily_quota_gb = 1

  tags = module.shared.tags
}

resource "azurerm_monitor_action_group" "this" {
  name                = "ag-eq-${var.environment}"
  resource_group_name = azurerm_resource_group.this.name
  short_name          = "eq-alerts"
  tags                = module.shared.tags

  dynamic "email_receiver" {
    for_each = toset(var.alert_email_addresses)
    content {
      name          = "owner-${replace(email_receiver.value, "@", "-at-")}"
      email_address = email_receiver.value
    }
  }
}

resource "azurerm_monitor_metric_alert" "postgres_cpu" {
  name                = "alert-eq-${var.environment}-postgres-cpu"
  resource_group_name = azurerm_resource_group.this.name
  scopes              = [azurerm_postgresql_flexible_server.this.id]
  description         = "PostgreSQL CPU is above 80% for 15 minutes."
  severity            = 2
  frequency           = "PT5M"
  window_size         = "PT15M"
  tags                = module.shared.tags

  criteria {
    metric_namespace = "Microsoft.DBforPostgreSQL/flexibleServers"
    metric_name      = "cpu_percent"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 80
  }

  action {
    action_group_id = azurerm_monitor_action_group.this.id
  }
}

resource "azurerm_monitor_metric_alert" "postgres_storage" {
  name                = "alert-eq-${var.environment}-postgres-storage"
  resource_group_name = azurerm_resource_group.this.name
  scopes              = [azurerm_postgresql_flexible_server.this.id]
  description         = "PostgreSQL storage is above 80% of the 32 GiB provisioned."
  severity            = 2
  frequency           = "PT15M"
  window_size         = "PT1H"
  tags                = module.shared.tags

  criteria {
    metric_namespace = "Microsoft.DBforPostgreSQL/flexibleServers"
    metric_name      = "storage_percent"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 80
  }

  action {
    action_group_id = azurerm_monitor_action_group.this.id
  }
}

resource "azurerm_monitor_metric_alert" "api_server_errors" {
  name                = "alert-eq-${var.environment}-api-5xx"
  resource_group_name = azurerm_resource_group.this.name
  scopes              = [azurerm_container_app.api.id]
  description         = "The API returned more than 5 server errors (5xx) in 15 minutes."
  severity            = 2
  frequency           = "PT5M"
  window_size         = "PT15M"
  tags                = module.shared.tags

  criteria {
    metric_namespace = "Microsoft.App/containerApps"
    metric_name      = "Requests"
    aggregation      = "Total"
    operator         = "GreaterThan"
    threshold        = 5

    # Dimension name is unverified until the first plan against Azure (no resource exists yet).
    dimension {
      name     = "StatusCodeCategory"
      operator = "Include"
      values   = ["5xx"]
    }
  }

  action {
    action_group_id = azurerm_monitor_action_group.this.id
  }
}

resource "azurerm_monitor_metric_alert" "api_restarts" {
  name                = "alert-eq-${var.environment}-api-restarts"
  resource_group_name = azurerm_resource_group.this.name
  scopes              = [azurerm_container_app.api.id]
  description         = "The API container restarted more than 3 times in 15 minutes."
  severity            = 2
  frequency           = "PT5M"
  window_size         = "PT15M"
  tags                = module.shared.tags

  criteria {
    metric_namespace = "Microsoft.App/containerApps"
    metric_name      = "RestartCount"
    aggregation      = "Total"
    operator         = "GreaterThan"
    threshold        = 3
  }

  action {
    action_group_id = azurerm_monitor_action_group.this.id
  }
}

# Stands in for an HTTP health check. A real availability test needs Application
# Insights, which the MVP leaves out.
resource "azurerm_monitor_metric_alert" "api_no_replica" {
  name                = "alert-eq-${var.environment}-api-down"
  resource_group_name = azurerm_resource_group.this.name
  scopes              = [azurerm_container_app.api.id]
  description         = "The API has no running replica for 5 minutes."
  severity            = 1
  frequency           = "PT5M"
  window_size         = "PT5M"
  tags                = module.shared.tags

  criteria {
    metric_namespace = "Microsoft.App/containerApps"
    metric_name      = "Replicas"
    aggregation      = "Minimum"
    operator         = "LessThan"
    threshold        = 1
  }

  action {
    action_group_id = azurerm_monitor_action_group.this.id
  }
}
