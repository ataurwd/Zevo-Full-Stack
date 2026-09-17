"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  Package,
  Eye,
  RefreshCw,
  AlertCircle,
  MapPin,
  Phone,
  User,
  ShieldCheck,
  Building2,
  Bike,
  Sparkles,
  ArrowRight,
  Check,
  ExternalLink,
  Store,
  Navigation,
  CheckCheck,
} from "lucide-react";
import { getOrderById, Order, SubOrder, notifyOrdersSync } from "@/lib/api/orders";
import {
  getAvailableRiders,
  assignRiderToOrder,
  DeliveryAgentProfile,
} from "@/lib/api/delivery";
import { getAccessToken } from "@/lib/api/client";
import AdminOrdersPage from "../page";

export default function AdminOrdersSlugHandler() {
  const params = useParams();
  const slug = (params?.slug as string[]) || [];

  // If slug is a status filter like 'pending', 'confirmed', render the list view
  const statusTabs = [
    "all",
    "pending",
    "confirmed",
    "preparing",
    "ready_for_pickup",
    "ready",
    "processing",
    "shipped",
    "completed",
    "delivered",
    "cancelled",
  ];

  if (slug.length === 1 && statusTabs.includes(slug[0].toLowerCase())) {
    return <AdminOrdersPage />;
  }

  // If slug is 'live/:id' or an order ID, render the live detail view
  let orderId = "";
  if (slug[0] === "live" || slug[0] === "detail" || slug[0] === "view") {
    orderId = slug[1] || "";
  } else if (slug.length > 0) {
    orderId = slug[0];
  }

  if (!orderId) {
    return <AdminOrdersPage />;
  }

  return <AdminLiveOrderDetail orderId={orderId} />;
}

