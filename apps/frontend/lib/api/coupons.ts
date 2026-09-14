import { apiFetch } from "./client";

export interface CouponItem {
  _id: string;
  code: string;
  seller_id?: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_value: number;
  max_discount?: number | null;
  usage_limit: number;
  usage_count: number;
  is_active: boolean;
  expires_at: string;
  created_at: string;
}

export interface CouponValidationResponse {
  valid: boolean;
  code: string;
  discount_amount: number;
  message?: string;
}

export async function validateCouponCode(data: {
  code: string;
  order_amount: number;
  seller_id?: string;
}): Promise<CouponValidationResponse> {
  const res = await apiFetch<{ success: boolean; data: CouponValidationResponse }>(
    "/coupons/validate",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
  return res.data;
}

export async function getSellerCoupons(): Promise<CouponItem[]> {
  const res = await apiFetch<{ success: boolean; data: CouponItem[] }>("/coupons/seller");
  return res.data || [];
}

export async function createSellerCoupon(data: {
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_value?: number;
  max_discount?: number;
  usage_limit?: number;
  expires_at: string;
}): Promise<CouponItem> {
  const res = await apiFetch<{ success: boolean; data: CouponItem }>("/coupons", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function toggleCouponStatus(id: string, is_active: boolean): Promise<CouponItem> {
  const res = await apiFetch<{ success: boolean; data: CouponItem }>(`/coupons/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ is_active }),
  });
  return res.data;
}

export async function deleteCoupon(id: string): Promise<boolean> {
  const res = await apiFetch<{ success: boolean }>(`/coupons/${id}`, {
    method: "DELETE",
  });
  return res.success;
}
