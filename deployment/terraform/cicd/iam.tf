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
