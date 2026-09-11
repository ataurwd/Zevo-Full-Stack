"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "../../../components/Navbar";
import { ProtectedRoute } from "../../../components/auth/ProtectedRoute";
import {
  adminListProducts,
  adminApproveProduct,
  adminRejectProduct,
  ProductItem,
} from "../../../lib/api/products";
import {
  Package,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Loader2,
  ArrowRight,
} from "lucide-react";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending_review");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Reject Modal State
  const [rejectingProduct, setRejectingProduct] = useState<ProductItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const res = await adminListProducts({
        status: statusFilter === "all" ? undefined : statusFilter,
        limit: 50,
      });
      setProducts(res.items || []);
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed loading products" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [statusFilter]);

  const handleApprove = async (id: string, name: string) => {
    setActionLoadingId(id);
    setFeedback(null);
    try {
      const updated = await adminApproveProduct(id);
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      setFeedback({ type: "success", text: `Product "${name}" has been approved and published!` });
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed approving product" });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingProduct || !rejectReason.trim()) return;
    setActionLoadingId(rejectingProduct.id);
    setFeedback(null);
    try {
      const updated = await adminRejectProduct(rejectingProduct.id, rejectReason.trim());
      setProducts((prev) => prev.map((p) => (p.id === rejectingProduct.id ? updated : p)));
      setFeedback({
        type: "success",
        text: `Product "${rejectingProduct.name}" was rejected.`,
      });
      setRejectingProduct(null);
      setRejectReason("");
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed rejecting product" });
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatCents = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
      <div className="min-h-screen bg-[#080b12] text-slate-100 flex flex-col">
        <Navbar />

        <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-800 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Product Compliance Queue</span>
              </div>
              <h1 className="text-2xl font-bold text-white">Product Catalog Moderation</h1>
              <p className="text-xs text-slate-400 mt-1">
                Inspect merchant products submitted for compliance, pricing sanity, and policy adherence.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/admin/sellers"
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 transition-colors"
              >
                Seller Moderation Queue
              </Link>
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

          {/* Filter Pills */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
            {["pending_review", "draft", "approved", "rejected", "all"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium capitalize whitespace-nowrap transition-colors ${
                  statusFilter === status
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {status.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* Products List */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-3" />
              <p className="text-sm text-slate-400">Loading catalog submissions...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="glass-card rounded-2xl border border-slate-800 p-12 text-center">
              <Package className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-200">
                No products under &quot;{statusFilter.replace("_", " ")}&quot;
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Submissions from sellers awaiting moderation will appear here.
              </p>
            </div>
          ) : (
            <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 border-b border-slate-800">
                    <tr className="text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="py-3.5 px-4">Product</th>
                      <th className="py-3.5 px-4">Seller / Store</th>
                      <th className="py-3.5 px-4">Base Price</th>
                      <th className="py-3.5 px-4">Variants</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Moderation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-4 px-4">
                          <div>
                            <span className="font-semibold text-white text-sm block">
                              {p.name}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              Slug: {p.slug}
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-4 text-slate-400 font-mono text-[11px]">
                          Store: {p.store_id}
                        </td>

                        <td className="py-4 px-4 font-mono font-semibold text-slate-200">
                          {formatCents(p.base_price)}
                        </td>

                        <td className="py-4 px-4 text-slate-300">
                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono">
                            {p.variants.length} SKU(s)
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <div>
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-semibold ${
                                p.status === "approved"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : p.status === "rejected"
                                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                  : p.status === "pending_review"
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                  : "bg-slate-800 text-slate-400 border border-slate-700"
                              }`}
                            >
                              {p.status.replace("_", " ")}
                            </span>
                            {p.rejection_reason && (
                              <p className="text-[10px] text-rose-400 mt-1 max-w-xs truncate">
                                {p.rejection_reason}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="py-4 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            {p.status !== "approved" && (
                              <button
                                onClick={() => handleApprove(p.id, p.name)}
                                disabled={actionLoadingId === p.id}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium transition-colors"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Approve</span>
                              </button>
                            )}

                            {p.status !== "rejected" && (
                              <button
                                onClick={() => {
                                  setRejectingProduct(p);
                                  setRejectReason("");
                                }}
                                disabled={actionLoadingId === p.id}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-[11px] font-medium transition-colors"
                              >
                                <XCircle className="w-3 h-3" />
                                <span>Reject</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reject Reason Modal */}
          {rejectingProduct && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="glass-card rounded-2xl border border-slate-800 p-6 max-w-md w-full">
                <h3 className="text-base font-bold text-white mb-1">
                  Reject Product: {rejectingProduct.name}
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Please provide a detailed policy reason for the rejection notification.
                </p>

                <textarea
                  rows={3}
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Inadequate product specifications or prohibited accessory category..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-rose-500 resize-none mb-4"
                />

                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setRejectingProduct(null)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmReject}
                    disabled={actionLoadingId === rejectingProduct.id || !rejectReason.trim()}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-rose-900 text-xs font-semibold text-white transition-colors"
                  >
                    {actionLoadingId === rejectingProduct.id ? "Rejecting..." : "Confirm Rejection"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
