"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getConversations, ConversationItem } from "@/lib/api/chat";
import { getAvailableRiders, DeliveryAgentProfile } from "@/lib/api/delivery";
import { MessageSquare, Headphones } from "lucide-react";
import Link from "next/link";
import {
  DollarSign,
  ShoppingCart,
  Store,
  Truck,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
  Clock,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Filter,
  Download,
  Plus,
  Eye,
  RefreshCw,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getAdminOrders, Order } from "@/lib/api/orders";
import { getAdminAllPayments, PaymentItem } from "@/lib/api/payments";

const REVENUE_ANALYTICS_DATA = [
  { date: "Mon", revenue: 14200, orders: 42 },
  { date: "Tue", revenue: 18900, orders: 58 },
  { date: "Wed", revenue: 16400, orders: 49 },
  { date: "Thu", revenue: 22800, orders: 71 },
  { date: "Fri", revenue: 27500, orders: 89 },
  { date: "Sat", revenue: 31200, orders: 104 },
  { date: "Sun", revenue: 28900, orders: 95 },
];

const PENDING_APPROVAL_ACTIONS = [
  {
    id: "app-1",
    type: "SELLER",
    title: "Nordic Atelier Co.",
    subtitle: "New merchant verification application",
    time: "18m ago",
    badge: "KYC Ready",
  },
  {
    id: "app-2",
    type: "WITHDRAWAL",
    title: "Payout Request: $1,420.00",
    subtitle: "Apex Leatherworks (Stripe Connect)",
    time: "32m ago",
    badge: "Funds Held",
  },
  {
    id: "app-3",
    type: "REVIEW",
    title: "Reported Review Flag",
    subtitle: "Flagged for competitor defamation",
    time: "1h ago",
    badge: "Review #884",
  },
];


