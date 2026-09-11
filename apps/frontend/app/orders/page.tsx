"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";
import { getCustomerOrders, Order } from "@/lib/api/orders";
import { getAccessToken } from "@/lib/api/client";
import { GlassCard, GlassButton, GlassBadge } from "@/components/ui";

export default function CustomerOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push("/login?redirect=/orders");
      return;
    }

    const loadOrders = async () => {
      setIsLoading(true);
      try {
        const res = await getCustomerOrders({
          status: activeTab === "all" ? undefined : activeTab,
        });
        setOrders(res.orders);
        setTotal(res.total);
      } catch (err) {
        console.error("Failed loading orders", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, [router, activeTab]);

  const tabs = [
    { id: "all", label: "All Orders" },
    { id: "pending", label: "Pending" },
    { id: "confirmed", label: "Confirmed" },
    { id: "completed", label: "Completed" },
    { id: "cancelled", label: "Cancelled" },
  ];

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <GlassBadge variant="emerald">Confirmed</GlassBadge>;
      case "pending":
        return <GlassBadge variant="amber">Pending</GlassBadge>;
      case "cancelled":
        return <GlassBadge variant="rose">Cancelled</GlassBadge>;
      case "completed":
        return <GlassBadge variant="cyan">Completed</GlassBadge>;
      default:
        return <GlassBadge variant="indigo">{status}</GlassBadge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <GlassBadge variant="indigo">Order Telemetry</GlassBadge>
            <span className="text-xs text-slate-400">Total: {total} Orders</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Order Activity & Tracking
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Monitor real-time fulfillment pipelines and order archives across vendors.
          </p>
        </div>
        <Link href="/products">
          <GlassButton variant="primary" leftIcon={<ShoppingBag className="w-4 h-4" />}>
            Marketplace Catalog
          </GlassButton>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] mb-8 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap rounded-xl transition-all ${
              activeTab === tab.id
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                : "text-slate-400 hover:text-white hover:bg-white/[0.05]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
        </div>
      ) : orders.length === 0 ? (
        <GlassCard className="text-center py-16 px-4">
          <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-base font-bold text-white">No orders found</h3>
          <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
            You don't have any {activeTab !== "all" ? activeTab : ""} orders yet. Explore our curated catalog to place your first order.
          </p>
          <Link href="/products" className="mt-6 inline-block">
            <GlassButton size="sm">Discover Products</GlassButton>
          </Link>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const formattedDate = new Date(order.created_at).toLocaleDateString(
              "en-US",
              {
                month: "short",
                day: "numeric",
                year: "numeric",
              }
            );

            return (
              <GlassCard key={order.id} interactive className="overflow-hidden">
                {/* Header bar */}
                <div className="bg-slate-950/40 px-6 py-4 border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
                  <div className="flex items-center gap-6">
                    <div>
                      <span className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                        Date Placed
                      </span>
                      <span className="font-semibold text-slate-200 flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        {formattedDate}
                      </span>
                    </div>

                    <div>
                      <span className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                        Total Amount
                      </span>
                      <span className="font-bold text-indigo-300 mt-0.5">
                        ${(order.total / 100).toFixed(2)}
                      </span>
                    </div>

                    <div>
                      <span className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                        Destination
                      </span>
                      <span className="font-semibold text-slate-200 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                        {order.delivery_address.city}, {order.delivery_address.state}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-400 text-xs">
                      #{order.order_number}
                    </span>
                    {renderStatusBadge(order.status)}
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-6">
                  <div className="divide-y divide-white/[0.05]">
                    {order.sub_orders?.map((sub) => (
                      <div key={sub.id} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between mb-3 text-xs">
                          <span className="font-bold text-slate-400 text-[11px] uppercase tracking-wider">
                            Sub-Order #{sub.order_number}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/[0.05] border border-white/[0.08] text-slate-300 capitalize">
                            Status: {sub.status.replace("_", " ")}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {sub.items.map((item) => (
                            <div
                              key={item.variant_id}
                              className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-slate-950/40 backdrop-blur-md"
                            >
                              <div className="w-12 h-12 bg-slate-900 rounded-lg border border-white/[0.08] flex-shrink-0 flex items-center justify-center overflow-hidden">
                                {item.image_url ? (
                                  <img
                                    src={item.image_url}
                                    alt={item.product_name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <ShoppingBag className="w-4 h-4 text-slate-500" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0 text-xs">
                                <h4 className="font-bold text-white truncate">
                                  {item.product_name}
                                </h4>
                                <p className="text-slate-400 text-[11px] truncate">
                                  {item.variant_name} × {item.quantity}
                                </p>
                                <span className="font-bold text-indigo-300 mt-0.5 block">
                                  ${((item.unit_price * item.quantity) / 100).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action footer */}
                  <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-end">
                    <Link href={`/orders/${order.id}`}>
                      <GlassButton
                        size="sm"
                        variant="secondary"
                        rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                      >
                        Track & View Details
                      </GlassButton>
                    </Link>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
