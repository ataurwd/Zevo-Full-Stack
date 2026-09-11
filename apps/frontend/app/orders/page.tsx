"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  Calendar,
  CreditCard,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> Pending
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            My Orders
          </h1>
          <p className="text-slate-600 mt-1">
            Track your marketplace orders, view fulfillment stages, and review details.
          </p>
        </div>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition"
        >
          <ShoppingBag className="w-4 h-4" /> Continue Shopping
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 mb-8 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap rounded-lg transition ${
              activeTab === tab.id
                ? "bg-indigo-50 text-indigo-600"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 text-center py-16 px-4">
          <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900">No orders found</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
            You don't have any {activeTab !== "all" ? activeTab : ""} orders yet. Explore our curated catalog to place your first order.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
          >
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
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden hover:shadow-md transition"
              >
                {/* Header bar */}
                <div className="bg-slate-50/70 px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
                  <div className="flex items-center gap-6">
                    <div>
                      <span className="block text-slate-400 font-medium">ORDER PLACED</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formattedDate}
                      </span>
                    </div>

                    <div>
                      <span className="block text-slate-400 font-medium">TOTAL</span>
                      <span className="font-bold text-slate-900 mt-0.5">
                        ${(order.total / 100).toFixed(2)}
                      </span>
                    </div>

                    <div>
                      <span className="block text-slate-400 font-medium">SHIP TO</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {order.delivery_address.city}, {order.delivery_address.state}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">Order #{order.order_number}</span>
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-6">
                  <div className="divide-y divide-slate-100">
                    {order.sub_orders?.map((sub) => (
                      <div key={sub.id} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between mb-3 text-xs">
                          <span className="font-semibold text-slate-500 uppercase tracking-wider">
                            Sub-Order #{sub.order_number}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 capitalize">
                            Status: {sub.status.replace("_", " ")}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {sub.items.map((item) => (
                            <div
                              key={item.variant_id}
                              className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 bg-slate-50/50"
                            >
                              <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                {item.image_url ? (
                                  <img
                                    src={item.image_url}
                                    alt={item.product_name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <ShoppingBag className="w-5 h-5 text-slate-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0 text-xs">
                                <h4 className="font-semibold text-slate-900 truncate">
                                  {item.product_name}
                                </h4>
                                <p className="text-slate-500 truncate">
                                  {item.variant_name} × {item.quantity}
                                </p>
                                <span className="font-bold text-slate-800 mt-0.5 block">
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
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end">
                    <Link
                      href={`/orders/${order.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm transition"
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
    </div>
  );
}
