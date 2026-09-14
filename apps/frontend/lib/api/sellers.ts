import { apiFetch } from "./client";

export interface SellerProfile {
  id: string;
  user_id: string;
  stripe_account_id: string | null;
  stripe_onboarding_complete: boolean;
  status: "pending" | "approved" | "rejected" | "suspended";
  rejection_reason?: string | null;
  business_name: string;
  business_type: "individual" | "company";
  tax_id?: string | null;
  bank_verified: boolean;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  total_earnings: number;
  pending_balance: number;
  total_commission_paid: number;
  created_at: string;
  updated_at: string;
}

export interface OnboardSellerRequest {
  business_name: string;
  business_type: "individual" | "company";
  tax_id?: string;
}

export interface OnboardSellerResponse {
  seller: SellerProfile;
  onboarding_url: string;
}

export interface StripeStatusResponse {
  seller_id: string;
  stripe_account_id: string | null;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  status: string;
}

export async function onboardSeller(data: OnboardSellerRequest): Promise<OnboardSellerResponse> {
  const res = await apiFetch<{ success: boolean; data: OnboardSellerResponse }>("/sellers/onboard", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function getMySellerProfile(): Promise<SellerProfile> {
  const res = await apiFetch<{ success: boolean; data: SellerProfile }>("/sellers/me");
  return res.data;
}

export async function getMyStripeStatus(): Promise<StripeStatusResponse> {
  const res = await apiFetch<{ success: boolean; data: StripeStatusResponse }>("/sellers/me/stripe-status");
  return res.data;
}

export async function simulateOnboarding(): Promise<{ message: string; seller: SellerProfile }> {
  const res = await apiFetch<{ success: boolean; data: { message: string; seller: SellerProfile } }>(
    "/sellers/me/simulate-onboarding",
    { method: "POST" }
  );
  return res.data;
}

export async function adminListSellers(status?: string): Promise<SellerProfile[]> {
  const query = status ? `?status=${status}` : "";
  const res = await apiFetch<{ success: boolean; data: SellerProfile[] }>(`/sellers/admin${query}`);
  return res.data;
}

export async function adminApproveSeller(sellerId: string): Promise<SellerProfile> {
  const res = await apiFetch<{ success: boolean; data: SellerProfile }>(
    `/sellers/admin/${sellerId}/approve`,
    { method: "PATCH" }
  );
  return res.data;
}

export async function adminRejectSeller(sellerId: string, reason: string): Promise<SellerProfile> {
  const res = await apiFetch<{ success: boolean; data: SellerProfile }>(
    `/sellers/admin/${sellerId}/reject`,
    {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    }
  );
  return res.data;
}