function SupportDashboardView() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [riders, setRiders] = useState<DeliveryAgentProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSupportData = async () => {
    setIsLoading(true);
    try {
      const [ordersRes, convsRes, ridersRes] = await Promise.allSettled([
        getAdminOrders({ limit: 15 }),
        getConversations(50),
        getAvailableRiders(),
      ]);

      if (ordersRes.status === "fulfilled") {
        setOrders(ordersRes.value.orders || []);
      }
      if (convsRes.status === "fulfilled") {
        setConversations(convsRes.value || []);
      }
      if (ridersRes.status === "fulfilled") {
        setRiders(ridersRes.value.riders || []);
      }
    } catch (err) {
      console.error("Failed loading support telemetry", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSupportData();
  }, []);

  const pendingDispatchOrders = orders.filter(
    (o) => o.status === "pending" || o.status === "confirmed" || o.status === "preparing"
  );
  const recentConversations = conversations.filter((c) => !!c.last_message);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header / Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F8EE] border border-[#A2E4B8] text-[#0A504A] text-[11px] font-bold uppercase tracking-wider mb-2">
            <Headphones className="w-3.5 h-3.5 text-[#00A86B]" />
            <span>Support & Dispatch Command Center</span>
            <span className="w-2 h-2 rounded-full bg-[#00A86B] animate-ping" />
          </div>
          <h1 className="text-3xl font-serif font-black text-[#0A504A] tracking-tight">
            Support Operations Portal
          </h1>
          <p className="text-xs text-[#0A504A]/70 mt-1">
            Real-time customer inquiries, merchant & rider communications, and order courier dispatch management.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/admin/chat"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A504A] hover:bg-[#00A86B] text-white text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Live Chat Console</span>
            {recentConversations.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-[#00A86B] text-white text-[10px]">
                {recentConversations.length}
              </span>
            )}
          </Link>

          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#D1E7D8] hover:bg-[#E8F8EE] text-xs font-bold text-[#0A504A] transition-all shadow-2xs"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-[#00A86B]" />
            <span>All Orders ({orders.length})</span>
          </Link>

          <button
            type="button"
            onClick={loadSupportData}
            className="p-2.5 rounded-xl bg-white border border-[#D1E7D8] hover:bg-[#E8F8EE] text-[#0A504A] transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* 4 SAAS KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Active Conversations */}
        <Link
          href="/admin/chat"
          className="p-6 rounded-3xl bg-white border border-[#D1E7D8] shadow-2xs hover:shadow-md hover:border-[#00A86B]/40 transition-all flex flex-col justify-between group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0A504A] text-white flex items-center justify-center shadow-md shadow-[#0A504A]/25 group-hover:scale-105 transition-transform">
              <Headphones className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E8F8EE] border border-[#D1E7D8] text-[11px] font-bold text-[#00A86B]">
              <span className="w-2 h-2 rounded-full bg-[#00A86B] animate-pulse" />
              <span>Live Feed</span>
            </span>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A504A]/70 block">
              Active Support Threads
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-serif font-black text-[#0A504A]">
                {conversations.length}
              </span>
              {recentConversations.length > 0 && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {recentConversations.length} Active
                </span>
              )}
            </div>
            <span className="text-[11px] text-[#00A86B] font-bold mt-2 flex items-center gap-1">
              Open Support Console <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </Link>

        {/* Card 2: Orders Awaiting Courier Allocation */}
        <Link
          href="/admin/orders"
          className="p-6 rounded-3xl bg-white border border-[#D1E7D8] shadow-2xs hover:shadow-md hover:border-[#00A86B]/40 transition-all flex flex-col justify-between group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0A504A] text-white flex items-center justify-center shadow-md shadow-[#0A504A]/25 group-hover:scale-105 transition-transform">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E8F8EE] border border-[#D1E7D8] text-[11px] font-bold text-[#00A86B]">
              <Clock className="w-3 h-3" />
              <span>Pending</span>
            </span>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A504A]/70 block">
              Orders Awaiting Courier
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-serif font-black text-[#0A504A]">
                {pendingDispatchOrders.length}
              </span>
              <span className="text-xs font-semibold text-[#0A504A]/70">
                of {orders.length} total
              </span>
            </div>
            <span className="text-[11px] text-[#00A86B] font-bold mt-2 flex items-center gap-1">
              View Order Queue <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </Link>

        {/* Card 3: Available Couriers */}
        <Link
          href="/admin/delivery"
          className="p-6 rounded-3xl bg-white border border-[#D1E7D8] shadow-2xs hover:shadow-md hover:border-[#00A86B]/40 transition-all flex flex-col justify-between group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0A504A] text-white flex items-center justify-center shadow-md shadow-[#0A504A]/25 group-hover:scale-105 transition-transform">
              <Truck className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Online</span>
            </span>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A504A]/70 block">
              Available Fleet Couriers
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-serif font-black text-[#0A504A]">
                {riders.length}
              </span>
              <span className="text-xs font-semibold text-emerald-700">
                Ready for Dispatch
              </span>
            </div>
            <span className="text-[11px] text-[#00A86B] font-bold mt-2 flex items-center gap-1">
              Manage Fleet <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </Link>

        {/* Card 4: Support SLA */}
        <div className="p-6 rounded-3xl bg-white border border-[#D1E7D8] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0A504A] text-white flex items-center justify-center shadow-md shadow-[#0A504A]/25">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E8F8EE] border border-[#D1E7D8] text-[11px] font-bold text-[#00A86B]">
              <CheckCircle2 className="w-3 h-3" />
              <span>Target: &lt; 5m</span>
            </span>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A504A]/70 block">
              Response SLA Rate
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-serif font-black text-[#0A504A]">
                99.4%
              </span>
              <span className="text-xs font-semibold text-emerald-700">
                Excellent
              </span>
            </div>
            <span className="text-[11px] text-[#0A504A]/70 mt-2 block">
              Live automated chat & order telemetry
            </span>
          </div>
        </div>
      </div>

      {/* 2 MAIN SAAS COLUMNS: ORDERS DISPATCH QUEUE & LIVE CHAT STREAM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Live Orders Requiring Courier Allocation (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-3xl border border-[#D1E7D8] shadow-2xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-serif font-black text-[#0A504A] tracking-tight">
                Fulfillment & Courier Allocation
              </h2>
              <p className="text-xs text-[#0A504A]/70 mt-0.5">
                Orders requiring verification and courier rider dispatch.
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-[#00A86B] hover:underline flex items-center gap-1"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-[#00A86B]" />
              <span className="text-xs text-gray-500 font-semibold">Loading live orders...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-500">
              No orders found in database.
            </div>
          ) : (
            <div className="divide-y divide-[#D1E7D8]/60 overflow-hidden">
              {orders.slice(0, 7).map((ord) => (
                <div
                  key={ord.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#E8F8EE]/30 -mx-3 px-3 rounded-xl transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[#0A504A]">
                        #{ord.order_number}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                          ord.status === "completed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : ord.status === "confirmed" || ord.status === "preparing"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {ord.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-[#0A504A] mt-1 truncate">
                      {ord.delivery_address?.recipient_name || "Guest Customer"} • {ord.delivery_address?.city || "Dhaka"}
                    </div>
                    <div className="text-[11px] text-gray-500 font-mono">
                      ${(ord.total / 100).toFixed(2)} • {new Date(ord.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>

                  <Link
                    href={`/admin/orders/live/${ord.id}`}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00A86B] hover:bg-[#008f5b] text-white text-xs font-bold transition shadow-2xs shrink-0"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Assign Courier</span>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Live Support Inquiries Stream (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-7 rounded-3xl border border-[#D1E7D8] shadow-2xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-serif font-black text-[#0A504A] tracking-tight">
                Live Support Inquiries
              </h2>
              <p className="text-xs text-[#0A504A]/70 mt-0.5">
                Real-time customer & merchant chat threads.
              </p>
            </div>
            <Link
              href="/admin/chat"
              className="text-xs font-bold text-[#00A86B] hover:underline flex items-center gap-1"
            >
              Open Console <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-[#00A86B]" />
              <span className="text-xs text-gray-500 font-semibold">Loading chat stream...</span>
            </div>
          ) : conversations.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-500">
              No support conversations active.
            </div>
          ) : (
            <div className="divide-y divide-[#D1E7D8]/60 overflow-hidden">
              {conversations.slice(0, 6).map((c) => {
                const other = c.participants?.find((p) => p.user_id !== user?.id) || c.participants?.[0] || {
                  name: "Support Thread",
                  role: "customer" as const,
                };
                const initial = (other.name || "U").charAt(0).toUpperCase();
                return (
                  <Link
                    key={c._id}
                    href="/admin/chat"
                    className="py-3 flex items-start gap-3 hover:bg-[#E8F8EE]/30 -mx-3 px-3 rounded-xl transition-colors group block"
                  >
                    <div className="w-9 h-9 rounded-2xl bg-[#0A504A] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                      {initial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#0A504A] truncate">
                          {other.name || "Inquirer"}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono shrink-0">
                          {new Date(c.updated_at || c.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">
                        {c.last_message || "Active support thread..."}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#E8F8EE] text-[#00A86B] uppercase">
                          {other.role || "customer"}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


export default function AdminDashboardPage() {
  const { user } = useAuth();
  if (user?.role === "SUPPORT") {
    return <SupportDashboardView />;
  }

  const [timeRange, setTimeRange] = useState("7D");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [ordersRes, paymentsRes] = await Promise.allSettled([
          getAdminOrders({ limit: 10 }),
          getAdminAllPayments({ limit: 50 }),
        ]);

        if (ordersRes.status === "fulfilled") {
          setOrders(ordersRes.value.orders || []);
        }
        if (paymentsRes.status === "fulfilled") {
          setPayments(paymentsRes.value.payments || []);
        }
      } catch (err) {
        console.error("Failed fetching admin dashboard telemetry", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Dynamic KPIs calculated from real database records
  const grossVolumeCents = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const activeOrdersCount = orders.filter(
    (o) => o.status === "pending" || o.status === "confirmed"
  ).length;

  const filteredOrders = orders.filter(
    (o) => statusFilter === "ALL" || o.status.toUpperCase() === statusFilter
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header / Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F8EE] border border-[#A2E4B8]/30 text-[#0A504A] text-[11px] font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00A86B]" />
            <span>Master Enterprise Portal</span>
          </div>
          <h1 className="text-3xl font-serif font-black text-[#0A504A] tracking-tight">
            Global Control Center
          </h1>
          <p className="text-xs text-[#0A504A]/70 mt-1">
            Real-time telemetry, multi-vendor order routing, merchant settlements, and logistics dispatch.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/admin/reports"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#D1E7D8] hover:bg-[#E8F8EE] text-xs font-bold text-[#0A504A] transition-all shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-[#00A86B]" />
            <span>Export Financials</span>
          </Link>

          <Link
            href="/admin/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A504A] hover:bg-[#00A86B] text-white text-xs font-bold transition-all shadow-md shadow-[#0A504A]/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Moderate Catalog</span>
          </Link>
        </div>
      </div>

      {/* 4 TOP EXECUTIVE KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: GMV */}
        <div className="p-6 rounded-3xl bg-white border border-[#D1E7D8] shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0A504A] text-white flex items-center justify-center shadow-md shadow-[#0A504A]/25">
              <DollarSign className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E8F8EE] border border-[#D1E7D8] text-[11px] font-bold text-[#00A86B]">
              <TrendingUp className="w-3 h-3" />
              <span>Real-Time</span>
            </span>
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A504A]/70 block">
              Gross Volume (GMV)
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-serif font-black text-[#0A504A]">
                ${(grossVolumeCents / 100).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <span className="text-[11px] text-[#0A504A]/70 mt-1 block">
              {payments.length} Recorded Gateway Transactions
            </span>
          </div>
        </div>

        {/* Card 2: Active Orders */}
        <div className="p-6 rounded-3xl bg-white border border-[#D1E7D8] shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0A504A] text-white flex items-center justify-center shadow-md shadow-[#0A504A]/25">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E8F8EE] border border-[#D1E7D8] text-[11px] font-bold text-[#00A86B]">
              <Clock className="w-3 h-3" />
              <span>{activeOrdersCount} Active</span>
            </span>
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A504A]/70 block">
              Active Orders
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-serif font-black text-[#0A504A]">{activeOrdersCount}</span>
              <span className="text-xs text-[#00A86B] font-semibold">in pipeline</span>
            </div>
            <span className="text-[11px] text-[#0A504A]/70 mt-1 block">
              {orders.length} total orders recorded
            </span>
          </div>
        </div>

        {/* Card 3: Sellers & Stores */}
        <div className="p-6 rounded-3xl bg-white border border-[#D1E7D8] shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0A504A] text-white flex items-center justify-center shadow-md shadow-[#0A504A]/25">
              <Store className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E8F8EE] text-[11px] font-bold text-[#0A504A]">
              <span>4 Pending</span>
            </span>
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A504A]/70 block">
              Verified Merchants
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-serif font-black text-[#0A504A]">156</span>
              <span className="text-xs text-[#0A504A]/70 font-mono">stores</span>
            </div>
            <span className="text-[11px] text-[#0A504A]/70 mt-1 block">
              98.2% merchant SLA compliance
            </span>
          </div>
        </div>

        {/* Card 4: Delivery Fleet */}
        <div className="p-6 rounded-3xl bg-white border border-[#D1E7D8] shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0A504A] text-white flex items-center justify-center shadow-md shadow-[#0A504A]/25">
              <Truck className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>34 Online</span>
            </span>
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A504A]/70 block">
              Fleet Logistics
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-serif font-black text-[#0A504A]">98.4%</span>
              <span className="text-xs text-[#0A504A]/70 font-mono">on-time</span>
            </div>
            <span className="text-[11px] text-[#0A504A]/70 mt-1 block">
              Live GPS tracking active in 12 zones
            </span>
          </div>
        </div>
      </div>

      {/* CENTERPIECE: REVENUE CHART + PENDING QUEUES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sales & Orders Dual Chart (8 cols) */}
        <div className="lg:col-span-8 p-6 sm:p-8 rounded-3xl bg-white border border-[#D1E7D8] shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#00A86B]">
                Financial Performance
              </span>
              <h3 className="text-xl font-serif font-bold text-[#0A504A]">
                Platform Revenue & Order Velocity
              </h3>
            </div>

            {/* Time range selector */}
            <div className="flex items-center bg-[#E8F8EE] border border-[#D1E7D8] rounded-full p-0.5 text-xs font-semibold">
              {["24H", "7D", "30D", "90D"].map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-3 py-1 rounded-full transition-all ${
                    timeRange === r
                      ? "bg-[#0A504A] text-white font-bold shadow-2xs"
                      : "text-[#0A504A]/70 hover:text-[#0A504A]"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Viewport */}
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REVENUE_ANALYTICS_DATA}>
                <defs>
                  <linearGradient id="adminRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00A86B" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00A86B" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="adminOrdersGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A2E4B8" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#A2E4B8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#D1E7D8" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#A2E4B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#D1E7D8" }}
                />
                <YAxis
                  stroke="#A2E4B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${v / 1000}k`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-3 rounded-2xl bg-[#0A504A] border border-[#00A86B] text-white text-xs shadow-xl">
                          <p className="font-bold mb-1">{payload[0]?.payload?.date}</p>
                          <p className="text-[#D1E7D8]">
                            Revenue:{" "}
                            <strong className="text-white">
                              ${(payload[0]?.value as number)?.toLocaleString()}
                            </strong>
                          </p>
                          <p className="text-[#0A504A]/70">
                            Orders:{" "}
                            <strong className="text-white">
                              {payload[1]?.value as number}
                            </strong>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#00A86B"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#adminRevenueGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="orders"
                  stroke="#A2E4B8"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#adminOrdersGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-4 border-t border-[#D1E7D8] flex items-center justify-between text-xs text-[#0A504A]/70">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00A86B]" />
                <span className="font-semibold text-[#0A504A]">Net Platform GMV</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#A2E4B8]" />
                <span className="font-semibold text-[#0A504A]">Order Velocity</span>
              </span>
            </div>
            <Link
              href="/admin/analytics"
              className="text-[#00A86B] font-bold hover:underline inline-flex items-center gap-1"
            >
              <span>View Full Analytics</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Actionable Triage / Approvals Queue (4 cols) */}
        <div className="lg:col-span-4 p-6 sm:p-8 rounded-3xl bg-white border border-[#D1E7D8] shadow-2xs space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-base text-[#0A504A]">
              Action Required
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-bold">
              3 Pending
            </span>
          </div>

          <div className="space-y-3">
            {PENDING_APPROVAL_ACTIONS.map((act) => (
              <div
                key={act.id}
                className="p-4 rounded-2xl bg-[#E8F8EE]/30 border border-[#D1E7D8] hover:border-[#A2E4B8]/50 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#00A86B]">
                    {act.type}
                  </span>
                  <span className="text-[10px] text-[#0A504A]/70 font-mono">{act.time}</span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[#0A504A]">{act.title}</h4>
                  <p className="text-[11px] text-[#0A504A]/70 mt-0.5">{act.subtitle}</p>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-[#0A504A] bg-white px-2 py-0.5 rounded-md border border-[#D1E7D8]">
                    {act.badge}
                  </span>

                  <Link
                    href={
                      act.type === "SELLER"
                        ? "/admin/sellers/pending"
                        : act.type === "WITHDRAWAL"
                        ? "/admin/withdrawals/pending"
                        : "/admin/reviews/pending"
                    }
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00A86B] hover:underline"
                  >
                    <span>Resolve</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Link
              href="/admin/audit-logs"
              className="w-full py-2.5 rounded-xl bg-[#E8F8EE] hover:bg-[#E8F8EE] text-[#0A504A] text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <span>View Immutable Audit Trail</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* RECENT GLOBAL ORDERS TABLE */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#D1E7D8] shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D1E7D8]">
          <div>
            <h3 className="font-serif font-bold text-lg text-[#0A504A]">
              Recent Multi-Vendor Orders
            </h3>
            <p className="text-xs text-[#0A504A]/70 mt-0.5">
              Live order orchestration across all verified merchant hubs and riders.
            </p>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {["ALL", "PENDING", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "COMPLETED", "CANCELLED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === st
                    ? "bg-[#00A86B] text-white font-bold shadow-2xs"
                    : "text-[#0A504A]/70 hover:bg-[#E8F8EE] hover:text-[#0A504A]"
                }`}
              >
                {st.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Table Viewport */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#D1E7D8] text-[#0A504A]/70 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-3 pl-2">Order ID</th>
                <th className="pb-3">Customer / Recipient</th>
                <th className="pb-3">Merchant Packages</th>
                <th className="pb-3">Fulfillment Status</th>
                <th className="pb-3">Delivery Zone</th>
                <th className="pb-3 text-right">Amount</th>
                <th className="pb-3 pr-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D1E7D8]/70">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-[#0A504A]/70">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#00A86B]" />
                      <span>Loading real-time orders from database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-xs text-[#0A504A]/70">
                    No orders recorded matching this filter status.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const recipient = ord.delivery_address?.recipient_name || "Customer";
                  const avatar = recipient.slice(0, 2).toUpperCase();
                  const pkgCount = ord.sub_orders?.length || 1;
                  const itemsCount = ord.sub_orders?.reduce((sum, s) => sum + (s.items?.length || 0), 0) || 0;
                  return (
                    <tr key={ord.id} className="hover:bg-[#E8F8EE]/40 transition-colors">
                      <td className="py-4 pl-2 font-mono font-bold text-[#0A504A]">
                        #{ord.order_number}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#E8F8EE] text-[#0A504A] font-bold flex items-center justify-center text-[10px]">
                            {avatar}
                          </div>
                          <span className="font-semibold text-[#0A504A]">{recipient}</span>
                        </div>
                      </td>
                      <td className="py-4 text-[#0A504A]/70 font-medium">
                        {pkgCount} Store Package{pkgCount > 1 ? "s" : ""} ({itemsCount} items)
                      </td>
                      <td className="py-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize ${
                            ord.status === "confirmed"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : ord.status === "pending"
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : ord.status === "cancelled"
                              ? "bg-rose-50 text-rose-800 border-rose-200"
                              : "bg-[#E8F8EE] text-[#00A86B] border-[#A2E4B8]/40"
                          }`}
                        >
                          {ord.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-4 text-[#0A504A]/70 text-[11px]">
                        {ord.delivery_address?.city || "Express"}, {ord.delivery_address?.state || "Doorstep"}
                      </td>
                      <td className="py-4 text-right font-mono font-bold text-sm text-[#0A504A]">
                        ${(ord.total / 100).toFixed(2)}
                      </td>
                      <td className="py-4 pr-2 text-right">
                        <Link
                          href={`/orders/${ord.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#E8F8EE] hover:bg-[#A2E4B8]/30 text-[#00A86B] font-bold text-[11px] transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Track Live</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-[#D1E7D8]">
          <span className="text-xs text-[#0A504A]/70">
            Showing {filteredOrders.length} of {orders.length} real database orders
          </span>
          <Link
            href="/admin/orders"
            className="text-xs font-bold text-[#00A86B] hover:underline inline-flex items-center gap-1"
          >
            <span>Go to Unified Orders Manager</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
