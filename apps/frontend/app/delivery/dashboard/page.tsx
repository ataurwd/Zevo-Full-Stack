"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Navbar } from "../../../components/Navbar";
import { ProtectedRoute } from "../../../components/auth/ProtectedRoute";
import { useSocket } from "../../../hooks/useSocket";
import { ChatDrawer } from "../../../components/chat/ChatDrawer";
import {
  Bike,
  Navigation,
  CheckCircle2,
  DollarSign,
  Star,
  MapPin,
  Clock,
  ArrowRight,
  Radio,
  Sparkles,
  Package,
  AlertCircle,
  Play,
  RotateCcw,
  Search,
  Filter,
  Phone,
  Headphones,
  MessageSquare,
  Wallet,
  Receipt,
  FileText,
  Calendar,
  Send,
  CreditCard,
  ShieldCheck,
  ChevronRight,
  Info,
  Check,
  Building2,
  User,
  Truck,
  History,
  TrendingUp,
} from "lucide-react";
import {
  getRiderProfile,
  toggleRiderOnlineStatus,
  getRiderTasks,
  updateRiderLocation,
  startPickup,
  confirmPickedUp,
  startCustomerDelivery,
  completeDelivery,
  DeliveryAgentProfile,
  updateRiderProfile,
  DeliveryTaskItem,
  requestRiderCashout,
  getRiderPayouts,
  RiderPayoutItem,
} from "../../../lib/api/delivery";
import { getConversations, ConversationItem } from "../../../lib/api/chat";
import { getOrderById, Order } from "../../../lib/api/orders";

export default function RiderDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["DELIVERY_AGENT", "ADMIN", "SUPER_ADMIN"]}>
      <RiderDashboardContent />
    </ProtectedRoute>
  );
}

