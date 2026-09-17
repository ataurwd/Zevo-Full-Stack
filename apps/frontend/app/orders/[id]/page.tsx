"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  Store,
  ShoppingBag,
  Sparkles,
  Bike,
  Navigation,
  Radio,
  Clock,
  MessageSquare,
  Phone,
  Check,
  RefreshCw,
  Package,
} from "lucide-react";
import { getOrderById, cancelOrder, Order } from "../../../lib/api/orders";
import { getAccessToken } from "../../../lib/api/client";
import { useSocket } from "../../../hooks/useSocket";
import { ChatDrawer } from "../../../components/chat/ChatDrawer";
import { Navbar } from "../../../components/Navbar";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { socket, joinRoom, leaveRoom } = useSocket();

  const orderId = params.id;
  const isNewlyPlaced = searchParams.get("placed") === "true";

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState<string>("all");

  // Live real-time delivery telematics state
  const [liveDelivery, setLiveDelivery] = useState<{
    etaMinutes?: number;
    distanceKm?: number;
    lat?: number;
    lon?: number;
    riderName?: string;
    riderPhone?: string;
  } | null>(null);

  const [chatTarget, setChatTarget] = useState<{
    id: string;
    name: string;
    role: "seller" | "delivery_agent";
  } | null>(null);

  const loadOrder = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);
    setErrorMsg(null);

    try {
      const data = await getOrderById(orderId);
      setOrder(data);
    } catch (err: any) {
      if (!isSilent) {
        setErrorMsg(err.message || "Failed to load order details");
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [orderId]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push(`/login?redirect=/orders/${orderId}`);
      return;
    }

    loadOrder();

    // Cross-tab sync when rider or merchant updates order status
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
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      if (channel) channel.close();
      window.removeEventListener("storage", handleStorage);
    };
  }, [orderId, router, loadOrder]);

  // Real-time Socket.IO event subscription for order & delivery milestones
  useEffect(() => {
    if (!socket || !orderId) return;

    joinRoom(`order:${orderId}`);

    const handleStatusUpdate = (data: any) => {
      if (data?.status) {
        setOrder((prev) => (prev ? { ...prev, status: data.status } : prev));
      }
      loadOrder(true);
    };

    const handleDeliveryLocation = (data: any) => {
      setLiveDelivery((prev) => ({
        ...prev,
        etaMinutes: data.etaMinutes || data.eta_minutes,
        distanceKm: data.distanceKm || data.distance_km,
        lat: data.lat,
        lon: data.lon,
        riderName: data.riderName || prev?.riderName,
        riderPhone: data.riderPhone || prev?.riderPhone,
      }));
    };

    const handleDeliveryCompleted = () => {
      setOrder((prev) => (prev ? { ...prev, status: "completed" } : prev));
      loadOrder(true);
    };

    socket.on("order:confirmed", handleStatusUpdate);
    socket.on("order:preparing", handleStatusUpdate);
    socket.on("order:ready_for_pickup", handleStatusUpdate);
    socket.on("order:cancelled", handleStatusUpdate);
    socket.on("order:status_updated", handleStatusUpdate);
    socket.on("delivery:assigned", (data) => {
      if (data) {
        setLiveDelivery({
          etaMinutes: data.etaMinutes || data.eta_minutes,
          distanceKm: data.distanceKm || data.distance_km,
          riderName: data.riderName || data.rider_name,
          riderPhone: data.riderPhone || data.phone,
        });
      }
      loadOrder(true);
    });
    socket.on("delivery:en_route_pickup", handleStatusUpdate);
    socket.on("delivery:picked_up", handleStatusUpdate);
    socket.on("delivery:en_route_delivery", handleStatusUpdate);
    socket.on("delivery:delivered", handleDeliveryCompleted);
    socket.on("delivery:location_updated", handleDeliveryLocation);

    return () => {
      leaveRoom(`order:${orderId}`);
      socket.off("order:confirmed", handleStatusUpdate);
      socket.off("order:preparing", handleStatusUpdate);
      socket.off("order:ready_for_pickup", handleStatusUpdate);
      socket.off("order:cancelled", handleStatusUpdate);
      socket.off("order:status_updated", handleStatusUpdate);
      socket.off("delivery:assigned", handleStatusUpdate);
      socket.off("delivery:en_route_pickup", handleStatusUpdate);
      socket.off("delivery:picked_up", handleStatusUpdate);
      socket.off("delivery:en_route_delivery", handleStatusUpdate);
      socket.off("delivery:delivered", handleDeliveryCompleted);
      socket.off("delivery:location_updated", handleDeliveryLocation);
    };
  }, [socket, orderId, joinRoom, leaveRoom, loadOrder]);

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
      <div className="min-h-[70vh] flex items-center justify-center bg-[#F7F7F2]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00A86B]"></div>
      </div>
    );
  }

  if (errorMsg && !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-[#0A504A]">Order Not Found</h2>
        <p className="text-[#0A504A]/70 mt-1 text-sm">{errorMsg}</p>
        <Link
          href="/orders"
          className="mt-6 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00A86B] hover:bg-[#0A504A] text-white font-bold text-xs shadow-md shadow-[#00A86B]/25 transition-all"
        >
          <ChevronLeft className="w-4 h-4" /> Back to My Orders
        </Link>
      </div>
    );
  }

  if (!order) return null;

  // Multi-package state
  const hasMultiplePackages = (order.sub_orders?.length || 0) > 1;
  const deliveredCount = order.sub_orders?.filter((s) => s.status === "delivered").length || 0;
  const totalPackages = order.sub_orders?.length || 1;
  const allSubOrdersDelivered = hasMultiplePackages && deliveredCount === totalPackages;
  const isPartiallyDelivered = hasMultiplePackages && deliveredCount > 0 && deliveredCount < totalPackages;

  // Selected sub-order target (or null for all packages overview)
  const selectedSub = selectedPackageId !== "all"
    ? order.sub_orders?.find((s) => (s.id || (s as any)._id) === selectedPackageId) || null
    : null;

  // Resolve assigned rider from selected package or overall order
  const assignedRider = selectedSub?.assigned_rider || order.assigned_rider || order.sub_orders?.[0]?.assigned_rider || null;
  const primarySub = order.sub_orders?.[0] || null;

  // Helper date-time formatters
  const formatTime = (isoString?: string | null) => {
    if (!isoString) return null;
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
    } catch {
      return null;
    }
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return null;
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleDateString([], { month: "short", day: "numeric" });
    } catch {
      return null;
    }
  };

  // Harmonize effective status for active view (package vs overall order)
  let effectiveStatus = order.status;
  if (selectedSub) {
    effectiveStatus = selectedSub.status === "delivered" ? "completed" : (selectedSub.status as any);
  } else {
    if (allSubOrdersDelivered) {
      effectiveStatus = "completed";
    } else if (isPartiallyDelivered) {
      effectiveStatus = "in_transit";
    } else if (primarySub?.status && (effectiveStatus === "pending" || effectiveStatus === "confirmed")) {
      if (primarySub.status === "delivered") effectiveStatus = "completed";
      else if (primarySub.status !== "pending") effectiveStatus = primarySub.status as any;
    }
  }

  // Milestone Timestamps for active view
  const targetDoc = selectedSub || order;
  const placedTime = formatTime(targetDoc.created_at || order.created_at);
  const placedDate = formatDate(targetDoc.created_at || order.created_at);

  const confirmedTime = formatTime(selectedSub ? (selectedSub.confirmed_at || selectedSub.ready_at) : (order.confirmed_at || primarySub?.confirmed_at || order.ready_at || primarySub?.ready_at));
  const confirmedDate = formatDate(selectedSub ? (selectedSub.confirmed_at || selectedSub.ready_at) : (order.confirmed_at || primarySub?.confirmed_at || order.ready_at || primarySub?.ready_at));

  const assignedTime = formatTime(assignedRider?.assigned_at || (selectedSub ? selectedSub.ready_at : (order.ready_at || primarySub?.ready_at)));
  const assignedDate = formatDate(assignedRider?.assigned_at || (selectedSub ? selectedSub.ready_at : (order.ready_at || primarySub?.ready_at)));

  const pickedUpTime = formatTime(selectedSub ? selectedSub.picked_up_at : (order.picked_up_at || primarySub?.picked_up_at));
  const pickedUpDate = formatDate(selectedSub ? selectedSub.picked_up_at : (order.picked_up_at || primarySub?.picked_up_at));

  const inTransitTime = formatTime((targetDoc as any).in_transit_at || (primarySub as any)?.in_transit_at);
  const inTransitDate = formatDate((targetDoc as any).in_transit_at || (primarySub as any)?.in_transit_at);

  // Delivered timestamp is strictly gated by whether active view is delivered/completed
  const isViewDelivered = effectiveStatus === "completed" || effectiveStatus === "delivered";
  const deliveredTime = isViewDelivered
    ? formatTime(selectedSub ? selectedSub.delivered_at : (order.delivered_at || (allSubOrdersDelivered ? primarySub?.delivered_at : null)))
    : null;
  const deliveredDate = isViewDelivered
    ? formatDate(selectedSub ? selectedSub.delivered_at : (order.delivered_at || (allSubOrdersDelivered ? primarySub?.delivered_at : null)))
    : null;

  // Stepper steps configuration
  const steps = [
    {
      label: "Order Placed",
      key: "pending",
      time: placedTime,
      date: placedDate,
      desc: "Order confirmed in store",
    },
    {
      label: "Confirmed & Prepared",
      key: "confirmed",
      time: confirmedTime,
      date: confirmedDate,
      desc: "Store packed items",
    },
    {
      label: "Courier Assigned",
      key: "ready_for_pickup",
      time: assignedTime,
      date: assignedDate,
      desc: assignedRider ? `Assigned to ${assignedRider.name}` : "Waiting for rider dispatch",
    },
    {
      label: "Picked Up from Store",
      key: "picked_up",
      time: pickedUpTime,
      date: pickedUpDate,
      desc: "Courier picked up package",
    },
    {
      label: "Out for Delivery",
      key: "in_transit",
      time: inTransitTime || (effectiveStatus === "in_transit" ? "In Transit" : null),
      date: inTransitDate,
      desc: "En route to destination",
    },
    {
      label: "Delivered",
      key: "completed",
      time: deliveredTime,
      date: deliveredDate,
      desc: isPartiallyDelivered && !selectedSub
        ? `${deliveredCount} of ${totalPackages} packages delivered`
        : "Delivered to recipient",
    },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case "pending":
        return 0;
      case "confirmed":
      case "preparing":
        return 1;
      case "ready_for_pickup":
        return 2;
      case "picked_up":
        return 3;
      case "in_transit":
        return 4;
      case "completed":
      case "delivered":
        return 5;
      case "cancelled":
        return -1;
      default:
        if (assignedRider) return 2;
        return 0;
    }
  };

  const currentStep = getStepIndex(effectiveStatus);
  const isCancelled = effectiveStatus === "cancelled";

  return (
    <div className="min-h-screen bg-[#F7F7F2] text-[#0A504A] selection:bg-[#00A86B] selection:text-white">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Newly Placed Banner */}
        {isNewlyPlaced && (
          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-[#0A504A] via-[#00A86B] to-[#0A504A] text-white shadow-lg shadow-[#00A86B]/20 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">Order Confirmed & Allocated</h3>
                <p className="text-[#A2E4B8] text-xs mt-0.5">
                  Thank you! Your order #{order.order_number} has been placed. Sellers and courier fleet have begun processing fulfillment.
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-white/20 text-xs font-bold text-[#A2E4B8]">
              Real-Time Tracking Active
            </span>
          </div>
        )}

        {/* Navigation & Actions */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0A504A]/70 hover:text-[#00A86B] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to My Orders
          </Link>

          <div className="flex items-center gap-2">
            {primarySub?.seller_id && (
              <button
                type="button"
                onClick={() =>
                  setChatTarget({
                    id: primarySub.seller_id,
                    name: primarySub.store_name || "Merchant Store",
                    role: "seller",
                  })
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#00A86B]/40 bg-[#E8F8EE] hover:bg-[#D1E7D8] text-[#0A504A] text-xs font-bold transition shadow-2xs cursor-pointer"
              >
                <Store className="w-3.5 h-3.5 text-[#00A86B]" />
                <span>Contact Merchant</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => loadOrder(false)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#D1E7D8] bg-white hover:bg-[#E8F8EE] text-[#0A504A] text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#00A86B]" : ""}`} />
              <span>Refresh Status</span>
            </button>

            {order.status === "pending" && (
              <button
                type="button"
                onClick={() => setCancelModalOpen(true)}
                className="px-4 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-bold text-xs transition-all shadow-2xs cursor-pointer"
              >
                Cancel Order
              </button>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Main Order Card */}
        <div className="liquid-glass-card overflow-hidden mb-8 border border-[#D1E7D8] bg-white/80 backdrop-blur-md rounded-2xl shadow-sm">
          {/* Header */}
          <div className="p-6 sm:p-8 border-b border-[#D1E7D8] flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-[#0A504A] tracking-tight">
                  Order #{order.order_number}
                </h1>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    isCancelled
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : isPartiallyDelivered && selectedPackageId === "all"
                      ? "bg-teal-50 text-teal-800 border-teal-300"
                      : effectiveStatus === "completed" || effectiveStatus === "delivered"
                      ? "bg-[#E8F8EE] text-[#00A86B] border-[#A2E4B8]"
                      : effectiveStatus === "picked_up"
                      ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                      : effectiveStatus === "in_transit"
                      ? "bg-teal-100 text-teal-900 border-teal-300"
                      : "bg-[#E8F8EE] text-[#0A504A] border-[#A2E4B8]"
                  }`}
                >
                  {isPartiallyDelivered && selectedPackageId === "all"
                    ? `PARTIALLY DELIVERED (${deliveredCount}/${totalPackages} DELIVERED)`
                    : effectiveStatus.toUpperCase().replace(/_/g, " ")}
                </span>
              </div>
              <p className="text-xs text-[#0A504A]/70 mt-1">
                Placed on {new Date(order.created_at).toLocaleString()} • Currency:{" "}
                {order.currency.toUpperCase()}
              </p>
            </div>

            <div className="text-right">
              <span className="block text-[11px] font-bold text-[#0A504A]/70 uppercase tracking-wider">
                Total Amount
              </span>
              <span className="text-2xl font-black text-[#0A504A]">
                ${(order.total / 100).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Stepper with Live Milestones & Exact Timestamps */}
          {!isCancelled ? (
            <div className="p-6 sm:p-8 border-b border-[#D1E7D8] bg-[#E8F8EE]/30">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xs font-bold text-[#0A504A]/70 uppercase tracking-wider">
                    Live Fulfillment Stepper & Tracking Timeline
                  </h3>
                  <p className="text-[11px] text-[#0A504A]/60 mt-0.5">
                    {selectedSub
                      ? `Viewing tracking for Package ${selectedSub.order_number} (${selectedSub.store_name || "Store"}).`
                      : "Updated automatically in real time whenever courier rider updates package status."}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-[#00A86B]">
                  <span className="w-2 h-2 rounded-full bg-[#00A86B] animate-pulse" />
                  <span>Real-Time Telemetry Live</span>
                </span>
              </div>

              {/* Package Switcher Tabs for Multi-Vendor Orders */}
              {hasMultiplePackages && (
                <div className="mb-6 p-3.5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs">
                  <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-[#D1E7D8]/60 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-[#00A86B]" />
                      <span className="text-xs font-bold text-[#0A504A] uppercase tracking-wider">
                        Multi-Vendor Shipments ({totalPackages} Packages)
                      </span>
                    </div>
                    <span className="text-[11px] text-[#0A504A]/70 font-medium">
                      Select a package below to inspect its dedicated tracking:
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPackageId("all")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                        selectedPackageId === "all"
                          ? "bg-[#00A86B] text-white shadow-sm ring-2 ring-[#00A86B]/20"
                          : "bg-[#F8FAF9] border border-[#D1E7D8] text-[#0A504A] hover:bg-[#E8F8EE]"
                      }`}
                    >
                      <span>Entire Order</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          selectedPackageId === "all"
                            ? "bg-white/20 text-white"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {deliveredCount}/{totalPackages} Delivered
                      </span>
                    </button>

                    {order.sub_orders?.map((sub, idx) => {
                      const isSubDelivered = sub.status === "delivered";
                      const subId = sub.id || (sub as any)._id || String(idx);
                      const isSelected = selectedPackageId === subId;

                      return (
                        <button
                          key={subId}
                          type="button"
                          onClick={() => setSelectedPackageId(subId)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                            isSelected
                              ? "bg-[#0A504A] text-white shadow-sm ring-2 ring-[#0A504A]/20"
                              : "bg-[#F8FAF9] border border-[#D1E7D8] text-[#0A504A] hover:bg-[#E8F8EE]"
                          }`}
                        >
                          <span>Package {idx + 1}: {sub.store_name || `Store #${idx + 1}`}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isSubDelivered
                                ? isSelected
                                  ? "bg-[#00A86B] text-white"
                                  : "bg-emerald-100 text-[#00A86B]"
                                : isSelected
                                ? "bg-amber-400 text-black"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {isSubDelivered ? "Delivered" : sub.status.replace(/_/g, " ")}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Progress Line and Steps */}
              <div className="relative">
                {/* ============================================================ */}
                {/* MOBILE VIEW (< sm): Clean Vertical Timeline with Left Dots  */}
                {/* ============================================================ */}
                <div className="sm:hidden relative py-2 pl-1">
                  {/* Vertical connecting line from center of first dot to center of last dot */}
                  <div
                    className="absolute left-[14px] top-[14px] bottom-[14px] w-[2px] bg-[#D1E7D8] z-0 rounded-full overflow-hidden"
                  >
                    <div
                      className="w-full bg-[#00A86B] transition-all duration-500 rounded-full"
                      style={{
                        height: `${Math.max(0, Math.min(100, (currentStep / (steps.length - 1)) * 100))}%`,
                      }}
                    />
                  </div>

                  <div className="space-y-5 relative z-10">
                    {steps.map((step, idx) => {
                      const isDone = idx <= currentStep;
                      const isCurrent = idx === currentStep;

                      return (
                        <div key={step.key} className="flex items-start gap-3.5">
                          {/* Compact progress dot on the left */}
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 transition-all shadow-xs z-10 ${
                              isDone
                                ? "bg-[#00A86B] text-white ring-2 ring-emerald-100"
                                : "bg-white border-2 border-[#D1E7D8] text-[#0A504A]/60"
                            } ${isCurrent ? "ring-4 ring-[#00A86B]/30 scale-105" : ""}`}
                          >
                            {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
                          </div>

                          {/* Content properly aligned to the right of the dot */}
                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span
                                className={`text-xs font-bold ${
                                   isDone ? "text-[#0A504A]" : "text-[#0A504A]/50"
                                }`}
                              >
                                {step.label}
                              </span>

                              {step.time && isDone ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-100/70 border border-emerald-200 text-[#0A504A] font-mono text-[10px] font-bold shrink-0">
                                  <Clock className="w-2.5 h-2.5 text-[#00A86B]" />
                                  <span>{step.time}</span>
                                  {step.date && (
                                    <span className="text-[9px] text-gray-500 font-normal">
                                      ({step.date})
                                    </span>
                                  )}
                                </span>
                              ) : isCurrent ? (
                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold animate-pulse shrink-0">
                                  In Progress
                                </span>
                              ) : (
                                <span className="text-[10px] text-gray-400 shrink-0">
                                  Pending
                                </span>
                              )}
                            </div>

                            {step.desc && (
                              <p className="text-[11px] text-[#0A504A]/60 mt-0.5">
                                {step.desc}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ============================================================ */}
                {/* DESKTOP VIEW (>= sm): Horizontal Stepper with Top Track Line */}
                {/* ============================================================ */}
                <div className="hidden sm:block relative">
                  {/* Connecting track aligned precisely from center of first dot to center of last dot */}
                  <div
                    className="absolute top-[16px] h-1 bg-[#D1E7D8] z-0 overflow-hidden rounded-full"
                    style={{ left: "calc(100% / 12)", right: "calc(100% / 12)" }}
                  >
                    <div
                      className="h-full bg-[#00A86B] transition-all duration-500 rounded-full"
                      style={{
                        width: `${Math.max(0, Math.min(100, (currentStep / (steps.length - 1)) * 100))}%`,
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-6 gap-2 relative z-10">
                    {steps.map((step, idx) => {
                      const isDone = idx <= currentStep;
                      const isCurrent = idx === currentStep;

                      return (
                        <div key={step.key} className="flex flex-col items-center text-center">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-sm ${
                              isDone
                                ? "bg-[#00A86B] text-white shadow-[#00A86B]/30"
                                : "bg-white border-2 border-[#D1E7D8] text-[#0A504A]/60"
                            } ${isCurrent ? "ring-4 ring-[#00A86B]/30 scale-110" : ""}`}
                          >
                            {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                          </div>

                          <span
                            className={`mt-2.5 text-xs font-bold block ${
                              isDone ? "text-[#0A504A]" : "text-[#0A504A]/50"
                            }`}
                          >
                            {step.label}
                          </span>

                          {/* Exact Status Timestamp */}
                          {step.time && isDone ? (
                            <div className="mt-1 flex flex-col items-center">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100/70 border border-emerald-200 text-[#0A504A] font-mono text-[10px] font-bold">
                                <Clock className="w-3 h-3 text-[#00A86B]" />
                                <span>{step.time}</span>
                              </span>
                              {step.date && (
                                <span className="text-[9px] text-gray-500 font-medium mt-0.5">
                                  {step.date}
                                </span>
                              )}
                            </div>
                          ) : isCurrent ? (
                            <span className="mt-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold animate-pulse">
                              In Progress
                            </span>
                          ) : (
                            <span className="mt-1 text-[10px] text-gray-400">
                              Pending
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-rose-50 border-b border-rose-100 flex items-center gap-3">
              <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-rose-900">Order Cancelled</h4>
                <p className="text-xs text-rose-700 mt-0.5">
                  Reason: {order.cancellation_reason || "Cancelled by customer"}
                </p>
              </div>
            </div>
          )}

          {/* DEDICATED ASSIGNED COURIER RIDER CARD */}
          {!isCancelled && assignedRider && (
            <div className="p-6 sm:p-8 border-b border-[#D1E7D8] bg-gradient-to-r from-[#E8F8EE]/90 via-[#F8FAF9] to-[#E8F8EE]/90">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                {/* Rider Info Header */}
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#00A86B] text-white flex items-center justify-center shadow-lg shadow-[#00A86B]/25 shrink-0">
                    <Bike className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#0A504A] text-white">
                        Assigned Courier Rider
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified Agent
                      </span>
                    </div>

                    <h3 className="text-lg font-serif font-black text-[#0A504A] mt-1">
                      {assignedRider.name || "Delivery Courier"}
                    </h3>

                    <div className="text-xs text-[#0A504A]/70 flex flex-wrap items-center gap-3 mt-1">
                      <span className="font-medium capitalize">
                        Vehicle: <strong className="text-[#0A504A]">{assignedRider.vehicle_type || "Motorcycle"}</strong>
                      </span>
                      <span>•</span>
                      <span className="font-mono font-medium">
                        Plate: <strong className="text-[#0A504A]">{assignedRider.vehicle_number || "NX-RIDER-01"}</strong>
                      </span>
                      <span>•</span>
                      <span className="font-mono">
                        Phone: <strong className="text-[#0A504A]">{assignedRider.phone || "+1 555-000-0000"}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Action Buttons: Direct Call & Chat */}
                <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
                  {assignedRider.phone && (
                    <a
                      href={`tel:${assignedRider.phone}`}
                      className="px-4 py-2.5 rounded-xl bg-white border border-[#D1E7D8] hover:border-[#00A86B] text-[#0A504A] text-xs font-bold flex items-center gap-2 transition shadow-xs hover:bg-[#E8F8EE] cursor-pointer"
                    >
                      <Phone className="w-4 h-4 text-[#00A86B]" />
                      <span>Call Rider ({assignedRider.phone})</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setChatTarget({
                        id: assignedRider.user_id || assignedRider.agent_id || "courier-dispatch",
                        name: assignedRider.name || "Courier Driver",
                        role: "delivery_agent",
                      })
                    }
                    className="px-4 py-2.5 rounded-xl bg-[#00A86B] hover:bg-[#0A504A] text-white text-xs font-bold flex items-center gap-2 transition shadow-md shadow-[#00A86B]/20 cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Chat Rider</span>
                  </button>
                </div>
              </div>

              {/* Status & Timing Highlight Banner */}
              <div className="mt-4 p-3.5 rounded-xl bg-white border border-[#D1E7D8] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#00A86B] animate-ping" />
                  <span className="text-[#0A504A] font-medium">
                    {effectiveStatus === "picked_up"
                      ? `Package was picked up from Store Dispatch Hub on ${pickedUpDate || ""} ${pickedUpTime || ""}. Delivery is underway.`
                      : effectiveStatus === "in_transit"
                      ? `Courier is actively out for delivery to your address (${order.delivery_address?.city || "your city"}).`
                      : effectiveStatus === "completed" || effectiveStatus === "delivered"
                      ? `Package was safely delivered to your address on ${deliveredDate || ""} ${deliveredTime || ""}.`
                      : `Courier assigned on ${assignedDate || ""} ${assignedTime || ""}. Heading to store dispatch hub for pickup.`}
                  </span>
                </div>

                <span className="px-2.5 py-1 rounded-lg bg-[#E8F8EE] text-[#00A86B] font-bold text-[11px] uppercase tracking-wider self-start sm:self-auto shrink-0">
                  Status: {effectiveStatus.replace(/_/g, " ")}
                </span>
              </div>
            </div>
          )}

          {/* Fallback Banner when No Rider Assigned Yet */}
          {!isCancelled && !assignedRider && (
            <div className="px-6 py-4 border-b border-[#D1E7D8] bg-[#F8FAF9] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5 text-[#0A504A]">
                <Bike className="w-4 h-4 text-[#00A86B]" />
                <span className="font-medium">
                  {effectiveStatus === "completed"
                    ? "Order fulfilled and delivered to destination."
                    : "Courier assignment in progress. Once rider is assigned, their details, phone number, and live status will appear here."}
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#00A86B] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {effectiveStatus === "completed" ? "Delivered" : "Standby"}
              </span>
            </div>
          )}

          {/* REAL DELIVERY DESTINATION & PAYMENT DETAILS CARD */}
          <div className="p-6 sm:p-8 border-b border-[#D1E7D8] grid grid-cols-1 md:grid-cols-2 gap-6 bg-white">
            {/* Delivery Destination */}
            <div className="space-y-3 p-5 rounded-2xl bg-[#F8FAF9] border border-[#D1E7D8]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0A504A]">
                <MapPin className="w-4 h-4 text-[#00A86B]" />
                <span>Delivery Destination & Drop Location</span>
              </div>

              {order.delivery_address ? (
                <div className="text-xs text-gray-700 space-y-1">
                  <p className="font-bold text-sm text-[#0A504A]">
                    {order.delivery_address.recipient_name}
                  </p>
                  <p className="text-gray-600">
                    {order.delivery_address.line1}
                    {order.delivery_address.line2 ? `, ${order.delivery_address.line2}` : ""}
                  </p>
                  <p className="text-gray-600">
                    {order.delivery_address.city}, {order.delivery_address.state}{" "}
                    {order.delivery_address.postal_code}, {order.delivery_address.country}
                  </p>
                  <p className="font-mono text-xs text-[#0A504A]/80 flex items-center gap-1.5 pt-1">
                    <Phone className="w-3.5 h-3.5 text-[#00A86B]" />
                    <span>{order.delivery_address.phone}</span>
                  </p>
                </div>
              ) : (
                <p className="text-xs text-gray-500">No destination specified</p>
              )}

              {/* Courier Drop Instructions */}
              <div className="pt-2 border-t border-gray-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                  Rider Drop Instructions
                </span>
                <p className="text-xs text-gray-700 bg-white p-2.5 rounded-xl border border-gray-200">
                  {order.notes || "Standard doorstep drop-off."}
                </p>
              </div>
            </div>

            {/* Payment & Escrow Details */}
            <div className="space-y-3 p-5 rounded-2xl bg-[#F8FAF9] border border-[#D1E7D8]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[#0A504A]">
                  <CreditCard className="w-4 h-4 text-[#00A86B]" />
                  <span>Payment & Escrow Protection</span>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#0A504A] text-[10px] font-bold uppercase">
                  {order.payment_status}
                </span>
              </div>

              <div className="text-xs space-y-2">
                <div className="flex items-center justify-between text-gray-600">
                  <span>Payment Method</span>
                  <span className="font-semibold text-gray-900">
                    {order.stripe_payment_intent_id
                      ? "Credit / Debit Card (Stripe Escrow)"
                      : "Cash on Delivery (Pay at Doorstep)"}
                  </span>
                </div>

                {order.stripe_payment_intent_id && (
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Transaction ID</span>
                    <span className="font-mono text-[10px] text-gray-700 truncate max-w-[200px]">
                      {order.stripe_payment_intent_id}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-gray-600">
                  <span>Items Subtotal</span>
                  <span className="font-semibold text-gray-900 font-mono">
                    ${(order.subtotal / 100).toFixed(2)}
                  </span>
                </div>

                {order.discount_amount > 0 && (
                  <div className="flex items-center justify-between text-emerald-600 font-semibold">
                    <span>Coupon Savings {order.coupon_code ? `(${order.coupon_code})` : ""}</span>
                    <span className="font-mono">-${(order.discount_amount / 100).toFixed(2)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span className="font-semibold text-gray-900 font-mono">
                    ${(order.delivery_fee / 100).toFixed(2)}
                  </span>
                </div>

                <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-sm font-bold text-[#0A504A]">
                  <span>Grand Total</span>
                  <span className="text-base font-black font-mono">
                    ${(order.total / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sub-Orders Partitioned Table */}
          <div className="p-6 sm:p-8">
            <h3 className="text-xs font-bold text-[#0A504A]/70 uppercase tracking-wider mb-4">
              Order Packages & Items ({order.sub_orders?.length || 0} Vendors)
            </h3>

            <div className="space-y-4">
              {order.sub_orders?.map((sub) => (
                <div key={sub.id || (sub as any)._id} className="p-4 rounded-2xl bg-[#E8F8EE]/30 border border-[#D1E7D8]">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#D1E7D8]">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#00A86B]" />
                      <span className="text-xs font-bold text-[#0A504A]">
                        Package {sub.order_number}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setChatTarget({
                            id: sub.seller_id,
                            name: sub.store_name || `Store #${sub.order_number}`,
                            role: "seller",
                          })
                        }
                        className="px-3 py-1 rounded-xl bg-white border border-[#D1E7D8] hover:bg-[#E8F8EE] text-[#0A504A] hover:text-[#00A86B] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-[#00A86B]" />
                        <span>Contact Merchant</span>
                      </button>
                      <span className="text-[11px] font-bold text-[#00A86B] uppercase">
                        {sub.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {sub.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-[#0A504A] font-medium">
                          {item.product_name}{" "}
                          <span className="text-[#0A504A]/60">× {item.quantity}</span>
                        </span>
                        <span className="font-bold text-[#0A504A]">
                          ${(((item.subtotal || item.unit_price * item.quantity)) / 100).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="liquid-glass-card max-w-md w-full p-6 bg-white">
            <h3 className="text-base font-bold text-slate-900 mb-2">Cancel Order</h3>
            <p className="text-xs text-slate-500 mb-4">
              Are you sure you want to cancel order #{order.order_number}? All reserved items will be released back into stock.
            </p>

            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (optional)"
              className="w-full p-3 rounded-xl border border-slate-200 text-xs mb-4 focus:outline-none focus:border-blue-500"
              rows={3}
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={isCancelling}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/25 cursor-pointer disabled:opacity-50"
              >
                {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Order Chat Drawer */}
      {chatTarget && order && (
        <ChatDrawer
          isOpen={Boolean(chatTarget)}
          onClose={() => setChatTarget(null)}
          recipientId={chatTarget.id}
          recipientName={chatTarget.name}
          recipientRole={chatTarget.role}
          orderId={order.id}
        />
      )}
    </div>
  );
}
