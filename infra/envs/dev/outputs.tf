# Outputs the CI workflow reads. Store the non-sensitive ones as GitHub
# environment variables and the sensitive ones as GitHub environment secrets.

output "resource_group_name" {
  description = "Resource group for this environment."
  value       = azurerm_resource_group.this.name
}

output "github_environment" {
  description = "GitHub environment whose OIDC federated credential is trusted."
  value       = var.environment
}

output "azure_client_id" {
  description = "Client ID for azure/login."
  value       = module.github_oidc.client_id
}

output "azure_tenant_id" {
  description = "Tenant ID for azure/login."
  value       = var.tenant_id
}

output "azure_subscription_id" {
  description = "Subscription ID for azure/login."
  value       = var.subscription_id
}

output "api_container_app_name" {
  description = "API container app name, used by az containerapp update."
  value       = module.container_apps.container_app_name
}

output "api_url" {
  description = "Public base URL of the API."
  value       = "https://${module.container_apps.api_fqdn}"
}

output "web_static_web_app_name" {
  description = "Static Web App name, used to upload the static export."
  value       = module.static_web_app.name
}

output "web_url" {
  description = "Public URL of the static web app."
  value       = "https://${module.static_web_app.default_host_name}"
}

output "web_deployment_token" {
  description = "Static Web Apps deployment token. Store as a GitHub environment secret."
  value       = module.static_web_app.api_key
  sensitive   = true
}

output "key_vault_name" {
  description = "Key Vault that holds the database password and URL."
  value       = module.key_vault.name
}

output "postgres_fqdn" {
  description = "PostgreSQL server hostname."
  value       = module.postgres.fqdn
}
