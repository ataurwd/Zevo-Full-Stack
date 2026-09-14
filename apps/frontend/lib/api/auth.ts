import { apiFetch, setAccessToken } from "./client";

export interface User {
  id: string;
  email: string;
  role: "CUSTOMER" | "SELLER" | "DELIVERY_AGENT" | "ADMIN" | "SUPER_ADMIN" | "SUPPORT";
  first_name: string;
  last_name: string;
  phone?: string | null;
  avatar_url?: string | null;
  is_email_verified: boolean;
  is_active: boolean;
  created_at: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role?: "CUSTOMER" | "SELLER" | "DELIVERY_AGENT";
  phone?: string;
  delivery_zones?: string[];
  service_city?: string;
  vehicle_type?: "bicycle" | "motorcycle" | "scooter" | "car";
  vehicle_number?: string;
  license_number?: string;
  business_name?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export async function registerUser(payload: RegisterPayload): Promise<User> {
  const res = await apiFetch<{ data: User }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function loginUser(payload: LoginPayload): Promise<{ user: User; access_token: string }> {
  const res = await apiFetch<{ data: { user: User; access_token: string } }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  setAccessToken(res.data.access_token);
  return res.data;
}

export async function verifyEmailToken(token: string): Promise<{ user: User; access_token: string }> {
  const res = await apiFetch<{ data: { user: User; access_token: string } }>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
  setAccessToken(res.data.access_token);
  return res.data;
}

export async function refreshToken(): Promise<{ user: User; access_token: string }> {
  const res = await apiFetch<{ data: { user: User; access_token: string } }>("/auth/refresh", {
    method: "POST",
  });
  setAccessToken(res.data.access_token);
  return res.data;
}

export async function logoutUser(): Promise<void> {
  try {
    await apiFetch("/auth/logout", { method: "POST" });
  } finally {
    setAccessToken(null);
  }
}

export async function forgotPassword(email: string): Promise<void> {
  await apiFetch("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, new_password: string): Promise<void> {
  await apiFetch("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, new_password }),
  });
}
