variable "name" {
  description = "Budget name. It must be unique within the subscription."
  type        = string
}

variable "subscription_id" {
  description = "Subscription resource ID, in the form /subscriptions/<subscription-guid>."
  type        = string
}

variable "amount" {
  description = "Monthly budget in USD."
  type        = number
}

variable "start_date" {
  description = "Budget start, as an RFC 3339 timestamp at the first day of a month, for example 2026-11-01T00:00:00Z."
  type        = string
}

variable "contact_emails" {
  description = "Addresses that receive budget alerts."
  type        = list(string)
}
