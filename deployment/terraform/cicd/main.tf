module "shared" {
  source = "../shared"

  environment     = var.environment
  subscription_id = var.subscription_id
  name_suffix     = var.name_suffix
}
