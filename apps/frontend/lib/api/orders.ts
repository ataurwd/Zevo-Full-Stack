import { apiFetch } from "./client";

export type OrderStatus = "pending" | "confirmed" | "preparing" | "ready_for_pickup" | "picked_up" | "in_transit" | "delivered" | "cancelled" | "completed";
export type SubOrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready_for_pickup"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "cancelled";
export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded"
  | "partially_refunded";

export interface DeliveryAddress {
  recipient_name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface OrderItem {
  product_id: string;
  variant_id: string;
  sku: string;
  product_name: string;
  variant_name: string;
  image_url?: string;
  unit_price: number; // cents
  quantity: number;
  subtotal: number; // cents
}

export interface SubOrder {
  id: string;
  order_id: string;
  order_number: string;
  seller_id: string;
  store_id: string;
  store_name?: string;
  customer_id?: string;
  delivery_address?: DeliveryAddress;
  customer_notes?: string | null;
  status: SubOrderStatus;
  items: OrderItem[];
  subtotal: number; // cents
  seller_earnings: number;
  platform_commission: number;
  commission_rate: number;
  delivery_fee: number;
  stripe_transfer_id?: string | null;
  confirmed_at?: string | null;
  preparing_at?: string | null;
  ready_at?: string | null;
  picked_up_at?: string | null;
  in_transit_at?: string | null;
  delivered_at?: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  assigned_rider?: any;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  assigned_rider?: any;
  confirmed_at?: string | null;
  preparing_at?: string | null;
  ready_at?: string | null;
  picked_up_at?: string | null;
  in_transit_at?: string | null;
  delivered_at?: string | null;
  order_number: string;
  customer_id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  subtotal: number; // cents
  discount_amount: number; // cents
  delivery_fee: number; // cents
  platform_fee: number; // cents
  total: number; // cents
  currency: string;
  delivery_address: DeliveryAddress;
  stripe_payment_intent_id: string | null;
  coupon_code?: string | null;
  notes?: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  created_at: string;
  updated_at: string;
  sub_orders?: SubOrder[];
}

export interface CreateOrderPayload {
  address_id?: string;
  delivery_address?: DeliveryAddress;
  notes?: string;
}

export interface CreateOrderResult {
  order: Order;
  payment_intent_client_secret: string;
}

export function notifyOrdersSync() {
  if (typeof window === "undefined") return;
  try {
    const timestamp = Date.now().toString();
    localStorage.setItem("nexora_orders_updated", timestamp);
    if ("BroadcastChannel" in window) {
      const channel = new BroadcastChannel("nexora_orders_sync");
      channel.postMessage({ type: "ORDERS_UPDATED", timestamp });
      channel.close();
    }
  } catch {
    // Ignore storage/channel errors in private browsing
  }
}

export async function createOrder(
  payload: CreateOrderPayload
): Promise<CreateOrderResult> {
  const res = await apiFetch<{ data: CreateOrderResult }>("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  notifyOrdersSync();
  return res.data;
}

export async function getCustomerOrders(params: {
  page?: number;
  limit?: number;
  status?: string;
} = {}): Promise<{ orders: Order[]; total: number }> {
  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page.toString());
  if (params.limit) query.append("limit", params.limit.toString());
  if (params.status && params.status !== "all") query.append("status", params.status);

  const res = await apiFetch<{ data: { orders: Order[]; total: number } }>(
    `/orders?${query.toString()}`
  );
  return res.data;
}

export async function getOrderById(orderId: string): Promise<Order> {
  const res = await apiFetch<{ data: Order }>(`/orders/${orderId}`);
  return res.data;
}

export async function cancelOrder(
  orderId: string,
  reason?: string
): Promise<Order> {
  const res = await apiFetch<{ data: Order }>(`/orders/${orderId}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
  notifyOrdersSync();
  return res.data;
}

export async function getAdminOrders(params: {
  page?: number;
  limit?: number;
  status?: string;
} = {}): Promise<{ orders: Order[]; total: number }> {
  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page.toString());
  if (params.limit) query.append("limit", params.limit.toString());
  if (params.status && params.status !== "all") query.append("status", params.status);

  const res = await apiFetch<{ data: { orders: Order[]; total: number } }>(
    `/orders/admin?${query.toString()}`
  );
  return res.data;
}

export async function getSellerSubOrders(params: {
  page?: number;
  limit?: number;
  status?: string;
} = {}): Promise<{ subOrders: SubOrder[]; total: number }> {
  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page.toString());
  if (params.limit) query.append("limit", params.limit.toString());
  if (params.status && params.status !== "all") query.append("status", params.status);

  const res = await apiFetch<{ data: { subOrders: SubOrder[]; total: number } }>(
    `/orders/seller/me?${query.toString()}`
  );
  return res.data;
}

export async function getSellerSubOrderById(subOrderId: string): Promise<SubOrder> {
  const res = await apiFetch<{ data: SubOrder }>(`/orders/seller/me/${subOrderId}`);
  return res.data;
}

export async function updateSubOrderStatus(
  subOrderId: string,
  action: "confirm" | "preparing" | "ready" | "ship" | "deliver" | "cancel",
  reason?: string
): Promise<SubOrder> {
  const res = await apiFetch<{ data: SubOrder }>(
    `/orders/seller/me/${subOrderId}/${action}`,
    {
      method: "PATCH",
      body: reason ? JSON.stringify({ reason }) : undefined,
    }
  );
  notifyOrdersSync();
  return res.data;
}

export async function adminGetOrderById(orderId: string): Promise<Order> {
  try {
    const res = await apiFetch<{ data: Order }>(`/orders/admin/${orderId}`);
    return res.data;
  } catch {
    const res = await apiFetch<{ data: Order }>(`/orders/${orderId}`);
    return res.data;
  }
}
