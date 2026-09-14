"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  getSellerInventory,
  updateStock,
  setLowStockThreshold,
  getInventoryTransactions,
  InventoryItem,
  InventoryTransaction,
} from "../../../lib/api/inventory";
import {
  Package,
  AlertTriangle,
  ArrowUpDown,
  History,
  Search,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  Edit,
  Loader2,
  X,
} from "lucide-react";

export default function SellerInventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Restock / Adjust Modal State
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [adjustQty, setAdjustQty] = useState<string>("20");
  const [adjustType, setAdjustType] = useState<"restock" | "adjustment">("restock");
  const [adjustNote, setAdjustNote] = useState("");
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);

  // History Drawer State
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await getSellerInventory({
        search: searchQuery.trim() || undefined,
        low_stock_only: lowStockOnly || undefined,
      });
      setInventory(res.items || []);
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed loading inventory" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, lowStockOnly]);

  const handleOpenHistory = async () => {
    setShowHistory(true);
    setLoadingHistory(true);
    try {
      const txs = await getInventoryTransactions(50);
      setTransactions(txs);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleConfirmAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingItem) return;

    setIsSubmittingAdjust(true);
    setFeedback(null);

    const qty = parseInt(adjustQty, 10);
    if (isNaN(qty) || qty === 0) {
      setFeedback({ type: "error", text: "Please specify a valid non-zero adjustment quantity." });
      setIsSubmittingAdjust(false);
      return;
    }

    try {
      const updated = await updateStock(adjustingItem.sku, {
        quantity_change: adjustType === "restock" ? Math.abs(qty) : qty,
        type: adjustType === "restock" ? "restock" : "adjustment",
        note: adjustNote.trim() || undefined,
      });

      setInventory((prev) =>
        prev.map((item) => (item.sku === updated.sku ? updated : item))
      );
      setFeedback({
        type: "success",
        text: `Successfully updated stock for SKU "${updated.sku}" to ${updated.quantity_available} units.`,
      });
      setAdjustingItem(null);
      setAdjustNote("");
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed adjusting stock" });
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  const lowStockCount = inventory.filter((i) => i.is_low_stock).length;
  const totalReserved = inventory.reduce((acc, curr) => acc + curr.quantity_reserved, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#D1E7D8] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[#E8F8EE] text-[#00A86B] font-mono text-[11px] font-bold border border-[#A2E4B8]">
              Warehouse & Inventory
            </span>
            <span className="text-xs text-[#0A504A]/70 font-medium">Stock Balances</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0A504A] tracking-tight">
            Inventory & Stock Controls
          </h1>
          <p className="text-xs sm:text-sm text-[#0A504A]/70 mt-1 font-medium">
            Monitor real-time SKU balances, manage warehouse restocks, and review reservation audits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenHistory}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white hover:bg-[#E8F8EE] border border-[#D1E7D8] text-xs font-bold text-[#0A504A] transition-colors shadow-2xs cursor-pointer"
          >
            <History className="w-4 h-4 text-[#00A86B]" />
            <span>Audit Logs</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between shadow-2xs ${
            feedback.type === "success"
              ? "bg-[#E8F8EE] text-[#0A504A] border-[#A2E4B8]"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-[#00A86B]" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-bold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-[#D1E7D8] shadow-2xs">
          <span className="text-xs font-semibold text-[#0A504A]/70">Total Tracked SKUs</span>
          <p className="text-2xl font-black text-[#0A504A] mt-1">{inventory.length}</p>
          <p className="text-[11px] text-[#0A504A]/60 mt-1">Auto-provisioned on variant creation</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-[#D1E7D8] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#0A504A]/70">Low Stock Warnings</span>
            {lowStockCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                Action Needed
              </span>
            )}
          </div>
          <p className={`text-2xl font-black mt-1 ${lowStockCount > 0 ? "text-amber-600" : "text-[#0A504A]"}`}>
            {lowStockCount}
          </p>
          <p className="text-[11px] text-[#0A504A]/60 mt-1">Balances at or below alert threshold</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-[#D1E7D8] shadow-2xs">
          <span className="text-xs font-semibold text-[#0A504A]/70">Reserved Units</span>
          <p className="text-2xl font-black text-[#0A504A] mt-1">{totalReserved}</p>
          <p className="text-[11px] text-[#0A504A]/60 mt-1">Committed to active customer orders</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#0A504A]/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search inventory by SKU code..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A] placeholder-[#0A504A]/40 focus:outline-none focus:border-[#00A86B] shadow-2xs"
          />
        </div>

        <button
          onClick={() => setLowStockOnly(!lowStockOnly)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
            lowStockOnly
              ? "bg-[#0A504A] text-white font-bold"
              : "bg-white border border-[#D1E7D8] text-[#0A504A] hover:bg-[#E8F8EE]"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <span>Low Stock Only ({lowStockCount})</span>
        </button>
      </div>

      {/* Inventory Table */}
      {isLoading ? (
        <div className="bg-white rounded-3xl border border-[#D1E7D8] p-20 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#00A86B] animate-spin mb-3" />
          <p className="text-xs font-bold text-[#0A504A]/70 uppercase">Loading inventory telemetry...</p>
        </div>
      ) : inventory.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#D1E7D8] p-16 text-center">
          <Package className="w-12 h-12 text-[#A2E4B8] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#0A504A]">No inventory records found</h3>
          <p className="text-xs text-[#0A504A]/60 mt-1">
            Products created in the Seller Portal will automatically populate inventory SKUs here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#D1E7D8] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4FAF6] border-b border-[#D1E7D8]">
                <tr className="text-[#0A504A] uppercase tracking-wider font-bold text-[10px]">
                  <th className="py-4 px-5">SKU Code</th>
                  <th className="py-4 px-5">Available Stock</th>
                  <th className="py-4 px-5">Reserved</th>
                  <th className="py-4 px-5">Low Stock Threshold</th>
                  <th className="py-4 px-5">Inventory Status</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1E7D8]/60">
                {inventory.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F4FAF6]/50 transition-colors">
                    <td className="py-4 px-5 font-mono font-bold text-[#0A504A]">
                      {item.sku}
                    </td>

                    <td className="py-4 px-5 font-mono text-sm font-bold text-[#0A504A]">
                      {item.quantity_available}
                    </td>

                    <td className="py-4 px-5 font-mono text-[#0A504A]/70">
                      {item.quantity_reserved}
                    </td>

                    <td className="py-4 px-5 font-mono text-[#0A504A]/70">
                      {item.low_stock_threshold}
                    </td>

                    <td className="py-4 px-5">
                      {item.quantity_available <= 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold uppercase">
                          Out of Stock
                        </span>
                      ) : item.is_low_stock ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold uppercase">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>Low Stock Warning</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8F8EE] text-[#00A86B] border border-[#A2E4B8] text-[10px] font-bold uppercase">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>In Stock</span>
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => {
                          setAdjustingItem(item);
                          setAdjustQty("25");
                          setAdjustType("restock");
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E8F8EE] hover:bg-[#D1E7D8] text-[#0A504A] border border-[#A2E4B8] text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        <ArrowUpDown className="w-3 h-3 text-[#00A86B]" />
                        <span>Restock / Adjust</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Restock & Adjust Modal */}
      {adjustingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#D1E7D8] p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#D1E7D8]">
              <div>
                <h3 className="text-base font-bold text-[#0A504A]">
                  Adjust Inventory: {adjustingItem.sku}
                </h3>
                <p className="text-xs text-[#0A504A]/70 mt-0.5">
                  Current available stock: <strong>{adjustingItem.quantity_available} units</strong>
                </p>
              </div>
              <button
                onClick={() => setAdjustingItem(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmAdjust} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0A504A] mb-1.5">
                  Adjustment Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustType("restock");
                      if (parseInt(adjustQty, 10) < 0) setAdjustQty(String(Math.abs(parseInt(adjustQty, 10))));
                    }}
                    className={`py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                      adjustType === "restock"
                        ? "bg-[#0A504A] text-white shadow-2xs"
                        : "bg-[#F4FAF6] border border-[#D1E7D8] text-[#0A504A]"
                    }`}
                  >
                    Restock (Add)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustType("adjustment");
                    }}
                    className={`py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                      adjustType === "adjustment"
                        ? "bg-[#0A504A] text-white shadow-2xs"
                        : "bg-[#F4FAF6] border border-[#D1E7D8] text-[#0A504A]"
                    }`}
                  >
                    Correction (Adjust)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0A504A] mb-1.5">
                  Quantity Change {adjustType === "adjustment" && "(Positive or Negative)"}
                </label>
                <input
                  type="number"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  placeholder="e.g. 25"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F4FAF6] border border-[#D1E7D8] text-sm font-mono font-bold text-[#0A504A] focus:outline-none focus:border-[#00A86B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0A504A] mb-1.5">
                  Transaction Reason / Reference
                </label>
                <input
                  type="text"
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  placeholder="e.g. Received shipment PO-8821"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F4FAF6] border border-[#D1E7D8] text-xs text-[#0A504A] focus:outline-none focus:border-[#00A86B]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D1E7D8]">
                <button
                  type="button"
                  onClick={() => setAdjustingItem(null)}
                  className="px-4 py-2 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdjust}
                  className="px-5 py-2 rounded-2xl bg-[#00A86B] hover:bg-[#088758] disabled:opacity-50 text-xs font-bold text-white transition-all shadow-2xs cursor-pointer"
                >
                  {isSubmittingAdjust ? "Updating..." : "Commit Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit Logs Drawer / Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#D1E7D8] p-6 max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#D1E7D8] mb-4">
              <div>
                <h3 className="text-base font-bold text-[#0A504A] flex items-center gap-2">
                  <History className="w-4 h-4 text-[#00A86B]" />
                  <span>Inventory Audit Logs</span>
                </h3>
                <p className="text-xs text-[#0A504A]/70">
                  Immutable record of stock restocks, reservations, and deductions.
                </p>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5">
              {loadingHistory ? (
                <div className="py-12 text-center text-xs text-[#0A504A]/60">
                  Loading audit logs...
                </div>
              ) : transactions.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#0A504A]/60">
                  No stock movements recorded yet.
                </div>
              ) : (
                transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3.5 rounded-2xl bg-[#F4FAF6] border border-[#D1E7D8] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#0A504A]">{tx.sku}</span>
                        <span className="px-2 py-0.5 rounded-lg bg-[#E8F8EE] font-mono text-[10px] uppercase text-[#00A86B] font-bold border border-[#A2E4B8]">
                          {tx.type}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#0A504A]/60 block mt-0.5">
                        {tx.reason || "Manual update"}
                      </span>
                    </div>

                    <div className="text-right">
                      <span
                        className={`font-mono font-black ${
                          tx.quantity_change > 0
                            ? "text-[#00A86B]"
                            : tx.quantity_change < 0
                            ? "text-rose-600"
                            : "text-[#0A504A]"
                        }`}
                      >
                        {tx.quantity_change > 0 ? `+${tx.quantity_change}` : tx.quantity_change}
                      </span>
                      <span className="text-[10px] text-[#0A504A]/60 block font-mono">
                        Balance: {tx.balance_after}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
