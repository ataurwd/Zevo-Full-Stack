import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 50 },  // Ramp up to 50 users
    { duration: "1m", target: 100 },  // Ramp to 100 users
    { duration: "2m", target: 100 },  // Hold at 100 users
    { duration: "30s", target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"], // Less than 1% errors
    http_req_duration: ["p(95)<300", "p(99)<1000"], // 95% < 300ms, 99% < 1s
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:5000";

const SEARCH_TERMS = ["shoes", "t-shirt", "watch", "denim", "organic", "jacket"];

export default function () {
  // 1. Browse paginated products
  const page = Math.floor(Math.random() * 5) + 1;
  const listRes = http.get(`${BASE_URL}/api/v1/products?page=${page}&limit=12`);
  check(listRes, {
    "browse products status 200": (r) => r.status === 200,
    "browse returns data": (r) => {
      try {
        return Array.isArray(JSON.parse(r.body).data.items);
      } catch {
        return false;
      }
    },
  });

  // 2. Fetch categories tree
  const catRes = http.get(`${BASE_URL}/api/v1/categories`);
  check(catRes, {
    "categories status 200": (r) => r.status === 200,
  });

  // 3. Search query
  const query = SEARCH_TERMS[Math.floor(Math.random() * SEARCH_TERMS.length)];
  const searchRes = http.get(`${BASE_URL}/api/v1/products?q=${query}&limit=8`);
  check(searchRes, {
    "search status 200": (r) => r.status === 200,
  });

  sleep(Math.random() * 2 + 1); // 1-3 second user think time
}
