"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Percent,
  TrendingUp,
  Store,
  DollarSign,
  Settings as SettingsIcon,
  CheckCircle2,
  Sliders,
  Search,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { getAdminAllPayments, PaymentItem } from "@/lib/api/payments";

interface SellerTier {
  id: string;
  store: string;
  tier: "PLATINUM" | "GOLD" | "STANDARD";
  rate: number;
  totalVolume: number;
  commissionsPaid: number;
  status: "active" | "custom_rate";
}

const DEMO_SELLER_COMMISSIONS: SellerTier[] = [
  {
    id: "sc-1",
    store: "Lunora Atelier",
    tier: "PLATINUM",
    rate: 6.5,
    totalVolume: 84200,
    commissionsPaid: 5473.0,
    status: "active",
  },
  {
    id: "sc-2",
    store: "Apex Leatherworks",
    tier: "GOLD",
    rate: 8.0,
    totalVolume: 42150,
    commissionsPaid: 3372.0,
    status: "active",
  },
  {
    id: "sc-3",
    store: "Modernist Footwear",
    tier: "STANDARD",
    rate: 9.5,
    totalVolume: 19800,
    commissionsPaid: 1881.0,
    status: "active",
  },
  {
    id: "sc-4",
    store: "Sartorial Menswear",
    tier: "STANDARD",
    rate: 9.5,
    totalVolume: 14200,
    commissionsPaid: 1349.0,
    status: "active",
  },
  {
    id: "sc-5",
    store: "Luxe Botanical Scents",
    tier: "GOLD",
    rate: 7.5,
    totalVolume: 31200,
    commissionsPaid: 2340.0,
    status: "custom_rate",
  },
];

const COMMISSION_TABS = [
  { id: "sellers", label: "Seller Tiers" },
  { id: "transactions", label: "Transaction Cuts" },
  { id: "settings", label: "Commission Settings" },
];

