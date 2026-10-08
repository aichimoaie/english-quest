# Remote state in the Azure Storage account created by the one manual bootstrap
# step (see infra/README.md). The storage account and container are passed at
# init time with -backend-config=backend.hcl, so no account name lives in code.
terraform {
  backend "azurerm" {
    key = "english-quest/dev.tfstate"
  }
}
