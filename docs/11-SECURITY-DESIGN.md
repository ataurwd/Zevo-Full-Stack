# 11 — NEXORA Security Design

## 1. Security Layers

```
Request → Nginx → Express → Middleware Stack → Controller → Service → DB
           ↑          ↑           ↑                ↑           ↑        ↑
           SSL    Helmet/CORS  Auth/RBAC       Zod         Logic    MongoDB
           Rate   GZip         Rate limit      validation  checks   queries
           limit  Headers      JWT verify      Business    Ownership
```

---

## 2. Threat & Risk Table

| Threat | Impact | Likelihood | Mitigation |
|---|---|---|---|
| SQL/NoSQL Injection | Critical | Medium | MongoDB Native Driver parameterizes queries; Zod validates all input |
| XSS (Stored) | High | Medium | Helmet CSP; input sanitization; no innerHTML rendering |
| XSS (Reflected) | Medium | Medium | Helmet, CORS, no user input reflected without encoding |
| CSRF | High | Medium | Access token in header (not cookie); refresh cookie is Path-restricted |
| JWT Compromise | Critical | Low | Short expiry (15m), separate secrets, blacklist on logout |
| Brute Force (Login) | High | High | 10 req/15min rate limit on auth endpoints; bcrypt cost=12 |
| Account Enumeration | Medium | High | Return identical message for login failure and "email not found" |
| Unauthorized Access | Critical | Medium | RBAC + resource ownership check on every request |
| Insecure File Upload | High | Medium | Cloudinary-only upload; file type validation; max 5MB |
| Stripe Webhook Spoofing | Critical | Low | Stripe signature verification mandatory |
| Secrets Exposure | Critical | Low | .env files; never logged; Docker secrets in production |
| Privilege Escalation | Critical | Low | Role from DB, not client; never accept role from JWT payload alone on write operations |
| DDoS | High | Medium | Nginx rate limiting; Cloudflare (future); BullMQ queue limits |
| Overfetching (IDOR) | High | Medium | Always filter by owner ID at service layer |
| Mass Assignment | High | Medium | Explicit whitelisting of allowed fields via Zod schema |
| Race Condition (Inventory) | High | Medium | Atomic MongoDB findOneAndUpdate with conditional |
| Payment Manipulation | Critical | Low | Server-side price calculation; Stripe as source of truth |
| Session Fixation | Medium | Low | New tokens generated on login; old tokens blacklisted on logout |

---

## 3. HTTP Security Headers (Helmet)

```typescript
import helmet from "helmet";

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://js.stripe.com"],
      frameSrc: ["'self'", "https://js.stripe.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      connectSrc: ["'self'", "wss://nexora.com", "https://api.stripe.com"]
    }
  },
  crossOriginEmbedderPolicy: false  // Needed for Mapbox tiles
}));
```

---

## 4. CORS Configuration

```typescript
app.use(cors({
  origin: (origin, callback) => {
    const allowed = ALLOWED_ORIGINS.split(",");
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 600
}));
```

---

## 5. Input Validation (Zod)

Every route handler that accepts input uses a Zod schema validator middleware:

```typescript
// Shared schema example
const CreateProductSchema = z.object({
  name: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  category_id: z.string().regex(/^[0-9a-fA-F]{24}$/),
  variants: z.array(z.object({
    sku: z.string().min(1).max(50),
    price: z.number().int().positive().max(100000000),  // max $1M in cents
    attributes: z.record(z.string())
  })).min(1).max(50)
});

// Middleware
app.post("/products", authenticate, authorize("SELLER"), validate(CreateProductSchema), createProduct);
```

**Mass assignment protection:** Zod schema defines EXACTLY which fields are accepted. Extra fields are stripped by `.strict()` or the schema explicitly only picks known keys.

---

## 6. MongoDB Security

- **MongoDB Native Driver** — no string interpolation in queries
- **All user-controlled values** are passed as parameters, never string-concatenated into queries
- **ObjectId validation:** All `_id` values are validated as valid ObjectId format before use
- **$where operator** is disabled at the DB level
- **TLS enabled** for MongoDB Atlas connections in production

```typescript
// ❌ WRONG (hypothetical ORM risk):
db.query(`db.users.find({email: "${email}"})`);  // injection risk

// ✅ CORRECT (parameterized):
await db.collection("users").findOne({ email });
```

---

## 7. File Upload Security

**Upload flow:**
1. Client sends file to backend (multipart/form-data)
2. Backend validates: file type (MIME), file size (max 5MB), image dimensions
3. Backend streams to Cloudinary (never saves to disk)
4. Cloudinary returns secure URL
5. URL stored in MongoDB

