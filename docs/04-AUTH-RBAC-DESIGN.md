# 04 — NEXORA Auth & RBAC Design

## 1. Authentication Strategy

**Chosen approach:** JWT with dual-token rotation.

| Token | Storage | Lifetime | Purpose |
|---|---|---|---|
| Access Token | In-memory (JS variable / React Context) | 15 minutes | API authorization header |
| Refresh Token | HttpOnly, Secure, SameSite=Lax cookie | 7 days | Get new access token |

**Why this approach?**
- Access token in memory: XSS cannot read it (no localStorage)
- Refresh token in HttpOnly cookie: XSS cannot read it, CSRF cannot use it for API calls (Bearer header pattern)
- SameSite=Lax: protects against most CSRF attack vectors
- Short access token lifetime limits the blast radius of token compromise

---

## 2. Authentication Flow

### Registration
```
POST /api/v1/auth/register
  → Zod validation
  → Check email uniqueness
  → bcrypt.hash(password, 12)
  → Create user (is_email_verified: false)
  → Generate email verification token (crypto.randomBytes(32) → hex)
  → Store hashed token + expiry in user document
  → Enqueue email job (BullMQ)
  → Return user (no tokens yet — must verify email)
```

### Email Verification
```
POST /api/v1/auth/verify-email { token }
  → Find user where hashed(token) matches + not expired
  → Set is_email_verified: true
  → Clear token fields
  → Generate access + refresh tokens
  → Set refresh cookie, return access token
```

### Login
```
POST /api/v1/auth/login { email, password }
  → Find user by email
  → Check is_active = true
  → bcrypt.compare(password, hash)
  → Check is_email_verified = true (optional grace period)
  → Generate access token (JWT, 15m)
  → Generate refresh token (JWT, 7d)
  → Update last_login_at
  → Set HttpOnly cookie: refresh_token
  → Return: { access_token, user }
```

### Token Refresh
```
POST /api/v1/auth/refresh
  Cookie: refresh_token=<jwt>
  → Verify refresh token signature
  → Check token not in Redis blacklist (logout invalidation)
  → Find user, check is_active
  → Issue new access token
  → Rotate refresh token (new cookie, old token blacklisted)
  → Return: { access_token }
```

### Logout
```
POST /api/v1/auth/logout
  Cookie: refresh_token=<jwt>
  Authorization: Bearer <access_token>
  → Verify tokens
  → Add refresh token JTI to Redis blacklist
    Key: "blacklist:token:{jti}"
    TTL: remaining refresh token lifetime
  → Clear cookie (Set-Cookie: refresh_token=; Max-Age=0)
  → Return 200
```

### Password Reset
```
POST /api/v1/auth/forgot-password { email }
  → Find user (do NOT leak whether email exists — always return 200)
  → If found: generate reset token (crypto.randomBytes(32))
  → Store SHA-256(token) + expiry (1 hour) in user doc
  → Enqueue email with reset link (BullMQ)
  → Return 200

POST /api/v1/auth/reset-password { token, new_password }
  → Find user where SHA-256(token) matches + not expired
  → bcrypt.hash(new_password, 12)
  → Update password, clear reset fields
  → Blacklist all active refresh tokens for this user (Redis pattern: "blacklist:user:{userId}:*")
  → Return 200
```

---

## 3. JWT Design

### Access Token Payload
```json
{
  "sub": "user_id",
  "role": "CUSTOMER",
  "jti": "unique-token-id",
  "iat": 1699999999,
  "exp": 1700000899  // 15 minutes
}
```

### Refresh Token Payload
```json
{
  "sub": "user_id",
  "jti": "unique-token-id",
  "iat": 1699999999,
  "exp": 1700604799  // 7 days
}
```

**Algorithm:** HS256 (HMAC SHA-256) with separate secrets for access vs refresh tokens.

**Token ID (jti):** `crypto.randomUUID()` — used for blacklisting on logout.

---

## 4. Middleware Implementation

### `authenticate` middleware
```typescript
// Extracts and verifies access token from Authorization: Bearer header
// Attaches req.user = { _id, role } to request
// Returns 401 if missing or invalid
```

### `authorize(...roles)` middleware
```typescript
// Checks req.user.role is in the allowed roles list
// Returns 403 if not authorized
// Example: router.delete("/products/:id", authenticate, authorize("ADMIN", "SUPER_ADMIN"), ...)
```

### `hasPermission(permission)` middleware
```typescript
// Checks fine-grained permission beyond role
// Example: hasPermission("product:delete:own") checks seller owns the product
```

---

## 5. Role Definitions

| Role | Code | Who holds it |
|---|---|---|
| Super Admin | `SUPER_ADMIN` | Technical operator |
| Admin | `ADMIN` | Platform support/operations team |
| Seller | `SELLER` | Registered merchants |
| Delivery Agent | `DELIVERY_AGENT` | Approved riders |
| Customer | `CUSTOMER` | End consumers |

---

## 6. Permission Matrix

### Legend
- ✅ Allowed
- ❌ Denied
- 🔒 Own resource only
- ⚙️ Platform-level action

