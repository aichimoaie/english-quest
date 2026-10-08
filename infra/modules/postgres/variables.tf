variable "name" {
  description = "Flexible server name. It becomes part of the server hostname, so it must be unique across Azure."
  type        = string
}

variable "resource_group_name" {
  description = "Resource group that holds the server."
  type        = string
}

variable "location" {
  description = "Azure region for the server."
  type        = string
}

variable "postgres_version" {
  description = "PostgreSQL major version. The PRD asks for the newest major version Azure offers in the region; verify it against the subscription before the first apply."
  type        = string
  default     = "18"
}

variable "administrator_login" {
  description = "Administrator login name for the server."
  type        = string
  default     = "eqadmin"
}

variable "database_name" {
  description = "Name of the application database."
  type        = string
  default     = "english_quest"
}

variable "tags" {
  description = "Tags applied to the server."
  type        = map(string)
  default     = {}
}
