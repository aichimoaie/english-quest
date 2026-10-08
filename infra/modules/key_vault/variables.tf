variable "name" {
  description = "Key Vault name. It is global, 3 to 24 characters, letters, numbers and hyphens."
  type        = string
}

variable "resource_group_name" {
  description = "Resource group that holds the vault."
  type        = string
}

variable "location" {
  description = "Azure region for the vault."
  type        = string
}

variable "purge_protection_enabled" {
  description = "Purge protection blocks permanent deletion for the retention period. It cannot be turned off once enabled, so enable it in prod only."
  type        = bool
  default     = false
}

variable "tags" {
  description = "Tags applied to the vault."
  type        = map(string)
  default     = {}
}
