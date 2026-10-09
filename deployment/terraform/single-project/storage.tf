# Hosts the Next.js static export (Free tier). The MVP has no blob storage: the
# Terraform state lives in the bootstrap storage account outside this root.
resource "azurerm_static_web_app" "this" {
  name                = module.shared.static_web_app_name
  resource_group_name = azurerm_resource_group.this.name
  location            = var.static_web_app_location
  sku_tier            = "Free"
  sku_size            = "Free"
  tags                = module.shared.tags
}
