# One user-assigned identity for the API and the migration job. It can read
# secrets from the vault and nothing else in the subscription.
resource "azurerm_user_assigned_identity" "app" {
  name                = "id-eq-${var.environment}"
  location            = var.location
  resource_group_name = azurerm_resource_group.this.name
  tags                = module.shared.tags
}

resource "azurerm_role_assignment" "app_secrets_user" {
  scope                = azurerm_key_vault.this.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_user_assigned_identity.app.principal_id
}
