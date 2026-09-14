"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardShell, ShopeeLogo, TiktokLogo, TokopediaLogo } from "../../components/dashboard/DashboardShell";
import { useAuth } from "../../hooks/useAuth";
import { getMySellerProfile } from "../../lib/api/sellers";
import {
  Package,
  CheckSquare,
  XSquare,
  TrendingUp,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Store,
  Truck,
  Users,
  Eye,
  Check,
  Zap,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// Mock Timeseries Data for the dual-line chart
const SALES_TIMESERIES = [
  { month: "Jan", sales: 2800, transactions: 140, orders: 110 },
  { month: "Feb", sales: 3200, transactions: 170, orders: 135 },
  { month: "Mar", sales: 2900, transactions: 155, orders: 120 },
  { month: "Apr", sales: 3800, transactions: 210, orders: 160 },
  { month: "May", sales: 3400, transactions: 180, orders: 145 },
  { month: "Jun", sales: 4100, transactions: 240, orders: 190 },
  { month: "Jul", sales: 3900, transactions: 215, orders: 175 },
  { month: "Aug", sales: 4435, transactions: 222, orders: 195 },
  { month: "Sep", sales: 3950, transactions: 190, orders: 165 },
  { month: "Oct", sales: 4200, transactions: 230, orders: 180 },
  { month: "Nov", sales: 4100, transactions: 210, orders: 175 },
  { month: "Des", sales: 4350, transactions: 225, orders: 190 },
];

export default function SaaSOverviewDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("7d");
  const [searchTerm, setSearchTerm] = useState("");
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({
    CTG0291_2: true,
  });

  // Route guards: Admin -> /admin, Rider -> /delivery/dashboard, Pending Seller -> /seller/pending-approval
  useEffect(() => {
    if (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") {
      router.replace("/admin");
    } else if (user?.role === "DELIVERY_AGENT") {
      router.replace("/delivery/dashboard");
    } else if (user?.role === "SELLER") {
      getMySellerProfile()
        .then((profile) => {
          if (!profile || profile.status !== "approved") {
            router.replace("/seller/pending-approval");
          }
        })
        .catch(() => {
          router.replace("/seller/pending-approval");
        });
    }
  }, [user, router]);

  const activeRole = selectedRole || user?.role || "SELLER";

  // Product showcase carousel data
  const showcaseProducts = [
    {
      id: "p1",
      name: "T-shirt Rainbow White",
      sold: 271,
      color: "bg-white",
      tag: "Best Seller",
      badgeColor: "bg-blue-100 text-blue-700",
      svgTheme: "shirt-white",
    },
    {
      id: "p2",
      name: "Minimalist Black Cap",
      sold: 194,
      color: "bg-slate-900",
      tag: "Trending",
      badgeColor: "bg-emerald-100 text-emerald-700",
      svgTheme: "cap-black",
    },
    {
      id: "p3",
      name: "Oversized Cotton Hoodie",
      sold: 156,
      color: "bg-amber-100",
      tag: "Popular",
      badgeColor: "bg-amber-100 text-amber-700",
      svgTheme: "hoodie-gold",
    },
  ];

  const currentShowcase = showcaseProducts[carouselIndex];

  const nextShowcase = () => {
    setCarouselIndex((prev) => (prev + 1) % showcaseProducts.length);
  };

  const prevShowcase = () => {
    setCarouselIndex((prev) => (prev - 1 + showcaseProducts.length) % showcaseProducts.length);
  };

  // Transactions list
  const transactions = [
    {
      id: "CTG0291_1",
      orderId: "CTG0291",
      item: "Crop top pants",
      date: "12/02/2026",
      price: "$599",
      platform: "Shopee",
      platformStyle: "bg-orange-50 text-orange-600 border-orange-200",
    },
    {
      id: "CTG0291_2",
      orderId: "CTG0291",
      item: "T-shirt rainbow white",
      date: "12/02/2026",
      price: "$49",
      platform: "Tokopedia",
      platformStyle: "bg-emerald-50 text-emerald-600 border-emerald-200",
    },
    {
      id: "CTG0291_3",
      orderId: "CTG0291",
      item: "Huzzle black cap",
      date: "12/02/2026",
      price: "$109",
      platform: "Tokopedia",
      platformStyle: "bg-emerald-50 text-emerald-600 border-emerald-200",
    },
    {
      id: "CTG0291_4",
      orderId: "CTG0291",
      item: "Crop top pants",
      date: "12/02/2026",
      price: "$666",
      platform: "Shopee",
      platformStyle: "bg-orange-50 text-orange-600 border-orange-200",
    },
    {
      id: "CTG0291_5",
      orderId: "CTG0291",
      item: "Crop top pants",
      date: "12/02/2026",
      price: "$239",
      platform: "Tiktok",
      platformStyle: "bg-slate-100 text-slate-800 border-slate-300",
    },
  ];

  const filteredTransactions = transactions.filter(
    (t) =>
      t.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.platform.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleRow = (id: string) => {
    setSelectedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Role-specific stats
  const statCards = useMemo(() => {
    if (activeRole === "ADMIN" || activeRole === "SUPER_ADMIN") {
      return [
        {
          label: "Active Stores",
          value: "34",
          trend: "+4.2%",
          positive: true,
          icon: Store,
        },
        {
          label: "Platform Orders",
          value: "1,240",
          trend: "+8.1%",
          positive: true,
          icon: CheckSquare,
        },
        {
          label: "Canceled Dispatches",
          value: "8",
          trend: "-2.4%",
          positive: false,
          icon: XSquare,
        },
        {
          label: "Active Couriers",
          value: "52",
          trend: "+12.0%",
          positive: true,
          icon: Truck,
        },
      ];
    }

    if (activeRole === "DELIVERY_AGENT") {
      return [
        {
          label: "Assigned Trips",
          value: "3",
          trend: "+100%",
          positive: true,
          icon: Package,
        },
        {
          label: "Completed Drops",
          value: "89",
          trend: "+14.5%",
          positive: true,
          icon: CheckSquare,
        },
        {
          label: "Failed Deliveries",
          value: "1",
          trend: "-50%",
          positive: false,
          icon: XSquare,
        },
        {
          label: "On-Time Rate",
          value: "98.5%",
          trend: "+1.2%",
          positive: true,
          icon: TrendingUp,
        },
      ];
    }

    if (activeRole === "CUSTOMER") {
      return [
        {
          label: "Active Orders",
          value: "2",
          trend: "In transit",
          positive: true,
          icon: Package,
        },
        {
          label: "Delivered Items",
          value: "18",
          trend: "Verified",
          positive: true,
          icon: CheckSquare,
        },
        {
          label: "Saved Wishlist",
          value: "7",
          trend: "Available",
          positive: true,
          icon: Sparkles,
        },
        {
          label: "Total Spent",
          value: "$1,420",
          trend: "+5.1%",
          positive: true,
          icon: TrendingUp,
        },
      ];
    }

    // Default SELLER
    return [
      {
        label: "Total products",
        value: "250",
        trend: "+2.5%",
        positive: true,
        icon: Package,
      },
      {
        label: "Completed order",
        value: "124",
        trend: "+2.5%",
        positive: true,
        icon: CheckSquare,
      },
      {
        label: "Canceled order",
        value: "14",
        trend: "-1.5%",
        positive: false,
        icon: XSquare,
      },
      {
        label: "Top products",
        value: "119",
        trend: "+2.5%",
        positive: true,
        icon: TrendingUp,
      },
    ];
  }, [activeRole]);

  return (
    <DashboardShell activeRole={activeRole} onRoleChange={(r) => setSelectedRole(r)}>
      {/* ======================================================== */}
      {/* 1. TOP STAT CARDS (4 Column Grid)                        */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white p-5 rounded-3xl border border-[#D1E7D8] shadow-2xs hover:shadow-md transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              {/* Square Icon Badge matching reference in forest dark */}
              <div className="w-12 h-12 rounded-2xl bg-[#0A504A] text-white flex items-center justify-center shrink-0 shadow-sm">
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#0A504A]/70 mb-1">{stat.label}</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-[#0A504A] tracking-tight">
                    {stat.value}
                  </span>
                  <span
                    className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      stat.positive
                        ? "bg-[#E8F8EE] text-[#00A86B] border border-[#A2E4B8]"
                        : "bg-rose-50 text-rose-600 border border-rose-200/60"
                    }`}
                  >
                    {stat.trend}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ======================================================== */}
      {/* 2. SALES REPORT / ACTIVITY CHART (Center Big Card)       */}
      {/* ======================================================== */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#D1E7D8] shadow-2xs space-y-6">
        {/* Header with Title, Big Value & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-[#0A504A] tracking-tight">
              {activeRole === "ADMIN"
                ? "Platform Revenue & GMV Report"
                : activeRole === "DELIVERY_AGENT"
                ? "Delivery Mileage & Earnings"
                : activeRole === "CUSTOMER"
                ? "Personal Shopping & Savings"
                : "Your sales report"}
            </h2>
            <p className="text-xs text-[#0A504A]/70 font-medium">
              {activeRole === "ADMIN" ? "Platform-wide volume" : "Look at your activity"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Range Selector Pills matching reference in emerald & mint */}
            <div className="flex items-center p-1 bg-[#E8F8EE] rounded-2xl border border-[#D1E7D8] text-xs font-semibold text-slate-500">
              {["1d", "7d", "30d", "16m", "Max"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setTimeRange(r)}
                  className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
                    timeRange === r
                      ? "bg-[#0A504A] text-white font-bold shadow-xs"
                      : "hover:text-[#0A504A] text-slate-600"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Dropdown Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white border border-[#D1E7D8] text-xs font-bold text-[#0A504A] shadow-2xs">
              <span>Total Sales</span>
              <span className="text-[#00A86B]">▾</span>
            </div>
          </div>
        </div>

        {/* Big Bold Figure Display */}
        <div className="flex items-baseline gap-3">
          <span className="text-3xl sm:text-4xl font-extrabold text-[#0A504A] tracking-tight">
            {activeRole === "ADMIN"
              ? "$84,435.70"
              : activeRole === "DELIVERY_AGENT"
              ? "$1,420.00"
              : "$4,435.70"}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#00A86B] bg-[#E8F8EE] px-2.5 py-0.5 rounded-full border border-[#A2E4B8]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00A86B]" />
            <span>+$2,330.00 (+2.5%)</span>
          </span>
        </div>

        {/* Recharts Dual-Line Bezier Graph with Emerald Canopy Palette */}
        <div className="h-64 sm:h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={SALES_TIMESERIES} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8F8EE" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="#0A504A"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                dataKey="sales"
                stroke="#0A504A"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[#0A504A] text-white px-4 py-2.5 rounded-2xl shadow-xl border border-[#00A86B] text-xs">
                        <p className="font-bold text-white mb-1">14 Aug 2026</p>
                        <div className="space-y-0.5 text-[11px] text-[#A2E4B8]">
                          <p>{data.transactions} Transactions</p>
                          <p>{data.orders} Products Sold</p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {/* Primary Line: Vibrant Emerald #00A86B */}
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#00A86B"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: "#00A86B", stroke: "#ffffff", strokeWidth: 3 }}
              />
              {/* Secondary Line: Soft Mint #A2E4B8 */}
              <Line
                type="monotone"
                dataKey="transactions"
                stroke="#A2E4B8"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. BOTTOM SPLIT GRID (Transactions Table & Showcase)     */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* LEFT COLUMN: Last Transaction Table (8 Cols ~ 65%) */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-7 rounded-3xl border border-[#D1E7D8] shadow-2xs space-y-5">
          {/* Table Header with Search & Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-[#0A504A] tracking-tight">Last transaction</h3>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#00A86B] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-[#D1E7D8] rounded-xl text-[#0A504A] placeholder:text-[#0A504A]/50 focus:outline-none focus:border-[#00A86B] w-44 transition-all"
                />
              </div>

              <button
                type="button"
                className="w-8 h-8 rounded-xl bg-[#E8F8EE] hover:bg-[#D1E7D8] border border-[#D1E7D8] flex items-center justify-center text-[#0A504A] transition-colors shadow-2xs cursor-pointer"
                title="Filter Transactions"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Transactions Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-[11px] font-bold text-[#0A504A]/70 border-b border-[#D1E7D8] pb-2">
                  <th className="pb-3 w-8">
                    <input
                      type="checkbox"
                      className="rounded text-[#00A86B] focus:ring-[#A2E4B8] cursor-pointer"
                    />
                  </th>
                  <th className="pb-3 font-semibold">Order ID</th>
                  <th className="pb-3 font-semibold">Item</th>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Price</th>
                  <th className="pb-3 font-semibold">Platform</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8F8EE]">
                {filteredTransactions.map((tx) => {
                  const isChecked = Boolean(selectedRows[tx.id]);

                  return (
                    <tr
                      key={tx.id}
                      className={`hover:bg-[#E8F8EE]/60 transition-colors ${
                        isChecked ? "bg-[#E8F8EE]" : ""
                      }`}
                    >
                      <td className="py-3.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleRow(tx.id)}
                          className="rounded text-[#00A86B] focus:ring-[#A2E4B8] cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 font-bold text-[#0A504A]">{tx.orderId}</td>
                      <td className="py-3.5 font-medium text-slate-700">{tx.item}</td>
                      <td className="py-3.5 text-[#0A504A]/70 font-medium">{tx.date}</td>
                      <td className="py-3.5 font-extrabold text-[#0A504A]">{tx.price}</td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          {tx.platform === "Shopee" && <ShopeeLogo />}
                          {tx.platform === "Tokopedia" && <TokopediaLogo />}
                          {tx.platform === "Tiktok" && <TiktokLogo />}
                          <span className="font-semibold text-[#0A504A] text-xs">{tx.platform}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: "Congratulations! 🌟" Product Showcase (4 Cols ~ 35%) */}
        <div className="lg:col-span-4 bg-white p-6 sm:p-7 rounded-3xl border border-[#D1E7D8] shadow-2xs flex flex-col justify-between relative overflow-hidden">
          {/* Header & Subtitle */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-black text-[#0A504A] tracking-tight flex items-center gap-1.5">
                <span>Congratulations!</span>
                <span>🎉</span>
              </h3>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={prevShowcase}
                  className="w-6 h-6 rounded-full bg-[#E8F8EE] hover:bg-[#D1E7D8] text-[#0A504A] flex items-center justify-center text-xs transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={nextShowcase}
                  className="w-6 h-6 rounded-full bg-[#E8F8EE] hover:bg-[#D1E7D8] text-[#0A504A] flex items-center justify-center text-xs transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <p className="text-xs text-[#0A504A]/70 font-medium">
              Some of your products already have the highest buyers
            </p>
          </div>

          {/* Product Centerpiece Visual matching reference */}
          <div className="my-6 relative flex items-center justify-center">
            {/* Background layered mock cards in palette tones */}
            <div className="absolute -left-2 w-20 h-28 rounded-2xl bg-[#0A504A] opacity-80 rotate-[-8deg] shadow-md pointer-events-none" />
            <div className="absolute -right-2 w-20 h-28 rounded-2xl bg-[#A2E4B8] opacity-80 rotate-[8deg] shadow-md pointer-events-none" />

            {/* Foreground Main Showcase Card */}
            <div className="w-36 h-44 rounded-3xl bg-white border border-[#D1E7D8] shadow-xl p-3 flex flex-col items-center justify-center relative z-10 animate-in fade-in zoom-in-95">
              {/* Product SVG Graphic */}
              <div className="w-24 h-24 rounded-2xl bg-slate-50 border border-[#D1E7D8] flex items-center justify-center mb-2">
                <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-sm">
                  {/* T-Shirt Vector Mockup */}
                  <path
                    d="M 30,20 L 40,30 Q 50,35 60,30 L 70,20 L 90,35 L 80,50 L 70,45 L 70,85 L 30,85 L 30,45 L 20,50 L 10,35 Z"
                    fill="#ffffff"
                    stroke="#0A504A"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M 40,48 Q 50,42 60,48"
                    fill="none"
                    stroke="#00A86B"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#E8F8EE] text-[#0A504A] mb-1">
                {currentShowcase.tag}
              </span>
            </div>
          </div>

          {/* Bottom Showcase Caption */}
          <div className="text-center pt-2 border-t border-[#D1E7D8]">
            <h4 className="text-xs font-black text-[#0A504A] tracking-tight">
              {currentShowcase.name}
            </h4>
            <p className="text-[11px] font-semibold text-[#0A504A]/70 mt-0.5">
              {currentShowcase.sold} sold
            </p>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
