"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Search,
  UserCheck,
  Navigation,
  DollarSign,
  Phone,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { getAdminOrders, Order } from "@/lib/api/orders";

interface Agent {
  id: string;
  name: string;
  phone: string;
  vehicle: "Motorcycle" | "Bicycle" | "Van";
  status: "active" | "pending" | "suspended";
  currentLocation: string;
  completedTasks: number;
  rating: number;
}

interface DeliveryTask {
  id: string;
  trackingCode: string;
  orderNumber: string;
  agent: string;
  pickupStore: string;
  destination: string;
  status: "pending" | "active" | "completed";
  eta: string;
}

const DEMO_AGENTS: Agent[] = [
  {
    id: "agt-101",
    name: "Tariq Hassan",
    phone: "+1 (555) 392-1823",
    vehicle: "Motorcycle",
    status: "active",
    currentLocation: "Midtown North (Zone B)",
    completedTasks: 342,
    rating: 4.9,
  },
  {
    id: "agt-102",
    name: "Carlos Mendez",
    phone: "+1 (555) 481-9231",
    vehicle: "Van",
    status: "active",
    currentLocation: "Financial District (Zone A)",
    completedTasks: 512,
    rating: 4.8,
  },
  {
    id: "agt-103",
    name: "Amina Yusuf",
    phone: "+1 (555) 728-1192",
    vehicle: "Bicycle",
    status: "pending",
    currentLocation: "Onboarding Review",
    completedTasks: 0,
    rating: 5.0,
  },
  {
    id: "agt-104",
    name: "Leon Schmidt",
    phone: "+1 (555) 612-8834",
    vehicle: "Motorcycle",
    status: "suspended",
    currentLocation: "Stationary (Flagged SLA)",
    completedTasks: 189,
    rating: 3.7,
  },
];

const DELIVERY_TABS = [
  { id: "agents", label: "Fleet Agents" },
  { id: "tasks", label: "Delivery Tasks" },
  { id: "live", label: "Live Telemetry" },
  { id: "earnings", label: "Agent Earnings" },
];

