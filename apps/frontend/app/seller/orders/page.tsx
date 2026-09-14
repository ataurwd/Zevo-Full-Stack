"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  Clock,
  CheckCircle2,
  ChefHat,
  Truck,
  Eye,
  AlertCircle,
  ShoppingBag,
  MessageSquare,
  X,
  Phone,
  MapPin,
  FileText,
  DollarSign,
  ArrowRight,
  RefreshCw,
  Ban,
  Check,
  Building2,
} from "lucide-react";
import {
  getSellerSubOrders,
  updateSubOrderStatus,
  SubOrder,
  notifyOrdersSync,
} from "@/lib/api/orders";
import { getAccessToken } from "@/lib/api/client";
import { Bike, Sparkles, CheckCheck } from "lucide-react";
// Centralized dispatch handles rider allocation

export default function SellerOrdersPage() {
  const router = useRouter();
  const [subOrders, setSubOrders] = useState<SubOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Selected sub-order for detail modal
  const [selectedSubOrder, setSelectedSubOrder] = useState<SubOrder | null>(null);
  const [chatTarget, setChatTarget] = useState<{ id: string; name: string; role: "customer" } | null>(null);

  // Cancel order modal
  const [cancelTargetSubOrder, setCancelTargetSubOrder] = useState<SubOrder | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  const loadSubOrders = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await getSellerSubOrders({
        status: activeTabRef.current === "all" ? undefined : activeTabRef.current,
      });
      setSubOrders(res.subOrders || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      if (!isSilent) {
        setErrorMsg(err.message || "Failed to load seller orders");
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push("/login?redirect=/seller/orders");
      return;
    }
    loadSubOrders(false);
  }, [router, activeTab, loadSubOrders]);

  // Multi-tier real-time sync
  useEffect(() => {
    // 1. BroadcastChannel listener
    let channel: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      channel = new BroadcastChannel("nexora_orders_sync");
      channel.onmessage = () => {
        loadSubOrders(true);
      };
    }

    // 2. Storage event listener (cross-tab)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "nexora_orders_updated") {
        loadSubOrders(true);
      }
    };
    window.addEventListener("storage", handleStorage);

    // 3. Window focus & visibilitychange
    return () => {
      if (channel) channel.close();
      window.removeEventListener("storage", handleStorage);
    };
  }, [loadSubOrders]);

  const handleStatusUpdate = async (
    subOrderId: string,
    action: "confirm" | "preparing" | "ready" | "ship" | "deliver"
  ) => {
    setActionLoadingId(subOrderId);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const updated = await updateSubOrderStatus(subOrderId, action);
      setSubOrders((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      if (selectedSubOrder?.id === updated.id) {
        setSelectedSubOrder(updated);
      }
      notifyOrdersSync();

      const actionLabels: Record<string, string> = {
        confirm: "Order confirmed successfully!",
        preparing: "Order marked as In Preparation.",
        ready: "Order is packed and Ready for Courier.",
        ship: "Order marked as Dispatched / In Transit.",
        deliver: "Order marked as Delivered successfully!",
      };
      setSuccessMsg(actionLabels[action] || "Status updated successfully.");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update sub-order status");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelTargetSubOrder) return;
    setIsSubmittingCancel(true);
    setErrorMsg(null);
    try {
      const updated = await updateSubOrderStatus(
        cancelTargetSubOrder.id,
        "cancel",
        cancelReason.trim() || "Seller was unable to fulfill this package"
      );
      setSubOrders((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      if (selectedSubOrder?.id === updated.id) {
        setSelectedSubOrder(updated);
      }
      notifyOrdersSync();
      setCancelTargetSubOrder(null);
      setCancelReason("");
      setSuccessMsg(`Package #${updated.order_number} has been cancelled.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to cancel sub-order");
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  // Metrics
  const pendingCount = subOrders.filter((s) => s.status === "pending").length;
  const confirmedCount = subOrders.filter((s) => s.status === "confirmed").length;
  const preparingCount = subOrders.filter((s) => s.status === "preparing").length;
  const readyCount = subOrders.filter((s) => s.status === "ready_for_pickup").length;
  const deliveredCount = subOrders.filter((s) => s.status === "delivered").length;
  const totalEarningsCents = subOrders
    .filter((s) => s.status !== "cancelled")
    .reduce((sum, s) => sum + (s.seller_earnings || 0), 0);

  const tabs = [
    { id: "all", label: "All Orders", count: total },
    { id: "pending", label: "Pending Confirm", count: pendingCount },
    { id: "confirmed", label: "Confirmed", count: confirmedCount },
    { id: "preparing", label: "Preparing", count: preparingCount },
    { id: "ready_for_pickup", label: "Ready for Courier", count: readyCount },
    { id: "delivered", label: "Delivered", count: deliveredCount },
  ];

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Pending Action
          </span>
        );
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
            <Check className="w-3.5 h-3.5 text-sky-600" />
            Confirmed
          </span>
        );
      case "preparing":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
            <ChefHat className="w-3.5 h-3.5 text-indigo-600" />
            Preparing
          </span>
        );
      case "ready_for_pickup":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-[#00A86B] border border-[#A2E4B8]">
            <Truck className="w-3.5 h-3.5 text-[#00A86B]" />
            Ready for Courier
          </span>
        );
      case "picked_up":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
            <Truck className="w-3.5 h-3.5 text-teal-600" />
            In Transit
          </span>
        );
      case "delivered":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            Delivered
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <Ban className="w-3.5 h-3.5 text-rose-500" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 capitalize">
            {status.replace(/_/g, " ")}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#D1E7D8] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[#E8F8EE] text-[#00A86B] font-mono text-[11px] font-bold border border-[#A2E4B8]">
              Merchant Orders
            </span>
            <span className="text-xs text-[#0A504A]/70 font-medium">
              Multi-Vendor Fulfillment
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0A504A] tracking-tight">
            Store Orders & Package Pipeline
          </h1>
          <p className="text-xs sm:text-sm text-[#0A504A]/70 mt-1 font-medium">
            You only receive orders for products added by your store. Review line items, confirm orders, and prepare packages for courier pickup.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => loadSubOrders(false)}
            disabled={isRefreshing || isLoading}
            className="px-3.5 py-2 rounded-2xl bg-white border border-[#D1E7D8] hover:bg-[#E8F8EE] text-xs font-bold text-[#0A504A] transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#00A86B]" : ""}`} />
            <span>{isRefreshing ? "Syncing..." : "Refresh Feed"}</span>
          </button>

          <Link
            href="/seller/inventory"
            className="px-4 py-2 rounded-2xl bg-[#00A86B] hover:bg-[#088758] text-white text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1"
          >
            <span>Manage Inventory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00A86B] shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-600 hover:text-emerald-900 cursor-pointer text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-rose-600 hover:text-rose-900 cursor-pointer text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-[#D1E7D8] shadow-2xs hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#0A504A]/70">Pending Confirm</span>
            <div className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#D1E7D8] shadow-2xs hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#0A504A]/70">In Preparation</span>
            <div className="text-2xl font-black text-indigo-600 mt-1">{preparingCount}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shrink-0">
            <ChefHat className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#D1E7D8] shadow-2xs hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#0A504A]/70">Ready for Courier</span>
            <div className="text-2xl font-black text-[#00A86B] mt-1">{readyCount}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#00A86B] border border-emerald-200 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#D1E7D8] shadow-2xs hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#0A504A]/70">Store Payout Balance</span>
            <div className="text-2xl font-black text-[#0A504A] mt-1">
              $${(totalEarningsCents / 100).toFixed(2)}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#E8F8EE] text-[#00A86B] border border-[#A2E4B8] flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#D1E7D8] pb-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-bold rounded-2xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === tab.id
                ? "bg-[#0A504A] text-white shadow-2xs"
                : "text-[#0A504A]/70 hover:text-[#0A504A] hover:bg-white"
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  activeTab === tab.id
                    ? "bg-[#00A86B] text-white"
                    : "bg-[#E8F8EE] text-[#00A86B]"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-[#D1E7D8] shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00A86B]"></div>
            <p className="text-xs font-medium text-[#0A504A]/70">Loading store orders...</p>
          </div>
        ) : subOrders.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#E8F8EE] text-[#00A86B] flex items-center justify-center mx-auto mb-3">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#0A504A]">No store orders found</h3>
            <p className="text-xs text-[#0A504A]/60 mt-1 max-w-sm mx-auto">
              When customers purchase products added by your merchant account, they will automatically appear here for fulfillment.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#F4FAF6] border-b border-[#D1E7D8] text-[#0A504A] uppercase font-bold text-[11px] tracking-wider">
                  <th className="py-4 px-6">Package #</th>
                  <th className="py-4 px-6">Placed At</th>
                  <th className="py-4 px-6">Recipient & Dropoff</th>
                  <th className="py-4 px-6">Your Products</th>
                  <th className="py-4 px-6">Net Payout</th>
                  <th className="py-4 px-6">Fulfillment Status</th>
                  <th className="py-4 px-6 text-right">Merchant Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1E7D8]/60">
                {subOrders.map((sub) => {
                  const isActionLoading = actionLoadingId === sub.id;

                  return (
                    <tr key={sub.id} className="hover:bg-[#F4FAF6]/50 transition">
                      {/* Package # */}
                      <td className="py-4 px-6 font-bold text-[#0A504A] font-mono whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-[#00A86B]" />
                          <span>{sub.order_number}</span>
                        </div>
                      </td>

                      {/* Placed At */}
                      <td className="py-4 px-6 text-slate-600 font-medium whitespace-nowrap">
                        {new Date(sub.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      {/* Recipient & Dropoff */}
                      <td className="py-4 px-6">
                        {sub.delivery_address ? (
                          <div>
                            <div className="font-bold text-[#0A504A]">
                              {sub.delivery_address.recipient_name}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                              {sub.delivery_address.city}, {sub.delivery_address.state}
                            </div>
                            {sub.delivery_address.phone && (
                              <div className="text-[11px] text-[#00A86B] font-mono mt-0.5">
                                {sub.delivery_address.phone}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Customer details recorded</span>
                        )}
                      </td>

                      {/* Products */}
                      <td className="py-4 px-6">
                        <button
                          type="button"
                          onClick={() => setSelectedSubOrder(sub)}
                          className="font-bold text-[#00A86B] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>{sub.items.length} item(s)</span>
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <div className="text-[11px] text-slate-500 truncate max-w-[160px] mt-0.5">
                          {sub.items[0]?.product_name}
                          {sub.items.length > 1 ? ` + ${sub.items.length - 1} more` : ""}
                        </div>
                      </td>

                      {/* Net Payout */}
                      <td className="py-4 px-6 font-extrabold text-[#00A86B] whitespace-nowrap">
                        $${(sub.seller_earnings / 100).toFixed(2)}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 whitespace-nowrap">{renderStatusBadge(sub.status)}</td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap space-x-2">
                        {/* Status update buttons */}
                        {sub.status === "pending" && (
                          <>
                            <button
                              type="button"
                              disabled={isActionLoading}
                              onClick={() => handleStatusUpdate(sub.id, "confirm")}
                              className="px-3 py-1.5 rounded-xl bg-[#00A86B] hover:bg-[#088758] text-white text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                            >
                              {isActionLoading ? "Updating..." : "Confirm Order"}
                            </button>
                            <button
                              type="button"
                              disabled={isActionLoading}
                              onClick={() => setCancelTargetSubOrder(sub)}
                              className="px-2.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {sub.status === "confirmed" && (
                          <>
                            <button
                              type="button"
                              disabled={isActionLoading}
                              onClick={() => handleStatusUpdate(sub.id, "preparing")}
                              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                            >
                              {isActionLoading ? "Updating..." : "Mark Preparing"}
                            </button>
                            <button
                              type="button"
                              disabled={isActionLoading}
                              onClick={() => setCancelTargetSubOrder(sub)}
                              className="px-2 py-1.5 rounded-xl text-rose-500 hover:bg-rose-50 text-xs font-medium transition cursor-pointer"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        {sub.status === "preparing" && (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={isActionLoading}
                              onClick={() => handleStatusUpdate(sub.id, "ready")}
                              className="px-3 py-1.5 rounded-xl bg-[#0A504A] hover:bg-[#083c37] text-white text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                            >
                              {isActionLoading ? "Updating..." : "Ready for Courier"}
                            </button>
                            <button
                              type="button"
                              disabled={isActionLoading}
                              onClick={() => setCancelTargetSubOrder(sub)}
                              className="px-2 py-1.5 rounded-xl text-rose-500 hover:bg-rose-50 text-xs font-medium transition cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        )}

                        {sub.status === "ready_for_pickup" && (
                          <>
                            <button
                              type="button"
                              disabled={isActionLoading}
                              onClick={() => handleStatusUpdate(sub.id, "ship")}
                              className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                            >
                              {isActionLoading ? "Updating..." : "Dispatch / In Transit"}
                            </button>
                            <button
                              type="button"
                              disabled={isActionLoading}
                              onClick={() => handleStatusUpdate(sub.id, "deliver")}
                              className="px-3 py-1.5 rounded-xl bg-[#00A86B] hover:bg-[#088758] text-white text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                            >
                              {isActionLoading ? "Updating..." : "Mark Delivered"}
                            </button>
                          </>
                        )}

                        {sub.status === "picked_up" && (
                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => handleStatusUpdate(sub.id, "deliver")}
                            className="px-3 py-1.5 rounded-xl bg-[#00A86B] hover:bg-[#088758] text-white text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                          >
                            {isActionLoading ? "Updating..." : "Mark Delivered"}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedSubOrder(sub)}
                          className="px-3 py-1.5 rounded-xl border border-[#D1E7D8] hover:bg-[#E8F8EE] text-[#0A504A] font-bold text-xs transition cursor-pointer"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sub-Order Detail Modal */}
      {selectedSubOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-xl w-full p-6 sm:p-7 rounded-3xl bg-white border border-[#D1E7D8] shadow-2xl space-y-5 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#D1E7D8]">
              <div>
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#00A86B]" />
                  <h3 className="text-base sm:text-lg font-black text-[#0A504A]">
                    Package #{selectedSubOrder.order_number}
                  </h3>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-500">
                    Placed on: {new Date(selectedSubOrder.created_at).toLocaleString()}
                  </span>
                  <span className="text-slate-300">•</span>
                  {renderStatusBadge(selectedSubOrder.status)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Customer Delivery Information */}
            {selectedSubOrder.delivery_address && (
              <div className="p-4 rounded-2xl bg-[#F4FAF6] border border-[#D1E7D8] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A504A] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#00A86B]" />
                      Customer Delivery Destination
                    </span>
                    {selectedSubOrder.customer_id && (
                      <button
                        type="button"
                        onClick={() =>
                          setChatTarget({
                            id: selectedSubOrder.customer_id!,
                            name: selectedSubOrder.delivery_address?.recipient_name || "Customer",
                            role: "customer",
                          })
                        }
                        className="px-3 py-1 rounded-xl bg-[#00A86B] hover:bg-[#0A504A] text-white text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Chat with Buyer</span>
                      </button>
                    )}
                  </div>
                  {selectedSubOrder.delivery_address.phone && (
                    <a
                      href={`tel:${selectedSubOrder.delivery_address.phone}`}
                      className="text-xs font-bold text-[#00A86B] hover:underline flex items-center gap-1 font-mono"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{selectedSubOrder.delivery_address.phone}</span>
                    </a>
                  )}
                </div>
                <div className="text-xs text-slate-700">
                  <p className="font-bold text-[#0A504A] text-sm">
                    {selectedSubOrder.delivery_address.recipient_name}
                  </p>
                  <p className="text-slate-600 mt-0.5">
                    {selectedSubOrder.delivery_address.line1}
                    {selectedSubOrder.delivery_address.line2 ? `, ${selectedSubOrder.delivery_address.line2}` : ""},{" "}
                    {selectedSubOrder.delivery_address.city}, {selectedSubOrder.delivery_address.state}{" "}
                    {selectedSubOrder.delivery_address.postal_code}, {selectedSubOrder.delivery_address.country}
                  </p>
                </div>
                {selectedSubOrder.customer_notes && (
                  <div className="mt-2 pt-2 border-t border-[#D1E7D8]/60 text-[11px] text-slate-600 flex items-start gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#0A504A]/60 shrink-0 mt-0.5" />
                    <span>Customer Note: {selectedSubOrder.customer_notes}</span>
                  </div>
                )}
              </div>
            )}

            {/* Items Included */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A504A]/70 block mb-2">
                Your Store Items in this Package ({selectedSubOrder.items.length})
              </span>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {selectedSubOrder.items.map((item) => (
                  <div
                    key={item.variant_id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white border border-[#D1E7D8] text-xs hover:border-[#00A86B]/40 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-slate-50 border border-[#D1E7D8] flex items-center justify-center overflow-hidden shrink-0">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.product_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ShoppingBag className="w-4 h-4 text-[#0A504A]/60" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-[#0A504A]">{item.product_name}</h4>
                        <p className="text-slate-500 text-[11px] font-mono mt-0.5">
                          {item.sku} • {item.variant_name} × {item.quantity}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-[#0A504A] block">
                        $${((item.unit_price * item.quantity) / 100).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        $${(item.unit_price / 100).toFixed(2)} each
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Breakdown */}
            <div className="pt-3 border-t border-[#D1E7D8] text-xs space-y-1.5 text-[#0A504A]">
              <div className="flex justify-between font-medium">
                <span>Gross Items Subtotal:</span>
                <span className="font-mono">$${(selectedSubOrder.subtotal / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-rose-600 font-medium">
                <span>Platform Commission ({selectedSubOrder.commission_rate}%):</span>
                <span className="font-mono">-$${(selectedSubOrder.platform_commission / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#D1E7D8] font-black text-sm text-[#0A504A]">
                <span>Net Seller Payout Balance:</span>
                <span className="text-[#00A86B] font-mono text-base font-black">
                  $${(selectedSubOrder.seller_earnings / 100).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Courier / Rider Dispatch Section (Managed by Central Support & Dispatch) */}
            <div className="p-4 rounded-2xl bg-[#E8F8EE]/60 border border-[#00A86B]/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#00A86B] text-white flex items-center justify-center font-bold">
                    <Bike className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#0A504A]">Courier Rider Allocation</h4>
                    <p className="text-[10px] text-[#0A504A]/70">
                      Coordinated centrally by Nexora Support & Dispatch team
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-[#E8F8EE] text-[#00A86B] border border-[#A2E4B8]">
                  {selectedSubOrder.assigned_rider ? "Dispatched" : "Pending Allocation"}
                </span>
              </div>

              {selectedSubOrder.assigned_rider ? (
                <div className="p-3 rounded-xl bg-white border border-[#D1E7D8] flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-[#0A504A] flex items-center gap-2">
                      <span>{selectedSubOrder.assigned_rider.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E8F8EE] text-[#00A86B]">
                        Assigned Courier
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-2">
                      <span className="capitalize">{selectedSubOrder.assigned_rider.vehicle_type} ({selectedSubOrder.assigned_rider.vehicle_number || "NX-RIDER"})</span>
                      <span>•</span>
                      <span>{selectedSubOrder.assigned_rider.phone || "Verified Courier"}</span>
                    </div>
                    {selectedSubOrder.assigned_rider.delivery_zones?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        <span className="text-[9px] text-gray-400 font-bold">Delivery Zones:</span>
                        {selectedSubOrder.assigned_rider.delivery_zones.map((z: string, i: number) => (
                          <span key={i} className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {z}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-center gap-2 font-medium">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>A delivery courier will be allocated to this package by Support Dispatch once ready.</span>
                </div>
              )}
            </div>

            {/* In-Modal Actions */}
            <div className="pt-4 border-t border-[#D1E7D8] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {selectedSubOrder.status === "pending" && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate(selectedSubOrder.id, "confirm")}
                      className="px-4 py-2 rounded-2xl bg-[#00A86B] hover:bg-[#088758] text-white text-xs font-bold transition shadow-2xs cursor-pointer"
                    >
                      Confirm Order
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCancelTargetSubOrder(selectedSubOrder);
                        setSelectedSubOrder(null);
                      }}
                      className="px-3 py-2 rounded-2xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition cursor-pointer"
                    >
                      Reject
                    </button>
                  </>
                )}

                {selectedSubOrder.status === "confirmed" && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate(selectedSubOrder.id, "preparing")}
                      className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer"
                    >
                      Start Preparing
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCancelTargetSubOrder(selectedSubOrder);
                        setSelectedSubOrder(null);
                      }}
                      className="px-3 py-2 rounded-2xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition cursor-pointer"
                    >
                      Reject Order
                    </button>
                  </div>
                )}

                {selectedSubOrder.status === "preparing" && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate(selectedSubOrder.id, "ready")}
                      className="px-4 py-2 rounded-2xl bg-[#0A504A] hover:bg-[#083c37] text-white text-xs font-bold transition shadow-2xs cursor-pointer"
                    >
                      Ready for Courier
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCancelTargetSubOrder(selectedSubOrder);
                        setSelectedSubOrder(null);
                      }}
                      className="px-3 py-2 rounded-2xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition cursor-pointer"
                    >
                      Reject Order
                    </button>
                  </div>
                )}

                {selectedSubOrder.status === "ready_for_pickup" && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate(selectedSubOrder.id, "ship")}
                      className="px-4 py-2 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer"
                    >
                      Dispatch / In Transit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate(selectedSubOrder.id, "deliver")}
                      className="px-4 py-2 rounded-2xl bg-[#00A86B] hover:bg-[#088758] text-white text-xs font-bold transition shadow-2xs cursor-pointer"
                    >
                      Mark Delivered
                    </button>
                  </>
                )}

                {selectedSubOrder.status === "picked_up" && (
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate(selectedSubOrder.id, "deliver")}
                    className="px-4 py-2 rounded-2xl bg-[#00A86B] hover:bg-[#088758] text-white text-xs font-bold transition shadow-2xs cursor-pointer"
                  >
                    Mark Delivered
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedSubOrder(null)}
                className="px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {cancelTargetSubOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-3xl bg-white border border-rose-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Reject Package #{cancelTargetSubOrder.order_number}?
                </h3>
                <p className="text-xs text-slate-500">
                  Reserved stock will automatically be released back into inventory.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Reason for cancellation (optional):
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g., Item out of stock, Store temporarily closed..."
                rows={3}
                className="w-full p-3 rounded-2xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCancelTargetSubOrder(null);
                  setCancelReason("");
                }}
                disabled={isSubmittingCancel}
                className="px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Keep Order
              </button>

              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isSubmittingCancel}
                className="px-4 py-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer disabled:opacity-50"
              >
                {isSubmittingCancel ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
