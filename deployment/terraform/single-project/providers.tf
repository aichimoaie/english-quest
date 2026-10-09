terraform {
  required_version = ">= 1.8.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.81"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.9"
    }
    postgresql = {
      source  = "cyrilgdn/postgresql"
      version = "~> 1.25"
    }
  }

  # The state key is set per environment by scripts/infra.sh, so this block
  # stays empty. See deployment/terraform/README.md.
  backend "azurerm" {}
}

provider "azurerm" {
  features {}

  subscription_id = var.subscription_id
  tenant_id       = var.tenant_id

  # Registers these providers on the first apply. Microsoft.App is NotRegistered
  # in the target subscription today.
  resource_providers_to_register = local.required_resource_providers
}

# Creates the API login role and its password. Connects as the administrator,
# over TLS, from the operator's address set in operator_ip_address.
provider "postgresql" {
  host            = azurerm_postgresql_flexible_server.this.fqdn
  port            = 5432
  database        = azurerm_postgresql_flexible_server_database.this.name
  username        = azurerm_postgresql_flexible_server.this.administrator_login
  password        = random_password.administrator.result
  sslmode         = "require"
  superuser       = false
  connect_timeout = 15
}
