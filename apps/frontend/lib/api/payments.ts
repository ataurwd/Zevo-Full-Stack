import { apiFetch } from "./client";

export interface PaymentItem {
  id: string;
  order_id: string;
  customer_id: string;
  stripe_payment_intent_id: string;
  amount: number; // cents
  currency: string;
  status: string;
  payment_method_type?: string | null;
  failure_message?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RefundResult {
  id: string;
  payment_id: string;
  order_id: string;
  stripe_refund_id: string;
  amount: number;
  reason: string;
  status: string;
  created_at: string;
}

export async function getCustomerPayments(params: {
  page?: number;
  limit?: number;
} = {}): Promise<{ payments: PaymentItem[]; total: number }> {
  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page.toString());
  if (params.limit) query.append("limit", params.limit.toString());

  const res = await apiFetch<{ data: { payments: PaymentItem[]; total: number } }>(
    `/payments?${query.toString()}`
  );
  return res.data;
}

export async function getPaymentById(paymentId: string): Promise<PaymentItem> {
  const res = await apiFetch<{ data: PaymentItem }>(`/payments/${paymentId}`);
  return res.data;
}

export async function adminInitiateRefund(
  paymentId: string,
  payload: {
    amount?: number;
    reason: "customer_request" | "duplicate" | "fraud" | "defective";
    sub_order_id?: string;
  }
): Promise<RefundResult> {
  const res = await apiFetch<{ data: RefundResult }>(
    `/payments/admin/${paymentId}/refund`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
  return res.data;
}
