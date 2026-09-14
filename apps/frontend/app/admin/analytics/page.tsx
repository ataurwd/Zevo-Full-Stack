"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  Store,
  Truck,
  ArrowUpRight,
  Download,
  Calendar,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const ANALYTICS_TABS = [
  { id: "overview", label: "Overview", href: "/admin/analytics" },
  { id: "revenue", label: "Revenue", href: "/admin/analytics/revenue" },
  { id: "orders", label: "Orders", href: "/admin/analytics/orders" },
  { id: "products", label: "Products", href: "/admin/analytics/products" },
  { id: "customers", label: "Customers", href: "/admin/analytics/customers" },
  { id: "sellers", label: "Sellers", href: "/admin/analytics/sellers" },
  { id: "delivery", label: "Delivery", href: "/admin/analytics/delivery" },
];

const ANALYTICS_CHART_DATA = [
  { name: "Jan", revenue: 42000, orders: 120, customers: 310 },
  { name: "Feb", revenue: 58000, orders: 165, customers: 420 },
  { name: "Mar", revenue: 71000, orders: 198, customers: 580 },
  { name: "Apr", revenue: 89000, orders: 245, customers: 720 },
  { name: "May", revenue: 104000, orders: 290, customers: 890 },
  { name: "Jun", revenue: 128490, orders: 340, customers: 1100 },
];

export default function AdminAnalyticsModule() {
  const params = useParams();
  const slug = (params?.slug as string[]) || [];
  const currentSub = slug[0] || "overview";
  const [days, setDays] = useState("30D");

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F8EE] border border-[#A2E4B8]/30 text-[#0A504A] text-[11px] font-bold uppercase tracking-wider mb-2">
            <BarChart3 className="w-3.5 h-3.5 text-[#00A86B]" />
            <span>02. Business Intelligence & Telemetry</span>
          </div>
          <h1 className="text-3xl font-serif font-black text-[#0A504A] tracking-tight">
            Platform Analytics
          </h1>
          <p className="text-xs text-[#0A504A]/70 mt-1">
            Deep dive into revenue trends, order flows, product turnover, customer growth, and fulfillment SLAs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-[#D1E7D8] rounded-xl p-1 text-xs font-semibold">
            {["7D", "30D", "90D", "1Y"].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  days === d
                    ? "bg-[#0A504A] text-white font-bold"
                    : "text-[#0A504A]/70 hover:text-[#0A504A]"
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#D1E7D8] hover:bg-[#E8F8EE] text-xs font-bold text-[#0A504A] shadow-2xs">
            <Download className="w-3.5 h-3.5 text-[#00A86B]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Sub-route Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#D1E7D8] overflow-x-auto pb-2 scrollbar-none">
        {ANALYTICS_TABS.map((tab) => {
          const isActive = currentSub === tab.id;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                isActive
                  ? "bg-[#00A86B] text-white shadow-2xs"
                  : "bg-white border border-[#D1E7D8] text-[#0A504A]/80 hover:bg-[#E8F8EE] hover:text-[#0A504A]"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Top 4 Sectional Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-3xl bg-white border border-[#D1E7D8] shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A504A]/70">
            Total GMV Volume
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-serif font-black text-[#0A504A]">$128,490</span>
            <span className="text-xs text-emerald-600 font-bold">+24.5%</span>
          </div>
          <span className="text-[10px] text-[#0A504A]/70 mt-1 block">In the selected {days}</span>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#D1E7D8] shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A504A]/70">
            Avg Order Value (AOV)
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-serif font-black text-[#0A504A]">$86.40</span>
            <span className="text-xs text-[#00A86B] font-bold">+5.2%</span>
          </div>
          <span className="text-[10px] text-[#0A504A]/70 mt-1 block">Cross-vendor baskets</span>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#D1E7D8] shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A504A]/70">
            Platform Commission
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-serif font-black text-[#0A504A]">$10,921</span>
            <span className="text-xs text-emerald-600 font-bold">8.5% avg</span>
          </div>
          <span className="text-[10px] text-[#0A504A]/70 mt-1 block">Net revenue retained</span>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#D1E7D8] shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A504A]/70">
            Fulfillment On-Time Rate
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-serif font-black text-[#0A504A]">98.4%</span>
            <span className="text-xs text-emerald-600 font-bold">99.1% target</span>
          </div>
          <span className="text-[10px] text-[#0A504A]/70 mt-1 block">Rider hyperlocal SLA</span>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#D1E7D8] shadow-2xs space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-serif font-bold text-[#0A504A] capitalize">
              {currentSub} Trajectory Analysis
            </h3>
            <p className="text-xs text-[#0A504A]/70 mt-0.5">
              Historical performance data plotted across verified transactions.
            </p>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={ANALYTICS_CHART_DATA}>
              <defs>
                <linearGradient id="analyticsColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00A86B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00A86B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#D1E7D8" vertical={false} />
              <XAxis dataKey="name" stroke="#A2E4B8" fontSize={11} tickLine={false} />
              <YAxis stroke="#A2E4B8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="p-3 rounded-2xl bg-[#0A504A] border border-[#00A86B] text-white text-xs shadow-xl">
                        <p className="font-bold mb-1">{payload[0]?.payload?.name}</p>
                        <p className="text-[#D1E7D8]">
                          Value: <strong>${(payload[0]?.value as number)?.toLocaleString()}</strong>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey={currentSub === "orders" ? "orders" : currentSub === "customers" ? "customers" : "revenue"}
                stroke="#00A86B"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#analyticsColor)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
