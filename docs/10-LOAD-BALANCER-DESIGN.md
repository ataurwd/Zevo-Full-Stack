# 10 — NEXORA Load Balancer & Nginx Design

## 1. Traffic Architecture

```
Internet (HTTPS :443)
         │
         ▼
┌────────────────────────────────────────────┐
│              Nginx (Docker)                 │
│                                            │
│  • SSL/TLS termination (Let's Encrypt)     │
│  • Gzip compression                        │
│  • Static file serving (Next.js exports)   │
│  • Reverse proxy → API servers             │
│  • WebSocket upgrade (Socket.IO)           │
│  • ip_hash (sticky sessions for WS)        │
│  • Rate limiting (limit_req_zone)          │
│  • Health check awareness                  │
└─────────────────┬──────────────────────────┘
                  │
     ┌────────────┼────────────┐
     ▼            ▼            ▼
  API #1       API #2       API #N
  :5000        :5001        :500N
  (Express)    (Express)    (Express)
  (BullMQ)     (BullMQ)     (BullMQ)
  (Socket.IO)  (Socket.IO)  (Socket.IO)
     │            │            │
     └────────────┼────────────┘
                  │
     ┌────────────┼────────────┐
     ▼            ▼            ▼
  MongoDB      Redis       (External)
  :27017       :6379       Stripe/Cloudinary
```

---

## 2. Nginx Configuration

### Upstream Pool
```nginx
upstream nexora_api {
  ip_hash;  # sticky sessions for Socket.IO
  keepalive 32;  # persistent connections to upstream

  server api1:5000 max_fails=3 fail_timeout=30s;
  server api2:5000 max_fails=3 fail_timeout=30s;
  server api3:5000 max_fails=3 fail_timeout=30s;
}
```

**Why `ip_hash`?**  
Socket.IO WebSocket connections must reach the same backend instance during the HTTP upgrade handshake. After upgrade, the connection is persistent. `ip_hash` ensures a client's IP always routes to the same upstream.

**Trade-off:** Uneven load distribution if many clients share an IP (e.g., corporate NAT). For extreme scale, use Redis adapter + switch to `round-robin` — the Redis adapter eliminates the need for sticky sessions for event routing.

### HTTP Server Block
```nginx
server {
  listen 80;
  server_name nexora.com www.nexora.com;

  # Redirect all HTTP to HTTPS
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name nexora.com www.nexora.com;

  # SSL
  ssl_certificate     /etc/letsencrypt/live/nexora.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/nexora.com/privkey.pem;
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-CHACHA20-POLY1305;
  ssl_prefer_server_ciphers on;
  ssl_session_cache shared:SSL:10m;
  ssl_session_timeout 10m;

  # Security headers
  add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
  add_header X-Frame-Options SAMEORIGIN always;
  add_header X-Content-Type-Options nosniff always;

  # Gzip
  gzip on;
  gzip_types text/plain application/json application/javascript text/css;
  gzip_min_length 1024;

  # Rate limiting zones (defined in http block)
  # limit_req zone=auth burst=20 nodelay;

  # API routes
  location /api/ {
    proxy_pass http://nexora_api;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Timeouts
    proxy_connect_timeout 5s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # Connection limit
    proxy_buffer_size 4k;
  }

  # WebSocket (Socket.IO)
  location /socket.io/ {
    proxy_pass http://nexora_api;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

    # WebSocket timeouts (longer for persistent connections)
    proxy_read_timeout 3600s;
    proxy_send_timeout 3600s;

    # Disable buffering for WS
    proxy_buffering off;
  }

  # Frontend (Next.js static or SSR)
  location / {
    proxy_pass http://frontend:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    # or: serve static exports from /var/www/nexora/
  }

  # Health check (Nginx-level)
  location /nginx-health {
    access_log off;
    return 200 "OK";
    add_header Content-Type text/plain;
  }
}
```

---

## 3. Rate Limiting at Nginx Level

