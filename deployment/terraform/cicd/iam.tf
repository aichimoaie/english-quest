# Contributor on each deploy target only, not on the resource group, and not
# role assignment rights. The IDs come from shared, so this root does not read
# single-project's state. The plan-only identities from the earlier plan are not
# created (decision D12: remove the unlocked plan path).
resource "azurerm_role_assignment" "deploy_container_app" {
  scope                = module.shared.container_app_id
  role_definition_name = "Contributor"
  principal_id         = azuread_service_principal.deploy.object_id
}

resource "azurerm_role_assignment" "deploy_static_web_app" {
  scope                = module.shared.static_web_app_id
  role_definition_name = "Contributor"
  principal_id         = azuread_service_principal.deploy.object_id
}

resource "azurerm_role_assignment" "deploy_postgres_server" {
  scope                = module.shared.postgres_id
  role_definition_name = "Contributor"
  principal_id         = azuread_service_principal.deploy.object_id
}

# Start the migration job and read its executions, nothing else. Built-in roles
# are broader than this, so the role is custom and assignable to that job only.
resource "azurerm_role_definition" "start_migration_job" {
  name        = "eq-${var.environment}-start-migration-job"
  scope       = module.shared.migration_job_id
  description = "Start the English Quest migration job and read its executions."

  permissions {
    actions = [
      "Microsoft.App/jobs/start/action",
      "Microsoft.App/jobs/read",
      "Microsoft.App/jobs/execution/read",
    ]
  }

  assignable_scopes = [module.shared.migration_job_id]
}

resource "azurerm_role_assignment" "deploy_start_migration_job" {
  scope              = module.shared.migration_job_id
  role_definition_id = azurerm_role_definition.start_migration_job.role_definition_resource_id
  principal_id       = azuread_service_principal.deploy.object_id
}
