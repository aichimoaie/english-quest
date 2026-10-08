variable "name_prefix" {
  description = "Suffix for resource names, for example eq-dev. Names are built as log-<prefix>, cae-<prefix> and ca-<prefix>-api."
  type        = string
}

variable "environment" {
  description = "Environment name, passed to the API as APP_ENV."
  type        = string
}

variable "resource_group_name" {
  description = "Resource group that holds the Container Apps resources."
  type        = string
}

variable "location" {
  description = "Azure region for the Log Analytics workspace, the Container Apps environment and the API app."
  type        = string
}

variable "tags" {
  description = "Tags applied to every resource in this module."
  type        = map(string)
  default     = {}
}

variable "log_analytics_daily_quota_gb" {
  description = "Daily ingestion cap for Log Analytics, in GB. The cap keeps logging cost inside the MVP budget."
  type        = number
  default     = 1
}

variable "api_image" {
  description = "Container image for the API. The default is a placeholder; the CI workflow replaces it with ghcr.io images on each deploy."
  type        = string
  default     = "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest"
}

variable "api_target_port" {
  description = "Port the API container listens on. Matches the uvicorn default."
  type        = number
  default     = 8000
}

variable "min_replicas" {
  description = "Minimum API replicas. Keep at 1: managed certificate issuance and renewal need the app running."
  type        = number
  default     = 1
}

variable "max_replicas" {
  description = "Maximum API replicas."
  type        = number
  default     = 2
}

variable "database_url" {
  description = "SQLAlchemy connection URL for the database. Stored as a Container Apps secret."
  type        = string
  sensitive   = true
}

variable "web_origin" {
  description = "Origin of the static web app, for example https://example.azurestaticapps.net. The API uses it for CORS."
  type        = string
}

variable "enable_ghcr_pull" {
  description = "Set to true when the GHCR image is private. Requires ghcr_username and ghcr_token."
  type        = bool
  default     = false
}

variable "ghcr_username" {
  description = "GitHub user name that owns the read:packages token."
  type        = string
  default     = null
}

variable "ghcr_token" {
  description = "GitHub token with read:packages scope, used by the API app to pull its image from ghcr.io."
  type        = string
  default     = null
  sensitive   = true
}
