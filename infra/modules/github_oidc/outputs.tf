output "client_id" {
  description = "Application (client) ID for azure/login. Not a secret, but store it as a GitHub environment secret for convenience."
  value       = azuread_application.deploy.client_id
}