| Resource | Action | SUPER_ADMIN | ADMIN | SELLER | DELIVERY_AGENT | CUSTOMER |
|---|---|---|---|---|---|---|
| **Users** | List all | ✅ | ✅ | ❌ | ❌ | ❌ |
| | Get own profile | ✅ | ✅ | ✅ | ✅ | ✅ |
| | Suspend user | ✅ | ✅ | ❌ | ❌ | ❌ |
| | Delete user | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Sellers** | Onboard | ✅ | ✅ | 🔒 | ❌ | ❌ |
| | Approve | ✅ | ✅ | ❌ | ❌ | ❌ |
| | Suspend | ✅ | ✅ | ❌ | ❌ | ❌ |
| | View own profile | ✅ | ✅ | 🔒 | ❌ | ❌ |
| **Products** | Browse (approved) | ✅ | ✅ | ✅ | ✅ | ✅ |
| | Create | ✅ | ✅ | 🔒 (own store) | ❌ | ❌ |
| | Update | ✅ | ✅ | 🔒 (own) | ❌ | ❌ |
| | Delete | ✅ | ✅ | 🔒 (own) | ❌ | ❌ |
| | Approve/Reject | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Inventory** | View own | ✅ | ✅ | 🔒 | ❌ | ❌ |
| | Update | ✅ | ✅ | 🔒 | ❌ | ❌ |
| **Orders** | List own | ✅ | ✅ | 🔒 (sub_orders) | 🔒 (tasks) | 🔒 |
| | Create | ✅ | ✅ | ❌ | ❌ | ✅ |
| | Cancel (customer) | ✅ | ✅ | ❌ | ❌ | 🔒 (own, before confirmed) |
| | Force cancel | ✅ | ✅ | ❌ | ❌ | ❌ |
| | Confirm/Prepare/Ready | ✅ | ✅ | 🔒 (own sub_orders) | ❌ | ❌ |
| **Payments** | View own | ✅ | ✅ | 🔒 | ❌ | 🔒 |
| | Initiate refund | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Delivery** | View tasks | ✅ | ✅ | ❌ | 🔒 | 🔒 (track own) |
| | Accept/pickup/deliver | ✅ | ✅ | ❌ | 🔒 | ❌ |
| | Update location | ✅ | ✅ | ❌ | 🔒 | ❌ |
| | Approve rider | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Reviews** | Read | ✅ | ✅ | ✅ | ✅ | ✅ |
| | Create | ✅ | ✅ | ❌ | ❌ | 🔒 (verified purchase) |
| | Reply | ✅ | ✅ | 🔒 (own product) | ❌ | ❌ |
| | Delete | ✅ | ✅ | ❌ | ❌ | 🔒 (own) |
| **Coupons** | Create | ✅ | ✅ | 🔒 (own store) | ❌ | ❌ |
| | Use | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Chat** | Send/receive | ✅ | ✅ | 🔒 (order participant) | 🔒 (delivery participant) | 🔒 (own orders) |
| **Analytics** | Seller dashboard | ✅ | ✅ | 🔒 (own store) | ❌ | ❌ |
| | Admin dashboard | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Audit Logs** | View | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Admin Panel** | All | ✅ | ✅ | ❌ | ❌ | ❌ |
| **System Config** | All | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 7. Resource Ownership Rules

These are enforced at the **service layer**, not just via role check:

| Resource | Ownership Rule | Enforcement |
|---|---|---|
| Product | Seller can only access products where `product.seller_id === req.user.sellerId` | Service validates before any DB write |
| Sub-order | Seller can only access sub_orders where `sub_order.seller_id === req.user.sellerId` | Service query includes seller_id filter |
| Delivery task | Rider can only update tasks where `task.delivery_agent_id === req.user.deliveryAgentId` | Service validates before status update |
| Review | Customer can only edit/delete own reviews (`review.customer_id === req.user._id`) | Service validates |
| Conversation | Participant can only access conversations where their user_id is in `participants[]` | Service query includes participant filter |
| Order cancellation | Customer can only cancel orders where `order.customer_id === req.user._id` AND `order.status === "pending"` | Service validates both |
| Withdrawal | Seller can only request withdrawal against own balance | Service validates seller_id + balance |

**Critical isolation rule:** In every seller-scoped query, the `seller_id` is taken from the JWT (via database lookup), NEVER from the request body or query parameter.

```typescript
// ✅ Correct:
const seller = await sellersRepo.findByUserId(req.user._id);
const products = await productsRepo.findByStoreId(seller._id, filters);

// ❌ Wrong:
const products = await productsRepo.findByStoreId(req.body.seller_id, filters);
```

---

## 8. Seller Status Gate

Certain actions require seller status to be `approved` AND Stripe onboarding to be complete:

| Action | Gate |
|---|---|
| Create product | `seller.status === "approved"` |
| Update product | `seller.status === "approved"` |
| Submit for review | `seller.status === "approved"` |
| Request withdrawal | `seller.status === "approved" && stripe_onboarding_complete === true` |
| Receive sub-orders | `seller.status === "approved"` |

---

## 9. Session Management

- **No server-side sessions** — JWT-based, stateless
- **Refresh token blacklist in Redis:**
  - Key: `blacklist:rt:{jti}` → TTL = remaining refresh token lifetime
  - Checked on every `/auth/refresh` call
- **Force logout all sessions** (e.g., on password reset):
  - Stored in Redis: `user:force_logout:{userId}` = timestamp
  - Refresh middleware checks if token was issued before this timestamp

---

## 10. Password Security

- Algorithm: **bcrypt** with cost factor **12**
- Minimum length: **8 characters**
- Validation: at least 1 uppercase, 1 lowercase, 1 number
- Storage: only hash stored, never plaintext
- Comparison: constant-time compare via bcrypt.compare()
- Rate limiting on login: **10 attempts per 15 minutes per IP** (Redis counter)

---

## 11. Cookie Configuration

```
Set-Cookie:
  refresh_token=<jwt>;
  HttpOnly;
  Secure;          (production only: HTTPS)
  SameSite=Lax;
  Path=/api/v1/auth/refresh;
  Max-Age=604800;  (7 days)
  Domain=.nexora.com
```

**Path restriction:** Cookie is only sent to `/api/v1/auth/refresh`, limiting CSRF exposure surface.
