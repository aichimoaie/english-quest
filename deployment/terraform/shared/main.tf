# Names, tags and IDs that more than one root uses. single-project and cicd call
# this module with the same inputs, so they always agree on resource names.
# The IDs are built from names, so cicd can scope role assignments without
# reading the other root's state.

locals {
  tags = {
    project     = "english-quest"
    environment = var.environment
    managed_by  = "terraform"
  }

  resource_group_name  = "rg-english-quest-${var.environment}"
  container_app_name   = "ca-eq-${var.environment}-api"
  migration_job_name   = "job-eq-${var.environment}-migrate"
  static_web_app_name  = "swa-eq-${var.environment}-${var.name_suffix}"
  postgres_server_name = "psql-eq-${var.environment}-${var.name_suffix}"
  key_vault_name       = "kv-eq-${var.environment}-${var.name_suffix}"

  resource_group_id = "/subscriptions/${var.subscription_id}/resourceGroups/${local.resource_group_name}"
  container_app_id  = "${local.resource_group_id}/providers/Microsoft.App/containerApps/${local.container_app_name}"
  migration_job_id  = "${local.resource_group_id}/providers/Microsoft.App/jobs/${local.migration_job_name}"
  static_web_app_id = "${local.resource_group_id}/providers/Microsoft.Web/staticSites/${local.static_web_app_name}"
  postgres_id       = "${local.resource_group_id}/providers/Microsoft.DBforPostgreSQL/flexibleServers/${local.postgres_server_name}"
}
