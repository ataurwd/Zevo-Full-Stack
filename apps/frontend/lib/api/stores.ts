import { apiFetch } from "./client";

export interface StoreProfile {
  id: string;
  seller_id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  email: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  social_links?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  rating_avg: number;
  rating_count: number;
  is_active: boolean;
  vacation_mode: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateStoreRequest {
  name: string;
  description?: string;
  email: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

export interface UpdateStoreRequest {
  name?: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  social_links?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  vacation_mode?: boolean;
}

export async function createStore(data: CreateStoreRequest): Promise<StoreProfile> {
  const res = await apiFetch<{ success: boolean; data: StoreProfile }>("/stores", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function updateMyStore(data: UpdateStoreRequest): Promise<StoreProfile> {
  const res = await apiFetch<{ success: boolean; data: StoreProfile }>("/stores/seller/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function getStoreBySlug(slug: string): Promise<StoreProfile> {
  const res = await apiFetch<{ success: boolean; data: StoreProfile }>(`/stores/${slug}`);
  return res.data;
}

export async function listActiveStores(page = 1, limit = 20): Promise<{ items: StoreProfile[]; pagination: any }> {
  const res = await apiFetch<{ success: boolean; data: { items: StoreProfile[]; pagination: any } }>(
    `/stores?page=${page}&limit=${limit}`
  );
  return res.data;
}


export interface AdminStoreProfile {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  seller_id: string;
  seller: string;
  seller_email?: string | null;
  seller_phone?: string | null;
  status: "ACTIVE" | "PENDING" | "SUSPENDED" | "APPROVED" | "REJECTED";
  is_open: boolean;
  productsCount: number;
  ordersTotal: string;
  rating: number;
  rating_count: number;
  address?: any;
  joined: string;
  created_at: string;
}

export async function adminListStores(): Promise<AdminStoreProfile[]> {
  const res = await apiFetch<{ success: boolean; data: AdminStoreProfile[] }>("/stores/admin/all");
  return res.data;
}

export async function getMyStore(): Promise<StoreProfile> {
  const res = await apiFetch<{ success: boolean; data: StoreProfile }>("/stores/seller/me");
  return res.data;
}
