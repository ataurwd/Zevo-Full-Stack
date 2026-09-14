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
import { Navbar } from "@/components/Navbar";
import { getCustomerOrders, Order } from "@/lib/api/orders";
import { getAccessToken } from "@/lib/api/client";

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
        setOrders(res.orders || []);
        setTotal(res.total || 0);
      } catch (err) {
        console.error("Failed loading orders", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();

    let channel: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      channel = new BroadcastChannel("nexora_orders_sync");
      channel.onmessage = () => {
        loadOrders();
      };
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "nexora_orders_updated") {
        loadOrders();
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      if (channel) channel.close();
      window.removeEventListener("storage", handleStorage);
    };
  }, [router, activeTab]);

  const tabs = [
    { id: "all", label: "All Orders" },
    { id: "pending", label: "Pending" },
    { id: "confirmed", label: "Confirmed" },
    { id: "completed", label: "Completed" },
    { id: "cancelled", label: "Cancelled" },
  ];

  const renderStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-[#0A504A] border border-[#A2E4B8]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00A86B]" /> Confirmed
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Cancelled
          </span>
        );
      case "completed":
      case "delivered":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 border border-gray-200 capitalize">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#0A504A] border border-[#D1E7D8] text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-[#00A86B] animate-pulse"></span>
                Order Telemetry
              </span>
              <span className="text-xs font-semibold text-gray-500">Total: {total} Orders</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0A504A] tracking-tight">
              Order Activity & Tracking
            </h1>
            <p className="text-gray-500 text-sm mt-1 font-medium">
              Monitor real-time fulfillment pipelines and order archives across vendors.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00A86B] hover:bg-[#0A504A] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#00A86B]/20 transition-all cursor-pointer self-start sm:self-auto shrink-0"
          >
            <ShoppingBag className="w-4 h-4" />
            Marketplace Catalog
          </Link>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-200 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-bold whitespace-nowrap rounded-xl transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-[#0A504A] text-white border border-[#0A504A] shadow-xs"
                  : "bg-white text-gray-700 border border-gray-200 hover:text-[#00A86B] hover:border-[#A2E4B8] hover:bg-emerald-50/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00A86B]"></div>
            <p className="text-xs font-semibold text-gray-500">Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white border border-[#D1E7D8] rounded-3xl p-12 text-center shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#00A86B] flex items-center justify-center mx-auto mb-4 border border-[#D1E7D8]">
              <Package className="w-8 h-8 stroke-[2]" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No orders found</h3>
            <p className="text-gray-500 text-xs sm:text-sm mt-1 max-w-sm mx-auto">
              You don't have any {activeTab !== "all" ? activeTab : ""} orders yet. Explore our curated catalog to place your first order.
            </p>
            <Link
              href="/products"
              className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#00A86B] hover:bg-[#0A504A] text-white font-bold text-xs shadow-md shadow-[#00A86B]/20 transition-all cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              Discover Products
            </Link>
          </div>
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
                <div
                  key={order.id}
                  className="bg-white border border-[#D1E7D8] rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-shadow"
                >
                  {/* Header bar */}
                  <div className="bg-[#F8FAF9] px-6 py-4 border-b border-[#D1E7D8] flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div className="flex flex-wrap items-center gap-6">
                      <div>
                        <span className="block text-gray-400 font-bold text-[10px] uppercase tracking-wider">
                          Date Placed
                        </span>
                        <span className="font-semibold text-gray-800 flex items-center gap-1.5 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-[#00A86B]" />
                          {formattedDate}
                        </span>
                      </div>

                      <div>
                        <span className="block text-gray-400 font-bold text-[10px] uppercase tracking-wider">
                          Total Amount
                        </span>
                        <span className="font-black text-[#0A504A] text-sm mt-0.5 block">
                          ${(order.total / 100).toFixed(2)}
                        </span>
                      </div>

                      <div>
                        <span className="block text-gray-400 font-bold text-[10px] uppercase tracking-wider">
                          Destination
                        </span>
                        <span className="font-semibold text-gray-800 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-[#00A86B]" />
                          {order.delivery_address?.city || "Address on file"}, {order.delivery_address?.state || ""}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-gray-500 font-bold text-xs bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200">
                        #{order.order_number}
                      </span>
                      {renderStatusBadge(order.status)}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6">
                    <div className="divide-y divide-gray-100">
                      {order.sub_orders?.map((sub) => (
                        <div key={sub.id} className="py-4 first:pt-0 last:pb-0">
                          <div className="flex items-center justify-between mb-3 text-xs">
                            <span className="font-bold text-gray-700 text-[11px] uppercase tracking-wider">
                              Sub-Order #{sub.order_number}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 border border-gray-200 text-gray-700 capitalize">
                              Status: {sub.status.replace("_", " ")}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {sub.items.map((item) => (
                              <div
                                key={item.variant_id}
                                className="flex items-center gap-3 p-3 rounded-xl border border-gray-200/80 bg-[#FAFCFB] hover:border-gray-300 transition-colors"
                              >
                                <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                  {item.image_url ? (
                                    <img
                                      src={item.image_url}
                                      alt={item.product_name}
                                      className="w-full h-full object-contain"
                                    />
                                  ) : (
                                    <ShoppingBag className="w-4 h-4 text-gray-400" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0 text-xs">
                                  <h4 className="font-bold text-gray-900 truncate">
                                    {item.product_name}
                                  </h4>
                                  <p className="text-gray-500 text-[11px] truncate">
                                    {item.variant_name} × {item.quantity}
                                  </p>
                                  <span className="font-bold text-[#0A504A] mt-0.5 block">
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
                    <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-end">
                      <Link
                        href={`/orders/${order.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-[#D1E7D8] hover:bg-emerald-50 hover:text-[#00A86B] hover:border-[#A2E4B8] text-[#0A504A] font-bold text-xs shadow-2xs transition-all cursor-pointer"
                      >
                        <span>Track & View Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
