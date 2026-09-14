"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "../../../components/Navbar";
import { ProtectedRoute } from "../../../components/auth/ProtectedRoute";
import {
  adminListRiders,
  adminUpdateRiderStatus,
  DeliveryAgentProfile,
} from "../../../lib/api/delivery";
import {
  Bike,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Loader2,
  Search,
  Star,
  PackageCheck,
  Ban,
} from "lucide-react";

export default function AdminRidersPage() {
  return (
    <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
      <AdminRidersContent />
    </ProtectedRoute>
  );
}

function AdminRidersContent() {
  const [riders, setRiders] = useState<DeliveryAgentProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadRiders = async () => {
    setIsLoading(true);
    try {
      const filterParam = statusFilter === "all" ? undefined : statusFilter;
      const data = await adminListRiders(filterParam);
      setRiders(data.agents || []);
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed loading delivery agents" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRiders();
  }, [statusFilter]);

  const handleUpdateStatus = async (id: string, newStatus: "approved" | "rejected" | "suspended" | "pending_review", riderName: string) => {
    setActionLoadingId(id);
    setFeedback(null);
    try {
      await adminUpdateRiderStatus(id, newStatus);
      setRiders((prev) =>
        prev.map((r) => ((r._id === id || (r as any).id === id) ? { ...r, status: newStatus } : r))
      );
      setFeedback({
        type: "success",
        text: `Rider ${riderName || id} status successfully updated to "${newStatus.replace("_", " ").toUpperCase()}".`,
      });
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed updating rider status" });
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredRiders = riders.filter((r) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const id = r._id || (r as any).id || "";
    const vehicle = r.vehicle_number?.toLowerCase() || "";
    const type = r.vehicle_type?.toLowerCase() || "";
    return id.toLowerCase().includes(query) || vehicle.includes(query) || type.includes(query);
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col selection:bg-blue-600 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full">
        {/* Header Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-slate-200/80 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold mb-2 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Admin Fleet Moderation</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Delivery Rider Network
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Moderate hyperlocal delivery agents, review driver licenses and vehicles, toggle onboarding approvals, and monitor live fleet activity.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/sellers"
              className="px-4 py-2 rounded-xl bg-white/80 hover:bg-white border border-slate-200/80 text-xs font-bold text-slate-700 shadow-xs hover:shadow-md transition-all"
            >
              Merchants Queue
            </Link>
            <Link
              href="/admin/products"
              className="px-4 py-2 rounded-xl bg-white/80 hover:bg-white border border-slate-200/80 text-xs font-bold text-slate-700 shadow-xs hover:shadow-md transition-all"
            >
              Products Queue
            </Link>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl border text-xs mb-6 flex items-center justify-between shadow-sm backdrop-blur-md animate-fade-in ${
              feedback.type === "success"
                ? "bg-emerald-50/90 border-emerald-200/80 text-emerald-800"
                : "bg-rose-50/90 border-rose-200/80 text-rose-800"
            }`}
          >
            <div className="flex items-center gap-2.5 font-medium">
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs font-bold underline hover:opacity-80 ml-4 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Filters and Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1">
            {[
              { label: "All Riders", value: "all" },
              { label: "Pending Review", value: "pending_review" },
              { label: "Approved", value: "approved" },
              { label: "Suspended", value: "suspended" },
              { label: "Rejected", value: "rejected" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition-all cursor-pointer ${
                  statusFilter === tab.value
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25"
                    : "bg-white/80 border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID or plate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/90 border border-slate-200/80 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
            />
          </div>
        </div>

        {/* Riders Table in Liquid Glass */}
        {isLoading ? (
          <div className="liquid-glass-card rounded-2xl p-16 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Loading rider network records...
            </p>
          </div>
        ) : filteredRiders.length === 0 ? (
          <div className="liquid-glass-card rounded-2xl p-16 text-center">
            <Bike className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-black text-slate-900">
              No delivery agents found
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No riders matched the selected filter criteria. As riders register and submit their vehicle info, they will appear here.
            </p>
          </div>
        ) : (
          <div className="liquid-glass-card rounded-2xl overflow-hidden shadow-lg shadow-slate-200/50">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-4 px-5">Rider & Vehicle</th>
                    <th className="py-4 px-5">Fleet Status</th>
                    <th className="py-4 px-5">Deliveries & Rating</th>
                    <th className="py-4 px-5">Net Earnings</th>
                    <th className="py-4 px-5">KYC Approval</th>
                    <th className="py-4 px-5 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRiders.map((r) => {
                    const riderId = r._id || (r as any).id;
                    const isActionLoading = actionLoadingId === riderId;

                    return (
                      <tr key={riderId} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center font-black shadow-xs shrink-0">
                              <Bike className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <span>{r.user_name || "Delivery Courier"}</span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold capitalize">
                                  {r.vehicle_type} • {r.vehicle_number || "NX-RIDER"}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                <span>{r.phone || "No phone registered"}</span>
                                {r.email && (
                                  <>
                                    <span>•</span>
                                    <span>{r.email}</span>
                                  </>
                                )}
                              </div>
                              {r.delivery_zones && r.delivery_zones.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1 mt-1.5">
                                  <span className="text-[9px] font-bold text-slate-400">Coverage Zones:</span>
                                  {r.delivery_zones.map((zone, zIdx) => (
                                    <span
                                      key={zIdx}
                                      className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60"
                                    >
                                      {zone}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${
                                r.is_online
                                  ? "bg-emerald-500 animate-pulse"
                                  : "bg-slate-300"
                              }`}
                            />
                            <span className="text-xs font-bold text-slate-700">
                              {r.is_online ? "Online & Active" : "Offline"}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                            Zone: {r.current_location?.coordinates ? `${r.current_location.coordinates[1]?.toFixed(2)}°N, ${r.current_location.coordinates[0]?.toFixed(2)}°E` : "Stationary"}
                          </span>
                        </td>

                        <td className="py-4 px-5">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                            <PackageCheck className="w-3.5 h-3.5 text-blue-600" />
                            <span>{r.total_deliveries || 0} completed</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold mt-0.5">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{r.rating ? r.rating.toFixed(1) : "5.0"} rating</span>
                          </div>
                        </td>

                        <td className="py-4 px-5">
                          <div className="font-black text-slate-900 text-sm">
                            ${((r.total_earnings || 0) / 100).toFixed(2)}
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">
                            Disbursable payout
                          </span>
                        </td>

                        <td className="py-4 px-5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              r.status === "approved"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                                : r.status === "rejected"
                                ? "bg-rose-50 text-rose-700 border border-rose-200/80"
                                : r.status === "suspended"
                                ? "bg-red-50 text-red-700 border border-red-200/80"
                                : "bg-amber-50 text-amber-700 border border-amber-200/80"
                            }`}
                          >
                            {r.status === "approved" && (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            )}
                            {r.status === "pending_review" && (
                              <Clock className="w-3 h-3 text-amber-600" />
                            )}
                            {r.status === "suspended" && (
                              <Ban className="w-3 h-3 text-red-600" />
                            )}
                            {r.status === "rejected" && (
                              <XCircle className="w-3 h-3 text-rose-600" />
                            )}
                            <span>{r.status?.replace("_", " ")}</span>
                          </span>
                        </td>

                        <td className="py-4 px-5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {r.status !== "approved" && (
                              <button
                                onClick={() => handleUpdateStatus(riderId, "approved", r.vehicle_number)}
                                disabled={isActionLoading}
                                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-[11px] transition-colors cursor-pointer"
                              >
                                {isActionLoading ? "..." : "Approve"}
                              </button>
                            )}

                            {r.status === "approved" && (
                              <button
                                onClick={() => handleUpdateStatus(riderId, "suspended", r.vehicle_number)}
                                disabled={isActionLoading}
                                className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-bold text-[11px] transition-colors cursor-pointer"
                              >
                                {isActionLoading ? "..." : "Suspend"}
                              </button>
                            )}

                            {r.status !== "rejected" && r.status !== "suspended" && (
                              <button
                                onClick={() => handleUpdateStatus(riderId, "rejected", r.vehicle_number)}
                                disabled={isActionLoading}
                                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] transition-colors cursor-pointer"
                              >
                                {isActionLoading ? "..." : "Reject"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
