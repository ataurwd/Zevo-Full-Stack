"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "../../../components/Navbar";
import { ProtectedRoute } from "../../../components/auth/ProtectedRoute";
import {
  adminListSellers,
  adminApproveSeller,
  adminRejectSeller,
  SellerProfile,
} from "../../../lib/api/sellers";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  Clock,
  Loader2,
  Search,
  Filter,
} from "lucide-react";

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Reject Modal State
  const [rejectingSeller, setRejectingSeller] = useState<SellerProfile | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const loadSellers = async () => {
    setIsLoading(true);
    try {
      const data = await adminListSellers(statusFilter === "all" ? undefined : statusFilter);
      setSellers(data);
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed loading sellers" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSellers();
  }, [statusFilter]);

  const handleApprove = async (id: string, name: string) => {
    setActionLoadingId(id);
    setFeedback(null);
    try {
      const updated = await adminApproveSeller(id);
      setSellers((prev) => prev.map((s) => (s.id === id ? updated : s)));
      setFeedback({ type: "success", text: `Merchant "${name}" has been approved!` });
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed approving seller" });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingSeller || !rejectReason.trim()) return;
    setActionLoadingId(rejectingSeller.id);
    setFeedback(null);
    try {
      const updated = await adminRejectSeller(rejectingSeller.id, rejectReason.trim());
      setSellers((prev) => prev.map((s) => (s.id === rejectingSeller.id ? updated : s)));
      setFeedback({
        type: "success",
        text: `Merchant "${rejectingSeller.business_name}" was rejected.`,
      });
      setRejectingSeller(null);
      setRejectReason("");
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed rejecting seller" });
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
                <span>Admin Moderation Queue</span>
              </div>
              <h1 className="text-2xl font-bold text-white">Merchant Applications & KYC</h1>
              <p className="text-xs text-slate-400 mt-1">
                Review vendor onboarding submissions, bank verification statuses, and commercial licenses.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/admin/products"
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 transition-colors"
              >
                Product Moderation Queue
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
            {["pending", "approved", "rejected", "suspended", "all"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium capitalize whitespace-nowrap transition-colors ${
                  statusFilter === status
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {status} Applications
              </button>
            ))}
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-3" />
              <p className="text-sm text-slate-400">Loading merchant applications...</p>
            </div>
          ) : sellers.length === 0 ? (
            <div className="glass-card rounded-2xl border border-slate-800 p-12 text-center">
              <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-200">
                No {statusFilter !== "all" ? statusFilter : ""} merchants found
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                New merchant onboarding applications will appear here for review.
              </p>
            </div>
          ) : (
            <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 border-b border-slate-800">
                    <tr className="text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="py-3.5 px-4">Business</th>
                      <th className="py-3.5 px-4">Type / Tax ID</th>
                      <th className="py-3.5 px-4">Stripe / Bank</th>
                      <th className="py-3.5 px-4">Net Earnings</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Moderation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {sellers.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-4 px-4">
                          <div>
                            <span className="font-semibold text-white text-sm block">
                              {s.business_name}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              Seller ID: {s.id}
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-4 text-slate-300">
                          <span className="capitalize block">{s.business_type}</span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {s.tax_id ? `TIN: ${s.tax_id}` : "No Tax ID"}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <span className="text-[11px] font-mono text-indigo-400 block truncate max-w-xs">
                              {s.stripe_account_id || "Unlinked"}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-medium ${
                                s.bank_verified ? "text-emerald-400" : "text-amber-400"
                              }`}
                            >
                              {s.bank_verified ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Bank Verified</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3" />
                                  <span>Pending Bank</span>
                                </>
                              )}
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-4 font-mono font-semibold text-slate-200">
                          {formatCents(s.total_earnings)}
                        </td>

                        <td className="py-4 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-semibold ${
                              s.status === "approved"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : s.status === "rejected"
                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            {s.status !== "approved" && (
                              <button
                                onClick={() => handleApprove(s.id, s.business_name)}
                                disabled={actionLoadingId === s.id}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium transition-colors"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Approve</span>
                              </button>
                            )}

                            {s.status !== "rejected" && (
                              <button
                                onClick={() => {
                                  setRejectingSeller(s);
                                  setRejectReason("");
                                }}
                                disabled={actionLoadingId === s.id}
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

          {/* Rejection Reason Modal */}
          {rejectingSeller && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="glass-card rounded-2xl border border-slate-800 p-6 max-w-md w-full">
                <h3 className="text-base font-bold text-white mb-1">
                  Reject Application: {rejectingSeller.business_name}
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Provide a mandatory administrative reason for the rejection notice.
                </p>

                <textarea
                  rows={3}
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Identity documents unreadable or business license unverified..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-rose-500 resize-none mb-4"
                />

                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setRejectingSeller(null)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmReject}
                    disabled={actionLoadingId === rejectingSeller.id || !rejectReason.trim()}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-rose-900 text-xs font-semibold text-white transition-colors"
                  >
                    {actionLoadingId === rejectingSeller.id ? "Rejecting..." : "Confirm Rejection"}
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
