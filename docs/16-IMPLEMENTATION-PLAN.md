# 16 — NEXORA Implementation Plan

## Implementation Principles

1. **Phase-gated:** Phase N cannot begin until Phase N-1 Definition of Done is met.
2. **Vertical slices:** Complete backend → integration test → frontend for each feature.
3. **No forward dependencies:** Do not build Phase 7 (Orders) infrastructure in Phase 4 (Products).
4. **Scope control:** Each phase lists explicitly what must NOT be built yet.

---

## Phase 0 — Architecture & Documentation

**Goal:** Complete system design. No code written except configuration.

**START CONDITION:** Project requirements finalized.

### Tasks
- [x] Architectural decisions made (all 11 decisions documented)
- [x] 00-PROJECT-PLAN.md complete
- [x] 01-SYSTEM-ARCHITECTURE.md complete
- [x] 02-DATABASE-DESIGN.md complete
- [x] 03-API-ROUTE-DESIGN.md complete
- [x] 04-AUTH-RBAC-DESIGN.md complete
- [x] 05-REALTIME-ARCHITECTURE.md complete
- [x] 06-PAYMENT-ARCHITECTURE.md complete
- [x] 07-DELIVERY-ARCHITECTURE.md complete
- [x] 08-CACHING-REDIS-DESIGN.md complete
- [x] 09-QUEUE-BULLMQ-DESIGN.md complete
- [x] 10-LOAD-BALANCER-DESIGN.md complete
- [x] 11-SECURITY-DESIGN.md complete
- [x] 12-DEPLOYMENT-ARCHITECTURE.md complete
- [x] 13-TESTING-STRATEGY.md complete
- [x] 14-LOAD-TESTING-K6.md complete
- [x] 15-MONITORING-OBSERVABILITY.md complete
- [x] ADR documents complete (adr/001-008)
- [x] README.md complete
- [x] .env.example complete

**DONE CONDITION:** All documentation reviewed and approved.  
**NOT YET:** No application code, no Docker setup, no frontend.

---

## Phase 1 — Foundation & Infrastructure

**Goal:** Repository structure, tooling, Docker, and empty skeleton that runs.

**START CONDITION:** Phase 0 complete.

### Infrastructure Tasks
- [ ] Create monorepo structure (`apps/backend`, `apps/frontend`, `infra/`, `docs/`)
- [ ] `docker-compose.yml` with MongoDB (replica set), Redis, and placeholder API service
- [ ] MongoDB replica set initialization script
- [ ] Nginx config (dev) — reverse proxy to API and frontend
- [ ] `.gitignore`, `.dockerignore`, `tsconfig.json` (root)

### Backend Tasks
- [ ] Initialize Express + TypeScript project (`apps/backend`)
- [ ] Install dependencies: express, typescript, zod, pino, ioredis, mongodb, bullmq, socket.io, helmet, cors, jsonwebtoken, bcryptjs, stripe, multer, cloudinary
- [ ] `src/app.ts` — Express app with global middleware (Helmet, CORS, body parser, request logger)
- [ ] `src/server.ts` — HTTP server + graceful shutdown
- [ ] `infrastructure/db/client.ts` — MongoDB client singleton with retry
- [ ] `infrastructure/redis/client.ts` — ioredis client singleton
- [ ] `infrastructure/redis/keys.ts` — centralized key patterns
- [ ] `infrastructure/logger.ts` — Pino setup
- [ ] `shared/errors/AppError.ts` — base error class
- [ ] `shared/errors/errors.ts` — typed error classes (NotFoundError, ForbiddenError, etc.)
- [ ] `shared/utils/response.ts` — standard API response helpers
- [ ] `shared/utils/asyncHandler.ts` — Express async wrapper
- [ ] `shared/middleware/errorHandler.ts` — global error handler
- [ ] `shared/middleware/validate.ts` — Zod middleware
- [ ] Health check endpoints: `/api/v1/health/live` and `/api/v1/health/ready`
- [ ] API router setup (`/api/v1`)

