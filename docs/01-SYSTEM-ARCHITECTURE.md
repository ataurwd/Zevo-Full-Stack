# 01 — NEXORA System Architecture

## 1. Architecture Philosophy

NEXORA is built as a **Modular Monolith** — a single deployable backend binary composed of independent, well-bounded modules. Module communication happens through internal function calls and shared infrastructure (MongoDB, Redis), never through HTTP between modules in the initial version.

**Why Modular Monolith?**
- Single deployment unit reduces operational complexity at the start
- Internal function calls are faster and simpler than RPC
- Clean module boundaries enable future microservice extraction without a full rewrite
- Lower infrastructure overhead than Kubernetes + microservices from day one

**Extraction readiness:** Each module is designed with its own router, service layer, repository layer, validator, and types. Extracting a module to a microservice requires:
1. Moving the module directory to a new service
2. Replacing internal function calls with HTTP/gRPC calls
3. Setting up independent deployment

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           INTERNET                                   │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ HTTPS
                    ┌───────────▼─────────────┐
                    │       Nginx              │
                    │  • SSL/TLS termination  │
                    │  • Gzip compression     │
                    │  • Static file serving  │
                    │  • Rate limiting (L7)   │
                    │  • WebSocket upgrade    │
                    │  • Load balancing       │
                    └───────────┬─────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
    ┌─────────▼──────┐ ┌────────▼──────┐ ┌────────▼──────┐
    │  API Server #1  │ │  API Server #2 │ │  API Server N  │
    │  Express.js     │ │  Express.js   │ │  Express.js   │
    │  + Socket.IO    │ │  + Socket.IO  │ │  + Socket.IO  │
    │  + BullMQ Worker│ │  + BullMQ     │ │  + BullMQ     │
    └────────┬────────┘ └──────┬────────┘ └────────┬──────┘
             │                 │                   │
             └─────────────────┼───────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
┌───────▼──────┐      ┌────────▼───────┐     ┌───────▼──────┐
│   MongoDB     │      │     Redis      │     │   BullMQ     │
│  Replica Set  │      │  • Cache       │     │  (Redis-     │
│  (3 nodes)    │      │  • Pub/Sub     │     │   backed)    │
│               │      │  • Sessions    │     │              │
│               │      │  • Rate Limit  │     │              │
└───────────────┘      └────────────────┘     └──────────────┘
        │
        │ Atlas Search Index
        │ (Lucene full-text)

External Services:
┌──────────┐  ┌────────────┐  ┌──────────┐  ┌──────────┐
│  Stripe  │  │ Cloudinary │  │  Mapbox  │  │  Resend  │
└──────────┘  └────────────┘  └──────────┘  └──────────┘
```

---

## 3. Frontend Architecture

```
apps/frontend/
├── app/                        # Next.js App Router
│   ├── (public)/               # Public routes (no auth)
│   │   ├── page.tsx            # Homepage
│   │   ├── products/           # Product listing + detail
│   │   └── stores/             # Store pages
│   ├── (auth)/                 # Auth routes
│   │   ├── login/
│   │   ├── register/
│   │   └── verify-email/
│   ├── (customer)/             # Authenticated customer routes
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── orders/
│   │   └── profile/
│   ├── (seller)/               # Seller dashboard
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── inventory/
│   │   ├── orders/
│   │   └── settings/
│   ├── (rider)/                # Rider dashboard
│   │   ├── dashboard/
│   │   └── deliveries/
│   └── (admin)/                # Admin panel
│       ├── dashboard/
│       ├── sellers/
│       ├── products/
│       └── analytics/
├── components/
│   ├── ui/                     # Reusable UI primitives
│   ├── features/               # Feature-specific components
│   └── layouts/                # Layout components
├── hooks/                      # Custom React hooks
│   ├── useSocket.ts            # Socket.IO connection hook
│   ├── useCart.ts
│   └── useAuth.ts
├── lib/
│   ├── api/                    # API client functions
│   ├── socket/                 # Socket.IO event handlers
│   ├── store/                  # Client state (Zustand if needed)
│   └── utils/
└── providers/
    ├── QueryProvider.tsx       # TanStack Query
    ├── SocketProvider.tsx      # Socket.IO context
    └── AuthProvider.tsx        # Auth context
