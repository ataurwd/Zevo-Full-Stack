# ==========================================
# NEXORA Backend API - Production Dockerfile
# (Used by Render, Railway, Fly.io, etc. by default from repo root)
# ==========================================

# --- Stage 1: Build & TypeScript Compilation ---
FROM node:20-alpine AS builder

WORKDIR /app

# Install native compilation dependencies for bcrypt and other native packages
RUN apk add --no-cache python3 make g++

# Copy root workspace and package manifests
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY apps/backend/tsconfig.json ./apps/backend/

# Install dependencies for the backend workspace
RUN npm ci --workspace=apps/backend

# Copy backend source files
COPY apps/backend/src ./apps/backend/src

# Build backend TypeScript
RUN npm run build:backend

# Prune dev dependencies
RUN npm prune --omit=dev --workspace=apps/backend

# --- Stage 2: Minimal Production Runtime ---
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install curl for container health checks
RUN apk add --no-cache curl

# Create non-root system user and group
RUN addgroup -S nexoragroup && adduser -S nexorauser -G nexoragroup

# Copy production node_modules, compiled artifacts, and manifest
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=builder /app/package.json ./package.json

# Create uploads directory with non-root ownership
RUN mkdir -p /app/apps/backend/uploads /app/uploads && \
    chown -R nexorauser:nexoragroup /app/apps/backend/uploads /app/uploads

USER nexorauser

EXPOSE 5000

HEALTHCHECK --interval=20s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

WORKDIR /app/apps/backend

CMD ["node", "dist/server.js"]
