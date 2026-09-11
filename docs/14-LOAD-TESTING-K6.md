# 14 — NEXORA Load Testing (k6)

## 1. IMPORTANT DISCLAIMER

> **No performance numbers in this document are guarantees.**  
> All RPS targets and latency budgets are goals to be validated through actual k6 test execution.  
> Claimed performance figures without load test evidence are meaningless.  
> Update this document with actual results after each test run.

---

## 2. Test Scenarios

### 2.1 Baseline — Smoke Test
**Goal:** Verify system is functional. Catch obvious errors before load testing.

```javascript
// infra/k6/scenarios/baseline.js
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 1,
  duration: "30s",
  thresholds: {
    http_req_failed: ["rate<0.01"],  // <1% errors
    http_req_duration: ["p(95)<500"]  // 95% of reqs < 500ms
  }
};

export default function() {
  const res = http.get(`${__ENV.BASE_URL}/api/v1/products`);
  check(res, { "status is 200": (r) => r.status === 200 });
  sleep(1);
}
```

---

### 2.2 Product Browse — Read-Heavy Scenario
**Simulates:** Peak product browsing traffic

```javascript
// infra/k6/scenarios/browse-products.js
export const options = {
  stages: [
    { duration: "2m", target: 100 },    // Ramp up to 100 users
    { duration: "5m", target: 100 },    // Hold at 100 users
    { duration: "2m", target: 500 },    // Ramp to 500 users
    { duration: "5m", target: 500 },    // Hold at 500 users
    { duration: "2m", target: 1000 },   // Ramp to 1000 users
    { duration: "5m", target: 1000 },   // Hold
    { duration: "2m", target: 0 }       // Ramp down
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<300", "p(99)<1000"]
  }
};

export default function() {
  const scenarios = [
    () => http.get(`${BASE_URL}/api/v1/products?page=1&limit=20`),
    () => http.get(`${BASE_URL}/api/v1/products?category=electronics`),
    () => http.get(`${BASE_URL}/api/v1/products/${SAMPLE_PRODUCT_ID}`),
    () => http.get(`${BASE_URL}/api/v1/categories`)
  ];

  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  scenario();
  sleep(randomBetween(1, 3));
}
```

---

### 2.3 Search Scenario
**Simulates:** Product search traffic (Atlas Search)

```javascript
const SEARCH_QUERIES = ["shoes", "laptop", "shirt", "phone", "headphones", "watch"];

export default function() {
  const q = SEARCH_QUERIES[Math.floor(Math.random() * SEARCH_QUERIES.length)];
  const res = http.get(`${BASE_URL}/api/v1/products?q=${q}`);
  check(res, { "search returned results": (r) => JSON.parse(r.body).data.items.length >= 0 });
  sleep(2);
}
```

---

### 2.4 Order Creation — Write-Heavy + Concurrent Inventory
**Simulates:** Peak checkout traffic. Tests inventory race conditions.

```javascript
export const options = {
  stages: [
    { duration: "1m", target: 50 },
    { duration: "3m", target: 50 },
    { duration: "1m", target: 0 }
  ],
  thresholds: {
    http_req_failed: ["rate<0.05"],    // Allow up to 5% failures (conflicts expected)
    http_req_duration: ["p(95)<2000"]  // Orders can take longer
  }
};

export default function() {
  const loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify({
    email: `test_${randomVu()}@test.com`,
    password: "TestPass123!"
  }), { headers: { "Content-Type": "application/json" } });

  const token = loginRes.json("data.access_token");

  const orderRes = http.post(`${BASE_URL}/api/v1/orders`, JSON.stringify({
    address_id: TEST_ADDRESS_ID
  }), {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  });

  check(orderRes, {
    "order created or stock conflict": (r) => r.status === 201 || r.status === 409
  });
}
```

**What to observe:**
- Are 409 (stock conflict) responses handled correctly (no crashes)?
- Are race conditions producing duplicate orders? (should be zero)
- MongoDB `findOneAndUpdate` atomic: verify in DB that `quantity` never goes below 0

---

### 2.5 Authentication Scenario
**Simulates:** Login/refresh traffic

```javascript
export const options = {
  stages: [
    { duration: "1m", target: 200 },
    { duration: "3m", target: 200 },
    { duration: "1m", target: 0 }
  ],
  thresholds: {
    "http_req_duration{name:login}": ["p(95)<500"],
    "http_req_duration{name:refresh}": ["p(95)<200"]
  }
};
```

---

### 2.6 Full User Journey — Realistic Scenario
**Simulates:** Mix of all user types in realistic proportion

