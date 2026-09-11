# 02 — NEXORA Database Design

## 1. Design Principles

1. **Use MongoDB Native Driver** — no Mongoose, no ODM.
2. **Prefer referencing over deep embedding** when documents are large or independently accessed.
3. **Embed small, stable, frequently-read sub-documents** (e.g., product snapshot in order items).
4. **Design indexes before writing queries** — index design drives query patterns.
5. **Use MongoDB transactions** for multi-document atomic operations (inventory + order, payment + order).
6. **Never rely on client-provided IDs** — all primary keys use `new ObjectId()` server-side.
7. **Soft deletes** for user-facing entities (products, stores, users); hard deletes only for audit logs and ephemeral data.

---

## 2. Collections Overview

| Collection | Purpose | Key Relations |
|---|---|---|
| `users` | All platform users (any role) | — |
| `sellers` | Seller profile and Stripe Connect data | 1:1 → users |
| `stores` | Storefront settings and branding | 1:1 → sellers |
| `categories` | Product taxonomy (hierarchical) | Self-referential |
| `products` | Product listings with embedded variants | N:1 → stores, categories |
| `inventory` | Per-variant stock levels | 1:1 → product variant |
| `inventory_transactions` | Audit trail for stock changes | N:1 → inventory |
| `carts` | Customer cart (Redis primary, MongoDB backup) | 1:1 → users |
| `orders` | Top-level order (one per customer checkout) | N:1 → users |
| `sub_orders` | Per-seller portion of an order | N:1 → orders, sellers |
| `order_items` | Individual line items | N:1 → sub_orders, products |
| `payments` | Payment record linked to Stripe | 1:1 → orders |
| `refunds` | Refund records | N:1 → payments |
| `delivery_agents` | Rider profile and availability | 1:1 → users |
| `delivery_tasks` | Delivery assignment and lifecycle | 1:1 → sub_orders |
| `addresses` | Customer delivery addresses | N:1 → users |
| `reviews` | Product ratings and text reviews | N:1 → products, users |
| `coupons` | Seller discount codes | N:1 → sellers |
| `conversations` | Chat conversation container | N:N → users |
| `messages` | Individual chat messages | N:1 → conversations |
| `notifications` | In-app notification store | N:1 → users |
| `audit_logs` | Immutable system action log | N:1 → users |
| `withdrawals` | Seller payout requests | N:1 → sellers |

---

## 3. Collection Designs

### 3.1 `users`

**Purpose:** Single collection for all user types. Role field determines which additional profile collection exists.

```javascript
{
  _id: ObjectId,
  email: String,              // unique, lowercase, trimmed
  password_hash: String,      // bcrypt, never returned in API
  role: String,               // ENUM: CUSTOMER | SELLER | DELIVERY_AGENT | ADMIN | SUPER_ADMIN
  first_name: String,
  last_name: String,
  phone: String | null,       // E.164 format
  avatar_url: String | null,  // Cloudinary URL
  is_email_verified: Boolean, // default false
  email_verification_token: String | null,
  email_verification_expires: Date | null,
  password_reset_token: String | null,
  password_reset_expires: Date | null,
  is_active: Boolean,         // false = suspended
  last_login_at: Date | null,
  created_at: Date,
  updated_at: Date
}
```

**Indexes:**
```javascript
{ email: 1 }          // unique
{ role: 1 }           // filter by role
{ is_active: 1 }
{ created_at: -1 }    // admin user listing
```

**Validation rules:**
- `email`: valid email format, required, unique
- `password_hash`: required (set during registration)
- `role`: one of defined enum values
- Never expose `password_hash` or token fields in API responses

---

### 3.2 `sellers`

**Purpose:** Extended profile for users with role=SELLER. Links to Stripe Connect account.

```javascript
{
  _id: ObjectId,
  user_id: ObjectId,          // ref: users — unique
  stripe_account_id: String | null,   // Stripe Connect acct_xxx
  stripe_onboarding_complete: Boolean,
  status: String,             // ENUM: pending | approved | rejected | suspended
  rejection_reason: String | null,
  approved_by: ObjectId | null,       // ref: users (admin)
  approved_at: Date | null,
  business_name: String,
  business_type: String,      // individual | company
  tax_id: String | null,
  bank_verified: Boolean,
  total_earnings: Number,     // in cents, lifetime gross
  total_commission_paid: Number,      // platform commission paid
  pending_balance: Number,    // available for withdrawal (in cents)
  created_at: Date,
  updated_at: Date
}
```

