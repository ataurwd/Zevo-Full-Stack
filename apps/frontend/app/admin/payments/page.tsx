"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
  ShieldCheck,
  ExternalLink,
  DollarSign,
  ArrowUpRight,
  Filter,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { getAdminAllPayments, PaymentItem } from "@/lib/api/payments";
import { getAccessToken } from "@/lib/api/client";

const PAYMENT_TABS = [
  { id: "all", label: "All Transactions" },
  { id: "pending", label: "Pending Escrow" },
  { id: "succeeded", label: "Successful" },
  { id: "failed", label: "Failed" },
  { id: "refunded", label: "Refunded" },
];

export default function AdminPaymentsPage() {
  const router = useRouter();
  const params = useParams();
  const slug = (params?.slug as string[]) || [];
  const routeTab = slug[0] || "all";

  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState(routeTab);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadPayments = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await getAdminAllPayments({
        status: activeTab === "all" ? undefined : activeTab,
      });
      setPayments(res.payments || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load payments from database");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push("/login?redirect=/admin/payments");
      return;
    }
    loadPayments();
  }, [router, activeTab]);

  const filteredTxs = payments.filter((tx) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const matchIntent = tx.stripe_payment_intent_id?.toLowerCase().includes(q);
    const matchOrder = tx.order_id?.toLowerCase().includes(q);
    const matchStatus = tx.status?.toLowerCase().includes(q);
    return matchIntent || matchOrder || matchStatus;
  });

  // Real-time KPIs calculated from real database records
  const grossVolumeCents = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingEscrowCents = payments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const platformCutCents = Math.round(grossVolumeCents * 0.1); // 10% platform commission rate

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F8EE] border border-[#A2E4B8]/30 text-[#0A504A] text-[11px] font-bold uppercase tracking-wider mb-2">
            <CreditCard className="w-3.5 h-3.5 text-[#00A86B]" />
            <span>Real-Time Gateway & Ledger Management</span>
            <span className="w-2 h-2 rounded-full bg-[#00A86B] animate-pulse"></span>
          </div>
          <h1 className="text-3xl font-serif font-black text-[#0A504A] tracking-tight">
            Payments & Settlements
          </h1>
          <p className="text-xs text-[#0A504A]/70 mt-1">
            Real-time Stripe customer escrow transactions, platform commissions, and payment ledgers. Total: {total} transactions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadPayments}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00A86B] text-white text-xs font-bold shadow-sm hover:bg-[#0A504A] transition disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>{isLoading ? "Syncing..." : "Sync Gateway Ledger"}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* KPI Cards (Live Real-Time Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#0A504A]/70">Gross Transaction Volume</span>
          <div className="text-2xl font-serif font-black text-[#0A504A] mt-1.5">
            ${(grossVolumeCents / 100).toFixed(2)}
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold mt-1 inline-block">Real-time ledger total</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#0A504A]/70">Active Escrow Held</span>
          <div className="text-2xl font-serif font-black text-[#00A86B] mt-1.5">
            ${(pendingEscrowCents / 100).toFixed(2)}
          </div>
          <span className="text-[10px] text-[#0A504A]/70 mt-1 inline-block">Disbursed upon delivery confirmation</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#0A504A]/70">Estimated Platform Cut</span>
          <div className="text-2xl font-serif font-black text-[#0A504A] mt-1.5">
            ${(platformCutCents / 100).toFixed(2)}
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold mt-1 inline-block">Standard 10% platform take rate</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#0A504A]/70">Processed Records</span>
          <div className="text-2xl font-serif font-black text-[#0A504A] mt-1.5">{total}</div>
          <span className="text-[10px] text-[#0A504A]/70 mt-1 inline-block">Total orders authenticated</span>
        </div>
      </div>

      {/* Navigation Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D1E7D8] pb-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          {PAYMENT_TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
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

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#0A504A]/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by PaymentIntent ID, order..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A] placeholder:text-[#0A504A]/70/50 focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-[#00A86B]"></div>
            <p className="text-xs font-semibold text-gray-500">Loading live payments from gateway...</p>
          </div>
        ) : filteredTxs.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#00A86B] flex items-center justify-center mx-auto mb-3 border border-[#D1E7D8]">
              <CreditCard className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-gray-900">No payment transactions found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              No transactions match this filter. Live Stripe authorizations and escrow intents will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#E8F8EE]/60 text-[#0A504A] font-bold border-b border-[#D1E7D8]">
                <tr>
                  <th className="px-5 py-3.5">Stripe Payment Intent ID</th>
                  <th className="px-5 py-3.5">Order Reference</th>
                  <th className="px-5 py-3.5">Gross Amount</th>
                  <th className="px-5 py-3.5">Gateway & Escrow</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Transaction Date</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1E7D8]">
                {filteredTxs.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#E8F8EE]/30 transition">
                    <td className="px-5 py-4 font-mono font-bold text-[#0A504A]">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5 text-[#00A86B]" />
                        <span className="truncate max-w-[220px]" title={tx.stripe_payment_intent_id}>
                          {tx.stripe_payment_intent_id}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/orders/${tx.order_id}`}
                        className="font-mono text-[#00A86B] font-bold hover:underline flex items-center gap-1"
                      >
                        <span>View Order</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-[#0A504A]">
                      ${(tx.amount / 100).toFixed(2)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-[#0A504A] border border-[#A2E4B8] text-[10px] font-bold">
                        <ShieldCheck className="w-3 h-3 text-[#00A86B]" />
                        Stripe Escrow
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                          tx.status === "succeeded"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : tx.status === "pending"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : tx.status === "refunded"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[#0A504A]/70 font-mono text-[11px]">
                      {new Date(tx.created_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/orders/${tx.order_id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#E8F8EE] text-[#00A86B] hover:bg-[#00A86B] hover:text-white font-bold text-[11px] transition"
                      >
                        <span>Audit</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
