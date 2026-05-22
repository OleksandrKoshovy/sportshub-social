# Relatório de Projeto — SportsHub Social

**Escola Superior de Tecnologia**  
**Instituto Politécnico de Castelo Branco**  
**Licenciatura em Engenharia Informática**

---

**Unidade Curricular:** Computação em Nuvem e Big Data  
**Grupo:** CNCB  
**Autores:** Bernardo Ávila · Gabriel Inácio · Oleksandr Koshovyi  
**Data:** Maio de 2026

---

## Resumo

O SportsHub Social é uma plataforma web social para organização e participação em eventos desportivos amadores, desenvolvida no âmbito da unidade curricular de Computação em Nuvem e Big Data. A solução foi implementada integralmente na plataforma Microsoft Azure, utilizando Azure Cosmos DB como base de dados NoSQL, Azure Blob Storage para armazenamento de ficheiros e hosting do frontend estático, Azure App Service para execução do backend em container Docker, Azure Functions para processamento serverless event-driven, e Azure Container Registry para gestão das imagens Docker. A infraestrutura é definida como código através de Terraform, e o processo de integração e entrega contínuas é automatizado com GitHub Actions. A aplicação suporta registo de utilizadores, criação e gestão de eventos desportivos, sistema de avaliações por estrelas e ranking global. A plataforma encontra-se completamente operacional em produção, com todas as funcionalidades planeadas implementadas e todos os pipelines de CI/CD a verde.

**Palavras-chave:** computação em nuvem, Azure, NoSQL, Docker, serverless, Terraform, CI/CD

---

## Abstract

SportsHub Social is a social web platform for organizing and participating in amateur sports events, developed within the Cloud Computing and Big Data course unit. The solution was fully implemented on Microsoft Azure, using Azure Cosmos DB as the NoSQL database, Azure Blob Storage for file storage and static frontend hosting, Azure App Service for running the backend in a Docker container, Azure Functions for event-driven serverless processing, and Azure Container Registry for Docker image management. Infrastructure is defined as code using Terraform, and continuous integration and delivery is automated with GitHub Actions. The application supports user registration, sports event creation and management, a star-based rating system, and a global ranking. The platform is fully operational in production, with all planned features implemented and all CI/CD pipelines passing.

**Keywords:** cloud computing, Azure, NoSQL, Docker, serverless, Terraform, CI/CD

---

## Índice