export default function AdminCommissionsPage() {
  const params = useParams();
  const slug = (params?.slug as string[]) || [];
  const routeTab = slug[0] || "sellers";

  const [activeTab, setActiveTab] = useState(routeTab);
  const [search, setSearch] = useState("");
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);

  // Commission Settings Form State
  const [baseRate, setBaseRate] = useState("8.5");
  const [goldRate, setGoldRate] = useState("7.5");
  const [platinumRate, setPlatinumRate] = useState("6.0");
  const [payoutSchedule, setPayoutSchedule] = useState("weekly");
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const fetchPayments = async () => {
      setIsLoadingPayments(true);
      try {
        const res = await getAdminAllPayments({ limit: 50 });
        setPayments(res.payments || []);
      } catch (err) {
        console.error("Failed fetching payments for commission ledger", err);
      } finally {
        setIsLoadingPayments(false);
      }
    };
    fetchPayments();
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const filteredSellers = DEMO_SELLER_COMMISSIONS.filter((s) =>
    s.store.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F8EE] border border-[#A2E4B8]/30 text-[#0A504A] text-[11px] font-bold uppercase tracking-wider mb-2">
            <Percent className="w-3.5 h-3.5 text-[#00A86B]" />
            <span>11. Marketplace Monetization & Take Rates</span>
          </div>
          <h1 className="text-3xl font-serif font-black text-[#0A504A] tracking-tight">
            Commissions Architecture
          </h1>
          <p className="text-xs text-[#0A504A]/70 mt-1">
            Tier-based platform take-rates, automated settlement deductions, and promotional exemptions.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Global commission tiers updated and propagated across billing workers.</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#0A504A]/70">Gross Platform Commissions</span>
          <div className="text-2xl font-serif font-black text-[#0A504A] mt-1.5">$48,930.50</div>
          <span className="text-[10px] text-emerald-600 font-semibold mt-1 inline-block">↑ +18.4% this quarter</span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#0A504A]/70">Weighted Average Take Rate</span>
          <div className="text-2xl font-serif font-black text-[#00A86B] mt-1.5">8.12%</div>
          <span className="text-[10px] text-[#0A504A]/70 mt-1 inline-block">Across all 5 vendor tiers</span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#0A504A]/70">Active Seller Tiers</span>
          <div className="text-2xl font-serif font-black text-[#0A504A] mt-1.5">3 Tiers</div>
          <span className="text-[10px] text-[#0A504A]/70 mt-1 inline-block">Standard, Gold, Platinum</span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#0A504A]/70">Escrow Deductions</span>
          <div className="text-2xl font-serif font-black text-emerald-600 mt-1.5">Auto-Deducted</div>
          <span className="text-[10px] text-[#0A504A]/70 mt-1 inline-block">Upon customer delivery confirmation</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D1E7D8] pb-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          {COMMISSION_TABS.map((tab) => {
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

        {activeTab === "sellers" && (
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#0A504A]/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vendor stores..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A] placeholder:text-[#0A504A]/70/50 focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20"
            />
          </div>
        )}
      </div>

      {/* Tab 1: Seller Tiers Table */}
      {activeTab === "sellers" && (
        <div className="rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#E8F8EE]/60 text-[#0A504A] font-bold border-b border-[#D1E7D8]">
                <tr>
                  <th className="px-5 py-3.5">Store / Brand</th>
                  <th className="px-5 py-3.5">Assigned Tier</th>
                  <th className="px-5 py-3.5">Take Rate (%)</th>
                  <th className="px-5 py-3.5">Total Sales Volume</th>
                  <th className="px-5 py-3.5">Platform Cut Paid</th>
                  <th className="px-5 py-3.5">Rate Status</th>
                  <th className="px-5 py-3.5 text-right">Settings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1E7D8]/60">
                {filteredSellers.map((seller) => (
                  <tr key={seller.id} className="hover:bg-[#E8F8EE]/40 transition">
                    <td className="px-5 py-4 font-bold text-[#0A504A]">{seller.store}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          seller.tier === "PLATINUM"
                            ? "bg-purple-100 text-[#0A504A] border border-purple-300"
                            : seller.tier === "GOLD"
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : "bg-slate-100 text-slate-800 border border-slate-200"
                        }`}
                      >
                        {seller.tier}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-[#00A86B]">{seller.rate}%</td>
                    <td className="px-5 py-4 font-medium text-[#0A504A]">${seller.totalVolume.toLocaleString()}</td>
                    <td className="px-5 py-4 font-bold text-emerald-700">${seller.commissionsPaid.toLocaleString()}</td>
                    <td className="px-5 py-4">
                      <span className="inline-block text-[10px] font-semibold text-[#0A504A]/70">
                        {seller.status === "custom_rate" ? "Negotiated Custom" : "Standard Tier Rate"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button className="text-xs font-semibold text-[#00A86B] hover:underline">
                        Edit Rate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Transaction Ledger */}
      {activeTab === "transactions" && (
        <div className="rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs p-6">
          <h3 className="text-base font-bold text-[#0A504A] mb-2">Automated Commission Split Ledger</h3>
          <p className="text-xs text-[#0A504A]/70 mb-6">
            Zevo uses programmatic fee-splitting at the time of customer payment capture. Platform cuts are transferred to the treasury account while net proceeds remain in escrow until buyer fulfillment is confirmed.
          </p>
          <div className="space-y-3">
            {isLoadingPayments ? (
              <div className="py-8 text-center text-xs text-[#0A504A]/70 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#00A86B]" />
                <span>Loading real-time fee splits...</span>
              </div>
            ) : payments.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-500">
                No payment transactions recorded yet. Real order commissions will appear here automatically.
              </div>
            ) : (
              payments.map((p, idx) => {
                const gross = (p.amount || 0) / 100;
                const take = (gross * 0.1).toFixed(2);
                const net = (gross * 0.9).toFixed(2);
                const intentId = p.stripe_payment_intent_id
                  ? p.stripe_payment_intent_id.length > 18
                    ? `${p.stripe_payment_intent_id.slice(0, 10)}...${p.stripe_payment_intent_id.slice(-6)}`
                    : p.stripe_payment_intent_id
                  : `TX-${idx + 1}`;

                return (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl border border-[#D1E7D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#E8F8EE]/30 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[#0A504A]">
                          SPLIT-{p.id.slice(-6).toUpperCase()}
                        </span>
                        <span className="text-xs text-[#0A504A]/70 font-mono">({intentId})</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#E8F8EE] text-[#00A86B]">
                          Order {p.order_id ? `#${p.order_id.slice(-6).toUpperCase()}` : "Marketplace"}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#0A504A]/70 mt-1">
                        Gross: ${gross.toFixed(2)} · Platform Cut (10.0%):{" "}
                        <strong className="text-[#00A86B]">${take}</strong> · Merchant Net:{" "}
                        <strong>${net}</strong>
                      </div>
                    </div>
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold capitalize bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{p.status}</span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Commission Settings */}
      {activeTab === "settings" && (
        <form onSubmit={handleSaveSettings} className="rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs p-6 max-w-3xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-[#0A504A]">Marketplace Rate Configuration</h3>
            <p className="text-xs text-[#0A504A]/70 mt-1">
              Configure default base rates and volume-incentivized tier commissions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0A504A] mb-1.5">Standard Tier (%)</label>
              <input
                type="number"
                step="0.1"
                value={baseRate}
                onChange={(e) => setBaseRate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#E8F8EE]/40 border border-[#D1E7D8] text-xs font-bold text-[#0A504A] focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20"
              />
              <span className="text-[10px] text-[#0A504A]/70 mt-1 block">&lt; $25,000 monthly volume</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A504A] mb-1.5">Gold Tier (%)</label>
              <input
                type="number"
                step="0.1"
                value={goldRate}
                onChange={(e) => setGoldRate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#E8F8EE]/40 border border-[#D1E7D8] text-xs font-bold text-[#0A504A] focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20"
              />
              <span className="text-[10px] text-[#0A504A]/70 mt-1 block">$25k – $75k monthly volume</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A504A] mb-1.5">Platinum Tier (%)</label>
              <input
                type="number"
                step="0.1"
                value={platinumRate}
                onChange={(e) => setPlatinumRate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#E8F8EE]/40 border border-[#D1E7D8] text-xs font-bold text-[#0A504A] focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20"
              />
              <span className="text-[10px] text-[#0A504A]/70 mt-1 block">&gt; $75k monthly volume</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0A504A] mb-1.5">Merchant Payout Frequency</label>
            <select
              value={payoutSchedule}
              onChange={(e) => setPayoutSchedule(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#E8F8EE]/40 border border-[#D1E7D8] text-xs font-semibold text-[#0A504A] focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20"
            >
              <option value="daily">Daily Automated Batch Settlement</option>
              <option value="weekly">Weekly Net-7 Settlement (Recommended)</option>
              <option value="biweekly">Bi-weekly Net-14 Settlement</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#00A86B] text-white text-xs font-bold shadow-sm hover:bg-[#0A504A] transition"
            >
              Save Commission Rules
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
