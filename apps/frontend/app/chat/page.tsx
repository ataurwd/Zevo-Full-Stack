"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Navbar } from "../../components/Navbar";
import { ProtectedRoute } from "../../components/auth/ProtectedRoute";
import { useSocket } from "../../hooks/useSocket";
import { useAuth } from "../../hooks/useAuth";
import {
  getConversations,
  getMessages,
  sendMessage,
  markConversationAsRead,
  ConversationItem,
  ChatMessageItem,
} from "../../lib/api/chat";
import {
  MessageSquare,
  Send,
  User,
  Store,
  Bike,
  ShieldCheck,
  Clock,
  Loader2,
  CheckCheck,
  Search,
} from "lucide-react";

export default function ChatPage() {
  return (
    <ProtectedRoute allowedRoles={["CUSTOMER", "SELLER", "DELIVERY_AGENT", "ADMIN", "SUPER_ADMIN", "SUPPORT"]}>
      <ChatContent />
    </ProtectedRoute>
  );
}

function ChatContent() {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConv, setActiveConv] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);

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
  const [inputText, setInputText] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = async () => {
    setLoadingList(true);
    try {
      const list = await getConversations();
      setConversations(list);
      if (list.length > 0 && !activeConv) {
        setActiveConv(list[0]);
      }
    } catch {
      // Fallback
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (!activeConv?._id) return;

    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const data = await getMessages(activeConv._id);
        setMessages(data.messages || []);
        await markConversationAsRead(activeConv._id);
      } catch {
        // Fallback
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();

    // Socket room join
    if (socket) {
      socket.emit("join:chat", activeConv._id);
    }

    return () => {
      if (socket && activeConv?._id) {
        socket.emit("leave:chat", activeConv._id);
      }
    };
  }, [activeConv?._id, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket real-time event listeners
  useEffect(() => {
    if (!socket) return;

    const handleIncomingMessage = (newMsg: ChatMessageItem) => {
      if (activeConv?._id && newMsg.conversation_id === activeConv._id) {
        setMessages((prev) => {
          if (prev.some((m) => String(m._id) === String(newMsg._id))) return prev;
          return [...prev, newMsg];
        });
        markConversationAsRead(activeConv._id);
      }

      // Update conversations list preview
      setConversations((prev) =>
        prev.map((c) =>
          c._id === newMsg.conversation_id
            ? {
                ...c,
                last_message: newMsg.text,
                last_message_at: newMsg.created_at,
              }
            : c
        )
      );
    };

    const handleUserTyping = (data: { conversationId: string; isTyping: boolean }) => {
      if (activeConv?._id && data.conversationId === activeConv._id) {
        setIsTyping(data.isTyping);
      }
    };

    socket.on("chat:message", handleIncomingMessage);
    socket.on("chat:user_typing", handleUserTyping);

    return () => {
      socket.off("chat:message", handleIncomingMessage);
      socket.off("chat:user_typing", handleUserTyping);
    };
  }, [socket, activeConv?._id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    if (socket && activeConv?._id) {
      socket.emit("chat:typing", { conversationId: activeConv._id, isTyping: true });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("chat:typing", { conversationId: activeConv._id, isTyping: false });
      }, 1500);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConv?._id || sending) return;

    const textToSend = inputText.trim();
    setInputText("");
    setSending(true);

    try {
      const newMsg = await sendMessage(activeConv._id, textToSend);
      if (newMsg) {
        setMessages((prev) => {
          if (prev.some((m) => String(m._id) === String(newMsg._id))) return prev;
          return [...prev, newMsg];
        });
        scrollToBottom();
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      // Restore on failure
      setInputText(textToSend);
    } finally {
      setSending(false);
    }
  };

  const getRecipientInfo = (conv: ConversationItem) => {
    // Return first participant that isn't empty
    return conv.participants?.[1] || conv.participants?.[0] || { name: "User", role: "customer" };
  };

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const recipient = getRecipientInfo(c);
    return recipient.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col selection:bg-blue-600 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex flex-col">
        <div className="mb-4">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            <span>Messages & Live Support</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Connect in real-time with store vendors, delivery couriers, and support specialists.
          </p>
        </div>

        {/* Liquid Glass Messenger Container */}
        <div className="liquid-glass-card rounded-3xl overflow-hidden flex-1 grid grid-cols-1 md:grid-cols-12 min-h-[620px] shadow-xl border border-white/60">
          {/* Left Sidebar: Conversations */}
          <div className="md:col-span-4 border-r border-slate-200/80 flex flex-col bg-white/40 backdrop-blur-md">
            <div className="p-4 border-b border-slate-200/60">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/90 border border-slate-200/80 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-xs"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {loadingList ? (
                <div className="p-8 flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
                  <span className="text-xs">Loading conversations...</span>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                  <p className="text-xs font-bold text-slate-600">No conversations found</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Start a chat from your order tracking page or contact a merchant.
                  </p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const recipient = getRecipientInfo(conv);
                  const isSelected = activeConv?._id === conv._id;

                  return (
                    <button
                      key={conv._id}
                      onClick={() => setActiveConv(conv)}
                      className={`w-full text-left p-4 transition-all flex items-start gap-3 cursor-pointer ${
                        isSelected
                          ? "bg-blue-50/80 border-l-4 border-blue-600 shadow-xs"
                          : "hover:bg-white/60"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                        {recipient.role === "seller" ? (
                          <Store className="w-5 h-5" />
                        ) : recipient.role === "delivery_agent" ? (
                          <Bike className="w-5 h-5" />
                        ) : (
                          <User className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-bold text-slate-900 text-xs truncate">
                            {recipient.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            {conv.last_message_at
                              ? new Date(conv.last_message_at).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate font-medium">
                          {conv.last_message || "No messages yet"}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Main Chat Panel */}
          <div className="md:col-span-8 flex flex-col bg-white/70 backdrop-blur-xl">
            {activeConv ? (
              <>
                {/* Active Chat Header */}
                <div className="p-4 border-b border-slate-200/80 flex items-center justify-between bg-white/80">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center font-bold shadow-xs">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-900 text-sm">
                        {getRecipientInfo(activeConv).name}
                      </h2>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="capitalize px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                          {getRecipientInfo(activeConv).role?.replace("_", " ")}
                        </span>
                        {isTyping && (
                          <span className="text-blue-600 font-medium animate-pulse">
                            typing...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Message Stream */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                  {loadingMessages ? (
                    <div className="h-full flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-[#00A86B]" />
                    </div>
                  ) : uniqueMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                      <Clock className="w-10 h-10 mb-2 opacity-30 text-[#00A86B]" />
                      <p className="text-xs font-bold text-slate-600">Start the conversation</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Send a message to begin real-time messaging.
                      </p>
                    </div>
                  ) : (
                    uniqueMessages.map((m) => {
                      const myId = String(user?.id || (user as any)?._id || "");
                      const senderIdStr = String(m.sender_id || "");
                      const isMe =
                        (myId && senderIdStr === myId) ||
                        (user?.email && m.sender_name?.toLowerCase() === user.email.toLowerCase()) ||
                        (user?.role === "SUPPORT" && m.sender_role === "support") ||
                        ((user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") && (m.sender_role === "admin" || m.sender_role === "support"));

                      const initial = (m.sender_name || (isMe ? "You" : "User")).charAt(0).toUpperCase();
                      const timeStr = m.created_at
                        ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : "";

                      return (
                        <div
                          key={m._id}
                          className={`flex items-end gap-2.5 mb-3 group animate-fade-in ${
                            isMe ? "justify-end" : "justify-start"
                          }`}
                        >
                          {/* Other party avatar on left */}
                          {!isMe && (
                            <div
                              className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs ring-2 ring-white"
                              title={m.sender_name}
                            >
                              {initial}
                            </div>
                          )}

                          {/* Message content box */}
                          <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[78%] sm:max-w-md`}>
                            {/* Sender Name & Timestamp Header */}
                            <div className={`flex items-center gap-1.5 mb-1 px-1 text-[11px] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                              <span className="font-bold text-slate-700 text-[11px]">
                                {isMe ? "You" : m.sender_name}
                              </span>
                              {!isMe && m.sender_role && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                                  {m.sender_role.replace("_", " ")}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 font-mono">
                                {timeStr}
                              </span>
                            </div>

                            {/* Message Bubble with Messenger-style tail */}
                            <div
                              className={`px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-xs break-words whitespace-pre-wrap ${
                                isMe
                                  ? "bg-[#00A86B] text-white rounded-br-xs font-medium shadow-emerald-500/10"
                                  : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs font-medium"
                              }`}
                            >
                              {m.text}
                            </div>
                          </div>

                          {/* My avatar on right */}
                          {isMe && (
                            <div
                              className="w-8 h-8 rounded-full bg-[#0A504A] text-[#A2E4B8] font-bold text-xs flex items-center justify-center shrink-0 shadow-xs ring-2 ring-[#A2E4B8]/30"
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

                {/* Input Bar */}
                <form onSubmit={handleSend} className="p-4 border-t border-slate-200/80 bg-white/80">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Write your message..."
                      value={inputText}
                      onChange={handleInputChange}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50/80 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={!inputText.trim() || sending}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/25 transition-all cursor-pointer"
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      <span>Send</span>
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <MessageSquare className="w-12 h-12 text-blue-500/30 mb-3" />
                <h3 className="text-sm font-bold text-slate-700">Select a conversation</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Choose a chat from the sidebar to view message history and send real-time responses.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
