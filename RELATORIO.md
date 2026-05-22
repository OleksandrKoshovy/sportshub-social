# Relatório de Projeto — SportsHub Social
**Unidade Curricular:** Computação em Nuvem e Big Data  
**Grupo:** CNCB  
**Data:** Maio 2026

---

## 1. Descrição do Projeto

**SportsHub Social** é uma plataforma social para organização e participação em eventos desportivos. Os utilizadores podem criar eventos (futebol, basquetebol, ténis, etc.), inscrever-se como participantes, avaliar outros participantes após os eventos e subir num ranking global.

### Funcionalidades principais
- Registo/login com JWT
- Criação e gestão de eventos desportivos com fotos
- Inscrição em eventos e lista de participantes
- Sistema de avaliação por estrelas (1–5) com comentários
- Ranking global baseado em média de avaliações e eventos participados
- Painel de administração (gerir utilizadores e eventos)
- Limpeza automática de eventos expirados via Azure Functions

---

## 2. Arquitetura na Nuvem

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTE                              │
│   Browser → https://sportshubstorage.z28.web.core.windows.net │
│                (Azure Blob Storage — Static Website)        │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS (VITE_API_URL)
┌───────────────────────▼─────────────────────────────────────┐
│              AZURE APP SERVICE (B1 Linux)                   │
│        https://sportshub-api.azurewebsites.net              │
│     Docker Container: sportshubregistry.azurecr.io          │
│                  Node.js 20 / Express                       │
└──────┬─────────────────┬───────────────────────┬────────────┘
       │                 │                       │
┌──────▼──────┐  ┌───────▼────────┐  ┌──────────▼──────────┐
│ Cosmos DB   │  │  Blob Storage  │  │  Azure Functions    │
│ (NoSQL)     │  │  (Ficheiros)   │  │  (Serverless)       │
│ 6 containers│  │ event-photos   │  │ CleanupExpired      │
│ users       │  │ avatars        │  │ UpdateRanking       │
│ events      │  │ $web (frontend)│  │ ProcessRating       │
│ ratings     │  └────────────────┘  └─────────────────────┘
│ participat. │
│ sports      │  ┌────────────────┐
└─────────────┘  │  ACR (Docker) │
                 │ sportshubregist│
                 └────────────────┘
```

---

## 3. Serviços Azure Utilizados

### 3.1 Azure Cosmos DB (NoSQL)
- **Plano:** Serverless / 400 RU/s por container
- **Motivo:** Base de dados NoSQL totalmente gerida, escalável, com suporte a Change Feed (usado pelas Azure Functions)
- **Containers:** `users`, `events`, `ratings`, `participations`, `event-photos`, `sports`
- **Partition keys:** `/id` (users, events) e `/eventId` (ratings, participations)

### 3.2 Azure Blob Storage
- **Conta:** `sportshubstorage` (LRS, Standard)
- **Containers:** `event-photos` (público), `avatars` (público), `$web` (site estático)
- **Static Website:** Frontend React/Vite servido diretamente do Blob Storage como alternativa ao Static Web Apps (bloqueado pela subscrição de estudante)

### 3.3 Azure App Service (B1 Linux)
- **Runtime:** Docker Container via Azure Container Registry
- **Imagem:** `sportshubregistry.azurecr.io/sportshub-api:latest`
- **Autenticação ACR:** Managed Identity com role `AcrPull`
- **Backend:** Node.js 20 + Express com routes para auth, eventos, utilizadores, ratings, admin, upload

### 3.4 Azure Container Registry (ACR)
- **Nome:** `sportshubregistry`
- **SKU:** Basic
- **Uso:** Armazenamento da imagem Docker do backend; builds via `az acr build` (sem Docker local)

### 3.5 Azure Functions (Consumption Plan)
Três funções serverless em Node.js 20:

| Função | Trigger | Descrição |
|--------|---------|-----------|
| **CleanupExpired** | Timer (diário 00:00 UTC) | Marca eventos com `dateTime` no passado como `status="completed"` |
| **UpdateRanking** | HTTP POST | Recalcula `avgRating` e `rankingPoints` de um utilizador específico |
| **ProcessRating** | Cosmos DB Change Feed | Ao inserir nova avaliação, atualiza automaticamente o ranking |

**Fórmula de ranking:**
```
rankingPoints = round(avgRating × 20) + eventsCount × 5
```

### 3.6 GitHub Actions (CI/CD)
Pipeline com 5 jobs em `.github/workflows/deploy.yml`:

```
push → master
        │
        ├─► [Job 1] Lint & Testes (ESLint + Jest)
        │
        ├─► [Job 2] Build & Push Docker → ACR  (depende de Job 1)
        │
        ├─► [Job 3] Deploy App Service          (depende de Job 2)
        │
        ├─► [Job 4] Deploy Azure Functions      (depende de Job 1)
        │
        └─► [Job 5] Build & Deploy Frontend     (depende de Job 1)
