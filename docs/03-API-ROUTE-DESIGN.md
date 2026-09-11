# 03 — NEXORA API Route Design

## 1. API Conventions

### Base URL
```
/api/v1
```

### Standard Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional human-readable message"
}
```

### Standard Error Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error message",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

### Pagination Format (Offset-based)
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 143,
      "total_pages": 8,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

### HTTP Status Conventions
| Status | Usage |
|---|---|
| 200 | Successful GET, PUT, PATCH |
| 201 | Successful POST (resource created) |
| 204 | Successful DELETE (no body) |
| 400 | Validation error, bad request |
| 401 | Not authenticated |
| 403 | Authenticated but not authorized |
| 404 | Resource not found |
| 409 | Conflict (duplicate, insufficient stock) |
| 422 | Business rule violation |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
| 503 | Service unavailable |

### Rate Limit Categories
| Category | Limit | Window |
|---|---|---|
| `auth` | 10 req | 15 min per IP |
| `write` | 60 req | 1 min per user |
| `read` | 300 req | 1 min per user |
| `public` | 100 req | 1 min per IP |
| `upload` | 20 req | 1 min per user |
| `webhook` | Unlimited (verified by signature) | — |

### Authentication
Routes marked `[AUTH]` require `Authorization: Bearer <access_token>` header.  
Routes marked `[PUBLIC]` do not require authentication.

---

## 2. Auth Routes `/api/v1/auth`

| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| POST | `/register` | PUBLIC | — | Register new user |
| POST | `/login` | PUBLIC | — | Login, returns tokens |
| POST | `/logout` | AUTH | ANY | Invalidate refresh token |
| POST | `/refresh` | PUBLIC | — | Refresh access token using HttpOnly cookie |
| POST | `/verify-email` | PUBLIC | — | Verify email with token |
| POST | `/resend-verification` | AUTH | ANY | Resend verification email |
| POST | `/forgot-password` | PUBLIC | — | Send password reset email |
| POST | `/reset-password` | PUBLIC | — | Reset password with token |
| GET | `/me` | AUTH | ANY | Get current authenticated user |
| PATCH | `/me/password` | AUTH | ANY | Change own password |

**POST /register request:**
```json
{
  "email": "user@example.com",
  "password": "MinLength8!",
  "first_name": "John",
  "last_name": "Doe",
  "role": "CUSTOMER"  // CUSTOMER | SELLER | DELIVERY_AGENT
}
```

**POST /login response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ...",
    "user": {
      "_id": "...",
      "email": "user@example.com",
      "role": "CUSTOMER",
      "first_name": "John",
      "last_name": "Doe",
      "is_email_verified": true
    }
  }
}
// Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Lax; Path=/api/v1/auth/refresh
```

---

## 3. User Routes `/api/v1/users`

| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| GET | `/profile` | AUTH | ANY | Get own profile |
| PATCH | `/profile` | AUTH | ANY | Update profile |
| POST | `/profile/avatar` | AUTH | ANY | Upload avatar |
| GET | `/addresses` | AUTH | CUSTOMER | List saved addresses |
| POST | `/addresses` | AUTH | CUSTOMER | Add address |
| PATCH | `/addresses/:id` | AUTH | CUSTOMER | Update address |
| DELETE | `/addresses/:id` | AUTH | CUSTOMER | Delete address |
| PATCH | `/addresses/:id/default` | AUTH | CUSTOMER | Set default address |

---

## 4. Seller Routes `/api/v1/sellers`

| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| POST | `/onboard` | AUTH | SELLER | Create seller profile + start Stripe Connect |
| GET | `/me` | AUTH | SELLER | Get own seller profile |
| GET | `/me/stripe-status` | AUTH | SELLER | Check Stripe onboarding status |
| POST | `/me/stripe-refresh` | AUTH | SELLER | Refresh Stripe Connect link |
| GET | `/me/earnings` | AUTH | SELLER | Get earnings summary |
| GET | `/me/withdrawals` | AUTH | SELLER | List withdrawal history |
| POST | `/me/withdrawals` | AUTH | SELLER | Request withdrawal |

---

## 5. Store Routes `/api/v1/stores`

| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| GET | `/` | PUBLIC | — | List approved stores (paginated) |
| GET | `/:slug` | PUBLIC | — | Get store detail by slug |
| POST | `/` | AUTH | SELLER | Create store |
| PATCH | `/me` | AUTH | SELLER | Update own store settings |
| POST | `/me/logo` | AUTH | SELLER | Upload store logo |
| POST | `/me/banner` | AUTH | SELLER | Upload store banner |
| GET | `/:slug/products` | PUBLIC | — | Browse products in a store |

---

## 6. Category Routes `/api/v1/categories`

| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| GET | `/` | PUBLIC | — | List all root categories |
| GET | `/:slug` | PUBLIC | — | Get category + children |
| POST | `/` | AUTH | ADMIN | Create category |
| PATCH | `/:id` | AUTH | ADMIN | Update category |
| DELETE | `/:id` | AUTH | ADMIN | Delete (soft) |

---

## 7. Product Routes `/api/v1/products`

### Public (customer-facing)
| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| GET | `/` | PUBLIC | — | Browse products (search, filter, paginate) |
| GET | `/:id` | PUBLIC | — | Product detail |

**GET /products query params:**
```
?q=running+shoes          # Atlas Search
&category=<slug>          # Filter by category
&store=<store_id>         # Filter by store
&min_price=1000           # in cents
&max_price=10000
&rating=4                 # minimum rating
&in_stock=true
&sort=price_asc|price_desc|rating|newest
&page=1&limit=20
```

### Seller (own products)
| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| GET | `/seller/me` | AUTH | SELLER | List own products |
| POST | `/seller` | AUTH | SELLER | Create product |
| GET | `/seller/:id` | AUTH | SELLER | Get own product detail |
| PATCH | `/seller/:id` | AUTH | SELLER | Update product |
| DELETE | `/seller/:id` | AUTH | SELLER | Soft delete product |
| POST | `/seller/:id/images` | AUTH | SELLER | Upload product images |
| DELETE | `/seller/:id/images/:index` | AUTH | SELLER | Remove image |
| POST | `/seller/:id/variants` | AUTH | SELLER | Add variant |
| PATCH | `/seller/:id/variants/:variantId` | AUTH | SELLER | Update variant |
| DELETE | `/seller/:id/variants/:variantId` | AUTH | SELLER | Remove variant |
| PATCH | `/seller/:id/status` | AUTH | SELLER | Publish (submit for review) |

### Admin (moderation)
| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| GET | `/admin` | AUTH | ADMIN | List all products (any status) |
| PATCH | `/admin/:id/approve` | AUTH | ADMIN | Approve product |
| PATCH | `/admin/:id/reject` | AUTH | ADMIN | Reject with reason |
| PATCH | `/admin/:id/suspend` | AUTH | ADMIN | Suspend live product |

---

## 8. Inventory Routes `/api/v1/inventory`

| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| GET | `/seller/me` | AUTH | SELLER | List own inventory (with low stock alerts) |
| GET | `/seller/me/:sku` | AUTH | SELLER | Get single SKU inventory |
| PATCH | `/seller/me/:sku` | AUTH | SELLER | Update stock (restock/adjustment) |
| GET | `/seller/me/transactions` | AUTH | SELLER | Inventory transaction history |
| GET | `/admin` | AUTH | ADMIN | Admin inventory overview |

**PATCH /inventory/seller/me/:sku request:**
```json
{
  "quantity_change": 50,       // positive = add, negative = remove
  "type": "restock",           // restock | adjustment
  "note": "Received shipment"
}
```

---

## 9. Cart Routes `/api/v1/cart`

Cart is Redis-primary. Session token in cookie for guests, user_id for authenticated users.

| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| GET | `/` | PUBLIC | — | Get current cart |
| POST | `/items` | PUBLIC | — | Add item to cart |
| PATCH | `/items/:itemId` | PUBLIC | — | Update item quantity |
| DELETE | `/items/:itemId` | PUBLIC | — | Remove item |
| DELETE | `/` | PUBLIC | — | Clear cart |
| POST | `/merge` | AUTH | CUSTOMER | Merge guest cart into user cart on login |
| POST | `/validate` | AUTH | CUSTOMER | Validate cart before checkout (stock, prices) |
| POST | `/apply-coupon` | AUTH | CUSTOMER | Apply coupon code |
| DELETE | `/coupon` | AUTH | CUSTOMER | Remove coupon |

