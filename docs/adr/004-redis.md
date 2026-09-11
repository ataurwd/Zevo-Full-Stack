# ADR 004 — Redis for Caching, Cart, and Rate Limiting

## Date: 2024-01

## Status: Accepted

## Context
NEXORA needs: (1) fast product/category cache, (2) cart storage for guests, (3) rate limiting, (4) Socket.IO Pub/Sub, (5) ephemeral data (OTP, rider location).

## Decision
Use Redis (ioredis) for the above purposes. Do NOT cache all data — only where there is clear performance benefit.

## Alternatives Considered

| Alternative | For what | Rejected Because |
|---|---|---|
| Memcached | Caching | Less versatile: no Pub/Sub, no sorted sets (needed for rate limit sliding window), no persistence option |
| In-memory (Node.js heap) | Caching | Not shared across instances; lost on restart |
| MongoDB for cart | Cart storage | Too heavy for ephemeral session data; poor TTL support |
| No caching (always hit DB) | — | Product listing under load would strain MongoDB |

## Reasons
- Redis is already required for BullMQ and Socket.IO adapter — no new infrastructure
- Sorted sets support sliding window rate limiting
- String with TTL fits OTP and token blacklist perfectly
- Pub/Sub fits Socket.IO adapter
- Cart as Redis hash/string with rolling TTL = perfect fit

## Trade-offs

| Pros | Cons |
|---|---|
| Very fast reads (sub-ms) | Another infrastructure component |
| TTL is native | Cache invalidation complexity |
| Multi-purpose: cache + queue + Pub/Sub | Single Redis = single point of failure (mitigated with AOF + replica) |
| Reduces MongoDB load significantly | Must handle Redis downtime gracefully |

## Consequences
- System must degrade gracefully if Redis is temporarily unavailable (cache miss falls to DB)
- All Redis keys must follow naming convention (see 08-CACHING-REDIS-DESIGN.md)
- Selective caching only — not all resources get cached

## Failure Cases
- Redis data loss: cart lost for guests (worst case: customer must re-add items); all other data in MongoDB
- Redis connection failure: cache miss path → DB; rate limiting falls back to in-memory
- Socket.IO multi-instance fails if Redis is down: clients on different instances can't share events
