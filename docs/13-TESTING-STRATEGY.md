# 13 — NEXORA Testing Strategy

## 1. Testing Philosophy

- Test behavior, not implementation.
- Focus coverage on business-critical paths: orders, payments, inventory, auth.
- Integration tests are more valuable than unit tests for this domain.
- Every bug fixed should produce a regression test.
- Do not test third-party libraries (Stripe, MongoDB driver) — mock them.

---

## 2. Testing Layers

```
E2E (Playwright)            — Critical user journeys
    ↑
API / Integration Tests     — Full request-response cycle with real DB
    ↑
Unit Tests                  — Pure business logic, utilities
```

---

## 3. Unit Tests

**Tool:** Vitest (or Jest for Node.js backend)  
**Coverage target:** 80% for service layer functions

**What to unit test:**
- Price calculation (commission, discount, total)
- Zod schema validation logic
- JWT utility functions
- Inventory state transitions
- Delivery state machine transitions
- Coupon validation logic
- Pagination utilities

**What NOT to unit test:**
- Database queries (too much mocking = brittle tests)
- External API calls (mock at integration level)
- Express routing (test via API integration tests)

**Example:**
```typescript
// tests/unit/services/orders.service.test.ts
describe("calculateOrderTotals", () => {
  it("applies percentage coupon correctly", () => {
    const result = calculateOrderTotals({
      items: [{ subtotal: 10000 }],  // $100
      coupon: { type: "percentage", value: 10 },  // 10%
      deliveryFee: 500,
      commissionRate: 10
    });
    expect(result.discount).toBe(1000);  // $10 off
    expect(result.total).toBe(9500);     // $95 total
  });
});
```

---

## 4. Integration Tests

**Tool:** Supertest + MongoDB in-memory (or Docker test container)  
**What to integration test:**

| Area | Test Scenarios |
|---|---|
| Auth | Register, login, token refresh, logout, password reset |
| Products | Create (seller), approve (admin), browse (public), access control |
| Inventory | Stock decrement on order, restore on cancel, concurrent stock check |
| Cart | Add item, merge guest cart, validate before checkout |
| Orders | Create order (reserve inventory), cancel order (restore inventory) |
| Payments | Webhook received, order confirmed, duplicate webhook ignored |
| Delivery | Task created, rider assigned, status transitions |
| RBAC | Seller cannot access other seller's products/orders |

**Test database:** Separate `nexora_test` database, cleared between test suites.

**Example:**
```typescript
// tests/integration/orders.test.ts
describe("POST /api/v1/orders", () => {
  it("reserves inventory on order creation", async () => {
    const { token } = await loginCustomer();
    const before = await getInventory(SKU);

    const res = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({ address_id: testAddress._id });

    expect(res.status).toBe(201);
    const after = await getInventory(SKU);
    expect(after.quantity).toBe(before.quantity - 1);
    expect(after.reserved).toBe(before.reserved + 1);
  });

  it("returns 409 when stock is insufficient", async () => {
    await setInventory(SKU, { quantity: 0 });
    const { token } = await loginCustomer();

    const res = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({ address_id: testAddress._id });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("INSUFFICIENT_STOCK");
  });
});
```

---

## 5. API Tests

**Tool:** Bruno (recommended) or REST Client (VS Code)  
**Purpose:** Document and manually verify API contracts during development.

Test collections organized by module:
```
api-tests/
├── auth.bru
├── products.bru
├── orders.bru
├── payments.bru
└── delivery.bru
```

---

## 6. Frontend Tests

**Tool:** Vitest + React Testing Library + MSW (Mock Service Worker)

**What to test:**
- Form validation (React Hook Form + Zod)
- Cart operations (add, remove, quantity update)
- Checkout flow (UI state transitions)
- Conditional rendering based on user role

**What NOT to test on frontend:**
- Next.js routing (framework responsibility)
- CSS/styling (visual regression tests instead)

---

## 7. E2E Tests

**Tool:** Playwright

**Critical journeys to test:**

| Journey | Actor | Steps |
|---|---|---|
| Customer checkout | Customer | Register → Browse → Add to Cart → Checkout → Stripe test card → Order confirmed |
| Seller order fulfillment | Seller | Login → View new order → Confirm → Preparing → Ready |
| Delivery flow | Rider | Login → Go online → Accept task → Pickup → Deliver |
| Admin moderation | Admin | Login → Approve seller → Approve product |

**Test environment:** Staging with Stripe test mode, seeded test data.

---

## 8. Socket.IO Testing

**Tool:** `socket.io-client` in integration tests

```typescript
// tests/integration/realtime/order.events.test.ts
it("emits order:confirmed when payment webhook succeeds", async () => {
  const customerSocket = io(TEST_SERVER_URL, {
    auth: { token: customerToken }
  });

  await new Promise(resolve => customerSocket.on("connect", resolve));
  customerSocket.emit("join:order", { orderId });

  // Trigger Stripe webhook
  await simulateStripeWebhook("payment_intent.succeeded", paymentIntentId);

  // Wait for socket event
  const event = await new Promise(resolve => {
    customerSocket.on("order:confirmed", resolve);
  });

  expect(event.orderId).toBe(orderId);
  customerSocket.close();
});
```

---

## 9. Payment Testing

**Stripe test cards:**
| Card | Scenario |
|---|---|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Declined |
| 4000 0025 0000 3155 | Requires 3D Secure |
| 4000 0000 0000 9995 | Insufficient funds |

**Webhook testing locally:**
```bash
stripe listen --forward-to localhost:5000/api/v1/payments/webhook
```

---

## 10. Security Testing

- [ ] Auth: attempt access to other user's resources → expect 403
- [ ] Seller isolation: Seller A cannot GET/PATCH Seller B's products → expect 403
- [ ] IDOR: increment order ID and attempt access → expect 404 or 403
- [ ] JWT tampered: modify token payload → expect 401
- [ ] Rate limit: send 11 login requests in 15 min → expect 429
- [ ] Stripe webhook: send without Stripe-Signature → expect 400
- [ ] Upload: attempt to upload `.exe` file → expect 400
- [ ] Mass assignment: send `role: "ADMIN"` in register body → role must remain CUSTOMER

---

## 11. Regression Testing

Every bug fix must include:
1. A test that reproduces the bug
2. A fix that makes the test pass
3. The test remains in the regression suite permanently

Track regressions in CI: any new test failure on the `main` branch blocks deployment.

---

## 12. Pre-Production Checklist

Before any production deployment:

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass on staging
- [ ] Payment flow tested with Stripe test mode
- [ ] Auth flow: login, refresh, logout tested
- [ ] RBAC: cross-seller access denied
- [ ] Rate limiting: verified active on auth endpoints
- [ ] Webhook signature verification: tested with invalid signature
- [ ] Inventory race condition: concurrent order test passes
- [ ] Socket.IO events: order flow emits correct events
- [ ] Load test: baseline k6 test passes on staging
