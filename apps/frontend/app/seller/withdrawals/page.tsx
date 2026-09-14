"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  getSellerWithdrawals,
  requestWithdrawal,
  WithdrawalItem,
} from "../../../lib/api/withdrawals";
import { getMySellerProfile, SellerProfile } from "../../../lib/api/sellers";
import {
  DollarSign,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Building,
  CreditCard,
  X,
} from "lucide-react";

export default function SellerWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([]);
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amountDollars, setAmountDollars] = useState(50);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [list, seller] = await Promise.all([getSellerWithdrawals(), getMySellerProfile()]);
      setWithdrawals(list);
      setProfile(seller);
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed loading payout records" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    const amountCents = Math.round(amountDollars * 100);

    try {
      const created = await requestWithdrawal(amountCents, notes.trim() || undefined);
      setWithdrawals((prev) => [created, ...prev]);
      if (profile) {
        setProfile({
          ...profile,
          total_earnings: profile.total_earnings - amountCents,
        });
      }
      setFeedback({
        type: "success",
        text: `Payout request of $${amountDollars.toFixed(2)} submitted successfully!`,
      });
      setIsModalOpen(false);
      setNotes("");
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Payout request failed" });
    } finally {
      setSubmitting(false);
    }
  };

  const availableBalance = profile?.total_earnings || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#D1E7D8] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[#E8F8EE] text-[#00A86B] font-mono text-[11px] font-bold border border-[#A2E4B8]">
              Treasury & Payouts
            </span>
            <span className="text-xs text-[#0A504A]/70 font-medium">Disbursements</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0A504A] tracking-tight">
            Payouts & Fund Disbursements
          </h1>
          <p className="text-xs sm:text-sm text-[#0A504A]/70 mt-1 font-medium">
            Disburse your store sales earnings to your verified bank account via Stripe Connect.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          disabled={availableBalance < 2000}
          className="px-5 py-2.5 rounded-2xl bg-[#00A86B] hover:bg-[#088758] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Request Payout</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between shadow-2xs ${
            feedback.type === "success"
              ? "bg-[#E8F8EE] text-[#0A504A] border-[#A2E4B8]"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-[#00A86B]" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="font-bold underline text-xs cursor-pointer ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Balance Card Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-3xl p-6 border border-[#D1E7D8] shadow-2xs">
          <span className="text-xs font-bold text-[#0A504A]/70 uppercase tracking-wider block mb-1">
            Disbursable Balance
          </span>
          <div className="text-3xl font-black text-[#0A504A]">
            ${(availableBalance / 100).toFixed(2)}
          </div>
          <p className="text-[11px] text-[#0A504A]/60 mt-2">
            Available immediately for payout request (Minimum $20.00).
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#D1E7D8] shadow-2xs">
          <span className="text-xs font-bold text-[#0A504A]/70 uppercase tracking-wider block mb-1">
            Stripe Connected Account
          </span>
          <div className="text-base font-bold text-[#0A504A] flex items-center gap-2 mt-1">
            <CreditCard className="w-4 h-4 text-[#00A86B]" />
            <span className="font-mono text-xs text-[#0A504A]">
              {profile?.stripe_account_id || "Stripe Connect Linked"}
            </span>
          </div>
          <div className="text-[11px] text-[#00A86B] font-bold mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Direct Bank Deposit Active</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#D1E7D8] shadow-2xs">
          <span className="text-xs font-bold text-[#0A504A]/70 uppercase tracking-wider block mb-1">
            Pending Payouts
          </span>
          <div className="text-3xl font-black text-amber-600">
            {withdrawals.filter((w) => w.status === "pending").length}
          </div>
          <p className="text-[11px] text-[#0A504A]/60 mt-2">
            Requests currently undergoing administrative processing.
          </p>
        </div>
      </div>

      {/* Withdrawals History Table */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-[#D1E7D8] p-16 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#00A86B] animate-spin mb-3" />
          <p className="text-xs font-bold text-[#0A504A]/70 uppercase">Loading payout ledger...</p>
        </div>
      ) : withdrawals.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#D1E7D8] p-16 text-center">
          <DollarSign className="w-12 h-12 text-[#A2E4B8] mx-auto mb-3" />
          <h3 className="text-base font-black text-[#0A504A]">No payout requests yet</h3>
          <p className="text-xs text-[#0A504A]/60 mt-1 max-w-sm mx-auto">
            Once you fulfill orders and build your store balance, you can disburse earnings here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#D1E7D8] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#F4FAF6] border-b border-[#D1E7D8] text-[#0A504A] font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-4 px-6">Disbursement Amount</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Requested On</th>
                  <th className="py-4 px-6">Processed Date</th>
                  <th className="py-4 px-6">Notes / Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1E7D8]/60">
                {withdrawals.map((w) => (
                  <tr key={w._id} className="hover:bg-[#F4FAF6]/50 transition-colors">
                    <td className="py-4 px-6 font-black text-[#0A504A] text-sm">
                      ${(w.amount / 100).toFixed(2)}
                    </td>

                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          w.status === "approved" || w.status === "processed"
                            ? "bg-[#E8F8EE] text-[#00A86B] border border-[#A2E4B8]"
                            : w.status === "rejected"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {w.status === "approved" || w.status === "processed" ? (
                          <CheckCircle2 className="w-3 h-3 text-[#00A86B]" />
                        ) : w.status === "rejected" ? (
                          <XCircle className="w-3 h-3 text-rose-600" />
                        ) : (
                          <Clock className="w-3 h-3 text-amber-600" />
                        )}
                        <span>{w.status}</span>
                      </span>
                    </td>

                    <td className="py-4 px-6 text-[#0A504A]/80 font-mono text-[11px]">
                      {new Date(w.created_at).toLocaleString()}
                    </td>

                    <td className="py-4 px-6 text-[#0A504A]/80 font-mono text-[11px]">
                      {w.processed_at ? new Date(w.processed_at).toLocaleString() : "—"}
                    </td>

                    <td className="py-4 px-6 text-slate-500">
                      {w.admin_notes || w.notes || "Standard disbursement"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Request Payout Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#D1E7D8]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#D1E7D8]">
              <div>
                <h2 className="text-lg font-black text-[#0A504A]">Request Fund Disbursement</h2>
                <p className="text-xs text-[#0A504A]/70">
                  Available balance: ${(availableBalance / 100).toFixed(2)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0A504A] mb-1">
                  Payout Amount ($)
                </label>
                <input
                  type="number"
                  required
                  min={20}
                  max={availableBalance / 100}
                  step={1}
                  value={amountDollars}
                  onChange={(e) => setAmountDollars(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F4FAF6] border border-[#D1E7D8] text-sm font-bold text-[#0A504A] focus:outline-none focus:border-[#00A86B]"
                />
                <span className="text-[10px] text-[#0A504A]/60 mt-1 block">
                  Minimum withdrawal amount: $20.00
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0A504A] mb-1">
                  Transfer Memo / Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. End of month inventory payout"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F4FAF6] border border-[#D1E7D8] text-xs text-[#0A504A] focus:outline-none focus:border-[#00A86B]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D1E7D8]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || amountDollars * 100 > availableBalance || amountDollars < 20}
                  className="px-5 py-2 rounded-xl bg-[#00A86B] hover:bg-[#088758] disabled:opacity-50 text-white text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Submit Payout</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
