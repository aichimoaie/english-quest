output "tags" {
  description = "Tags applied to every resource."
  value       = local.tags
}

output "resource_group_name" {
  description = "Resource group for the environment."
  value       = local.resource_group_name
}

output "resource_group_id" {
  description = "Resource group ID."
  value       = local.resource_group_id
}

output "container_app_name" {
  description = "API container app name."
  value       = local.container_app_name
}

output "container_app_id" {
  description = "API container app ID, built from its name."
  value       = local.container_app_id
}

output "static_web_app_name" {
  description = "Static Web App name."
  value       = local.static_web_app_name
}

output "static_web_app_id" {
  description = "Static Web App ID, built from its name."
  value       = local.static_web_app_id
}

output "postgres_server_name" {
  description = "PostgreSQL flexible server name."
  value       = local.postgres_server_name
}

output "postgres_id" {
  description = "PostgreSQL flexible server ID, built from its name."
  value       = local.postgres_id
}

output "key_vault_name" {
  description = "Key Vault name. Globally unique."
  value       = local.key_vault_name
}
