# NEXORA — Project Plan
# 00-PROJECT-PLAN.md

## 1. Project Overview

NEXORA is a production-grade, multi-vendor commerce and logistics platform. It enables sellers to list products, customers to browse and purchase, and riders to fulfill deliveries — all under a unified platform operated by administrators.

The system is designed as a **Modular Monolith** with clean module boundaries that allow individual modules to be extracted into independent microservices as traffic demands grow.

---

## 2. Problem Statement

Small and medium-sized businesses lack access to a unified marketplace that combines:
- A modern e-commerce storefront
- Inventory management
- Integrated payment processing
- An owned last-mile delivery network
- Real-time communication between buyers, sellers, and riders

Existing solutions either require heavy external integrations or are too costly for emerging sellers. NEXORA solves this by providing an end-to-end platform under a single roof.

---

## 3. Project Goals

| Priority | Goal |
|---|---|
| P0 | Functional marketplace where customers can browse, cart, and checkout |
| P0 | Seller management with storefronts, products, and inventory |
| P0 | Stripe-powered checkout with platform commission |
| P0 | Delivery network with auto-assigned riders and real-time tracking |
| P0 | Role-based authorization with strict seller isolation |
| P1 | Real-time order and delivery updates via Socket.IO |
| P1 | Customer ↔ Seller and Customer ↔ Rider chat |
| P1 | Redis caching for performance |
| P1 | BullMQ background job processing |
| P2 | Admin analytics dashboard |
| P2 | Audit logs |
| P2 | k6 load testing |
| P2 | Prometheus + Grafana monitoring |
| P3 | CI/CD with GitHub Actions |
| P3 | Horizontal scaling with Nginx + Docker |

---

## 4. Target Users

| User Type | Description |
|---|---|
| **Customer** | End consumer who browses, purchases, and tracks orders |
| **Seller/Vendor** | Small to medium business that lists products and fulfills orders |
| **Delivery Agent/Rider** | Independent contractor who picks up and delivers orders |
| **Admin** | Platform operator who moderates sellers, products, and manages the platform |
| **Super Admin** | Technical operator with full system access |

---

## 5. User Roles

| Role | Scope |
|---|---|
| `SUPER_ADMIN` | All platform operations, can create/modify admins, system configuration |
| `ADMIN` | Seller approval, rider management, product moderation, analytics, coupons |
| `SELLER` | Own store, own products, own orders, own inventory, own withdrawals |
| `DELIVERY_AGENT` | Assigned deliveries, own location, own earnings |
| `CUSTOMER` | Own cart, own orders, own reviews, own profile |

---

## 6. Core Features

### 6.1 Customer

- [ ] Public product browsing (no auth required)
- [ ] Full-text search with Atlas Search
- [ ] Product filtering (category, price, rating, seller)
- [ ] Product detail with variants (size, color, etc.)
- [ ] Guest cart (Redis, by session token), merges on login
- [ ] Add to cart / update / remove
- [ ] Coupon application at checkout
- [ ] Stripe checkout (Payment Intent)
- [ ] Order history and order detail
- [ ] Real-time order status tracking
- [ ] Live delivery map (Mapbox + rider GPS)
- [ ] Product reviews and ratings (post-delivery)
- [ ] In-app notifications
- [ ] Chat with seller (per order)
- [ ] Chat with rider (per active delivery)
- [ ] Profile management
- [ ] Address book

### 6.2 Seller

- [ ] Seller registration (triggers Stripe Connect onboarding)
- [ ] Store profile and branding
- [ ] Product creation/editing with Cloudinary image upload
- [ ] Product variant management (size, color, etc.)
- [ ] SKU-level inventory tracking
- [ ] Low stock alerts (BullMQ scheduled check)
- [ ] Order management (confirm, prepare, mark ready)
- [ ] Revenue dashboard (gross, commission, net)
- [ ] Withdrawal request (platform processes payout)
- [ ] Store coupon creation
- [ ] Customer chat per order
- [ ] Real-time new order notifications

