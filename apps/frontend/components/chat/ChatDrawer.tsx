"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSocket } from "../../hooks/useSocket";
import { useAuth } from "../../hooks/useAuth";
import {
  startConversation,
  getMessages,
  sendMessage,
  ChatMessageItem,
  ConversationItem,
} from "../../lib/api/chat";
import { MessageSquare, X, Send, Loader2, Store, Bike, User } from "lucide-react";

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: string;
  subOrderId?: string;
  recipientId: string;
  recipientName: string;
  recipientRole: "customer" | "seller" | "delivery_agent" | "admin";
}

export function ChatDrawer({
  // Hook

  isOpen,
  onClose,
  orderId,
  subOrderId,
  recipientId,
  recipientName,
  recipientRole,
}: ChatDrawerProps) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [conversation, setConversation] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !recipientId) return;

    const initChat = async () => {
      setLoading(true);
      try {
        const conv = await startConversation({
          recipient_id: recipientId,
          order_id: orderId,
          sub_order_id: subOrderId,
        });
        setConversation(conv);

        if (conv?._id) {
          const data = await getMessages(conv._id);
          setMessages(data.messages || []);
        }
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [isOpen, recipientId, orderId, subOrderId]);

  useEffect(() => {
    if (!socket || !conversation?._id) return;

    socket.emit("join:chat", conversation._id);

    const handleNewMessage = (msg: ChatMessageItem) => {
      if (msg.conversation_id === conversation._id) {
        setMessages((prev) => {
          if (prev.some((m) => String(m._id) === String(msg._id))) return prev;
          return [...prev, msg];
        });
      }
    };

    socket.on("chat:message", handleNewMessage);

    return () => {
      socket.emit("leave:chat", conversation._id);
      socket.off("chat:message", handleNewMessage);
    };
  }, [socket, conversation?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const uniqueMessages = useMemo(() => {
    const seen = new Set<string>();
    return messages.filter((m) => {
      const id = String(m._id || "");
      if (id) {
        if (seen.has(id)) return false;
        seen.add(id);
      }
      return true;
    });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !conversation?._id || sending) return;

    const text = inputText.trim();
    setInputText("");
    setSending(true);

    try {
      await sendMessage(conversation._id, text);
    } catch {
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-xs transition-opacity animate-fade-in">
      <div className="w-full max-w-md bg-[#f8fafc] h-full shadow-2xl flex flex-col border-l border-white/80 animate-slide-left">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200/80 bg-white/90 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              {recipientRole === "seller" ? (
                <Store className="w-4 h-4" />
              ) : recipientRole === "delivery_agent" ? (
                <Bike className="w-4 h-4" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xs">{recipientName}</h3>
              <span className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider">
                {recipientRole.replace("_", " ")}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : uniqueMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center px-4">
              <MessageSquare className="w-8 h-8 opacity-30 text-blue-600 mb-2" />
              <p className="text-xs font-bold text-slate-600">Direct Live Chat</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Send a message to contact your vendor or courier about this order.
              </p>
            </div>
          ) : (
            uniqueMessages.map((m) => {
              const myId = String(user?.id || (user as any)?._id || "");
              const senderIdStr = String(m.sender_id || "");
              const isMe =
                (myId && senderIdStr === myId) ||
                (user?.email && m.sender_name?.toLowerCase() === user.email.toLowerCase());

              const initial = (m.sender_name || (isMe ? "You" : "User")).charAt(0).toUpperCase();
              const timeStr = m.created_at
                ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "";

              return (
                <div
                  key={m._id}
                  className={`flex items-end gap-2 mb-2.5 group animate-fade-in ${
                    isMe ? "justify-end" : "justify-start"
                  }`}
                >
                  {!isMe && (
                    <div
                      className="w-7 h-7 rounded-full bg-slate-800 text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-xs"
                      title={m.sender_name}
                    >
                      {initial}
                    </div>
                  )}

                  <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[80%]`}>
                    <div className={`flex items-center gap-1.5 mb-0.5 px-1 text-[10px] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                      <span className="font-bold text-slate-600 text-[10px]">
                        {isMe ? "You" : m.sender_name}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {timeStr}
                      </span>
                    </div>

                    <div
                      className={`px-3.5 py-2 rounded-2xl text-xs font-medium leading-relaxed shadow-2xs break-words whitespace-pre-wrap ${
                        isMe
                          ? "bg-[#00A86B] text-white rounded-br-xs font-medium"
                          : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs font-medium"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>

                  {isMe && (
                    <div
                      className="w-7 h-7 rounded-full bg-[#0A504A] text-[#A2E4B8] font-bold text-[10px] flex items-center justify-center shrink-0 shadow-xs"
                      title="You"
                    >
                      {(user?.first_name?.charAt(0) || user?.email?.charAt(0) || "U").toUpperCase()}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Drawer Input */}
        <form onSubmit={handleSend} className="p-3 border-t border-slate-200/80 bg-white/90">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Type message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || sending}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
            >
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
