# ADR 008 — Stripe as Payment Platform

## Date: 2024-01

## Status: Accepted

## Context
NEXORA is a multi-vendor marketplace. It needs: customer checkout, seller payouts with commission, refunds, and potentially subscription billing for sellers in the future.

## Decision
**Stripe** with:
- Payment Intents (customer checkout)
- Stripe Connect (Express accounts, seller payouts, commission via application_fee_amount)
- Webhooks as the authoritative payment event source

## Alternatives Considered

| Option | Rejected Because |
|---|---|
| PayPal | Weaker Connect equivalent (Adaptive Payments deprecated); poorer developer experience |
| Braintree | Less mature multi-party payment support; owned by PayPal |
| Manual bank transfers | No real-time confirmation; compliance complexity; terrible UX |
| Square | No multi-seller payout equivalent |
| Stripe ✅ | Industry-leading API; Connect purpose-built for marketplaces; webhook-first design |

## Reasons
- Stripe Connect Express: sellers onboard in minutes; Stripe handles KYC/AML compliance
- `application_fee_amount` on Payment Intent = automatic platform commission
- `transfer_group` = link multiple sub-order transfers to one charge
- Webhook-first: `payment_intent.succeeded` is authoritative; never trust frontend
- Excellent sandbox and test card suite
- PCI compliance handled by Stripe

## Trade-offs

| Pros | Cons |
|---|---|
| PCI compliance offloaded | Platform locked into Stripe pricing model |
| Connect handles seller KYC | Stripe fees (2.9% + 30¢ + Connect fees) |
| Webhook idempotency well-documented | Webhook processing must be async + idempotent |
| Test mode with real-like behavior | Complex multi-seller transfer logic |
| Global currency support | Platform fee taken per charge, not per transfer |

## Consequences
- Sellers must complete Stripe Connect onboarding before receiving orders
- Webhook endpoint must handle events asynchronously via BullMQ
- Stripe signature must be verified on every webhook (raw body required)
- Never calculate payment amounts on the client — always server-side
- Refunds trigger reverse transfers to sellers
