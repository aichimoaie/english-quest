variable "environment" {
  description = "Environment name: dev or prod."
  type        = string

  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "environment must be dev or prod."
  }
}

variable "subscription_id" {
  description = "Azure subscription GUID that the names are built for."
  type        = string
}

variable "name_suffix" {
  description = "Five lowercase letters or digits. Makes globally unique names (Static Web App, PostgreSQL, Key Vault) predictable. Set it once per environment in vars/<env>.tfvars and keep it."
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9]{5}$", var.name_suffix))
    error_message = "name_suffix must be exactly 5 lowercase letters or digits."
  }
}
