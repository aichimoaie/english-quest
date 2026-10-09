# Two user-assigned identities, one per workload. Each reads only the secret it
# needs. The API never gets the administrator URL, so code running in the API
# cannot request a token that reads it.
resource "azurerm_user_assigned_identity" "api" {
  name                = "id-eq-${var.environment}-api"
  location            = var.location
  resource_group_name = azurerm_resource_group.this.name
  tags                = module.shared.tags
}

resource "azurerm_user_assigned_identity" "migrate" {
  name                = "id-eq-${var.environment}-migrate"
  location            = var.location
  resource_group_name = azurerm_resource_group.this.name
  tags                = module.shared.tags
}

resource "azurerm_role_assignment" "api_secrets_user" {
  scope                = azurerm_key_vault_secret.api_database_url.resource_id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_user_assigned_identity.api.principal_id
}

resource "azurerm_role_assignment" "migrate_secrets_user" {
  scope                = azurerm_key_vault_secret.database_url.resource_id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_user_assigned_identity.migrate.principal_id
}