**Indexes:**
```javascript
{ user_id: 1 }               // unique
{ status: 1 }                // admin seller management
{ stripe_account_id: 1 }     // Stripe webhook lookup
```

---

### 3.3 `stores`

**Purpose:** Storefront branding and settings per seller.

```javascript
{
  _id: ObjectId,
  seller_id: ObjectId,        // ref: sellers — unique
  name: String,               // display name
  slug: String,               // URL-friendly, unique
  description: String | null,
  logo_url: String | null,
  banner_url: String | null,
  contact_email: String | null,
  contact_phone: String | null,
  address: {
    line1: String,
    line2: String | null,
    city: String,
    state: String,
    postal_code: String,
    country: String           // ISO 3166-1 alpha-2
  },
  location: {                 // GeoJSON for proximity queries
    type: "Point",
    coordinates: [Number, Number]  // [longitude, latitude]
  },
  rating_avg: Number,         // denormalized average
  rating_count: Number,
  is_open: Boolean,
  created_at: Date,
  updated_at: Date
}
```

**Indexes:**
```javascript
{ seller_id: 1 }             // unique
{ slug: 1 }                  // unique, URL lookup
{ location: "2dsphere" }     // geospatial queries (rider assignment)
{ rating_avg: -1 }           // sort by rating
```

---

### 3.4 `categories`

**Purpose:** Hierarchical product taxonomy.

```javascript
{
  _id: ObjectId,
  name: String,
  slug: String,               // unique
  parent_id: ObjectId | null, // ref: categories (null = root)
  image_url: String | null,
  is_active: Boolean,
  sort_order: Number,
  created_at: Date,
  updated_at: Date
}
```

**Indexes:**
```javascript
{ slug: 1 }                  // unique
{ parent_id: 1 }             // fetch children of a category
{ is_active: 1, sort_order: 1 }
```

---

### 3.5 `products`

**Purpose:** Product listings. Variants embedded as array (small, bounded set per product).

**Embedding decision:** Variants are embedded because:
- A product rarely has >50 variants
- Variants are always read together with the product
- Inventory references variant._id from the product document

```javascript
{
  _id: ObjectId,
  store_id: ObjectId,         // ref: stores
  seller_id: ObjectId,        // denormalized for faster seller queries
  category_id: ObjectId,      // ref: categories
  name: String,
  slug: String,               // unique per store
  description: String,
  status: String,             // ENUM: draft | pending_review | approved | rejected | suspended
  rejection_reason: String | null,
  images: [String],           // Cloudinary URLs, first is primary
  tags: [String],
  attributes: [              // e.g., [{name: "Material", value: "Cotton"}]
    {
      name: String,
      value: String
    }
  ],
  variants: [
    {
      _id: ObjectId,          // referenced by inventory
      sku: String,            // unique platform-wide
      name: String,           // e.g., "Red / XL"
      attributes: {           // e.g., {color: "Red", size: "XL"}
        [key: String]: String
      },
      price: Number,          // in cents
      compare_at_price: Number | null,  // original price for "sale" display
      weight_grams: Number | null,
      is_active: Boolean
    }
  ],
  base_price: Number,         // in cents (lowest variant price, for display/sorting)
  rating_avg: Number,         // denormalized
  rating_count: Number,
  total_sold: Number,
  is_deleted: Boolean,        // soft delete
  deleted_at: Date | null,
  created_at: Date,
  updated_at: Date
}
```

**Indexes:**
```javascript
{ store_id: 1, status: 1 }
{ seller_id: 1 }
{ category_id: 1, status: 1 }
{ status: 1, created_at: -1 }
{ "variants.sku": 1 }               // unique
{ base_price: 1 }                   // price range filter
{ rating_avg: -1 }
{ tags: 1 }
{ is_deleted: 1, status: 1 }
// Atlas Search index on: name, description, tags
```

**Common queries:**
- Get products by store: `{ store_id, status: "approved", is_deleted: false }`
- Product detail: `{ _id, status: "approved", is_deleted: false }`
- Search: Atlas Search on name/description/tags
- Admin moderation queue: `{ status: "pending_review" }`

---

### 3.6 `inventory`

**Purpose:** Stock level per variant (SKU). Separate collection for atomic updates.