### 6.3 Delivery Agent / Rider

- [ ] Rider registration with ID/document upload
- [ ] Admin approval gate
- [ ] Go online/offline toggle
- [ ] Real-time delivery task notifications
- [ ] Accept/decline delivery assignment
- [ ] Delivery lifecycle management (en_route_pickup → picked_up → delivered)
- [ ] Real-time location broadcasting (GPS coordinates every N seconds)
- [ ] Delivery history
- [ ] Earnings dashboard

### 6.4 Admin

- [ ] Seller approval / rejection / suspension
- [ ] Product moderation (approve / reject)
- [ ] Rider approval / suspension
- [ ] Order oversight (all orders, filter by status/seller)
- [ ] Revenue analytics (platform earnings, seller payouts)
- [ ] Coupon management (platform-wide view, seller coupons)
- [ ] User management
- [ ] Audit log viewer
- [ ] System health dashboard

---

## 7. Advanced Features

- [ ] Seller-specific coupon codes with percentage or flat discount
- [ ] Partial refunds (admin-initiated)
- [ ] Delivery reassignment on rider timeout
- [ ] Typing indicators and read receipts in chat
- [ ] Rider proximity-based auto-assignment (geospatial)
- [ ] Real-time inventory decrement on checkout (atomic)
- [ ] BullMQ: email notifications, invoice generation, stock alerts
- [ ] API rate limiting (per IP + per authenticated user)
- [ ] Distributed lock for inventory via Redis (Redlock)
- [ ] Socket.IO Redis adapter for horizontal WS scaling
- [ ] Prometheus metrics endpoint
- [ ] Structured JSON logging (Pino)
- [ ] Sentry error tracking
- [ ] k6 load test scenarios

---

## 8. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Availability** | 99.9% uptime target in production |
| **Scalability** | Horizontal scaling of API servers behind Nginx |
| **Performance** | P95 API response < 300ms under normal load (to be verified by k6) |
| **Security** | OWASP Top 10 mitigations, JWT, bcrypt, Zod validation, Helmet |
| **Data Consistency** | MongoDB transactions for inventory decrement + order creation |
| **Payment Integrity** | Stripe webhook as single source of truth for payment status |
| **Observability** | Structured logs, Prometheus metrics, Sentry for errors |
| **Maintainability** | Module isolation, single-responsibility, documented APIs |
| **Testability** | Unit + integration + E2E test coverage |
| **Developer Experience** | TypeScript end-to-end, Zod shared schemas, hot reload |

---

## 9. Technology Stack

### Frontend
| Technology | Purpose |
|---|---|
| Next.js 14 (App Router) | Server + client rendering, routing |
| TypeScript | Type safety |
| Tailwind CSS | Utility-first styling |
| TanStack Query v5 | Server state management, caching |
| React Hook Form | Form handling |
| Zod | Schema validation (shared with backend) |
| Socket.IO Client | Real-time events |
| Recharts | Analytics charts |
| Mapbox GL JS | Delivery map |

### Backend
| Technology | Purpose |
|---|---|
| Node.js 20 | Runtime |
| Express.js | HTTP framework |
| TypeScript | Type safety |
| MongoDB Native Driver | Database (no ORM) |
| Redis (ioredis) | Cache + Pub/Sub |
| Socket.IO | WebSocket server |
| BullMQ | Background job queue |
| JSON Web Tokens (JWT) | Stateless authentication |
| Zod | Input validation |
| Pino | Structured logging |
| Stripe Node SDK | Payment processing |
| Cloudinary SDK | Image storage |

### Infrastructure
| Technology | Purpose |
|---|---|
| Docker | Containerization |
| Docker Compose | Local orchestration |
| Nginx | Reverse proxy, load balancer, SSL termination |
| GitHub Actions | CI/CD |
| Prometheus | Metrics collection |
| Grafana | Metrics visualization |
| Sentry | Error tracking |

