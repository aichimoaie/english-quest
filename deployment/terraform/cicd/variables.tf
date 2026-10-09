variable "environment" {
  description = "Environment name: dev or prod. The GitHub environment with the same name trusts this identity."
  type        = string

  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "environment must be dev or prod."
  }
}

variable "subscription_id" {
  description = "Azure subscription GUID. Set in vars/<env>.tfvars."
  type        = string
}

variable "tenant_id" {
  description = "Microsoft Entra tenant GUID."
  type        = string
}

variable "name_suffix" {
  description = "Must equal the name_suffix used by single-project for this environment."
  type        = string
}

variable "github_owner" {
  description = "GitHub user or organization that owns the repository."
  type        = string
  default     = "aichimoaie"
}

variable "github_repository" {
  description = "GitHub repository name."
  type        = string
  default     = "english-quest"
}
