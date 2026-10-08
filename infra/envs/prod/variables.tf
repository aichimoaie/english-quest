variable "environment" {
  description = "Environment name. Used in resource names and as the GitHub environment name."
  type        = string
  default     = "prod"
}

variable "subscription_id" {
  description = "Azure subscription GUID."
  type        = string
}

variable "tenant_id" {
  description = "Microsoft Entra tenant GUID."
  type        = string
}

variable "location" {
  description = "Azure region for the resource group, PostgreSQL, Container Apps and Key Vault. The MVP region is East US."
  type        = string
  default     = "eastus"
}

variable "static_web_app_location" {
  description = "Region for the Static Web App. Static Web Apps is not offered in East US, so East US 2 is the closest supported region."
  type        = string
  default     = "eastus2"
}

variable "postgres_version" {
  description = "PostgreSQL major version. Verify it is the newest one offered in East US before applying."
  type        = string
  default     = "18"
}

variable "github_owner" {
  description = "GitHub owner of the repository that deploys to this environment."
  type        = string
  default     = "aichimoaie"
}

variable "github_repository" {
  description = "GitHub repository name."
  type        = string
  default     = "english-quest"
}

variable "enable_ghcr_pull" {
  description = "Set to true when the GHCR image is private, so the API app can pull it."
  type        = bool
  default     = false
}

variable "ghcr_username" {
  description = "GitHub user that owns the read:packages token. Required when enable_ghcr_pull is true."
  type        = string
  default     = null
}

variable "ghcr_token" {
  description = "GitHub token with read:packages scope. Required when enable_ghcr_pull is true. Pass it through TF_VAR_ghcr_token, never in a tfvars file."
  type        = string
  default     = null
  sensitive   = true
}

variable "budget_amount" {
  description = "Monthly budget for the whole subscription, in USD."
  type        = number
  default     = 40
}

variable "budget_start_date" {
  description = "Budget start, at the first day of a month, in RFC 3339 form."
  type        = string
  default     = "2026-11-01T00:00:00Z"
}

variable "budget_contact_emails" {
  description = "Addresses that receive budget alerts. Set it in terraform.tfvars."
  type        = list(string)
}
