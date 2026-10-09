resource "random_password" "administrator" {
  length  = 40
  special = false
}

resource "azurerm_postgresql_flexible_server" "this" {
  name                   = module.shared.postgres_server_name
  resource_group_name    = azurerm_resource_group.this.name
  location               = var.location
  version                = var.postgres_version
  administrator_login    = "eqadmin"
  administrator_password = random_password.administrator.result

  # Burstable B1MS, 32 GiB, no high availability. Sized for the MVP.
  sku_name   = "B_Standard_B1ms"
  storage_mb = 32768

  backup_retention_days         = 7
  geo_redundant_backup_enabled  = false
  public_network_access_enabled = true

  tags = module.shared.tags
}

resource "azurerm_postgresql_flexible_server_database" "this" {
  name      = "english_quest"
  server_id = azurerm_postgresql_flexible_server.this.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

# Container Apps on the Consumption plan has no fixed outbound IP, so the server
# accepts connections from Azure services. Clients still need the password and TLS.
resource "azurerm_postgresql_flexible_server_firewall_rule" "azure_services" {
  name             = "allow-azure-services"
  server_id        = azurerm_postgresql_flexible_server.this.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

# The API connects as a restricted login. Migrations keep the administrator login.
# The migration creates both roles if they are missing. Terraform creates them
# first so it can set the API login's password.
resource "random_password" "api_login" {
  length  = 40
  special = false
}

# Operator access for the role setup below. Set it in vars/<env>.tfvars to your
# public IP before the first apply. Leave it null when the apply runs from Azure.
resource "azurerm_postgresql_flexible_server_firewall_rule" "operator" {
  count            = var.operator_ip_address == null ? 0 : 1
  name             = "allow-operator"
  server_id        = azurerm_postgresql_flexible_server.this.id
  start_ip_address = var.operator_ip_address
  end_ip_address   = var.operator_ip_address
}

resource "postgresql_role" "server" {
  name  = "english_quest_server"
  login = false
  depends_on = [
    azurerm_postgresql_flexible_server_database.this,
    azurerm_postgresql_flexible_server_firewall_rule.operator,
  ]
}

resource "postgresql_role" "api" {
  name       = "english_quest_api"
  login      = true
  password   = random_password.api_login.result
  roles      = [postgresql_role.server.name]
  depends_on = [azurerm_postgresql_flexible_server_firewall_rule.operator]
}

locals {
  database_url     = "postgresql+psycopg://${azurerm_postgresql_flexible_server.this.administrator_login}:${random_password.administrator.result}@${azurerm_postgresql_flexible_server.this.fqdn}:5432/${azurerm_postgresql_flexible_server_database.this.name}?sslmode=require"
  api_database_url = "postgresql+psycopg://${postgresql_role.api.name}:${random_password.api_login.result}@${azurerm_postgresql_flexible_server.this.fqdn}:5432/${azurerm_postgresql_flexible_server_database.this.name}?sslmode=require"
}
