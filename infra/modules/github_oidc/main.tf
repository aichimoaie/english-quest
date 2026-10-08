resource "azuread_application" "deploy" {
  display_name     = var.display_name
  sign_in_audience = "AzureADMyOrg"
}

resource "azuread_service_principal" "deploy" {
  client_id = azuread_application.deploy.client_id
}

# Trusts GitHub Actions jobs that run in the named GitHub environment. No client
# secret is created: the workflow exchanges its OIDC token for an Azure token.
resource "azuread_application_federated_identity_credential" "github_environment" {
  application_id = azuread_application.deploy.id
  display_name   = "github-${var.github_environment}"
  description    = "Deploys from the ${var.github_environment} GitHub environment"
  audiences      = ["api://AzureADTokenExchange"]
  issuer         = "https://token.actions.githubusercontent.com"
  subject        = "repo:${var.github_owner}/${var.github_repository}:environment:${var.github_environment}"
}

# Contributor covers container app updates and the Static Web Apps upload. It
# cannot grant role assignments, which keeps the CI identity out of IAM.
resource "azurerm_role_assignment" "deploy_contributor" {
  scope                = var.resource_group_id
  role_definition_name = "Contributor"
  principal_id         = azuread_service_principal.deploy.object_id
}
