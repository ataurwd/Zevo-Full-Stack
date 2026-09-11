"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "../../../components/Navbar";
import { ProtectedRoute } from "../../../components/auth/ProtectedRoute";
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
  ArrowLeft,
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

    const qty = parseInt(adjustQty, 10);
    if (isNaN(qty) || qty === 0) {
      alert("Please enter a non-zero integer quantity");
      return;
    }

    setIsSubmittingAdjust(true);
    setFeedback(null);

    try {
      const updated = await updateStock(adjustingItem.sku, {
        quantity_change: qty,
        type: adjustType,
        note: adjustNote.trim() || undefined,
      });

      setInventory((prev) =>
        prev.map((item) => (item.sku === adjustingItem.sku ? updated : item))
      );

      setFeedback({
        type: "success",
        text: `Stock for SKU "${adjustingItem.sku}" updated. Current available: ${updated.quantity_available}`,
      });
      setAdjustingItem(null);
      setAdjustNote("");
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Stock update failed" });
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  const lowStockCount = inventory.filter((i) => i.is_low_stock).length;
  const totalReserved = inventory.reduce((sum, i) => sum + i.quantity_reserved, 0);

  return (
    <ProtectedRoute allowedRoles={["SELLER", "ADMIN", "SUPER_ADMIN"]}>
      <div className="min-h-screen bg-[#080b12] text-slate-100 flex flex-col">
        <Navbar />

        <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-800 gap-4">
            <div>
              <Link
                href="/seller/dashboard"
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Dashboard</span>
              </Link>
              <h1 className="text-2xl font-bold text-white">Inventory & Stock Controls</h1>
              <p className="text-xs text-slate-400 mt-1">
                Monitor real-time SKU balances, manage warehouse restocks, and review reservation audits.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleOpenHistory}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition-colors"
              >
                <History className="w-4 h-4 text-indigo-400" />
                <span>Audit Logs</span>
              </button>
            </div>
          </div>

          {feedback && (
            <div
              className={`p-4 rounded-xl border text-xs mb-6 flex items-center justify-between ${
                feedback.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                  : "bg-rose-500/10 border-rose-500/20 text-rose-300"
              }`}
            >
              <div className="flex items-center gap-2">
                {feedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span>{feedback.text}</span>
              </div>
              <button
                onClick={() => setFeedback(null)}
                className="text-xs font-bold hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="glass-card rounded-2xl p-5 border border-slate-800">
              <span className="text-xs font-medium text-slate-400">Total Tracked SKUs</span>
              <p className="text-2xl font-black text-white mt-1">{inventory.length}</p>
              <p className="text-[11px] text-slate-500 mt-1">Auto-provisioned on variant creation</p>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Low Stock Warnings</span>
                {lowStockCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                    Action Needed
                  </span>
                )}
              </div>
              <p className={`text-2xl font-black mt-1 ${lowStockCount > 0 ? "text-amber-400" : "text-white"}`}>
                {lowStockCount}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Balances at or below alert threshold</p>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-slate-800">
              <span className="text-xs font-medium text-slate-400">Reserved Units</span>
              <p className="text-2xl font-black text-white mt-1">{totalReserved}</p>
              <p className="text-[11px] text-slate-500 mt-1">Committed to active customer orders</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search inventory by SKU code..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={() => setLowStockOnly(!lowStockOnly)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                lowStockOnly
                  ? "bg-amber-500 text-slate-950 font-bold"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Low Stock Only ({lowStockCount})</span>
            </button>
          </div>

          {/* Inventory Table */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
              <p className="text-sm text-slate-400">Loading inventory telemetry...</p>
            </div>
          ) : inventory.length === 0 ? (
            <div className="glass-card rounded-2xl border border-slate-800 p-12 text-center">
              <Package className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-200">No inventory records found</h3>
              <p className="text-xs text-slate-500 mt-1">
                Products created in the Seller Portal will automatically populate inventory SKUs here.
              </p>
            </div>
          ) : (
            <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 border-b border-slate-800">
                    <tr className="text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="py-3.5 px-4">SKU Code</th>
                      <th className="py-3.5 px-4">Available Stock</th>
                      <th className="py-3.5 px-4">Reserved</th>
                      <th className="py-3.5 px-4">Low Stock Threshold</th>
                      <th className="py-3.5 px-4">Inventory Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {inventory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-4 px-4 font-mono font-bold text-white">
                          {item.sku}
                        </td>

                        <td className="py-4 px-4 font-mono text-sm font-bold text-slate-200">
                          {item.quantity_available}
                        </td>

                        <td className="py-4 px-4 font-mono text-slate-400">
                          {item.quantity_reserved}
                        </td>

                        <td className="py-4 px-4 font-mono text-slate-400">
                          {item.low_stock_threshold}
                        </td>

                        <td className="py-4 px-4">
                          {item.quantity_available <= 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold uppercase">
                              Out of Stock
                            </span>
                          ) : item.is_low_stock ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold uppercase">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Low Stock Warning</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>In Stock</span>
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => {
                              setAdjustingItem(item);
                              setAdjustQty("25");
                              setAdjustType("restock");
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-medium transition-colors"
                          >
                            <ArrowUpDown className="w-3 h-3" />
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
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="glass-card rounded-2xl border border-slate-800 p-6 max-w-md w-full">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Adjust Inventory: {adjustingItem.sku}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Current available stock: <strong>{adjustingItem.quantity_available} units</strong>
                    </p>
                  </div>
                  <button
                    onClick={() => setAdjustingItem(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleConfirmAdjust} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Adjustment Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAdjustType("restock");
                          if (parseInt(adjustQty, 10) < 0) setAdjustQty(String(Math.abs(parseInt(adjustQty, 10))));
                        }}
                        className={`py-2 rounded-xl text-xs font-semibold transition-colors ${
                          adjustType === "restock"
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-900 border border-slate-800 text-slate-400"
                        }`}
                      >
                        Restock (Add)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAdjustType("adjustment");
                        }}
                        className={`py-2 rounded-xl text-xs font-semibold transition-colors ${
                          adjustType === "adjustment"
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-900 border border-slate-800 text-slate-400"
                        }`}
                      >
                        Correction (Adjust)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Quantity Change {adjustType === "adjustment" && "(Positive or Negative)"}
                    </label>
                    <input
                      type="number"
                      required
                      value={adjustQty}
                      onChange={(e) => setAdjustQty(e.target.value)}
                      placeholder="e.g. 25"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Transaction Reason / Reference
                    </label>
                    <input
                      type="text"
                      value={adjustNote}
                      onChange={(e) => setAdjustNote(e.target.value)}
                      placeholder="e.g. Received shipment PO-8821"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setAdjustingItem(null)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingAdjust}
                      className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-xs font-semibold text-white transition-colors shadow-lg shadow-indigo-600/30"
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
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="glass-card rounded-2xl border border-slate-800 p-6 max-w-2xl w-full max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <History className="w-4 h-4 text-indigo-400" />
                      <span>Inventory Audit Logs</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Immutable record of stock restocks, reservations, and deductions.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5">
                  {loadingHistory ? (
                    <div className="py-12 text-center text-xs text-slate-400">
                      Loading audit logs...
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-500">
                      No stock movements recorded yet.
                    </div>
                  ) : (
                    transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white">{tx.sku}</span>
                            <span className="px-2 py-0.5 rounded bg-slate-950 font-mono text-[10px] uppercase text-indigo-400">
                              {tx.type}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            {tx.reason || "Manual update"}
                          </span>
                        </div>

                        <div className="text-right">
                          <span
                            className={`font-mono font-bold ${
                              tx.quantity_change > 0
                                ? "text-emerald-400"
                                : tx.quantity_change < 0
                                ? "text-rose-400"
                                : "text-slate-300"
                            }`}
                          >
                            {tx.quantity_change > 0 ? `+${tx.quantity_change}` : tx.quantity_change}
                          </span>
                          <span className="text-[10px] text-slate-500 block font-mono">
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
        </main>
      </div>
    </ProtectedRoute>
  );
}
