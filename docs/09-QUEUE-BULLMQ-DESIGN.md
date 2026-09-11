# 09 — NEXORA Queue & BullMQ Design

## 1. BullMQ Overview

BullMQ uses Redis as its backend. All queues share the same Redis instance used for caching.

**When to use BullMQ:**
- Work that can fail and needs retry logic
- Work that should not block an HTTP response
- Work that needs scheduling (delayed/cron)
- Work that benefits from concurrency control
- Work that must not be lost on process restart

**When NOT to use BullMQ:**
- Synchronous business logic (inventory check, price calculation)
- Operations that the HTTP client needs to wait for
- Simple operations with no retry requirement

---

## 2. Queue Registry

| Queue Name | Purpose | Concurrency | Priority |
|---|---|---|---|
| `email` | Transactional emails | 5 | Normal |
| `notification` | In-app push notifications | 10 | High |
| `delivery.assign` | Auto-assign rider to delivery task | 3 | High |
| `payment.webhook` | Process Stripe webhook events | 3 | Critical |
| `payment.transfer` | Stripe Connect seller transfers | 2 | High |
| `payment.withdrawal` | Process seller withdrawal | 1 | Normal |
| `inventory.alert` | Low stock notification to seller | 5 | Low |
| `invoice` | Generate order invoice PDF | 3 | Low |
| `cleanup` | Remove expired carts, old tokens | 1 | Low |

---

## 3. Queue Definitions

### 3.1 `email` Queue

**Producer:** Auth, Orders, Payments, Sellers, Admin modules  
**Consumer:** `email.worker.ts`

**Job types:**

| Job Name | Trigger | Payload |
|---|---|---|
| `email.verify` | User registration | `{ to, name, verificationUrl }` |
| `email.password_reset` | Password reset request | `{ to, name, resetUrl }` |
| `email.order_confirmed` | Payment webhook confirmed | `{ to, orderId, orderNumber, items, total }` |
| `email.order_shipped` | Sub-order picked up | `{ to, orderId, trackingUrl }` |
| `email.order_delivered` | Delivery confirmed | `{ to, orderId }` |
| `email.seller_new_order` | New sub-order created | `{ to, sellerName, subOrderId, items }` |
| `email.seller_approved` | Admin approves seller | `{ to, sellerName, dashboardUrl }` |
| `email.rider_approved` | Admin approves rider | `{ to, riderName }` |
| `email.withdrawal_processed` | Withdrawal complete | `{ to, amount, currency }` |

**Retry strategy:** 3 retries, exponential backoff (2s, 10s, 30s)  
**Dead-letter:** Failed after 3 attempts → `email.failed` queue for manual review

### 3.2 `notification` Queue

**Producer:** Orders, Delivery, Chat, Sellers, Admin modules  
**Consumer:** `notification.worker.ts`

**Job payload:**
```typescript
{
  userId: string;
  type: "order_update" | "delivery_update" | "new_message" | "stock_alert" | "system";
  title: string;
  body: string;
  referenceType?: "order" | "delivery" | "product";
  referenceId?: string;
}
```

**Worker actions:**
1. Insert notification document into MongoDB
2. Emit via Socket.IO: `io.to(`user:${userId}`).emit("notification:new", notification)`

**Retry:** 5 retries with 1s backoff (socket emit is fast)

### 3.3 `delivery.assign` Queue

**Producer:** Orders module (when sub_order → ready_for_pickup)  
**Consumer:** `delivery.assign.worker.ts`

**Job payload:**
```typescript
{
  subOrderId: string;
  storeLocation: { lat: number; lon: number };
  deliveryAddress: Address;
  attempt: number;  // 1, 2, 3 (for radius expansion)
}
```

**Worker actions:**
1. Query `delivery_agents` by proximity (2dsphere) + online + available
2. If found: assign rider, update `delivery_task`, emit socket events
3. If not found:
   - `attempt < 3`: enqueue delayed job (2 min delay, attempt+1, expanded radius)
   - `attempt >= 3`: notify admin, flag task for manual assignment

**Idempotency:** Check `delivery_task.status !== "unassigned"` before processing (task may have been manually assigned already)

**Retry:** Not retried on logic error (missing rider = business logic). Retried on DB/Redis errors only.

### 3.4 `payment.webhook` Queue

**Producer:** Stripe webhook handler  
**Consumer:** `payment.webhook.worker.ts`

**Job payload:**
```typescript
{
  stripeEventId: string;
  stripeEventType: string;
  stripeEventObject: object;  // Stripe event data.object snapshot
}
```

**Critical properties:**
- **Concurrency: 3** — Stripe can send multiple webhooks simultaneously
- **Idempotency key:** `stripeEventId` — set as BullMQ job ID to prevent duplicate jobs
- **Priority: Critical** — webhook processing delays affect order confirmation UX

