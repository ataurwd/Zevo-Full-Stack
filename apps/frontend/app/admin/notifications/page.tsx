"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Bell,
  Send,
  Plus,
  Clock,
  CheckCircle2,
  Users,
  Mail,
  Smartphone,
  Search,
  FileText,
  Filter,
} from "lucide-react";

interface NotificationLog {
  id: string;
  title: string;
  target: "ALL_USERS" | "SELLERS" | "CUSTOMERS" | "RIDERS";
  channel: "PUSH" | "EMAIL" | "IN_APP";
  status: "sent" | "scheduled";
  sentAt: string;
  recipients: number;
  openRate: string;
}

const DEMO_NOTIFICATIONS: NotificationLog[] = [
  {
    id: "ntf-1",
    title: "Weekend Atelier Showcase: 20% Off Linen Essentials",
    target: "CUSTOMERS",
    channel: "PUSH",
    status: "sent",
    sentAt: "2 hours ago",
    recipients: 4250,
    openRate: "48.2%",
  },
  {
    id: "ntf-2",
    title: "Urgent: Updated Merchant KYC Regulatory Requirements",
    target: "SELLERS",
    channel: "EMAIL",
    status: "sent",
    sentAt: "1 day ago",
    recipients: 340,
    openRate: "89.4%",
  },
  {
    id: "ntf-3",
    title: "Peak Hour Surcharge Bonus Active (+ $2.50 / delivery)",
    target: "RIDERS",
    channel: "IN_APP",
    status: "sent",
    sentAt: "3 days ago",
    recipients: 48,
    openRate: "92.1%",
  },
  {
    id: "ntf-4",
    title: "Scheduled: Cyber Gala VIP Early Access Announcement",
    target: "ALL_USERS",
    channel: "EMAIL",
    status: "scheduled",
    sentAt: "Scheduled for Nov 25, 2026",
    recipients: 12400,
    openRate: "Pending",
  },
];

const NOTIFICATION_TABS = [
  { id: "sent", label: "Broadcast Log" },
  { id: "create", label: "Send Broadcast" },
  { id: "scheduled", label: "Scheduled" },
  { id: "templates", label: "Notification Templates" },
];

