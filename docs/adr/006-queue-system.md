# ADR 006 — BullMQ for Background Job Queue

## Date: 2024-01

## Status: Accepted

## Context
NEXORA needs asynchronous processing for: email delivery, push notifications, Stripe webhook processing, rider auto-assignment, inventory alerts, invoices, and cleanup.

## Decision
Use **BullMQ** backed by existing Redis instance.

## Alternatives Considered

| Option | Rejected Because |
|---|---|
| Synchronous processing | Blocks HTTP response; email/PDF generation should not delay order confirmation |
| Bull (v3) | BullMQ is the actively maintained successor |
| RabbitMQ | Additional infrastructure with no clear benefit at current scale |
| AWS SQS | Cloud vendor lock-in; adds complexity |
| Node.js EventEmitter (in-process) | Events lost on process restart; no retry; no observability |
| BullMQ ✅ | Redis already required; mature; retry/backoff; observable |

## Reasons
- Redis already in the stack → no new infrastructure
- Persistent jobs (survive process restart via Redis AOF)
- Built-in retry with configurable backoff
- Delayed jobs (critical for delivery assignment timeout/retry)
- Concurrency control per queue
- BullBoard or custom metrics for observability

## Trade-offs

| Pros | Cons |
|---|---|
| Redis already available | Redis becomes more critical (queue + cache + Pub/Sub) |
| Retry and backoff built-in | Worker crash requires graceful shutdown handling |
| Delayed jobs | Workers must be stateless and idempotent |
| Observable | — |

## Consequences
- All BullMQ workers must be idempotent (safe to run multiple times)
- Workers run in same process as API server (MVP) or separate worker process (future)
- Failed jobs require dead-letter strategy and alerting
