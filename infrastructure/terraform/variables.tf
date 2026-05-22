variable "resource_group_name" {
  description = "Nome do Resource Group no Azure"
  type        = string
  default     = "sportshub-rg"
}

variable "location" {
  description = "Região Azure onde os recursos serão criados"
  type        = string
  default     = "francecentral"
}

variable "functions_location" {
  description = "Região Azure para as Azure Functions (pode diferir da API)"
  type        = string
  default     = "germanywestcentral"
}

variable "prefix" {
  description = "Prefixo para nomear todos os recursos (deve ser único)"
  type        = string
  default     = "sportshub"
}

variable "environment" {
  description = "Ambiente de deployment: dev | staging | production"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "environment deve ser 'dev', 'staging' ou 'production'."
  }
}

variable "app_service_sku" {
  description = "SKU do App Service Plan (F1 = gratuito, B1 = básico pago)"
  type        = string
  default     = "B1"
}

variable "jwt_secret" {
  description = "Chave secreta para assinar os tokens JWT (mínimo 32 caracteres)"
  type        = string
  sensitive   = true
}

variable "frontend_url" {
  description = "URL do frontend (para CORS e redirect)"
  type        = string
  default     = "https://sportshubstorage.z28.web.core.windows.net"
}