---

## 10. Order Routes `/api/v1/orders`

### Customer
| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| GET | `/` | AUTH | CUSTOMER | List own orders |
| GET | `/:id` | AUTH | CUSTOMER | Order detail |
| POST | `/` | AUTH | CUSTOMER | Create order (reserves inventory) |
| POST | `/:id/cancel` | AUTH | CUSTOMER | Cancel order (before confirmed) |

**POST /orders request:**
```json
{
  "address_id": "<ObjectId>",
  "notes": "Leave at door"
}
```

**POST /orders response (201):**
```json
{
  "success": true,
  "data": {
    "order": { "_id": "...", "order_number": "NX-2024-00042", "status": "pending" },
    "payment_intent_client_secret": "pi_..._secret_..."
  }
}
```

### Seller
| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| GET | `/seller/me` | AUTH | SELLER | List own sub_orders |
| GET | `/seller/me/:subOrderId` | AUTH | SELLER | Sub-order detail |
| PATCH | `/seller/me/:subOrderId/confirm` | AUTH | SELLER | Confirm sub-order |
| PATCH | `/seller/me/:subOrderId/preparing` | AUTH | SELLER | Mark as preparing |
| PATCH | `/seller/me/:subOrderId/ready` | AUTH | SELLER | Mark ready for pickup |

### Admin
| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| GET | `/admin` | AUTH | ADMIN | List all orders |
| GET | `/admin/:id` | AUTH | ADMIN | Order detail |
| POST | `/admin/:id/cancel` | AUTH | ADMIN | Force cancel |
| GET | `/admin/sub-orders` | AUTH | ADMIN | All sub-orders |

---

## 11. Payment Routes `/api/v1/payments`

| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| GET | `/` | AUTH | CUSTOMER | Payment history |
| GET | `/:id` | AUTH | CUSTOMER | Payment detail |
| POST | `/webhook` | PUBLIC | — | Stripe webhook endpoint |
| POST | `/admin/:id/refund` | AUTH | ADMIN | Initiate refund |

**POST /payments/webhook:**
- Must verify `Stripe-Signature` header against `STRIPE_WEBHOOK_SECRET`
- Return `200` immediately after verification
- Process async via BullMQ
- Idempotency: check `webhook_events.event_id` before processing

---

## 12. Delivery Routes `/api/v1/delivery`

### Rider
| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| GET | `/rider/me` | AUTH | DELIVERY_AGENT | Own profile |
| PATCH | `/rider/me/status` | AUTH | DELIVERY_AGENT | Toggle online/offline |
| POST | `/rider/me/location` | AUTH | DELIVERY_AGENT | Update GPS location |
| GET | `/rider/me/tasks` | AUTH | DELIVERY_AGENT | Own delivery tasks |
| GET | `/rider/me/tasks/:id` | AUTH | DELIVERY_AGENT | Task detail |
| PATCH | `/rider/me/tasks/:id/accept` | AUTH | DELIVERY_AGENT | Accept task |
| PATCH | `/rider/me/tasks/:id/pickup` | AUTH | DELIVERY_AGENT | Mark picked up |
| PATCH | `/rider/me/tasks/:id/deliver` | AUTH | DELIVERY_AGENT | Mark delivered |
| PATCH | `/rider/me/tasks/:id/fail` | AUTH | DELIVERY_AGENT | Report failed delivery |
| GET | `/rider/me/earnings` | AUTH | DELIVERY_AGENT | Earnings summary |

### Customer (track delivery)
| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| GET | `/track/:taskId` | AUTH | CUSTOMER | Track delivery (status + ETA) |

### Admin
| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| GET | `/admin/agents` | AUTH | ADMIN | List all agents |
| GET | `/admin/agents/:id` | AUTH | ADMIN | Agent detail |
| PATCH | `/admin/agents/:id/approve` | AUTH | ADMIN | Approve rider |
| PATCH | `/admin/agents/:id/suspend` | AUTH | ADMIN | Suspend rider |
| GET | `/admin/tasks` | AUTH | ADMIN | All delivery tasks |
| PATCH | `/admin/tasks/:id/reassign` | AUTH | ADMIN | Manual reassign |

