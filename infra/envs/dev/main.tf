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
  purge_protection_enabled = false
  tags                     = local.tags
}

resource "azurerm_key_vault_secret" "postgres_admin_password" {
  name         = "postgres-admin-password"
  value        = module.postgres.administrator_password
  key_vault_id = module.key_vault.id
  depends_on   = [module.key_vault]
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
  enable_ghcr_pull    = var.enable_ghcr_pull
  ghcr_username       = var.ghcr_username
  ghcr_token          = var.ghcr_token
  tags                = local.tags
}

module "github_oidc" {
  source = "../../modules/github_oidc"

  display_name       = "eq-github-deploy-${var.environment}"
  github_owner       = var.github_owner
  github_repository  = var.github_repository
  github_environment = var.environment
  resource_group_id  = azurerm_resource_group.this.id
}
