output "id" {
  description = "Key Vault ID. The environment uses it to write secrets after the access policy exists."
  value       = azurerm_key_vault.this.id
}

output "name" {
  description = "Key Vault name, used by operators to read secrets."
  value       = azurerm_key_vault.this.name
}

output "vault_uri" {
  description = "Key Vault URI."
  value       = azurerm_key_vault.this.vault_uri
}
