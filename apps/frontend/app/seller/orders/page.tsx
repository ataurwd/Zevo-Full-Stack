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
} from "lucide-react";
import {
  getSellerSubOrders,
  updateSubOrderStatus,
  SubOrder,
} from "@/lib/api/orders";
import { getAccessToken } from "@/lib/api/client";
import { GlassCard, GlassButton, GlassBadge } from "@/components/ui";

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

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <GlassBadge variant="amber">Pending</GlassBadge>;
      case "confirmed":
        return <GlassBadge variant="cyan">Confirmed</GlassBadge>;
      case "preparing":
        return <GlassBadge variant="indigo">Preparing</GlassBadge>;
      case "ready_for_pickup":
        return <GlassBadge variant="emerald">Ready for Courier</GlassBadge>;
      default:
        return <GlassBadge variant="slate">{status}</GlassBadge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <GlassBadge variant="cyan">Vendor Operations</GlassBadge>
            <span className="text-xs text-slate-400">Merchant Hub</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Order Fulfillment Pipeline
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Accept store orders, prepare packages, and trigger courier handoffs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/seller/inventory">
            <GlassButton variant="secondary" size="sm">
              Manage Inventory
            </GlassButton>
          </Link>
          <Link href="/seller/dashboard">
            <GlassButton size="sm">Seller Hub</GlassButton>
          </Link>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2 backdrop-blur-md">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <GlassCard interactive glow="indigo" className="p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total Sub-Orders</span>
            <Package className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">{total}</div>
        </GlassCard>

        <GlassCard interactive glow="amber" className="p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Pending Confirm</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{pendingCount}</div>
        </GlassCard>

        <GlassCard interactive glow="cyan" className="p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">In Preparation</span>
            <ChefHat className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400">{preparingCount}</div>
        </GlassCard>

        <GlassCard interactive glow="emerald" className="p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Ready for Pickup</span>
            <Truck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{readyCount}</div>
        </GlassCard>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] mb-6 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                : "text-slate-400 hover:text-white hover:bg-white/[0.05]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <GlassCard className="overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
          </div>
        ) : subOrders.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white">No sub-orders found</h3>
            <p className="text-xs text-slate-400 mt-1">
              There are no orders currently matching the selected filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950/40 border-b border-white/[0.06] text-slate-400 uppercase font-semibold text-[11px]">
                  <th className="py-3.5 px-6">Sub-Order #</th>
                  <th className="py-3.5 px-6">Placed At</th>
                  <th className="py-3.5 px-6">Items</th>
                  <th className="py-3.5 px-6">Net Earnings</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Fulfillment Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {subOrders.map((sub) => {
                  const isActionLoading = actionLoadingId === sub.id;

                  return (
                    <tr key={sub.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-4 px-6 font-bold text-white font-mono">
                        {sub.order_number}
                      </td>

                      <td className="py-4 px-6 text-slate-300">
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
                          className="font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                        >
                          {sub.items.length} item(s)
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>

                      <td className="py-4 px-6 font-bold text-emerald-400">
                        ${(sub.seller_earnings / 100).toFixed(2)}
                      </td>

                      <td className="py-4 px-6">{renderStatusBadge(sub.status)}</td>

                      <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                        {sub.status === "pending" && (
                          <GlassButton
                            size="sm"
                            isLoading={isActionLoading}
                            onClick={() => handleStatusUpdate(sub.id, "confirm")}
                          >
                            Confirm Order
                          </GlassButton>
                        )}

                        {sub.status === "confirmed" && (
                          <GlassButton
                            size="sm"
                            variant="secondary"
                            isLoading={isActionLoading}
                            onClick={() => handleStatusUpdate(sub.id, "preparing")}
                            className="bg-indigo-600/30 text-indigo-200 border-indigo-500/40 hover:bg-indigo-600/50"
                          >
                            Mark Preparing
                          </GlassButton>
                        )}

                        {sub.status === "preparing" && (
                          <GlassButton
                            size="sm"
                            variant="secondary"
                            isLoading={isActionLoading}
                            onClick={() => handleStatusUpdate(sub.id, "ready")}
                            className="bg-emerald-600/30 text-emerald-200 border-emerald-500/40 hover:bg-emerald-600/50"
                          >
                            Ready for Pickup
                          </GlassButton>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedSubOrder(sub)}
                          className="px-3 py-1.5 border border-white/[0.1] hover:bg-white/[0.06] text-slate-300 rounded-xl font-semibold text-xs transition"
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
      </GlassCard>

      {/* Sub-Order Detail Modal */}
      {selectedSubOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <GlassCard className="max-w-lg w-full p-6 shadow-2xl bg-slate-900/95 border border-white/[0.15]">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <div>
                <h3 className="text-base font-bold text-white">
                  Sub-Order #{selectedSubOrder.order_number}
                </h3>
                <span className="text-xs text-slate-400 capitalize">
                  Fulfillment Status: {selectedSubOrder.status.replace("_", " ")}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubOrder(null)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Item List */}
            <div className="py-4 space-y-2.5 max-h-60 overflow-y-auto">
              {selectedSubOrder.items.map((item) => (
                <div
                  key={item.variant_id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-white/[0.06] text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-900 border border-white/[0.08] flex items-center justify-center overflow-hidden flex-shrink-0">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                      ) : (
                        <ShoppingBag className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{item.product_name}</h4>
                      <p className="text-slate-400 text-[11px] font-mono">
                        {item.sku} • {item.variant_name} × {item.quantity}
                      </p>
                    </div>
                  </div>

                  <span className="font-bold text-indigo-300">
                    ${((item.unit_price * item.quantity) / 100).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Financial breakdown */}
            <div className="pt-3 border-t border-white/[0.08] text-xs space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span>Gross Subtotal:</span>
                <span className="text-white">${(selectedSubOrder.subtotal / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-rose-400">
                <span>Platform Commission ({selectedSubOrder.commission_rate}%):</span>
                <span>-${(selectedSubOrder.platform_commission / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/[0.08] font-bold text-white text-sm">
                <span>Seller Payout Balance:</span>
                <span className="text-emerald-400">
                  ${(selectedSubOrder.seller_earnings / 100).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <GlassButton
                size="sm"
                variant="secondary"
                onClick={() => setSelectedSubOrder(null)}
              >
                Close
              </GlassButton>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
