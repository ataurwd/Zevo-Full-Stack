# 05 — NEXORA Real-Time Architecture (Socket.IO)

## 1. Architecture Overview

```
Client (browser)
  ↓ WebSocket (with JWT in handshake auth)
Nginx (ip_hash sticky sessions, WebSocket upgrade proxy)
  ↓
API Server Instance (Socket.IO + Redis Pub/Sub Adapter)
  ↓
Redis (channel broker for cross-instance event delivery)
  ↓
Other API Server Instances → their connected clients
```

**Key principle:** Socket.IO is used for **event delivery only**. It does NOT store state. All persistent data is written to MongoDB before emitting Socket.IO events.

---

## 2. Scaling Decision

**Decision: Redis Pub/Sub Adapter + Nginx sticky sessions.**

Without a shared adapter, events emitted on Instance #1 would not reach clients connected to Instance #2. The Redis adapter solves this by routing all socket events through a Redis Pub/Sub channel.

**Sticky sessions (ip_hash)** ensure the initial Socket.IO HTTP upgrade and subsequent polling fallback land on the same backend instance. After upgrade to WebSocket, the connection is persistent and sticky automatically.

```nginx
upstream backend {
  ip_hash;  # sticky sessions for WebSocket
  server api1:5000;
  server api2:5000;
  server api3:5000;
}
```

**Socket.IO adapter setup:**
```typescript
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";

const pubClient = createClient({ url: REDIS_URL });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

---

## 3. Connection Lifecycle

```
1. Client connects:
   io({ auth: { token: access_token }, transports: ["websocket"] })

2. Socket auth middleware:
   - Verify JWT from handshake.auth.token
   - Attach socket.data.user = { _id, role }
   - On failure: emit "auth_error", disconnect

3. Client joins rooms (after auth):
   - socket.join(`user:${userId}`)   ← personal room (always)

4. On viewing order:
   socket.emit("join:order", orderId)
   → Server: socket.join(`order:${orderId}`)
   → Only participants of this order are allowed

5. On viewing delivery:
   socket.emit("join:delivery", taskId)
   → Server: socket.join(`delivery:${taskId}`)

6. On disconnect:
   - Auto-leave all rooms (Socket.IO handles this)
   - Update rider presence in Redis (is_online marker expires)
```

---

## 4. Namespaces

Single namespace `/` (default).

**Reason:** Multiple namespaces add complexity without clear benefit in this architecture. Room-based isolation provides sufficient separation between contexts (user, order, delivery, chat).

---

## 5. Room Strategy

| Room | Pattern | Who joins | Purpose |
|---|---|---|---|
| Personal | `user:{userId}` | User on connect | Private notifications, personal events |
| Order | `order:{orderId}` | Customer + Seller | Order status updates |
| Sub-order | `suborder:{subOrderId}` | Seller + Rider | Seller-specific updates |
| Delivery | `delivery:{taskId}` | Customer + Rider | Location updates, delivery status |
| Chat | `chat:{conversationId}` | Conversation participants | Chat messages |

---

## 6. Event Naming Convention

Pattern: `{domain}:{action}` (lowercase, colon-separated)

---

## 7. Event Reference

### Order Events

| Event | Direction | Room | Payload |
|---|---|---|---|
| `order:created` | Server→Customer | `user:{customerId}` | `{ orderId, orderNumber, status }` |
| `order:confirmed` | Server→Customer | `order:{orderId}` | `{ orderId, status, subOrders }` |
| `order:preparing` | Server→Customer | `order:{orderId}` | `{ orderId, subOrderId, status }` |
| `order:ready_for_pickup` | Server→Customer | `order:{orderId}` | `{ orderId, subOrderId }` |
| `order:cancelled` | Server→Customer | `order:{orderId}` | `{ orderId, reason }` |
| `order:completed` | Server→Customer | `order:{orderId}` | `{ orderId }` |
| `suborder:new` | Server→Seller | `user:{sellerId}` | `{ subOrderId, orderId, itemCount }` |
| `suborder:status_changed` | Server→Seller | `user:{sellerId}` | `{ subOrderId, status }` |

### Delivery Events

| Event | Direction | Room | Payload |
|---|---|---|---|
| `delivery:assigned` | Server→Customer, Rider | `order:{orderId}`, `user:{riderId}` | `{ taskId, riderId, estimatedPickup }` |
| `delivery:en_route_pickup` | Server→Customer | `delivery:{taskId}` | `{ taskId, status, riderLocation }` |
| `delivery:picked_up` | Server→Customer | `delivery:{taskId}` | `{ taskId, estimatedDelivery }` |
| `delivery:en_route_delivery` | Server→Customer | `delivery:{taskId}` | `{ taskId, riderLocation }` |
| `delivery:delivered` | Server→Customer | `delivery:{taskId}` | `{ taskId, deliveredAt }` |
| `delivery:failed` | Server→Customer, Admin | `delivery:{taskId}`, `user:{adminRoom}` | `{ taskId, reason }` |
| `delivery:location_updated` | Server→Customer | `delivery:{taskId}` | `{ taskId, lat, lon, timestamp }` |
| `delivery:task_assigned` | Server→Rider | `user:{riderId}` | `{ taskId, pickupAddress, deliveryAddress }` |

### Chat Events

| Event | Direction | Room | Payload |
|---|---|---|---|
| `chat:message` | Server→Participants | `chat:{conversationId}` | `{ messageId, senderId, content, type, sentAt }` |
| `chat:typing_start` | Server→Participants | `chat:{conversationId}` | `{ userId, conversationId }` |
| `chat:typing_stop` | Server→Participants | `chat:{conversationId}` | `{ userId, conversationId }` |
| `chat:message_read` | Server→Sender | `chat:{conversationId}` | `{ messageId, readBy, readAt }` |
| `join:chat` | Client→Server | — | `{ conversationId }` |

### Notification Events

| Event | Direction | Room | Payload |
|---|---|---|---|
| `notification:new` | Server→User | `user:{userId}` | `{ notificationId, type, title, body, referenceId }` |
| `notification:read` | Server→User | `user:{userId}` | `{ notificationId }` |

### Presence Events

| Event | Direction | Room | Payload |
|---|---|---|---|
| `presence:online` | Server→Relevant | (internal) | `{ userId, role }` |
| `presence:offline` | Server→Relevant | (internal) | `{ userId }` |

### Control Events (Client→Server)

| Event | Purpose | Payload |
|---|---|---|
| `join:order` | Join order room | `{ orderId }` |
| `join:delivery` | Join delivery tracking room | `{ taskId }` |
| `join:chat` | Join chat room | `{ conversationId }` |
| `leave:order` | Leave order room | `{ orderId }` |
| `rider:location` | Broadcast rider GPS | `{ lat, lon }` |

---

## 8. Rider Location Broadcasting

```
Rider app → socket.emit("rider:location", { lat, lon })
  → Server validates: rider is authenticated + has active delivery task
  → Server stores in Redis: "rider:location:{riderId}" = JSON.stringify({lat, lon, ts})
     TTL: 30 seconds (expires if rider disconnects)
  → Server emits to delivery room: io.to(`delivery:${taskId}`).emit("delivery:location_updated", ...)
  → Customer sees live location on Mapbox
