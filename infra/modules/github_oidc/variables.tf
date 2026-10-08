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

variable "resource_group_id" {
  description = "Resource group ID that the deploy identity may change."
  type        = string
}