### Frontend Tasks
- [ ] Initialize Next.js 14 App Router project (`apps/frontend`)
- [ ] Install dependencies: tailwindcss, @tanstack/react-query, react-hook-form, zod, socket.io-client, recharts
- [ ] `providers/QueryProvider.tsx` — TanStack Query setup
- [ ] Global layout with font + base styles
- [ ] Empty homepage placeholder

### Testing Tasks
- [ ] Configure Vitest for backend
- [ ] Write test for health endpoint (smoke test)
- [ ] Verify `docker-compose up` starts without errors
- [ ] Verify MongoDB replica set is initialized
- [ ] Verify Redis connection succeeds on startup

**DONE CONDITION:**
- [ ] `docker-compose up` starts all services without errors
- [ ] `GET /api/v1/health/ready` returns `{ mongodb: "up", redis: "up" }`
- [ ] Frontend loads at localhost:3000
- [ ] All health tests pass
- [ ] No TypeScript errors

**NOT YET:** No auth, no business modules, no real API routes.

---

## Phase 2 — Authentication

**Goal:** Complete auth system — register, login, refresh, logout, password reset.

**START CONDITION:** Phase 1 complete, Docker stack running.

### Backend Tasks
- [ ] `modules/auth/auth.router.ts`
- [ ] `modules/auth/auth.controller.ts`
- [ ] `modules/auth/auth.service.ts`
- [ ] `modules/auth/auth.repository.ts`
- [ ] `modules/auth/auth.validator.ts` (Zod schemas)
- [ ] `modules/auth/auth.types.ts`
- [ ] `modules/users/users.repository.ts` (findByEmail, createUser, updateUser)
- [ ] JWT utility: `generateAccessToken`, `generateRefreshToken`, `verifyToken`
- [ ] `shared/middleware/authenticate.ts` — JWT access token middleware
- [ ] `shared/middleware/authorize.ts` — RBAC role middleware
- [ ] Email verification token generation + Redis storage
- [ ] Password reset token + Redis storage
- [ ] Rate limiting middleware (Redis sliding window)
- [ ] Apply rate limiter to auth routes
- [ ] Audit log: `user.login`, `user.logout`, `user.password_changed`

### Queue Tasks
- [ ] BullMQ setup: `infrastructure/queue/queues.ts`
- [ ] Email queue + worker (using Resend)
- [ ] Email templates: verification, password reset
- [ ] Enqueue verification email on register
- [ ] Enqueue password reset email