```javascript
export const options = {
  scenarios: {
    browsers: {
      executor: "constant-vus",
      vus: 70,   // 70% browsing
      exec: "browse"
    },
    shoppers: {
      executor: "constant-vus",
      vus: 20,   // 20% shopping
      exec: "shop"
    },
    sellers: {
      executor: "constant-vus",
      vus: 8,    // 8% seller operations
      exec: "sellerOps"
    },
    riders: {
      executor: "constant-vus",
      vus: 2,    // 2% rider operations
      exec: "riderOps"
    }
  }
};
```

---

## 3. Load Stages

| Stage | VUs | Duration | Goal |
|---|---|---|---|
| Smoke | 1 | 30s | No errors at all |
| Baseline | 10 | 5m | Establish P50/P95 baseline |
| 100 users | 100 | 10m | Normal expected load |
| 500 users | 500 | 10m | Moderate load |
| 1,000 users | 1,000 | 10m | High load (unknown if system can handle this — must test) |
| 5,000 users | 5,000 | 5m | Stress test (expected degradation) |
| 10,000 users | 10,000 | 2m | Spike test (likely to reveal breaking point) |

**Note:** These stages are ASPIRATIONAL. Do not claim the system supports 10,000 concurrent users without test evidence. Start at 100 and increase incrementally.

---

## 4. Success Metrics

> Target metrics for NORMAL LOAD (100-500 VUs). Do NOT claim these for 10,000 VUs.

| Metric | Target (to be validated) |
|---|---|
| Error rate | < 1% |
| P50 latency (GET product) | < 100ms (with Redis cache) |
| P95 latency (GET product) | < 300ms |
| P99 latency (GET product) | < 1000ms |
| P95 latency (POST order) | < 2000ms |
| P95 latency (Auth login) | < 500ms |
| Successful order rate | > 95% (excluding stock conflicts) |
| MongoDB connections active | < 90% of pool size |
| Redis hit rate | > 80% for product/category cache |
| CPU (API server) | < 70% average |
| Memory (API server) | < 80% of limit |

---

## 5. Metrics to Collect

### Application Metrics
```javascript
// k6 custom metrics
const errorRate = new Rate("errors");
const orderSuccessRate = new Rate("order_success");
const cachHitRate = new Rate("cache_hits");
```

### Infrastructure Metrics (collected via Prometheus/Grafana during test)
- CPU usage per container
- Memory usage per container
- MongoDB: active connections, operations/sec, lock wait time
- Redis: hits/misses, memory usage, connected clients
- Nginx: active connections, requests/sec
- BullMQ: queue depth, job processing time

### MongoDB-Specific
- `db.serverStatus().opcounters` — operations per second
- `db.serverStatus().wiredTiger.cache` — cache utilization
- Index usage: `db.products.explain("executionStats").find(...)`
- Slow query log: operations > 100ms

---

## 6. Bottleneck Investigation Methodology

```
Step 1: Reproduce the bottleneck
  → Run k6 test at VUs where performance degrades
  → Observe which metric degrades first (latency? error rate?)

Step 2: Identify the layer
  → Check Nginx access logs: is Nginx itself slow? (unlikely)
  → Check API server CPU/memory: is Express saturated?
  → Check MongoDB: slow query log, explain plans
  → Check Redis: hit rate, latency
  → Check BullMQ: queue depth growing?

Step 3: Diagnose
  → High MongoDB latency → missing index? → run explain(), add index
  → High API CPU → CPU-bound computation? → move to worker/BullMQ
  → Redis miss rate high → TTL too short? → increase TTL, pre-warm cache
  → Queue depth growing → underpowered workers? → increase concurrency
  → Socket.IO fanout too broad → too many clients in large rooms? → narrow room scope

Step 4: Fix and retest
  → Apply targeted fix
  → Re-run k6 test at same VU count
  → Compare P95 before/after
```

---

## 7. Running k6 Tests

```bash
# Smoke test
k6 run infra/k6/scenarios/baseline.js

# Product browse at 500 VUs
k6 run --vus 500 --duration 10m infra/k6/scenarios/browse-products.js

# Full ramp test
k6 run infra/k6/scenarios/ramp-test.js

# With Prometheus output (if prometheus-remote-write k6 extension installed)
k6 run --out prometheus=http://localhost:9090 infra/k6/scenarios/ramp-test.js

# With summary
k6 run --summary-trend-stats="avg,min,med,max,p(90),p(95),p(99)" infra/k6/scenarios/browse-products.js
```

---

## 8. Actual Test Results (Fill in after running)

| Date | Scenario | VUs | P95 (ms) | Error Rate | Notes |
|---|---|---|---|---|---|
| TBD | Smoke | 1 | TBD | TBD | — |
| TBD | Browse | 100 | TBD | TBD | — |
| TBD | Browse | 500 | TBD | TBD | — |
| TBD | Order | 50 | TBD | TBD | — |

> **Update this table after each k6 test run.**
