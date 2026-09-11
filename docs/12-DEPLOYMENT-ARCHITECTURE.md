# 12 — NEXORA Deployment Architecture

## 1. Environment Strategy

```
Developer Machine (local)
         │
         ▼
Development  →  Staging  →  Production
(docker-compose.yml)  (docker-compose.staging.yml)  (docker-compose.prod.yml)
```

| Env | Database | Redis | Stripe | Monitoring |
|---|---|---|---|---|
| Development | Local MongoDB (Docker) | Local Redis (Docker) | Stripe test mode | Logs only |
| Staging | MongoDB Atlas (test cluster) | Redis Cloud (test) | Stripe test mode | Basic monitoring |
| Production | MongoDB Atlas (production cluster) | Redis Cloud (production) | Stripe live mode | Full stack |

---

## 2. Docker Architecture

### Services Overview
```
┌─────────────────────────────────────────────────────────┐
│                    Docker Compose                        │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │  nginx   │  │ frontend │  │  api     │  │ worker │  │
│  │ :80/:443 │  │  :3000   │  │  :5000   │  │(BullMQ)│  │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘  │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────────┐ │
│  │  mongodb │  │  redis   │  │   prometheus / grafana │ │
│  │  :27017  │  │  :6379   │  │         :9090/:3001    │ │
│  └──────────┘  └──────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### `docker-compose.yml` (Development)

```yaml
version: "3.9"

services:
  mongodb:
    image: mongo:7.0
    command: ["--replSet", "rs0"]  # Enable transactions
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5

  # MongoDB Replica Set init (one-time)
  mongo-init:
    image: mongo:7.0
    depends_on:
      mongodb:
        condition: service_healthy
    command: >
      mongosh --host mongodb --eval
      'rs.initiate({_id: "rs0", members: [{_id: 0, host: "mongodb:27017"}]})'
    restart: "no"

  redis:
    image: redis:7.2-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  api:
    build:
      context: ./apps/backend
      dockerfile: Dockerfile.dev
    ports:
      - "5000:5000"
      - "9464:9464"  # Prometheus metrics
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://mongodb:27017/nexora?replicaSet=rs0
      - REDIS_URL=redis://redis:6379
    env_file:
      - .env
    volumes:
      - ./apps/backend/src:/app/src  # hot reload
    depends_on:
      mongodb:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped

  frontend:
    build:
      context: ./apps/frontend
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
    volumes:
      - ./apps/frontend:/app
    restart: unless-stopped

  nginx:
    image: nginx:1.25-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./infra/nginx/dev.conf:/etc/nginx/nginx.conf
      - nginx_logs:/var/log/nginx
    depends_on:
      - api
      - frontend
    restart: unless-stopped

volumes:
  mongodb_data:
  redis_data:
  nginx_logs:
```

---

## 3. Dockerfiles

### Backend Dockerfile (Multi-stage)
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build  # tsc → dist/

# Production stage
FROM node:20-alpine AS production
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json .
USER appuser
EXPOSE 5000
HEALTHCHECK --interval=10s --timeout=5s CMD curl -f http://localhost:5000/api/v1/health/live || exit 1
CMD ["node", "dist/server.js"]
```

### Frontend Dockerfile (Multi-stage)
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SOCKET_URL
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json .
EXPOSE 3000
CMD ["node_modules/.bin/next", "start"]
```

---

## 4. Environment Variables Management

**Development:** `.env` file at project root (gitignored).  
**Staging/Production:** CI/CD secrets injected as environment variables.

**Secret categories:**

| Category | Variables | Storage |
|---|---|---|
| Database | MONGODB_URI | CI/CD secrets |
| Redis | REDIS_URL, REDIS_PASSWORD | CI/CD secrets |
| JWT | JWT_ACCESS_SECRET, JWT_REFRESH_SECRET | CI/CD secrets |
| Stripe | STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET | CI/CD secrets |
| External APIs | CLOUDINARY_URL, MAPBOX_TOKEN, RESEND_API_KEY | CI/CD secrets |
| App config | PORT, FRONTEND_URL, ALLOWED_ORIGINS | CI/CD env vars (non-secret) |

---

## 5. SSL / HTTPS

**Development:** HTTP only (no SSL).  
**Staging/Production:**
- Nginx handles SSL termination
- Certificates from Let's Encrypt (certbot)
- Auto-renewal via Docker + certbot container or Certbot renewal cron

```yaml
# Production docker-compose addition:
certbot:
  image: certbot/certbot
  volumes:
    - certbot_certs:/etc/letsencrypt
    - certbot_www:/var/www/certbot
  command: certonly --webroot --webroot-path /var/www/certbot -d nexora.com -d www.nexora.com
```

---

## 6. CI/CD — GitHub Actions

### Pipeline Overview
```
Push to branch
       │
       ▼
┌──────────────────────────────────────────────────┐
│  CI: lint, typecheck, unit tests                 │
└──────────────────────────────────────────────────┘
       │ (on PR merge to main)
       ▼
┌──────────────────────────────────────────────────┐
│  CD: build Docker images, push to registry       │
│  Deploy to staging                               │
│  Run integration tests against staging           │
└──────────────────────────────────────────────────┘
       │ (manual approval)
       ▼
┌──────────────────────────────────────────────────┐
│  Deploy to production                            │
│  Run smoke tests                                 │
└──────────────────────────────────────────────────┘
```

### `.github/workflows/ci.yml`
```yaml
name: CI

on:
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:7.0
        ports: ["27017:27017"]
      redis:
        image: redis:7.2-alpine
        ports: ["6379:6379"]

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Typecheck
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Unit tests
        run: npm run test

      - name: Integration tests
        env:
          MONGODB_URI: mongodb://localhost:27017/nexora_test
          REDIS_URL: redis://localhost:6379
          JWT_ACCESS_SECRET: test_secret_32chars_minimum_length
          JWT_REFRESH_SECRET: test_secret_refresh_32chars_length
        run: npm run test:integration
```

### `.github/workflows/deploy.yml`
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Build and push Docker image
        run: |
          docker build -t ghcr.io/org/nexora-api:$GITHUB_SHA ./apps/backend
          docker push ghcr.io/org/nexora-api:$GITHUB_SHA

      - name: Deploy to server (SSH)
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/nexora
            export IMAGE_TAG=${{ github.sha }}
            docker-compose -f docker-compose.prod.yml pull
            docker-compose -f docker-compose.prod.yml up -d --no-downtime
            docker system prune -f
```

---

## 7. Rollback Strategy

**Immediate rollback (automated):**
- If smoke tests fail after deployment, CI/CD re-deploys the previous image tag
- Previous image tag is always tagged as `stable` in registry

**Manual rollback:**
```bash
# SSH to production server
cd /opt/nexora
export IMAGE_TAG=<previous_sha>
docker-compose -f docker-compose.prod.yml up -d
```

---

## 8. Backup Strategy

| Data | Backup method | Frequency | Retention |
|---|---|---|---|
| MongoDB | Atlas continuous backup + daily snapshots | Continuous | 7 days (staging), 30 days (prod) |
| Redis | Redis AOF persistence | Continuous | Rebuilt from MongoDB on failure |
| Nginx config | Git repository | Every change | Permanent |
| Environment variables | Encrypted in CI/CD secrets | Every change | Permanent |
| Cloudinary assets | Cloudinary built-in redundancy | — | Permanent |
