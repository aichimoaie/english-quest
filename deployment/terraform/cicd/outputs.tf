# Values for the GitHub environment named after this root's environment.

output "github_environment" {
  description = "GitHub environment whose OIDC federated credential is trusted."
  value       = var.environment
}

output "azure_client_id" {
  description = "Client ID for azure/login."
  value       = azuread_application.deploy.client_id
}

output "azure_tenant_id" {
  description = "Tenant ID for azure/login."
  value       = var.tenant_id
}

output "azure_subscription_id" {
  description = "Subscription ID for azure/login."
  value       = var.subscription_id
}
