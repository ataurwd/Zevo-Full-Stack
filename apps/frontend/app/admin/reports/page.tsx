"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Store,
  Truck,
  Layers,
  ArrowUpRight,
} from "lucide-react";

const REPORT_TABS = [
  { id: "sales", label: "Sales & GMV" },
  { id: "orders", label: "Orders & SLA" },
  { id: "products", label: "Product Velocity" },
  { id: "sellers", label: "Seller Performance" },
  { id: "customers", label: "Customer Cohorts" },
  { id: "delivery", label: "Fleet Logistics" },
  { id: "financial", label: "Financial & Tax" },
];

export default function AdminReportsPage() {
  const params = useParams();
  const slug = (params?.slug as string[]) || [];
  const routeTab = slug[0] || "sales";

  const [activeTab, setActiveTab] = useState(routeTab);
  const [dateRange, setDateRange] = useState("last_30_days");
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleExportCSV = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    }, 1200);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F8EE] border border-[#A2E4B8]/30 text-[#0A504A] text-[11px] font-bold uppercase tracking-wider mb-2">
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#00A86B]" />
            <span>18. Business Intelligence & Compliance Exports</span>
          </div>
          <h1 className="text-3xl font-serif font-black text-[#0A504A] tracking-tight">
            Financial & Operational Reports
          </h1>
          <p className="text-xs text-[#0A504A]/70 mt-1">
            Export comprehensive tax reconciliations, vendor GMV statements, and delivery fulfillment compliance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#D1E7D8] text-xs font-semibold text-[#0A504A] focus:outline-hidden"
          >
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_30_days">Last 30 Days (Current Month)</option>
            <option value="last_quarter">Q3 2026</option>
            <option value="ytd">Year to Date (2026)</option>
          </select>

          <button
            onClick={handleExportCSV}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00A86B] text-white text-xs font-bold shadow-sm hover:bg-[#0A504A] transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? "Generating CSV..." : "Export CSV"}</span>
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Report generated and downloaded successfully. (zevo_{activeTab}_report_2026.csv)</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#D1E7D8] scrollbar-none">
        {REPORT_TABS.map((tab) => {
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

      {/* Tab Content Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs space-y-2">
          <span className="text-[11px] font-bold text-[#0A504A]/70 uppercase tracking-wider">Gross Platform Volume</span>
          <div className="text-3xl font-serif font-black text-[#0A504A]">$284,920.50</div>
          <p className="text-[11px] text-emerald-600 font-semibold">↑ +14.2% compared to prior month</p>
          <div className="pt-3 border-t border-[#D1E7D8] flex justify-between text-xs text-[#0A504A]">
            <span>Platform Cut:</span>
            <strong className="text-[#00A86B]">$24,218.24</strong>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs space-y-2">
          <span className="text-[11px] font-bold text-[#0A504A]/70 uppercase tracking-wider">Completed Transactions</span>
          <div className="text-3xl font-serif font-black text-[#00A86B]">3,842 Orders</div>
          <p className="text-[11px] text-[#0A504A]/70">Average order basket size: $74.15</p>
          <div className="pt-3 border-t border-[#D1E7D8] flex justify-between text-xs text-[#0A504A]">
            <span>Refund Volume:</span>
            <strong className="text-rose-600">$1,196.60 (0.42%)</strong>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs space-y-2">
          <span className="text-[11px] font-bold text-[#0A504A]/70 uppercase tracking-wider">Active Marketplace Vendors</span>
          <div className="text-3xl font-serif font-black text-[#0A504A]">48 Stores</div>
          <p className="text-[11px] text-[#0A504A]/70">Top 10% stores drive 62% of platform volume</p>
          <div className="pt-3 border-t border-[#D1E7D8] flex justify-between text-xs text-[#0A504A]">
            <span>Top Performing:</span>
            <strong className="text-[#00A86B]">Lunora Atelier</strong>
          </div>
        </div>
      </div>

      {/* Detailed Ledger Preview */}
      <div className="rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#0A504A] capitalize">{activeTab} Ledger Summary</h3>
            <p className="text-xs text-[#0A504A]/70">Data points verified against immutable SQL transaction logs.</p>
          </div>
          <span className="text-xs font-semibold text-[#00A86B] px-3 py-1 rounded-lg bg-[#E8F8EE]">
            Format: CSV / XLSX / PDF
          </span>
        </div>

        <div className="divide-y divide-[#D1E7D8]/60">
          {[
            { metric: "Gross Merchandise Value (GMV)", val: "$284,920.50", change: "+14.2%" },
            { metric: "Net Merchant Disbursements", val: "$250,702.26", change: "+13.9%" },
            { metric: "Zevo Marketplace Commissions", val: "$24,218.24", change: "+18.1%" },
            { metric: "Estimated Stripe Gateway Processing Fees", val: "$7,412.30", change: "+14.0%" },
            { metric: "Hyperlocal Delivery Surcharges Collected", val: "$8,940.00", change: "+9.8%" },
            { metric: "Total Sales Tax (Remitted)", val: "$22,793.64", change: "+14.2%" },
          ].map((row, i) => (
            <div key={i} className="py-3 flex items-center justify-between text-xs hover:bg-[#E8F8EE]/30 px-2 rounded-lg transition">
              <span className="font-semibold text-[#0A504A]">{row.metric}</span>
              <div className="flex items-center gap-4">
                <span className="font-mono font-bold text-[#0A504A]">{row.val}</span>
                <span className="text-emerald-600 font-semibold text-[11px] w-14 text-right">{row.change}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