**Why separate from products?** Inventory requires frequent atomic updates during checkout. Separating it prevents write amplification on the large products document and allows targeted indexing.

```javascript
{
  _id: ObjectId,
  product_id: ObjectId,       // ref: products
  variant_id: ObjectId,       // embedded variant _id in product.variants
  seller_id: ObjectId,        // denormalized
  sku: String,                // unique, matches product.variants[].sku
  quantity: Number,           // available stock (can never go below 0)
  reserved: Number,           // held during checkout (pending payment)
  low_stock_threshold: Number,// trigger alert when quantity <= this
  allow_backorder: Boolean,   // if false, block purchase when quantity = 0
  last_restocked_at: Date | null,
  created_at: Date,
  updated_at: Date
}
```

**Indexes:**
```javascript
{ sku: 1 }                    // unique
{ product_id: 1 }
{ variant_id: 1 }             // unique
{ seller_id: 1, quantity: 1 }
{ quantity: 1, low_stock_threshold: 1 }  // low stock alerts query
```

**Critical operation — atomic stock decrement:**
```javascript
// On order placement (reserve stock):
db.inventory.findOneAndUpdate(
  {
    variant_id: variantId,
    quantity: { $gte: requestedQty }  // atomically check sufficient stock
  },
  {
    $inc: { quantity: -requestedQty, reserved: +requestedQty }
  },
  { returnDocument: "after" }
)
// If null returned → insufficient stock → abort order

// On payment confirmed (confirm reservation):
db.inventory.findOneAndUpdate(
  { variant_id: variantId },
  { $inc: { reserved: -confirmedQty } }
)

// On order cancelled/failed (release reservation):
db.inventory.findOneAndUpdate(
  { variant_id: variantId },
  { $inc: { quantity: +qty, reserved: -qty } }
)
```

---

### 3.7 `inventory_transactions`

**Purpose:** Audit trail for every inventory change (restock, sale, return, manual adjustment).

```javascript
{
  _id: ObjectId,
  inventory_id: ObjectId,
  sku: String,
  type: String,               // ENUM: sale | return | restock | adjustment | reservation | release
  quantity_change: Number,    // positive = increase, negative = decrease
  quantity_after: Number,     // snapshot of quantity after change
  reference_type: String | null,  // "order" | "sub_order" | "manual"
  reference_id: ObjectId | null,
  note: String | null,
  performed_by: ObjectId | null,  // user who made manual adjustment
  created_at: Date
}
```

**Indexes:**
```javascript
{ inventory_id: 1, created_at: -1 }
{ sku: 1, created_at: -1 }
{ reference_id: 1 }
```

---

### 3.8 `orders`

**Purpose:** Top-level order created at customer checkout. Contains one or more sub_orders (per seller).

```javascript
{
  _id: ObjectId,
  order_number: String,       // human-readable, e.g., "NX-2024-00001"
  customer_id: ObjectId,      // ref: users
  status: String,             // ENUM: pending | confirmed | cancelled | completed
  payment_status: String,     // ENUM: pending | paid | failed | refunded | partially_refunded
  subtotal: Number,           // in cents (sum of all items before discount/fees)
  discount_amount: Number,    // coupon discount
  delivery_fee: Number,       // total delivery fee
  platform_fee: Number,       // platform commission (for records)
  total: Number,              // in cents (what customer paid)
  currency: String,           // ISO 4217, default "USD"
  delivery_address: {         // snapshot at time of order
    line1: String,
    line2: String | null,
    city: String,
    state: String,
    postal_code: String,
    country: String
  },
  stripe_payment_intent_id: String | null,
  coupon_id: ObjectId | null,
  coupon_code: String | null,
  notes: String | null,
  cancelled_at: Date | null,
  cancelled_by: ObjectId | null,
  cancellation_reason: String | null,
  created_at: Date,
  updated_at: Date
}
```

**Indexes:**
```javascript
{ customer_id: 1, created_at: -1 }
{ order_number: 1 }                  // unique
{ stripe_payment_intent_id: 1 }      // webhook lookup
{ status: 1, created_at: -1 }
{ payment_status: 1 }
```

---

### 3.9 `sub_orders`

**Purpose:** Per-seller portion of a parent order. Has its own status and delivery task.

