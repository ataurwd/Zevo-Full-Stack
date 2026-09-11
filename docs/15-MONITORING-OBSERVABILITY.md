# 15 — NEXORA Monitoring & Observability

## 1. Observability Stack

| Tool | Purpose | When |
|---|---|---|
| **Pino** | Structured JSON logging | All environments |
| **Prometheus** | Metrics collection | Staging + Production |
| **Grafana** | Metrics visualization | Staging + Production |
| **Sentry** | Error tracking + alerts | Staging + Production |
| **Uptime Monitor** | External health check | Production (e.g., UptimeRobot) |

---

## 2. Structured Logging (Pino)

### Configuration
```typescript
// infrastructure/logger.ts
import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  base: { service: "nexora-api" },
  timestamp: pino.stdTimeFunctions.isoTime,
  // Development: pretty print; Production: JSON
  ...(process.env.LOG_PRETTY === "true" ? {
    transport: { target: "pino-pretty", options: { colorize: true } }
  } : {})
});

export default logger;
```

### Log Levels
| Level | When |
|---|---|
| `trace` | Detailed debugging (disabled in production) |
| `debug` | Development debugging |
| `info` | Normal operations (request received, job completed) |
| `warn` | Unusual but handled events (rate limit hit, cache miss cascade) |
| `error` | Errors that affect a request/job |
| `fatal` | System-level failures (DB connection lost) |

### Request Logger
```typescript
// middleware/requestLogger.ts
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    logger.info({
      req: {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get("user-agent")
      },
      res: {
        status: res.statusCode,
        latencyMs: Date.now() - start
      },
      userId: req.user?._id,
      requestId: req.id  // from express-request-id middleware
    }, "HTTP request");
  });

  next();
});
```

### What to Log

| Event | Level | Fields |
|---|---|---|
| HTTP request/response | info | method, url, status, latency, userId |
| Auth failure (login) | warn | ip, email (hashed), reason |
| Auth success | info | userId, role |
| Payment webhook received | info | stripeEventId, type |
| Payment processed | info | orderId, amount, status |
| Job started | info | queue, jobId, name |
| Job completed | info | queue, jobId, duration |
| Job failed | error | queue, jobId, error, attempt |
| DB query slow (>200ms) | warn | collection, operation, duration |
| Cache miss | debug | key |
| Rate limit hit | warn | ip, userId, route |
| Error (handled) | error | message, stack, requestId |
| Error (unhandled) | fatal | message, stack |

### What NOT to Log
- Passwords or password hashes
- JWT token values
- API keys (Stripe, Cloudinary)
- Full credit card data (never in scope)
- Full request bodies on auth endpoints

---

## 3. Prometheus Metrics

### Metrics Endpoint
```
GET /api/v1/health/metrics
Authorization: Bearer <super_admin_token>
```

### Custom Metrics

```typescript
// infrastructure/metrics.ts
import { Registry, Counter, Histogram, Gauge } from "prom-client";

export const registry = new Registry();
registry.setDefaultLabels({ service: "nexora-api" });

// HTTP request duration
export const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [registry]
});

// Active orders
export const activeOrdersGauge = new Gauge({
  name: "nexora_active_orders_total",
  help: "Number of orders in non-terminal states",
  registers: [registry]
});

// Payment success/failure
export const paymentCounter = new Counter({
  name: "nexora_payments_total",
  help: "Total payment events",
  labelNames: ["status"],  // succeeded | failed | refunded
  registers: [registry]
});

// BullMQ job metrics
export const jobDuration = new Histogram({
  name: "bullmq_job_duration_seconds",
  help: "BullMQ job processing duration",
  labelNames: ["queue", "name"],
  buckets: [0.01, 0.1, 0.5, 1, 5, 30],
  registers: [registry]
});

export const jobFailureCounter = new Counter({
  name: "bullmq_job_failures_total",
  help: "Total failed BullMQ jobs",
  labelNames: ["queue", "name"],
  registers: [registry]
});

// Redis cache metrics
export const cacheHitCounter = new Counter({
  name: "nexora_cache_hits_total",
  help: "Redis cache hits",
  labelNames: ["resource"],
  registers: [registry]
});

export const cacheMissCounter = new Counter({
  name: "nexora_cache_misses_total",
  help: "Redis cache misses",
  labelNames: ["resource"],
  registers: [registry]
});
```

