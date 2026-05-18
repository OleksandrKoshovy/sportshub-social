# Azure CLI — Scripts de Deployment

Scripts shell para criar toda a infraestrutura do SportsHub Social
no Microsoft Azure usando o Azure CLI. Executar pela ordem indicada.

## Pré-requisitos

```bash
# 1. Instalar o Azure CLI
# macOS:
brew install azure-cli

# Windows:
winget install Microsoft.AzureCLI

# Linux (Ubuntu/Debian):
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# 2. Instalar Azure Functions Core Tools
npm install -g azure-functions-core-tools@4

# 3. Verificar instalações
az --version
func --version
docker --version
```

---

## Ordem de Execução

| Script | O que faz |
|--------|-----------|
| `01-login-resource-group.sh` | Login no Azure + cria Resource Group |
| `02-cosmos-db.sh`            | Cria Cosmos DB + 6 containers NoSQL |
| `03-blob-storage.sh`         | Cria Blob Storage + containers + CORS |
| `04-app-service.sh`          | Build Docker + ACR + App Service |
| `05-azure-functions.sh`      | Deploy das Azure Functions serverless |
| `06-github-cicd.sh`          | Configura CI/CD com GitHub Actions |
| `07-verify-all.sh`           | Verifica todos os serviços |
| `08-cleanup.sh`              | ⚠️ Elimina tudo (usar no fim) |

---

## Como executar

```bash
# Tornar os scripts executáveis
chmod +x azure-cli/*.sh

# Executar pela ordem
cd azure-cli

./01-login-resource-group.sh
./02-cosmos-db.sh
./03-blob-storage.sh
./04-app-service.sh          # Requer Docker Desktop a correr
./05-azure-functions.sh
./06-github-cicd.sh
./07-verify-all.sh
```

---

## O que é criado no Azure

```
Resource Group: sportshub-rg (West Europe)
│
├── Cosmos DB Account (sportshub-cosmos-XXXXX)
│   └── Database: sportshub
│       ├── Container: users          (partition: /id)
│       ├── Container: events         (partition: /id)
│       ├── Container: ratings        (partition: /eventId)
│       ├── Container: participations (partition: /eventId)
│       ├── Container: event-photos   (partition: /eventId)
│       └── Container: sports         (partition: /id)
│
├── Storage Account (sportshubstorageXXXXX)
│   ├── Container: event-photos  (público — fotos de eventos)
│   ├── Container: avatars       (público — fotos de perfil)
│   └── Container: docs          (privado)
│
├── Container Registry (sportshubregistry)
│   └── Image: sportshub-api:latest
│
├── App Service Plan (sportshub-plan — F1 gratuito)
│   └── Web App: sportshub-api
│       └── Docker: sportshubregistry.azurecr.io/sportshub-api:latest
│
└── Function App (sportshub-functions — Consumption)
    ├── Function: UpdateRanking  (HTTP trigger)
    └── Function: CleanupExpired (Timer trigger — 00:00 UTC)
```

---

## Verificar no Portal Azure

Após executar os scripts, podes ver tudo em:
https://portal.azure.com → Resource Groups → sportshub-rg

## URLs finais

- **API:** `https://sportshub-api.azurewebsites.net`
- **Health:** `https://sportshub-api.azurewebsites.net/api/health`
- **Functions:** `https://sportshub-functions.azurewebsites.net`
