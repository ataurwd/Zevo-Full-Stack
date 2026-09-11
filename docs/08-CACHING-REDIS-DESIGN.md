# 08 — NEXORA Caching & Redis Design

## 1. Redis Usage Scope

Redis is used for 6 distinct purposes. It is NOT a general-purpose cache for all data.

| Purpose | Justified? | Reason |
|---|---|---|
| Product/category cache | ✅ | High read volume, rarely changes |
| Guest cart storage | ✅ | Must persist without DB row, session-scoped |
| OTP / email tokens | ✅ | Short-lived, no need for DB |
| Rate limiting | ✅ | Sliding window counters per IP/user |
| Socket.IO Pub/Sub | ✅ | Required for multi-instance WebSocket |
| Rider location | ✅ | Ephemeral, high-frequency writes |
| Refresh token blacklist | ✅ | Logout invalidation without DB query |
| Session storage | ❌ | JWT is stateless; no sessions |
| Order state | ❌ | MongoDB is source of truth |
| User profiles | ❌ | Rarely a bottleneck; adds cache invalidation complexity |
| Delivery task state | ❌ | MongoDB + Socket.IO handle this |

---

## 2. Cache Strategy: Cache-Aside

```
Read:
  1. Check Redis cache
  2. If HIT: return cached value (update TTL if desired)
  3. If MISS: query MongoDB, store result in Redis, return

Write:
  1. Write to MongoDB
  2. Delete (invalidate) Redis cache key
  → Next read will repopulate from DB (no stale data)

Why DELETE not UPDATE on write?
  - Prevents race conditions between DB write and cache write
  - Simpler than coordinating two writes
  - Slight increase in DB reads after invalidation is acceptable
```

---

## 3. Redis Key Conventions

All keys follow a structured naming pattern: `{domain}:{resource}:{identifier}`

| Key Pattern | Example | TTL | Purpose |
|---|---|---|---|
| `product:{id}` | `product:abc123` | 10 min | Single product cache |
| `products:category:{slug}:page:{n}` | `products:category:shoes:page:1` | 5 min | Category product listing |
| `categories:tree` | `categories:tree` | 1 hour | Full category tree |
| `store:{slug}` | `store:shoe-king` | 15 min | Store detail |
| `cart:guest:{sessionToken}` | `cart:guest:abc123xyz` | 7 days | Guest cart |
| `cart:user:{userId}` | `cart:user:usr123` | 30 days | Authenticated cart |
| `otp:email:{email}` | `otp:email:user@x.com` | 10 min | Email OTP |
| `otp:phone:{phone}` | `otp:phone:+1234567890` | 5 min | SMS OTP (future) |
| `ratelimit:ip:{ip}:{action}` | `ratelimit:ip:1.2.3.4:login` | 15 min | IP rate limit |
| `ratelimit:user:{id}:{action}` | `ratelimit:user:abc:write` | 1 min | User rate limit |
| `blacklist:rt:{jti}` | `blacklist:rt:tok123` | Remaining lifetime | Logout token |
| `user:force_logout:{userId}` | `user:force_logout:usr123` | 7 days | Force session invalidation |
| `rider:location:{riderId}` | `rider:location:rid123` | 30 sec | Ephemeral GPS |
| `lock:assignment:{riderId}` | `lock:assignment:rid123` | 10 sec | Delivery assignment lock |
| `lock:inventory:{sku}` | `lock:inventory:SKU-001` | 5 sec | Inventory Redlock (if needed) |

---

## 4. Cached Resources Detail

### 4.1 Product Cache

**What:** Full product document including variants (as returned by `GET /products/:id`).  
**TTL:** 10 minutes.  
**Invalidation:**
- On `product.update` (any field change by seller)
- On `product.status` change (admin approve/reject)
- On `inventory.update` (stock change) — only invalidate if product response includes stock info

**Note:** Product listing pages (category, search) are NOT cached individually at Redis level because Atlas Search + Nginx caching at the CDN layer is more effective for listing responses. Only detail pages are Redis-cached.

### 4.2 Category Tree Cache

**What:** Full hierarchical category list.  
**TTL:** 1 hour (categories rarely change).  
**Invalidation:** On any category create/update/delete by admin.  
**Key:** `categories:tree`

### 4.3 Store Cache

**What:** Store detail page data.  
**TTL:** 15 minutes.  
**Invalidation:** On store settings update by seller.

### 4.4 Cart (Redis-primary)

Cart is stored **exclusively in Redis** for guest users and as a fast-path for authenticated users.

