import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "20s", target: 20 },
    { duration: "1m", target: 50 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.05"], // Up to 5% failure allowance for inventory concurrency conflicts
    http_req_duration: ["p(95)<2000"], // 95% of orders under 2000ms
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:5000";

export default function () {
  const vuId = __VU;
  const iterId = __ITER;
  const userEmail = `k6_buyer_${vuId}_${iterId}@loadtest.nexora.com`;
  const password = "Password123!Secure";

  // Step 1: Register or Login
  const registerPayload = JSON.stringify({
    name: `Load Test Buyer ${vuId}`,
    email: userEmail,
    password: password,
  });

  let token = "";
  const regRes = http.post(`${BASE_URL}/api/v1/auth/register`, registerPayload, {
    headers: { "Content-Type": "application/json" },
  });

  if (regRes.status === 201) {
    try {
      token = JSON.parse(regRes.body).data.tokens.access_token;
    } catch {
      token = "";
    }
  } else {
    // If user already exists, login
    const loginRes = http.post(
      `${BASE_URL}/api/v1/auth/login`,
      JSON.stringify({ email: userEmail, password }),
      { headers: { "Content-Type": "application/json" } }
    );
    if (loginRes.status === 200) {
      try {
        token = JSON.parse(loginRes.body).data.tokens.access_token;
      } catch {
        token = "";
      }
    }
  }

  if (!token) {
    sleep(1);
    return;
  }

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // Step 2: Validate cart before checkout
  const validateCartRes = http.post(
    `${BASE_URL}/api/v1/cart/validate`,
    JSON.stringify({ items: [] }),
    { headers: authHeaders }
  );

  check(validateCartRes, {
    "cart validation status 200": (r) => r.status === 200,
  });

  // Step 3: Check current orders
  const ordersRes = http.get(`${BASE_URL}/api/v1/orders/my-orders?page=1&limit=5`, {
    headers: authHeaders,
  });

  check(ordersRes, {
    "my orders status 200": (r) => r.status === 200,
  });

  sleep(1);
}
