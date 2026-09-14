# NEXORA — Hyperlocal Multi-Vendor Commerce & Logistics Platform

<div align="center">

![Platform Status](https://img.shields.io/badge/Status-Production%20Ready-success?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?style=for-the-badge&logo=typescript)
![Next.js](https://img.shields.io/badge/Next.js-14.2%20App%20Router-black?style=for-the-badge&logo=next.js)
![Express](https://img.shields.io/badge/Express-4.19-green?style=for-the-badge&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0%20ReplicaSet-green?style=for-the-badge&logo=mongodb)
![Redis](https://img.shields.io/badge/Redis-7.2%20Pub%2FSub%20%2B%20Cache-red?style=for-the-badge&logo=redis)
![BullMQ](https://img.shields.io/badge/BullMQ-5.14%20Queues-orange?style=for-the-badge)
![Tests](https://img.shields.io/badge/Vitest-96%2F96%20Passed%20(100%25)-brightgreen?style=for-the-badge&logo=vitest)

<p align="center">
  A full-stack, enterprise-grade multi-vendor marketplace and hyperlocal logistics platform featuring real-time telematics, two-phase inventory reservations, automatic sub-order splitting, vendor payouts, and Prometheus observability.
</p>

</div>

---

## 💎 Design Aesthetic: Light Theme Liquid Glass

NEXORA’s client interface is crafted according to a unified **Light Theme Liquid Glass** visual identity:
- **Canvas Base:** High-clarity soft gray (`#f8fafc`) accented by fluid ambient color radial gradients.
- **Translucent Glass Panels:** `backdrop-blur-md` surfaces with micro-borders (`rgba(255, 255, 255, 0.85)`) and multi-layer drop shadows.
- **Accents:** Royal Sapphire (`#2563eb`) & Electric Indigo (`#4f46e5`) with vibrant interactive transitions.
- **Internationalization:** Strict **100% English** copywriting across all client portals.

---

## 🚀 Key Functional Modules & Capabilities

### 🛒 1. Customer Marketplace
- **Dynamic Catalog:** Hierarchical category browsing, live text search, and attribute-based price recalculation.
- **Product Variants:** Sizing, colors, and SKUs with live inventory verification.
- **Dual-Mode Cart:** Redis-backed cart supporting anonymous guest sessions with seamless merging upon user login.
- **Multi-Vendor Checkout:** Single customer payment transaction atomically splitting into vendor sub-orders.
- **Live Order Tracking:** 5-step dynamic status pipeline (`pending` → `confirmed` → `preparing` → `ready_for_pickup` → `delivered`) with driver telematics.
- **Universal Chat Hub:** Real-time messaging with merchants and assigned delivery drivers.
- **Verified Reviews & Ratings:** Verified-purchase gate ensuring only buyers of delivered items can post reviews.

### 🏪 2. Merchant Headquarters
- **Storefront Customization:** Brand profile, banner, and logo management.
- **Product Lifecycle:** Multi-stage lifecycle (`draft` → `pending_review` → `approved` / `rejected`).
- **Inventory Controller:** SKU-level stock management with low-stock alerts and one-click restock modals.
- **Fulfillment Pipeline:** Sub-order fulfillment queue with state transitions (`confirm` → `preparing` → `ready_for_pickup`).
- **Coupon Promotion Engine:** Percentage and fixed discount promotions with minimum spend and atomic usage counters.
- **Visual Analytics:** Interactive Recharts dashboards for revenue trends, order volume, and top products.
- **Treasury & Withdrawals:** Available balance tracking and automated withdrawal payout requests.

### 🛵 3. Hyperlocal Courier Network
- **Courier Telematics Console:** Live online/offline dispatch toggle with real-time GPS simulation.
- **Proximity-Based Auto-Assignment:** BullMQ queue workers search nearby riders within a 5km–15km radius via Redis `GEORADIUS` / `GEOSEARCH` with distributed assignment locks (`lock:assignment:${riderId}`).
- **Task Lifecycle:** Step-by-step progress tracking (`assigned` → `en_route_pickup` → `picked_up` → `en_route_delivery` → `delivered`).
- **Courier Wallet:** Automatic earnings credit upon delivery confirmation.

### 🛡️ 4. Executive Platform Administration
- **Executive Intelligence Dashboard:** Platform Gross Merchandise Value (GMV), platform fee commissions, active stores, active riders, and daily GMV trendlines.
- **Merchant Compliance:** Approval and rejection workflows for new seller registrations.
- **Product Moderation:** Quality and compliance inspection for vendor product submissions.
- **Courier Fleet Oversight:** Rider verification, status inspection, and fleet management.
- **Treasury Management:** Administrative review, approval, or rejection of merchant payouts with automated wallet refunds.
- **Forensic Audit Explorer:** Immutable system audit trail tracking security-critical events with actor metadata.

---

## 🏗️ Technical Architecture

```
                                  Internet
                                     │
                     ┌───────────────▼───────────────┐
                     │    Nginx 1.25 Reverse Proxy    │
                     │  (SSL, HSTS, Gzip, Rate Limit) │
                     └───────────────┬───────────────┘
                                     │
             ┌───────────────────────┴───────────────────────┐
             │                                               │
             ▼ :3000                                         ▼ :5000
    ┌─────────────────┐                             ┌─────────────────┐
    │ NEXORA Frontend │                             │ NEXORA Backend  │
    │  Next.js 14 App │                             │ Express 4.19 TS │
    │   Liquid Glass  │                             │ Modular Monolith│
    └─────────────────┘                             └────────┬────────┘
                                                             │
                  ┌───────────────────┬──────────────────────┴───────────────────┐
                  ▼                   ▼                                          ▼
         ┌─────────────────┐ ┌─────────────────┐                        ┌─────────────────┐
         │ MongoDB 7.0 RS  │ │    Redis 7.2    │                        │   BullMQ 5.14   │
         │  Transactions   │ │ Cache & PubSub  │                        │  Worker Queues  │
         └─────────────────┘ └─────────────────┘                        └─────────────────┘
```

---

## 🧱 Repository Structure

```
NEXORA/
├── apps/
│   ├── backend/                # Modular monolith Express API
│   │   ├── src/
│   │   │   ├── modules/        # 19 domain-driven feature modules
│   │   │   ├── infrastructure/ # DB, Redis, BullMQ, Socket.IO, Metrics
│   │   │   ├── shared/         # Middlewares, error classes, response helpers
│   │   │   └── tests/          # 20 Vitest test suites (96 tests)
│   │   └── README.md           # Detailed backend documentation
│   └── frontend/               # Next.js 14 App Router application
│       ├── app/                # Portals: Customer, Seller, Rider, Admin, Auth
│       ├── components/         # Liquid Glass reusable components
│       ├── providers/          # QueryClient & Socket.IO providers
│       ├── lib/api/            # Typed API client functions
│       └── README.md           # Detailed frontend documentation
├── docs/                       # 17 Architectural specification documents & ADRs
├── infra/
│   ├── docker/                 # Production multi-stage Dockerfiles
│   ├── nginx/                  # Nginx development and production configurations
│   └── k6/                     # k6 automated load testing suite (smoke, browse, orders, auth)
├── .github/workflows/          # GitHub Actions CI & CD workflows
├── docker-compose.yml          # Development Docker stack
├── docker-compose.prod.yml     # Production Docker stack with Certbot
├── PHASE-TRACKER.md            # Master execution progress tracker (Phases 0 - 20)
└── README.md
```

---

## ⚡ Quickstart & Development

### 1. Local Development
```bash
# Clone the repository
git clone https://github.com/yourusername/nexora.git
cd nexora

# Install monorepo dependencies
npm install

# Start local infrastructure (MongoDB Replica Set + Redis)
docker-compose up -d mongodb mongo-init redis

# Start backend (port 5000) and frontend (port 3000)
npm run dev:backend
npm run dev:frontend
```

### 2. Running Automated Tests
```bash
# Run backend test suites (Vitest)
npm run test

# Run TypeScript typechecks across both packages
npm run typecheck
```

### 3. Running Load Tests (k6)
```bash
# Run smoke test
k6 run -e BASE_URL=http://localhost:5000 infra/k6/scenarios/smoke.js

# Run browse scenario
k6 run -e BASE_URL=http://localhost:5000 infra/k6/scenarios/browse.js
```

### 4. Production Deployment (Docker Compose)
```bash
# Launch production container stack with SSL and Nginx
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## 🔑 Demo Test Accounts Directory

All accounts are pre-seeded with the password: `Password123!`

| Role | Email | Name | Default Portal |
|---|---|---|---|
| **Customer** | `customer@nexora.com` | Alex Customer | `/profile`, `/cart`, `/orders` |
| **Active Buyer** | `buyer@nexora.com` | Sarah Buyer | `/profile`, `/cart`, `/orders` |
| **Merchant / Seller** | `seller@nexora.com` | David Merchant | `/seller/dashboard`, `/seller/products` |
| **Vendor** | `vendor@nexora.com` | Elena Vendor | `/seller/dashboard`, `/seller/inventory` |
| **Delivery Rider** | `rider@nexora.com` | Marco Rider | `/delivery/dashboard` |
| **Courier** | `courier@nexora.com` | Liam Courier | `/delivery/dashboard` |
| **Operations Admin** | `admin@nexora.com` | Operations Admin | `/admin/analytics` |
| **Super Admin** | `superadmin@nexora.com` | Executive SuperAdmin | `/admin/analytics`, `/admin/audit-logs` |
| **Personal Account** | `ataurrahman24707@gmail.com` | Ataur Rahman | `/admin/analytics` |

---

## 📈 Observability & Prometheus Metrics

NEXORA exposes standard Prometheus metrics out of the box:
- `GET /metrics` & `GET /api/v1/health/metrics`
  - `http_request_duration_seconds` (Histogram by method, route, and status code)
  - `nexora_active_orders_total` (Gauge of active non-terminal orders)
  - `nexora_payments_total` (Counter by status: succeeded, failed, refunded)
  - `bullmq_job_duration_seconds` (Histogram by queue and job name)
  - `bullmq_job_failures_total` (Counter of failed asynchronous tasks)
  - `nexora_cache_hits_total` & `nexora_cache_misses_total` (Redis cache metrics)

---

## 📄 License

This project is licensed under the MIT License.
