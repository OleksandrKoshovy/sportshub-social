terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.90"
    }
  }

  # Estado remoto guardado no Azure Storage (recomendado para equipas)
  backend "azurerm" {
    resource_group_name  = "sportshub-tfstate-rg"
    storage_account_name = "sportshubtfstate"
    container_name       = "tfstate"
    key                  = "sportshub.terraform.tfstate"
  }
}

provider "azurerm" {
  features {}
}

# ── Resource Group ─────────────────────────────────────────────
resource "azurerm_resource_group" "rg" {
  name     = var.resource_group_name
  location = var.location

  tags = {
    project     = "SportsHub Social"
    environment = var.environment
    team        = "CNCB"
  }
}

# ── Azure Cosmos DB ────────────────────────────────────────────
resource "azurerm_cosmosdb_account" "cosmos" {
  name                = "${var.prefix}-cosmos"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  offer_type          = "Standard"
  kind                = "GlobalDocumentDB"

  consistency_policy {
    consistency_level = "Session"
  }

  geo_location {
    location          = azurerm_resource_group.rg.location
    failover_priority = 0
  }

  tags = azurerm_resource_group.rg.tags
}

resource "azurerm_cosmosdb_sql_database" "db" {
  name                = "sportshub"
  resource_group_name = azurerm_resource_group.rg.name
  account_name        = azurerm_cosmosdb_account.cosmos.name
}

# Containers do Cosmos DB
locals {
  containers = [
    { name = "users",          partition = "/id" },
    { name = "events",         partition = "/id" },
    { name = "ratings",        partition = "/eventId" },
    { name = "participations", partition = "/eventId" },
    { name = "event-photos",   partition = "/eventId" },
    { name = "sports",         partition = "/id" },
  ]
}

resource "azurerm_cosmosdb_sql_container" "containers" {
  for_each = { for c in local.containers : c.name => c }

  name                = each.value.name
  resource_group_name = azurerm_resource_group.rg.name
  account_name        = azurerm_cosmosdb_account.cosmos.name
  database_name       = azurerm_cosmosdb_sql_database.db.name
  partition_key_path  = each.value.partition
  throughput          = 400
}

# ── Azure Blob Storage ─────────────────────────────────────────
resource "azurerm_storage_account" "storage" {
  name                     = "${var.prefix}storage"
  resource_group_name      = azurerm_resource_group.rg.name
  location                 = azurerm_resource_group.rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  min_tls_version          = "TLS1_2"

  blob_properties {
    cors_rule {
      allowed_origins    = [var.frontend_url, "http://localhost:5173"]
      allowed_methods    = ["GET", "PUT", "POST", "DELETE"]
      allowed_headers    = ["*"]
      exposed_headers    = ["*"]
      max_age_in_seconds = 3600
    }
  }

  tags = azurerm_resource_group.rg.tags
}

resource "azurerm_storage_container" "event_photos" {
  name                  = "event-photos"
  storage_account_name  = azurerm_storage_account.storage.name
  container_access_type = "blob"
}

resource "azurerm_storage_container" "avatars" {
  name                  = "avatars"
  storage_account_name  = azurerm_storage_account.storage.name
  container_access_type = "blob"
}

resource "azurerm_storage_container" "docs" {
  name                  = "docs"
  storage_account_name  = azurerm_storage_account.storage.name
  container_access_type = "private"
}

# ── Azure Container Registry ───────────────────────────────────
resource "azurerm_container_registry" "acr" {
  name                = "${var.prefix}registry"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  sku                 = "Basic"
  admin_enabled       = true

  tags = azurerm_resource_group.rg.tags
}

# ── Azure App Service (Backend API) ───────────────────────────
resource "azurerm_service_plan" "plan" {
  name                = "${var.prefix}-plan"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  os_type             = "Linux"
  sku_name            = var.app_service_sku
}

resource "azurerm_linux_web_app" "api" {
  name                = "${var.prefix}-api"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  service_plan_id     = azurerm_service_plan.plan.id

  site_config {
    application_stack {
      docker_image_name        = "${azurerm_container_registry.acr.login_server}/sportshub-api:latest"
      docker_registry_url      = "https://${azurerm_container_registry.acr.login_server}"
      docker_registry_username = azurerm_container_registry.acr.admin_username
      docker_registry_password = azurerm_container_registry.acr.admin_password
    }

    always_on = var.app_service_sku != "F1"
  }

  app_settings = {
    COSMOS_CONNECTION_STRING = azurerm_cosmosdb_account.cosmos.primary_sql_connection_string
    COSMOS_DATABASE          = "sportshub"
    BLOB_CONNECTION_STRING   = azurerm_storage_account.storage.primary_connection_string
    BLOB_ACCOUNT_URL         = azurerm_storage_account.storage.primary_blob_endpoint
    JWT_SECRET               = var.jwt_secret
    FUNCTIONS_ENDPOINT       = "https://${azurerm_linux_function_app.functions.default_hostname}"
    FRONTEND_URL             = var.frontend_url
    NODE_ENV                 = "production"
  }

  tags = azurerm_resource_group.rg.tags
}

# ── Azure Functions ────────────────────────────────────────────
resource "azurerm_storage_account" "func_storage" {
  name                     = "${var.prefix}funcstorage"
  resource_group_name      = azurerm_resource_group.rg.name
  location                 = azurerm_resource_group.rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "azurerm_service_plan" "func_plan" {
  name                = "${var.prefix}-func-plan"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  os_type             = "Linux"
  sku_name            = "Y1" # Consumption (serverless)
}

resource "azurerm_linux_function_app" "functions" {
  name                       = "${var.prefix}-functions"
  resource_group_name        = azurerm_resource_group.rg.name
  location                   = azurerm_resource_group.rg.location
  storage_account_name       = azurerm_storage_account.func_storage.name
  storage_account_access_key = azurerm_storage_account.func_storage.primary_access_key
  service_plan_id            = azurerm_service_plan.func_plan.id

  site_config {
    application_stack {
      node_version = "20"
    }
  }

  app_settings = {
    COSMOS_CONNECTION_STRING  = azurerm_cosmosdb_account.cosmos.primary_sql_connection_string
    COSMOS_DATABASE           = "sportshub"
    AzureWebJobsStorage       = azurerm_storage_account.func_storage.primary_connection_string
    FUNCTIONS_WORKER_RUNTIME  = "node"
    WEBSITE_RUN_FROM_PACKAGE  = "1"
  }

  tags = azurerm_resource_group.rg.tags
}
