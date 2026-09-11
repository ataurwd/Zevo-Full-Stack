"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  Clock,
  CheckCircle2,
  ChefHat,
  Truck,
  Building2,
  Eye,
  AlertCircle,
  ShoppingBag,
  DollarSign,
} from "lucide-react";
import {
  getSellerSubOrders,
  updateSubOrderStatus,
  SubOrder,
} from "@/lib/api/orders";
import { getAccessToken } from "@/lib/api/client";

export default function SellerOrdersPage() {
  const router = useRouter();
  const [subOrders, setSubOrders] = useState<SubOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Selected sub-order for detail modal
  const [selectedSubOrder, setSelectedSubOrder] = useState<SubOrder | null>(null);

  const loadSubOrders = async () => {
    setIsLoading(true);
    try {
      const res = await getSellerSubOrders({
        status: activeTab === "all" ? undefined : activeTab,
      });
      setSubOrders(res.subOrders);
      setTotal(res.total);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load seller orders");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push("/login?redirect=/seller/orders");
      return;
    }
    loadSubOrders();
  }, [router, activeTab]);

  const handleStatusUpdate = async (
    subOrderId: string,
    action: "confirm" | "preparing" | "ready"
  ) => {
    setActionLoadingId(subOrderId);
    setErrorMsg(null);
    try {
      const updated = await updateSubOrderStatus(subOrderId, action);
      setSubOrders((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      if (selectedSubOrder?.id === updated.id) {
        setSelectedSubOrder(updated);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update sub-order status");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Metrics
  const pendingCount = subOrders.filter((s) => s.status === "pending").length;
  const confirmedCount = subOrders.filter((s) => s.status === "confirmed").length;
  const preparingCount = subOrders.filter((s) => s.status === "preparing").length;
  const readyCount = subOrders.filter((s) => s.status === "ready_for_pickup").length;

  const tabs = [
    { id: "all", label: "All Orders" },
    { id: "pending", label: "Pending" },
    { id: "confirmed", label: "Confirmed" },
    { id: "preparing", label: "Preparing" },
    { id: "ready_for_pickup", label: "Ready for Pickup" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3 h-3" /> Confirmed
          </span>
        );
      case "preparing":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <ChefHat className="w-3 h-3" /> Preparing
          </span>
        );
      case "ready_for_pickup":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Truck className="w-3 h-3" /> Ready
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 capitalize">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Seller Order Fulfillment
          </h1>
          <p className="text-slate-600 mt-1">
            Manage your store orders, advance fulfillment stages, and monitor payouts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/seller/inventory"
            className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition"
          >
            Inventory Management
          </Link>
          <Link
            href="/seller/dashboard"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition"
          >
            Seller Hub
          </Link>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Sub-Orders</span>
            <Package className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{total}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Needs Confirmation</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{pendingCount}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">In Preparation</span>
            <ChefHat className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-600">{preparingCount}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Ready for Pickup</span>
            <Truck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{readyCount}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 mb-6 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap transition ${
              activeTab === tab.id
                ? "bg-indigo-50 text-indigo-600"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : subOrders.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No sub-orders found</h3>
            <p className="text-xs text-slate-500 mt-1">
              There are no orders currently matching the selected filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <th className="py-3.5 px-6">Sub-Order #</th>
                  <th className="py-3.5 px-6">Placed At</th>
                  <th className="py-3.5 px-6">Items</th>
                  <th className="py-3.5 px-6">Your Earnings</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subOrders.map((sub) => {
                  const isActionLoading = actionLoadingId === sub.id;

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-4 px-6 font-bold text-slate-900 font-mono">
                        {sub.order_number}
                      </td>

                      <td className="py-4 px-6 text-slate-600">
                        {new Date(sub.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      <td className="py-4 px-6">
                        <button
                          type="button"
                          onClick={() => setSelectedSubOrder(sub)}
                          className="font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                        >
                          {sub.items.length} item(s)
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>

                      <td className="py-4 px-6 font-bold text-emerald-600">
                        ${(sub.seller_earnings / 100).toFixed(2)}
                      </td>

                      <td className="py-4 px-6">{getStatusBadge(sub.status)}</td>

                      <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                        {sub.status === "pending" && (
                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => handleStatusUpdate(sub.id, "confirm")}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs shadow-sm transition disabled:opacity-50"
                          >
                            {isActionLoading ? "Saving..." : "Confirm"}
                          </button>
                        )}

                        {sub.status === "confirmed" && (
                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => handleStatusUpdate(sub.id, "preparing")}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-xs shadow-sm transition disabled:opacity-50"
                          >
                            {isActionLoading ? "Saving..." : "Mark Preparing"}
                          </button>
                        )}

                        {sub.status === "preparing" && (
                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => handleStatusUpdate(sub.id, "ready")}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs shadow-sm transition disabled:opacity-50"
                          >
                            {isActionLoading ? "Saving..." : "Ready for Pickup"}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedSubOrder(sub)}
                          className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg font-medium text-xs transition"
                        >
                          View
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Sub-Order #{selectedSubOrder.order_number}
                </h3>
                <span className="text-xs text-slate-500">
                  Status: {selectedSubOrder.status.replace("_", " ")}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubOrder(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Item List */}
            <div className="py-4 space-y-3 max-h-60 overflow-y-auto">
              {selectedSubOrder.items.map((item) => (
                <div
                  key={item.variant_id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                      ) : (
                        <ShoppingBag className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{item.product_name}</h4>
                      <p className="text-slate-500 font-mono">
                        {item.sku} • {item.variant_name} × {item.quantity}
                      </p>
                    </div>
                  </div>

                  <span className="font-bold text-slate-900">
                    ${((item.unit_price * item.quantity) / 100).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Financial breakdown */}
            <div className="pt-3 border-t border-slate-100 text-xs space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Gross Subtotal:</span>
                <span>${(selectedSubOrder.subtotal / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Platform Commission ({selectedSubOrder.commission_rate}%):</span>
                <span>-${(selectedSubOrder.platform_commission / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-slate-100 font-bold text-slate-900 text-sm">
                <span>Your Net Earnings:</span>
                <span className="text-emerald-600">
                  ${(selectedSubOrder.seller_earnings / 100).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSubOrder(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
