import { apiFetch } from "./client";

export interface DeliveryAgentProfile {
  _id: string;
  user_id: string;
  vehicle_type: "bicycle" | "motorcycle" | "scooter" | "car";
  vehicle_number: string;
  license_number: string;
  status: "pending_review" | "approved" | "rejected" | "suspended";
  is_online: boolean;
  current_location: {
    type: "Point";
    coordinates: [number, number];
  };
  active_task_id: string | null;
  pending_earnings: number;
  total_earnings: number;
  rating: number;
  total_deliveries: number;
  delivery_zones?: string[];
  service_city?: string;
  is_zone_match?: boolean;
  user_name?: string;
  phone?: string;
  email?: string;
}

export interface DeliveryTaskItem {
  _id: string;
  task_number: string;
  sub_order_id: string;
  order_id: string;
  seller_id: string;
  customer_id: string;
  delivery_agent_id: string | null;
  status:
    | "unassigned"
    | "assigned"
    | "en_route_pickup"
    | "picked_up"
    | "en_route_delivery"
    | "delivered"
    | "failed"
    | "cancelled";
  pickup_address: any;
  delivery_address: any;
  rider_earnings: number;
  estimated_delivery?: string | null;
  actual_pickup?: string | null;
  actual_delivery?: string | null;
  created_at: string;
}

export async function getRiderProfile() {
  const res = await apiFetch<{ success: boolean; data: DeliveryAgentProfile }>("/delivery/rider/me/profile");
  return res.data;
}

export async function toggleRiderOnlineStatus(is_online: boolean) {
  const res = await apiFetch<{ success: boolean; data: DeliveryAgentProfile }>("/delivery/rider/me/status", {
    method: "PATCH",
    body: JSON.stringify({ is_online }),
  });
  return res.data;
}

export async function getRiderTasks() {
  const res = await apiFetch<{ success: boolean; data: DeliveryTaskItem[] }>("/delivery/rider/me/tasks");
  return res.data;
}

export async function updateRiderLocation(data: { taskId?: string; latitude: number; longitude: number }) {
  const res = await apiFetch<{ success: boolean; data: { etaMinutes: number } }>("/delivery/rider/me/location", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

export function notifyOrdersSync() {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("nexora_orders_updated", Date.now().toString());
      if ("BroadcastChannel" in window) {
        const channel = new BroadcastChannel("nexora_orders_sync");
        channel.postMessage({ type: "ORDERS_UPDATED", timestamp: Date.now() });
        channel.close();
      }
    } catch {}
  }
}

export async function startPickup(taskId: string) {
  const res = await apiFetch<{ success: boolean; data: DeliveryTaskItem }>(`/delivery/rider/me/tasks/${taskId}/pickup`, {
    method: "PATCH",
  });
  notifyOrdersSync();
  return res.data;
}

export async function confirmPickedUp(taskId: string) {
  const res = await apiFetch<{ success: boolean; data: DeliveryTaskItem }>(`/delivery/rider/me/tasks/${taskId}/picked-up`, {
    method: "PATCH",
  });
  notifyOrdersSync();
  return res.data;
}

export async function startCustomerDelivery(taskId: string) {
  const res = await apiFetch<{ success: boolean; data: DeliveryTaskItem }>(`/delivery/rider/me/tasks/${taskId}/start-delivery`, {
    method: "PATCH",
  });
  notifyOrdersSync();
  return res.data;
}

export async function completeDelivery(taskId: string) {
  const res = await apiFetch<{ success: boolean; data: DeliveryTaskItem }>(`/delivery/rider/me/tasks/${taskId}/deliver`, {
    method: "PATCH",
  });
  notifyOrdersSync();
  return res.data;
}

export async function getDeliveryTracking(taskId: string) {
  const res = await apiFetch<{ success: boolean; data: { task: DeliveryTaskItem; rider: any } }>(`/delivery/track/${taskId}`);
  return res.data;
}

export async function adminListRiders(status?: string) {
  const query = status ? `?status=${status}` : "";
  const res = await apiFetch<{ success: boolean; data: { agents: DeliveryAgentProfile[]; total: number } }>(`/delivery/admin/riders${query}`);
  return res.data;
}

export async function adminUpdateRiderStatus(id: string, status: string) {
  return await apiFetch<{ success: boolean; message: string }>(`/delivery/admin/riders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function getAvailableRiders(params?: { city?: string; zone?: string }) {
  const query = new URLSearchParams();
  if (params?.city) query.append("city", params.city);
  if (params?.zone) query.append("zone", params.zone);
  const qStr = query.toString() ? `?${query.toString()}` : "";

  const res = await apiFetch<{ success: boolean; data: { riders: DeliveryAgentProfile[]; total: number } }>(
    `/delivery/available-riders${qStr}`
  );
  return res.data;
}

export async function assignRiderToOrder(payload: {
  sub_order_id: string;
  rider_id: string;
  order_id?: string;
  notes?: string;
}) {
  const res = await apiFetch<{ success: boolean; message: string; data: any }>("/delivery/assign-rider", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("nexora_orders_updated", Date.now().toString());
      if ("BroadcastChannel" in window) {
        const channel = new BroadcastChannel("nexora_orders_sync");
        channel.postMessage({ type: "ORDERS_UPDATED", timestamp: Date.now() });
        channel.close();
      }
    } catch {}
  }

  return res.data;
}

export async function updateRiderProfile(data: {
  vehicle_type?: string;
  vehicle_number?: string;
  license_number?: string;
  delivery_zones?: string[];
  service_city?: string;
  phone?: string;
}) {
  const res = await apiFetch<{ success: boolean; message: string; data: DeliveryAgentProfile }>(
    "/delivery/rider/me/profile",
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
  return res.data;
}

export interface RiderPayoutItem {
  _id: string;
  amount: number; // in cents
  method: string;
  account_details: string;
  status: "processing" | "paid" | "rejected";
  created_at: string;
}

export async function requestRiderCashout(data: {
  amount: number; // in cents
  method: string;
  account_details: string;
}) {
  const res = await apiFetch<{ success: boolean; message: string; data: RiderPayoutItem }>(
    "/delivery/rider/me/cashout",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
  return res.data;
}

export async function getRiderPayouts() {
  const res = await apiFetch<{ success: boolean; data: RiderPayoutItem[] }>(
    "/delivery/rider/me/payouts"
  );
  return res.data || [];
}
