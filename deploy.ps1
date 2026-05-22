# ================================================================
# SportsHub Social — Script de Deploy para Azure
# Executa no PowerShell: .\deploy.ps1
# Pre-requisito: Azure CLI instalado e autenticado (az login)
# ================================================================

$ErrorActionPreference = "Stop"
$RG       = "sportshub-rg"
$PREFIX   = "sportshub"
$ACR      = "sportshubregistry"
$API_APP  = "sportshub-api"
$FUNC_APP = "sportshub-functions"
$SWA_APP  = "sportshub-frontend"
$LOCATION = "westeurope"

Write-Host ""
Write-Host "=== SportsHub Social — Deploy para Azure ===" -ForegroundColor Cyan
Write-Host "Resource Group : $RG"
Write-Host "Localizacao    : $LOCATION"

# ── Ler variaveis do .env ─────────────────────────────────────
Write-Host ""
Write-Host "[1/7] A ler variaveis do backend\.env..." -ForegroundColor Yellow
$envFile = Join-Path $PSScriptRoot "backend\.env"
if (-not (Test-Path $envFile)) {
    Write-Error "Ficheiro backend\.env nao encontrado!"
    exit 1
}

$envVars = @{}
Get-Content $envFile | Where-Object { $_ -match "^[^#].*=.*" } | ForEach-Object {
    $parts = $_ -split "=", 2
    $key   = $parts[0].Trim()
    $value = $parts[1].Trim().Trim('"')
    $envVars[$key] = $value
}

$COSMOS_CONN = $envVars["COSMOS_CONNECTION_STRING"]
$BLOB_CONN   = $envVars["BLOB_CONNECTION_STRING"]
$BLOB_URL    = $envVars["BLOB_ACCOUNT_URL"]
$JWT_SECRET  = $envVars["JWT_SECRET"]

if (-not $COSMOS_CONN) { Write-Error "COSMOS_CONNECTION_STRING nao encontrado no .env"; exit 1 }
if (-not $BLOB_CONN)   { Write-Error "BLOB_CONNECTION_STRING nao encontrado no .env"; exit 1 }
Write-Host "   Variaveis carregadas com sucesso." -ForegroundColor Green

# ── Verificar login Azure ─────────────────────────────────────
Write-Host ""
Write-Host "[2/7] A verificar login Azure..." -ForegroundColor Yellow
$accountJson = az account show -o json 2>$null
if (-not $accountJson) {
    Write-Error "Nao autenticado no Azure. Executa: az login --use-device-code"
    exit 1
}
$account = $accountJson | ConvertFrom-Json
Write-Host "   Autenticado: $($account.name)" -ForegroundColor Green
az account set --subscription "0020a664-effe-499c-a713-85d3fd61c694"

# ── Container Registry ────────────────────────────────────────
Write-Host ""
Write-Host "[3/7] Container Registry ($ACR)..." -ForegroundColor Yellow
$acrExists = az acr show --name $ACR --resource-group $RG --query name -o tsv 2>$null
if ($acrExists) {
    Write-Host "   Ja existe." -ForegroundColor Green
} else {
    az acr create --resource-group $RG --name $ACR --sku Basic --admin-enabled true --location $LOCATION
    Write-Host "   Criado!" -ForegroundColor Green
}

# Build e Push imagem Docker (direto no ACR, sem Docker local)
Write-Host "   A fazer build da imagem no ACR (nao precisa Docker local)..."
az acr build --registry $ACR --image "sportshub-api:latest" --file "backend/Dockerfile" "backend/"
Write-Host "   Imagem Docker publicada no ACR!" -ForegroundColor Green

# ── App Service ───────────────────────────────────────────────
Write-Host ""
Write-Host "[4/7] App Service ($API_APP)..." -ForegroundColor Yellow

$ACR_LOGIN = az acr show --name $ACR --query loginServer -o tsv
$ACR_USER  = az acr credential show --name $ACR --query username -o tsv
$ACR_PASS  = az acr credential show --name $ACR --query "passwords[0].value" -o tsv

$planExists = az appservice plan show --name "$PREFIX-plan" --resource-group $RG --query name -o tsv 2>$null
if (-not $planExists) {
    az appservice plan create --resource-group $RG --name "$PREFIX-plan" --location $LOCATION --is-linux --sku B1
}

$appExists = az webapp show --name $API_APP --resource-group $RG --query name -o tsv 2>$null
if (-not $appExists) {
    az webapp create `
        --resource-group $RG `
        --plan "$PREFIX-plan" `
        --name $API_APP `
        --deployment-container-image-name "${ACR_LOGIN}/sportshub-api:latest"
}

az webapp config container set `
    --resource-group $RG `
    --name $API_APP `
    --docker-custom-image-name "${ACR_LOGIN}/sportshub-api:latest" `
    --docker-registry-server-url "https://${ACR_LOGIN}" `
    --docker-registry-server-user $ACR_USER `
    --docker-registry-server-password $ACR_PASS