```javascript
{
  _id: ObjectId,
  order_id: ObjectId,         // ref: orders
  seller_id: ObjectId,        // ref: sellers
  store_id: ObjectId,         // ref: stores
  status: String,             // ENUM: pending | confirmed | preparing | ready_for_pickup | picked_up | delivered | cancelled
  items: [
    {
      product_id: ObjectId,
      variant_id: ObjectId,
      sku: String,
      // Snapshot at time of order (price can change later):
      product_name: String,
      variant_name: String,
      image_url: String,
      unit_price: Number,     // in cents
      quantity: Number,
      subtotal: Number        // unit_price * quantity
    }
  ],
  subtotal: Number,
  seller_earnings: Number,    // subtotal - platform_commission
  platform_commission: Number,
  commission_rate: Number,    // percentage at time of order (e.g., 10)
  delivery_fee: Number,
  stripe_transfer_id: String | null,    // Stripe Connect transfer
  confirmed_at: Date | null,
  preparing_at: Date | null,
  ready_at: Date | null,
  delivered_at: Date | null,
  created_at: Date,
  updated_at: Date
}
```

**Indexes:**
```javascript
{ order_id: 1 }
{ seller_id: 1, status: 1, created_at: -1 }
{ store_id: 1 }
{ status: 1 }
```

**Embedding decision:** Items are embedded in sub_orders (not in a separate collection) because:
- Items are always read with the sub_order
- Item data is a snapshot (does not change with product updates)
- Typical sub_order has <20 items

---

### 3.10 `payments`

**Purpose:** Platform payment record linked to Stripe.

```javascript
{
  _id: ObjectId,
  order_id: ObjectId,         // ref: orders — unique
  customer_id: ObjectId,
  stripe_payment_intent_id: String,   // unique
  stripe_charge_id: String | null,
  amount: Number,             // in cents (what customer paid)
  currency: String,
  status: String,             // ENUM: pending | succeeded | failed | cancelled | refunded
  payment_method_type: String | null,  // "card", "bank_transfer", etc.
  failure_code: String | null,
  failure_message: String | null,
  metadata: Object | null,    // Stripe metadata snapshot
  webhook_events: [           // append-only log of received webhook events
    {
      event_id: String,       // Stripe event ID (for idempotency)
      type: String,
      received_at: Date
    }
  ],
  created_at: Date,
  updated_at: Date
}
```

**Indexes:**
```javascript
{ order_id: 1 }                      // unique
{ stripe_payment_intent_id: 1 }      // unique, webhook lookup
{ customer_id: 1, created_at: -1 }
{ status: 1 }
{ "webhook_events.event_id": 1 }     // idempotency check
```

---

### 3.11 `refunds`

```javascript
{
  _id: ObjectId,
  payment_id: ObjectId,
  order_id: ObjectId,
  sub_order_id: ObjectId | null,  // null = full order refund
  stripe_refund_id: String,       // unique
  amount: Number,                 // in cents
  reason: String,                 // ENUM: customer_request | duplicate | fraud | defective
  status: String,                 // ENUM: pending | succeeded | failed
  initiated_by: ObjectId,         // admin user_id
  created_at: Date,
  updated_at: Date
}
```

---

### 3.12 `delivery_agents`

```javascript
{
  _id: ObjectId,
  user_id: ObjectId,          // ref: users — unique
  status: String,             // ENUM: pending | approved | suspended
  vehicle_type: String,       // ENUM: bicycle | motorcycle | car | van
  license_number: String | null,
  document_urls: [String],    // ID/license uploads (Cloudinary)
  is_online: Boolean,
  current_location: {
    type: "Point",
    coordinates: [Number, Number]  // [lon, lat]
  } | null,
  rating_avg: Number,
  rating_count: Number,
  total_earnings: Number,     // in cents, lifetime
  pending_earnings: Number,   // not yet paid out
  approved_by: ObjectId | null,
  approved_at: Date | null,
  created_at: Date,
  updated_at: Date
}
```

**Indexes:**
```javascript
{ user_id: 1 }                       // unique
{ status: 1, is_online: 1 }         // find available riders
{ current_location: "2dsphere" }     // geospatial proximity
```

---

### 3.13 `delivery_tasks`

**Purpose:** One delivery task per sub_order.

