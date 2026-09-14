import { apiFetch, getAccessToken, getApiBaseUrl } from "./client";
import { User } from "./auth";

export interface Address {
  id: string;
  label?: string | null;
  recipient_name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
}

export interface CreateAddressPayload {
  label?: string;
  recipient_name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default?: boolean;
}

export async function getProfile(): Promise<User> {
  const res = await apiFetch<{ data: User }>("/users/me");
  return res.data;
}

export async function updateProfile(payload: {
  first_name?: string;
  last_name?: string;
  phone?: string;
}): Promise<User> {
  const res = await apiFetch<{ data: User }>("/users/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function changePassword(payload: {
  current_password: string;
  new_password: string;
}): Promise<void> {
  await apiFetch("/users/me/password", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function uploadAvatar(file: File): Promise<User> {
  const formData = new FormData();
  formData.append("avatar", file);

  const baseUrl = getApiBaseUrl();
  const token = getAccessToken();

  const response = await fetch(`${baseUrl}/users/me/avatar`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
    credentials: "include",
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || "Failed uploading avatar");
  }
  return data.data;
}

export async function getAddresses(): Promise<Address[]> {
  const res = await apiFetch<{ data: Address[] }>("/users/me/addresses");
  return res.data;
}

export async function createAddress(payload: CreateAddressPayload): Promise<Address> {
  const res = await apiFetch<{ data: Address }>("/users/me/addresses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function updateAddress(
  id: string,
  payload: Partial<CreateAddressPayload>
): Promise<Address> {
  const res = await apiFetch<{ data: Address }>(`/users/me/addresses/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function setDefaultAddress(id: string): Promise<Address> {
  const res = await apiFetch<{ data: Address }>(`/users/me/addresses/${id}/default`, {
    method: "PATCH",
  });
  return res.data;
}

export async function deleteAddress(id: string): Promise<void> {
  await apiFetch(`/users/me/addresses/${id}`, {
    method: "DELETE",
  });
}


export interface AdminUserItem {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  role: "CUSTOMER" | "SELLER" | "RIDER" | "ADMIN" | "SUPER_ADMIN";
  original_role: string;
  phone?: string;
  status: "ACTIVE" | "SUSPENDED";
  is_active: boolean;
  ordersCount: number;
  joined: string;
  created_at: string;
  rider_profile?: {
    vehicle_type: string;
    vehicle_number: string;
    license_number: string;
    service_city?: string;
    delivery_zones?: string[];
    is_online: boolean;
    rating: number;
  } | null;
}

export interface AdminUsersResponse {
  users: AdminUserItem[];
  total: number;
  page: number;
  totalPages: number;
}

export async function adminGetUsers(params?: {
  role?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<AdminUsersResponse> {
  const query = new URLSearchParams();
  if (params?.role && params.role !== "ALL") query.set("role", params.role);
  if (params?.search && params.search.trim()) query.set("search", params.search.trim());
  if (params?.page) query.set("page", params.page.toString());
  if (params?.limit) query.set("limit", params.limit.toString());

  const qs = query.toString();
  const endpoint = `/users/admin${qs ? `?${qs}` : ""}`;
  const res = await apiFetch<{ data: AdminUsersResponse }>(endpoint);
  return res.data;
}

export async function adminCreateUser(payload: {
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  phone?: string;
  password?: string;
  service_city?: string;
  delivery_zones?: string[];
}): Promise<any> {
  const res = await apiFetch<{ data: any }>("/users/admin", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function adminUpdateUser(
  id: string,
  payload: {
    role?: string;
    is_active?: boolean;
    phone?: string;
    first_name?: string;
    last_name?: string;
  }
): Promise<any> {
  const res = await apiFetch<{ data: any }>(`/users/admin/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return res.data;
}
