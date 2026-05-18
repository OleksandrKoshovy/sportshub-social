output "api_url" {
  description = "URL da API no Azure App Service"
  value       = "https://${azurerm_linux_web_app.api.default_hostname}"
}

output "functions_url" {
  description = "URL das Azure Functions"
  value       = "https://${azurerm_linux_function_app.functions.default_hostname}"
}

output "cosmos_endpoint" {
  description = "Endpoint do Cosmos DB"
  value       = azurerm_cosmosdb_account.cosmos.endpoint
  sensitive   = true
}

output "blob_endpoint" {
  description = "Endpoint do Blob Storage"
  value       = azurerm_storage_account.storage.primary_blob_endpoint
}

output "acr_login_server" {
  description = "URL do Azure Container Registry"
  value       = azurerm_container_registry.acr.login_server
}
