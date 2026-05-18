# ── Stage 1: Build ────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar só os ficheiros de dependências primeiro (cache layer)
COPY package*.json ./
RUN npm ci --only=production

# Copiar o código fonte
COPY src/ ./src/

# ── Stage 2: Runtime ───────────────────────────────────────────
FROM node:20-alpine AS runtime

WORKDIR /app

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Copiar apenas o necessário do stage anterior
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src          ./src

# Segurança: correr como utilizador não-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Expor a porta da API
EXPOSE 3000

# Health check integrado
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

# Comando de arranque
CMD ["node", "src/app.js"]
