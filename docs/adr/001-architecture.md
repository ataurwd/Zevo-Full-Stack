# ADR 001 — Modular Monolith Architecture

## Date: 2024-01

## Status: Accepted

## Context
NEXORA is a full-stack multi-vendor marketplace. The system has many interconnected modules (auth, products, orders, payments, delivery, chat, etc.) that share data and business logic.

## Problem
Should the initial system be built as:
1. A Modular Monolith
2. Microservices from the start

## Decision
**Build as a Modular Monolith** with clean internal module boundaries.

## Alternatives Considered

| Option | Description | Rejected Because |
|---|---|---|
| Microservices from day 1 | Each module as a separate service | Premature complexity; network overhead; distributed transaction complexity; requires service mesh, API gateway, distributed tracing; much higher infra cost |
| Classic Monolith (no module boundaries) | All code in one namespace | Cannot extract later without full rewrite |
| Modular Monolith ✅ | Clean module boundaries, single deployment | Best balance of simplicity and extractability |

## Reasons
- Single deployment = simpler ops
- In-process communication = no network overhead
- Clean boundaries = extractable later
- Faster initial development
- Shared MongoDB + Redis without complex cross-service data patterns

## Trade-offs

| Pros | Cons |
|---|---|
| Simple deployment | Cannot scale individual modules independently |
| Fast internal calls | One bug can crash all modules |
| Lower operational overhead | Shared DB schema |
| Easy transactions across modules | Must maintain discipline on module boundaries |

## Consequences
- Each module must have its own router, controller, service, repository, validator, types
- Cross-module calls only via service function imports (not repository imports)
- Module directories are designed so they could become separate packages with minimal refactoring

## Failure Cases
- If module boundaries are violated: spaghetti code that cannot be extracted
- **Mitigation:** Code reviews enforce the boundary rule; linting rules can detect cross-module imports

## Scaling Implications
- Can horizontally scale the entire monolith (multiple instances behind Nginx)
- Cannot scale individual modules; if products module needs 10x and payments needs 1x, both get 10x
- **Acceptable** for current scale expectations; extraction can be done when needed