1. [Introdução](#1-introdução)
2. [Planeamento e Calendarização](#2-planeamento-e-calendarização)
3. [Descrição do Projeto](#3-descrição-do-projeto)
4. [Arquitetura na Nuvem](#4-arquitetura-na-nuvem)
5. [Serviços Azure Utilizados](#5-serviços-azure-utilizados)
6. [Docker — Multi-Stage Build](#6-docker--multi-stage-build)
7. [Testes e Qualidade de Código](#7-testes-e-qualidade-de-código)
8. [Estimativa de Custos Mensais](#8-estimativa-de-custos-mensais-azure)
9. [Alternativas Europeias ao Azure](#9-alternativas-europeias-ao-azure)
10. [Segurança](#10-segurança)
11. [Estado de Produção](#11-estado-de-produção)
12. [Ferramentas de Inteligência Artificial](#12-ferramentas-de-inteligência-artificial)
13. [Conclusão](#13-conclusão)

[Referências](#referências)

---

## 1. Introdução

A computação em nuvem estabeleceu-se como um paradigma fundamental no desenvolvimento de aplicações modernas, permitindo criar soluções escaláveis e resilientes sem necessidade de gerir infraestrutura física. Plataformas como Microsoft Azure oferecem um conjunto alargado de serviços geridos — bases de dados NoSQL, armazenamento de objetos, computação serverless e orquestração de containers — que reduzem significativamente a complexidade operacional e os custos de entrada para novos projetos.

O presente relatório descreve o desenvolvimento do **SportsHub Social**, uma plataforma web social para organização e participação em eventos desportivos amadores. O projeto foi desenvolvido no âmbito da unidade curricular de Computação em Nuvem e Big Data, com o objetivo de demonstrar a aplicação prática dos principais serviços Azure, incluindo bases de dados NoSQL, armazenamento de objetos, computação serverless, containerização e automatização de infraestrutura.

A solução implementa uma arquitetura cloud moderna onde o frontend React é servido estaticamente a partir do Azure Blob Storage [2], o backend Node.js/Express é executado em container Docker [6] no Azure App Service [3], e a lógica event-driven é processada por Azure Functions [4]. Toda a infraestrutura é definida como código com Terraform [7], e o pipeline CI/CD com GitHub Actions [13] automatiza os deploys a cada alteração no repositório.

O relatório está organizado da seguinte forma: a Secção 2 apresenta o planeamento e a divisão de tarefas; a Secção 3 descreve as funcionalidades da aplicação; a Secção 4 apresenta a arquitetura da solução; a Secção 5 detalha cada serviço Azure utilizado; as Secções 6 e 7 abordam a containerização e os testes; a Secção 8 estima os custos mensais; a Secção 9 analisa alternativas europeias ao Azure; a Secção 10 descreve as medidas de segurança; a Secção 11 apresenta o estado de produção; a Secção 12 declara as ferramentas de IA utilizadas; e a Secção 13 apresenta as conclusões.

---

## 2. Planeamento e Calendarização

O projeto foi desenvolvido ao longo de quatro meses, entre fevereiro e maio de 2026, com três momentos de avaliação definidos pelo enunciado da unidade curricular: a primeira entrega a 27 de fevereiro, a segunda a 17 de abril, e a entrega final a 22 de maio.

### 2.1 Divisão de Tarefas

| Membro | Responsabilidades Principais |
|--------|------------------------------|
| Bernardo Ávila | Frontend React/Vite, rotas backend (auth, eventos), integração API-frontend |
| Gabriel Inácio | Azure Functions, sistema de avaliações e ranking, painel de administração, testes Jest |
| Oleksandr Koshovyi | Docker, Azure Container Registry, CI/CD GitHub Actions, Terraform, deploy e infraestrutura |

### 2.2 Diagrama de Gantt

| # | Tarefa | Responsável | 1–15 Fev | 16–28 Fev | 1–15 Mar | 16–31 Mar | 1–15 Abr | 16–30 Abr | 1–15 Mai | 16–22 Mai |
|---|--------|-------------|:--------:|:---------:|:--------:|:---------:|:--------:|:---------:|:--------:|:---------:|
| T1 | Definição da ideia e arquitetura | Todos | ▓▓ | ▓▓ | | | | | | |
| T2 | Relatório — Avaliação #1 ① | Todos | ▓▓ | ▓▓ | | | | | | |
| T3 | Backend: setup + Cosmos DB + Autenticação | Bernardo, Oleksandr | | ▓▓ | ▓▓ | | | | | |
| T4 | Backend: eventos + participações | Bernardo, Gabriel | | | ▓▓ | ▓▓ | | | | |
| T5 | Sistema de avaliações e ranking | Gabriel, Oleksandr | | | | ▓▓ | ▓▓ | | | |
| T6 | Docker + ACR + CI/CD | Oleksandr | | | ▓▓ | ▓▓ | | | | |
| T7 | Azure Functions | Gabriel | | | | ▓▓ | ▓▓ | | | |
| T8 | Frontend React/Vite | Bernardo | | | | ▓▓ | ▓▓ | | | |
| T9 | Relatório — Avaliação #2 ② | Todos | | | | | ▓▓ | ▓▓ | | |
| T10 | Terraform (IaC) | Oleksandr | | | | | | ▓▓ | ▓▓ | |
| T11 | Integração, testes e qualidade | Todos | | | | | | ▓▓ | ▓▓ | |
| T12 | Deploy e validação em produção | Oleksandr, Bernardo | | | | | | | ▓▓ | ▓▓ |
| T13 | Relatório final — Avaliação #3 ③ | Todos | | | | | | | ▓▓ | ▓▓ |

> ① Entregue a 27 de Fevereiro &nbsp;·&nbsp; ② Entregue a 17 de Abril &nbsp;·&nbsp; ③ Entregue a 22 de Maio

---

## 3. Descrição do Projeto

**SportsHub Social** é uma plataforma social para organização e participação em eventos desportivos amadores. Os utilizadores podem criar eventos (futebol, basquetebol, ténis, natação, entre outros), inscrever-se como participantes, avaliar outros participantes após os eventos e competir num ranking global baseado na reputação desportiva.

### 3.1 Funcionalidades Implementadas

- **Acesso inicial:** landing page pública com apresentação da plataforma, eventos em destaque e acesso rápido a registo e login
- **Registo de utilizador:** formulário com nome de utilizador, nome completo, email, palavra-passe, cidade e seleção de desportos de interesse
- **Autenticação:** login por email e palavra-passe com emissão de token JWT [9] com validade de 7 dias; proteção de rotas via middleware
- **Feed de eventos:** listagem de eventos ativos com pesquisa por texto (nome ou local), filtros por modalidade desportiva e vagas disponíveis, e ordenação por data ou popularidade
- **Criação e gestão de eventos:** formulário com nome, modalidade, localização, data, hora, número máximo de participantes e descrição
- **Participação em eventos:** inscrição e cancelamento com controlo de vagas; organização automaticamente inscrito na criação
- **Upload de fotos:** partilha de fotografias de eventos armazenadas no Azure Blob Storage [2]
- **Perfil de utilizador:** consulta e edição de dados pessoais, avatar, eventos criados, participações e avaliações recebidas
- **Sistema de avaliações:** classificação de 1 a 5 estrelas com comentário opcional, disponível após conclusão do evento
- **Ranking global:** classificação de utilizadores baseada em `avgRating` e `eventsCount`, atualizada em tempo real via Cosmos DB Change Feed [1]
- **Painel de administração:** gestão de utilizadores (bloqueio/reativação) e eventos (cancelamento) por utilizadores com role `admin`
- **Automação serverless:** limpeza diária de eventos expirados e recálculo automático do ranking via Azure Functions [4]

---

## 4. Arquitetura na Nuvem

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

## 5. Serviços Azure Utilizados

### 5.1 Azure Cosmos DB (NoSQL)

O Azure Cosmos DB [1] é uma base de dados NoSQL totalmente gerida com suporte a múltiplos modelos de consistência e replicação global automática.

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
- **Motivo de escolha:** Escalabilidade horizontal automática, suporte nativo a Change Feed, SDK oficial para Node.js [8], modelo serverless pay-per-use.

### 5.2 Azure Blob Storage

O Azure Blob Storage [2] é utilizado para dois propósitos distintos na plataforma:

- **Conta:** `sportshubstorage` (Standard LRS, região France Central)
- **Containers:**
  - `event-photos` (acesso público blob) — fotos dos eventos
  - `avatars` (acesso público blob) — fotos de perfil
  - `$web` (static website) — frontend React/Vite [11, 12] em produção
- **Static Website:** Funcionalidade de hosting estático activada na conta de armazenamento, servindo a aplicação React em `https://sportshubstorage.z28.web.core.windows.net`. Esta abordagem foi adoptada como alternativa ao Azure Static Web Apps, que estava bloqueado pela subscrição de estudante.
- **CORS:** Configurado para permitir uploads do domínio do frontend e localhost.

### 5.3 Azure App Service (B1 Linux)

O Azure App Service [3] aloja o backend da API em container Docker [6].

- **Plano:** B1 (1 vCPU, 1.75 GB RAM) — plano pago mais económico com suporte a Docker
- **Runtime:** Container Docker (`DOCKER|sportshubregistry.azurecr.io/sportshub-api:latest`)
- **Autenticação ACR:** Managed Identity com role `AcrPull` (sem passwords armazenadas)
- **Always On:** Activado (evita cold starts no plano B1)
- **URL:** `https://sportshub-api.azurewebsites.net`
- **Variáveis de ambiente configuradas:** `COSMOS_CONNECTION_STRING`, `BLOB_CONNECTION_STRING`, `JWT_SECRET`, `FRONTEND_URL`, `NODE_ENV=production`

### 5.4 Azure Container Registry (ACR)

O Azure Container Registry [5] armazena e distribui as imagens Docker da aplicação.

- **Nome:** `sportshubregistry` (SKU Basic)
- **Imagem:** `sportshub-api:latest`
- **Build remoto:** Utilizado `az acr build` para construir a imagem directamente no Azure sem necessitar de Docker instalado localmente.
- **CI/CD:** O pipeline GitHub Actions [13] faz login no ACR com `ACR_USERNAME` / `ACR_PASSWORD` e usa `docker/build-push-action` para construir e publicar a nova imagem a cada push para `master`.

### 5.5 Azure Functions (Consumption Plan)

O Azure Functions [4] implementa três funções serverless em Node.js 20, deployadas em `sportshub-functions.azurewebsites.net`:

| Função | Trigger | Schedule/Evento | Descrição |
|--------|---------|-----------------|-----------|
| **CleanupExpired** | TimerTrigger | `0 0 0 * * *` (diário 00:00 UTC) | Pesquisa eventos com `status="active"` e `dateTime` no passado; altera para `status="completed"` e incrementa `eventsCount` dos participantes |
| **UpdateRanking** | HttpTrigger (POST) | Manual / chamada da API | Recalcula `avgRating` e `rankingPoints` para um `ratedUserId` específico |
| **ProcessRating** | CosmosDBTrigger | Change Feed do container `ratings` | Ao inserir nova avaliação, recalcula automaticamente o ranking do utilizador avaliado |

**Fórmula de ranking:**
```
avgRating     = média de todas as avaliações recebidas (arredondado a 1 decimal)
rankingPoints = round(avgRating × 20) + eventsCount × 5
```

**Plano Consumption:** Sem custo fixo mensal — cobra apenas por execução (primeiras 1 milhão gratuitas/mês).

### 5.6 GitHub Actions — CI/CD Pipeline

O pipeline de CI/CD [13] está definido em `.github/workflows/deploy.yml`, activado a cada push para `master`.

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

### 5.7 Terraform — Infraestrutura como Código

O Terraform [7] descreve toda a infraestrutura do projeto como código no ficheiro `infrastructure/terraform/main.tf`, permitindo recriar o ambiente de forma determinista.

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

## 6. Docker — Multi-Stage Build

O `backend/Dockerfile` utiliza construção em duas fases [6] para reduzir o tamanho final da imagem:

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

## 7. Testes e Qualidade de Código

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

Configuração em `backend/.eslintrc.json` — regras `eslint:recommended` adaptadas para Node.js [8]. Executado automaticamente no Job 1 do CI/CD antes de qualquer deploy.

---

## 8. Estimativa de Custos Mensais (Azure)

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

> **Optimização possível:** Migrar o Cosmos DB [1] para throughput serverless ou partilhado reduziria para ~€5–10/mês em carga baixa. O App Service [3] pode ser downgrade para F1 (gratuito) em período sem tráfego, desactivando "Always On".

---

## 9. Alternativas Europeias ao Azure

A seguinte tabela compara serviços equivalentes de fornecedores com data centers dentro da UE, relevante para conformidade com o Regulamento Geral sobre a Proteção de Dados (RGPD).

### 9.1 OVHcloud (França 🇫🇷)

A OVHcloud [14] é uma empresa europeia com data centers em França, Alemanha e Portugal.

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

### 9.2 Hetzner Cloud (Alemanha 🇩🇪)

A Hetzner [15] é conhecida pelos preços mais competitivos do mercado europeu de cloud.

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

### 9.3 Scaleway (França 🇫🇷)

A Scaleway [16] posiciona-se como a alternativa europeia mais próxima do Azure em termos de serviços PaaS.

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

### 9.4 Tabela Comparativa Final

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

**Conclusão:** Para a arquitectura do SportsHub (Functions event-driven, NoSQL com Change Feed, Containers, CI/CD integrado), o **Azure** oferece a melhor integração nativa. O **Scaleway** [16] seria a alternativa europeia mais próxima em termos de PaaS. O **Hetzner** [15] é a opção mais económica mas exigiria reimplementar muitas funcionalidades manualmente.

---

## 10. Segurança

As medidas de segurança implementadas seguem as recomendações do OWASP Top Ten [18]:

| Medida | Implementação |
|--------|--------------|
| Autenticação | JWT (jsonwebtoken) [9] com expiração de 7 dias |
| Hash de passwords | bcryptjs [10] com 12 rounds de salt |
| Headers HTTP | Helmet.js (HSTS, X-Frame-Options, CSP, etc.) |
| CORS | Lista branca de origens (`FRONTEND_URL` + localhost) |
| Container Docker | Utilizador não-root (`appuser`) [6] |
| Autenticação ACR | Managed Identity com role `AcrPull` (sem passwords) |
| Variáveis sensíveis | Configuradas como App Settings no Azure (não no código) |
| Secrets CI/CD | GitHub Encrypted Secrets (nunca expostos em logs) [13] |

---

## 11. Estado de Produção

| Componente | URL / Estado |
|------------|-------------|
| **Frontend** | https://sportshubstorage.z28.web.core.windows.net ✅ |
| **API** | https://sportshub-api.azurewebsites.net/api/health ✅ |
| **Azure Functions** | https://sportshub-functions.azurewebsites.net ✅ |
| **Pipeline CI/CD** | https://github.com/OleksandrKoshovy/sportshub-social/actions ✅ (5/5 jobs) |
| **Docker Image** | sportshubregistry.azurecr.io/sportshub-api:latest ✅ |

---

## 12. Ferramentas de Inteligência Artificial

No desenvolvimento do SportsHub Social foram utilizadas ferramentas de inteligência artificial generativa para apoio à implementação e elaboração do relatório, em conformidade com a política da unidade curricular que permite o uso de IA desde que devidamente declarado.

### Claude (Anthropic) [17]

O assistente Claude foi a principal ferramenta de IA utilizada ao longo do projeto, para os seguintes fins:

- **Geração e revisão de código:** implementação de rotas REST em Node.js/Express, componentes React, Azure Functions e configurações Terraform
- **Depuração:** identificação de erros em queries Cosmos DB, configurações de CORS e autenticação JWT
- **Infraestrutura:** apoio na configuração do pipeline GitHub Actions e nos ficheiros Terraform para os recursos Azure
- **Relatório:** apoio na estruturação e revisão do presente relatório

### GitHub Copilot

Utilizado no IDE para sugestões de código em tempo real, principalmente na criação de rotas API e componentes de interface.

> **Nota:** Em todos os casos, o código gerado por IA foi revisto, testado e validado pelos elementos do grupo antes de ser integrado no projeto. A responsabilidade pela correcta implementação é inteiramente dos autores.

---

## 13. Conclusão

O projeto SportsHub Social demonstra a aplicação prática de uma arquitetura cloud moderna na plataforma Azure, cumprindo todos os requisitos obrigatórios definidos no enunciado da unidade curricular:

- **Azure Cosmos DB** [1] como base de dados NoSQL totalmente gerida, com Change Feed para processamento reactivo de eventos em tempo real
- **Azure Blob Storage** [2] para armazenamento de ficheiros (fotos de eventos e avatares) e hosting do frontend estático
- **Docker** [6] + **Azure Container Registry** [5] para containerização e distribuição da aplicação backend, com imagem multi-stage de ~85 MB
- **Azure Functions** [4] para lógica serverless event-driven (timer, HTTP e Cosmos DB Change Feed)
- **Terraform** [7] para definição declarativa de toda a infraestrutura como código, com estado remoto em Azure Blob Storage
- **GitHub Actions** [13] para integração e entrega contínuas com 5 jobs automáticos (lint, testes, build Docker, deploy API, deploy frontend)

A plataforma está completamente operacional em produção, com deploy automático a cada push para o repositório. Todas as funcionalidades planeadas foram implementadas e todas as avaliações foram entregues nos prazos definidos.

Como trabalho futuro, identificam-se as seguintes melhorias possíveis: migração do Cosmos DB para throughput serverless para redução de custos; adição de notificações push para eventos próximos; e implementação de filtros geoespaciais para descoberta de eventos por proximidade geográfica.

---

## Referências

[1] Microsoft Corporation, "Introduction to Azure Cosmos DB," *Microsoft Learn*, 2024. [Online]. Disponível: https://learn.microsoft.com/en-us/azure/cosmos-db/introduction

[2] Microsoft Corporation, "Azure Blob Storage documentation," *Microsoft Learn*, 2024. [Online]. Disponível: https://learn.microsoft.com/en-us/azure/storage/blobs/

[3] Microsoft Corporation, "Azure App Service documentation," *Microsoft Learn*, 2024. [Online]. Disponível: https://learn.microsoft.com/en-us/azure/app-service/

[4] Microsoft Corporation, "Azure Functions documentation," *Microsoft Learn*, 2024. [Online]. Disponível: https://learn.microsoft.com/en-us/azure/azure-functions/

[5] Microsoft Corporation, "Azure Container Registry documentation," *Microsoft Learn*, 2024. [Online]. Disponível: https://learn.microsoft.com/en-us/azure/container-registry/

[6] Docker Inc., "Multi-stage builds," *Docker Documentation*, 2024. [Online]. Disponível: https://docs.docker.com/build/building/multi-stage/

[7] HashiCorp, "Azure Provider — Terraform Registry," *Terraform Documentation*, 2024. [Online]. Disponível: https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs

[8] OpenJS Foundation, "Node.js v20 Documentation," 2024. [Online]. Disponível: https://nodejs.org/docs/latest-v20.x/api/

[9] M. Jones, J. Bradley, e N. Sakimura, "JSON Web Token (JWT)," RFC 7519, *Internet Engineering Task Force*, maio 2015. [Online]. Disponível: https://datatracker.ietf.org/doc/html/rfc7519

[10] N. Provos e D. Mazières, "A Future-Adaptable Password Scheme," em *Proc. USENIX Annual Technical Conference*, Monterey, CA, EUA, jun. 1999, pp. 81–91.

[11] Meta Platforms, Inc., "React — The library for web and native user interfaces," *React Documentation*, 2024. [Online]. Disponível: https://react.dev/

[12] E. You *et al.*, "Vite — Next Generation Frontend Tooling," *Vite Documentation*, 2024. [Online]. Disponível: https://vitejs.dev/

[13] GitHub Inc., "GitHub Actions documentation," 2024. [Online]. Disponível: https://docs.github.com/en/actions

[14] OVHcloud, "Public Cloud," *OVHcloud*, 2024. [Online]. Disponível: https://www.ovhcloud.com/en/public-cloud/

[15] Hetzner Online GmbH, "Hetzner Cloud," 2024. [Online]. Disponível: https://www.hetzner.com/cloud

[16] Scaleway, "Scaleway Cloud Platform," 2024. [Online]. Disponível: https://www.scaleway.com/

[17] Anthropic, "Claude — AI Assistant by Anthropic," 2024. [Online]. Disponível: https://www.anthropic.com/claude

[18] OWASP Foundation, "OWASP Top Ten," *Open Web Application Security Project*, 2021. [Online]. Disponível: https://owasp.org/www-project-top-ten/
