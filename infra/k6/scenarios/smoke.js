import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 5,
  duration: "30s",
  thresholds: {
    http_req_failed: ["rate<0.01"], // Less than 1% errors
    http_req_duration: ["p(95)<500"], // 95% of requests under 500ms
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:5000";

export default function () {
  // 1. Live health check
  const liveRes = http.get(`${BASE_URL}/api/v1/health/live`);
  check(liveRes, {
    "live check is 200": (r) => r.status === 200,
    "live check status is alive": (r) => {
      try {
        return JSON.parse(r.body).data.status === "alive";
      } catch {
        return false;
      }
    },
  });

  // 2. Ready health check
  const readyRes = http.get(`${BASE_URL}/api/v1/health/ready`);
  check(readyRes, {
    "ready check returns status": (r) => r.status === 200 || r.status === 503,
  });

  // 3. Prometheus metrics endpoint
  const metricsRes = http.get(`${BASE_URL}/metrics`);
  check(metricsRes, {
    "metrics endpoint is 200": (r) => r.status === 200,
    "metrics has http duration": (r) => r.body.includes("http_request_duration_seconds"),
  });

  // 4. Products catalog listing
  const productsRes = http.get(`${BASE_URL}/api/v1/products?limit=10`);
  check(productsRes, {
    "products listing is 200": (r) => r.status === 200,
  });

  sleep(1);
}
