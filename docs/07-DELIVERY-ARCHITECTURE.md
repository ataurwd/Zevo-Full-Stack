# 07 — NEXORA Delivery Architecture

## 1. Delivery Model

NEXORA operates a **platform-owned delivery network**. Riders are independent contractors who register on the platform, get approved by admin, and receive delivery tasks auto-assigned by the system.

One `delivery_task` is created per `sub_order` (per seller). A multi-seller order generates multiple delivery tasks.

---

## 2. Rider Lifecycle

```
Registration
  ↓ User registers with role: DELIVERY_AGENT
  ↓ Uploads documents (ID, license, vehicle photo) via Cloudinary
  ↓
Pending Review
  ↓ Admin reviews application
  ↓
Approved / Rejected
  ↓ (if approved)
  ↓
Active Rider
  ↓ Can go online/offline
  ↓ Receives delivery task assignments
  ↓ Updates GPS location
  ↓
Suspended (admin action)
  ↓
Reactivated (admin action)
```

---

## 3. Delivery State Machine

```
                    ┌──────────────┐
                    │  unassigned  │  ← task created when sub_order = ready_for_pickup
                    └──────┬───────┘
                           │ BullMQ auto-assign job
                           ▼
                    ┌──────────────┐
                    │   assigned   │  ← nearest available rider selected
                    └──────┬───────┘
                           │ Rider accepts (or auto-proceeds)
                           ▼
                  ┌─────────────────────┐
                  │  en_route_pickup    │  ← rider heads to store
                  └──────────┬──────────┘
                             │ Rider arrives + picks up order
                             ▼
                  ┌─────────────────────┐
                  │     picked_up       │
                  └──────────┬──────────┘
                             │ Rider heads to customer
                             ▼
                  ┌──────────────────────┐
                  │ en_route_delivery    │
                  └──────────┬───────────┘
                             │ Rider delivers
                         ┌───┴────────────────────┐
                         ▼                        ▼
                  ┌────────────┐          ┌──────────────┐
                  │ delivered  │          │    failed    │  ← customer unreachable
                  └────────────┘          └──────┬───────┘
                                                 │
                                    Admin reassigns or cancels
```

**Allowed transitions (enforced server-side):**

| From | To | Who |
|---|---|---|
| unassigned | assigned | System (BullMQ) |
| assigned | en_route_pickup | Rider |
| en_route_pickup | picked_up | Rider |
| picked_up | en_route_delivery | Rider |
| en_route_delivery | delivered | Rider |
| en_route_delivery | failed | Rider |
| assigned | unassigned | System (timeout/reassign) |
| any active | cancelled | Admin only |

---

## 4. Auto-Assignment Algorithm

**Trigger:** When `sub_order.status` transitions to `ready_for_pickup`.

**BullMQ Job: `delivery.assign`**

```
1. Find available riders:
   db.delivery_agents.find({
     status: "approved",
     is_online: true,
     current_location: {
       $near: {
         $geometry: { type: "Point", coordinates: store.location.coordinates },
         $maxDistance: 5000  // 5km radius (configurable)
       }
     }
   })
   // Exclude riders who already have an active task (status != delivered/failed/cancelled)

2. If no riders found within 5km:
   - Expand radius to 10km
   - Retry after 2 minutes (BullMQ delayed job)
   - After 3 attempts: notify admin via socket

3. Select the closest available rider (first result from $near query)

4. Create/update delivery_task:
   - status: assigned
   - delivery_agent_id: selected rider
   - assigned_at: now
   - assignment_attempts: +1

5. Emit socket to rider:
   io.to(`user:${riderId}`).emit("delivery:task_assigned", {
     taskId, pickupAddress, deliveryAddress, orderId
   })

6. Notify seller: rider assigned
7. Notify customer: rider assigned + ETA
```

---

## 5. Assignment Timeout & Reassignment

```
If rider does not transition to en_route_pickup within 10 minutes of assignment:
  BullMQ delayed job fires → check task still in "assigned" status
  → Set task status back to "unassigned"
  → Mark previous rider as "skipped" for this task (optional: temporary cooldown)
  → Re-run auto-assignment
  → Increment assignment_attempts
  → If assignment_attempts > 5: alert admin
```

---

## 6. Location Tracking

**Data flow:**
```
Rider app → socket.emit("rider:location", { lat, lon })
  → Server validates: rider has active delivery task
  → Redis: SET rider:location:{riderId} {lat, lon, ts} EX 30
  → Emit to delivery room:
    io.to(`delivery:${taskId}`).emit("delivery:location_updated", {lat, lon, ts})
```

**ETA calculation:**
- On `delivery:location_updated` server-side:
  - Calculate distance from rider to destination (Haversine formula)
  - Estimate ETA (avg speed: 30 km/h in city)
  - Include in location_updated event payload

**Location persistence:** Redis only (ephemeral). Last known location available for up to 30 seconds. Not stored in MongoDB (no permanent location history in MVP — too expensive).

---

## 7. Rider Earnings

```
On delivery.status → delivered:
  task.rider_earnings = base_delivery_fee (e.g., platform-defined per task)
  delivery_agent.pending_earnings += task.rider_earnings
  delivery_agent.total_earnings += task.rider_earnings
  Create inventory_transactions-style earnings record (for audit)
```

**Rider payout:** Manual for MVP (admin initiates Stripe payout to rider's bank account). Future: automated periodic payout via BullMQ scheduled job.

---

## 8. Failure Scenarios

| Scenario | Handling |
|---|---|
| No riders available | Retry with expanded radius; alert admin after 3 attempts |
| Rider assignment timeout | Auto-reassign; increment attempts counter |
| Rider goes offline during delivery | Send alert; admin decides to reassign or contact rider |
| Rider marks delivered but customer disputes | Admin investigation; sub_order stays delivered until admin resolves |
| Failed delivery (customer unreachable) | Rider marks failed with reason; admin initiates refund or reschedule |
| Rider GPS stops updating | Redis key expires; customer sees "location unavailable"; delivery continues |
| Multiple task assignment (race condition) | Redis distributed lock during assignment: `SET lock:assignment:{riderId} ... NX EX 10` |

---

## 9. Sub-Order Status Updates

When a delivery_task status changes, the corresponding sub_order status also updates:

| delivery_task status | sub_order status |
|---|---|
| assigned | (no change — still ready_for_pickup) |
| picked_up | picked_up |
| delivered | delivered |
| failed | requires_attention |

---

## 10. Delivery Zones (MVP)

MVP does not enforce strict delivery zones. Riders are found by proximity only.

**Future:** Define `delivery_zones` collection with GeoJSON polygons. Assign riders and stores to zones. Only match riders from the correct zone.

---

## 11. API Summary

```
Rider location update:
POST /api/v1/delivery/rider/me/location
Body: { lat: 23.8103, lon: 90.4125 }

Delivery status transitions:
PATCH /api/v1/delivery/rider/me/tasks/:taskId/pickup
PATCH /api/v1/delivery/rider/me/tasks/:taskId/deliver
PATCH /api/v1/delivery/rider/me/tasks/:taskId/fail
Body (fail): { reason: "Customer unreachable" }

Customer tracking:
GET /api/v1/delivery/track/:taskId
Response: { status, riderLocation, estimatedDelivery, rider: { name, phone, vehicle } }
```