export default function AdminDeliveryPage() {
  const params = useParams();
  const slug = (params?.slug as string[]) || [];
  const primaryTab = slug[0] || "agents";
  const subFilter = slug[1] || "all";

  const [activeTab, setActiveTab] = useState(primaryTab);
  const [agentFilter, setAgentFilter] = useState(subFilter);
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoadingOrders(true);
      try {
        const res = await getAdminOrders({ limit: 50 });
        setOrders(res.orders || []);
      } catch (err) {
        console.error("Failed fetching orders for delivery tasks", err);
      } finally {
        setIsLoadingOrders(false);
      }
    };
    fetchOrders();
  }, []);

  const tasks: DeliveryTask[] = orders.map((o) => ({
    id: o.id,
    trackingCode: `TRK-${o.order_number.slice(-8)}`,
    orderNumber: `#${o.order_number}`,
    agent: o.delivery_address?.recipient_name || "Unassigned",
    pickupStore: `${o.sub_orders?.length || 1} Merchant Package(s)`,
    destination: `${o.delivery_address?.line1 || "Address on file"}, ${o.delivery_address?.city || ""}`,
    status:
      o.status === "completed"
        ? "completed"
        : o.status === "pending"
        ? "pending"
        : "active",
    eta:
      o.status === "completed"
        ? "Delivered (POD Signed)"
        : o.status === "pending"
        ? "Awaiting Dispatch"
        : "In Transit / Hyperlocal",
  }));

  const filteredAgents = DEMO_AGENTS.filter((a) => {
    const matchStatus = agentFilter === "all" || a.status === agentFilter;
    const matchSearch =
      !search.trim() ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.vehicle.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const filteredTasks = tasks.filter((t) => {
    const matchSearch =
      !search.trim() ||
      t.trackingCode.toLowerCase().includes(search.toLowerCase()) ||
      t.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      t.agent.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F8EE] border border-[#A2E4B8]/30 text-[#0A504A] text-[11px] font-bold uppercase tracking-wider mb-2">
            <Truck className="w-3.5 h-3.5 text-[#00A86B]" />
            <span>13. Hyperlocal Fleet & Delivery Orchestration</span>
          </div>
          <h1 className="text-3xl font-serif font-black text-[#0A504A] tracking-tight">
            Fleet & Dispatch Logistics
          </h1>
          <p className="text-xs text-[#0A504A]/70 mt-1">
            Real-time courier GPS tracking, automated dispatch routing, and proof-of-delivery verification.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#0A504A]/70">Active Couriers Online</span>
          <div className="text-2xl font-serif font-black text-emerald-600 mt-1.5">28 Riders</div>
          <span className="text-[10px] text-[#0A504A]/70 mt-1 inline-block">Across 6 metropolitan zones</span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#0A504A]/70">Active Tasks in Transit</span>
          <div className="text-2xl font-serif font-black text-[#00A86B] mt-1.5">14 Deliveries</div>
          <span className="text-[10px] text-[#0A504A]/70 mt-1 inline-block">Avg ETA: 22.4 minutes</span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#0A504A]/70">Proof of Delivery (POD)</span>
          <div className="text-2xl font-serif font-black text-[#0A504A] mt-1.5">99.8%</div>
          <span className="text-[10px] text-emerald-600 font-semibold mt-1 inline-block">OTP & Signature verified</span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#0A504A]/70">Avg Dispatch Delay</span>
          <div className="text-2xl font-serif font-black text-emerald-600 mt-1.5">3.2 mins</div>
          <span className="text-[10px] text-[#0A504A]/70 mt-1 inline-block">From vendor prep ready</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D1E7D8] pb-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          {DELIVERY_TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  active
                    ? "bg-[#00A86B] text-white shadow-2xs"
                    : "bg-white border border-[#D1E7D8] text-[#0A504A]/70 hover:bg-[#E8F8EE]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#0A504A]/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search couriers or orders..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A] placeholder:text-[#0A504A]/70/50 focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20"
          />
        </div>
      </div>

      {/* Tab 1: Fleet Agents */}
      {activeTab === "agents" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {["all", "active", "pending", "suspended"].map((st) => (
              <button
                key={st}
                onClick={() => setAgentFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition ${
                  agentFilter === st
                    ? "bg-[#0A504A] text-white"
                    : "bg-[#E8F8EE] text-[#0A504A]/70 hover:bg-[#E8F8EE]"
                }`}
              >
                {st} Couriers
              </button>
            ))}
          </div>

          <div className="rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#E8F8EE]/60 text-[#0A504A] font-bold border-b border-[#D1E7D8]">
                  <tr>
                    <th className="px-5 py-3.5">Agent Details</th>
                    <th className="px-5 py-3.5">Vehicle Type</th>
                    <th className="px-5 py-3.5">Current Zone / GPS</th>
                    <th className="px-5 py-3.5">Completed Runs</th>
                    <th className="px-5 py-3.5">Rating</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D1E7D8]/60">
                  {filteredAgents.map((agt) => (
                    <tr key={agt.id} className="hover:bg-[#E8F8EE]/40 transition">
                      <td className="px-5 py-4">
                        <div className="font-bold text-[#0A504A]">{agt.name}</div>
                        <div className="text-[11px] text-[#0A504A]/70">{agt.phone}</div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-[#0A504A]">{agt.vehicle}</td>
                      <td className="px-5 py-4 text-[#00A86B] font-medium flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-[#0A504A]/70" />
                        <span>{agt.currentLocation}</span>
                      </td>
                      <td className="px-5 py-4 font-bold text-[#0A504A]">{agt.completedTasks} deliveries</td>
                      <td className="px-5 py-4 font-bold text-amber-600">★ {agt.rating.toFixed(1)}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            agt.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : agt.status === "pending"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {agt.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button className="text-xs font-semibold text-[#00A86B] hover:underline">
                          Inspect Driver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Delivery Tasks */}
      {activeTab === "tasks" && (
        <div className="rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#E8F8EE]/60 text-[#0A504A] font-bold border-b border-[#D1E7D8]">
                <tr>
                  <th className="px-5 py-3.5">Tracking Code</th>
                  <th className="px-5 py-3.5">Order Ref</th>
                  <th className="px-5 py-3.5">Assigned Courier</th>
                  <th className="px-5 py-3.5">Merchant Origin</th>
                  <th className="px-5 py-3.5">Buyer Address</th>
                  <th className="px-5 py-3.5">Status & ETA</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1E7D8]/60">
                {isLoadingOrders ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-xs text-[#0A504A]/70">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-[#00A86B]" />
                        <span>Loading real orders from dispatch server...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-xs text-gray-500">
                      No delivery tasks found. Real orders will appear here automatically.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((tsk) => (
                    <tr key={tsk.id} className="hover:bg-[#E8F8EE]/40 transition">
                      <td className="px-5 py-4 font-mono font-bold text-[#00A86B]">{tsk.trackingCode}</td>
                      <td className="px-5 py-4 font-semibold text-[#0A504A]">{tsk.orderNumber}</td>
                      <td className="px-5 py-4 text-[#0A504A]">
                        {tsk.agent === "Unassigned" ? (
                          <span className="text-amber-600 font-bold">Awaiting Courier</span>
                        ) : (
                          <span className="font-semibold">{tsk.agent}</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-[#0A504A]">{tsk.pickupStore}</td>
                      <td className="px-5 py-4 text-[#0A504A]/70">{tsk.destination}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            tsk.status === "completed"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : tsk.status === "active"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>{tsk.eta}</span>
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/orders/${tsk.id}`}
                          className="text-xs font-semibold text-[#00A86B] hover:underline cursor-pointer"
                        >
                          Live Tracking
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Live Telemetry Map Simulation */}
      {activeTab === "live" && (
        <div className="rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#0A504A]">Hyperlocal Courier Telemetry Radar</h3>
              <p className="text-xs text-[#0A504A]/70">Simulated real-time GPS coordinates of active delivery agents.</p>
            </div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Live GPS Connected</span>
            </span>
          </div>

          <div className="h-72 rounded-xl bg-[#E8F8EE]/60 border border-[#D1E7D8] flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#00A86B_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="text-center relative z-10 p-4">
              <Navigation className="w-10 h-10 text-[#00A86B] mx-auto mb-2 animate-bounce" />
              <p className="text-xs font-bold text-[#0A504A]">Metropolitan Grid Active: 28 Riders Broadcast</p>
              <p className="text-[11px] text-[#0A504A]/70 mt-0.5">WebSocket feeds streaming latency &lt; 180ms</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Agent Earnings */}
      {activeTab === "earnings" && (
        <div className="rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs p-6">
          <h3 className="text-base font-bold text-[#0A504A] mb-2">Courier Payout & Compensation</h3>
          <p className="text-xs text-[#0A504A]/70 mb-6">
            Couriers receive $4.50 base payout per hyperlocal dropoff plus $1.20/km distance surcharge and 100% of customer tips.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#E8F8EE]/30 border border-[#D1E7D8]">
              <span className="text-[11px] font-bold text-[#0A504A]/70 uppercase">Tariq Hassan</span>
              <div className="text-xl font-bold text-[#0A504A] mt-1">$1,539.00</div>
              <span className="text-[10px] text-[#00A86B] font-semibold mt-1 inline-block">342 Deliveries this month</span>
            </div>
            <div className="p-4 rounded-xl bg-[#E8F8EE]/30 border border-[#D1E7D8]">
              <span className="text-[11px] font-bold text-[#0A504A]/70 uppercase">Carlos Mendez</span>
              <div className="text-xl font-bold text-[#0A504A] mt-1">$2,304.00</div>
              <span className="text-[10px] text-[#00A86B] font-semibold mt-1 inline-block">512 Deliveries this month</span>
            </div>
            <div className="p-4 rounded-xl bg-[#E8F8EE]/30 border border-[#D1E7D8]">
              <span className="text-[11px] font-bold text-[#0A504A]/70 uppercase">Fleet Fuel Subsidy</span>
              <div className="text-xl font-bold text-emerald-600 mt-1">$480.00</div>
              <span className="text-[10px] text-[#0A504A]/70 font-semibold mt-1 inline-block">Standardized monthly allowance</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
