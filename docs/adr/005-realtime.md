# ADR 005 — Socket.IO for Real-Time Communication

## Date: 2024-01

## Status: Accepted

## Context
NEXORA needs real-time: order status updates, delivery location tracking, chat messages, notifications.

## Decision
Use **Socket.IO** with **Redis Pub/Sub Adapter** and **Nginx ip_hash sticky sessions**.

## Alternatives Considered

| Option | Rejected Because |
|---|---|
| Long Polling | Higher server load, worse latency |
| SSE (Server-Sent Events) | Unidirectional only; chat requires bidirectional |
| WebSocket (raw) | Would need to reimplement rooms, reconnection, fallback |
| Socket.IO (single instance, no Redis adapter) | Does not scale horizontally |
| Socket.IO + sticky sessions only | Works but clients connected to crashed instance lose events from other instances |
| Socket.IO + Redis adapter ✅ | All instances share event bus; scales horizontally |

## Reasons
- Socket.IO provides: rooms, namespaces, auto-reconnection, fallback transports
- Redis adapter allows events emitted on Instance 1 to reach clients on Instance 2
- ip_hash ensures WebSocket upgrade handshake hits same instance

## Trade-offs

| Pros | Cons |
|---|---|
| Built-in rooms, reconnection | Redis dependency (but already needed) |
| Works across multiple instances | ip_hash can cause uneven distribution |
| Auto-fallback to polling | Single namespace used (simpler but less granular) |
| Wide client library support | Access token expires during long sessions (must reconnect) |

## Consequences
- Must handle expired access token during live WebSocket session (reconnect flow)
- Room authorization must be enforced server-side on every join event
- Socket.IO is for event delivery ONLY — state is always read from REST API