### External Services
| Service | Purpose |
|---|---|
| Stripe | Payments + Connect (seller payouts) |
| Cloudinary | Image CDN and storage |
| Mapbox | Maps and geospatial |
| Resend | Transactional email |
| MongoDB Atlas | Managed database (production) |

---

## 10. Major Modules

```
nexora/
├── auth              — Authentication, token management
├── users             — User profiles, addresses
├── sellers           — Seller registration, approval, store management
├── stores            — Store branding, settings
├── products          — Product CRUD, variants, categories
├── inventory         — Stock management, reservations, transactions
├── cart              — Cart management (Redis-backed)
├── orders            — Order lifecycle, sub-order management
├── payments          — Stripe integration, webhooks, payouts
├── delivery          — Rider management, delivery tasks, location
├── chat              — Real-time messaging (conversations + messages)
├── notifications     — In-app + push notifications
├── reviews           — Product ratings and reviews
├── coupons           — Seller coupon management
├── analytics         — Admin dashboards and reports
└── admin             — Admin-specific operations
```

---

## 11. System Boundaries

```
┌─────────────────────────────────────────────────────────┐
│                       NEXORA PLATFORM                    │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Customer │  │  Seller  │  │  Admin   │  (Frontends)  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
│       │              │              │                    │
│  ┌────▼──────────────▼──────────────▼──────────────┐    │
│  │                  API Gateway (Nginx)              │    │
│  └────────────────────┬──────────────────────────────┘    │
│                       │                                  │
│  ┌────────────────────▼──────────────────────────────┐   │
│  │             Modular Monolith Backend               │   │
│  │   (auth | products | orders | payments | chat...)  │   │
│  └───────┬───────────────────────────┬───────────────┘   │
│          │                           │                   │
│  ┌───────▼──────┐           ┌────────▼──────┐           │
│  │   MongoDB     │           │    Redis       │           │
│  └──────────────┘           └───────────────┘           │
│                                                          │
└─────────────────────────────────────────────────────────┘
         │                  │                 │
    ┌────▼────┐        ┌────▼────┐       ┌────▼────┐
    │  Stripe  │        │Cloudinary│      │  Mapbox  │
    └─────────┘        └─────────┘       └─────────┘
```

**In-bounds:**
- All marketplace operations
- Delivery management
- Payment processing (via Stripe)
- Real-time features

**Out-of-bounds (external):**
- Stripe fraud detection
- Email delivery reliability (delegated to Resend)
- Image CDN (Cloudinary)
- Map rendering (Mapbox)

---

## 12. MVP Scope

> The minimum shippable version that demonstrates the full end-to-end flow.

- [x] User registration / login / token refresh
- [x] Seller onboarding with Stripe Connect
- [x] Product creation with variants and images
- [x] Inventory management (stock in/out)
- [x] Customer browsing and search
- [x] Cart (Redis, merge on login)
- [x] Checkout with Stripe Payment Intent
- [x] Stripe webhook order confirmation
- [x] Order management (seller confirms, prepares)
- [x] Rider registration and approval
- [x] Auto-assignment of rider via BullMQ
- [x] Delivery lifecycle tracking
- [x] Real-time order status via Socket.IO
- [x] Basic notifications (in-app)
- [x] Admin: seller approval, product moderation
- [x] Docker Compose local setup
- [x] Basic unit + integration tests

---

## 13. Production Scope

> Full feature set beyond MVP.

- Real-time delivery map (Mapbox + GPS)
- Customer ↔ Seller chat
- Customer ↔ Rider chat
- Coupon codes (seller-specific)
- Product reviews and ratings
- Seller revenue dashboard
- Seller withdrawal requests
- Admin analytics
- Audit logs
- Redis caching (products, categories, sessions)
- BullMQ jobs (email, invoice, stock alert, cleanup)
- API rate limiting
- Nginx + Docker horizontal scaling
- CI/CD (GitHub Actions)
- Prometheus + Grafana monitoring
- Sentry error tracking
- k6 load tests

