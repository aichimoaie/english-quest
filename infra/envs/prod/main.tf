locals {
  tags = {
    project     = "english-quest"
    environment = var.environment
    managed_by  = "opentofu"
  }

  database_url = "postgresql+psycopg://${module.postgres.administrator_login}:${module.postgres.administrator_password}@${module.postgres.fqdn}:5432/${module.postgres.database_name}?sslmode=require"
}

resource "random_string" "suffix" {
  length  = 5
  upper   = false
  special = false
}

resource "azurerm_resource_group" "this" {
  name     = "rg-english-quest-${var.environment}"
  location = var.location
  tags     = local.tags
}

module "static_web_app" {
  source = "../../modules/static_web_app"

  name                = "swa-eq-${var.environment}-${random_string.suffix.result}"
  resource_group_name = azurerm_resource_group.this.name
  location            = var.static_web_app_location
  tags                = local.tags
}

module "postgres" {
  source = "../../modules/postgres"

  name                = "psql-eq-${var.environment}-${random_string.suffix.result}"
  resource_group_name = azurerm_resource_group.this.name
  location            = var.location
  postgres_version    = var.postgres_version
  tags                = local.tags
}

module "key_vault" {
  source = "../../modules/key_vault"

  name                     = "kv-eq-${var.environment}-${random_string.suffix.result}"
  resource_group_name      = azurerm_resource_group.this.name
  location                 = var.location
  purge_protection_enabled = true
  tags                     = local.tags
}

resource "azurerm_key_vault_secret" "database_url" {
  name         = "database-url"
  value        = local.database_url
  key_vault_id = module.key_vault.id
  depends_on   = [module.key_vault]
}

module "container_apps" {
  source = "../../modules/container_apps"

  name_prefix         = "eq-${var.environment}"
  environment         = var.environment
  resource_group_name = azurerm_resource_group.this.name
  location            = var.location
  web_origin          = "https://${module.static_web_app.default_host_name}"
  database_url        = local.database_url
  tags                = local.tags
}

module "github_oidc" {
  source = "../../modules/github_oidc"

  display_name       = "eq-github-deploy-${var.environment}"
  github_owner       = var.github_owner
  github_repository  = var.github_repository
  github_environment = var.environment
  container_app_id   = module.container_apps.container_app_id
  static_web_app_id  = module.static_web_app.id
  postgres_server_id = module.postgres.id
}

# The budget covers the whole subscription, so it lives in one environment only.
# Creating it in dev as well would double-count the same spend.
module "budget" {
  source = "../../modules/budget"

  name            = "budget-english-quest-monthly"
  subscription_id = "/subscriptions/${var.subscription_id}"
  amount          = var.budget_amount
  start_date      = var.budget_start_date
  contact_emails  = var.budget_contact_emails
}
