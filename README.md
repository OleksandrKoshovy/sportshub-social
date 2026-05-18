# SportsHub Social

Plataforma web social para organização e participação em eventos desportivos amadores.
Desenvolvida com Node.js, Azure Cosmos DB, Azure Blob Storage, Azure Functions,
Docker e Terraform.

**Autores:** Bernardo Ávila · Gabriel Inácio · Oleksandr Koshovyi  
**Unidade Curricular:** Computação em Nuvem — Abril 2026

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
│   │   │   ├── users.js            ← Perfil de utilizador
│   │   │   └── admin.js            ← Gestão admin (users e eventos)
│   │   └── middleware/
│   │       └── auth.js             ← Verificação JWT
│   ├── functions/
│   │   ├── UpdateRanking/          ← Azure Function: atualiza ranking
│   │   └── CleanupExpired/         ← Azure Function: marca eventos concluídos
│   ├── Dockerfile                  ← Imagem Docker multi-stage
│   ├── package.json
│   └── .env.example                ← Template das variáveis de ambiente
├── infrastructure/
│   └── terraform/
│       ├── main.tf                 ← Todos os recursos Azure
│       ├── variables.tf            ← Parâmetros configuráveis
│       └── outputs.tf              ← URLs e endpoints gerados
├── .github/
│   └── workflows/
│       └── deploy.yml              ← Pipeline CI/CD completo
└── README.md
```

---

## Pré-requisitos

- Node.js 20+
- Docker Desktop
- Azure CLI (`az login`)
- Terraform 1.7+
- Conta Azure (Student pack dá $100 de crédito)

---

## Configuração Local (Desenvolvimento)

### 1. Clonar e instalar dependências

```bash
git clone https://github.com/SEU_USER/sportshub-social.git
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

---

## Deploy da Infraestrutura com Terraform

```bash
cd infrastructure/terraform

# 1. Inicializar o Terraform
terraform init

# 2. Verificar o plano de recursos a criar
terraform plan -var="jwt_secret=A_TUA_CHAVE_SECRETA"

# 3. Criar os recursos no Azure
terraform apply -var="jwt_secret=A_TUA_CHAVE_SECRETA"

# Os outputs mostram as URLs geradas:
# api_url, functions_url, blob_endpoint, etc.
```

---

## Build e Deploy com Docker

```bash
cd backend

# Build da imagem
docker build -t sportshub-api .

# Correr localmente com Docker
docker run -p 3000:3000 --env-file .env sportshub-api

# Push para Azure Container Registry (após terraform apply)
docker tag sportshub-api sportshubregistry.azurecr.io/sportshub-api:latest
docker push sportshubregistry.azurecr.io/sportshub-api:latest
```

---

## Endpoints da API

| Método | Rota                            | Descrição                        | Auth |
|--------|---------------------------------|----------------------------------|------|
| POST   | /api/auth/register              | Criar conta                      | ❌    |
| POST   | /api/auth/login                 | Login → devolve JWT              | ❌    |
| GET    | /api/events                     | Listar eventos (com filtros)     | ❌    |
| POST   | /api/events                     | Criar evento                     | ✅    |
| POST   | /api/events/:id/join            | Inscrever-se num evento          | ✅    |
| DELETE | /api/events/:id/join            | Cancelar inscrição               | ✅    |
| GET    | /api/events/:id/participants    | Lista de participantes           | ✅    |
| POST   | /api/ratings                    | Submeter avaliação               | ✅    |
| GET    | /api/ratings/ranking            | Ranking global (com filtros)     | ❌    |
| POST   | /api/upload/event-photo         | Upload foto para Blob Storage    | ✅    |
| POST   | /api/upload/avatar              | Atualizar foto de perfil         | ✅    |
| GET    | /api/users/me                   | Perfil do utilizador autenticado | ✅    |
| PUT    | /api/users/profile              | Editar perfil                    | ✅    |
| GET    | /api/admin/users                | Listar todos os utilizadores     | 👑    |
| PATCH  | /api/admin/users/:id/status     | Suspender / reativar utilizador  | 👑    |
| GET    | /api/admin/events               | Listar todos os eventos          | 👑    |
| PATCH  | /api/admin/events/:id/cancel    | Cancelar evento                  | 👑    |
| GET    | /api/health                     | Estado da API e do Cosmos DB     | ❌    |

✅ Requer JWT  |  👑 Requer role=admin

---

## Azure Functions

| Função          | Trigger              | Descrição                                       |
|-----------------|----------------------|-------------------------------------------------|
| UpdateRanking   | HTTP POST            | Recalcula avgRating e rankingPoints do utilizador |
| CleanupExpired  | Timer (diário 00:00) | Marca como "completed" eventos com data passada |

---

## Serviços Azure Utilizados

| Serviço                 | Uso no Projeto                              |
|-------------------------|---------------------------------------------|
| Azure App Service       | Hospedagem da API (Docker container)        |
| Azure Cosmos DB (NoSQL) | Base de dados: users, events, ratings, etc. |
| Azure Blob Storage      | Fotos de eventos e avatares dos utilizadores|
| Azure Functions         | Ranking automático + limpeza de eventos     |
| Azure Container Registry| Repositório da imagem Docker                |
| GitHub Actions          | CI/CD: testes → build → deploy automático  |
| Terraform               | Infraestrutura como Código (IaC)            |
