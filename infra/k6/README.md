# NEXORA Load Testing Suite (k6)

This directory contains automated k6 load testing scenarios for validating performance, latency budgets, and concurrency resilience under load across the NEXORA multi-vendor commerce platform.

---

## Scenarios

| File | Scenario | Purpose | Key Threshold |
|---|---|---|---|
| `scenarios/smoke.js` | Baseline Smoke Test | Validates endpoint availability and metrics collection | `http_req_failed < 1%`, `p(95) < 500ms` |
| `scenarios/browse.js` | Product Catalog Browse | High-throughput read scenario with search and pagination | `http_req_failed < 1%`, `p(95) < 300ms` |
| `scenarios/orders.js` | Order & Checkout Flow | Write-heavy checkout scenario with concurrency validation | `http_req_failed < 5%`, `p(95) < 2000ms` |
| `scenarios/auth.js` | Authentication Stress | Validates bcrypt cost factor and JWT issuance throughput | `http_req_failed < 2%`, `p(95) < 800ms` |

---

## Running Load Tests

### Prerequisites
- Install [k6](https://k6.io/docs/get-started/installation/)
- Start NEXORA services:
  ```bash
  docker-compose up -d
  ```

### Execution

```bash
# 1. Smoke test
k6 run -e BASE_URL=http://localhost:5000 infra/k6/scenarios/smoke.js

# 2. Browse scenario (100 VUs)
k6 run -e BASE_URL=http://localhost:5000 infra/k6/scenarios/browse.js

# 3. Order creation scenario
k6 run -e BASE_URL=http://localhost:5000 infra/k6/scenarios/orders.js

# 4. Auth scenario
k6 run -e BASE_URL=http://localhost:5000 infra/k6/scenarios/auth.js
```

---

## Docker Execution

```bash
docker run --rm -i \
  -v $(pwd)/infra/k6:/scripts \
  --network="host" \
  grafana/k6 run /scripts/scenarios/smoke.js
```
