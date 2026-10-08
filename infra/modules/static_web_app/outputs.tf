output "name" {
  description = "Static Web App name, used by the CI deploy step."
  value       = azurerm_static_web_app.this.name
}

output "default_host_name" {
  description = "Default hostname of the Static Web App, for example example.azurestaticapps.net."
  value       = azurerm_static_web_app.this.default_host_name
}

output "api_key" {
  description = "Deployment token that the CI workflow uses to upload the static export. Store it as a GitHub environment secret."
  value       = azurerm_static_web_app.this.api_key
  sensitive   = true
}
