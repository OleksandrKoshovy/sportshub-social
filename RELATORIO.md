# Relatório de Projeto — SportsHub Social
**Unidade Curricular:** Computação em Nuvem e Big Data  
**Autores:** Bernardo Ávila · Gabriel Inácio · Oleksandr Koshovyi  
**Grupo:** CNCB  
**Data:** Maio 2026

---

## 1. Descrição do Projeto

**SportsHub Social** é uma plataforma social para organização e participação em eventos desportivos amadores. Os utilizadores podem criar eventos (futebol, basquetebol, ténis, natação, etc.), inscrever-se como participantes, avaliar outros participantes após os eventos e competir num ranking global baseado na reputação desportiva.

### Funcionalidades implementadas
- Registo e login com autenticação JWT (tokens com expiração de 7 dias)
- Criação e gestão de eventos desportivos com upload de fotos
- Inscrição e cancelamento em eventos com controlo de vagas
- Sistema de avaliação por estrelas (1–5) com comentários, após conclusão do evento
- Ranking global com pontuação baseada em avaliações e participações
- Página "Os Meus Eventos" com separadores: a decorrer, criados por mim, histórico
- Painel de administração para gerir utilizadores e eventos
- Limpeza automática de eventos expirados via Azure Functions
- Atualização automática do ranking via Cosmos DB Change Feed

---

## 2. Arquitetura na Nuvem

```
┌──────────────────────────────────────────────────────────────────┐
│                          CLIENTE (Browser)                       │
│   https://sportshubstorage.z28.web.core.windows.net             │
│              (Azure Blob Storage — Static Website)              │
└──────────────────────────┬───────────────────────────────────────┘
                           │ HTTPS REST
┌──────────────────────────▼───────────────────────────────────────┐
│                  AZURE APP SERVICE (B1 Linux)                    │
│          https://sportshub-api.azurewebsites.net                │
│      Docker: sportshubregistry.azurecr.io/sportshub-api:latest  │
│                    Node.js 20 / Express                         │
└──────┬──────────────────┬──────────────────────┬────────────────┘
       │                  │                      │
┌──────▼──────┐   ┌───────▼────────┐   ┌────────▼────────────────┐
│ Cosmos DB   │   │  Blob Storage  │   │   Azure Functions       │
│ (NoSQL)     │   │                │   │   (Consumption Plan)    │
│ • users     │   │ • event-photos │   │                         │
│ • events    │   │ • avatars      │◄──┤ CleanupExpired (timer)  │
│ • ratings   │   │ • $web         │   │ UpdateRanking (HTTP)    │
│ • particip. │   │  (frontend)    │   │ ProcessRating (feed)    │
│ • sports    │   └────────────────┘   └─────────────────────────┘
│ • leases    │
└──────┬──────┘
       │ Change Feed
       └──────────────────► ProcessRating Function

┌─────────────────────────────────────────────────────────────────┐
│                  AZURE CONTAINER REGISTRY                       │
│            sportshubregistry.azurecr.io                        │
│               sportshub-api:latest                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                 GITHUB ACTIONS (CI/CD)                         │
│  push → master → Lint → Tests → Docker Build → Deploy ×3      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Serviços Azure Utilizados

### 3.1 Azure Cosmos DB (NoSQL)

- **Plano:** 400 RU/s por container (throughput dedicado)
- **Região:** France Central
- **Containers e partition keys:**

| Container | Partition Key | Conteúdo |
|-----------|--------------|----------|
| `users` | `/id` | Perfis, credenciais, métricas de ranking |
| `events` | `/id` | Eventos desportivos |
| `ratings` | `/eventId` | Avaliações entre participantes |
| `participations` | `/eventId` | Inscrições em eventos |
| `event-photos` | `/eventId` | Metadados das fotos |
| `sports` | `/id` | Tipos de desporto disponíveis |
| `leases` | `/id` | Criado automaticamente pelo Change Feed |

- **Change Feed:** O container `ratings` alimenta a função `ProcessRating` que recalcula o ranking em tempo real sempre que uma nova avaliação é inserida.
- **Motivo de escolha:** Escalabilidade horizontal automática, suporte a Change Feed, SDK oficial para Node.js, modelo serverless pay-per-use.

### 3.2 Azure Blob Storage

- **Conta:** `sportshubstorage` (Standard LRS, região France Central)
- **Containers:**
  - `event-photos` (acesso público blob) — fotos dos eventos
  - `avatars` (acesso público blob) — fotos de perfil
  - `$web` (static website) — frontend React/Vite em produção
- **Static Website:** Funcionalidade de hosting estático activada na conta de armazenamento, servindo a aplicação React em `https://sportshubstorage.z28.web.core.windows.net`. Esta abordagem foi adoptada como alternativa ao Azure Static Web Apps, que estava bloqueado pela subscrição de estudante.
- **CORS:** Configurado para permitir uploads do domínio do frontend e localhost.

