# NEXORA — Multi-Vendor Commerce & Logistics Platform

> A production-grade, full-stack multi-vendor marketplace and logistics platform.  
> Built as a portfolio-quality system demonstrating scalable architecture, real-time features, and modern DevOps practices.

---

## 📸 Screenshots

> _Screenshots will be added during implementation phases._

| Customer Marketplace | Seller Dashboard | Delivery Tracking |
|---|---|---|
| _(coming soon)_ | _(coming soon)_ | _(coming soon)_ |

---

## 🚀 Features

### Customer
- Browse marketplace across multiple sellers
- Full-text product search (Atlas Search)
- Product variants (size, color, etc.)
- Guest browsing, authenticated checkout
- Redis-persisted cart (merges on login)
- Multi-seller cart — single checkout, split sub-orders
- Real-time order tracking
- Live delivery map with rider location
- Customer ↔ Seller / Rider chat
- Stripe-powered checkout
- Coupon codes
- Product reviews and ratings
- Push and in-app notifications

### Seller
- Seller registration with admin approval workflow
- Storefront management and branding
- Product and variant management (draft → pending_review → approved)
- SKU-level inventory management
- Order management per store
- Revenue dashboard with commission breakdown
- Withdrawal request system
- Customer chat per order
- Real-time stock alerts via BullMQ

### Delivery / Rider
- Rider registration with admin approval
- Proximity-based auto-assignment via BullMQ
- Delivery state machine (assigned → picked_up → delivered)
- Real-time GPS location broadcasting
- Earnings dashboard

### Admin
- Platform-wide analytics dashboard
- Seller approval / suspension
- Product moderation (approve/reject)
- Rider management
- Revenue and commission reports
- Audit log viewer
- System health monitoring

---

## 🏗️ Architecture Overview

```
                        Internet
                           │
                    ┌──────▼──────┐
                    │    Nginx     │  (SSL, reverse proxy, load balancer)
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
    ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
    │  API Srv #1 │ │  API Srv #2 │ │  API Srv #N │
    │  Express+WS │ │  Express+WS │ │  Express+WS │
    └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
           └───────────────┼───────────────┘
                           │
         ┌─────────────────┼─────────────────┐
  ┌──────▼──────┐  ┌───────▼──────┐  ┌───────▼──────┐
  │   MongoDB   │  │    Redis     │  │   BullMQ     │
  │ Replica Set │  │ Cache+PubSub │  │   Workers    │
  └─────────────┘  └──────────────┘  └──────────────┘
```

**Architecture:** Modular Monolith (designed for future microservice extraction)

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, TanStack Query, Zod, Socket.IO Client, Recharts |
| **Backend** | Node.js, Express.js, TypeScript, MongoDB Native Driver |
| **Realtime** | Socket.IO + Redis Pub/Sub Adapter |
| **Queue** | BullMQ (Redis-backed) |
| **Cache** | Redis (ioredis) |
| **Database** | MongoDB (Atlas or Replica Set) |
| **Payments** | Stripe (Payment Intents + Connect + Webhooks) |
| **Search** | MongoDB Atlas Search (Lucene) |
| **Storage** | Cloudinary |
| **Maps** | Mapbox GL |
| **Email** | Resend |
| **Auth** | JWT (access in memory, refresh in HttpOnly cookie) |
| **Infrastructure** | Docker, Docker Compose, Nginx, GitHub Actions |
| **Observability** | Pino, Prometheus, Grafana, Sentry |
| **Load Testing** | k6 |

---

## 👥 User Roles

| Role | Description |
|---|---|
| `SUPER_ADMIN` | Full platform control |
| `ADMIN` | Seller/rider approval, product moderation, analytics |
| `SELLER` | Manages own store, products, orders, inventory |
| `DELIVERY_AGENT` | Accepts and fulfills delivery tasks |
| `CUSTOMER` | Browses, orders, tracks deliveries |

---

