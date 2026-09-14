"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Headphones,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Send,
  User,
  Shield,
  ArrowUpRight,
} from "lucide-react";

interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  requester: string;
  userType: "CUSTOMER" | "SELLER" | "RIDER";
  priority: "HIGH" | "MEDIUM" | "LOW";
  status: "open" | "in_progress" | "resolved";
  lastUpdated: string;
}

const DEMO_TICKETS: Ticket[] = [
  {
    id: "tkt-1",
    ticketNumber: "TCK-8819",
    subject: "Missing item in delivered order #ORD-2026-9818",
    requester: "Chloe Bennett",
    userType: "CUSTOMER",
    priority: "HIGH",
    status: "open",
    lastUpdated: "15 mins ago",
  },
  {
    id: "tkt-2",
    ticketNumber: "TCK-8818",
    subject: "Stripe payout bank routing code change inquiry",
    requester: "Apex Leatherworks (Marcus)",
    userType: "SELLER",
    priority: "MEDIUM",
    status: "in_progress",
    lastUpdated: "1 hour ago",
  },
  {
    id: "tkt-3",
    ticketNumber: "TCK-8817",
    subject: "GPS zone boundary discrepancy during peak hours",
    requester: "Tariq Hassan",
    userType: "RIDER",
    priority: "LOW",
    status: "open",
    lastUpdated: "3 hours ago",
  },
  {
    id: "tkt-4",
    ticketNumber: "TCK-8810",
    subject: "Damaged box upon delivery refund processed",
    requester: "Liam O'Connor",
    userType: "CUSTOMER",
    priority: "HIGH",
    status: "resolved",
    lastUpdated: "1 day ago",
  },
];

const SUPPORT_TABS = [
  { id: "tickets", label: "Tickets Queue" },
  { id: "chat", label: "Live Chat Console" },
];

