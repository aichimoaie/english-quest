variable "display_name" {
  description = "Display name of the Entra application that GitHub Actions signs in as."
  type        = string
}

variable "github_owner" {
  description = "GitHub user or organization that owns the repository."
  type        = string
}

variable "github_repository" {
  description = "GitHub repository name."
  type        = string
}

variable "github_environment" {
  description = "GitHub environment that the federated credential trusts, for example dev or prod."
  type        = string
}

variable "container_app_id" {
  description = "ID of the API container app that the deploy identity may update."
  type        = string
}

variable "static_web_app_id" {
  description = "ID of the Static Web App that the deploy identity may update."
  type        = string
}

variable "postgres_server_id" {
  description = "ID of the PostgreSQL flexible server that the deploy identity may manage."
  type        = string
}