```

**Secrets necessários:** `AZURE_CREDENTIALS`, `ACR_USERNAME`, `ACR_PASSWORD`

### 3.7 Terraform (Infrastructure as Code)
Ficheiro `infrastructure/terraform/main.tf` define toda a infraestrutura:
- Resource Group
- Cosmos DB Account + Database + 6 Containers
- Storage Account + Containers de Blobs
- Container Registry
- App Service Plan + Linux Web App (Docker)
- Function App (Consumption) + Storage dedicado

**Estado remoto:** guardado em Azure Blob Storage (`sportshubtfstate` storage account).

---

## 4. Docker

O `backend/Dockerfile` usa **multi-stage build** para minimizar o tamanho final:

```dockerfile
# Stage 1: instalar dependências
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/

# Stage 2: imagem de runtime (sem ferramentas de build)
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src          ./src
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
EXPOSE 3000
CMD ["node", "src/app.js"]
```

**Destaques:**
- Imagem final ~80MB (apenas runtime, sem devDependencies)
- Utilizador não-root por segurança
- Build feito diretamente no Azure via `az acr build` (sem Docker instalado localmente)

---

## 5. Estimativa de Custos Mensais (Azure)

Baseado em utilização leve (projeto académico / demonstração).

| Serviço | Plano/SKU | Custo estimado/mês |
|---------|-----------|-------------------|
| App Service | B1 Linux | ~€12,50 |
| Cosmos DB | 400 RU/s × 6 containers | ~€23,00 |
| Blob Storage | Standard LRS, ~5 GB | ~€0,10 |
| Container Registry | Basic | ~€4,50 |
| Azure Functions | Consumption (< 1M exec.) | ~€0,00 (free tier) |
| Bandwidth egress | ~1 GB/mês | ~€0,07 |
| **Total estimado** | | **~€40/mês** |

> **Nota:** Com tráfego real (produção), o Cosmos DB seria o maior custo. Migrar para throughput partilhado ou serverless mode reduziria para ~€5–10/mês em carga baixa.

---

## 6. Alternativas Europeias ao Azure

A seguinte tabela compara serviços equivalentes de fornecedores europeus com data centers dentro da UE, relevante para conformidade com RGPD.

### 6.1 OVHcloud (França 🇫🇷)

| Azure | OVHcloud Equivalente | Diferença |
|-------|---------------------|-----------|
| App Service | Managed Kubernetes (MKS) / Public Cloud Instances | Requer mais configuração manual |
| Cosmos DB | Managed MongoDB (DBaaS) | MongoDB API, menos integração nativa |
| Blob Storage | Object Storage (S3-compatible) | Compatível com SDK S3 |
| Container Registry | Managed Private Registry | Integrado no MKS |
| Azure Functions | Serverless Functions (beta) | Menos maturidade |
| **Custo equiv.** | ~€25–35/mês | Mais barato, menos serviços geridos |

**Prós:** Preços mais competitivos, data centers em França/Alemanha, RGPD nativo  
**Contras:** Ecossistema menos maduro, menos integrações nativas, suporte mais limitado

### 6.2 Hetzner Cloud (Alemanha 🇩🇪)

| Azure | Hetzner Equivalente | Diferença |
|-------|---------------------|-----------|
| App Service | CX22 VPS + Docker manual | Sem PaaS — gestão manual total |
| Cosmos DB | VPS com MongoDB self-hosted | Sem backups automáticos geridos |
| Blob Storage | Hetzner Object Storage (S3) | S3-compatible, muito barato |
| Container Registry | Sem equivalente nativo | Usar Docker Hub ou self-hosted |
| Azure Functions | Sem equivalente | Usar OpenFaaS self-hosted ou cron |
| **Custo equiv.** | ~€8–15/mês | Muito mais barato, tudo manual |

**Prós:** Preço extremamente competitivo, boa performance em Europa Central  
**Contras:** Apenas IaaS — sem PaaS, sem Functions geridas, sem Cosmos DB. Requer DevOps dedicado.

### 6.3 Scaleway (França 🇫🇷)

| Azure | Scaleway Equivalente | Diferença |
|-------|---------------------|-----------|
| App Service | Serverless Containers | Similar ao Azure Container Apps |
| Cosmos DB | Serverless PostgreSQL / MongoDB | Relacional ou NoSQL gerido |
| Blob Storage | Object Storage (S3-compatible) | €0,01/GB — muito barato |
| Container Registry | Container Registry (gratuito) | 100% gratuito |
| Azure Functions | Serverless Functions (Node/Python) | Menos triggers disponíveis |
| **Custo equiv.** | ~€15–25/mês | Bom equilíbrio custo/gestão |

**Prós:** PaaS europeu com Serverless, preços baixos, 100% RGPD  
**Contras:** Menos serviços que Azure, alguns ainda em beta, triggers de Functions limitados

### 6.4 Tabela Comparativa Final

| Critério | Azure | OVHcloud | Hetzner | Scaleway |
|---------|-------|----------|---------|----------|
| Custo/mês (equiv.) | ~€40 | ~€30 | ~€12 | ~€20 |
| PaaS maturo | ✅ | Parcial | ❌ | ✅ |
| Serverless Functions | ✅ | Beta | ❌ | ✅ |
| NoSQL gerido | ✅ | ✅ | ❌ | Parcial |
| Docker/Container | ✅ | ✅ | ✅ | ✅ |
| CI/CD nativo | ✅ | ✅ | ❌ | ✅ |
| RGPD / UE | ✅ | ✅ | ✅ | ✅ |
| Documentação | ✅✅✅ | ✅✅ | ✅✅ | ✅✅ |

**Conclusão:** Para um projeto com a arquitetura do SportsHub (Functions, NoSQL, Containers, CI/CD integrado), o **Azure** e o **Scaleway** são as opções mais adequadas. O **Hetzner** é a mais económica mas exige gestão manual completa. O **OVHcloud** é um bom compromisso para equipas com alguma experiência em cloud.

---

## 7. Segurança

- **JWT** com expiração de 7 dias para autenticação
- **bcryptjs** (12 rounds de salt) para hash de passwords
- **Helmet.js** para headers HTTP de segurança
- **CORS** restrito a origens conhecidas (frontend URL + localhost)
- **Utilizador não-root** no container Docker
- **Managed Identity** para autenticação ACR (sem passwords em config)
- **Azure Key Vault** (recomendado para produção — não implementado nesta fase)

---

## 8. Conclusão

O projeto SportsHub Social demonstra a utilização prática dos principais serviços de cloud Azure num contexto real: base de dados NoSQL gerida (Cosmos DB), armazenamento de ficheiros (Blob Storage), contentor Docker gerido (App Service + ACR), funções serverless event-driven (Azure Functions com Change Feed), automação de infraestrutura (Terraform) e entrega contínua (GitHub Actions CI/CD).

A plataforma está em produção em:
- **API:** https://sportshub-api.azurewebsites.net
- **Frontend:** https://sportshubstorage.z28.web.core.windows.net
