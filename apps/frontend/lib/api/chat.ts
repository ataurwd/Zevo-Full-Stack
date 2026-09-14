import { apiFetch } from "./client";

export interface ChatParticipant {
  user_id: string;
  role: "customer" | "seller" | "delivery_agent" | "admin" | "support";
  name: string;
  avatar_url?: string | null;
}

export interface ConversationItem {
  _id: string;
  order_id?: string | null;
  sub_order_id?: string | null;
  participants: ChatParticipant[];
  participant_ids: string[];
  last_message?: string | null;
  last_message_at?: string | null;
  last_message_sender_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessageItem {
  _id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: "customer" | "seller" | "delivery_agent" | "admin" | "support";
  text: string;
  attachments?: string[];
  read_by: string[];
  created_at: string;
}

export async function getConversations(limit = 30, skip = 0) {
  const res = await apiFetch<{ success: boolean; data: ConversationItem[] }>(
    `/chat/conversations?limit=${limit}&skip=${skip}`
  );
  return res.data || [];
}

export async function startConversation(data: {
  recipient_id?: string;
  seller_id?: string;
  order_id?: string;
  sub_order_id?: string;
  initial_message?: string;
}) {
  const res = await apiFetch<{ success: boolean; data: ConversationItem }>("/chat/conversations", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function getMessages(conversationId: string, limit = 50, skip = 0) {
  const res = await apiFetch<{
    success: boolean;
    data: { messages: ChatMessageItem[]; total: number };
  }>(`/chat/conversations/${conversationId}/messages?limit=${limit}&skip=${skip}`);
  return res.data;
}

export async function sendMessage(conversationId: string, text: string, attachments?: string[]) {
  const res = await apiFetch<{ success: boolean; data: ChatMessageItem }>(
    `/chat/conversations/${conversationId}/messages`,
    {
      method: "POST",
      body: JSON.stringify({ text, attachments }),
    }
  );
  return res.data;
}

export async function markConversationAsRead(conversationId: string) {
  return await apiFetch<{ success: boolean; data: { markedCount: number } }>(
    `/chat/conversations/${conversationId}/read`,
    {
      method: "PATCH",
    }
  );
}

export async function getUnreadChatCount(): Promise<number> {
  const res = await apiFetch<{ success: boolean; data: { unreadCount: number } }>(
    "/chat/unread-count"
  );
  return res.data?.unreadCount || 0;
}

export async function startSupportConversation(initialMessage?: string): Promise<ConversationItem> {
  const res = await apiFetch<{ success: boolean; data: ConversationItem }>("/chat/support", {
    method: "POST",
    body: JSON.stringify({ initial_message: initialMessage }),
  });
  return res.data;
}
