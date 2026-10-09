variable "environment" {
  description = "Environment name: dev or prod. Set it in vars/<env>.tfvars."
  type        = string

  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "environment must be dev or prod."
  }
}

variable "subscription_id" {
  description = "Azure subscription GUID. Set in vars/<env>.tfvars. Only the approved subscription is accepted by scripts/infra.sh."
  type        = string
}

variable "tenant_id" {
  description = "Microsoft Entra tenant GUID of the subscription."
  type        = string
}

variable "name_suffix" {
  description = "Five lowercase letters or digits used in globally unique names. Set in vars/<env>.tfvars and do not change it after the first apply."
  type        = string
}

variable "location" {
  description = "Region for the resource group, API, database, Key Vault and logs. The MVP region is East US."
  type        = string
  default     = "eastus"
}

variable "operator_ip_address" {
  description = "Your public IPv4 address, so terraform can set the API database login from this machine. Null when the apply runs inside Azure. Set it in vars/<env>.tfvars before the first up."
  type        = string
  default     = null
}

variable "static_web_app_location" {
  description = "Region for the Static Web App. Documented exception: Static Web Apps is not offered in East US, so it uses East US 2. The API and database stay in East US."
  type        = string
  default     = "eastus2"
}

variable "postgres_version" {
  description = "PostgreSQL major version. Decision D7: keep 18 if East US offers it. Not yet verified with az postgres flexible-server list-skus."
  type        = string
  default     = "18"
}

variable "api_image" {
  description = "API container image. The default is a placeholder. The deploy pipeline replaces it with a GHCR image on each release."
  type        = string
  default     = "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest"
}

variable "key_vault_purge_protection" {
  description = "Purge protection blocks permanent deletion of the vault for the retention period. It cannot be turned off once on. Decision D8: on in prod only."
  type        = bool
  default     = false
}

variable "enable_budget" {
  description = "Create the monthly budget for this resource group. Decision D2: prod only."
  type        = bool
  default     = false
}

variable "budget_amount" {
  description = "Monthly budget for this environment's resource group, in USD."
  type        = number
  default     = 40
}

variable "budget_start_date" {
  description = "Budget start, at the first day of a current or future month, in RFC 3339 form."
  type        = string
}

variable "budget_contact_emails" {
  description = "Addresses that receive budget alerts."
  type        = list(string)
  default     = []
}

variable "alert_email_addresses" {
  description = "Addresses that receive monitoring alert emails."
  type        = list(string)
}

# DOMAIN PLACEHOLDER: decision D6 is not made. The owner fills in this value
# later. Nothing reads it yet, and no DNS zone, record or custom domain exists.
# Intentional placeholder until decision D6 (domain) is made.
# tflint-ignore: terraform_unused_declarations
variable "custom_domain" {
  description = "PLACEHOLDER, NOT DECIDED (decision D6). Set it later. Nothing reads it yet."
  type        = string
  default     = "PLACEHOLDER-owner-decision-D6"
}
