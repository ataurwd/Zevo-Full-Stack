"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Tag,
  Plus,
  Percent,
  CheckCircle2,
  Clock,
  Calendar,
  Search,
  Sparkles,
  DollarSign,
  Flame,
  ArrowUpRight,
} from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  type: "PERCENT" | "FIXED";
  discount: number;
  minSpend: number;
  usageCount: number;
  maxUsage: number;
  expiry: string;
  status: "active" | "expired" | "scheduled";
}

const DEMO_COUPONS: Coupon[] = [
  {
    id: "cpn-1",
    code: "NEXORA20",
    type: "PERCENT",
    discount: 20,
    minSpend: 50,
    usageCount: 412,
    maxUsage: 1000,
    expiry: "2026-10-31",
    status: "active",
  },
  {
    id: "cpn-2",
    code: "WELCOME10",
    type: "FIXED",
    discount: 10,
    minSpend: 30,
    usageCount: 890,
    maxUsage: 1500,
    expiry: "2026-12-31",
    status: "active",
  },
  {
    id: "cpn-3",
    code: "AUTUMNFLASH",
    type: "PERCENT",
    discount: 35,
    minSpend: 100,
    usageCount: 500,
    maxUsage: 500,
    expiry: "2026-09-01",
    status: "expired",
  },
  {
    id: "cpn-4",
    code: "WINTERVOGUE",
    type: "PERCENT",
    discount: 25,
    minSpend: 80,
    usageCount: 0,
    maxUsage: 750,
    expiry: "2026-12-01",
    status: "scheduled",
  },
];

const COUPON_TABS = [
  { id: "all", label: "All Coupons" },
  { id: "create", label: "Create Coupon" },
  { id: "promotions", label: "Flash Sales & Promos" },
];