function AdminLiveOrderDetail({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Rider assignment modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [targetSubOrder, setTargetSubOrder] = useState<SubOrder | null>(null);
  const [availableRiders, setAvailableRiders] = useState<DeliveryAgentProfile[]>([]);
  const [isLoadingRiders, setIsLoadingRiders] = useState(false);
  const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  const loadOrder = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);
    setErrorMsg(null);

    try {
      const data = await getOrderById(orderId);
      setOrder(data);
    } catch (err: any) {
      if (!isSilent) {
        setErrorMsg(err.message || "Failed to load live order details");
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [orderId]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push("/login?redirect=/admin/orders/live/" + orderId);
      return;
    }

    loadOrder();

    let channel: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      channel = new BroadcastChannel("nexora_orders_sync");
      channel.onmessage = () => {
        loadOrder(true);
      };
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "nexora_orders_updated") {
        loadOrder(true);
      };
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      if (channel) channel.close();
      window.removeEventListener("storage", handleStorage);
    };
  }, [orderId, router, loadOrder]);

  const openAssignModal = async (subOrder: SubOrder) => {
    setTargetSubOrder(subOrder);
    setSelectedRiderId(null);
    setAssignModalOpen(true);
    setIsLoadingRiders(true);
    try {
      const city = order?.delivery_address?.city || undefined;
      const res = await getAvailableRiders({ city });
      setAvailableRiders(res.riders || []);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load available riders");
    } finally {
      setIsLoadingRiders(false);
    }
  };

  const handleAssignRider = async () => {
    if (!targetSubOrder || !selectedRiderId) return;
    setIsAssigning(true);
    setErrorMsg(null);
    try {
      await assignRiderToOrder({
        sub_order_id: targetSubOrder.id,
        rider_id: selectedRiderId,
        order_id: order?.id,
      });

      setSuccessMsg("Courier rider assigned successfully!");
      setAssignModalOpen(false);
      loadOrder(true);
      notifyOrdersSync();

      setTimeout(() => {
        setSuccessMsg(null);
      }, 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to assign rider");
    } finally {
      setIsAssigning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00A86B]"></div>
        <p className="text-xs font-semibold text-gray-500">Connecting to live order stream...</p>
      </div>
    );
  }

  if (errorMsg && !order) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Order Not Found or Access Blocked</h3>
        <p className="text-xs text-gray-600">{errorMsg}</p>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#00A86B] text-white text-xs font-bold rounded-xl"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to All Orders</span>
        </Link>
      </div>
    );
  }

  if (!order) return null;

  const subOrders = order.sub_orders || [];
  const primarySubOrder = subOrders[0];
  const assignedRider = primarySubOrder?.assigned_rider;
  const isMerchantOrder = Boolean(primarySubOrder?.seller_id);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Breadcrumb & Live Telemetry Badge */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#D1E7D8]">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-2 rounded-xl bg-white border border-[#D1E7D8] text-[#0A504A] hover:bg-[#E8F8EE] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-[#0A504A] tracking-tight">
                Order #{order.order_number}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#E8F8EE] text-[#00A86B] border border-[#00A86B]/20 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00A86B]"></span>
                Live Telemetry
              </span>
            </div>
            <p className="text-xs text-[#0A504A]/70">
              Placed on {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadOrder(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#D1E7D8] text-xs font-bold text-[#0A504A] hover:bg-[#E8F8EE] transition-all cursor-pointer shadow-2xs"
          >
            <RefreshCw className={"w-3.5 h-3.5 " + (isRefreshing ? "animate-spin" : "")} />
            <span>Sync</span>
          </button>
          <Link
            href={"/orders/" + order.id}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E8F8EE] text-xs font-bold text-[#00A86B] hover:bg-[#00A86B] hover:text-white transition-all shadow-2xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Customer View</span>
          </Link>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-2xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2 shadow-2xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Telemetry Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Order Status, Rider Dispatch, Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dispatch & Courier Allocation Section */}
          <div className="p-6 rounded-3xl bg-white border border-[#D1E7D8] shadow-2xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D1E7D8]/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#E8F8EE] text-[#00A86B] flex items-center justify-center font-bold">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#0A504A]">Courier & Rider Dispatch</h3>
                  <p className="text-[11px] text-[#0A504A]/70">
                    {isMerchantOrder
                      ? "Merchant Product — Admin & Merchant Dual Dispatch Authorized"
                      : "Platform Product — Admin Exclusive Rider Dispatch"}
                  </p>
                </div>
              </div>

              <span
                className={"px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider " + (
                  isMerchantOrder
                    ? "bg-purple-50 text-purple-700 border border-purple-200"
                    : "bg-emerald-50 text-[#00A86B] border border-[#D1E7D8]"
                )}
              >
                {isMerchantOrder ? "Merchant Order" : "Platform Direct Order"}
              </span>
            </div>

            {/* Rider Card or Unassigned Notice */}
            {assignedRider ? (
              <div className="p-4 rounded-2xl bg-[#E8F8EE]/60 border border-[#00A86B]/30 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#00A86B] text-white flex items-center justify-center shadow-xs">
                    <Bike className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-[#0A504A]">
                        {assignedRider.name || "Assigned Courier"}
                      </h4>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#00A86B] text-white">
                        Assigned
                      </span>
                    </div>
                    <div className="text-xs text-[#0A504A]/70 flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {assignedRider.phone || "No phone registered"}
                      </span>
                      <span>•</span>
                      <span className="capitalize font-medium">
                        {assignedRider.vehicle_type} ({assignedRider.vehicle_number || "NX-RIDER"})
                      </span>
                    </div>
                    {assignedRider.delivery_zones?.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 mt-1.5">
                        <span className="text-[10px] font-bold text-[#0A504A]/60">Zones:</span>
                        {assignedRider.delivery_zones.map((z: string, i: number) => (
                          <span
                            key={i}
                            className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-white text-[#0A504A] border border-[#D1E7D8]"
                          >
                            {z}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {primarySubOrder && (
                  <button
                    onClick={() => openAssignModal(primarySubOrder)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-[#0A504A] hover:bg-[#E8F8EE] border border-[#D1E7D8] transition-all cursor-pointer shadow-2xs"
                  >
                    Reassign Rider
                  </button>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-amber-900">
                      No Courier Assigned Yet
                    </h4>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      Order is ready in queue. Admin can assign an active delivery rider immediately.
                    </p>
                  </div>
                </div>

                {primarySubOrder && (
                  <button
                    onClick={() => openAssignModal(primarySubOrder)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#00A86B] text-white hover:bg-[#008f5b] transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Bike className="w-3.5 h-3.5" />
                    <span>Assign Courier Rider</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Sub-orders & Ordered Items Breakdown */}
          <div className="p-6 rounded-3xl bg-white border border-[#D1E7D8] shadow-2xs space-y-4">
            <h3 className="text-sm font-black text-[#0A504A] flex items-center gap-2">
              <Package className="w-4 h-4 text-[#00A86B]" />
              <span>Vendors & Item Line Details ({subOrders.length} Sub-Order{subOrders.length > 1 ? "s" : ""})</span>
            </h3>

            <div className="space-y-4">
              {subOrders.map((sub, idx) => (
                <div
                  key={sub.id || idx}
                  className="p-4 rounded-2xl border border-[#D1E7D8] bg-[#FAFDFB] space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D1E7D8]/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-[#00A86B]" />
                      <span className="font-bold text-xs text-[#0A504A]">
                        {sub.store_name || ("Store Hub #" + sub.store_id.slice(-6))}
                      </span>
                      <span className="text-[10px] font-mono text-gray-500">
                        ({sub.order_number})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize bg-white border border-[#D1E7D8] text-[#0A504A]">
                        Status: {sub.status.replace(/_/g, " ")}
                      </span>
                      {assignedRider ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F8EE] text-[#00A86B] border border-[#A2E4B8] flex items-center gap-1">
                          <Bike className="w-3 h-3" />
                          <span>Courier: {(sub.assigned_rider || assignedRider)?.name || "Assigned"}</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => openAssignModal(primarySubOrder || sub)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#00A86B] text-white hover:bg-[#008f5b] transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Bike className="w-3 h-3" />
                          <span>Assign Order Courier</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="divide-y divide-[#D1E7D8]/50">
                    {sub.items?.map((item, itemIdx) => (
                      <div
                        key={itemIdx}
                        className="py-2.5 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.product_name}
                              className="w-10 h-10 object-cover rounded-lg border border-[#D1E7D8]"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-[#D1E7D8] flex items-center justify-center text-[#00A86B]">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-[#0A504A]">
                              {item.product_name}
                            </div>
                            <div className="text-[11px] text-gray-500">
                              Qty: {item.quantity} × ${(item.unit_price / 100).toFixed(2)}
                            </div>
                          </div>
                        </div>

                        <div className="font-mono font-bold text-[#0A504A]">
                          ${(item.subtotal / 100).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-2 text-xs font-bold text-[#0A504A] border-t border-[#D1E7D8]/60">
                    <span>Sub-Order Total:</span>
                    <span className="font-mono">${(sub.subtotal / 100).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Customer & Delivery Destination, Pricing Summary */}
        <div className="space-y-6">
          {/* Customer & Destination Card */}
          <div className="p-6 rounded-3xl bg-white border border-[#D1E7D8] shadow-2xs space-y-4">
            <h3 className="text-sm font-black text-[#0A504A] flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#00A86B]" />
              <span>Recipient & Destination</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#E8F8EE]/50 border border-[#D1E7D8]/70 space-y-1">
                <div className="font-bold text-sm text-[#0A504A]">
                  {order.delivery_address?.recipient_name || "Guest Customer"}
                </div>
                <div className="text-gray-600 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#00A86B]" />
                  <span>{order.delivery_address?.phone || "+1 555-000-0000"}</span>
                </div>
              </div>

              <div className="space-y-1 text-gray-700">
                <div className="font-semibold text-[#0A504A]">Delivery Address:</div>
                <p className="text-gray-600">
                  {order.delivery_address?.line1}
                  {order.delivery_address?.line2 ? ", " + order.delivery_address.line2 : ""}
                </p>
                <p className="font-medium text-[#0A504A]">
                  {order.delivery_address?.city}, {order.delivery_address?.state}{" "}
                  {order.delivery_address?.postal_code}
                </p>
                <p className="text-[11px] text-gray-500">{order.delivery_address?.country}</p>
              </div>

              {order.notes && (
                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-amber-900 text-xs">
                  <span className="font-bold">Customer Notes:</span> {order.notes}
                </div>
              )}
            </div>
          </div>

          {/* Pricing & Settlement Card */}
          <div className="p-6 rounded-3xl bg-white border border-[#D1E7D8] shadow-2xs space-y-4">
            <h3 className="text-sm font-black text-[#0A504A]">Payment Summary</h3>

            <div className="space-y-2 text-xs divide-y divide-[#D1E7D8]/60">
              <div className="flex justify-between py-1 text-gray-600">
                <span>Items Subtotal</span>
                <span className="font-mono font-medium">${(order.subtotal / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 text-gray-600">
                <span>Delivery Fee</span>
                <span className="font-mono font-medium">${(order.delivery_fee / 100).toFixed(2)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between py-1 text-emerald-600 font-medium">
                  <span>Discount</span>
                  <span className="font-mono">-${(order.discount_amount / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 text-sm font-black text-[#0A504A]">
                <span>Total Amount</span>
                <span className="font-mono text-base text-[#00A86B]">
                  ${(order.total / 100).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#E8F8EE] text-[#00A86B] w-full justify-center border border-[#00A86B]/20">
                <CheckCircle2 className="w-4 h-4" />
                <span>Payment: {order.payment_status.toUpperCase()}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* RIDER ASSIGNMENT MODAL */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-[#D1E7D8] animate-fade-in max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#D1E7D8]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#E8F8EE] text-[#00A86B] flex items-center justify-center font-bold">
                  <Bike className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-[#0A504A]">Assign Courier for Entire Order</h3>
                  <p className="text-[11px] text-[#0A504A]/70">
                    Order #{order.order_number} ({subOrders.length} package{subOrders.length > 1 ? "s" : ""}) • Destination: <strong className="text-[#0A504A]">{order.delivery_address?.city || "Dhaka"}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAssignModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Riders List */}
            <div className="overflow-y-auto flex-1 space-y-2.5 pr-1">
              {isLoadingRiders ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00A86B]"></div>
                  <p className="text-xs text-gray-500">Finding nearby available delivery agents...</p>
                </div>
              ) : availableRiders.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-500">
                  No active delivery agents found in database.
                </div>
              ) : (
                availableRiders.map((r) => {
                  const riderId = r._id || (r as any).id;
                  const isSelected = selectedRiderId === riderId;
                  const orderCity = (order.delivery_address?.city || "Dhaka").toLowerCase();
                  const matchesLocation = r.delivery_zones?.some((z) =>
                    z.toLowerCase().includes(orderCity)
                  ) || r.service_city?.toLowerCase().includes(orderCity);

                  return (
                    <div
                      key={riderId}
                      onClick={() => setSelectedRiderId(riderId)}
                      className={"p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 " + (
                        isSelected
                          ? "bg-[#E8F8EE] border-[#00A86B] shadow-2xs"
                          : "bg-white border-[#D1E7D8] hover:border-[#00A86B]/60"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={"w-10 h-10 rounded-xl flex items-center justify-center shrink-0 " + (
                            isSelected ? "bg-[#00A86B] text-white" : "bg-gray-100 text-gray-700"
                          )}
                        >
                          <Bike className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#0A504A]">
                              {r.user_name || "Delivery Courier"}
                            </span>
                            {matchesLocation && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-100 text-emerald-800">
                                Zone Match
                              </span>
                            )}
                            {r.is_online && (
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                            <span className="capitalize">{r.vehicle_type}</span>
                            <span>•</span>
                            <span>{r.phone || "Verified Agent"}</span>
                          </div>
                          {r.delivery_zones && r.delivery_zones.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1 mt-1">
                              <span className="text-[9px] text-gray-400">Coverage:</span>
                              {r.delivery_zones.slice(0, 3).map((zone, zIdx) => (
                                <span
                                  key={zIdx}
                                  className="text-[9px] font-medium px-1 rounded bg-gray-100 text-gray-700"
                                >
                                  {zone}
                                </span>
                              ))}
                              {r.delivery_zones.length > 3 && (
                                <span className="text-[9px] text-gray-400">
                                  +{r.delivery_zones.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">
                        <div
                          className={"w-5 h-5 rounded-full border flex items-center justify-center " + (
                            isSelected
                              ? "bg-[#00A86B] border-[#00A86B] text-white"
                              : "border-gray-300"
                          )}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-[#D1E7D8] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignRider}
                disabled={!selectedRiderId || isAssigning}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#00A86B] text-white hover:bg-[#008f5b] disabled:opacity-50 transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {isAssigning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Assigning...</span>
                  </>
                ) : (
                  <>
                    <CheckCheck className="w-4 h-4" />
                    <span>Confirm Assignment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}