### 3.3 Azure App Service (B1 Linux)

- **Plano:** B1 (1 vCPU, 1.75 GB RAM) — plano pago mais económico com suporte a Docker
- **Runtime:** Container Docker (`DOCKER|sportshubregistry.azurecr.io/sportshub-api:latest`)
- **Autenticação ACR:** Managed Identity com role `AcrPull` (sem passwords armazenadas)
- **Always On:** Activado (evita cold starts no plano B1)
- **URL:** `https://sportshub-api.azurewebsites.net`
- **Variáveis de ambiente configuradas:** `COSMOS_CONNECTION_STRING`, `BLOB_CONNECTION_STRING`, `JWT_SECRET`, `FRONTEND_URL`, `NODE_ENV=production`

### 3.4 Azure Container Registry (ACR)

- **Nome:** `sportshubregistry` (SKU Basic)
- **Imagem:** `sportshub-api:latest`
- **Build remoto:** Utilizado `az acr build` para construir a imagem directamente no Azure sem necessitar de Docker instalado localmente.
- **CI/CD:** O pipeline GitHub Actions faz login no ACR com `ACR_USERNAME` / `ACR_PASSWORD` e usa `docker/build-push-action` para construir e publicar a nova imagem a cada push para `master`.

### 3.5 Azure Functions (Consumption Plan)

Três funções serverless em Node.js 20, deployadas em `sportshub-functions.azurewebsites.net`:

| Função | Trigger | Schedule/Evento | Descrição |
|--------|---------|-----------------|-----------|
| **CleanupExpired** | TimerTrigger | `0 0 0 * * *` (diário 00:00 UTC) | Pesquisa eventos com `status="active"` e `dateTime` no passado; altera para `status="completed"` |
| **UpdateRanking** | HttpTrigger (POST) | Manual / chamada da API | Recalcula `avgRating` e `rankingPoints` para um `ratedUserId` específico |
| **ProcessRating** | CosmosDBTrigger | Change Feed do container `ratings` | Ao inserir nova avaliação, recalcula automaticamente o ranking do utilizador avaliado |

**Fórmula de ranking:**
```
avgRating     = média de todas as avaliações recebidas (arredondado a 1 decimal)
rankingPoints = round(avgRating × 20) + eventsCount × 5
```

**Plano Consumption:** Sem custo fixo mensal — cobra apenas por execução (primeiras 1 milhão gratuitas/mês).

### 3.6 GitHub Actions — CI/CD Pipeline

Pipeline definido em `.github/workflows/deploy.yml`, activado a cada push para `master` ou `main`.

```
push → master
        │
        ├─► [Job 1] Lint & Testes       — ESLint + Jest (7 testes unitários)
        │               ↓ (se passar)
        ├─► [Job 2] Build Docker         — docker/build-push-action → ACR
        │               ↓ (se passar)
        ├─► [Job 3] Deploy App Service   — azure/webapps-deploy@v3 + health check
        │
        ├─► [Job 4] Deploy Functions     — Azure/functions-action@v1
        │
        └─► [Job 5] Deploy Frontend      — npm build + az storage blob upload-batch
```

**Estado actual:** todos os 5 jobs a verde ✅  
**Repositório:** https://github.com/OleksandrKoshovy/sportshub-social  
**Secrets configurados:** `AZURE_CREDENTIALS` (Service Principal), `ACR_USERNAME`, `ACR_PASSWORD`

### 3.7 Terraform — Infraestrutura como Código

O ficheiro `infrastructure/terraform/main.tf` descreve toda a infraestrutura do projeto como código, permitindo recriar o ambiente de forma determinista.

**Recursos definidos:**
- `azurerm_resource_group` — Resource Group `sportshub-rg`
- `azurerm_cosmosdb_account` + `azurerm_cosmosdb_sql_database` + `azurerm_cosmosdb_sql_container` (× 6)
- `azurerm_storage_account` + `azurerm_storage_container` (× 3)
- `azurerm_container_registry`
- `azurerm_service_plan` + `azurerm_linux_web_app` (App Service com Docker)
- `azurerm_service_plan` (Consumption) + `azurerm_linux_function_app`

**Estado remoto:** configurado para guardar o `terraform.tfstate` num Azure Blob Storage dedicado (`sportshubtfstate`), garantindo consistência em equipa.