**Validation:**
```typescript
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;  // 5MB

if (!ALLOWED_TYPES.includes(file.mimetype)) throw new AppError("INVALID_FILE_TYPE", 400);
if (file.size > MAX_SIZE_BYTES) throw new AppError("FILE_TOO_LARGE", 400);
```

**Note:** MIME type from the client header is not trusted alone — use `file-type` library to detect actual file signature.

---

## 8. Rate Limiting (Application Layer)

Redis-backed sliding window rate limiter applied as middleware:

```typescript
// Categories:
const AUTH_LIMIT = { max: 10, window: 15 * 60 * 1000 };     // per IP
const WRITE_LIMIT = { max: 60, window: 60 * 1000 };          // per authenticated user
const READ_LIMIT = { max: 300, window: 60 * 1000 };          // per authenticated user
const PUBLIC_LIMIT = { max: 100, window: 60 * 1000 };        // per IP (unauthenticated)
const UPLOAD_LIMIT = { max: 20, window: 60 * 1000 };         // per authenticated user
```

Rate limit headers returned:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1699999999
```

On limit exceeded: return `429 Too Many Requests` with `Retry-After` header.

---

## 9. Brute Force Protection

**Login:** 10 attempts per 15 minutes per IP → 429.  
**After 10 failures:** Optional CAPTCHA challenge (future).

**Password reset:** 3 reset email requests per hour per email address.

**OTP:** Rate-limited to 3 sends per 10 minutes.

---

## 10. Secrets Management

**Development:** `.env` file (gitignored).  
**Staging/Production:** Docker secrets or environment variables injected at deployment.

**Never:**
- Commit `.env` files
- Log secrets or API keys
- Embed secrets in Docker images
- Return secrets in API responses

**Rotation plan:**
- JWT secrets: rotate by setting new secret + 15-min grace period for old tokens to expire
- Stripe keys: rotate via Stripe dashboard + update deployment
- Database credentials: rotate via MongoDB Atlas + update deployment

---

## 11. Audit Logging

All sensitive operations write to the `audit_logs` collection:

```typescript
// Events to audit:
const AUDITABLE_EVENTS = [
  "user.login",
  "user.logout",
  "user.password_changed",
  "seller.approved",
  "seller.rejected",
  "seller.suspended",
  "product.approved",
  "product.rejected",
  "product.suspended",
  "rider.approved",
  "rider.suspended",
  "order.force_cancelled",
  "refund.initiated",
  "withdrawal.processed",
  "admin.user_suspended"
];
```

Audit log entries are **immutable** (no update/delete operations allowed).

---

## 12. Authorization Bypass Prevention

**Checklist for every endpoint that accesses a resource:**

- [ ] Is the user authenticated? (`authenticate` middleware)
- [ ] Does the user have the required role? (`authorize` middleware)
- [ ] Does the user own this resource? (service-layer check using ID from JWT, not from request)
- [ ] Is the resource in the correct state for this operation? (e.g., can only cancel pending orders)
- [ ] Are all IDs validated as ObjectId format before DB query?
- [ ] Is the Zod schema strict enough to prevent unexpected fields?

**Example of correct ownership check:**
```typescript
// In orders.service.ts
async cancelOrder(orderId: string, requestingUserId: string): Promise<void> {
  const order = await this.ordersRepo.findById(orderId);
  if (!order) throw new NotFoundError("Order not found");

  // Ownership check — uses requestingUserId from JWT, NOT from request body
  if (order.customer_id.toString() !== requestingUserId) {
    throw new ForbiddenError("Not your order");
  }

  if (order.status !== "pending") {
    throw new BusinessError("Order cannot be cancelled after confirmation");
  }

  // ... proceed with cancellation
}
```

---

## 13. Security Checklist (Pre-Production)

- [ ] All secrets in environment variables, not code
- [ ] Helmet enabled with CSP
- [ ] CORS restricted to known origins
- [ ] All inputs validated with Zod
- [ ] MongoDB queries parameterized (no string interpolation)
- [ ] Rate limiting enabled on all routes
- [ ] bcrypt with cost ≥ 12 for passwords
- [ ] JWT access token expires in 15 minutes
- [ ] Refresh token in HttpOnly, Secure, SameSite=Lax cookie
- [ ] Stripe webhook signature verified
- [ ] File uploads validated by MIME type + file-type library
- [ ] No sensitive data in logs
- [ ] Audit logging for all admin actions
- [ ] Authorization check at service layer (not just middleware)
- [ ] MongoDB TLS enabled (production)
- [ ] HTTPS enforced (Nginx redirects HTTP → HTTPS)
- [ ] HSTS header set