```

**State management strategy:**
- **Server state:** TanStack Query (caching, refetching, optimistic updates)
- **Client state:** React Context (auth) + local useState (UI state)
- **Access token:** stored in memory (React Context / module variable), NOT localStorage
- **Real-time events:** Socket.IO client, invalidates TanStack Query cache on events

---

## 4. Backend Architecture (Modular Monolith)

```
apps/backend/src/
├── app.ts                      # Express app setup, middleware registration
├── server.ts                   # HTTP server + Socket.IO init + graceful shutdown
├── modules/
│   ├── auth/
│   │   ├── auth.router.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.repository.ts
│   │   ├── auth.validator.ts
│   │   └── auth.types.ts
│   ├── users/
│   ├── sellers/
│   ├── stores/
│   ├── products/
│   ├── inventory/
│   ├── cart/
│   ├── orders/
│   ├── payments/
│   ├── delivery/
│   ├── chat/
│   ├── notifications/
│   ├── reviews/
│   ├── coupons/
│   ├── analytics/
│   └── admin/
├── shared/
│   ├── middleware/
│   │   ├── authenticate.ts     # JWT verification
│   │   ├── authorize.ts        # RBAC + permission check
│   │   ├── rateLimiter.ts      # Redis-backed rate limiter
│   │   ├── errorHandler.ts     # Global error handler
│   │   ├── requestLogger.ts    # Pino request logging
│   │   └── validate.ts         # Zod schema validator
│   ├── utils/
│   │   ├── response.ts         # Standard API response helpers
│   │   ├── pagination.ts       # Cursor/offset pagination utilities
│   │   └── asyncHandler.ts     # Express async wrapper
│   ├── errors/
│   │   ├── AppError.ts         # Base error class
│   │   └── errors.ts           # Typed error classes
│   └── types/
│       └── express.d.ts        # Express Request augmentation (user, role)
└── infrastructure/
    ├── db/
    │   ├── client.ts           # MongoDB client singleton
    │   └── collections.ts      # Typed collection getters
    ├── redis/
    │   ├── client.ts           # ioredis client singleton
    │   └── keys.ts             # Centralized Redis key patterns
    ├── queue/
    │   ├── queues.ts           # BullMQ queue definitions
    │   ├── workers/            # Job processor functions
    │   └── producers/          # Job enqueue helpers
    ├── socket/
    │   ├── io.ts               # Socket.IO server setup + Redis adapter
    │   ├── middleware/         # Socket auth middleware
    │   └── handlers/           # Event handlers per module
    └── storage/
        └── cloudinary.ts       # Cloudinary upload helper
```

---

## 5. Module Boundaries and Communication

```
Rule: Modules communicate by importing service functions — NEVER by importing
      another module's controller or repository directly.

          ┌──────────────┐
          │ order.service│
          └──────┬───────┘
                 │ calls
    ┌────────────▼──────────────────────┐
    │ inventory.service.decrementStock()│  ← OK: service-to-service
    │ payment.service.createIntent()    │  ← OK
    │ notification.service.send()       │  ← OK
    └───────────────────────────────────┘

    ❌ NEVER: order.controller → inventory.repository directly
    ❌ NEVER: circular dependencies between modules
```

**Dependency direction (strict):**
```
admin → (all)
analytics → (read-only on all)
orders → inventory, payments, notifications, delivery
payments → orders
delivery → orders, notifications, riders
chat → users, orders
notifications → users
reviews → products, orders
coupons → sellers
cart → products
products → categories
```

---

## 6. Request Lifecycle

```
Client Request
     │
     ▼
Nginx (SSL termination, gzip, rate limit headers)
     │
     ▼
Express App
     │
     ├─ Global middleware (Helmet, CORS, body parser, request logger)
     │
     ├─ Router (e.g., /api/v1/orders)
     │
     ├─ Route middleware:
     │    ├─ authenticate()     → verifies JWT, attaches req.user
     │    ├─ authorize(role)    → checks role
     │    ├─ hasPermission()    → checks fine-grained permission
     │    ├─ rateLimiter()      → Redis sliding window check
     │    └─ validate(schema)   → Zod validation
     │
     ├─ Controller
     │    ├─ Extracts validated input from req
     │    ├─ Calls service layer
     │    └─ Returns standard response
     │
     ├─ Service Layer
     │    ├─ Business logic
     │    ├─ Calls repository layer
     │    ├─ Calls other service modules
     │    ├─ Interacts with Redis (cache read/write)
     │    └─ Enqueues BullMQ jobs if needed
     │
     ├─ Repository Layer
     │    ├─ MongoDB operations only
     │    └─ No business logic
     │
     └─ Response → Controller → Client