```javascript
{
  _id: ObjectId,
  sub_order_id: ObjectId,     // ref: sub_orders — unique
  order_id: ObjectId,
  seller_id: ObjectId,
  customer_id: ObjectId,
  delivery_agent_id: ObjectId | null,
  status: String,             // ENUM: unassigned | assigned | en_route_pickup | picked_up | en_route_delivery | delivered | failed | cancelled
  pickup_address: {           // store address snapshot
    line1: String, city: String, coordinates: [Number, Number]
  },
  delivery_address: {         // customer address snapshot
    line1: String, city: String, coordinates: [Number, Number]
  },
  estimated_pickup_at: Date | null,
  estimated_delivery_at: Date | null,
  assigned_at: Date | null,
  picked_up_at: Date | null,
  delivered_at: Date | null,
  failed_at: Date | null,
  failure_reason: String | null,
  rider_earnings: Number,     // in cents
  assignment_attempts: Number,  // how many auto-assignment retries
  created_at: Date,
  updated_at: Date
}
```

**Indexes:**
```javascript
{ sub_order_id: 1 }          // unique
{ delivery_agent_id: 1, status: 1 }
{ status: 1, created_at: 1 }  // assignment queue
{ order_id: 1 }
```

---

### 3.14 `addresses`

```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  label: String | null,       // "Home", "Work"
  recipient_name: String,
  phone: String,
  line1: String,
  line2: String | null,
  city: String,
  state: String,
  postal_code: String,
  country: String,
  location: {
    type: "Point",
    coordinates: [Number, Number]
  } | null,
  is_default: Boolean,
  created_at: Date,
  updated_at: Date
}
```

**Indexes:**
```javascript
{ user_id: 1, is_default: -1 }
{ location: "2dsphere" }
```

---

### 3.15 `reviews`

```javascript
{
  _id: ObjectId,
  product_id: ObjectId,
  sub_order_id: ObjectId,     // ensures one review per purchase
  customer_id: ObjectId,
  seller_id: ObjectId,        // denormalized
  rating: Number,             // 1-5
  title: String | null,
  body: String | null,
  images: [String],
  is_verified_purchase: Boolean,  // always true (linked to sub_order)
  seller_reply: String | null,
  seller_replied_at: Date | null,
  is_deleted: Boolean,
  created_at: Date,
  updated_at: Date
}
```

**Indexes:**
```javascript
{ product_id: 1, created_at: -1 }
{ sub_order_id: 1 }               // unique (one review per purchase)
{ customer_id: 1 }
{ seller_id: 1 }
{ rating: 1 }
```

---

### 3.16 `coupons`

```javascript
{
  _id: ObjectId,
  seller_id: ObjectId,        // ref: sellers
  store_id: ObjectId,
  code: String,               // uppercase, trimmed — unique per store
  type: String,               // ENUM: percentage | fixed
  value: Number,              // percent (1-100) or fixed amount in cents
  min_order_amount: Number | null,  // minimum cart total to apply
  max_discount_amount: Number | null,  // cap for percentage coupons
  usage_limit: Number | null, // total uses allowed (null = unlimited)
  usage_count: Number,        // current usage count
  per_user_limit: Number | null,
  is_active: Boolean,
  valid_from: Date,
  valid_until: Date | null,
  created_at: Date,
  updated_at: Date
}
```

**Indexes:**
```javascript
{ code: 1, store_id: 1 }     // unique compound
{ seller_id: 1 }
{ is_active: 1, valid_until: 1 }
```

---

### 3.17 `conversations`

```javascript
{
  _id: ObjectId,
  type: String,               // ENUM: customer_seller | customer_rider
  order_id: ObjectId,
  sub_order_id: ObjectId | null,
  delivery_task_id: ObjectId | null,
  participants: [             // exactly 2 participants
    {
      user_id: ObjectId,
      role: String,
      last_read_at: Date | null
    }
  ],
  last_message: {             // denormalized for inbox display
    content: String,
    sender_id: ObjectId,
    sent_at: Date
  } | null,
  created_at: Date,
  updated_at: Date
}
```

**Indexes:**
```javascript
{ "participants.user_id": 1 }
{ order_id: 1 }
{ updated_at: -1 }            // inbox sort
```

---

### 3.18 `messages`

```javascript
{
  _id: ObjectId,
  conversation_id: ObjectId,
  sender_id: ObjectId,
  content: String,
  type: String,               // ENUM: text | image
  image_url: String | null,
  is_read: Boolean,
  read_at: Date | null,
  is_deleted: Boolean,
  created_at: Date
}
```

**Indexes:**
```javascript
{ conversation_id: 1, created_at: 1 }
{ sender_id: 1 }
```