```nginx
http {
  # Rate limit zones
  limit_req_zone $binary_remote_addr zone=auth:10m rate=10r/m;
  limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
  limit_req_zone $binary_remote_addr zone=upload:10m rate=20r/m;

  server {
    # Apply to auth endpoints
    location /api/v1/auth/login {
      limit_req zone=auth burst=5 nodelay;
      limit_req_status 429;
      proxy_pass http://nexora_api;
    }

    # Apply to general API
    location /api/ {
      limit_req zone=api burst=50 nodelay;
      proxy_pass http://nexora_api;
    }
  }
}
```

**Note:** Application-level rate limiting (Redis sliding window) is implemented in Express middleware as a second layer for per-user rate limits. Nginx provides per-IP limits.

---

## 4. Health Checks

Nginx uses passive health checks (`max_fails` / `fail_timeout`):

```nginx
server api1:5000 max_fails=3 fail_timeout=30s;
```

If API server returns 3 consecutive failures within 30s → marked unhealthy → removed from rotation for 30s.

**Backend health endpoint:** `GET /api/v1/health/ready`  
Returns 200 if MongoDB + Redis are healthy, 503 otherwise.

Active health checks (if using Nginx Plus or a separate probe):
```yaml
# Docker Compose healthcheck
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:5000/api/v1/health/live"]
  interval: 10s
  timeout: 5s
  retries: 3
  start_period: 30s
```

---

## 5. Connection Limits

| Setting | Value | Reason |
|---|---|---|
| `worker_connections` | 1024 | Per Nginx worker; total = workers × 1024 |
| `worker_processes` | auto | Match CPU cores |
| `keepalive_timeout` | 65s | Persistent HTTP connections |
| `keepalive` (upstream) | 32 | Reuse connections to backend |
| `client_max_body_size` | 10m | File upload limit |
| `proxy_read_timeout` | 60s (API), 3600s (WS) | Prevent hanging connections |

---

## 6. Zero-Downtime Deployment

**Strategy:** Rolling restart with Nginx active health checks.

```bash
# During deployment (CI/CD):
# 1. Build new Docker image
# 2. Start new container (new version) alongside old
# 3. Wait for health check to pass on new container
# 4. Nginx routes traffic to new container (passive health check detects old is stopping)
# 5. Stop old container (SIGTERM → graceful 30s drain)
```

**Graceful shutdown in Express:**
```typescript
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully...");

  server.close(async () => {
    // Close Socket.IO connections
    await io.close();
    // Close MongoDB connection
    await mongoClient.close();
    // Close Redis connection
    await redis.quit();
    // Close BullMQ workers
    await Promise.all(workers.map(w => w.close()));
    logger.info("Graceful shutdown complete");
    process.exit(0);
  });

  // Force shutdown after 30s
  setTimeout(() => {
    logger.error("Forceful shutdown");
    process.exit(1);
  }, 30000);
});
```

---

## 7. Horizontal Scaling

| Component | Scaling approach |
|---|---|
| **Nginx** | Vertical (single proxy is rarely the bottleneck) |
| **API Servers** | Horizontal (add Docker containers, register in Nginx upstream) |
| **BullMQ Workers** | Horizontal (multiple instances consume same Redis queues) |
| **Socket.IO** | Horizontal with Redis adapter (all instances share event bus) |
| **MongoDB** | Replica set for read scaling; sharding for extreme write scale |
| **Redis** | Vertical (single instance for MVP); Redis Cluster for large scale |

**Scaling limits (to be validated by k6 tests):**
- Do NOT claim specific RPS numbers without load test evidence
- Single API server: unknown until tested
- Nginx + Redis: typically not the bottleneck before MongoDB

---

## 8. Failure Recovery

| Failure | Recovery |
|---|---|
| One API server crashes | Nginx passive health check removes it; others serve traffic |
| All API servers crash | Nginx returns 502; alert fires; manual restart or auto-restart via Docker |
| MongoDB primary fails | Replica set elects new primary (typically < 30s); app reconnects |
| Redis fails | API degrades (cache miss, rate limit falls back); Socket.IO multi-instance fails until Redis returns |
| Nginx crashes | Service is fully down; configure with Docker restart: always |
