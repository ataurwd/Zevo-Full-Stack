"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ShoppingCart,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  Package,
  Eye,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { getAdminOrders, Order } from "@/lib/api/orders";
import { getAccessToken } from "@/lib/api/client";

const ORDER_STATUS_TABS = [
  { id: "all", label: "All Orders" },
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "preparing", label: "Preparing" },
  { id: "ready_for_pickup", label: "Ready" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

export default function AdminOrdersPage() {
  const router = useRouter();
  const params = useParams();
  const slug = (params?.slug as string[]) || [];
  const routeTab = slug[0] || "all";

  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState(routeTab);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadOrders = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await getAdminOrders({
        status: activeTab === "all" ? undefined : activeTab,
      });
      setOrders(res.orders || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load orders from server");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push("/login?redirect=/admin/orders");
      return;
    }
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

  const filteredOrders = orders.filter((o) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const matchesNumber = o.order_number?.toLowerCase().includes(q);
    const matchesRecipient = o.delivery_address?.recipient_name?.toLowerCase().includes(q);
    const matchesCity = o.delivery_address?.city?.toLowerCase().includes(q);
    const matchesItems = o.sub_orders?.some((s) =>
      s.items?.some((i) => i.product_name?.toLowerCase().includes(q))
    );
    return matchesNumber || matchesRecipient || matchesCity || matchesItems;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F8EE] border border-[#A2E4B8]/30 text-[#0A504A] text-[11px] font-bold uppercase tracking-wider mb-2">
            <ShoppingCart className="w-3.5 h-3.5 text-[#00A86B]" />
            <span>Real-Time Order Telemetry</span>
            <span className="w-2 h-2 rounded-full bg-[#00A86B] animate-pulse"></span>
          </div>
          <h1 className="text-3xl font-serif font-black text-[#0A504A] tracking-tight">
            Orders Orchestration
          </h1>
          <p className="text-xs text-[#0A504A]/70 mt-1">
            Live database multi-vendor order streams, fulfillment statuses, and courier allocations. Total: {total} orders.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-[#0A504A]/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order #, recipient, city..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A] placeholder-[#A2E4B8]/60 focus:outline-none focus:border-[#00A86B]"
            />
          </div>

          <button
            onClick={loadOrders}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-white border border-[#D1E7D8] text-[#0A504A] hover:text-[#00A86B] hover:bg-[#E8F8EE] transition-all cursor-pointer shadow-2xs"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Status Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-[#D1E7D8] pb-2 overflow-x-auto scrollbar-none">
        {ORDER_STATUS_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 capitalize cursor-pointer ${
                isActive
                  ? "bg-[#00A86B] text-white shadow-2xs"
                  : "bg-white border border-[#D1E7D8] text-[#0A504A]/80 hover:bg-[#E8F8EE]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Orders Table */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#D1E7D8] shadow-2xs space-y-4">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-[#00A86B]"></div>
            <p className="text-xs font-semibold text-gray-500">Loading live orders from database...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#00A86B] flex items-center justify-center mx-auto mb-3 border border-[#D1E7D8]">
              <Package className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-gray-900">No orders found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              There are no orders matching this filter in the database. Newly placed customer orders will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#D1E7D8] text-[#0A504A]/70 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 pl-2">Order Reference</th>
                  <th className="pb-3">Recipient & Destination</th>
                  <th className="pb-3">Vendors / Hubs</th>
                  <th className="pb-3">Items Summary</th>
                  <th className="pb-3 text-right">Order Total</th>
                  <th className="pb-3">Fulfillment Status</th>
                  <th className="pb-3">Timestamp</th>
                  <th className="pb-3 pr-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1E7D8]/70">
                {filteredOrders.map((ord) => {
                  const itemsList =
                    ord.sub_orders?.flatMap((s) => s.items || []).map((i) => `${i.product_name} (×${i.quantity})`).join(", ") ||
                    "Grocery Basket";

                  const vendorsCount = ord.sub_orders?.length || 1;

                  return (
                    <tr key={ord.id} className="hover:bg-[#E8F8EE]/40 transition-colors">
                      <td className="py-4 pl-2 font-mono font-bold text-[#0A504A]">
                        <Link
                          href={`/admin/orders/live/${ord.id}`}
                          className="hover:text-[#00A86B] hover:underline flex items-center gap-1.5"
                        >
                          <span>{ord.order_number}</span>
                        </Link>
                      </td>
                      <td className="py-4">
                        <div className="font-semibold text-[#0A504A]">
                          {ord.delivery_address?.recipient_name || "Guest Customer"}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {ord.delivery_address?.city}, {ord.delivery_address?.state}
                        </div>
                      </td>
                      <td className="py-4 text-[#0A504A]/70 font-medium">
                        {vendorsCount} {vendorsCount === 1 ? "Vendor Hub" : "Vendor Hubs"}
                      </td>
                      <td className="py-4 text-[#0A504A] max-w-xs truncate" title={itemsList}>
                        {itemsList}
                      </td>
                      <td className="py-4 text-right font-mono font-bold text-sm text-[#0A504A]">
                        ${(ord.total / 100).toFixed(2)}
                      </td>
                      <td className="py-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                            ord.status === "completed"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : ord.status === "confirmed"
                              ? "bg-[#E8F8EE] text-[#00A86B] border-[#A2E4B8]"
                              : ord.status === "pending"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {ord.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-4 text-[#0A504A]/70 font-mono text-[11px]">
                        {new Date(ord.created_at).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-4 pr-2 text-right">
                        <Link
                          href={`/admin/orders/live/${ord.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#E8F8EE] hover:bg-[#00A86B] hover:text-white text-[#00A86B] font-bold text-[11px] transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Live</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
