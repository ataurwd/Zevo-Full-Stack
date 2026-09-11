# 06 — NEXORA Payment Architecture

## 1. Principles

1. **Stripe webhook is the source of truth** — never trust the frontend for payment status.
2. **Idempotency first** — every webhook event is deduplicated before processing.
3. **Inventory reserved before payment, confirmed after webhook** — prevents oversell.
4. **Stripe Connect for seller payouts** — platform takes commission at checkout via `application_fee_amount`.
5. **Atomic order+payment state transitions** — MongoDB transactions ensure consistency.

---

## 2. Stripe Integration Model

**Stripe Connect — Destination Charges pattern:**

```
Customer → Stripe (full payment) → Platform account
                                        ↓
                                   Platform keeps commission (application_fee_amount)
                                        ↓
                                   Stripe transfers remainder to Seller's Connected Account
```

**Why Destination Charges?**
- Platform controls the checkout experience
- Single payment intent (not separate charges per seller)
- Stripe handles currency conversion and payout scheduling
- Platform fee automatically deducted

**Multi-seller orders:** One Payment Intent for the total order. Sub-order transfers to each seller are triggered separately after payment confirmation (via BullMQ job).

---

## 3. Checkout Flow (Sequence Diagram)

```
Customer         Frontend          Backend API       Stripe           MongoDB
   │                │                  │                │                 │
   │ Click Checkout │                  │                │                 │
   │───────────────►│                  │                │                 │
   │                │ POST /orders     │                │                 │
   │                │─────────────────►│                │                 │
   │                │                  │ Validate cart  │                 │
   │                │                  │ Check stock    │                 │
   │                │                  │─────────────────────────────────►│
   │                │                  │ Atomic: decrement inventory      │
   │                │                  │ + create order PENDING           │
   │                │                  │◄─────────────────────────────────│
   │                │                  │                │                 │
   │                │                  │ Create PaymentIntent             │
   │                │                  │───────────────►│                 │
   │                │                  │ { client_secret }               │
   │                │                  │◄───────────────│                 │
   │                │                  │                │                 │
   │                │ { order, client_secret }          │                 │
   │                │◄─────────────────│                │                 │
   │                │                  │                │                 │
   │ Stripe Elements│                  │                │                 │
   │ (card input)   │                  │                │                 │
   │───────────────►│ stripe.confirmPayment()           │                 │
   │                │─────────────────────────────────►│                 │
   │                │                  │ (async)        │                 │
   │                │                  │    Stripe fires webhook          │
   │                │                  │◄───────────────│                 │
   │                │                  │ Verify sig     │                 │
   │                │                  │ Enqueue job    │                 │
   │                │                  │ Return 200     │                 │
   │                │                  │                │                 │
   │                │                  │ (BullMQ processes webhook job)  │
   │                │                  │ Update order → CONFIRMED         │
   │                │                  │─────────────────────────────────►│
   │                │                  │ Emit socket: order:confirmed     │
   │                │◄─────────────────│                │                 │
   │ Order confirmed│                  │                │                 │
   │◄───────────────│                  │                │                 │
```

---

## 4. Payment Intent Creation

```typescript
// POST /api/v1/orders — creates order AND payment intent atomically

const paymentIntent = await stripe.paymentIntents.create({
  amount: order.total,           // in cents
  currency: "usd",
  customer: stripeCustomerId,    // optional: store Stripe customer
  metadata: {
    order_id: order._id.toString(),
    customer_id: customer._id.toString(),
    nexora_version: "1"
  },
  // For Stripe Connect (multi-seller):
  // Platform fee taken from first sub_order seller's connected account
  // Individual transfers handled post-payment via BullMQ
  idempotency_key: `order-${order._id}-intent`
});
```

---

## 5. Webhook Handler

```
POST /api/v1/payments/webhook
  Header: Stripe-Signature: t=...,v1=...

Handler logic:
  1. Read raw body (NOT parsed JSON — required for signature)
  2. stripe.webhooks.constructEvent(rawBody, sig, WEBHOOK_SECRET)
     → On failure: return 400 (reject unsigned payloads)
  3. Check event.id against payments.webhook_events[]
     → If duplicate: return 200 (idempotent)
  4. Append event.id to payments.webhook_events (update DB)
  5. Enqueue BullMQ job: "payment.process_webhook" with event data
  6. Return 200 immediately (Stripe will retry on non-2xx)
```

---

## 6. Webhook Events Handled

