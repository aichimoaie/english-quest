output "container_app_name" {
  description = "Name of the API container app, used by the CI deploy step."
  value       = azurerm_container_app.api.name
}

output "api_fqdn" {
  description = "Public hostname of the API. Build the API base URL from it."
  value       = azurerm_container_app.api.ingress[0].fqdn
}

output "environment_id" {
  description = "Container Apps environment ID."
  value       = azurerm_container_app_environment.this.id
}