---

### 3.19 `notifications`

```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  type: String,               // ENUM: order_update | delivery_update | new_message | stock_alert | system
  title: String,
  body: String,
  reference_type: String | null,  // "order" | "delivery" | "product"
  reference_id: ObjectId | null,
  is_read: Boolean,
  read_at: Date | null,
  created_at: Date
}
```

**Indexes:**
```javascript
{ user_id: 1, is_read: 1, created_at: -1 }
{ user_id: 1, created_at: -1 }
```

**TTL index (auto-expire old notifications):**
```javascript
{ created_at: 1 }, { expireAfterSeconds: 7776000 }  // 90 days
```

---

### 3.20 `audit_logs`

**Purpose:** Immutable append-only log of significant actions.

```javascript
{
  _id: ObjectId,
  actor_id: ObjectId | null,  // null for system actions
  actor_role: String | null,
  action: String,             // e.g., "seller.approved", "product.rejected"
  resource_type: String,
  resource_id: ObjectId | null,
  changes: Object | null,     // before/after snapshot for updates
  ip_address: String | null,
  user_agent: String | null,
  created_at: Date
}
```

**Indexes:**
```javascript
{ actor_id: 1, created_at: -1 }
{ action: 1, created_at: -1 }
{ resource_type: 1, resource_id: 1 }
{ created_at: -1 }
```

**TTL (optional):** Retain for 2 years: `expireAfterSeconds: 63072000`

---

### 3.21 `withdrawals`

```javascript
{
  _id: ObjectId,
  seller_id: ObjectId,
  amount: Number,             // in cents
  status: String,             // ENUM: requested | processing | completed | rejected
  stripe_payout_id: String | null,
  bank_account_last4: String | null,
  rejection_reason: String | null,
  processed_by: ObjectId | null,
  requested_at: Date,
  processed_at: Date | null,
  created_at: Date,
  updated_at: Date
}
```

---

## 4. ER-Style Relationship Diagram

```
users ──────────────────────── sellers (1:1)
users ──────────────────────── delivery_agents (1:1)
sellers ─────────────────────── stores (1:1)
stores ──────────────────────── products (1:N)
products ────────────────────── inventory (1:N, per variant)
inventory ───────────────────── inventory_transactions (1:N)

users (customer) ────────────── carts (1:1, Redis-primary)
users (customer) ────────────── orders (1:N)
orders ──────────────────────── sub_orders (1:N, per seller)
sub_orders ──────────────────── delivery_tasks (1:1)
orders ──────────────────────── payments (1:1)
payments ────────────────────── refunds (1:N)

users ───────────────────────── addresses (1:N)
users (customer) ────────────── reviews (1:N)
products ────────────────────── reviews (1:N)

sellers ─────────────────────── coupons (1:N)
sellers ─────────────────────── withdrawals (1:N)

users ───────────────────────── conversations (N:N via participants[])
conversations ───────────────── messages (1:N)

users ───────────────────────── notifications (1:N)
users ───────────────────────── audit_logs (1:N as actor)
```

---

## 5. Index Strategy Summary

| Goal | Index Type |
|---|---|
| Unique user lookup (auth) | `users.email` unique |
| Order history (customer) | `orders.{customer_id, created_at}` compound |
| Seller moderation queue | `sellers.status` |
| Product search | Atlas Search text index |
| Product browse (category) | `products.{category_id, status}` compound |
| Inventory atomic update | `inventory.variant_id` unique |
| Rider proximity | `delivery_agents.current_location` 2dsphere |
| Store proximity | `stores.location` 2dsphere |
| Webhook idempotency | `payments.stripe_payment_intent_id` unique |
| Notification inbox | `notifications.{user_id, is_read, created_at}` compound |
| Chat inbox | `conversations.{participants.user_id}` multikey |

---

## 6. Transaction Requirements

MongoDB multi-document transactions are required for:

| Operation | Collections Involved |
|---|---|
| Place order | `orders`, `sub_orders`, `inventory` (decrement stock + create order atomically) |
| Confirm payment | `orders`, `payments` (update status together) |
| Cancel order | `orders`, `sub_orders`, `inventory` (release stock) |
| Process withdrawal | `sellers`, `withdrawals` (deduct pending_balance + create record) |

**Transaction note:** Requires MongoDB Replica Set (even single-node replica set for local dev).
