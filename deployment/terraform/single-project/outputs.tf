# Values the deploy pipeline reads. Non-sensitive ones go in GitHub environment
# variables; the deployment token is a GitHub environment secret.

output "resource_group_name" {
  description = "Resource group for this environment."
  value       = azurerm_resource_group.this.name
}

output "api_container_app_name" {
  description = "API container app name, used by az containerapp update."
  value       = azurerm_container_app.api.name
}

output "api_migration_job_name" {
  description = "Migration job, started by the pipeline before the API image is updated."
  value       = azurerm_container_app_job.migrate.name
}

output "api_url" {
  description = "Public base URL of the API."
  value       = "https://${azurerm_container_app.api.ingress[0].fqdn}"
}

output "web_static_web_app_name" {
  description = "Static Web App name, used to upload the static export."
  value       = azurerm_static_web_app.this.name
}

output "web_url" {
  description = "Public URL of the static web app."
  value       = "https://${azurerm_static_web_app.this.default_host_name}"
}

output "web_deployment_token" {
  description = "Static Web Apps deployment token. Store it as a GitHub environment secret."
  value       = azurerm_static_web_app.this.api_key
  sensitive   = true
}

output "key_vault_name" {
  description = "Key Vault that holds the database URL."
  value       = azurerm_key_vault.this.name
}

output "postgres_fqdn" {
  description = "PostgreSQL server hostname."
  value       = azurerm_postgresql_flexible_server.this.fqdn
}