export default function AdminSupportPage() {
  const params = useParams();
  const slug = (params?.slug as string[]) || [];
  const routeTab = slug[0] || "tickets";

  const [activeTab, setActiveTab] = useState(routeTab);
  const [tickets, setTickets] = useState<Ticket[]>(DEMO_TICKETS);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(DEMO_TICKETS[0]);
  const [search, setSearch] = useState("");
  const [replyText, setReplyText] = useState("");
  const [replySuccess, setReplySuccess] = useState(false);

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setReplySuccess(true);
    setReplyText("");
    setTimeout(() => setReplySuccess(false), 3000);
  };

  const handleResolveTicket = (id: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "resolved" as const } : t))
    );
    if (selectedTicket?.id === id) {
      setSelectedTicket((prev) => (prev ? { ...prev, status: "resolved" as const } : null));
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchSearch =
      !search.trim() ||
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
      t.requester.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F8EE] border border-[#A2E4B8]/30 text-[#0A504A] text-[11px] font-bold uppercase tracking-wider mb-2">
            <Headphones className="w-3.5 h-3.5 text-[#00A86B]" />
            <span>17. Customer Success & Live Dispute Concierge</span>
          </div>
          <h1 className="text-3xl font-serif font-black text-[#0A504A] tracking-tight">
            Support Desk & Live Chat
          </h1>
          <p className="text-xs text-[#0A504A]/70 mt-1">
            Resolve buyer order complaints, vendor onboarding queries, and live delivery disputes.
          </p>
        </div>

        <Link
          href="/admin/chat"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00A86B] text-white text-xs font-bold shadow-sm hover:bg-[#0A504A] transition"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Open Full Chat Console</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#0A504A]/70">Active Open Tickets</span>
          <div className="text-2xl font-serif font-black text-rose-600 mt-1.5">
            {tickets.filter((t) => t.status !== "resolved").length} Tickets
          </div>
          <span className="text-[10px] text-[#0A504A]/70 mt-1 inline-block">1 ticket marked High Priority</span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#0A504A]/70">Avg First Response Time</span>
          <div className="text-2xl font-serif font-black text-[#00A86B] mt-1.5">4.8 mins</div>
          <span className="text-[10px] text-emerald-600 font-semibold mt-1 inline-block">SLA Target &lt; 15 mins</span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#0A504A]/70">CSAT Satisfaction Score</span>
          <div className="text-2xl font-serif font-black text-[#0A504A] mt-1.5">97.4%</div>
          <span className="text-[10px] text-emerald-600 font-semibold mt-1 inline-block">Based on 420 surveys</span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#0A504A]/70">Resolved Today</span>
          <div className="text-2xl font-serif font-black text-emerald-600 mt-1.5">18 Tickets</div>
          <span className="text-[10px] text-[#0A504A]/70 mt-1 inline-block">Zero backlog rollover</span>
        </div>
      </div>

      {/* Main Support Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tickets Queue */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[#0A504A]/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tickets by # or subject..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A] placeholder:text-[#0A504A]/70/50 focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20"
            />
          </div>

          <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
            {filteredTickets.map((tkt) => {
              const isSelected = selectedTicket?.id === tkt.id;
              return (
                <div
                  key={tkt.id}
                  onClick={() => setSelectedTicket(tkt)}
                  className={`p-4 rounded-2xl border transition cursor-pointer ${
                    isSelected
                      ? "bg-[#E8F8EE] border-[#00A86B] shadow-sm"
                      : "bg-white border-[#D1E7D8] hover:bg-[#E8F8EE]/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono text-xs font-bold text-[#00A86B]">{tkt.ticketNumber}</span>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        tkt.priority === "HIGH"
                          ? "bg-rose-100 text-rose-800"
                          : tkt.priority === "MEDIUM"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {tkt.priority}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-[#0A504A] line-clamp-1">{tkt.subject}</h4>
                  <div className="flex items-center justify-between text-[11px] text-[#0A504A]/70 mt-2">
                    <span>{tkt.requester}</span>
                    <span>{tkt.lastUpdated}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Ticket Conversation Pane */}
        <div className="lg:col-span-7">
          {selectedTicket ? (
            <div className="rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs p-6 flex flex-col h-[580px] justify-between">
              {/* Header */}
              <div>
                <div className="flex items-center justify-between border-b border-[#D1E7D8] pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#00A86B]">
                        {selectedTicket.ticketNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E8F8EE] text-[#0A504A]">
                        {selectedTicket.userType}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-[#0A504A] mt-1">{selectedTicket.subject}</h3>
                    <p className="text-[11px] text-[#0A504A]/70">Requester: {selectedTicket.requester}</p>
                  </div>

                  {selectedTicket.status !== "resolved" && (
                    <button
                      onClick={() => handleResolveTicket(selectedTicket.id)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>

                {/* Message stream */}
                <div className="py-4 space-y-3 overflow-y-auto max-h-[300px]">
                  <div className="p-3.5 rounded-xl bg-[#E8F8EE]/60 border border-[#D1E7D8] text-xs text-[#0A504A] space-y-1">
                    <div className="flex items-center justify-between font-bold text-[11px]">
                      <span>{selectedTicket.requester}</span>
                      <span className="text-[#0A504A]/70 font-normal">{selectedTicket.lastUpdated}</span>
                    </div>
                    <p>
                      Hello Zevo Team, I am reaching out regarding this urgent issue. Could an admin please review and assist?
                    </p>
                  </div>

                  {replySuccess && (
                    <div className="p-3.5 rounded-xl bg-[#00A86B]/10 border border-[#00A86B]/20 text-xs text-[#0A504A] ml-6 space-y-1">
                      <div className="flex items-center justify-between font-bold text-[11px] text-[#00A86B]">
                        <span>Zevo Admin Support</span>
                        <span className="text-[#0A504A]/70 font-normal">Just now</span>
                      </div>
                      <p>Your response has been dispatched to {selectedTicket.requester} via email & push notification.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Reply box */}
              <form onSubmit={handleSendReply} className="border-t border-[#D1E7D8] pt-4 space-y-3">
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type an official admin response..."
                  className="w-full p-3 rounded-xl bg-[#E8F8EE]/40 border border-[#D1E7D8] text-xs text-[#0A504A] focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20 resize-none"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#0A504A]/70">User will receive notification instantly.</span>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00A86B] text-white text-xs font-bold hover:bg-[#0A504A] transition shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Response</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="rounded-2xl bg-white border border-[#D1E7D8] p-12 text-center text-xs text-[#0A504A]/70">
              Select a support ticket from the left column to view message history.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
