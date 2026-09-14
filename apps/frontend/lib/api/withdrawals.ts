import { apiFetch } from "./client";

export interface WithdrawalItem {
  _id: string;
  seller_id: string;
  seller_name: string;
  amount: number; // in cents
  bank_account_last4?: string | null;
  status: "pending" | "approved" | "rejected" | "processed";
  notes?: string | null;
  admin_notes?: string | null;
  processed_at?: string | null;
  created_at: string;
}

export async function requestWithdrawal(amount: number, notes?: string): Promise<WithdrawalItem> {
  const res = await apiFetch<{ success: boolean; data: WithdrawalItem }>("/withdrawals/request", {
    method: "POST",
    body: JSON.stringify({ amount, notes }),
  });
  return res.data;
}

export async function getSellerWithdrawals(): Promise<WithdrawalItem[]> {
  const res = await apiFetch<{ success: boolean; data: WithdrawalItem[] }>("/withdrawals/seller");
  return res.data || [];
}

export async function adminListWithdrawals(
  status?: string,
  limit = 30,
  skip = 0
): Promise<{ withdrawals: WithdrawalItem[]; total: number }> {
  const query = status ? `?status=${status}&limit=${limit}&skip=${skip}` : `?limit=${limit}&skip=${skip}`;
  const res = await apiFetch<{ success: boolean; data: { withdrawals: WithdrawalItem[]; total: number } }>(
    `/withdrawals/admin${query}`
  );
  return res.data;
}

export async function adminApproveWithdrawal(id: string): Promise<WithdrawalItem> {
  const res = await apiFetch<{ success: boolean; data: WithdrawalItem }>(
    `/withdrawals/admin/${id}/approve`,
    {
      method: "PATCH",
    }
  );
  return res.data;
}

export async function adminRejectWithdrawal(id: string, reason: string): Promise<WithdrawalItem> {
  const res = await apiFetch<{ success: boolean; data: WithdrawalItem }>(
    `/withdrawals/admin/${id}/reject`,
    {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    }
  );
  return res.data;
}
