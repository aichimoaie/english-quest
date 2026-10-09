# The identity the deploy pipeline signs in as. No client secret: the workflow
# exchanges its GitHub OIDC token for an Azure token. Only the job running in
# the matching GitHub environment can use it.
resource "azuread_application" "deploy" {
  display_name     = "eq-github-deploy-${var.environment}"
  sign_in_audience = "AzureADMyOrg"
}

resource "azuread_service_principal" "deploy" {
  client_id = azuread_application.deploy.client_id
}

resource "azuread_application_federated_identity_credential" "github_environment" {
  application_id = azuread_application.deploy.id
  display_name   = "github-${var.environment}"
  description    = "Deploys from the ${var.environment} GitHub environment"
  audiences      = ["api://AzureADTokenExchange"]
  issuer         = "https://token.actions.githubusercontent.com"
  subject        = "repo:${var.github_owner}/${var.github_repository}:environment:${var.environment}"
}
