# ==========================================
# NEXORA Frontend - Production Multi-Stage Dockerfile
# (Used when Root Directory is set to apps/frontend or frontend web service)
# ==========================================

# --- Stage 1: Dependencies ---
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# --- Stage 2: Builder ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time environment arguments
ARG NEXT_PUBLIC_API_URL=https://nexora.com/api/v1
ARG NEXT_PUBLIC_SOCKET_URL=https://nexora.com

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# --- Stage 3: Runner ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy static public assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/public ./apps/frontend/public

# Set permissions for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy standalone output and static assets (covers both root and monorepo path structures)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./apps/frontend/.next/static

USER nextjs

EXPOSE 3000

CMD ["sh", "-c", "if [ -f server.js ]; then node server.js; elif [ -f apps/frontend/server.js ]; then node apps/frontend/server.js; else node .next/standalone/server.js; fi"]
