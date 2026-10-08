variable "name" {
  description = "Static Web App name. It becomes part of the default hostname, so it must be unique across Azure."
  type        = string
}

variable "resource_group_name" {
  description = "Resource group that holds the Static Web App."
  type        = string
}

variable "location" {
  description = "Static Web Apps region. Static Web Apps is not offered in East US, so the environment passes East US 2."
  type        = string
}

variable "tags" {
  description = "Tags applied to the Static Web App."
  type        = map(string)
  default     = {}
}