**Worker actions by event type:**
```
payment_intent.succeeded:
  1. Verify event not already processed (MongoDB payment.webhook_events)
  2. MongoDB transaction:
     - orders: status → confirmed
     - payments: status → succeeded
  3. Release inventory reservations (reserved → 0, quantity stays decremented)
  4. Enqueue: payment.transfer (for each sub_order)
  5. Enqueue: notification (customer order confirmed)
  6. Enqueue: email (order_confirmed)
  7. Enqueue: delivery.assign (for each sub_order)
  8. Emit socket: order:confirmed

payment_intent.payment_failed:
  1. MongoDB transaction:
     - orders: status → cancelled
     - payments: status → failed
  2. Release inventory (restore quantity, clear reserved)
  3. Enqueue: notification (customer payment failed)
  4. Enqueue: email (payment failed)
```

### 3.5 `payment.transfer` Queue

**Producer:** `payment.webhook` worker (after payment succeeded)  
**Consumer:** `payment.transfer.worker.ts`

**Job payload:**
```typescript
{
  subOrderId: string;
  chargeId: string;
  sellerStripeAccountId: string;
  amount: number;  // in cents
  orderId: string;
}
```

**Worker actions:**
1. Check `sub_order.stripe_transfer_id` is null (idempotency)
2. Call `stripe.transfers.create(...)`
3. Update `sub_order.stripe_transfer_id` and `seller.pending_balance`

**Retry:** 5 retries with exponential backoff (Stripe rate limits are rare but possible)

### 3.6 `inventory.alert` Queue

**Producer:** Scheduled cron job OR triggered after order confirmation  
**Consumer:** `inventory.alert.worker.ts`

**Trigger:** After an order is confirmed, check if any sold SKU's `quantity <= low_stock_threshold`

**Job payload:**
```typescript
{
  sellerId: string;
  items: Array<{ sku: string; productName: string; quantity: number; threshold: number }>
}
```

**Worker actions:**
1. Enqueue notification to seller: "Low stock alert"
2. Enqueue email to seller

**Scheduled variant:** Daily cron at 8 AM UTC — scan ALL seller inventory for low stock.

### 3.7 `invoice` Queue

**Producer:** Orders module (after order confirmed)  
**Consumer:** `invoice.worker.ts`

**Job payload:**
```typescript
{
  orderId: string;
  customerId: string;
}
```

**Worker actions:**
1. Generate PDF invoice (using a Node.js PDF library, e.g., `pdfkit`)
2. Upload to Cloudinary
3. Update order with invoice_url
4. Enqueue email with invoice attachment link

### 3.8 `cleanup` Queue (Cron)

**Schedule:** Every hour  
**Consumer:** `cleanup.worker.ts`

**Cleanup tasks:**
| Task | Logic |
|---|---|
| Expired carts | Delete Redis cart keys that haven't been updated in 30+ days |
| Expired OTP keys | Handled by Redis TTL automatically — no cleanup needed |
| Stale pending orders | Orders with status=pending and no payment after 30 minutes → auto-cancel, release inventory |
| Old notifications | TTL index in MongoDB handles this (90 days) |

---

## 4. Worker Architecture

```typescript
// workers/email.worker.ts
import { Worker } from "bullmq";
import { redis } from "../infrastructure/redis/client";
import { sendEmail } from "../infrastructure/email";

const emailWorker = new Worker(
  "email",
  async (job) => {
    const { name, data } = job;
    await sendEmail({ template: name, ...data });
  },
  {
    connection: redis,
    concurrency: 5,
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 }
  }
);

emailWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, error: err.message }, "Email job failed");
});
```

---

## 5. Dead-Letter Strategy

**Failed jobs (max retries exceeded) go to a `{queue}.failed` set in Redis.**

Handling:
- Admin can view failed jobs via Bull Dashboard (optional UI)
- Critical failures (payment jobs) trigger admin alert via monitoring
- Jobs can be manually retried from the dashboard

**Alert threshold:** If `payment.webhook` queue has > 5 failed jobs → PagerDuty/alert.

---

## 6. Job Retry Policies

| Queue | Max Retries | Backoff Strategy |
|---|---|---|
| `email` | 3 | exponential: 2s, 10s, 30s |
| `notification` | 5 | fixed: 1s |
| `delivery.assign` | 0 | (business logic; uses delayed re-enqueue instead) |
| `payment.webhook` | 5 | exponential: 1s, 5s, 15s, 30s, 60s |
| `payment.transfer` | 5 | exponential: 5s, 30s, 2m, 10m, 30m |
| `payment.withdrawal` | 3 | exponential: 10s, 1m, 5m |
| `inventory.alert` | 3 | fixed: 5s |
| `invoice` | 3 | exponential: 5s, 30s, 2m |
| `cleanup` | 1 | none |

---

## 7. Queue Monitoring

BullMQ exposes metrics that Prometheus can scrape:
- Jobs waiting
- Jobs active
- Jobs completed
- Jobs failed
- Processing time (P50, P95)

These are exposed via a custom `/metrics` endpoint integrated with prom-client.
