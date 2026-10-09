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