---

## 13. Review Routes `/api/v1/reviews`

| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| GET | `/products/:productId` | PUBLIC | — | Product reviews (paginated) |
| POST | `/` | AUTH | CUSTOMER | Submit review (requires delivered sub_order) |
| PATCH | `/:id` | AUTH | CUSTOMER | Edit own review |
| DELETE | `/:id` | AUTH | CUSTOMER | Delete own review |
| POST | `/:id/reply` | AUTH | SELLER | Reply to review |
| DELETE | `/admin/:id` | AUTH | ADMIN | Remove review |

---

## 14. Coupon Routes `/api/v1/coupons`

| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| GET | `/seller/me` | AUTH | SELLER | List own coupons |
| POST | `/seller/me` | AUTH | SELLER | Create coupon |
| PATCH | `/seller/me/:id` | AUTH | SELLER | Update coupon |
| DELETE | `/seller/me/:id` | AUTH | SELLER | Delete coupon |
| POST | `/validate` | AUTH | CUSTOMER | Validate a coupon code |

---

## 15. Chat Routes `/api/v1/chat`

| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| GET | `/conversations` | AUTH | ANY | List own conversations |
| GET | `/conversations/:id` | AUTH | ANY | Get conversation + messages |
| POST | `/conversations/:id/messages` | AUTH | ANY | Send message |
| PATCH | `/conversations/:id/read` | AUTH | ANY | Mark messages as read |

---

## 16. Notification Routes `/api/v1/notifications`

| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| GET | `/` | AUTH | ANY | List own notifications |
| PATCH | `/:id/read` | AUTH | ANY | Mark one as read |
| PATCH | `/read-all` | AUTH | ANY | Mark all as read |
| DELETE | `/:id` | AUTH | ANY | Delete notification |

---

## 17. Analytics Routes `/api/v1/analytics`

### Seller Analytics
| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| GET | `/seller/revenue` | AUTH | SELLER | Revenue over time (with date range) |
| GET | `/seller/top-products` | AUTH | SELLER | Top-selling products |
| GET | `/seller/orders` | AUTH | SELLER | Order volume summary |

### Admin Analytics
| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| GET | `/admin/overview` | AUTH | ADMIN | Platform overview (GMV, users, orders) |
| GET | `/admin/revenue` | AUTH | ADMIN | Platform revenue (commissions) |
| GET | `/admin/sellers` | AUTH | ADMIN | Seller performance |
| GET | `/admin/delivery` | AUTH | ADMIN | Delivery stats |

---

## 18. Admin Routes `/api/v1/admin`

| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| GET | `/users` | AUTH | ADMIN | List all users |
| PATCH | `/users/:id/suspend` | AUTH | ADMIN | Suspend user |
| PATCH | `/users/:id/activate` | AUTH | ADMIN | Activate user |
| GET | `/audit-logs` | AUTH | ADMIN | Audit log viewer |
| GET | `/health` | AUTH | SUPER_ADMIN | System health details |

---

## 19. Health Routes `/api/v1/health`

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/live` | PUBLIC | Kubernetes liveness probe |
| GET | `/ready` | PUBLIC | Kubernetes readiness probe |
| GET | `/metrics` | AUTH (SUPER_ADMIN) | Prometheus metrics endpoint |

**GET /health/ready response:**
```json
{
  "success": true,
  "data": {
    "status": "ready",
    "checks": {
      "mongodb": "up",
      "redis": "up",
      "bullmq": "up"
    },
    "uptime_seconds": 3847
  }
}
```

---

## 20. Webhook Endpoints

| Method | Endpoint | Verification |
|---|---|---|
| POST | `/api/v1/payments/webhook` | `Stripe-Signature` header |

**Idempotency:** All webhook handlers check `webhook_events.event_id` before processing. Duplicate events return `200` immediately.

---

## 21. API Versioning Strategy

- Current version: `/api/v1`
- When breaking changes are needed: introduce `/api/v2` routes
- Maintain `/api/v1` for at least 6 months after `/api/v2` release
- Version communicated via URL path (not headers, for simplicity)
