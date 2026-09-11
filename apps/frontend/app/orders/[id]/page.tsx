"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  MapPin,
  CreditCard,
  Truck,
  Building2,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { getOrderById, cancelOrder, Order } from "@/lib/api/orders";
import { getAccessToken } from "@/lib/api/client";

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (errorMsg && !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Order Not Found</h2>
        <p className="text-slate-600 mt-1">{errorMsg}</p>
        <Link
          href="/orders"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold"
        >
          <ChevronLeft className="w-4 h-4" /> Back to My Orders
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
        <div className="mb-8 p-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold">Order Placed Successfully!</h3>
              <p className="text-emerald-100 text-sm mt-0.5">
                Thank you! Your order #{order.order_number} has been recorded and sellers have been notified.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to My Orders
        </Link>

        {order.status === "pending" && (
          <button
            type="button"
            onClick={() => setCancelModalOpen(true)}
            className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-xl transition"
          >
            Cancel Order
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Order Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-8">
        {/* Header */}
        <div className="p-6 sm:p-8 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Order #{order.order_number}
              </h1>
              {isCancelled ? (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  Cancelled
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                  {order.status}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Placed on {new Date(order.created_at).toLocaleString()} • Currency: {order.currency.toUpperCase()}
            </p>
          </div>

          <div className="text-right">
            <span className="block text-xs font-medium text-slate-400">Total Paid</span>
            <span className="text-2xl font-black text-slate-900">
              ${(order.total / 100).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Stepper */}
        {!isCancelled ? (
          <div className="p-6 sm:p-8 border-b border-slate-200 bg-white">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">
              Fulfillment Status
            </h3>
            <div className="relative flex items-center justify-between">
              {/* Connector line */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-200 z-0" />
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 z-0 transition-all duration-500"
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
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                        isPassed
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                          : "bg-slate-200 text-slate-500"
                      } ${isCurrent ? "ring-4 ring-indigo-100 scale-110" : ""}`}
                    >
                      {isPassed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>
                    <span
                      className={`mt-2 text-xs whitespace-nowrap ${
                        isPassed ? "font-bold text-slate-900" : "font-medium text-slate-400"
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
          <div className="p-6 bg-rose-50/50 border-b border-slate-200 flex items-center gap-3 text-sm text-rose-800">
            <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <div>
              <span className="font-bold">This order was cancelled.</span>
              {order.cancellation_reason && (
                <span className="block text-xs text-rose-600 mt-0.5">
                  Reason: {order.cancellation_reason}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Sub-Orders Grid */}
        <div className="p-6 sm:p-8 divide-y divide-slate-100">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Items by Vendor Sub-Order
          </h3>

          {order.sub_orders?.map((sub) => (
            <div key={sub.id} className="py-6 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-bold text-slate-900">
                    Sub-Order #{sub.order_number}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 capitalize">
                  Status: {sub.status.replace("_", " ")}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-100">
                      <th className="pb-2 font-medium">Item</th>
                      <th className="pb-2 font-medium">SKU</th>
                      <th className="pb-2 font-medium">Unit Price</th>
                      <th className="pb-2 font-medium">Qty</th>
                      <th className="pb-2 font-medium text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {sub.items.map((item) => (
                      <tr key={item.variant_id}>
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {item.image_url ? (
                                <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                              ) : (
                                <ShoppingBag className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{item.product_name}</div>
                              <div className="text-slate-500">{item.variant_name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 font-mono text-slate-500">{item.sku}</td>
                        <td className="py-3 font-medium text-slate-800">
                          ${(item.unit_price / 100).toFixed(2)}
                        </td>
                        <td className="py-3 font-semibold text-slate-800">{item.quantity}</td>
                        <td className="py-3 font-bold text-slate-900 text-right">
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
      </div>

      {/* Bottom 2-Column Info (Shipping & Breakdown) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Shipping Address & Notes */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-indigo-600" /> Shipping Address
          </h3>
          <div className="text-xs text-slate-600 space-y-1">
            <p className="font-bold text-slate-900 text-sm">
              {order.delivery_address.recipient_name}
            </p>
            <p>{order.delivery_address.line1}</p>
            {order.delivery_address.line2 && <p>{order.delivery_address.line2}</p>}
            <p>
              {order.delivery_address.city}, {order.delivery_address.state}{" "}
              {order.delivery_address.postal_code}
            </p>
            <p>{order.delivery_address.country}</p>
            <p className="text-slate-500 pt-1">Phone: {order.delivery_address.phone}</p>
          </div>

          {order.notes && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <span className="block text-xs font-semibold text-slate-500">
                Delivery Instructions:
              </span>
              <p className="text-xs text-slate-700 italic mt-0.5">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Financial Summary */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-indigo-600" /> Payment & Summary
          </h3>
          <div className="space-y-2.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Items Subtotal</span>
              <span>${(order.subtotal / 100).toFixed(2)}</span>
            </div>

            {order.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Coupon Savings ({order.coupon_code || "PROMO"})</span>
                <span>-${(order.discount_amount / 100).toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span>${(order.delivery_fee / 100).toFixed(2)}</span>
            </div>

            <div className="pt-2.5 border-t border-slate-200 flex justify-between items-baseline font-bold text-slate-900 text-sm">
              <span>Grand Total</span>
              <span className="text-lg text-indigo-600">${(order.total / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Order Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Cancel Order #{order.order_number}?</h3>
            <p className="text-xs text-slate-500 mt-1">
              Cancelling this order will release all reserved items back into inventory. This action cannot be undone.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for cancellation (optional)
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g., Ordered by mistake, found alternative"
                className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={isCancelling}
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Keep Order
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={handleCancelOrder}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm flex items-center gap-1.5"
              >
                {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