export default function AdminNotificationsPage() {
  const params = useParams();
  const slug = (params?.slug as string[]) || [];
  const routeTab = slug[0] || "sent";

  const [activeTab, setActiveTab] = useState(routeTab);
  const [notifications, setNotifications] = useState<NotificationLog[]>(DEMO_NOTIFICATIONS);
  const [search, setSearch] = useState("");

  // Broadcast creation form
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetAudience, setTargetAudience] = useState<"ALL_USERS" | "SELLERS" | "CUSTOMERS" | "RIDERS">("CUSTOMERS");
  const [channel, setChannel] = useState<"PUSH" | "EMAIL" | "IN_APP">("PUSH");
  const [sentNotice, setSentNotice] = useState(false);

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    const newLog: NotificationLog = {
      id: `ntf-${Date.now()}`,
      title: title.trim(),
      target: targetAudience,
      channel: channel,
      status: "sent",
      sentAt: "Just now",
      recipients: targetAudience === "CUSTOMERS" ? 4250 : targetAudience === "SELLERS" ? 340 : 12400,
      openRate: "Sending...",
    };

    setNotifications([newLog, ...notifications]);
    setTitle("");
    setBody("");
    setSentNotice(true);
    setTimeout(() => {
      setSentNotice(false);
      setActiveTab("sent");
    }, 1800);
  };

  const filteredLogs = notifications.filter((n) => {
    const matchStatus =
      activeTab === "sent" ? n.status === "sent" : activeTab === "scheduled" ? n.status === "scheduled" : true;
    const matchSearch =
      !search.trim() ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.target.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F8EE] border border-[#A2E4B8]/30 text-[#0A504A] text-[11px] font-bold uppercase tracking-wider mb-2">
            <Bell className="w-3.5 h-3.5 text-[#00A86B]" />
            <span>16. Omnichannel Notification & Alert System</span>
          </div>
          <h1 className="text-3xl font-serif font-black text-[#0A504A] tracking-tight">
            Notifications & Broadcasts
          </h1>
          <p className="text-xs text-[#0A504A]/70 mt-1">
            Dispatch urgent buyer announcements, configure push notifications, and trigger seller platform alerts.
          </p>
        </div>

        <button
          onClick={() => setActiveTab("create")}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00A86B] text-white text-xs font-bold shadow-sm hover:bg-[#0A504A] transition"
        >
          <Send className="w-4 h-4" />
          <span>New Broadcast</span>
        </button>
      </div>

      {sentNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Broadcast dispatched successfully via BullMQ background notification workers!</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#0A504A]/70">Delivered This Month</span>
          <div className="text-2xl font-serif font-black text-[#0A504A] mt-1.5">142,890</div>
          <span className="text-[10px] text-emerald-600 font-semibold mt-1 inline-block">99.4% Delivery SLA</span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#0A504A]/70">Avg Push Open Rate</span>
          <div className="text-2xl font-serif font-black text-[#00A86B] mt-1.5">44.2%</div>
          <span className="text-[10px] text-[#0A504A]/70 mt-1 inline-block">Top category: Order Tracking</span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#0A504A]/70">Active Channels</span>
          <div className="text-2xl font-serif font-black text-[#0A504A] mt-1.5">3 Channels</div>
          <span className="text-[10px] text-[#0A504A]/70 mt-1 inline-block">Push, Email (Sendgrid), WebSockets</span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#0A504A]/70">Spam Complaints</span>
          <div className="text-2xl font-serif font-black text-emerald-600 mt-1.5">0.01%</div>
          <span className="text-[10px] text-[#0A504A]/70 mt-1 inline-block">Opt-out compliant</span>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D1E7D8] pb-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          {NOTIFICATION_TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  active
                    ? "bg-[#00A86B] text-white shadow-2xs"
                    : "bg-white border border-[#D1E7D8] text-[#0A504A]/70 hover:bg-[#E8F8EE]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {(activeTab === "sent" || activeTab === "scheduled") && (
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#0A504A]/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notifications..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A] placeholder:text-[#0A504A]/70/50 focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20"
            />
          </div>
        )}
      </div>

      {/* Tab 1 & 3: Sent & Scheduled Table */}
      {(activeTab === "sent" || activeTab === "scheduled") && (
        <div className="rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#E8F8EE]/60 text-[#0A504A] font-bold border-b border-[#D1E7D8]">
                <tr>
                  <th className="px-5 py-3.5">Announcement / Title</th>
                  <th className="px-5 py-3.5">Target Audience</th>
                  <th className="px-5 py-3.5">Delivery Channel</th>
                  <th className="px-5 py-3.5">Recipients</th>
                  <th className="px-5 py-3.5">Engagement Rate</th>
                  <th className="px-5 py-3.5">Dispatched</th>
                  <th className="px-5 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1E7D8]/60">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#E8F8EE]/40 transition">
                    <td className="px-5 py-4 font-bold text-[#0A504A] max-w-sm truncate">{log.title}</td>
                    <td className="px-5 py-4">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#E8F8EE] text-[#00A86B]">
                        {log.target}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-[#0A504A] font-medium">
                        {log.channel === "PUSH" ? (
                          <Smartphone className="w-3.5 h-3.5 text-[#00A86B]" />
                        ) : log.channel === "EMAIL" ? (
                          <Mail className="w-3.5 h-3.5 text-blue-600" />
                        ) : (
                          <Bell className="w-3.5 h-3.5 text-amber-600" />
                        )}
                        <span>{log.channel}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-semibold text-[#0A504A]">{log.recipients.toLocaleString()}</td>
                    <td className="px-5 py-4 font-bold text-emerald-600">{log.openRate}</td>
                    <td className="px-5 py-4 text-[#0A504A]/70">{log.sentAt}</td>
                    <td className="px-5 py-4 text-right">
                      <button className="text-xs font-semibold text-[#00A86B] hover:underline">
                        Metrics
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Send Broadcast Form */}
      {activeTab === "create" && (
        <form
          onSubmit={handleSendBroadcast}
          className="rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs p-6 max-w-2xl space-y-5"
        >
          <h3 className="text-base font-bold text-[#0A504A]">Dispatch Broadcast Alert</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0A504A] mb-1">Target Group</label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#E8F8EE]/40 border border-[#D1E7D8] text-xs font-semibold text-[#0A504A] focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20"
              >
                <option value="CUSTOMERS">All Registered Customers (4,250)</option>
                <option value="SELLERS">Verified Sellers Only (340)</option>
                <option value="RIDERS">Active Delivery Fleet (28)</option>
                <option value="ALL_USERS">Global Platform Broadcast (12,400)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A504A] mb-1">Dispatch Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#E8F8EE]/40 border border-[#D1E7D8] text-xs font-semibold text-[#0A504A] focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20"
              >
                <option value="PUSH">Browser / Mobile Push Notification</option>
                <option value="EMAIL">Transactional Email (SendGrid)</option>
                <option value="IN_APP">In-App Notification Bell</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0A504A] mb-1">Notification Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Flash Sale: Exclusive 20% Discount Activated"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#E8F8EE]/40 border border-[#D1E7D8] text-xs font-bold text-[#0A504A] focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0A504A] mb-1">Message Content</label>
            <textarea
              rows={4}
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Draft your broadcast message body..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#E8F8EE]/40 border border-[#D1E7D8] text-xs text-[#0A504A] focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20 resize-none"
            />
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#00A86B] text-white text-xs font-bold shadow-sm hover:bg-[#0A504A] transition flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Broadcast Now</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("sent")}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#0A504A]/70 hover:bg-[#E8F8EE]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Tab 4: Templates */}
      {activeTab === "templates" && (
        <div className="rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs p-6 space-y-4">
          <h3 className="text-base font-bold text-[#0A504A]">Pre-built System Notification Templates</h3>
          <p className="text-xs text-[#0A504A]/70">
            Standardized templates triggered by BullMQ queue events and lifecycle webhooks.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {[
              { id: "tmpl-1", name: "Order Placed & Payment Captured", event: "order.created", channel: "Email & Push" },
              { id: "tmpl-2", name: "Delivery In-Transit & Courier Assigned", event: "delivery.dispatched", channel: "Push" },
              { id: "tmpl-3", name: "Seller KYC Approved & Store Live", event: "seller.kyc_approved", channel: "Email" },
              { id: "tmpl-4", name: "Disbursement Payout Settled", event: "payout.processed", channel: "Email" },
            ].map((tmpl) => (
              <div key={tmpl.id} className="p-4 rounded-xl border border-[#D1E7D8] bg-[#E8F8EE]/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0A504A]">{tmpl.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#E8F8EE] text-[#00A86B] font-semibold">{tmpl.channel}</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#0A504A]/70 block mt-1">Event: {tmpl.event}</span>
                </div>
                <div className="mt-4 flex items-center justify-end">
                  <button className="text-xs font-semibold text-[#00A86B] hover:underline">
                    Edit Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
