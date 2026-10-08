resource "azurerm_consumption_budget_subscription" "this" {
  name            = var.name
  subscription_id = var.subscription_id
  amount          = var.amount
  time_grain      = "Monthly"

  time_period {
    start_date = var.start_date
  }

  # Alert at 80% of actual spend, and when spend is forecast to reach 100%.
  notification {
    enabled        = true
    operator       = "GreaterThan"
    threshold      = 80
    threshold_type = "Actual"
    contact_emails = var.contact_emails
  }

  notification {
    enabled        = true
    operator       = "GreaterThan"
    threshold      = 100
    threshold_type = "Forecasted"
    contact_emails = var.contact_emails
  }
}
