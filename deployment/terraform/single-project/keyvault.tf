data "azurerm_client_config" "current" {}

# The runtime sources of the database URLs. The API and the migration job read
# them through the app identity in iam.tf, so the URLs are not copied into app settings.
resource "azurerm_key_vault" "this" {
  name                = module.shared.key_vault_name
  location            = var.location
  resource_group_name = azurerm_resource_group.this.name
  tenant_id           = data.azurerm_client_config.current.tenant_id
  sku_name            = "standard"

  rbac_authorization_enabled = true
  soft_delete_retention_days = 7
  purge_protection_enabled   = var.key_vault_purge_protection

  tags = module.shared.tags
}

resource "azurerm_role_assignment" "operator_secrets_officer" {
  scope                = azurerm_key_vault.this.id
  role_definition_name = "Key Vault Secrets Officer"
  principal_id         = data.azurerm_client_config.current.object_id
}

resource "azurerm_key_vault_secret" "database_url" {
  name         = "database-url"
  value        = local.database_url
  key_vault_id = azurerm_key_vault.this.id

  depends_on = [azurerm_role_assignment.operator_secrets_officer]
}

resource "azurerm_key_vault_secret" "api_database_url" {
  name         = "api-database-url"
  value        = local.api_database_url
  key_vault_id = azurerm_key_vault.this.id

  depends_on = [azurerm_role_assignment.operator_secrets_officer]
}