```

**Frequency:** Rider sends location every 5–10 seconds.  
**Redis key purpose:** Last known location for ETA calculation and for customers who join mid-delivery.

---

## 9. Offline Behavior

**Customer goes offline mid-order:**
- Socket.IO auto-reconnects (exponential backoff, max 5 retries)
- On reconnect: client re-joins rooms (emits `join:order`, etc.)
- Client fetches current state via REST API (`GET /orders/:id`) — not via Socket.IO
- Socket.IO is supplementary (real-time updates), REST is authoritative (current state)

**Rider disconnects:**
- `delivery_agents.is_online` is NOT immediately set to false (brief disconnects during delivery are normal)
- Redis key `rider:location:{riderId}` expires after 30s
- If disconnect exceeds 60s, a BullMQ job marks rider as offline and triggers reassignment consideration

**Seller disconnects:**
- No special handling — they poll via REST; new order notification will appear when they reconnect via REST or next Socket.IO reconnect

---

## 10. Authentication Flow

```typescript
// Socket.IO auth middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("UNAUTHORIZED"));

  try {
    const payload = jwt.verify(token, JWT_ACCESS_SECRET);
    socket.data.user = {
      _id: payload.sub,
      role: payload.role
    };
    next();
  } catch {
    next(new Error("INVALID_TOKEN"));
  }
});
```

**Note:** Access token (15 min) may expire during a long WebSocket session. The client must refresh the access token and reconnect. Frontend should:
1. Listen for `auth_error` event
2. Call `/auth/refresh` to get new access token
3. Reconnect Socket.IO with new token

---

## 11. Room Authorization

When a client requests to join a room, the server validates they are a participant:

```typescript
socket.on("join:order", async ({ orderId }) => {
  const order = await ordersRepo.findById(orderId);
  const userId = socket.data.user._id;
  const role = socket.data.user.role;

  const isCustomer = order.customer_id.toString() === userId;
  const isSeller = await subOrdersRepo.hasSellerInOrder(orderId, userId);
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

  if (!isCustomer && !isSeller && !isAdmin) {
    socket.emit("error", { code: "FORBIDDEN", message: "Not a participant" });
    return;
  }

  socket.join(`order:${orderId}`);
  socket.emit("joined:order", { orderId });
});
```

---

## 12. Error Handling

```typescript
// Client-side error handling
socket.on("error", ({ code, message }) => {
  console.error(`Socket error [${code}]: ${message}`);
});

socket.on("connect_error", (err) => {
  if (err.message === "UNAUTHORIZED") {
    // Redirect to login
  }
});
```

---

## 13. Reconnection Strategy

```typescript
// Client configuration
const socket = io(SOCKET_URL, {
  auth: { token: getAccessToken() },
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000,
  randomizationFactor: 0.5
});

socket.on("reconnect", (attempt) => {
  // Re-join all relevant rooms
  if (currentOrderId) socket.emit("join:order", { orderId: currentOrderId });
  if (currentDeliveryTaskId) socket.emit("join:delivery", { taskId: currentDeliveryTaskId });
});
```