| Stripe Event | Action |
|---|---|
| `payment_intent.succeeded` | Confirm inventory, update order → CONFIRMED, trigger seller notification, trigger delivery assignment |
| `payment_intent.payment_failed` | Release reserved inventory, update order → CANCELLED, notify customer |
| `payment_intent.canceled` | Release inventory, cancel order |
| `charge.refunded` | Update refund record, update order payment_status |
| `account.updated` | Update seller Stripe onboarding status |
| `transfer.created` | Log seller payout |

---

## 7. Idempotency

Every payment operation includes idempotency keys:

```typescript
// Payment Intent creation
stripe.paymentIntents.create({...}, {
  idempotencyKey: `order-${orderId}-pi`
});

// Refund initiation
stripe.refunds.create({...}, {
  idempotencyKey: `refund-${refundId}`
});

// Seller transfer
stripe.transfers.create({...}, {
  idempotencyKey: `transfer-${subOrderId}`
});
```

---

## 8. Commission and Seller Payout

**Platform fee:** `STRIPE_PLATFORM_FEE_PERCENT` (e.g., 10%) taken from each sub-order.

**Post-payment transfer flow (BullMQ job):**
```
For each sub_order in order:
  seller_amount = sub_order.subtotal - platform_commission
  stripe.transfers.create({
    amount: seller_amount,
    currency: "usd",
    destination: seller.stripe_account_id,
    source_transaction: charge_id,
    transfer_group: `order-${orderId}`,
    metadata: { sub_order_id: subOrderId }
  })
  → Update sub_order.stripe_transfer_id
  → Update seller.pending_balance += seller_amount
```

---

## 9. Refund Flow

```
Admin: POST /api/v1/payments/admin/:paymentId/refund
  Body: { amount, reason, sub_order_id? }

Backend:
  1. Validate payment is in succeeded state
  2. Calculate refundable amount (total - already refunded)
  3. stripe.refunds.create({ payment_intent, amount, reason })
  4. On success: create refund record, update payment.status
  5. If partial: payment_status = partially_refunded
  6. If full: payment_status = refunded
  7. Release inventory (if applicable)
  8. Notify customer via Socket.IO + email
  9. Reverse seller transfer if applicable (Stripe API: stripe.transfers.createReversal)
```

---

## 10. Seller Withdrawal Flow

```
Seller: POST /api/v1/sellers/me/withdrawals
  Body: { amount }

Backend:
  1. Verify seller.stripe_onboarding_complete = true
  2. Verify seller.pending_balance >= amount
  3. MongoDB transaction:
     - Deduct amount from seller.pending_balance
     - Create withdrawal record (status: requested)
  4. Enqueue BullMQ job: "payment.process_withdrawal"

BullMQ job:
  stripe.payouts.create({
    amount,
    currency: "usd"
  }, {
    stripeAccount: seller.stripe_account_id  // payout from connected account
  })
  → Update withdrawal.status = completed
  → Update withdrawal.stripe_payout_id
```

---

## 11. Order-Payment State Machine

```
Order status:
pending → confirmed → completed
         ↘ cancelled

Payment status:
pending → succeeded → refunded | partially_refunded
         ↘ failed
         ↘ cancelled
```

**State transition rules:**
- Only Stripe webhooks trigger `payment_status` changes
- `order.status` transitions are driven by payment + seller + delivery events
- Frontend polls `GET /orders/:id` to get current state

---

## 12. Failure Scenarios

| Scenario | Handling |
|---|---|
| Webhook delivery delayed (up to 24h) | Order stays PENDING; customer can poll status; no action until webhook arrives |
| Webhook signature invalid | Return 400; Stripe will not retry (invalid secret = misconfiguration) |
| Duplicate webhook event | Idempotency check passes; return 200; no processing |
| Payment succeeds but transfer fails | Retry via BullMQ; alert admin if max retries exceeded |
| Withdrawal payout fails | Update withdrawal to failed; restore seller.pending_balance; notify seller |
| Refund fails (insufficient funds) | Log error; alert admin; manual resolution required |
| Order cancelled after partial payout | Reverse individual Stripe transfers per sub_order |

---

## 13. Security

- Raw body preserved with `express.raw()` on webhook route only
- Webhook signature verified before any DB access
- `STRIPE_WEBHOOK_SECRET` stored in environment variables only (never in code)
- Stripe API keys never logged
- No payment amounts trusted from client — always calculated server-side
- Customer cannot trigger seller transfers directly
