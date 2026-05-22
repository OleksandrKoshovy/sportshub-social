# SportsHub Social

Plataforma web social para organização e participação em eventos desportivos amadores.
Desenvolvida com Node.js, Azure Cosmos DB, Azure Blob Storage, Azure Functions,
Docker e Terraform.

**Autores:** Bernardo Ávila · Gabriel Inácio · Oleksandr Koshovyi  
**Unidade Curricular:** Computação em Nuvem — Abril 2026

---

## URLs em Produção

| Serviço | URL |
|---------|-----|
| **Frontend** | https://sportshubstorage.z28.web.core.windows.net |
| **API** | https://sportshub-api.azurewebsites.net |
| **Health Check** | https://sportshub-api.azurewebsites.net/api/health |
| **Azure Functions** | https://sportshub-functions.azurewebsites.net |
| **GitHub CI/CD** | https://github.com/OleksandrKoshovy/sportshub-social/actions |

---

## Estrutura do Projeto

```
sportshub/
├── backend/
│   ├── src/
│   │   ├── app.js                  ← Entrada principal da API
│   │   ├── routes/
│   │   │   ├── auth.js             ← Login e Registo
│   │   │   ├── events.js           ← CRUD de eventos + inscrições
│   │   │   ├── ratings.js          ← Avaliações e ranking
│   │   │   ├── upload.js           ← Upload para Azure Blob Storage
│   │   │   ├── users.js            ← Perfil de utilizador + my events
│   │   │   └── admin.js            ← Gestão admin (users e eventos)
│   │   └── middleware/
│   │       └── auth.js             ← Verificação JWT
│   ├── functions/
│   │   ├── CleanupExpired/         ← Azure Function: marca eventos concluídos
│   │   ├── UpdateRanking/          ← Azure Function: recalcula ranking (HTTP)
│   │   └── ProcessRating/          ← Azure Function: Cosmos DB Change Feed
│   ├── __tests__/
│   │   └── health.test.js          ← Testes unitários (Jest + Supertest)
│   ├── Dockerfile                  ← Imagem Docker multi-stage (node:20-alpine)
│   ├── .eslintrc.json              ← Configuração ESLint
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/                  ← Landing, Feed, EventDetail, Ranking,
│   │   │   │                          Profile, CreateEvent, MyEvents,
│   │   │   │                          Login, Register, Admin
│   │   ├── components/             ← Layout, EventCard, ...
│   │   └── services/api.js         ← Axios client para a API
│   └── .env.production             ← VITE_API_URL para build Azure
├── infrastructure/
│   └── terraform/
│       ├── main.tf                 ← Todos os recursos Azure
│       ├── variables.tf            ← Parâmetros configuráveis
│       └── outputs.tf              ← URLs e endpoints gerados
├── .github/
│   └── workflows/
│       └── deploy.yml              ← Pipeline CI/CD (5 jobs)
├── azure-cli/
│   └── comandos-azure.txt          ← Comandos Azure CLI passo a passo
├── deploy.ps1                      ← Script de deploy manual (PowerShell)
└── RELATORIO.md                    ← Relatório do projeto
```

---

## Pré-requisitos

- Node.js 20+
- Azure CLI (`az login`)
- Terraform 1.7+
- Conta Azure (Student pack)
- Azure Functions Core Tools v4 (`npm install -g azure-functions-core-tools@4`)

---

## Configuração Local (Desenvolvimento)

### 1. Clonar e instalar dependências

```bash
git clone https://github.com/OleksandrKoshovy/sportshub-social.git
cd sportshub-social/backend
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Edita o .env com as tuas credenciais Azure
```

### 3. Iniciar o servidor

```bash
npm run dev
# API disponível em http://localhost:3000
# Health check: http://localhost:3000/api/health
```

### 4. Correr testes e lint

```bash
npm test          # Jest — 7 testes unitários
npm run lint      # ESLint
```

---

## Deploy da Infraestrutura com Terraform

> **Nota:** os recursos já estão criados no Azure. O Terraform serve para recriar ou
> replicar a infraestrutura noutro ambiente.

```bash
cd infrastructure/terraform

# 1. Inicializar (requer storage account 'sportshubtfstate' criado previamente)
terraform init

# 2. Verificar o plano
terraform plan -var="jwt_secret=A_TUA_CHAVE_SECRETA"

# 3. Criar os recursos
terraform apply -var="jwt_secret=A_TUA_CHAVE_SECRETA"
```

---

## Build e Deploy com Docker

