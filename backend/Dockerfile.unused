FROM node:20-alpine AS base

# Instalar dependencias del sistema
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev

WORKDIR /app

# ====================================
# Stage 1: Dependencies
# ====================================
FROM base AS deps

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# ====================================
# Stage 2: Build
# ====================================
FROM base AS build

COPY package*.json ./
RUN npm ci

COPY . .

# Generar Prisma Client
RUN npx prisma generate

# ====================================
# Stage 3: Production
# ====================================
FROM base AS production

ENV NODE_ENV=production

# Copiar node_modules de deps
COPY --from=deps /app/node_modules ./node_modules

# Copiar código y Prisma generado
COPY --from=build /app ./

# Exponer puerto
EXPOSE 4004

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \  
  CMD node -e "require('http').get('http://localhost:4004/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Ejecutar migraciones y arrancar servidor
CMD ["sh", "-c", "npx prisma migrate deploy && node index.js"]
