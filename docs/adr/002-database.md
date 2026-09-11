# ADR 002 — MongoDB as Primary Database

## Date: 2024-01

## Status: Accepted

## Context
NEXORA stores products with dynamic variants/attributes, orders with embedded line item snapshots, seller profiles, and real-time delivery data.

## Problem
Which database engine to use?

## Decision
**MongoDB** (Native Driver, no Mongoose/ORM)

## Alternatives Considered

| Option | Rejected Because |
|---|---|
| PostgreSQL | Rigid schema makes product variants/attributes harder; joins are complex for multi-seller order splitting; less natural for semi-structured product data |
| MySQL | Same as PostgreSQL |
| MongoDB + Mongoose | Mongoose adds abstraction layer that hides raw driver behavior; Native Driver forces explicit, intentional queries; better performance |
| DynamoDB | AWS lock-in; complex query patterns; not ideal for complex filters/aggregations |

## Reasons
- Flexible schema fits product variants (arbitrary attributes per category)
- Document model fits order line item snapshots (embed at order time)
- Geospatial 2dsphere indexes for rider proximity
- Atlas Search (Lucene) built-in, no extra search infrastructure
- Transactions available on Replica Set
- Native Driver = explicit control over queries and indexes

## Trade-offs

| Pros | Cons |
|---|---|
| Flexible schema for product variants | No foreign key constraints (enforced in app code) |
| Embedded documents reduce joins | Deep nesting can be complex |
| Atlas Search included | Lucene is weaker than Elasticsearch for advanced search |
| 2dsphere geospatial built-in | Multi-document transactions are more complex than SQL |
| Horizontal sharding path | Fewer BI/reporting tools than PostgreSQL |

## Consequences
- MongoDB Replica Set required (even for local dev) for transaction support
- All referential integrity enforced at service layer
- Indexes must be designed explicitly
- No ORM — all queries written in MongoDB native syntax

## Failure Cases
- Large number of deeply nested updates become awkward
- **Mitigation:** Keep embedding to bounded, stable sub-documents; use references for independently accessed documents