```bash
# Build via Azure Container Registry (sem Docker local)
az acr build --registry sportshubregistry \
             --image sportshub-api:latest \
             --file backend/Dockerfile backend/

# Ou localmente (requer Docker Desktop)
cd backend
docker build -t sportshub-api .
docker run -p 3000:3000 --env-file .env sportshub-api
```

---

## Deploy das Azure Functions

```bash
cd backend/functions
npm install
func azure functionapp publish sportshub-functions --javascript
```

---

## Deploy do Frontend

```bash
cd frontend
npm install
npm run build  # usa VITE_API_URL do .env.production automaticamente
az storage blob upload-batch \
  --account-name sportshubstorage \
  --destination '$web' \
  --source dist --overwrite true
```

---

## CI/CD Automático

Qualquer push para o branch `master` dispara automaticamente o pipeline GitHub Actions:

```
push → master
        │
        ├─► [Job 1] Lint (ESLint) + Testes (Jest)
        ├─► [Job 2] Build & Push Docker → ACR          (requer Job 1)
        ├─► [Job 3] Deploy App Service (Docker)        (requer Job 2)
        ├─► [Job 4] Deploy Azure Functions             (requer Job 1)
        └─► [Job 5] Build & Deploy Frontend → Blob     (requer Job 1)
```

**Secrets configurados no GitHub:**

| Secret | Valor |
|--------|-------|
| `AZURE_CREDENTIALS` | JSON do Service Principal |
| `ACR_USERNAME` | `sportshubregistry` |
| `ACR_PASSWORD` | Password do ACR |

---

## Endpoints da API

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| POST | /api/auth/register | Criar conta | ❌ |
| POST | /api/auth/login | Login → devolve JWT | ❌ |
| GET | /api/events | Listar eventos (filtros: sport, city, date) | ❌ |
| POST | /api/events | Criar evento | ✅ |
| PUT | /api/events/:id | Editar evento | ✅ |
| DELETE | /api/events/:id | Cancelar evento | ✅ |
| POST | /api/events/:id/join | Inscrever-se | ✅ |
| DELETE | /api/events/:id/join | Cancelar inscrição | ✅ |
| GET | /api/events/:id/participants | Lista de participantes | ✅ |
| POST | /api/ratings | Submeter avaliação | ✅ |
| GET | /api/ratings/ranking | Ranking global | ❌ |
| GET | /api/ratings/stats | Contagem total de avaliações | ❌ |
| GET | /api/ratings/user/:id | Avaliações recebidas por utilizador | ❌ |
| POST | /api/upload/event-photo | Upload foto evento | ✅ |
| POST | /api/upload/avatar | Atualizar avatar | ✅ |
| GET | /api/users/me | Perfil do utilizador autenticado | ✅ |
| PUT | /api/users/profile | Editar perfil | ✅ |
| GET | /api/users/me/events | Eventos do utilizador (criados + participações) | ✅ |
| GET | /api/admin/users | Listar utilizadores | 👑 |
| PATCH | /api/admin/users/:id/status | Suspender/reativar utilizador | 👑 |
| GET | /api/admin/events | Listar todos os eventos | 👑 |
| PATCH | /api/admin/events/:id/cancel | Cancelar evento | 👑 |
| GET | /api/health | Estado da API e Cosmos DB | ❌ |

✅ Requer JWT &nbsp;|&nbsp; 👑 Requer role=admin

---

## Azure Functions

| Função | Trigger | Descrição |
|--------|---------|-----------|
| **CleanupExpired** | Timer (diário 00:00 UTC) | Marca como `completed` eventos com data passada |
| **UpdateRanking** | HTTP POST | Recalcula `avgRating` e `rankingPoints` de um utilizador |
| **ProcessRating** | Cosmos DB Change Feed | Atualiza ranking automaticamente ao inserir avaliação |

**Fórmula do ranking:**
```
rankingPoints = round(avgRating × 20) + eventsCount × 5
```

---

## Serviços Azure Utilizados

| Serviço | Uso no Projeto |
|---------|----------------|
| Azure App Service (B1 Linux) | Hosting da API (Docker container) |
| Azure Cosmos DB (NoSQL) | Base de dados: users, events, ratings, participations, sports |
| Azure Blob Storage | Fotos de eventos, avatares e hosting do frontend (static website) |
| Azure Functions (Consumption) | Ranking automático, limpeza de eventos, Change Feed |
| Azure Container Registry (Basic) | Repositório da imagem Docker |
| GitHub Actions | CI/CD: lint → testes → build → deploy (5 jobs) |
| Terraform | Infraestrutura como Código (IaC) — define todos os recursos |