export default function AdminCouponsPage() {
  const params = useParams();
  const slug = (params?.slug as string[]) || [];
  const routeTab = slug[0] || "all";

  const [activeTab, setActiveTab] = useState(routeTab);
  const [coupons, setCoupons] = useState<Coupon[]>(DEMO_COUPONS);
  const [search, setSearch] = useState("");

  // Create coupon form
  const [newCode, setNewCode] = useState("");
  const [newDiscount, setNewDiscount] = useState("15");
  const [newType, setNewType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [newMinSpend, setNewMinSpend] = useState("40");
  const [newMaxUsage, setNewMaxUsage] = useState("500");
  const [newExpiry, setNewExpiry] = useState("2026-11-30");
  const [createdNotice, setCreatedNotice] = useState(false);

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;

    const newCpn: Coupon = {
      id: `cpn-${Date.now()}`,
      code: newCode.trim().toUpperCase(),
      type: newType,
      discount: parseFloat(newDiscount) || 10,
      minSpend: parseFloat(newMinSpend) || 0,
      usageCount: 0,
      maxUsage: parseInt(newMaxUsage) || 100,
      expiry: newExpiry,
      status: "active",
    };

    setCoupons([newCpn, ...coupons]);
    setNewCode("");
    setCreatedNotice(true);
    setTimeout(() => {
      setCreatedNotice(false);
      setActiveTab("all");
    }, 1500);
  };

  const filteredCoupons = coupons.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F8EE] border border-[#A2E4B8]/30 text-[#0A504A] text-[11px] font-bold uppercase tracking-wider mb-2">
            <Tag className="w-3.5 h-3.5 text-[#00A86B]" />
            <span>15. Promotional Discounts & Campaigns</span>
          </div>
          <h1 className="text-3xl font-serif font-black text-[#0A504A] tracking-tight">
            Coupons & Flash Sales
          </h1>
          <p className="text-xs text-[#0A504A]/70 mt-1">
            Build discount promo codes, configure minimum basket thresholds, and launch seasonal flash sales.
          </p>
        </div>

        <button
          onClick={() => setActiveTab("create")}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00A86B] text-white text-xs font-bold shadow-sm hover:bg-[#0A504A] transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Promo Code</span>
        </button>
      </div>

      {createdNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>New promo code published and active across the checkout engine!</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#0A504A]/70">Active Coupons</span>
          <div className="text-2xl font-serif font-black text-[#0A504A] mt-1.5">
            {coupons.filter((c) => c.status === "active").length} Codes
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold mt-1 inline-block">Generating 24% basket lift</span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#0A504A]/70">Total Redemptions</span>
          <div className="text-2xl font-serif font-black text-[#00A86B] mt-1.5">1,802 Uses</div>
          <span className="text-[10px] text-[#0A504A]/70 mt-1 inline-block">Across all registered shoppers</span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#0A504A]/70">Discount Value Absorbed</span>
          <div className="text-2xl font-serif font-black text-[#0A504A] mt-1.5">$18,420.00</div>
          <span className="text-[10px] text-[#0A504A]/70 mt-1 inline-block">Split 50/50 platform & vendors</span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#0A504A]/70">Campaign Conversion</span>
          <div className="text-2xl font-serif font-black text-emerald-600 mt-1.5">8.9%</div>
          <span className="text-[10px] text-[#0A504A]/70 mt-1 inline-block">Checkout completed with voucher</span>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D1E7D8] pb-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          {COUPON_TABS.map((tab) => {
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

        {activeTab === "all" && (
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#0A504A]/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search coupon code..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A] placeholder:text-[#0A504A]/70/50 focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20"
            />
          </div>
        )}
      </div>

      {/* Tab 1: Coupons Table */}
      {activeTab === "all" && (
        <div className="rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#E8F8EE]/60 text-[#0A504A] font-bold border-b border-[#D1E7D8]">
                <tr>
                  <th className="px-5 py-3.5">Voucher Code</th>
                  <th className="px-5 py-3.5">Discount Benefit</th>
                  <th className="px-5 py-3.5">Min Basket Spend</th>
                  <th className="px-5 py-3.5">Redemption Usage</th>
                  <th className="px-5 py-3.5">Expiry Date</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1E7D8]/60">
                {filteredCoupons.map((cpn) => (
                  <tr key={cpn.id} className="hover:bg-[#E8F8EE]/40 transition">
                    <td className="px-5 py-4 font-mono font-bold text-sm text-[#0A504A]">{cpn.code}</td>
                    <td className="px-5 py-4 font-bold text-[#00A86B]">
                      {cpn.type === "PERCENT" ? `${cpn.discount}% OFF` : `$${cpn.discount} OFF`}
                    </td>
                    <td className="px-5 py-4 text-[#0A504A] font-medium">${cpn.minSpend.toFixed(2)}</td>
                    <td className="px-5 py-4 text-[#0A504A]">
                      <div className="font-semibold">
                        {cpn.usageCount} / {cpn.maxUsage}
                      </div>
                      <div className="w-24 h-1.5 rounded-full bg-[#E8F8EE] mt-1 overflow-hidden">
                        <div
                          className="h-full bg-[#00A86B] rounded-full"
                          style={{ width: `${(cpn.usageCount / cpn.maxUsage) * 100}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[#0A504A]/70 font-mono">{cpn.expiry}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          cpn.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : cpn.status === "scheduled"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {cpn.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button className="text-xs font-semibold text-[#00A86B] hover:underline">
                        Edit Voucher
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Create Coupon Form */}
      {activeTab === "create" && (
        <form
          onSubmit={handleCreateCoupon}
          className="rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs p-6 max-w-2xl space-y-5"
        >
          <h3 className="text-base font-bold text-[#0A504A]">Provision New Promo Voucher</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0A504A] mb-1">Coupon Code</label>
              <input
                type="text"
                required
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="e.g. FLASH25"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#E8F8EE]/40 border border-[#D1E7D8] font-mono font-bold text-xs text-[#0A504A] focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A504A] mb-1">Discount Type</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#E8F8EE]/40 border border-[#D1E7D8] text-xs font-semibold text-[#0A504A] focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20"
              >
                <option value="PERCENT">Percentage Discount (%)</option>
                <option value="FIXED">Fixed Amount Discount ($)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A504A] mb-1">Discount Amount</label>
              <input
                type="number"
                required
                value={newDiscount}
                onChange={(e) => setNewDiscount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#E8F8EE]/40 border border-[#D1E7D8] text-xs font-bold text-[#0A504A] focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A504A] mb-1">Minimum Basket Spend ($)</label>
              <input
                type="number"
                value={newMinSpend}
                onChange={(e) => setNewMinSpend(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#E8F8EE]/40 border border-[#D1E7D8] text-xs font-bold text-[#0A504A] focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A504A] mb-1">Max Redemptions Allowed</label>
              <input
                type="number"
                value={newMaxUsage}
                onChange={(e) => setNewMaxUsage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#E8F8EE]/40 border border-[#D1E7D8] text-xs font-bold text-[#0A504A] focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A504A] mb-1">Expiration Date</label>
              <input
                type="date"
                value={newExpiry}
                onChange={(e) => setNewExpiry(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#E8F8EE]/40 border border-[#D1E7D8] text-xs font-bold text-[#0A504A] focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#00A86B] text-white text-xs font-bold shadow-sm hover:bg-[#0A504A] transition"
            >
              Publish Coupon
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#0A504A]/70 hover:bg-[#E8F8EE]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Flash Sales & Promos */}
      {activeTab === "promotions" && (
        <div className="rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#0A504A]">Seasonal Marketplace Campaigns</h3>
              <p className="text-xs text-[#0A504A]/70">Hero banner takeovers and sitewide flash sales.</p>
            </div>
            <button className="px-4 py-2 rounded-xl bg-[#00A86B] text-white text-xs font-bold hover:bg-[#0A504A] transition">
              New Campaign
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-5 rounded-2xl bg-[#E8F8EE]/60 border border-[#D1E7D8] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    Live Flash Sale
                  </span>
                  <Flame className="w-4 h-4 text-amber-600" />
                </div>
                <h4 className="text-base font-bold text-[#0A504A]">Autumn Luxury Edit 2026</h4>
                <p className="text-xs text-[#0A504A]/70 mt-1">Up to 35% discount across curated atelier blazer & coat collections.</p>
              </div>
              <div className="text-[11px] text-[#0A504A] font-semibold mt-4">
                Ends in: <strong>2 days, 14 hours</strong>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#E8F8EE]/60 border border-[#D1E7D8] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                    Scheduled
                  </span>
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <h4 className="text-base font-bold text-[#0A504A]">Black Friday Cyber Gala</h4>
                <p className="text-xs text-[#0A504A]/70 mt-1">Platform-wide promotion with tiered vendor rebate subsidies.</p>
              </div>
              <div className="text-[11px] text-[#0A504A] font-semibold mt-4">
                Launches: <strong>Nov 27, 2026</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
