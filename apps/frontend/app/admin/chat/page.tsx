"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "../../../hooks/useAuth";
import {
  getConversations,
  getMessages,
  sendMessage,
  markConversationAsRead,
  ConversationItem,
  ChatMessageItem,
} from "../../../lib/api/chat";
import {
  MessageSquare,
  Search,
  Send,
  User,
  Shield,
  Clock,
  Sparkles,
  PhoneCall,
  CheckCheck,
  Loader2,
  RefreshCw,
  ShoppingBag,
  Store,
  Bike,
  Headphones,
  CheckCircle2,
} from "lucide-react";

export default function AdminLiveChatPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [filterRole, setFilterRole] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 1. Fetch conversations list
  const loadConversations = async (preserveActive = true) => {
    try {
      const data = await getConversations(50);
      setConversations(data || []);
      if (data && data.length > 0 && (!activeConvId || !preserveActive)) {
        setActiveConvId(data[0]._id);
      }
    } catch (err) {
      console.error("Failed to load conversations", err);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    loadConversations(false);
  }, []);

  // 2. Poll for conversation list updates every 4s
  useEffect(() => {
    const interval = setInterval(() => {
      loadConversations(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeConvId]);

  // 3. Load messages when active conversation changes
  useEffect(() => {
    if (!activeConvId) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    const fetchMsgs = async () => {
      setIsLoadingMessages(true);
      try {
        const res = await getMessages(activeConvId, 50);
        if (!isMounted) return;
        setMessages(res?.messages || []);
        markConversationAsRead(activeConvId).catch(() => {});
      } catch (err) {
        console.error("Failed to load messages", err);
      } finally {
        if (isMounted) setIsLoadingMessages(false);
      }
    };

    fetchMsgs();

    return () => {
      isMounted = false;
    };
  }, [activeConvId]);

  // 4. Poll for new messages on the active conversation every 3s
  useEffect(() => {
    if (!activeConvId) return;

    const interval = setInterval(async () => {
      try {
        const res = await getMessages(activeConvId, 50);
        if (res?.messages) {
          setMessages(res.messages);
        }
      } catch {
        // silent fail on polling
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activeConvId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Find other participant (the user chatting with support)
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

  const activeConv = conversations.find((c) => c._id === activeConvId);
  const otherParticipant =
    activeConv?.participants.find((p) => p.user_id !== user?.id && p.role !== "admin") ||
    activeConv?.participants[0];

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending || !activeConvId) return;

    const textToSend = inputText.trim();
    setInputText("");
    setIsSending(true);

    try {
      const sentMsg = await sendMessage(activeConvId, textToSend);
      setMessages((prev) => {
        if (prev.some((m) => String(m._id) === String(sentMsg._id))) return prev;
        return [...prev, sentMsg];
      });
      scrollToBottom();
      loadConversations(true);
    } catch (err) {
      console.error("Failed to send reply", err);
    } finally {
      setIsSending(false);
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    const p = c.participants.find((part) => part.user_id !== user?.id && part.role !== "admin") || c.participants[0];
    const role = (p?.role || "customer").toUpperCase();

    let matchRole = true;
    if (filterRole === "CUSTOMER") matchRole = role === "CUSTOMER";
    else if (filterRole === "SELLER") matchRole = role === "SELLER";
    else if (filterRole === "RIDER") matchRole = role === "DELIVERY_AGENT" || role === "RIDER";

    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      (p?.name && p.name.toLowerCase().includes(q)) ||
      (c.last_message && c.last_message.toLowerCase().includes(q));

    return matchRole && matchSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F8EE] border border-[#A2E4B8]/30 text-[#0A504A] text-[11px] font-bold uppercase tracking-wider mb-2">
            <Headphones className="w-3.5 h-3.5 text-[#00A86B]" />
            <span>Support & Live Chat Console</span>
          </div>
          <h1 className="text-3xl font-serif font-black text-[#0A504A] tracking-tight">
            Conversations Inbox
          </h1>
          <p className="text-xs text-[#0A504A]/70 mt-1">
            Real-time multi-vendor support center. Review customer inquiries, merchant questions, and dispatch assistance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadConversations(true)}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#D1E7D8] hover:bg-[#E8F8EE] text-[#0A504A] font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#00A86B]" />
            <span>Refresh Inbox</span>
          </button>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="rounded-3xl bg-white border border-[#D1E7D8] shadow-2xs overflow-hidden flex flex-col md:flex-row h-[680px]">
        {/* Left Conversation List (320px) */}
        <div className="w-full md:w-80 border-r border-[#D1E7D8] flex flex-col bg-[#F7F7F2]/40">
          {/* Search bar */}
          <div className="p-3.5 border-b border-[#D1E7D8]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#0A504A]/50 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search user or message..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A] placeholder:text-[#0A504A]/40 focus:outline-none focus:border-[#00A86B]"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto scrollbar-none pb-0.5">
              {[
                { key: "ALL", label: "All" },
                { key: "CUSTOMER", label: "Customers" },
                { key: "SELLER", label: "Merchants" },
                { key: "RIDER", label: "Riders" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilterRole(tab.key)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer shrink-0 ${
                    filterRole === tab.key
                      ? "bg-[#00A86B] text-white"
                      : "bg-white border border-[#D1E7D8] text-[#0A504A]/70 hover:bg-[#E8F8EE]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#D1E7D8]/60">
            {isLoadingList ? (
              <div className="py-12 text-center">
                <Loader2 className="w-6 h-6 text-[#00A86B] animate-spin mx-auto mb-2" />
                <span className="text-xs text-[#0A504A]/60 font-semibold">Loading conversations...</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="py-12 text-center px-4">
                <MessageSquare className="w-8 h-8 text-[#0A504A]/30 mx-auto mb-2" />
                <p className="text-xs font-bold text-[#0A504A]/70">No conversations found</p>
                <p className="text-[11px] text-[#0A504A]/50 mt-0.5">
                  When customers or merchants send support inquiries, they will appear here.
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const part =
                  conv.participants.find((p) => p.user_id !== user?.id && p.role !== "admin") ||
                  conv.participants[0];
                const isSelected = conv._id === activeConvId;
                const role = (part?.role || "customer").toUpperCase();

                return (
                  <button
                    key={conv._id}
                    onClick={() => setActiveConvId(conv._id)}
                    className={`w-full p-3.5 text-left flex items-start gap-3 transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-[#E8F8EE] border-l-4 border-[#00A86B]"
                        : "hover:bg-white/80"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#0A504A] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      {part?.name ? part.name.slice(0, 2).toUpperCase() : "U"}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-bold text-xs text-[#0A504A] truncate">
                          {part?.name || "User"}
                        </span>
                        <span className="text-[10px] text-[#0A504A]/50 font-mono shrink-0">
                          {conv.last_message_at
                            ? new Date(conv.last_message_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase border ${
                            role === "SELLER"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : role === "DELIVERY_AGENT" || role === "RIDER"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {role === "DELIVERY_AGENT" ? "RIDER" : role}
                        </span>
                        {conv.order_id && (
                          <span className="text-[9px] font-mono text-gray-500 truncate">
                            Order linked
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-[#0A504A]/70 truncate">
                        {conv.last_message || "No messages yet"}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Active Chat Pane */}
        <div className="flex-1 flex flex-col bg-white">
          {!activeConv ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-3xl bg-[#E8F8EE] text-[#00A86B] flex items-center justify-center mb-3">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="font-serif font-bold text-base text-[#0A504A]">Select a Conversation</h3>
              <p className="text-xs text-[#0A504A]/60 max-w-sm mt-1">
                Choose a conversation from the left inbox to review message history and send an admin response.
              </p>
            </div>
          ) : (
            <>
              {/* Active Conversation Header */}
              <div className="p-4 border-b border-[#D1E7D8] bg-[#F7F7F2]/60 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#00A86B] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    {otherParticipant?.name ? otherParticipant.name.slice(0, 2).toUpperCase() : "U"}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#0A504A] flex items-center gap-2">
                      <span>{otherParticipant?.name || "Customer Inquiry"}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#E8F8EE] text-[#00A86B] border border-[#00A86B]/30">
                        {otherParticipant?.role || "user"}
                      </span>
                    </h3>
                    <p className="text-[11px] text-[#0A504A]/60 flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Active Session</span>
                      </span>
                      {activeConv.order_id && (
                        <span>• Order ID: <strong className="font-mono">{String(activeConv.order_id).slice(-6)}</strong></span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/users`}
                    className="px-3 py-1.5 rounded-xl bg-white border border-[#D1E7D8] hover:bg-[#E8F8EE] text-[#0A504A] font-bold text-xs transition-colors shadow-2xs"
                  >
                    View User Info
                  </Link>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-[#F7F7F2]/30">
                {isLoadingMessages ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-[#00A86B] animate-spin" />
                  </div>
                ) : uniqueMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                    <p className="text-xs">No messages in this conversation yet.</p>
                  </div>
                ) : (
                  uniqueMessages.map((msg, idx) => {
                    const myId = String(user?.id || (user as any)?._id || "");
                    const senderIdStr = String(msg.sender_id || "");
                    const isMe =
                      (myId && senderIdStr === myId) ||
                      (user?.email && msg.sender_name?.toLowerCase() === user.email.toLowerCase()) ||
                      ((user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" || user?.role === "SUPPORT") && (msg.sender_role === "admin" || msg.sender_role === "support"));

                    const initial = (msg.sender_name || (isMe ? "You" : "User")).charAt(0).toUpperCase();
                    const timeStr = msg.created_at
                      ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : "Just now";

                    return (
                      <div
                        key={msg._id || idx}
                        className={`flex items-end gap-2.5 mb-3 group animate-fade-in ${
                          isMe ? "justify-end" : "justify-start"
                        }`}
                      >
                        {/* Other party avatar on left */}
                        {!isMe && (
                          <div
                            className="w-8 h-8 rounded-full bg-[#0A504A] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs ring-2 ring-white"
                            title={msg.sender_name}
                          >
                            {initial}
                          </div>
                        )}

                        {/* Message content box */}
                        <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[78%] sm:max-w-md`}>
                          {/* Sender Name & Timestamp Header */}
                          <div className={`flex items-center gap-1.5 mb-1 px-1 text-[11px] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                            <span className="font-bold text-[#0A504A] text-[11px]">
                              {isMe ? "You" : msg.sender_name}
                            </span>
                            {!isMe && msg.sender_role && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-[#E8F8EE] text-[#00A86B] border border-[#00A86B]/30">
                                {msg.sender_role.replace("_", " ")}
                              </span>
                            )}
                            <span className="text-[10px] text-gray-400 font-mono">
                              {timeStr}
                            </span>
                          </div>

                          {/* Message Bubble with Messenger-style tail */}
                          <div
                            className={`px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-xs break-words whitespace-pre-wrap ${
                              isMe
                                ? "bg-[#00A86B] text-white rounded-br-xs font-medium shadow-emerald-500/10"
                                : "bg-white border border-[#D1E7D8] text-[#0A504A] rounded-bl-xs font-medium"
                            }`}
                          >
                            <p>{msg.text}</p>
                          </div>
                        </div>

                        {/* My avatar on right */}
                        {isMe && (
                          <div
                            className="w-8 h-8 rounded-full bg-[#00A86B] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs ring-2 ring-[#00A86B]/30"
                            title="You"
                          >
                            {(user?.first_name?.charAt(0) || user?.email?.charAt(0) || "S").toUpperCase()}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Input Bar */}
              <form
                onSubmit={handleSendMessage}
                className="p-3.5 bg-white border-t border-[#D1E7D8] flex items-center gap-2 shrink-0"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type an official admin reply..."
                  disabled={isSending}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#F7F7F2] border border-[#D1E7D8] text-xs text-[#0A504A] placeholder:text-[#0A504A]/40 focus:outline-none focus:border-[#00A86B] transition-colors font-medium"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isSending}
                  className="px-5 py-2.5 rounded-xl bg-[#00A86B] hover:bg-[#0A504A] text-white font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm cursor-pointer shrink-0"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Reply</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
