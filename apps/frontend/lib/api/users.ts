import { apiFetch, getAccessToken } from "./client";
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

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
  const token = getAccessToken();

  const response = await fetch(`${API_BASE_URL}/users/me/avatar`, {
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
