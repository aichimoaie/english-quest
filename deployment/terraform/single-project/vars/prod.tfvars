# Prod environment values. Not secret. Edit the REPLACE- lines before the first run.
environment                = "prod"
subscription_id            = "389d9a64-7cca-46b1-9de0-8214eae2597a"
tenant_id                  = "704bd4e2-32b5-463a-addd-90b2c21b5d66"
name_suffix                = "p3d8v"
key_vault_purge_protection = true
operator_ip_address        = "REPLACE-your-public-ipv4"
alert_email_addresses      = ["REPLACE-owner-email@example.com"]
enable_budget              = true
budget_amount              = 40
budget_start_date          = "2026-11-01T00:00:00Z"
budget_contact_emails      = ["REPLACE-owner-email@example.com"]
