# Monthly budget for this environment's resource group only (decision D2).
# Other projects in the same subscription do not count against it.
resource "azurerm_consumption_budget_resource_group" "this" {
  count = var.enable_budget ? 1 : 0

  name              = "budget-eq-${var.environment}-monthly"
  resource_group_id = azurerm_resource_group.this.id
  amount            = var.budget_amount
  time_grain        = "Monthly"

  time_period {
    start_date = var.budget_start_date
  }

  # Alert at 80% of actual spend, and when spend is forecast to reach 100%.
  notification {
    enabled        = true
    operator       = "GreaterThan"
    threshold      = 80
    threshold_type = "Actual"
    contact_emails = var.budget_contact_emails
  }

  notification {
    enabled        = true
    operator       = "GreaterThan"
    threshold      = 100
    threshold_type = "Forecasted"
    contact_emails = var.budget_contact_emails
  }
}