**Para aplicar:**
```bash
cd infrastructure/terraform
terraform init
terraform plan -var="jwt_secret=CHAVE_SECRETA"
terraform apply -var="jwt_secret=CHAVE_SECRETA"
```

---

## 4. Docker — Multi-Stage Build

O `backend/Dockerfile` usa construção em duas fases para reduzir o tamanho final da imagem:

```dockerfile
# Fase 1 — instalar dependências de produção
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/

# Fase 2 — imagem de runtime mínima
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

**Resultados:**
- Imagem final **~85 MB** (apenas runtime, sem devDependencies nem ferramentas de build)
- Utilizador não-root (`appuser`) por segurança
- Build construído directamente no Azure via `az acr build` sem Docker instalado localmente
- Cada push para `master` reconstrói e republica a imagem automaticamente via CI/CD

---

## 5. Testes e Qualidade de Código

### Testes unitários (Jest + Supertest)

7 testes em `backend/__tests__/health.test.js`:

| Teste | Resultado |
|-------|-----------|
| GET /api/health retorna 200 com status ok | ✅ |
| Validação: score < 1 é rejeitado | ✅ |
| Validação: score > 5 é rejeitado | ✅ |
| Validação: score válido (1–5) é aceite | ✅ |
| POST /api/auth/register sem body retorna 400 | ✅ |
| POST /api/auth/register com password curta retorna 400 | ✅ |
| POST /api/auth/register com dados válidos retorna 201 | ✅ |

### Lint (ESLint)

Configuração em `backend/.eslintrc.json` — regras `eslint:recommended` adaptadas para Node.js. Executado automaticamente no Job 1 do CI/CD antes de qualquer deploy.

---

## 6. Estimativa de Custos Mensais (Azure)

Baseado em utilização leve (projeto académico / demonstração com tráfego reduzido).

| Serviço | Plano/SKU | Custo estimado/mês |
|---------|-----------|-------------------|
| App Service | B1 Linux (sempre ligado) | ~€12,50 |
| Cosmos DB | 400 RU/s × 6 containers | ~€23,00 |
| Blob Storage | Standard LRS, ~5 GB + transferência | ~€0,15 |
| Container Registry | Basic | ~€4,50 |
| Azure Functions | Consumption (< 1M execuções) | ~€0,00 (free tier) |
| Bandwidth egress | ~1 GB/mês | ~€0,07 |
| **Total estimado** | | **~€40/mês** |

> **Optimização possível:** Migrar o Cosmos DB para throughput serverless ou partilhado reduziria para ~€5–10/mês em carga baixa. O App Service pode ser downgrade para F1 (gratuito) em período sem tráfego, desactivando "Always On".

---

## 7. Alternativas Europeias ao Azure

A seguinte tabela compara serviços equivalentes de fornecedores com data centers dentro da UE, relevante para conformidade com o RGPD.

### 7.1 OVHcloud (França 🇫🇷)

| Serviço Azure | Equivalente OVHcloud | Diferença Principal |
|---------------|---------------------|---------------------|
| App Service | Public Cloud Instances + Docker | Sem PaaS nativo — requer configuração manual |
| Cosmos DB | Managed MongoDB (DBaaS) | API MongoDB, sem Change Feed nativo |
| Blob Storage | Object Storage (S3-compatible) | Compatível com SDK S3, não com SDK Azure |
| Container Registry | Managed Registry (integrado MKS) | Requer Kubernetes para usar |
| Azure Functions | Serverless Functions (beta) | Triggers limitados, menos maturidade |
| **Custo estimado** | **~€25–35/mês** | Mais barato, menos serviços geridos |

**Vantagens:** Preços competitivos, data centers em França/Alemanha/Portugal, empresa europeia  
**Desvantagens:** Ecossistema menos maduro, suporte técnico mais limitado, alguns serviços ainda em beta

### 7.2 Hetzner Cloud (Alemanha 🇩🇪)

| Serviço Azure | Equivalente Hetzner | Diferença Principal |
|---------------|---------------------|---------------------|
| App Service | VPS CX22 + Docker Compose | IaaS puro — gestão manual total |
| Cosmos DB | MongoDB self-hosted em VPS | Sem backups automáticos, sem Change Feed |
| Blob Storage | Hetzner Object Storage | S3-compatible, muito económico (€0,006/GB) |
| Container Registry | Sem nativo | Usar Docker Hub ou Gitea self-hosted |
| Azure Functions | Sem nativo | OpenFaaS, cron jobs, ou equivalente self-hosted |
| **Custo estimado** | **~€8–15/mês** | Muito mais barato, tudo manual |

**Vantagens:** Preço mais baixo do mercado europeu, excelente performance em Europa Central  
**Desvantagens:** Apenas IaaS — sem PaaS, sem Functions geridas, sem NoSQL gerido. Requer DevOps dedicado.

### 7.3 Scaleway (França 🇫🇷)

| Serviço Azure | Equivalente Scaleway | Diferença Principal |
|---------------|---------------------|---------------------|
| App Service | Serverless Containers | Similar ao Azure Container Apps |
| Cosmos DB | Serverless PostgreSQL / Managed MongoDB | NoSQL gerido disponível |
| Blob Storage | Object Storage | €0,01/GB — muito competitivo |
| Container Registry | Container Registry (gratuito) | Sem custo adicional |
| Azure Functions | Serverless Functions (Node.js/Python) | Menos triggers, sem Change Feed |
| **Custo estimado** | **~€15–25/mês** | Bom equilíbrio custo/gestão |

**Vantagens:** PaaS europeu moderno, preços baixos, filosofia open-source, 100% RGPD  
**Desvantagens:** Menos serviços que Azure, alguns ainda em beta, triggers de Functions limitados

### 7.4 Tabela Comparativa Final

| Critério | Azure | OVHcloud | Hetzner | Scaleway |
|----------|-------|----------|---------|----------|
| Custo/mês (equiv.) | ~€40 | ~€30 | ~€12 | ~€20 |
| PaaS maduro | ✅ | Parcial | ❌ | ✅ |
| Serverless Functions | ✅ | Beta | ❌ | ✅ |
| NoSQL gerido + Change Feed | ✅ | Parcial | ❌ | Parcial |
| Docker/Containers geridos | ✅ | ✅ | ✅ | ✅ |
| CI/CD integrado | ✅ | ✅ | ❌ | ✅ |
| RGPD / Data Centers EU | ✅ | ✅ | ✅ | ✅ |
| Documentação / Comunidade | ✅✅✅ | ✅✅ | ✅✅ | ✅✅ |
| Adequado a este projeto | ✅✅✅ | ✅✅ | ✅ | ✅✅ |

**Conclusão:** Para a arquitectura do SportsHub (Functions event-driven, NoSQL com Change Feed, Containers, CI/CD integrado), o **Azure** oferece a melhor integração nativa. O **Scaleway** seria a alternativa europeia mais próxima em termos de PaaS. O **Hetzner** é a opção mais económica mas exigiria reimplementar muitas funcionalidades manualmente.

---

## 8. Segurança

| Medida | Implementação |
|--------|--------------|
| Autenticação | JWT (jsonwebtoken) com expiração de 7 dias |
| Hash de passwords | bcryptjs com 12 rounds de salt |
| Headers HTTP | Helmet.js (HSTS, X-Frame-Options, CSP, etc.) |
| CORS | Lista branca de origens (`FRONTEND_URL` + localhost) |
| Container Docker | Utilizador não-root (`appuser`) |
| Autenticação ACR | Managed Identity com role `AcrPull` (sem passwords) |
| Variáveis sensíveis | Configuradas como App Settings no Azure (não no código) |
| Secrets CI/CD | GitHub Encrypted Secrets (nunca expostos em logs) |

---

## 9. Estado de Produção

| Componente | URL / Estado |
|------------|-------------|
| **Frontend** | https://sportshubstorage.z28.web.core.windows.net ✅ |
| **API** | https://sportshub-api.azurewebsites.net/api/health ✅ |
| **Azure Functions** | https://sportshub-functions.azurewebsites.net ✅ |
| **Pipeline CI/CD** | https://github.com/OleksandrKoshovy/sportshub-social/actions ✅ (5/5 jobs) |
| **Docker Image** | sportshubregistry.azurecr.io/sportshub-api:latest ✅ |

---

## 10. Conclusão

O projeto SportsHub Social demonstra a aplicação prática de uma arquitectura cloud moderna no Azure:

- **Azure Cosmos DB** como base de dados NoSQL totalmente gerida, com Change Feed para processamento reactivo de eventos
- **Azure Blob Storage** para armazenamento de ficheiros e hosting do frontend estático
- **Docker + ACR** para containerização e distribuição da aplicação backend
- **Azure Functions** para lógica serverless event-driven (timer, HTTP e Change Feed)
- **Terraform** para definição declarativa de toda a infraestrutura como código
- **GitHub Actions** para integração e entrega contínuas com 5 jobs automáticos

A plataforma está completamente operacional em produção, com deploy automático a cada push para o repositório.