---

## 14. Future Scope

> Not in scope for current project, but architecture must not prevent these.

- Mobile apps (React Native)
- Multi-language (i18n)
- Multi-currency
- Microservice extraction (payments, delivery as standalone services)
- AI product recommendations
- Seller advertising / promoted listings
- Subscription billing for sellers
- Automated tax calculation (Stripe Tax)
- B2B wholesale ordering
- Advanced fraud detection

---

## 15. Major Dependencies

```
Auth ──────────────────► All modules (JWT required)
Products ─────────────► Cart, Orders, Reviews, Inventory
Sellers ──────────────► Products, Inventory, Orders, Payments
Orders ───────────────► Payments, Delivery, Notifications
Payments (Stripe) ────► Orders, Seller Withdrawals
Delivery ─────────────► Orders, Riders, Real-time
Redis ────────────────► Cart, Cache, Socket.IO, BullMQ, Rate Limit
BullMQ ───────────────► Delivery Assignment, Email, Notifications
Socket.IO ────────────► Orders, Delivery, Chat, Notifications
```

---

## 16. Documentation Map

| Document | Status | Purpose |
|---|---|---|
| 00-PROJECT-PLAN.md | ✅ | Project overview and scope |
| 01-SYSTEM-ARCHITECTURE.md | ✅ | Architecture design |
| 02-DATABASE-DESIGN.md | ✅ | MongoDB schema |
| 03-API-ROUTE-DESIGN.md | ✅ | REST API endpoints |
| 04-AUTH-RBAC-DESIGN.md | ✅ | Authentication and authorization |
| 05-REALTIME-ARCHITECTURE.md | ✅ | Socket.IO design |
| 06-PAYMENT-ARCHITECTURE.md | ✅ | Stripe integration |
| 07-DELIVERY-ARCHITECTURE.md | ✅ | Delivery system |
| 08-CACHING-REDIS-DESIGN.md | ✅ | Redis strategy |
| 09-QUEUE-BULLMQ-DESIGN.md | ✅ | BullMQ jobs |
| 10-LOAD-BALANCER-DESIGN.md | ✅ | Nginx + scaling |
| 11-SECURITY-DESIGN.md | ✅ | Security architecture |
| 12-DEPLOYMENT-ARCHITECTURE.md | ✅ | Docker + CI/CD |
| 13-TESTING-STRATEGY.md | ✅ | Testing approach |
| 14-LOAD-TESTING-K6.md | ✅ | k6 scenarios |
| 15-MONITORING-OBSERVABILITY.md | ✅ | Observability stack |
| 16-IMPLEMENTATION-PLAN.md | ✅ | Phase-by-phase execution |
| adr/001 through 008 | ✅ | Architecture Decision Records |

---

## 17. Development Strategy

**Approach:** Vertical slices per phase
- Complete backend → frontend → test for each feature area before moving on
- Infrastructure (Docker, Nginx) set up early (Phase 1) so every phase can validate in a containerized environment
- Never add features for phases that are not yet started (prevent scope creep)

**Branching:** GitFlow
- `main` — production-ready code only
- `develop` — integration branch
- `feature/phase-N-feature-name` — feature branches
- `hotfix/*` — emergency production fixes

**Review Gates:**
Each phase has a Definition of Done checklist. Phase N cannot begin until Phase N-1 is marked Done.

---

## 18. Definition of Done

A feature is "Done" when:
- [ ] Implementation complete and code reviewed
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] API endpoints documented and match implementation
- [ ] No known bugs or regressions
- [ ] Error cases handled and tested
- [ ] Authorization rules enforced and tested
- [ ] No secrets in codebase
- [ ] Code merged to `develop`
