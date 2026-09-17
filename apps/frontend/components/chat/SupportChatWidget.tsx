"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import {
  startSupportConversation,
  getMessages,
  sendMessage,
  ConversationItem,
  ChatMessageItem,
} from "../../lib/api/chat";
import {
  MessageSquare,
  X,
  Send,
  Loader2,
  Headphones,
  ShieldCheck,
  Clock,
  Sparkles,
  User,
  ArrowRight,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useCart } from "../../providers/CartProvider";

export function SupportChatWidget() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const { isDrawerOpen } = useCart();

  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Hide the floating widget on admin/rider chat portals and when CartDrawer is open
  const isExcludedPage = pathname.startsWith("/admin/chat") || isDrawerOpen;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open_support_chat", handleOpen);
    return () => window.removeEventListener("open_support_chat", handleOpen);
  }, []);

  // Initialize or fetch support conversation when widget is opened
  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;

    let isMounted = true;

    const initSupportChat = async () => {
      setLoading(true);
      try {
        const conv = await startSupportConversation();
        if (!isMounted) return;
        setConversation(conv);

        if (conv?._id) {
          const res = await getMessages(conv._id, 50);
          if (!isMounted) return;
          setMessages(res?.messages || []);
        }
      } catch (err) {
        console.error("Could not load support conversation", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initSupportChat();

    return () => {
      isMounted = false;
    };
  }, [isOpen, isAuthenticated]);

  // Polling for incoming replies while widget is open
  useEffect(() => {
    if (!isOpen || !conversation?._id) return;

    const interval = setInterval(async () => {
      try {
        const res = await getMessages(conversation._id, 50);
        if (res?.messages) {
          setMessages(res.messages);
        }
      } catch {
        // silent fail on polling
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isOpen, conversation?._id]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

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
    if (!inputText.trim() || sending) return;

    const textToSend = inputText.trim();
    setInputText("");
    setSending(true);

    try {
      let activeConvId = conversation?._id;
      if (!activeConvId) {
        const newConv = await startSupportConversation(textToSend);
        setConversation(newConv);
        activeConvId = newConv._id;
      }

      if (activeConvId) {
        const newMsg = await sendMessage(activeConvId, textToSend);
        setMessages((prev) => {
            if (prev.some((m) => String(m._id) === String(newMsg._id))) return prev;
            return [...prev, newMsg];
          });
        scrollToBottom();
      }
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setSending(false);
    }
  };

  if (isExcludedPage) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3.5 rounded-full bg-[#00A86B] hover:bg-[#0A504A] text-white shadow-xl shadow-[#00A86B]/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Chat with Admin Support"
        >
          <div className="relative">
            <Headphones className="w-5 h-5 stroke-[2.5]" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-300 ring-2 ring-[#00A86B] animate-pulse" />
          </div>
          <span className="text-xs font-black tracking-wide pr-1">
            Live Support
          </span>
        </button>
      )}

      {/* Expanded Support Chatbox Window */}
      {isOpen && (
        <div className="w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[82vh] rounded-3xl bg-white border border-[#D1E7D8] shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-[#073A36] to-[#0A504A] text-white flex items-center justify-between shadow-xs shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-2xl bg-[#00A86B] flex items-center justify-center text-white shadow-inner">
                <Headphones className="w-4 h-4" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#073A36]" />
              </div>
              <div>
                <h3 className="font-bold text-xs flex items-center gap-1.5">
                  <span>Zevo Support Team</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Admin
                  </span>
                </h3>
                <p className="text-[10px] text-emerald-200/70 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Online • Typically replies instantly</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F7F7F2]/60">
            {!isAuthenticated ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#E8F8EE] border border-[#D1E7D8] text-[#00A86B] flex items-center justify-center">
                  <Headphones className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#0A504A]">Have questions or need help?</h4>
                  <p className="text-xs text-[#0A504A]/70 mt-1 leading-relaxed">
                    Sign in to message our Admin & Support team directly regarding your orders, stores, or deliveries.
                  </p>
                </div>
                <Link
                  href={`/login?redirect=${encodeURIComponent(pathname)}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00A86B] hover:bg-[#0A504A] text-white font-bold text-xs shadow-md shadow-[#00A86B]/20 transition-all"
                >
                  <span>Sign In to Chat</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : loading ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-[#0A504A]/60">
                <Loader2 className="w-6 h-6 animate-spin text-[#00A86B]" />
                <span className="text-xs font-semibold">Connecting with Support...</span>
              </div>
            ) : uniqueMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#E8F8EE] text-[#00A86B] flex items-center justify-center shadow-xs">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#0A504A]">Welcome to Live Support!</h4>
                  <p className="text-xs text-[#0A504A]/70 mt-1 leading-relaxed">
                    Send a message below and our administrator team will assist you immediately.
                  </p>
                </div>
              </div>
            ) : (
              uniqueMessages.map((msg, index) => {
                const isMe = msg.sender_id === (user?.id || (user as any)?._id);
                const isAdmin = msg.sender_role === "admin";

                return (
                  <div
                    key={msg._id || index}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"} animate-fade-in`}
                  >
                    <span className="text-[10px] text-[#0A504A]/60 font-semibold mb-0.5 px-1">
                      {isMe ? "You" : isAdmin ? "Support Team (Admin)" : msg.sender_name}
                    </span>
                    <div
                      className={`max-w-[82%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed shadow-xs ${
                        isMe
                          ? "bg-[#00A86B] text-white rounded-br-xs font-medium"
                          : "bg-white border border-[#D1E7D8] text-[#0A504A] rounded-bl-xs font-medium"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                    <span className="text-[9px] text-[#0A504A]/40 font-mono mt-0.5 px-1">
                      {msg.created_at
                        ? new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Just now"}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Bar */}
          {isAuthenticated && (
            <form
              onSubmit={handleSend}
              className="p-3 bg-white border-t border-[#D1E7D8] flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask support a question..."
                disabled={sending}
                className="flex-1 px-3.5 py-2 rounded-xl bg-[#F7F7F2] border border-[#D1E7D8] text-xs text-[#0A504A] placeholder:text-[#0A504A]/40 focus:outline-none focus:border-[#00A86B] transition-colors"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || sending}
                className="w-8 h-8 rounded-xl bg-[#00A86B] hover:bg-[#0A504A] text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer shrink-0"
              >
                {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
