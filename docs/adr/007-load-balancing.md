# ADR 007 — Nginx as Reverse Proxy and Load Balancer

## Date: 2024-01

## Status: Accepted

## Context
NEXORA needs to handle HTTPS termination, WebSocket proxying, static file serving, and load distribution across multiple API server instances.

## Decision
Use **Nginx** as the edge proxy, SSL terminator, and load balancer.

## Alternatives Considered

| Option | Rejected Because |
|---|---|
| HAProxy | Good for TCP/HTTP load balancing but less versatile for static file serving |
| Traefik | More complex, Docker-label-based config adds indirection |
| AWS ALB | Cloud lock-in; adds cost; overkill for VPS deployment |
| Express directly on port 443 | No load balancing; SSL in Node.js is less efficient |
| Nginx ✅ | Proven, simple config, excellent WebSocket support, very high performance |

## Reasons
- Nginx handles SSL termination efficiently (hardware acceleration possible)
- ip_hash for Socket.IO sticky sessions
- Passive health checks for upstream instances
- gzip compression at edge
- Static file serving for Next.js exports
- Rate limiting at edge (before reaching Express)

## Trade-offs

| Pros | Cons |
|---|---|
| Very high throughput (async architecture) | Single point of failure if Nginx crashes (mitigated by Docker restart) |
| Simple configuration | ip_hash can cause load imbalance |
| WebSocket proxying built-in | Nginx Plus required for active health checks |
| Battle-tested | Manual upstream pool management |

## Consequences
- ip_hash used for WebSocket; can be changed to round-robin if Redis adapter makes sticky sessions unnecessary
- Nginx config must be updated when API server count changes
- Graceful shutdown: API servers drain connections before stopping; Nginx detects via health check