function RiderDashboardContent() {
  const { socket } = useSocket();

  // Navigation Tabs
  type TabType = "active" | "history" | "chat" | "wallet" | "profile";
  const [activeTab, setActiveTab] = useState<TabType>("active");

  // Core Data
  const [profile, setProfile] = useState<DeliveryAgentProfile | null>(null);
  const [tasks, setTasks] = useState<DeliveryTaskItem[]>([]);
  const [payouts, setPayouts] = useState<RiderPayoutItem[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Live GPS Telematics Simulation
  const [simulating, setSimulating] = useState(false);
  const [simStep, setSimStep] = useState(0);

  // In-App Chat Drawer State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState<{
    id: string;
    name: string;
    role: "customer" | "seller" | "delivery_agent" | "admin";
    orderId?: string;
    subOrderId?: string;
  } | null>(null);

  // Delivery Details / Receipt Modal State
  const [selectedTask, setSelectedTask] = useState<DeliveryTaskItem | null>(null);
  const [taskOrderDetails, setTaskOrderDetails] = useState<Order | null>(null);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);

  // History Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "delivered" | "in_progress" | "cancelled">("all");

  // Cashout / Payout Modal State
  const [cashoutModalOpen, setCashoutModalOpen] = useState(false);
  const [cashoutAmount, setCashoutAmount] = useState("");
  const [cashoutMethod, setCashoutMethod] = useState<"bkash" | "nagad" | "rocket" | "bank">("bkash");
  const [cashoutAccount, setCashoutAccount] = useState("");
  const [cashoutLoading, setCashoutLoading] = useState(false);
  const [cashoutSuccess, setCashoutSuccess] = useState<string | null>(null);
  const [cashoutError, setCashoutError] = useState<string | null>(null);

  // Delivery Zones Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editCity, setEditCity] = useState("");
  const [editZones, setEditZones] = useState<string[]>([]);
  const [editPlate, setEditPlate] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [zoneInput, setZoneInput] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [agentProfile, agentTasks, agentPayouts, convs] = await Promise.all([
        getRiderProfile(),
        getRiderTasks(),
        getRiderPayouts().catch(() => []),
        getConversations().catch(() => []),
      ]);
      setProfile(agentProfile);
      setTasks(agentTasks || []);
      setPayouts(agentPayouts || []);
      setConversations(convs || []);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Real-time listener for incoming delivery assignments and status updates
  useEffect(() => {
    if (!socket) return;

    const handleTaskAssigned = () => {
      loadData();
    };

    socket.on("delivery:task_assigned", handleTaskAssigned);
    socket.on("delivery:status_updated", handleTaskAssigned);

    return () => {
      socket.off("delivery:task_assigned", handleTaskAssigned);
      socket.off("delivery:status_updated", handleTaskAssigned);
    };
  }, [socket]);

  // Toggle online/offline status
  const handleToggleOnline = async () => {
    if (!profile) return;
    try {
      const updated = await toggleRiderOnlineStatus(!profile.is_online);
      setProfile(updated);
    } catch {}
  };

  // State machine progression handler
  const handleAdvanceStatus = async (task: DeliveryTaskItem) => {
    try {
      setActionLoading(true);
      let updatedTask: DeliveryTaskItem;

      if (task.status === "assigned") {
        updatedTask = await startPickup(task._id);
      } else if (task.status === "en_route_pickup") {
        updatedTask = await confirmPickedUp(task._id);
      } else if (task.status === "picked_up") {
        updatedTask = await startCustomerDelivery(task._id);
      } else if (task.status === "en_route_delivery") {
        updatedTask = await completeDelivery(task._id);
      } else {
        return;
      }

      setTasks((prev) =>
        prev.map((t) => (t._id === task._id ? { ...t, status: updatedTask.status } : t))
      );
      // Reload profile and payouts to reflect updated earnings
      const [refreshedProfile, refreshedPayouts] = await Promise.all([
        getRiderProfile(),
        getRiderPayouts().catch(() => []),
      ]);
      setProfile(refreshedProfile);
      setPayouts(refreshedPayouts);
    } catch (err: any) {
      alert(err?.message || "Failed to update delivery status");
    } finally {
      setActionLoading(false);
    }
  };

  // Simulated GPS Telematics (advances coordinates and emits to customer tracking)
  const handleSimulateGPS = async (task: DeliveryTaskItem) => {
    if (simulating) return;
    setSimulating(true);

    const waypoints = [
      { lat: 23.7925, lon: 90.4078 },
      { lat: 23.7900, lon: 90.4100 },
      { lat: 23.7850, lon: 90.4120 },
      { lat: 23.7800, lon: 90.4150 },
      { lat: 23.7750, lon: 90.4180 },
    ];

    for (let i = 0; i < waypoints.length; i++) {
      setSimStep(i + 1);
      await updateRiderLocation({
        taskId: task._id,
        latitude: waypoints[i].lat,
        longitude: waypoints[i].lon,
      });
      await new Promise((r) => setTimeout(r, 1200));
    }

    setSimulating(false);
  };

  // View Task Order Details Modal
  const handleViewTaskDetails = async (task: DeliveryTaskItem) => {
    setSelectedTask(task);
    setTaskOrderDetails(null);
    setLoadingOrderDetails(true);
    try {
      if (task.order_id) {
        const orderIdStr = typeof task.order_id === "string" ? task.order_id : (task.order_id as any)?._id || String(task.order_id);
        const orderData = await getOrderById(orderIdStr);
        setTaskOrderDetails(orderData);
      }
    } catch {
      // Non-blocking
    } finally {
      setLoadingOrderDetails(false);
    }
  };

  // Cashout Submission
  const handleSubmitCashout = async (e: React.FormEvent) => {
    e.preventDefault();
    setCashoutError(null);
    setCashoutSuccess(null);
    const amountVal = parseFloat(cashoutAmount);

    if (isNaN(amountVal) || amountVal <= 0) {
      setCashoutError("Please enter a valid cashout amount.");
      return;
    }
    const amountCents = Math.round(amountVal * 100);
    const availableCents = profile?.pending_earnings || 0;
    if (amountCents > availableCents) {
      setCashoutError(`Amount exceeds available balance of $${(availableCents / 100).toFixed(2)}`);
      return;
    }
    if (!cashoutAccount.trim()) {
      setCashoutError("Please provide your account number or mobile banking wallet number.");
      return;
    }

    try {
      setCashoutLoading(true);
      await requestRiderCashout({
        amount: amountCents,
        method: cashoutMethod,
        account_details: cashoutAccount.trim(),
      });
      setCashoutSuccess("Cashout request submitted successfully! Funds will be transferred within 2-4 hours.");
      // Refresh profile and payouts
      const [refreshedProfile, refreshedPayouts] = await Promise.all([
        getRiderProfile(),
        getRiderPayouts().catch(() => []),
      ]);
      setProfile(refreshedProfile);
      setPayouts(refreshedPayouts);
      setTimeout(() => {
        setCashoutModalOpen(false);
        setCashoutSuccess(null);
        setCashoutAmount("");
        setCashoutAccount("");
      }, 2000);
    } catch (err: any) {
      setCashoutError(err?.message || "Failed to process cashout request");
    } finally {
      setCashoutLoading(false);
    }
  };

  // Profile Edit
  const openEditZonesModal = () => {
    setEditCity(profile?.service_city || "Dhaka");
    setEditZones(profile?.delivery_zones || ["Dhaka North", "Gulshan", "Banani", "Uttara", "Dhanmondi"]);
    setEditPlate(profile?.vehicle_number || "");
    setEditPhone(profile?.phone || "");
    setEditModalOpen(true);
    setSaveSuccessMsg(null);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const updated = await updateRiderProfile({
        service_city: editCity,
        delivery_zones: editZones,
        vehicle_number: editPlate,
        phone: editPhone,
      });
      setProfile(updated);
      setSaveSuccessMsg("Delivery locations and profile updated successfully!");
      setTimeout(() => {
        setEditModalOpen(false);
        setSaveSuccessMsg(null);
      }, 1500);
    } catch {
      // Error
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Active delivery task (if any)
  const activeTask = tasks.find(
    (t) =>
      t.status === "assigned" ||
      t.status === "en_route_pickup" ||
      t.status === "picked_up" ||
      t.status === "en_route_delivery"
  );

  // Filtered Delivery History
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Status filter
      if (statusFilter === "delivered" && t.status !== "delivered") return false;
      if (statusFilter === "in_progress" && (t.status === "delivered" || t.status === "cancelled" || t.status === "failed")) return false;
      if (statusFilter === "cancelled" && t.status !== "cancelled" && t.status !== "failed") return false;

      // Query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const taskNum = (t.task_number || "").toLowerCase();
      const recipient = (t.delivery_address?.recipient_name || "").toLowerCase();
      const city = (t.delivery_address?.city || "").toLowerCase();
      const storeName = (t.pickup_address?.recipient_name || "").toLowerCase();

      return taskNum.includes(q) || recipient.includes(q) || city.includes(q) || storeName.includes(q);
    });
  }, [tasks, statusFilter, searchQuery]);

  const completedCount = tasks.filter((t) => t.status === "delivered").length;

  return (
    <div className="min-h-screen bg-[#F7F7F2] text-[#0A504A] pb-20 selection:bg-[#00A86B] selection:text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* TOP BANNER: RIDER IDENTITY & ONLINE STATUS */}
        <div className="liquid-glass-card p-6 sm:p-8 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-[#D1E7D8] bg-white/85 backdrop-blur-md rounded-3xl shadow-sm">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-tr from-[#0A504A] via-[#00A86B] to-[#10B981] flex items-center justify-center text-white shadow-lg shadow-[#00A86B]/25 shrink-0">
              <Bike className="w-9 h-9 sm:w-10 sm:h-10" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-[#E8F8EE] border border-[#A2E4B8] text-[#00A86B] text-[11px] font-black uppercase tracking-wider">
                  {profile?.vehicle_type?.toUpperCase() || "MOTORCYCLE"}
                </span>
                <span className="text-xs font-mono font-bold text-[#0A504A]/70">
                  {profile?.vehicle_number || "NX-RIDER-01"}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#00A86B]" /> Verified Fleet Rider
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#0A504A] tracking-tight">
                Rider Dispatch & Logistics Portal
              </h1>
              <p className="text-xs text-[#0A504A]/70 mt-0.5">
                Hyperlocal order dispatch, live routing telematics, instant customer chat, and payout earnings.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("open_support_chat"));
                }
              }}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#0A504A] hover:bg-[#00A86B] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Headphones className="w-4 h-4 text-[#A2E4B8]" />
              <span>Contact Dispatch Support</span>
            </button>
          </div>

          {/* Online/Offline Shift Toggle */}
          <div className="flex items-center gap-4 bg-[#E8F8EE]/70 p-3.5 rounded-2xl border border-[#D1E7D8]">
            <div className="flex flex-col text-right sm:text-left">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${profile?.is_online ? "bg-[#00A86B] animate-ping" : "bg-gray-400"}`} />
                <span className="text-xs font-black text-[#0A504A]">
                  {profile?.is_online ? "Active & Online" : "Currently Offline"}
                </span>
              </div>
              <span className="text-[10px] text-[#0A504A]/70 mt-0.5">
                {profile?.is_online ? "Receiving live delivery assignments" : "Tap switch to begin receiving tasks"}
              </span>
            </div>

            <button
              onClick={handleToggleOnline}
              className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                profile?.is_online ? "bg-[#00A86B]" : "bg-slate-300"
              }`}
            >
              <div
                className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${
                  profile?.is_online ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* TOP STATS CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
          <div className="liquid-glass-card p-5 border border-[#D1E7D8] bg-white/90 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-[#0A504A]/60 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Completed Deliveries</span>
              <CheckCircle2 className="w-4 h-4 text-[#00A86B]" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#0A504A]">
              {profile?.total_deliveries || completedCount}
            </div>
            <div className="text-[11px] text-[#0A504A]/60 mt-1">Total orders delivered safely</div>
          </div>

          <div className="liquid-glass-card p-5 border border-[#D1E7D8] bg-white/90 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-[#0A504A]/60 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Available Balance</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700">
              ${((profile?.pending_earnings || 0) / 100).toFixed(2)}
            </div>
            <div className="text-[11px] text-[#0A504A]/60 mt-1">Ready for instant cashout</div>
          </div>

          <div className="liquid-glass-card p-5 border border-[#D1E7D8] bg-white/90 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-[#0A504A]/60 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Earnings</span>
              <Sparkles className="w-4 h-4 text-[#00A86B]" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#0A504A]">
              ${((profile?.total_earnings || 0) / 100).toFixed(2)}
            </div>
            <div className="text-[11px] text-[#0A504A]/60 mt-1">Lifetime compensation</div>
          </div>

          <div className="liquid-glass-card p-5 border border-[#D1E7D8] bg-white/90 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-[#0A504A]/60 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Rider Rating</span>
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#0A504A]">
              {(profile?.rating || 5.0).toFixed(1)}
            </div>
            <div className="text-[11px] text-[#0A504A]/60 mt-1">100% On-time satisfaction</div>
          </div>
        </div>

        {/* PRIMARY TAB NAVIGATION BAR */}
        <div className="flex items-center gap-2 p-1.5 mb-8 rounded-2xl bg-white/80 border border-[#D1E7D8] shadow-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "active"
                ? "bg-[#00A86B] text-white shadow-sm shadow-[#00A86B]/25"
                : "text-[#0A504A]/70 hover:bg-[#E8F8EE] hover:text-[#0A504A]"
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Active Delivery</span>
            {activeTask && (
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "history"
                ? "bg-[#00A86B] text-white shadow-sm shadow-[#00A86B]/25"
                : "text-[#0A504A]/70 hover:bg-[#E8F8EE] hover:text-[#0A504A]"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Order History</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === "history" ? "bg-white/20 text-white" : "bg-[#E8F8EE] text-[#00A86B]"}`}>
              {completedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "chat"
                ? "bg-[#00A86B] text-white shadow-sm shadow-[#00A86B]/25"
                : "text-[#0A504A]/70 hover:bg-[#E8F8EE] hover:text-[#0A504A]"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Live Chat & Messages</span>
          </button>

          <button
            onClick={() => setActiveTab("wallet")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "wallet"
                ? "bg-[#00A86B] text-white shadow-sm shadow-[#00A86B]/25"
                : "text-[#0A504A]/70 hover:bg-[#E8F8EE] hover:text-[#0A504A]"
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Earnings & Payout</span>
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "profile"
                ? "bg-[#00A86B] text-white shadow-sm shadow-[#00A86B]/25"
                : "text-[#0A504A]/70 hover:bg-[#E8F8EE] hover:text-[#0A504A]"
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Coverage Zones & Profile</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: ACTIVE DELIVERY & ROUTE DISPATCH                  */}
        {/* ========================================================= */}
        {activeTab === "active" && (
          <div className="space-y-6 animate-fade-in">
            {activeTask ? (
              <div className="liquid-glass-card p-6 sm:p-8 border border-[#D1E7D8] bg-white rounded-3xl shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#D1E7D8] gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono font-bold text-[#00A86B] bg-[#E8F8EE] px-3 py-1 rounded-xl border border-[#A2E4B8]">
                        {activeTask.task_number}
                      </span>
                      <span className="text-xs font-extrabold uppercase px-3 py-1 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300">
                        Payout: ${(activeTask.rider_earnings / 100).toFixed(2)}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-[#0A504A] mt-2 flex items-center gap-2">
                      <span>Status:</span>
                      <span className="text-[#00A86B] uppercase tracking-wide">
                        {activeTask.status.replace(/_/g, " ")}
                      </span>
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleSimulateGPS(activeTask)}
                      disabled={simulating}
                      className="px-4 py-2.5 rounded-xl bg-[#E8F8EE] hover:bg-[#D1E7D8] text-[#0A504A] font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5 text-[#00A86B]" />
                      <span>
                        {simulating ? `Broadcasting GPS (${simStep}/5)...` : "Simulate GPS Movement"}
                      </span>
                    </button>

                    <button
                      onClick={() => handleViewTaskDetails(activeTask)}
                      className="px-4 py-2.5 rounded-xl bg-white border border-[#D1E7D8] hover:border-[#00A86B] text-[#0A504A] font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#00A86B]" />
                      <span>View Order Package</span>
                    </button>
                  </div>
                </div>

                {/* Waypoint Route Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 my-6">
                  {/* Store Pickup Location */}
                  <div className="p-5 rounded-2xl bg-[#E8F8EE]/60 border border-[#D1E7D8] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-[#00A86B] mb-2">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" /> 1. STORE PICKUP HUB
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-white border border-[#D1E7D8] text-[10px] font-mono text-[#0A504A]">
                          Seller Location
                        </span>
                      </div>
                      <div className="text-base font-black text-[#0A504A]">
                        {activeTask.pickup_address?.recipient_name || "Merchant Fulfillment Hub"}
                      </div>
                      <div className="text-xs text-[#0A504A]/70 mt-1">
                        {activeTask.pickup_address?.line1}, {activeTask.pickup_address?.city}
                      </div>
                      <div className="text-xs text-[#0A504A]/80 font-mono mt-1">
                        Phone: {activeTask.pickup_address?.phone || "+1 555-000-0000"}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#D1E7D8]/60">
                      {activeTask.pickup_address?.phone && (
                        <a
                          href={`tel:${activeTask.pickup_address.phone}`}
                          className="px-3 py-1.5 rounded-lg bg-white border border-[#D1E7D8] hover:border-[#00A86B] text-xs font-bold text-[#0A504A] flex items-center gap-1.5 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 text-[#00A86B]" /> Call Store
                        </a>
                      )}
                      <button
                        onClick={() => {
                          setChatTarget({
                            id: String(activeTask.seller_id || "seller-hub"),
                            name: activeTask.pickup_address?.recipient_name || "Store Dispatch",
                            role: "seller",
                            orderId: String(activeTask.order_id || ""),
                          });
                          setChatOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white border border-[#D1E7D8] hover:border-[#00A86B] text-xs font-bold text-[#0A504A] flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-[#00A86B]" /> Chat Store
                      </button>
                    </div>
                  </div>

                  {/* Customer Dropoff Location */}
                  <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-800 mb-2">
                        <span className="flex items-center gap-1.5">
                          <Navigation className="w-4 h-4 text-[#00A86B]" /> 2. CUSTOMER DESTINATION
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-white border border-emerald-200 text-[10px] font-mono text-[#0A504A]">
                          Doorstep Drop
                        </span>
                      </div>
                      <div className="text-base font-black text-[#0A504A]">
                        {activeTask.delivery_address?.recipient_name || "Customer Dropoff"}
                      </div>
                      <div className="text-xs text-[#0A504A]/70 mt-1">
                        {activeTask.delivery_address?.line1}, {activeTask.delivery_address?.city}
                      </div>
                      <div className="text-xs text-[#0A504A]/80 font-mono mt-1">
                        Phone: {activeTask.delivery_address?.phone || "+1 555-000-0000"}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-emerald-200/60">
                      {activeTask.delivery_address?.phone && (
                        <a
                          href={`tel:${activeTask.delivery_address.phone}`}
                          className="px-3 py-1.5 rounded-lg bg-white border border-emerald-200 hover:border-[#00A86B] text-xs font-bold text-[#0A504A] flex items-center gap-1.5 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 text-[#00A86B]" /> Call Customer
                        </a>
                      )}
                      <button
                        onClick={() => {
                          setChatTarget({
                            id: String(activeTask.customer_id || "customer"),
                            name: activeTask.delivery_address?.recipient_name || "Customer",
                            role: "customer",
                            orderId: String(activeTask.order_id || ""),
                          });
                          setChatOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white border border-emerald-200 hover:border-[#00A86B] text-xs font-bold text-[#0A504A] flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-[#00A86B]" /> Chat Customer
                      </button>
                    </div>
                  </div>
                </div>

                {/* Primary Next-Step Action Button */}
                <div className="pt-3">
                  <button
                    onClick={() => handleAdvanceStatus(activeTask)}
                    disabled={actionLoading}
                    className="w-full py-4 px-6 rounded-2xl bg-[#00A86B] hover:bg-[#0A504A] text-white font-extrabold text-sm tracking-wide transition-all shadow-md shadow-[#00A86B]/25 hover:shadow-lg flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
                  >
                    {activeTask.status === "assigned" && (
                      <>
                        <span>Accept & Start Route to Store</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                    {activeTask.status === "en_route_pickup" && (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-white" />
                        <span>Arrived at Store — Confirm Order Picked Up</span>
                      </>
                    )}
                    {activeTask.status === "picked_up" && (
                      <>
                        <Navigation className="w-5 h-5 text-white" />
                        <span>Depart Store — Start Route to Customer</span>
                      </>
                    )}
                    {activeTask.status === "en_route_delivery" && (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-white" />
                        <span>Arrived at Destination — Confirm Delivery & Collect Payout</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="liquid-glass-card p-12 sm:p-16 text-center border border-[#D1E7D8] bg-white rounded-3xl shadow-xs">
                <div className="w-16 h-16 rounded-3xl bg-[#E8F8EE] border border-[#A2E4B8] flex items-center justify-center mx-auto mb-4 text-[#00A86B]">
                  <Bike className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-[#0A504A]">No Active Delivery Task</h3>
                <p className="text-xs text-[#0A504A]/70 max-w-md mx-auto mt-1 leading-relaxed">
                  {profile?.is_online
                    ? "You are active & online! As soon as an admin or merchant allocates an order matching your delivery coverage zones, it will appear here instantly."
                    : "You are currently offline. Turn on your status above to receive new delivery tasks."}
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <button
                    onClick={() => setActiveTab("history")}
                    className="px-4 py-2 rounded-xl bg-[#E8F8EE] text-[#0A504A] font-bold text-xs hover:bg-[#D1E7D8] transition-colors cursor-pointer"
                  >
                    View Completed Deliveries
                  </button>
                  <button
                    onClick={() => setActiveTab("profile")}
                    className="px-4 py-2 rounded-xl bg-white border border-[#D1E7D8] text-[#0A504A] font-bold text-xs hover:border-[#00A86B] transition-colors cursor-pointer"
                  >
                    Check Service Locations
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: ORDER & DELIVERY HISTORY                           */}
        {/* ========================================================= */}
        {activeTab === "history" && (
          <div className="space-y-6 animate-fade-in">
            {/* Search & Filter Header */}
            <div className="liquid-glass-card p-5 border border-[#D1E7D8] bg-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#0A504A]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Task #, Recipient Name, or City..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F7F7F2] border border-[#D1E7D8] text-xs text-[#0A504A] placeholder-[#0A504A]/40 focus:bg-white focus:outline-none focus:border-[#00A86B]"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {(["all", "delivered", "in_progress", "cancelled"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer whitespace-nowrap ${
                      statusFilter === filter
                        ? "bg-[#00A86B] text-white shadow-2xs"
                        : "bg-[#F7F7F2] text-[#0A504A]/70 hover:bg-[#E8F8EE]"
                    }`}
                  >
                    {filter.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* History Task Cards List */}
            <div className="liquid-glass-card border border-[#D1E7D8] bg-white rounded-2xl overflow-hidden shadow-xs">
              {filteredTasks.length === 0 ? (
                <div className="py-16 text-center">
                  <Package className="w-12 h-12 text-[#0A504A]/30 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-[#0A504A]">No deliveries found</h4>
                  <p className="text-xs text-[#0A504A]/60 mt-0.5">
                    {searchQuery ? "Try refining your search query." : "Completed deliveries will be archived here."}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#D1E7D8]">
                  {filteredTasks.map((task) => {
                    const isDelivered = task.status === "delivered";
                    const isCancelled = task.status === "cancelled" || task.status === "failed";
                    const dateStr = task.actual_delivery
                      ? new Date(task.actual_delivery).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
                      : task.created_at
                      ? new Date(task.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
                      : "Recently";

                    return (
                      <div
                        key={task._id}
                        className="p-5 sm:p-6 hover:bg-[#F7F7F2]/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-start sm:items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                              isDelivered
                                ? "bg-[#E8F8EE] text-[#00A86B]"
                                : isCancelled
                                ? "bg-rose-50 text-rose-600"
                                : "bg-blue-50 text-blue-600"
                            }`}
                          >
                            {isDelivered ? (
                              <CheckCircle2 className="w-6 h-6" />
                            ) : isCancelled ? (
                              <AlertCircle className="w-6 h-6" />
                            ) : (
                              <Truck className="w-6 h-6" />
                            )}
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="font-mono text-xs font-bold text-[#0A504A]">
                                {task.task_number}
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  isDelivered
                                    ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                                    : isCancelled
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {task.status.replace(/_/g, " ")}
                              </span>
                            </div>

                            <div className="text-xs text-[#0A504A]/80 flex flex-wrap items-center gap-2">
                              <span>
                                Dropoff: <strong>{task.delivery_address?.recipient_name}</strong> ({task.delivery_address?.city})
                              </span>
                              <span>•</span>
                              <span className="text-[#0A504A]/60 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-[#00A86B]" /> {dateStr}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#D1E7D8]/60">
                          <div className="text-right">
                            <span className="text-sm font-black text-emerald-700">
                              +${(task.rider_earnings / 100).toFixed(2)}
                            </span>
                            <div className="text-[10px] text-[#0A504A]/60">Payout Earned</div>
                          </div>

                          <button
                            onClick={() => handleViewTaskDetails(task)}
                            className="px-3.5 py-2 rounded-xl bg-white border border-[#D1E7D8] hover:border-[#00A86B] text-xs font-bold text-[#0A504A] flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                          >
                            <Receipt className="w-3.5 h-3.5 text-[#00A86B]" />
                            <span>Details</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: IN-APP LIVE CHAT & MESSAGING HUB                  */}
        {/* ========================================================= */}
        {activeTab === "chat" && (
          <div className="space-y-6 animate-fade-in">
            {/* Quick Contact Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Customer Quick Chat */}
              <div
                onClick={() => {
                  if (activeTask?.customer_id) {
                    setChatTarget({
                      id: String(activeTask.customer_id),
                      name: activeTask.delivery_address?.recipient_name || "Customer",
                      role: "customer",
                      orderId: String(activeTask.order_id || ""),
                    });
                    setChatOpen(true);
                  }
                }}
                className={`p-5 rounded-2xl border transition-all ${
                  activeTask
                    ? "bg-white border-[#D1E7D8] hover:border-[#00A86B] shadow-xs cursor-pointer"
                    : "bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#00A86B] flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-[#0A504A]">Chat Customer</h4>
                    <p className="text-[11px] text-[#0A504A]/60">
                      {activeTask ? activeTask.delivery_address?.recipient_name : "No active task"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Store Quick Chat */}
              <div
                onClick={() => {
                  if (activeTask?.seller_id) {
                    setChatTarget({
                      id: String(activeTask.seller_id),
                      name: activeTask.pickup_address?.recipient_name || "Merchant Store",
                      role: "seller",
                      orderId: String(activeTask.order_id || ""),
                    });
                    setChatOpen(true);
                  }
                }}
                className={`p-5 rounded-2xl border transition-all ${
                  activeTask
                    ? "bg-white border-[#D1E7D8] hover:border-[#00A86B] shadow-xs cursor-pointer"
                    : "bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#E8F8EE] text-[#00A86B] flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-[#0A504A]">Chat Merchant Store</h4>
                    <p className="text-[11px] text-[#0A504A]/60">
                      {activeTask ? activeTask.pickup_address?.recipient_name : "No active pickup"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Support Quick Chat */}
              <div
                onClick={() => {
                  setChatTarget({
                    id: "admin-dispatch",
                    name: "Nexora Dispatch Support",
                    role: "admin",
                  });
                  setChatOpen(true);
                }}
                className="p-5 rounded-2xl bg-white border border-[#D1E7D8] hover:border-[#00A86B] shadow-xs transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-[#0A504A]">Dispatch Helpdesk</h4>
                    <p className="text-[11px] text-[#0A504A]/60">24/7 Logistics Assistance</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Conversation History Stream */}
            <div className="liquid-glass-card border border-[#D1E7D8] bg-white rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-[#D1E7D8] mb-4">
                <h3 className="text-sm font-black text-[#0A504A]">Recent Messages & Threads</h3>
                <span className="text-xs font-bold text-[#00A86B]">Real-Time Sync Active</span>
              </div>

              {conversations.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#0A504A]/60">
                  <MessageSquare className="w-10 h-10 text-[#0A504A]/20 mx-auto mb-2" />
                  <p className="font-bold text-[#0A504A]">No chat messages yet</p>
                  <p className="text-[11px] text-[#0A504A]/60 mt-0.5">
                    Click any contact above to initiate a conversation with your customer or vendor.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#D1E7D8]">
                  {conversations.map((c) => {
                    const otherParticipant = c.participants?.find((p) => p.user_id !== profile?.user_id) || c.participants?.[0];
                    return (
                      <div
                        key={c._id}
                        onClick={() => {
                          if (otherParticipant) {
                            setChatTarget({
                              id: otherParticipant.user_id,
                              name: otherParticipant.name || "User",
                              role: otherParticipant.role as any,
                              orderId: c.order_id || undefined,
                              subOrderId: c.sub_order_id || undefined,
                            });
                            setChatOpen(true);
                          }
                        }}
                        className="py-4 flex items-center justify-between hover:bg-[#F7F7F2] px-3 rounded-xl transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#E8F8EE] text-[#00A86B] flex items-center justify-center font-bold text-xs">
                            {otherParticipant?.name?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-[#0A504A]">
                                {otherParticipant?.name || "Participant"}
                              </span>
                              <span className="text-[10px] font-bold uppercase bg-[#E8F8EE] text-[#00A86B] px-2 py-0.2 rounded-full">
                                {otherParticipant?.role?.replace("_", " ")}
                              </span>
                            </div>
                            <p className="text-xs text-[#0A504A]/70 truncate max-w-sm mt-0.5">
                              {c.last_message || "Conversation started"}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-[#0A504A]/60">
                            {c.last_message_at
                              ? new Date(c.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                              : ""}
                          </span>
                          <ChevronRight className="w-4 h-4 text-[#0A504A]/40 mt-1 ml-auto" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: EARNINGS & PAYOUT WALLET                          */}
        {/* ========================================================= */}
        {activeTab === "wallet" && (
          <div className="space-y-6 animate-fade-in">
            {/* Wallet Big Banner */}
            <div className="liquid-glass-card p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#0A504A] via-[#00A86B] to-[#0A504A] text-white shadow-xl shadow-[#00A86B]/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-[#A2E4B8] text-xs font-bold uppercase tracking-wider mb-2">
                  Rider Compensation Balance
                </span>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                  ${((profile?.pending_earnings || 0) / 100).toFixed(2)}
                </h2>
                <p className="text-xs text-[#A2E4B8] mt-1">
                  Ready for instant cashout via bKash, Nagad, Rocket or Direct Bank Transfer.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setCashoutModalOpen(true)}
                  disabled={(profile?.pending_earnings || 0) <= 0}
                  className="px-6 py-3.5 rounded-2xl bg-white text-[#0A504A] font-black text-xs hover:bg-[#E8F8EE] transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Wallet className="w-4 h-4 text-[#00A86B]" />
                  <span>Request Cashout</span>
                </button>
              </div>
            </div>

            {/* Payout History & Transaction Logs */}
            <div className="liquid-glass-card border border-[#D1E7D8] bg-white rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-[#D1E7D8] mb-4">
                <div>
                  <h3 className="text-sm font-black text-[#0A504A]">Cashout & Payout History</h3>
                  <p className="text-xs text-[#0A504A]/60 mt-0.5">Records of all rider disbursement transfers.</p>
                </div>
                <button
                  onClick={() => setCashoutModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#E8F8EE] text-[#00A86B] text-xs font-bold hover:bg-[#D1E7D8] transition-colors cursor-pointer"
                >
                  + New Cashout
                </button>
              </div>

              {payouts.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#0A504A]/60">
                  <CreditCard className="w-10 h-10 text-[#0A504A]/20 mx-auto mb-2" />
                  <p className="font-bold text-[#0A504A]">No cashout transactions yet</p>
                  <p className="text-[11px] text-[#0A504A]/60 mt-0.5">
                    Whenever you request a withdrawal of your earnings, the log will appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#D1E7D8]">
                  {payouts.map((p) => (
                    <div key={p._id} className="py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#E8F8EE] text-[#00A86B] flex items-center justify-center font-bold text-xs">
                          <DollarSign className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase text-[#0A504A]">
                              {p.method} Transfer
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                p.status === "paid"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {p.status}
                            </span>
                          </div>
                          <p className="text-xs text-[#0A504A]/70 font-mono mt-0.5">
                            Account: {p.account_details}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-black text-[#0A504A]">
                          ${(p.amount / 100).toFixed(2)}
                        </span>
                        <div className="text-[10px] text-[#0A504A]/60">
                          {p.created_at ? new Date(p.created_at).toLocaleDateString() : "Recent"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: PROFILE & COVERAGE ZONES                          */}
        {/* ========================================================= */}
        {activeTab === "profile" && (
          <div className="space-y-6 animate-fade-in">
            {/* SERVICEABLE DELIVERY LOCATIONS & ZONES CARD */}
            <div className="liquid-glass-card p-6 sm:p-8 border border-emerald-200/80 bg-gradient-to-r from-emerald-50/50 via-white to-emerald-50/30 rounded-3xl shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#00A86B] text-white flex items-center justify-center shadow-md shadow-[#00A86B]/20 shrink-0">
                    <MapPin className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-black text-[#0A504A]">
                        My Delivery Coverage & Service Locations
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                        {profile?.service_city || "Dhaka"} Area
                      </span>
                    </div>
                    <p className="text-xs text-[#0A504A]/70">
                      Customers and merchants will match you for delivery tasks within these serviceable zones.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={openEditZonesModal}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#00A86B] text-white hover:bg-[#0A504A] transition-all shadow-xs cursor-pointer shrink-0"
                >
                  Edit Delivery Locations
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-[#D1E7D8]/60">
                {(profile?.delivery_zones && profile.delivery_zones.length > 0
                  ? profile.delivery_zones
                  : ["Dhaka North", "Gulshan", "Banani", "Uttara", "Dhanmondi"]
                ).map((zone, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-[#0A504A] border border-[#D1E7D8] shadow-2xs flex items-center gap-1.5"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#00A86B]"></span>
                    <span>{zone}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Vehicle & Identity Specs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="liquid-glass-card p-6 border border-[#D1E7D8] bg-white rounded-2xl shadow-xs">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#E8F8EE] text-[#00A86B] flex items-center justify-center">
                    <Bike className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-[#0A504A]">Vehicle Specifications</h4>
                    <p className="text-[11px] text-[#0A504A]/60">Active transit equipment registered</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-2 border-b border-[#D1E7D8]">
                    <span className="text-[#0A504A]/60">Vehicle Type</span>
                    <span className="font-bold capitalize text-[#0A504A]">{profile?.vehicle_type || "Motorcycle"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#D1E7D8]">
                    <span className="text-[#0A504A]/60">Registration Plate</span>
                    <span className="font-mono font-bold text-[#0A504A]">{profile?.vehicle_number || "NX-RIDER-01"}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-[#0A504A]/60">Driving License</span>
                    <span className="font-mono font-bold text-[#0A504A]">{profile?.license_number || "DL-VERIFIED"}</span>
                  </div>
                </div>
              </div>

              <div className="liquid-glass-card p-6 border border-[#D1E7D8] bg-white rounded-2xl shadow-xs">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-[#0A504A]">Performance Scorecard</h4>
                    <p className="text-[11px] text-[#0A504A]/60">Quality metric evaluated by customers</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-2 border-b border-[#D1E7D8]">
                    <span className="text-[#0A504A]/60">Overall Rating</span>
                    <span className="font-bold text-amber-600 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      {(profile?.rating || 5.0).toFixed(1)} / 5.0
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#D1E7D8]">
                    <span className="text-[#0A504A]/60">On-Time Delivery Rate</span>
                    <span className="font-bold text-emerald-700">99.2%</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-[#0A504A]/60">Fulfillment Status</span>
                    <span className="font-bold text-[#00A86B] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> High Reliability
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL: ORDER DETAILS & DELIVERY RECEIPT                   */}
        {/* ========================================================= */}
        {selectedTask && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-4 shadow-2xl border border-[#D1E7D8] animate-fade-in max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#D1E7D8]">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-[#00A86B]" />
                  <h3 className="font-black text-sm text-[#0A504A]">
                    Delivery Summary: {selectedTask.task_number}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Task Details Summary */}
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#E8F8EE] border border-[#A2E4B8] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#0A504A]/70 uppercase">Rider Payout</span>
                    <div className="text-lg font-black text-[#00A86B]">
                      ${(selectedTask.rider_earnings / 100).toFixed(2)}
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-[#00A86B] text-white">
                    {selectedTask.status.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="text-[11px] font-bold text-[#0A504A]/70 uppercase tracking-wider">
                    Store Pickup Details
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="font-bold text-[#0A504A]">{selectedTask.pickup_address?.recipient_name}</div>
                    <div className="text-slate-500">{selectedTask.pickup_address?.line1}, {selectedTask.pickup_address?.city}</div>
                    <div className="font-mono text-slate-600 mt-1">Phone: {selectedTask.pickup_address?.phone}</div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="text-[11px] font-bold text-[#0A504A]/70 uppercase tracking-wider">
                    Customer Destination Details
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="font-bold text-[#0A504A]">{selectedTask.delivery_address?.recipient_name}</div>
                    <div className="text-slate-500">{selectedTask.delivery_address?.line1}, {selectedTask.delivery_address?.city}</div>
                    <div className="font-mono text-slate-600 mt-1">Phone: {selectedTask.delivery_address?.phone}</div>
                  </div>
                </div>

                {/* Order Packages Preview (if available) */}
                {taskOrderDetails && (
                  <div className="space-y-2 pt-2">
                    <div className="text-[11px] font-bold text-[#0A504A]/70 uppercase tracking-wider">
                      Order Items #{taskOrderDetails.order_number}
                    </div>
                    <div className="p-3 rounded-xl bg-[#F7F7F2] border border-[#D1E7D8] divide-y divide-[#D1E7D8]">
                      {taskOrderDetails.sub_orders?.flatMap((s) => s.items || []).map((it, idx) => (
                        <div key={idx} className="py-2 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-[#0A504A]">{it.product_name || (it as any).name}</span>
                            <span className="text-[#0A504A]/60 ml-2">x{it.quantity}</span>
                          </div>
                          <span className="font-mono font-bold text-[#0A504A]">
                            ${(((it.unit_price || (it as any).price || 0) * it.quantity) / 100).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="w-full py-2.5 rounded-xl bg-[#00A86B] text-white font-bold text-xs hover:bg-[#0A504A] transition-colors cursor-pointer"
                >
                  Close Summary
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL: CASHOUT / PAYOUT REQUEST                           */}
        {/* ========================================================= */}
        {cashoutModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-4 shadow-2xl border border-[#D1E7D8] animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-[#D1E7D8]">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-[#00A86B]" />
                  <h3 className="font-black text-sm text-[#0A504A]">Request Payout / Cashout</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setCashoutModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {cashoutSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{cashoutSuccess}</span>
                </div>
              )}

              {cashoutError && (
                <div className="p-3.5 rounded-xl bg-rose-50 text-rose-800 text-xs font-bold flex items-center gap-2 border border-rose-200">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{cashoutError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitCashout} className="space-y-4 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-[#0A504A]">Amount ($ USD)</label>
                    <span className="text-[10px] text-[#0A504A]/70">
                      Available: ${((profile?.pending_earnings || 0) / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      step="0.01"
                      min="1.00"
                      value={cashoutAmount}
                      onChange={(e) => setCashoutAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-9 pr-16 py-2.5 rounded-xl bg-slate-50 border border-[#D1E7D8] text-xs font-bold text-[#0A504A] focus:bg-white focus:outline-none focus:border-[#00A86B]"
                    />
                    <button
                      type="button"
                      onClick={() => setCashoutAmount(((profile?.pending_earnings || 0) / 100).toFixed(2))}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-1 text-[10px] font-bold bg-[#E8F8EE] text-[#00A86B] rounded-lg cursor-pointer"
                    >
                      MAX
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#0A504A] mb-1.5">Payment Method</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: "bkash", name: "bKash" },
                      { id: "nagad", name: "Nagad" },
                      { id: "rocket", name: "Rocket" },
                      { id: "bank", name: "Bank" },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setCashoutMethod(m.id as any)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          cashoutMethod === m.id
                            ? "bg-[#00A86B] text-white border-[#00A86B] shadow-2xs"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#0A504A] mb-1">
                    {cashoutMethod === "bank" ? "Bank Account & Routing Info" : `${cashoutMethod.toUpperCase()} Wallet Number`}
                  </label>
                  <input
                    type="text"
                    value={cashoutAccount}
                    onChange={(e) => setCashoutAccount(e.target.value)}
                    placeholder={cashoutMethod === "bank" ? "Account No, Bank Name, Branch" : "e.g. 017XXXXXXXX"}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-[#D1E7D8] text-xs font-mono text-[#0A504A] focus:bg-white focus:outline-none focus:border-[#00A86B]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={cashoutLoading || (profile?.pending_earnings || 0) <= 0}
                    className="w-full py-3 rounded-xl bg-[#00A86B] hover:bg-[#0A504A] text-white font-black text-xs transition-all shadow-md shadow-[#00A86B]/25 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {cashoutLoading ? "Submitting Request..." : "Confirm & Withdraw Funds"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL: EDIT DELIVERY COVERAGE ZONES                       */}
        {/* ========================================================= */}
        {editModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#D1E7D8] animate-fade-in max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#D1E7D8]">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#00A86B]" />
                  <h3 className="font-black text-sm text-[#0A504A]">Update Delivery Locations & Zones</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {saveSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-[#0A504A] mb-1">Primary City</label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    placeholder="e.g. Dhaka, Rangpur, Chittagong"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-[#D1E7D8] text-xs text-[#0A504A] focus:bg-white focus:outline-none focus:border-[#00A86B]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#0A504A] mb-1">
                    Serviceable Zones (Tap to select / unselect)
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {[
                      "Dhaka North",
                      "Dhaka South",
                      "Gulshan",
                      "Banani",
                      "Uttara",
                      "Dhanmondi",
                      "Mirpur",
                      "Mohakhali",
                      "Badda",
                      "Rangpur",
                      "Chittagong",
                      "Sylhet",
                    ].map((z) => {
                      const isSelected = editZones.includes(z);
                      return (
                        <button
                          key={z}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setEditZones(editZones.filter((zone) => zone !== z));
                            } else {
                              setEditZones([...editZones, z]);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#00A86B] text-white shadow-2xs"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {isSelected ? "✓ " : "+ "}
                          {z}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={zoneInput}
                      onChange={(e) => setZoneInput(e.target.value)}
                      placeholder="Add custom zone or neighborhood..."
                      className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 border border-[#D1E7D8] text-xs text-[#0A504A] focus:bg-white focus:outline-none focus:border-[#00A86B]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (zoneInput.trim() && !editZones.includes(zoneInput.trim())) {
                          setEditZones([...editZones, zoneInput.trim()]);
                          setZoneInput("");
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#00A86B] text-white font-bold text-xs hover:bg-[#0A504A] cursor-pointer"
                    >
                      Add Zone
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#0A504A] mb-1">Vehicle Plate Number</label>
                    <input
                      type="text"
                      value={editPlate}
                      onChange={(e) => setEditPlate(e.target.value)}
                      placeholder="e.g. DHAKA-METRO-HA-2728"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-[#D1E7D8] text-xs font-mono text-[#0A504A] focus:bg-white focus:outline-none focus:border-[#00A86B]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#0A504A] mb-1">Contact Phone</label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="e.g. +11079217413"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-[#D1E7D8] text-xs font-mono text-[#0A504A] focus:bg-white focus:outline-none focus:border-[#00A86B]"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-5 py-2 rounded-xl bg-[#00A86B] hover:bg-[#0A504A] text-white font-bold text-xs transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isSavingProfile ? "Saving..." : "Save Locations"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* IN-APP LIVE CHAT DRAWER */}
        {chatTarget && (
          <ChatDrawer
            isOpen={chatOpen}
            onClose={() => {
              setChatOpen(false);
              setChatTarget(null);
            }}
            recipientId={chatTarget.id}
            recipientName={chatTarget.name}
            recipientRole={chatTarget.role}
            orderId={chatTarget.orderId}
            subOrderId={chatTarget.subOrderId}
          />
        )}
      </main>
    </div>
  );
}
