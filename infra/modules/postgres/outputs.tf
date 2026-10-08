output "id" {
  description = "Flexible server ID, used to scope the deploy identity."
  value       = azurerm_postgresql_flexible_server.this.id
}

output "name" {
  description = "Flexible server name."
  value       = azurerm_postgresql_flexible_server.this.name
}

output "fqdn" {
  description = "Server hostname that the API connects to."
  value       = azurerm_postgresql_flexible_server.this.fqdn
}

output "administrator_login" {
  description = "Administrator login name."
  value       = azurerm_postgresql_flexible_server.this.administrator_login
}

output "administrator_password" {
  description = "Generated administrator password. It is used only to build database_url and is held in OpenTofu state."
  value       = random_password.administrator.result
  sensitive   = true
}

output "database_name" {
  description = "Application database name."
  value       = azurerm_postgresql_flexible_server_database.this.name
}
