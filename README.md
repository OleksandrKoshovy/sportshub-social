# SportsHub Social

Aplicação web para organizar e encontrar eventos desportivos amadores perto de ti.
Criada como projeto para a UC de Computação em Nuvem e Big Data — IPCB, 2026.

**Equipa:** Bernardo Ávila · Gabriel Inácio · Oleksandr Koshovyi

---

## O que é isto?

O SportsHub permite criar eventos de desporto (futebol, padel, corrida, etc), inscrever-te em eventos de outros, e avaliar quem participou contigo. Com base nessas avaliações e no número de eventos em que participaste, é calculado um ranking global de utilizadores.

A infraestrutura corre toda no Azure — a API está num container Docker no App Service, o frontend é um site estático no Blob Storage, e há Azure Functions para tarefas automáticas como marcar eventos como concluídos e atualizar o ranking.

---

## Links

- **Site:** https://sportshubstorage.z28.web.core.windows.net
- **API:** https://sportshub-api.azurewebsites.net
- **Repositório:** https://github.com/OleksandrKoshovy/sportshub-social

---

## Stack

- **Backend:** Node.js 20 + Express, Docker, Azure App Service
- **Base de dados:** Azure Cosmos DB (NoSQL)
- **Ficheiros:** Azure Blob Storage (fotos, avatares, frontend)
- **Funções automáticas:** Azure Functions (timer + Change Feed)
- **IaC:** Terraform (`infrastructure/terraform/`)
- **CI/CD:** GitHub Actions (lint → testes → build Docker → deploy)

---

## Correr localmente

```bash
git clone https://github.com/OleksandrKoshovy/sportshub-social.git
cd sportshub-social/backend
npm install
cp .env.example .env   # preencher com as credenciais Azure
npm run dev            # http://localhost:3000
```

Para correr os testes:

```bash
npm test      # 7 testes com Jest
npm run lint  # ESLint
```

---

## Infraestrutura com Terraform

Os recursos do Azure já estão criados, mas o Terraform permite recriar tudo num ambiente novo:

```bash
cd infrastructure/terraform
terraform init
terraform plan -var="jwt_secret=A_TUA_CHAVE"
terraform apply -var="jwt_secret=A_TUA_CHAVE"
```

---

## Estrutura de pastas

```
sportshub/
├── backend/
│   ├── src/routes/        ← auth, events, ratings, users, upload, admin
│   ├── functions/         ← CleanupExpired, UpdateRanking, ProcessRating
│   └── __tests__/
├── frontend/
│   └── src/pages/         ← Feed, EventDetail, Ranking, Profile, Admin, ...
├── infrastructure/
│   └── terraform/         ← main.tf, variables.tf, outputs.tf
└── .github/workflows/     ← deploy.yml (pipeline CI/CD)
```

---

## Ranking

A fórmula usada para calcular os pontos de cada utilizador:

```
rankingPoints = round(avgRating × 20) + eventsCount × 5
```

Só aparecem no ranking utilizadores com pelo menos um evento participado.