## 🔄 Core Workflows

### Customer Order Flow
```
Browse → Add to Cart → Checkout (Stripe) → Webhook Confirms →
Seller Notified → Seller Prepares → Rider Auto-Assigned →
Pickup → Real-time Tracking → Delivered → Review
```

### Seller Onboarding
```
Register → Stripe Connect Onboarding → Admin Approval →
Store Active → Create Products → Admin Moderation → Live
```

---

## 📁 Repository Structure

```
NEXORA/
├── apps/
│   ├── frontend/               # Next.js application
│   └── backend/                # Express.js modular monolith
│       └── src/
│           ├── modules/        # Feature modules
│           ├── shared/         # Shared utilities
│           └── infrastructure/ # DB, Redis, Queue, Socket
├── docs/                       # Architecture documentation
│   └── adr/                    # Architecture Decision Records
├── infra/
│   ├── docker/
│   ├── nginx/
│   └── k6/
├── .github/workflows/
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## ⚙️ Local Setup

### Prerequisites
- Node.js 20+, Docker & Docker Compose

```bash
# Clone
git clone https://github.com/yourusername/nexora.git && cd nexora

# Copy env
cp .env.example .env  # Fill in your values

# Start infrastructure
docker-compose up -d mongodb redis

# Install and run
npm install && npm run dev
```

---

## 🧪 Testing

```bash
npm run test                    # Unit tests
npm run test:integration        # Integration tests
npm run test:e2e               # E2E (Playwright)
k6 run infra/k6/scenarios/baseline.js   # Load test
```

---

## 📚 Documentation

| Document | Description |
|---|---|
| [00-PROJECT-PLAN](docs/00-PROJECT-PLAN.md) | Project overview, goals, MVP scope |
| [01-SYSTEM-ARCHITECTURE](docs/01-SYSTEM-ARCHITECTURE.md) | Full architecture design |
| [02-DATABASE-DESIGN](docs/02-DATABASE-DESIGN.md) | MongoDB schema, indexes, relationships |
| [03-API-ROUTE-DESIGN](docs/03-API-ROUTE-DESIGN.md) | All API endpoints |
| [04-AUTH-RBAC-DESIGN](docs/04-AUTH-RBAC-DESIGN.md) | Auth flow, JWT, permissions |
| [05-REALTIME-ARCHITECTURE](docs/05-REALTIME-ARCHITECTURE.md) | Socket.IO design |
| [06-PAYMENT-ARCHITECTURE](docs/06-PAYMENT-ARCHITECTURE.md) | Stripe integration |
| [07-DELIVERY-ARCHITECTURE](docs/07-DELIVERY-ARCHITECTURE.md) | Rider and delivery system |
| [08-CACHING-REDIS-DESIGN](docs/08-CACHING-REDIS-DESIGN.md) | Redis cache strategy |
| [09-QUEUE-BULLMQ-DESIGN](docs/09-QUEUE-BULLMQ-DESIGN.md) | BullMQ job queues |
| [10-LOAD-BALANCER-DESIGN](docs/10-LOAD-BALANCER-DESIGN.md) | Nginx and scaling |
| [11-SECURITY-DESIGN](docs/11-SECURITY-DESIGN.md) | Security architecture |
| [12-DEPLOYMENT-ARCHITECTURE](docs/12-DEPLOYMENT-ARCHITECTURE.md) | Docker, CI/CD |
| [13-TESTING-STRATEGY](docs/13-TESTING-STRATEGY.md) | Testing approach |
| [14-LOAD-TESTING-K6](docs/14-LOAD-TESTING-K6.md) | k6 scenarios |
| [15-MONITORING-OBSERVABILITY](docs/15-MONITORING-OBSERVABILITY.md) | Logging, metrics |
| [16-IMPLEMENTATION-PLAN](docs/16-IMPLEMENTATION-PLAN.md) | Phase-by-phase plan |

---

## 📄 License

MIT License.