### Frontend Tasks
- [ ] Auth pages: `/login`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password`
- [ ] `AuthProvider.tsx` — stores access token in memory
- [ ] `useAuth` hook
- [ ] `api/auth.ts` — login, register, refresh, logout API calls
- [ ] Axios/fetch interceptor — auto-refresh on 401
- [ ] Protected route wrapper
- [ ] Redirect to dashboard after login (by role)

### Testing Tasks
- [ ] Unit: JWT generation + verification
- [ ] Unit: password hashing + comparison
- [ ] Unit: rate limiter logic
- [ ] Integration: `POST /auth/register` — success case
- [ ] Integration: `POST /auth/register` — duplicate email → 409
- [ ] Integration: `POST /auth/login` — success
- [ ] Integration: `POST /auth/login` — wrong password → 401
- [ ] Integration: `POST /auth/refresh` — valid cookie → new access token
- [ ] Integration: `POST /auth/logout` — token blacklisted
- [ ] Integration: rate limit after 10 login attempts
- [ ] Integration: email verification flow end-to-end

**DONE CONDITION:**
- [ ] All auth endpoints working
- [ ] Email verification flow working (verified with real email in staging)
- [ ] Token refresh working
- [ ] Rate limiting enforced on auth routes
- [ ] All auth integration tests passing
- [ ] Frontend login → dashboard redirect working

**NOT YET:** No seller/product/order features.

---

## Phase 3 — User Profiles & Addresses

**Goal:** User profile management and address book.

**START CONDITION:** Phase 2 complete.

### Backend Tasks
- [ ] `modules/users/users.router.ts`
- [ ] `modules/users/users.controller.ts`
- [ ] `modules/users/users.service.ts`
- [ ] Cloudinary integration (`infrastructure/storage/cloudinary.ts`)
- [ ] Avatar upload endpoint
- [ ] Address CRUD endpoints

### Frontend Tasks
- [ ] Profile page
- [ ] Address book page
- [ ] Avatar upload UI

**DONE CONDITION:**
- [ ] Profile update working
- [ ] Avatar upload to Cloudinary working
- [ ] Address CRUD working

---

## Phase 4 — Seller Onboarding & Store Management

**Goal:** Seller registration, Stripe Connect onboarding, store creation.

**START CONDITION:** Phase 2 complete. Stripe account configured.

### Backend Tasks
- [ ] `modules/sellers/sellers.router.ts`
- [ ] `modules/sellers/sellers.controller.ts`
- [ ] `modules/sellers/sellers.service.ts`
- [ ] `modules/sellers/sellers.repository.ts`
- [ ] Stripe Connect: create Express Connected Account
- [ ] Stripe Connect: generate onboarding link (`/sellers/onboard`)
- [ ] Stripe webhook handler: `account.updated` → update `stripe_onboarding_complete`
- [ ] Seller status gate middleware
- [ ] `modules/stores/stores.router.ts`, controller, service, repository
- [ ] Store creation (after seller approved)
- [ ] Store logo/banner upload (Cloudinary)
- [ ] Admin: seller approval/rejection endpoints
- [ ] Audit log: seller.approved, seller.rejected
- [ ] BullMQ: email on seller approved/rejected

### Frontend Tasks
- [ ] Seller registration flow
- [ ] Stripe Connect redirect flow
- [ ] Seller dashboard layout (empty)
- [ ] Store settings page
- [ ] Admin: seller list + approval UI

**DONE CONDITION:**
- [ ] Seller can register and start Stripe Connect onboarding
- [ ] Admin can approve/reject seller
- [ ] Approved seller can create store
- [ ] Store logo/banner upload working

**NOT YET:** No products, no inventory.

---

## Phase 5 — Categories & Products

**Goal:** Category management, product CRUD with variants and image upload.

**START CONDITION:** Phase 4 complete.

### Backend Tasks
- [ ] `modules/categories/` — full CRUD (admin only for create/edit)
- [ ] `modules/products/products.router.ts`
- [ ] `modules/products/products.controller.ts`
- [ ] `modules/products/products.service.ts`
- [ ] `modules/products/products.repository.ts`
- [ ] Product create/update/delete (seller)
- [ ] Product image upload (multiple, Cloudinary)
- [ ] Product variant management (add/update/remove)
- [ ] Product status state machine (draft → pending_review → approved)
- [ ] Admin: product approve/reject/suspend
- [ ] Product seller isolation (verify ownership before every operation)
- [ ] MongoDB Atlas Search index setup (on products collection)
- [ ] Public browse endpoint with Atlas Search + filters
- [ ] Redis cache: product detail, category tree
- [ ] Cache invalidation on product update/status change

### Frontend Tasks
- [ ] Public: product listing page (with search + filters)
- [ ] Public: product detail page (with variants)
- [ ] Public: category browse
- [ ] Seller: product list page
- [ ] Seller: create/edit product form (React Hook Form + Zod)
- [ ] Seller: image upload UI
- [ ] Seller: variant management UI
- [ ] Admin: product moderation queue
- [ ] Category navigation component

### Testing Tasks
- [ ] Unit: product status transitions
- [ ] Integration: product CRUD (seller can CRUD own, not others')
- [ ] Integration: Atlas Search returns results
- [ ] Integration: Redis cache hit on second product detail request
- [ ] Security: Seller A cannot update Seller B's product → 403

**DONE CONDITION:**
- [ ] Sellers can create products with variants and images
- [ ] Products require admin approval before going live
- [ ] Customers can browse and search products
- [ ] Redis caching active for products

**NOT YET:** No inventory tracking, no cart, no orders.

---

## Phase 6 — Inventory Management

**Goal:** SKU-level stock tracking, inventory transactions.

**START CONDITION:** Phase 5 complete.

### Backend Tasks
- [ ] `modules/inventory/inventory.router.ts`
- [ ] `modules/inventory/inventory.controller.ts`
- [ ] `modules/inventory/inventory.service.ts`
- [ ] `modules/inventory/inventory.repository.ts`
- [ ] Auto-create inventory record when product variant is created (quantity: 0)
- [ ] Restock/adjustment endpoints (seller)
- [ ] Inventory transaction logging
- [ ] Low stock alert check function
- [ ] BullMQ: `inventory.alert` queue + worker
- [ ] Admin inventory overview

### Frontend Tasks
- [ ] Seller: inventory list page (SKU, quantity, threshold)
- [ ] Seller: restock form
- [ ] Seller: transaction history
- [ ] Low stock badge in product list

**DONE CONDITION:**
- [ ] Inventory auto-created with products
- [ ] Seller can restock
- [ ] Inventory transaction history accurate
- [ ] Low stock alerts triggered correctly

---

## Phase 7 — Cart

**Goal:** Redis-backed cart for guests and authenticated users, merge on login.

**START CONDITION:** Phase 5 complete (need product data for cart items).

### Backend Tasks
- [ ] `modules/cart/cart.router.ts`
- [ ] `modules/cart/cart.controller.ts`
- [ ] `modules/cart/cart.service.ts`
- [ ] Guest session token (cookie, UUID)
- [ ] Cart CRUD in Redis
- [ ] Cart merge on login (`POST /cart/merge`)
- [ ] Cart validation (`POST /cart/validate`) — check prices and stock
- [ ] Coupon validation endpoint
- [ ] Cart TTL management (rolling)

### Frontend Tasks
- [ ] Cart page
- [ ] Cart drawer/sidebar component
- [ ] Add to cart button on product pages
- [ ] Quantity controls
- [ ] Coupon input
- [ ] Cart total calculation display

**DONE CONDITION:**
- [ ] Guest cart persists in Redis across page refreshes
- [ ] Cart merges correctly on login
- [ ] Cart validation checks current prices and stock
- [ ] Cart expires after 7 days (guest) / 30 days (user)

---

## Phase 8 — Orders

**Goal:** Order creation with inventory reservation, order lifecycle management.

**START CONDITION:** Phases 6 + 7 complete.

### Backend Tasks
- [ ] `modules/orders/orders.router.ts`
- [ ] `modules/orders/orders.controller.ts`
- [ ] `modules/orders/orders.service.ts`
- [ ] `modules/orders/orders.repository.ts`
- [ ] `modules/orders/sub_orders.repository.ts`
- [ ] Order creation: MongoDB transaction (inventory decrement + order create)
- [ ] Sub-order creation per seller
- [ ] Stripe Payment Intent creation
- [ ] Return client_secret to frontend
- [ ] Seller: confirm/preparing/ready_for_pickup status transitions
- [ ] Customer: cancel order (before confirmed)
- [ ] Order cancellation: inventory release transaction
- [ ] Order number generation (sequential, e.g., NX-2024-00001)
- [ ] Admin: order overview

### Frontend Tasks
- [ ] Checkout page (address selection, summary)
- [ ] Stripe Elements (payment form)
- [ ] Order confirmation page
- [ ] Customer: order list + detail
- [ ] Seller: order list + detail + status update buttons
- [ ] Admin: order list

### Testing Tasks
- [ ] Integration: create order → inventory reserved atomically
- [ ] Integration: cancel order → inventory released
- [ ] Integration: concurrent orders beyond stock → only N succeed (race condition test)
- [ ] Unit: order total calculation with coupon + delivery fee

**DONE CONDITION:**
- [ ] Order creates with inventory reservation
- [ ] Concurrent order test: stock can never go below 0
- [ ] Seller can update sub-order status
- [ ] Customer can cancel pending order

---

## Phase 9 — Payments (Stripe)

**Goal:** Complete Stripe checkout, webhook processing, seller transfers.

**START CONDITION:** Phase 8 complete. Stripe Connect accounts working.

### Backend Tasks
- [ ] Stripe webhook endpoint (`POST /payments/webhook`) with raw body
- [ ] Stripe signature verification
- [ ] BullMQ: `payment.webhook` queue + worker
- [ ] Webhook idempotency check (event_id)
- [ ] `payment_intent.succeeded` → confirm order, release inventory reservation
- [ ] `payment_intent.payment_failed` → cancel order, release inventory
- [ ] BullMQ: `payment.transfer` queue → Stripe Connect transfers per sub_order
- [ ] Payment record creation
- [ ] Seller earnings update
- [ ] Admin: initiate refund

### Frontend Tasks
- [ ] Payment success redirect page
- [ ] Payment failure page
- [ ] Order status polling (TanStack Query refetch)

### Testing Tasks
- [ ] Integration: simulate webhook `payment_intent.succeeded` → order confirmed
- [ ] Integration: duplicate webhook → processed only once
- [ ] Integration: invalid signature → rejected
- [ ] Integration: failed payment → inventory released
- [ ] Security: amount never trusted from client

**DONE CONDITION:**
- [ ] Full checkout flow works end-to-end
- [ ] Webhook processes within 2 seconds
- [ ] Duplicate webhooks are idempotent
- [ ] Seller pending_balance updated after transfer

---

## Phase 10 — Notifications & Real-Time (Socket.IO)

**Goal:** Socket.IO server, Redis adapter, order/delivery events.

**START CONDITION:** Phases 8 + 9 complete.

### Backend Tasks
- [ ] Socket.IO server setup (`infrastructure/socket/io.ts`)
- [ ] Redis Pub/Sub adapter
- [ ] Socket.IO auth middleware (JWT from handshake)
- [ ] Room management: `user:`, `order:`, `delivery:`, `chat:` rooms
- [ ] Event emission in order service: `order:created`, `order:confirmed`, `order:cancelled`
- [ ] Event emission in sub-order service: `suborder:new`, `order:preparing`, `order:ready_for_pickup`
- [ ] `notification.worker.ts` — emit `notification:new` via Socket.IO
- [ ] In-app notification storage (MongoDB)
- [ ] Notification CRUD endpoints

### Frontend Tasks
- [ ] `SocketProvider.tsx` — Socket.IO client context
- [ ] `useSocket` hook
- [ ] Order status real-time update on order detail page
- [ ] Notification bell component (unread count, dropdown)
- [ ] Toast notification on new events

**DONE CONDITION:**
- [ ] Order status updates appear in real-time without page refresh
- [ ] Notifications appear instantly in bell icon
- [ ] Socket.IO works with 2 API server instances (Redis adapter test)

---

## Phase 11 — Delivery System

**Goal:** Rider management, auto-assignment, delivery state machine.

**START CONDITION:** Phase 9 complete (need confirmed orders to trigger delivery).

### Backend Tasks
- [ ] `modules/delivery/delivery.router.ts`
- [ ] `modules/delivery/delivery.controller.ts`
- [ ] `modules/delivery/delivery.service.ts`
- [ ] `modules/delivery/delivery.repository.ts`
- [ ] Rider registration + admin approval
- [ ] Rider online/offline toggle
- [ ] Delivery task creation (triggered after payment confirmed)
- [ ] BullMQ: `delivery.assign` queue + worker (proximity-based)
- [ ] Delivery state machine transitions
- [ ] Rider location update (GPS → Redis → Socket.IO broadcast)
- [ ] Delivery task assignment with Redis lock (prevent double-assignment)
- [ ] Assignment timeout + reassignment (BullMQ delayed job)
- [ ] Rider earnings update on delivery

### Frontend Tasks
- [ ] Rider dashboard (task list, accept/deliver buttons)
- [ ] Customer: delivery tracking page (Mapbox + live rider location)
- [ ] Rider: GPS location broadcasting
- [ ] Admin: rider management + delivery overview

### Socket.IO Events (additional)
- [ ] `delivery:assigned`, `delivery:picked_up`, `delivery:delivered`
- [ ] `delivery:location_updated` → Mapbox marker update
- [ ] `delivery:task_assigned` → toast on rider app

**DONE CONDITION:**
- [ ] Full delivery lifecycle from task creation to delivery
- [ ] Rider location appears live on customer map
- [ ] Auto-assignment works correctly with multiple online riders
- [ ] Assignment timeout and reassignment works

---

## Phase 12 — Chat

**Goal:** Real-time chat between customers ↔ sellers and customers ↔ riders.

**START CONDITION:** Phase 10 complete (Socket.IO infrastructure ready).

### Backend Tasks
- [ ] `modules/chat/chat.router.ts`
- [ ] `modules/chat/chat.controller.ts`
- [ ] `modules/chat/chat.service.ts`
- [ ] Conversation creation (auto-created when order confirmed)
- [ ] Message send endpoint + Socket.IO broadcast
- [ ] Typing indicators (`chat:typing_start`, `chat:typing_stop`)
- [ ] Read receipts (`chat:message_read`)
- [ ] Conversation participant validation
- [ ] Message history (paginated)

### Frontend Tasks
- [ ] Chat window component
- [ ] Message list + input
- [ ] Typing indicator UI
- [ ] Read receipt display
- [ ] Chat access from order detail page

**DONE CONDITION:**
- [ ] Real-time messaging between buyer and seller
- [ ] Typing indicators work
- [ ] Read receipts work
- [ ] Messages persist (available after page refresh)

---

## Phase 13 — Reviews & Coupons

**Goal:** Product reviews (post-delivery), seller coupon management.

**START CONDITION:** Phase 11 complete (need delivered orders for reviews).

### Backend Tasks
- [ ] `modules/reviews/` — CRUD, seller reply, admin delete
- [ ] Review eligibility: only delivered sub_order holders can review
- [ ] One review per sub_order (unique index)
- [ ] Product rating recalculation on new review
- [ ] `modules/coupons/` — seller CRUD, validate coupon at cart
- [ ] Coupon usage tracking (atomic increment usage_count)
- [ ] Apply coupon in order total calculation

### Frontend Tasks
- [ ] Review form on delivered order
- [ ] Product detail: review list
- [ ] Seller: reply to reviews
- [ ] Coupon management page (seller)

**DONE CONDITION:**
- [ ] Reviews only possible on delivered orders
- [ ] Ratings update on new review
- [ ] Coupons apply correctly with min/max rules

---

## Phase 14 — Analytics

**Goal:** Seller revenue dashboard, admin platform analytics.

**START CONDITION:** Phases 9 + 11 complete (need real order/payment data).

### Backend Tasks
- [ ] `modules/analytics/analytics.router.ts`
- [ ] Seller analytics: revenue over time, top products, order volume
- [ ] Admin analytics: GMV, platform revenue, seller rankings
- [ ] MongoDB aggregation pipelines for analytics queries
- [ ] Date range filtering

### Frontend Tasks
- [ ] Seller: revenue chart (Recharts)
- [ ] Seller: top products table
- [ ] Admin: platform overview cards
- [ ] Admin: revenue line chart

**DONE CONDITION:**
- [ ] Analytics data is accurate and matches order records
- [ ] Date range filtering works

---

## Phase 15 — Seller Withdrawals & Audit Logs

**Goal:** Seller payout requests, complete audit trail.

**START CONDITION:** Phase 9 complete.

### Backend Tasks
- [ ] Withdrawal request endpoint (seller)
- [ ] BullMQ: `payment.withdrawal` queue + worker (Stripe payout to connected account)
- [ ] Admin: withdrawal management
- [ ] Audit log middleware (automatic for defined events)
- [ ] Admin: audit log viewer endpoint

### Frontend Tasks
- [ ] Seller: withdrawal request form + history
- [ ] Admin: withdrawal management
- [ ] Admin: audit log viewer

---

## Phase 16 — Redis & Performance Hardening

**Goal:** Complete Redis caching, rate limiting hardening, performance review.

**START CONDITION:** All feature phases (2-15) complete.

### Tasks
- [ ] Verify all Redis cache keys are implemented per `08-CACHING-REDIS-DESIGN.md`
- [ ] Verify cache invalidation on all write operations
- [ ] Redis cache metrics (hit/miss counters) wired to Prometheus
- [ ] Rate limiting verified on all route categories
- [ ] Add MongoDB indexes that are missing (run explain() on slow queries)
- [ ] Profile and optimize slow queries
- [ ] Review and optimize BullMQ job concurrency settings

---

## Phase 17 — Security Hardening

**Goal:** Production security review and remediation.

**START CONDITION:** All feature phases complete.

### Tasks
- [ ] Run through the security checklist in `11-SECURITY-DESIGN.md`
- [ ] Helmet configuration audit
- [ ] CORS restricted to exact allowed origins
- [ ] All Zod schemas use `.strict()` or explicit field picking
- [ ] MongoDB TLS configured for production
- [ ] Secrets rotation plan documented
- [ ] OWASP Top 10 self-assessment
- [ ] Penetration: attempt IDOR on orders, products, deliveries
- [ ] Penetration: attempt privilege escalation via request body
- [ ] Penetration: attempt Stripe webhook bypass

---

## Phase 18 — Docker, Nginx, CI/CD

**Goal:** Production-ready containerization and deployment pipeline.

**START CONDITION:** Security hardening complete.

### Tasks
- [ ] Multi-stage Dockerfiles (backend + frontend) reviewed and optimized
- [ ] `docker-compose.prod.yml` with all production settings
- [ ] Nginx production config (SSL, HSTS, gzip, WebSocket)
- [ ] Let's Encrypt setup (certbot)
- [ ] GitHub Actions CI workflow (lint, typecheck, test)
- [ ] GitHub Actions CD workflow (build, push, deploy)
- [ ] Rollback procedure documented and tested
- [ ] Smoke test after deployment (automated)

---

## Phase 19 — Load Testing & Performance Validation

**Goal:** Run k6 tests, validate performance, identify and fix bottlenecks.

**START CONDITION:** Staging environment deployed.

### Tasks
- [ ] k6 smoke test passes
- [ ] k6 product browse at 100 VUs — record baseline metrics
- [ ] k6 product browse at 500 VUs — verify degradation is acceptable
- [ ] k6 order creation concurrent test — verify no inventory race conditions
- [ ] k6 auth stress test
- [ ] Analyze MongoDB slow query log during tests
- [ ] Optimize based on findings
- [ ] Update `14-LOAD-TESTING-K6.md` with actual results

---

## Phase 20 — Monitoring & Production Readiness

**Goal:** Full observability stack, alerting, and production go-live checklist.

**START CONDITION:** Phase 18 complete, staging validated.

### Tasks
- [ ] Prometheus + Grafana deployed and dashboards configured
- [ ] Sentry configured and receiving errors
- [ ] Health check alerts set up
- [ ] Payment failure alert set up
- [ ] Queue depth alert set up
- [ ] Uptime monitoring (external)
- [ ] On-call runbook documented
- [ ] Backup strategy verified (MongoDB Atlas)
- [ ] SSL certificate renewal tested
- [ ] Production environment variables set
- [ ] Final DONE checklist reviewed

### Production Go-Live Checklist
- [ ] All Phase 20 tasks complete
- [ ] All integration tests pass on production
- [ ] k6 baseline test passes on production
- [ ] Monitoring dashboards show healthy metrics
- [ ] Stripe live mode configured and tested (small transaction)
- [ ] SSL certificate valid
- [ ] Domain DNS configured
- [ ] All secrets rotated from development values
- [ ] Error tracking (Sentry) receiving data
- [ ] Alert rules active

---

## Dependency Graph

```
Phase 0 (Docs)
    │
Phase 1 (Foundation)
    │
Phase 2 (Auth)
    │
    ├──────────────────────────┐
Phase 3 (Profiles)      Phase 4 (Sellers)
                               │
                         Phase 5 (Products)
                               │
                     ┌─────────┴─────────┐
              Phase 6 (Inventory)  Phase 7 (Cart)
                     │                   │
                     └────────┬──────────┘
                        Phase 8 (Orders)
                               │
                         Phase 9 (Payments)
                               │
               ┌───────────────┼──────────────┐
       Phase 10 (RT/Notif)  Phase 11 (Delivery) Phase 13 (Reviews/Coupons)
               │                   │
       Phase 12 (Chat)      (contributes to Phase 13)
                               │
                         Phase 14 (Analytics)
                               │
                         Phase 15 (Withdrawals)
                               │
               ┌───────────────┼──────────────┐
       Phase 16 (Redis)  Phase 17 (Security)  │
               └───────────────┤              │
                         Phase 18 (DevOps)    │
                               │              │
                         Phase 19 (Load Test) │
                               │              │
                         Phase 20 (Production Go-Live)
```
