"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  MapPin,
  CreditCard,
  Building2,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { getOrderById, cancelOrder, Order } from "@/lib/api/orders";
import { getAccessToken } from "@/lib/api/client";
import { GlassCard, GlassButton, GlassBadge } from "@/components/ui";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = params.id;
  const isNewlyPlaced = searchParams.get("placed") === "true";

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push(`/login?redirect=/orders/${orderId}`);
      return;
    }

    const loadOrder = async () => {
      try {
        const data = await getOrderById(orderId);
        setOrder(data);
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to load order details");
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder();
  }, [orderId, router]);

  const handleCancelOrder = async () => {
    setIsCancelling(true);
    setErrorMsg(null);
    try {
      const updated = await cancelOrder(orderId, cancelReason.trim() || undefined);
      setOrder(updated);
      setCancelModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to cancel order");
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (errorMsg && !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white">Order Not Found</h2>
        <p className="text-slate-400 mt-1 text-sm">{errorMsg}</p>
        <Link href="/orders" className="mt-6 inline-block">
          <GlassButton size="sm" leftIcon={<ChevronLeft className="w-4 h-4" />}>
            Back to My Orders
          </GlassButton>
        </Link>
      </div>
    );
  }

  if (!order) return null;

  // Stepper calculations
  const steps = [
    { label: "Placed", key: "pending" },
    { label: "Confirmed", key: "confirmed" },
    { label: "Preparing", key: "preparing" },
    { label: "Ready for Pickup", key: "ready_for_pickup" },
    { label: "Delivered", key: "completed" },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case "pending":
        return 0;
      case "confirmed":
        return 1;
      case "preparing":
        return 2;
      case "ready_for_pickup":
        return 3;
      case "completed":
        return 4;
      case "cancelled":
        return -1;
      default:
        return 0;
    }
  };

  const currentStep = getStepIndex(order.status);
  const isCancelled = order.status === "cancelled";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Newly Placed Banner */}
      {isNewlyPlaced && (
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-indigo-900/60 via-purple-900/50 to-cyan-900/60 border border-indigo-500/30 text-white shadow-[0_0_40px_rgba(99,102,241,0.25)] backdrop-blur-xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center shadow-glow-indigo">
              <Sparkles className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">Order Confirmed in Escrow!</h3>
              <p className="text-indigo-200 text-xs mt-0.5">
                Thank you! Your order #{order.order_number} has been allocated. Vendors have begun fulfillment preparations.
              </p>
            </div>
          </div>
          <GlassBadge variant="cyan">Real-Time Routing</GlassBadge>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-indigo-400 transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to My Orders
        </Link>

        {order.status === "pending" && (
          <GlassButton
            type="button"
            size="sm"
            variant="danger"
            onClick={() => setCancelModalOpen(true)}
          >
            Cancel Order
          </GlassButton>
        )}
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2 backdrop-blur-md">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Order Container */}
      <GlassCard className="overflow-hidden mb-8">
        {/* Header */}
        <div className="p-6 sm:p-8 bg-slate-950/40 border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-white tracking-tight">
                Order #{order.order_number}
              </h1>
              {isCancelled ? (
                <GlassBadge variant="rose">Cancelled</GlassBadge>
              ) : (
                <GlassBadge variant="emerald">{order.status.toUpperCase()}</GlassBadge>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Placed on {new Date(order.created_at).toLocaleString()} • Currency: {order.currency.toUpperCase()}
            </p>
          </div>

          <div className="text-right">
            <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Amount
            </span>
            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-cyan-300">
              ${(order.total / 100).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Stepper */}
        {!isCancelled ? (
          <div className="p-6 sm:p-8 border-b border-white/[0.06] bg-slate-950/20">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">
              Live Fulfillment Stepper
            </h3>
            <div className="relative flex items-center justify-between">
              {/* Connector line */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-white/[0.08] z-0" />
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-indigo-500 to-cyan-400 z-0 shadow-[0_0_12px_#6366f1] transition-all duration-500"
                style={{
                  width: `${(currentStep / (steps.length - 1)) * 100}%`,
                }}
              />

              {steps.map((step, idx) => {
                const isPassed = idx <= currentStep;
                const isCurrent = idx === currentStep;

                return (
                  <div key={step.key} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs transition-all ${
                        isPassed
                          ? "bg-indigo-600 text-white shadow-glow-indigo border border-indigo-400/40"
                          : "bg-slate-900 text-slate-500 border border-white/[0.08]"
                      } ${isCurrent ? "ring-4 ring-indigo-500/20 scale-110" : ""}`}
                    >
                      {isPassed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>
                    <span
                      className={`mt-2 text-[11px] whitespace-nowrap ${
                        isPassed ? "font-bold text-white" : "font-medium text-slate-500"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-6 bg-rose-500/10 border-b border-rose-500/20 flex items-center gap-3 text-xs text-rose-300">
            <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <div>
              <span className="font-bold">This order was cancelled.</span>
              {order.cancellation_reason && (
                <span className="block text-rose-400 mt-0.5">
                  Reason: {order.cancellation_reason}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Sub-Orders Grid */}
        <div className="p-6 sm:p-8 divide-y divide-white/[0.06]">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Sub-Orders Breakdown
          </h3>

          {order.sub_orders?.map((sub) => (
            <div key={sub.id} className="py-6 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-bold text-white">
                    Vendor Sub-Order #{sub.order_number}
                  </span>
                </div>
                <GlassBadge variant="indigo">
                  {sub.status.replace("_", " ").toUpperCase()}
                </GlassBadge>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-white/[0.06]">
                      <th className="pb-3 font-semibold">Item</th>
                      <th className="pb-3 font-semibold">SKU</th>
                      <th className="pb-3 font-semibold">Unit Price</th>
                      <th className="pb-3 font-semibold">Qty</th>
                      <th className="pb-3 font-semibold text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {sub.items.map((item) => (
                      <tr key={item.variant_id}>
                        <td className="py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-950/80 border border-white/[0.08] flex items-center justify-center overflow-hidden flex-shrink-0">
                              {item.image_url ? (
                                <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                              ) : (
                                <ShoppingBag className="w-4 h-4 text-slate-500" />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-white">{item.product_name}</div>
                              <div className="text-slate-400 text-[11px]">{item.variant_name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 font-mono text-slate-400">{item.sku}</td>
                        <td className="py-3.5 font-medium text-slate-300">
                          ${(item.unit_price / 100).toFixed(2)}
                        </td>
                        <td className="py-3.5 font-bold text-white">{item.quantity}</td>
                        <td className="py-3.5 font-bold text-indigo-300 text-right">
                          ${(item.subtotal / 100).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Bottom 2-Column Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Shipping Destination */}
        <GlassCard className="p-6">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-indigo-400" /> Shipping Destination
          </h3>
          <div className="text-xs text-slate-300 space-y-1">
            <p className="font-bold text-white text-sm">
              {order.delivery_address.recipient_name}
            </p>
            <p>{order.delivery_address.line1}</p>
            {order.delivery_address.line2 && <p>{order.delivery_address.line2}</p>}
            <p>
              {order.delivery_address.city}, {order.delivery_address.state}{" "}
              {order.delivery_address.postal_code}
            </p>
            <p>{order.delivery_address.country}</p>
            <p className="text-slate-400 pt-1">Contact: {order.delivery_address.phone}</p>
          </div>

          {order.notes && (
            <div className="mt-4 pt-4 border-t border-white/[0.06]">
              <span className="block text-xs font-semibold text-slate-400">
                Instructions for Courier:
              </span>
              <p className="text-xs text-indigo-300 italic mt-0.5">{order.notes}</p>
            </div>
          )}
        </GlassCard>

        {/* Financial Breakdown */}
        <GlassCard className="p-6">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-indigo-400" /> Escrow Payment Breakdown
          </h3>
          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="flex justify-between">
              <span>Items Gross Subtotal</span>
              <span className="font-semibold text-white">${(order.subtotal / 100).toFixed(2)}</span>
            </div>

            {order.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-400 font-semibold">
                <span>Coupon Savings ({order.coupon_code || "PROMO"})</span>
                <span>-${(order.discount_amount / 100).toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span className="font-semibold text-white">${(order.delivery_fee / 100).toFixed(2)}</span>
            </div>

            <div className="pt-3 border-t border-white/[0.08] flex justify-between items-baseline font-bold text-white text-sm">
              <span>Total Charged</span>
              <span className="text-xl font-black text-indigo-300">
                ${(order.total / 100).toFixed(2)}
              </span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Cancel Order Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <GlassCard className="max-w-md w-full p-6 shadow-2xl bg-slate-900/95 border border-white/[0.15]">
            <h3 className="text-base font-black text-white">Cancel Order #{order.order_number}?</h3>
            <p className="text-xs text-slate-400 mt-1">
              Cancelling this order will automatically release all reserved items back into available stock.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Reason for cancellation (optional)
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ordered by mistake, changed delivery location..."
                className="liquid-glass-input w-full text-xs"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={isCancelling}
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                Keep Order
              </button>
              <GlassButton
                type="button"
                size="sm"
                variant="danger"
                isLoading={isCancelling}
                onClick={handleCancelOrder}
              >
                Confirm Cancellation
              </GlassButton>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