```

---

## 7. Authentication Flow

```
┌──────────┐          ┌────────────┐         ┌────────────┐
│  Client  │          │  Express   │         │  MongoDB   │
└────┬─────┘          └─────┬──────┘         └─────┬──────┘
     │                      │                      │
     │  POST /auth/login     │                      │
     │─────────────────────►│                      │
     │                      │  Find user by email  │
     │                      │─────────────────────►│
     │                      │  User + hashed pw    │
     │                      │◄─────────────────────│
     │                      │                      │
     │                      │  bcrypt.compare()    │
     │                      │  Generate tokens     │
     │                      │                      │
     │  access_token (body) │                      │
     │  refresh_token (HttpOnly cookie)             │
     │◄─────────────────────│                      │
     │                      │                      │
     │  (15 min expires)    │                      │
     │  POST /auth/refresh  │                      │
     │  Cookie: refresh_token                       │
     │─────────────────────►│                      │
     │                      │  Verify refresh JWT  │
     │                      │  Rotate tokens       │
     │  new access_token    │                      │
     │◄─────────────────────│                      │
```

---

## 8. Socket.IO Flow

```
Client (browser)
    │
    │ WebSocket upgrade request (with access token in handshake auth)
    ▼
Nginx (WebSocket proxy, sticky session via ip_hash)
    │
    ▼
API Server Instance (e.g., #2)
    │
    ├─ Socket.IO auth middleware verifies JWT
    │
    ├─ Client joins rooms:
    │   ├─ user:{userId}          (personal notifications)
    │   ├─ order:{orderId}        (when viewing an order)
    │   └─ delivery:{taskId}      (when tracking a delivery)
    │
    ▼
Redis Pub/Sub Adapter
    │
    │ When server #1 emits to room "order:abc123", Redis
    │ broadcasts to all servers. Server #2 forwards to
    │ clients connected to it who are in that room.
    ▼
Other API Server Instances
```

---

## 9. Payment Flow (Summary)

```
Customer → POST /orders (reserve inventory, create order PENDING)
         → POST /payments/checkout (create Stripe Payment Intent)
         → Stripe hosted checkout OR client-side confirm
         → Stripe → POST /payments/webhook (AUTHORITATIVE)
         → Webhook handler:
             ├─ Verify Stripe signature
             ├─ Update order status: PENDING → CONFIRMED
             ├─ Trigger seller notification (BullMQ)
             └─ Trigger delivery assignment (BullMQ)
```

---

## 10. Failure Handling

| Scenario | Handling |
|---|---|
| MongoDB connection loss | Retry with exponential backoff; health endpoint returns 503 |
| Redis connection loss | Degrade gracefully: skip cache, continue with DB; rate limiting falls back to in-memory |
| BullMQ worker failure | Job retried with exponential backoff (configurable per queue); dead-letter after max retries |
| Stripe webhook failure | Return 200 immediately after signature verification; process async via BullMQ |
| Socket.IO disconnect | Client auto-reconnects with exponential backoff; events missed during disconnect delivered via polling on reconnect |
| Nginx upstream unavailable | Health check removes unhealthy instances; Nginx returns 502; alerts fired |
| Inventory race condition | MongoDB atomic `findOneAndUpdate` with `$inc` + `$where: stock >= quantity` |
| Payment-order mismatch | Stripe webhook is source of truth; periodic reconciliation job checks for inconsistencies |

---

## 11. Horizontal Scaling Strategy

```
Current (single instance):
  Nginx → API #1 → MongoDB + Redis

Phase 1 scale-out (2-3 instances):
  Nginx (ip_hash) → [API #1, API #2] → MongoDB Replica Set + Redis

Full horizontal scale:
  Nginx (upstream pool) → [API #1..N]
  Socket.IO: Redis Pub/Sub adapter (all instances share event bus)
  BullMQ: Multiple instances consume from same Redis queues
  MongoDB: Replica set for reads, primary for writes
  Redis: Single instance (or Redis Cluster for very high throughput)
```

**Statelessness requirements:**
- No server-local state (no in-memory sessions)
- JWT is stateless; refresh token in cookie verified against Redis blacklist on logout
- Socket.IO connections are ephemeral; room membership re-established on reconnect
- BullMQ jobs are idempotent

---

## 12. Future Microservice Extraction Strategy

When a specific module needs independent scaling or deployment:

```
Current (module in monolith):
  orders.service → inventory.service.decrementStock()

After extraction (microservice):
  order-service (HTTP/gRPC) → inventory-service
  ↑ Message queue as async bridge if needed (e.g., RabbitMQ)
```

**Extraction order recommendation (by expected load):**
1. `products` + `inventory` (highest read traffic)
2. `delivery` (real-time location, independent scaling)
3. `payments` (strict isolation, audit requirements)
4. `chat` + `notifications` (high Socket.IO connection count)

**Prerequisites before extraction:**
- Comprehensive integration test suite
- Defined service API contracts
- Service mesh or API gateway
- Distributed tracing (OpenTelemetry)
