import { apiFetch } from "./client";

export interface AuditLogItem {
  _id: string;
  actor_id: string;
  actor_email: string;
  actor_role: string;
  action: string;
  target_resource: string;
  target_id?: string | null;
  details?: Record<string, any>;
  ip_address?: string | null;
  created_at: string;
}

export async function getAdminAuditLogs(params?: {
  action?: string;
  actor_id?: string;
  limit?: number;
  skip?: number;
}): Promise<{ logs: AuditLogItem[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.action) query.set("action", params.action);
  if (params?.actor_id) query.set("actor_id", params.actor_id);
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.skip) query.set("skip", String(params.skip));

  const res = await apiFetch<{ success: boolean; data: { logs: AuditLogItem[]; total: number } }>(
    `/audit/admin/logs?${query.toString()}`
  );
  return res.data;
}
