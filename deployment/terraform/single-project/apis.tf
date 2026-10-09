# Azure resource providers this root needs. Terraform registers them on apply.
locals {
  required_resource_providers = [
    "Microsoft.App",
    "Microsoft.Authorization",
    "Microsoft.DBforPostgreSQL",
    "Microsoft.Insights",
    "Microsoft.KeyVault",
    "Microsoft.OperationalInsights",
    "Microsoft.Web",
  ]
}
