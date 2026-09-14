"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  getSellerCoupons,
  createSellerCoupon,
  toggleCouponStatus,
  deleteCoupon,
  CouponItem,
} from "../../../lib/api/coupons";
import {
  Ticket,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  Percent,
  DollarSign,
  X,
} from "lucide-react";

export default function SellerCouponsPage() {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form State
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState(15);
  const [minOrder, setMinOrder] = useState(0);
  const [maxDiscount, setMaxDiscount] = useState(0);
  const [usageLimit, setUsageLimit] = useState(100);
  const [expiresAt, setExpiresAt] = useState(
    new Date(Date.now() + 86400000 * 30).toISOString().split("T")[0]
  );

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const list = await getSellerCoupons();
      setCoupons(list);
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed loading coupons" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      const updated = await toggleCouponStatus(id, !currentStatus);
      setCoupons((prev) => prev.map((c) => (c._id === id ? updated : c)));
      setFeedback({
        type: "success",
        text: `Coupon "${updated.code}" is now ${updated.is_active ? "active" : "disabled"}.`,
      });
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed changing coupon status" });
    }
  };

  const handleDelete = async (id: string, codeName: string) => {
    if (!confirm(`Are you sure you want to delete coupon "${codeName}"?`)) return;
    try {
      await deleteCoupon(id);
      setCoupons((prev) => prev.filter((c) => c._id !== id));
      setFeedback({ type: "success", text: `Coupon "${codeName}" deleted successfully.` });
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed deleting coupon" });
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const newCoupon = await createSellerCoupon({
        code: code.trim().toUpperCase(),
        discount_type: discountType,
        discount_value: discountType === "percentage" ? discountValue : discountValue * 100,
        min_order_value: minOrder * 100,
        max_discount: maxDiscount > 0 ? maxDiscount * 100 : undefined,
        usage_limit: usageLimit,
        expires_at: new Date(expiresAt).toISOString(),
      });

      setCoupons((prev) => [newCoupon, ...prev]);
      setFeedback({ type: "success", text: `Coupon "${newCoupon.code}" created successfully!` });
      setIsModalOpen(false);
      setCode("");
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed creating coupon" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#D1E7D8] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[#E8F8EE] text-[#00A86B] font-mono text-[11px] font-bold border border-[#A2E4B8]">
              Promotions & Campaigns
            </span>
            <span className="text-xs text-[#0A504A]/70 font-medium">Discounts</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0A504A] tracking-tight">
            Store Promotional Coupons
          </h1>
          <p className="text-xs sm:text-sm text-[#0A504A]/70 mt-1 font-medium">
            Create discount coupons, set minimum spend rules, and track customer redemption rates.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 rounded-2xl bg-[#00A86B] hover:bg-[#088758] text-white text-xs font-bold flex items-center gap-2 shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Coupon</span>
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

      {/* Coupons Table */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-[#D1E7D8] p-16 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#00A86B] animate-spin mb-3" />
          <p className="text-xs font-bold text-[#0A504A]/70 uppercase">Loading discount coupons...</p>
        </div>
      ) : coupons.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#D1E7D8] p-16 text-center">
          <Ticket className="w-12 h-12 text-[#A2E4B8] mx-auto mb-3" />
          <h3 className="text-base font-black text-[#0A504A]">No coupons active yet</h3>
          <p className="text-xs text-[#0A504A]/60 mt-1 max-w-sm mx-auto">
            Boost your store sales by creating limited-time discount codes for your customers.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#D1E7D8] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#F4FAF6] border-b border-[#D1E7D8] text-[#0A504A] font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-4 px-5">Coupon Code</th>
                  <th className="py-4 px-5">Discount Value</th>
                  <th className="py-4 px-5">Min Order / Cap</th>
                  <th className="py-4 px-5">Usage Redemptions</th>
                  <th className="py-4 px-5">Expires On</th>
                  <th className="py-4 px-5">Active Status</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1E7D8]/60">
                {coupons.map((c) => (
                  <tr key={c._id} className="hover:bg-[#F4FAF6]/50 transition-colors">
                    <td className="py-4 px-5">
                      <span className="px-3 py-1 rounded-xl bg-[#E8F8EE] border border-[#A2E4B8] text-[#00A86B] font-mono font-black text-xs">
                        {c.code}
                      </span>
                    </td>

                    <td className="py-4 px-5 font-bold text-[#0A504A]">
                      {c.discount_type === "percentage" ? (
                        <span className="flex items-center gap-1 text-[#00A86B]">
                          <Percent className="w-3.5 h-3.5" />
                          <span>{c.discount_value}% OFF</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[#00A86B]">
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>${(c.discount_value / 100).toFixed(2)} FLAT</span>
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-5 text-slate-600">
                      <div>Min: ${(c.min_order_value / 100).toFixed(2)}</div>
                      {c.max_discount && (
                        <div className="text-[10px] text-slate-400">
                          Max Cap: ${(c.max_discount / 100).toFixed(2)}
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-5">
                      <div className="font-bold text-[#0A504A]">
                        {c.usage_count} / {c.usage_limit} used
                      </div>
                      <div className="w-24 h-1.5 rounded-full bg-slate-100 overflow-hidden mt-1">
                        <div
                          className="h-full bg-[#00A86B] rounded-full"
                          style={{
                            width: `${Math.min(100, (c.usage_count / c.usage_limit) * 100)}%`,
                          }}
                        />
                      </div>
                    </td>

                    <td className="py-4 px-5 text-slate-600 font-mono text-[11px]">
                      {new Date(c.expires_at).toLocaleDateString()}
                    </td>

                    <td className="py-4 px-5">
                      <button
                        onClick={() => handleToggle(c._id, c.is_active)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                          c.is_active
                            ? "bg-[#E8F8EE] text-[#00A86B] border border-[#A2E4B8]"
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}
                      >
                        {c.is_active ? "Active" : "Disabled"}
                      </button>
                    </td>

                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => handleDelete(c._id, c.code)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Coupon"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Create Coupon */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#D1E7D8]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#D1E7D8]">
              <div>
                <h2 className="text-lg font-black text-[#0A504A]">Create Discount Coupon</h2>
                <p className="text-xs text-[#0A504A]/70">
                  Configure discount rules and expiration limits for this code.
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

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0A504A] mb-1">
                  Coupon Code (Uppercase)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FLASH20"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F4FAF6] border border-[#D1E7D8] text-xs font-mono uppercase font-bold text-[#0A504A] focus:outline-none focus:border-[#00A86B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0A504A] mb-1">
                    Discount Type
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F4FAF6] border border-[#D1E7D8] text-xs font-bold text-[#0A504A] focus:outline-none focus:border-[#00A86B]"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0A504A] mb-1">
                    Discount Value {discountType === "percentage" ? "(%)" : "($)"}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={discountType === "percentage" ? 100 : 1000}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#F4FAF6] border border-[#D1E7D8] text-xs font-bold text-[#0A504A] focus:outline-none focus:border-[#00A86B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0A504A] mb-1">
                    Min Order Value ($)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={minOrder}
                    onChange={(e) => setMinOrder(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#F4FAF6] border border-[#D1E7D8] text-xs font-bold text-[#0A504A] focus:outline-none focus:border-[#00A86B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0A504A] mb-1">
                    Usage Limit
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#F4FAF6] border border-[#D1E7D8] text-xs font-bold text-[#0A504A] focus:outline-none focus:border-[#00A86B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0A504A] mb-1">
                  Expiration Date
                </label>
                <input
                  type="date"
                  required
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F4FAF6] border border-[#D1E7D8] text-xs font-bold text-[#0A504A] focus:outline-none focus:border-[#00A86B]"
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
                  disabled={submitting || !code.trim()}
                  className="px-5 py-2 rounded-xl bg-[#00A86B] hover:bg-[#088758] disabled:opacity-50 text-white text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Save Coupon</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
