import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "20s", target: 30 },
    { duration: "40s", target: 50 },
    { duration: "20s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<800"], // 95% < 800ms (accounting for bcrypt work factor 12)
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:5000";

export default function () {
  const vuId = __VU;
  const iterId = __ITER;
  const uniqueEmail = `k6_auth_${vuId}_${iterId}_${Date.now()}@example.com`;
  const password = "Password123!Secure";

  // 1. Register new user
  const regPayload = JSON.stringify({
    name: `User ${vuId}`,
    email: uniqueEmail,
    password: password,
  });

  const regRes = http.post(`${BASE_URL}/api/v1/auth/register`, regPayload, {
    headers: { "Content-Type": "application/json" },
  });

  check(regRes, {
    "registration status is 201": (r) => r.status === 201,
  });

  // 2. Login user
  const loginPayload = JSON.stringify({
    email: uniqueEmail,
    password: password,
  });

  const loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, loginPayload, {
    headers: { "Content-Type": "application/json" },
  });

  check(loginRes, {
    "login status is 200": (r) => r.status === 200,
    "received access token": (r) => {
      try {
        return !!JSON.parse(r.body).data.tokens.access_token;
      } catch {
        return false;
      }
    },
  });

  sleep(0.5);
}
