"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Box,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  Plus,
  ArrowRightLeft,
  Lock,
} from "lucide-react";

const DEMO_INVENTORY = [
  {
    sku: "LBB-BEIGE-XS",
    product: "Linen Blend Blazer",
    variant: "XS / Oat Beige",
    store: "Lunora Atelier",
    available: 48,
    reserved: 4,
    total: 52,
    threshold: 15,
    status: "IN_STOCK",
  },
  {
    sku: "LBB-BEIGE-S",
    product: "Linen Blend Blazer",
    variant: "S / Oat Beige",
    store: "Lunora Atelier",
    available: 8,
    reserved: 2,
    total: 10,
    threshold: 15,
    status: "LOW_STOCK",
  },
  {
    sku: "RKT-BLK-S",
    product: "Ribbed Knit Top",
    variant: "S / Noir Black",
    store: "Lunora Atelier",
    available: 95,
    reserved: 8,
    total: 103,
    threshold: 20,
    status: "IN_STOCK",
  },
  {
    sku: "LSB-BRN-STD",
    product: "Leather Shoulder Bag",
    variant: "Standard / Saddle Tan",
    store: "Apex Leatherworks",
    available: 0,
    reserved: 0,
    total: 0,
    threshold: 10,
    status: "OUT_OF_STOCK",
  },
  {
    sku: "MSH-BLK-38",
    product: "Minimal Strappy Heels",
    variant: "EU 38 / Black",
    store: "Modernist Footwear",
    available: 24,
    reserved: 1,
    total: 25,
    threshold: 10,
    status: "IN_STOCK",
  },
];

export default function AdminInventoryPage() {
  const params = useParams();
  const slug = (params?.slug as string[]) || [];
  const routeTab = slug[0] || "all";

  const [filterTab, setFilterTab] = useState(routeTab);
  const [search, setSearch] = useState("");
  const [adjustingSku, setAdjustingSku] = useState<string | null>(null);

  const filteredItems = DEMO_INVENTORY.filter((item) => {
    const matchTab =
      filterTab === "all" ||
      (filterTab === "low-stock" && item.status === "LOW_STOCK") ||
      (filterTab === "out-of-stock" && item.status === "OUT_OF_STOCK");
    const matchSearch =
      !search.trim() ||
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      item.product.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F8EE] border border-[#A2E4B8]/30 text-[#0A504A] text-[11px] font-bold uppercase tracking-wider mb-2">
            <Box className="w-3.5 h-3.5 text-[#00A86B]" />
            <span>08. Real-Time Stock & Two-Phase Locks</span>
          </div>
          <h1 className="text-3xl font-serif font-black text-[#0A504A] tracking-tight">
            Inventory & Warehouses
          </h1>
          <p className="text-xs text-[#0A504A]/70 mt-1">
            SKU variant stock levels, Redis 2-phase reservation locks, threshold alarms, and restock batches.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#0A504A]/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by SKU or title..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A] placeholder-[#A2E4B8]/60 focus:outline-none focus:border-[#00A86B]"
            />
          </div>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#D1E7D8] pb-2 overflow-x-auto">
        {[
          { key: "all", label: "All Inventory" },
          { key: "low-stock", label: "Low Stock Alarms (1)" },
          { key: "out-of-stock", label: "Out of Stock (1)" },
          { key: "transactions", label: "Two-Phase Lock Logs" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              filterTab === tab.key
                ? "bg-[#00A86B] text-white shadow-2xs"
                : "bg-white border border-[#D1E7D8] text-[#0A504A]/80 hover:bg-[#E8F8EE]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Inventory Table */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#D1E7D8] shadow-2xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#D1E7D8] text-[#0A504A]/70 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-3 pl-2">SKU Code</th>
                <th className="pb-3">Product & Variant</th>
                <th className="pb-3">Merchant Hub</th>
                <th className="pb-3 text-center">Available</th>
                <th className="pb-3 text-center">Locked (Hold)</th>
                <th className="pb-3 text-center">Total Stock</th>
                <th className="pb-3">Stock State</th>
                <th className="pb-3 pr-2 text-right">Adjustment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D1E7D8]/70">
              {filteredItems.map((item) => (
                <tr key={item.sku} className="hover:bg-[#E8F8EE]/40 transition-colors">
                  <td className="py-4 pl-2 font-mono font-bold text-[#0A504A]">
                    {item.sku}
                  </td>
                  <td className="py-4">
                    <span className="font-bold text-[#0A504A] block">{item.product}</span>
                    <span className="text-[11px] text-[#0A504A]/70">{item.variant}</span>
                  </td>
                  <td className="py-4 text-[#0A504A]/70">{item.store}</td>
                  <td className="py-4 text-center font-mono font-bold text-sm text-[#0A504A]">
                    {item.available}
                  </td>
                  <td className="py-4 text-center font-mono text-amber-600 font-bold">
                    <span className="inline-flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>{item.reserved}</span>
                    </span>
                  </td>
                  <td className="py-4 text-center font-mono font-bold text-[#0A504A]">
                    {item.total}
                  </td>
                  <td className="py-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        item.status === "IN_STOCK"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : item.status === "LOW_STOCK"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      {item.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-4 pr-2 text-right">
                    <button
                      onClick={() => setAdjustingSku(item.sku)}
                      className="px-3 py-1.5 rounded-lg bg-[#E8F8EE] hover:bg-[#E8F8EE] text-[#00A86B] font-bold text-[11px] transition-colors"
                    >
                      Adjust Stock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {adjustingSku && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#D1E7D8] shadow-2xl space-y-4">
            <h3 className="font-serif font-bold text-xl text-[#0A504A]">
              Adjust Stock Level
            </h3>
            <p className="text-xs text-[#0A504A]/70">
              Modify physical stock for SKU: <strong className="font-mono text-[#0A504A]">{adjustingSku}</strong>.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setAdjustingSku(null);
              }}
              className="space-y-3 pt-2"
            >
              <div>
                <label className="text-[11px] font-bold text-[#0A504A] uppercase block mb-1">
                  Adjustment Units (+ or -)
                </label>
                <input
                  type="number"
                  defaultValue={10}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A] focus:border-[#00A86B]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#0A504A] uppercase block mb-1">
                  Audit Reason
                </label>
                <select className="w-full px-3 py-2 rounded-xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A] focus:border-[#00A86B]">
                  <option>Restock shipment received</option>
                  <option>Damaged goods write-off</option>
                  <option>Audit discrepancy reconciliation</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustingSku(null)}
                  className="px-4 py-2 rounded-xl border border-[#D1E7D8] text-xs font-semibold text-[#0A504A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0A504A] hover:bg-[#00A86B] text-white text-xs font-bold"
                >
                  Commit Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