---

## 4. Grafana Dashboards

### Dashboard: API Performance
Panels:
- Request rate (req/sec) — by endpoint
- Error rate — by endpoint
- P50/P95/P99 latency — by endpoint
- Active connections

### Dashboard: Business Metrics
Panels:
- Orders created (last 24h, 7d, 30d)
- Revenue (GMV) over time
- Payment success rate
- Active sellers / active riders
- Cart abandonment (orders created without payment)

### Dashboard: Infrastructure
Panels:
- CPU usage per container
- Memory usage per container
- MongoDB: operations/sec, connection pool, replication lag
- Redis: memory usage, hit rate, connections
- BullMQ: queue depth per queue, jobs/sec, failure rate
- Nginx: connections, requests/sec

---

## 5. Health Check Endpoints

### Liveness Probe (`/api/v1/health/live`)
**Purpose:** Is the process alive? (Kubernetes liveness / Docker healthcheck)  
**Logic:** Always returns 200 if the Express process is running.  
**Does NOT check:** MongoDB, Redis.

```json
{ "success": true, "data": { "status": "alive" } }
```

### Readiness Probe (`/api/v1/health/ready`)
**Purpose:** Is the service ready to receive traffic? (Kubernetes readiness / Nginx health check)  
**Logic:** Checks MongoDB ping + Redis ping.

```json
{
  "success": true,
  "data": {
    "status": "ready",
    "checks": {
      "mongodb": "up",
      "redis": "up",
      "bullmq": "up"
    },
    "uptime_seconds": 3847,
    "version": "1.0.0"
  }
}
```

If any check fails: returns `503 Service Unavailable`.

---

## 6. Error Tracking (Sentry)

```typescript
// app.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: SENTRY_DSN,
  environment: NODE_ENV,
  tracesSampleRate: NODE_ENV === "production" ? 0.1 : 1.0,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app })
  ]
});

// After all routes:
app.use(Sentry.Handlers.errorHandler());
```

**What Sentry captures:**
- Unhandled exceptions
- Unhandled promise rejections
- 500-level HTTP errors
- BullMQ worker crashes

**What to annotate in Sentry:**
- User context (userId, role) — no PII like email
- Request context (route, method)
- Custom tags: `module`, `queue_name`

---

## 7. Alerting

### Alert Rules (Grafana / Prometheus)

| Alert | Condition | Severity | Action |
|---|---|---|---|
| High error rate | Error rate > 5% for 5 min | Critical | Page on-call |
| API latency high | P95 > 2000ms for 5 min | Warning | Notify team |
| MongoDB down | Readiness check failing | Critical | Page on-call |
| Redis down | Readiness check failing | Critical | Page on-call |
| Payment job failures | > 3 failed payment.webhook jobs | Critical | Page on-call |
| Queue depth high | BullMQ queue > 1000 jobs | Warning | Notify team |
| Low disk space | < 20% free on MongoDB volume | Warning | Notify team |
| Memory high | Container memory > 85% | Warning | Notify team |
| Sentry error spike | > 50 errors in 5 min | Warning | Notify team |

---

## 8. Log Aggregation

**Development:** Console/stdout (pino-pretty)  
**Production:** 
- Docker logs → stdout → collected by Docker logging driver
- Ship to external log service (e.g., Grafana Loki, Papertrail, or CloudWatch)

**Log retention:** 30 days for application logs, 1 year for audit-critical logs.

---

## 9. Database Monitoring

Enable MongoDB slow query log:
```javascript
db.setProfilingLevel(1, { slowms: 200 });  // Log queries > 200ms
db.system.profile.find().sort({ ts: -1 }).limit(10);
```

Use MongoDB Atlas monitoring in production:
- Query execution plans
- Index usage statistics
- Replication health
- Storage usage

**Key MongoDB metrics to watch:**
- `opcounters.query` — queries per second
- `wiredTiger.cache.bytes_in_cache` — cache utilization
- `connections.current` — active connections
- `repl.executorPoolSize` — replication health
