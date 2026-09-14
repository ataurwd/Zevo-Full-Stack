import { apiFetch } from "./client";

export interface NotificationItem {
  _id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  reference_id?: string;
  reference_type?: string;
  is_read: boolean;
  created_at: string;
  read_at?: string | null;
}

export async function getNotifications(params?: { is_read?: boolean; limit?: number; skip?: number }) {
  const query = new URLSearchParams();
  if (params?.is_read !== undefined) query.set("is_read", String(params.is_read));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.skip) query.set("skip", String(params.skip));

  const res = await apiFetch<{
    success: boolean;
    data: { notifications: NotificationItem[]; total: number; unreadCount: number };
  }>(`/notifications?${query.toString()}`);
  return res.data;
}

export async function getUnreadNotificationCount(): Promise<number> {
  const res = await apiFetch<{ success: boolean; data: { unreadCount: number } }>(
    "/notifications/unread-count"
  );
  return res.data?.unreadCount || 0;
}

export async function markNotificationAsRead(id: string) {
  return await apiFetch<{ success: boolean; data: any }>(`/notifications/${id}/read`, {
    method: "PATCH",
  });
}

export async function markAllNotificationsAsRead() {
  const res = await apiFetch<{ success: boolean; data: { markedCount: number } }>(
    "/notifications/read-all",
    {
      method: "PATCH",
    }
  );
  return res.data;
}