az webapp config appsettings set `
    --resource-group $RG `
    --name $API_APP `
    --settings `
        "COSMOS_CONNECTION_STRING=$COSMOS_CONN" `
        "COSMOS_DATABASE=sportshub" `
        "BLOB_CONNECTION_STRING=$BLOB_CONN" `
        "BLOB_ACCOUNT_URL=$BLOB_URL" `
        "JWT_SECRET=$JWT_SECRET" `
        "NODE_ENV=production" `
        "WEBSITES_PORT=3000" `
        "FRONTEND_URL=https://${SWA_APP}.azurestaticapps.net"

az webapp restart --resource-group $RG --name $API_APP
Write-Host "   App Service configurado e reiniciado!" -ForegroundColor Green

# ── Azure Functions ───────────────────────────────────────────
Write-Host ""
Write-Host "[5/7] Azure Functions ($FUNC_APP)..." -ForegroundColor Yellow

$funcExists = az functionapp show --name $FUNC_APP --resource-group $RG --query name -o tsv 2>$null
if (-not $funcExists) {
    az storage account create --resource-group $RG --name "${PREFIX}funcstorage" --location $LOCATION --sku Standard_LRS --kind StorageV2 2>$null
    az functionapp create `
        --resource-group $RG `
        --name $FUNC_APP `
        --storage-account "${PREFIX}funcstorage" `
        --consumption-plan-location $LOCATION `
        --runtime node `
        --runtime-version 20 `
        --functions-version 4 `
        --os-type Linux
}

az functionapp config appsettings set `
    --resource-group $RG `
    --name $FUNC_APP `
    --settings `
        "COSMOS_CONNECTION_STRING=$COSMOS_CONN" `
        "COSMOS_DATABASE=sportshub" `
        "FUNCTIONS_WORKER_RUNTIME=node" `
        "WEBSITE_RUN_FROM_PACKAGE=1"

$funcTools = Get-Command func -ErrorAction SilentlyContinue
if ($funcTools) {
    Push-Location "backend/functions"
    npm install --silent
    func azure functionapp publish $FUNC_APP --javascript
    Pop-Location
    Write-Host "   Functions deployadas!" -ForegroundColor Green
} else {
    Write-Host "   AVISO: func tools nao instalado. Instala com:" -ForegroundColor Red
    Write-Host "   npm install -g azure-functions-core-tools@4 --unsafe-perm true"
}

# ── Frontend ──────────────────────────────────────────────────
Write-Host ""
Write-Host "[6/7] Frontend — build e deploy..." -ForegroundColor Yellow

Push-Location "frontend"
$env:VITE_API_URL = "https://${API_APP}.azurewebsites.net/api"
npm install --silent
npm run build
Write-Host "   Build do frontend concluido!" -ForegroundColor Green

$swaExists = az staticwebapp show --name $SWA_APP --resource-group $RG --query name -o tsv 2>$null
if (-not $swaExists) {
    az staticwebapp create --name $SWA_APP --resource-group $RG --location $LOCATION
}

$SWA_TOKEN = az staticwebapp secrets list --name $SWA_APP --resource-group $RG --query "properties.apiKey" -o tsv

$swaCli = Get-Command swa -ErrorAction SilentlyContinue
if ($swaCli) {
    swa deploy ./dist --deployment-token $SWA_TOKEN --env production
    Write-Host "   Frontend deployado!" -ForegroundColor Green
} else {
    Write-Host "   AVISO: SWA CLI nao instalado. Instala com:" -ForegroundColor Red
    Write-Host "   npm install -g @azure/static-web-apps-cli"
    Write-Host "   Depois corre dentro da pasta frontend/:"
    Write-Host "   swa deploy ./dist --deployment-token $SWA_TOKEN"
}
Pop-Location

# ── GitHub Secrets ────────────────────────────────────────────
Write-Host ""
Write-Host "[7/7] A gerar credenciais para GitHub Actions..." -ForegroundColor Yellow
$SP_JSON = az ad sp create-for-rbac `
    --name "sportshub-github-actions" `
    --role contributor `
    --scopes "/subscriptions/0020a664-effe-499c-a713-85d3fd61c694/resourceGroups/$RG" `
    --json-auth 2>$null

# ── Resultado Final ───────────────────────────────────────────
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " DEPLOY CONCLUIDO! URLs finais:" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host " Frontend  : https://${SWA_APP}.azurestaticapps.net" -ForegroundColor Green
Write-Host " API       : https://${API_APP}.azurewebsites.net" -ForegroundColor Green
Write-Host " Functions : https://${FUNC_APP}.azurewebsites.net" -ForegroundColor Green
Write-Host ""
Write-Host " Health check: https://${API_APP}.azurewebsites.net/api/health"
Write-Host ""
Write-Host " Secrets para o GitHub (Settings -> Secrets -> Actions):" -ForegroundColor Yellow
Write-Host "   ACR_USERNAME                    = $ACR_USER"
Write-Host "   ACR_PASSWORD                    = $ACR_PASS"
Write-Host "   AZURE_STATIC_WEB_APPS_API_TOKEN = $SWA_TOKEN"
Write-Host "   AZURE_CREDENTIALS               = (JSON abaixo)"
Write-Host ""
if ($SP_JSON) { Write-Host $SP_JSON -ForegroundColor Gray }