**Guest cart:**
```
Key: cart:guest:{sessionToken}   (sessionToken is a random UUID in a cookie)
Value: JSON stringified cart object
TTL: 7 days (rolling — reset on every cart operation)
```

**Authenticated cart:**
```
Key: cart:user:{userId}
Value: JSON stringified cart object
TTL: 30 days (rolling)
```

**Cart merge on login:**
```
1. Read guest cart by session token
2. Read user cart by userId (may be empty)
3. Merge: combine items, sum quantities for duplicate variants, prefer higher quantity
4. Validate merged cart (check prices, stock)
5. Write merged cart to cart:user:{userId}
6. Delete cart:guest:{sessionToken}
```

**Cart schema in Redis:**
```json
{
  "userId": "...",       // null for guest
  "items": [
    {
      "productId": "...",
      "variantId": "...",
      "sku": "...",
      "quantity": 2,
      "unitPrice": 2999,  // snapshot price at time of add
      "productName": "...",
      "variantName": "Red / XL",
      "imageUrl": "...",
      "storeId": "...",
      "sellerId": "..."
    }
  ],
  "couponCode": null,
  "couponDiscount": 0,
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

**Important:** Cart prices are snapshots. `POST /cart/validate` re-checks prices and stock before checkout.

### 4.5 OTP / Token Storage

**Email verification token:**
```
Key: otp:email:verify:{email}
Value: SHA-256(token)  // hashed for security
TTL: 10 minutes
```

**Password reset token:**
```
Key: otp:email:reset:{email}
Value: SHA-256(token)
TTL: 1 hour
```

**Note:** These are stored in both Redis (for fast lookup + TTL) AND MongoDB (for resilience across Redis restarts). Redis is checked first.

### 4.6 Rate Limiting

**Sliding window counter pattern:**
```typescript
const key = `ratelimit:${type}:${identifier}`;
const now = Date.now();
const windowMs = 60000;

// ZADD + ZREMRANGEBYSCORE + ZCARD in a Redis pipeline
await redis.pipeline()
  .zremrangebyscore(key, 0, now - windowMs)
  .zadd(key, now, `${now}-${Math.random()}`)
  .zcard(key)
  .expire(key, Math.ceil(windowMs / 1000))
  .exec();
```

### 4.7 Rider Location

```
Key: rider:location:{riderId}
Value: {"lat": 23.81, "lon": 90.41, "ts": 1699999999}
TTL: 30 seconds (auto-expires if rider disconnects)
```

Written on every `rider:location` Socket.IO event.

---

## 5. Redis Data Structures Used

| Structure | Used for |
|---|---|
| `STRING` | Cached documents (JSON), OTP tokens, location |
| `SORTED SET` | Rate limiting (sliding window), token timestamps |
| `STRING (NX)` | Distributed locks (SET key value NX EX ttl) |

---

## 6. Cache Invalidation Rules

| Cache Key | Invalidated When |
|---|---|
| `product:{id}` | Seller updates product, admin changes status, soft delete |
| `products:category:*` | Any product in that category changes status/price |
| `categories:tree` | Any category is created/updated/deleted |
| `store:{slug}` | Seller updates store profile |
| `cart:user:{userId}` | Cart updated, cart cleared, checkout completed |
| `cart:guest:{token}` | Cart updated, merged on login |
| `blacklist:rt:{jti}` | Auto-expires (no manual invalidation) |
| `rider:location:{riderId}` | Auto-expires (no manual invalidation) |

---

## 7. What NOT to Cache

| Resource | Why NOT cached |
|---|---|
| Orders | Too many per-user, frequently updated, small read benefit |
| Payment records | Security-sensitive, always read fresh from DB |
| Audit logs | Write-only access pattern, no caching benefit |
| Messages | High update frequency, small TTL not worth the complexity |
| Inventory levels | Must be accurate at checkout — always read from DB |
| User profiles | Low read volume, simple DB query |
| Sub-orders | Seller dashboard reads are not performance-critical |

---

## 8. Redis Connection Configuration

```typescript
// ioredis configuration
const redis = new Redis({
  url: REDIS_URL,
  retryStrategy: (times) => Math.min(times * 100, 3000),
  reconnectOnError: (err) => {
    const targetError = "READONLY";
    if (err.message.includes(targetError)) return true;
    return false;
  },
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
  lazyConnect: true
});
```

**Graceful degradation:** If Redis is unavailable:
- Cache misses fall through to MongoDB (acceptable performance hit)
- Rate limiting falls back to in-memory (acceptable for brief outages)
- Cart reads fall back to MongoDB cart backup (if implemented)
- Socket.IO adapter will fail — this requires Redis to be up for multi-instance Socket.IO
