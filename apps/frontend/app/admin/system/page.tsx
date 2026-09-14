"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Cpu,
  Activity,
  Database,
  Layers,
  Server,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Code,
  Terminal,
} from "lucide-react";

interface ServiceHealth {
  name: string;
  type: string;
  status: "healthy" | "degraded" | "down";
  latency: string;
  uptime: string;
}

const SYSTEM_SERVICES: ServiceHealth[] = [
  { name: "PostgreSQL Database", type: "Core Relational DB (Prisma)", status: "healthy", latency: "2.4ms", uptime: "99.99%" },
  { name: "MongoDB Cluster", type: "Audit Trail & Unstructured Data", status: "healthy", latency: "4.1ms", uptime: "99.98%" },
  { name: "Redis Primary Node", type: "Distributed Cache & Session Store", status: "healthy", latency: "0.8ms", uptime: "100.0%" },
  { name: "BullMQ Job Workers", type: "Async Tasks & Email Dispatch", status: "healthy", latency: "12ms queue time", uptime: "99.95%" },
  { name: "Express Backend API", type: "Node.js REST Service (:5000)", status: "healthy", latency: "24ms avg", uptime: "99.98%" },
  { name: "Next.js App Server", type: "React SSR Frontend (:3000)", status: "healthy", latency: "42ms TTFB", uptime: "99.99%" },
];

const QUEUES = [
  { name: "order-notifications", waiting: 0, active: 2, completed: 8412, failed: 0 },
  { name: "image-optimization", waiting: 4, active: 3, completed: 12040, failed: 1 },
  { name: "payment-webhooks", waiting: 0, active: 0, completed: 3840, failed: 0 },
  { name: "hyperlocal-dispatch", waiting: 1, active: 1, completed: 920, failed: 0 },
];

const SYSTEM_TABS = [
  { id: "health", label: "Health & Uptime" },
  { id: "queues", label: "BullMQ Queues" },
  { id: "cache", label: "Redis Cache" },
  { id: "logs", label: "Server Logs" },
  { id: "api", label: "API Gateway" },
];

export default function AdminSystemPage() {
  const params = useParams();
  const slug = (params?.slug as string[]) || [];
  const routeTab = slug[0] || "health";

  const [activeTab, setActiveTab] = useState(routeTab);
  const [purging, setPurging] = useState(false);
  const [purgeSuccess, setPurgeSuccess] = useState(false);

  const handlePurgeCache = () => {
    setPurging(true);
    setTimeout(() => {
      setPurging(false);
      setPurgeSuccess(true);
      setTimeout(() => setPurgeSuccess(false), 3000);
    }, 1000);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F8EE] border border-[#A2E4B8]/30 text-[#0A504A] text-[11px] font-bold uppercase tracking-wider mb-2">
            <Cpu className="w-3.5 h-3.5 text-[#00A86B]" />
            <span>21. Core Infrastructure & Telemetry</span>
          </div>
          <h1 className="text-3xl font-serif font-black text-[#0A504A] tracking-tight">
            System Health & Daemons
          </h1>
          <p className="text-xs text-[#0A504A]/70 mt-1">
            Cluster service topology, background worker telemetry, and Redis cache evictions.
          </p>
        </div>

        <button
          onClick={handlePurgeCache}
          disabled={purging}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#D1E7D8] text-[#0A504A] text-xs font-bold shadow-xs hover:bg-[#E8F8EE] transition disabled:opacity-50"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
          <span>{purging ? "Purging Redis..." : "Purge Stale Cache"}</span>
        </button>
      </div>

      {purgeSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Redis cache successfully evicted across all cluster pods. 1,420 ephemeral keys flushed.</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#0A504A]/70">Overall Uptime</span>
          <div className="text-2xl font-serif font-black text-emerald-600 mt-1.5">99.98%</div>
          <span className="text-[10px] text-[#0A504A]/70 mt-1 inline-block">30-day trailing metric</span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#0A504A]/70">API Response Latency</span>
          <div className="text-2xl font-serif font-black text-[#00A86B] mt-1.5">28.4 ms</div>
          <span className="text-[10px] text-emerald-600 font-semibold mt-1 inline-block">p95 &lt; 85ms SLA</span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#0A504A]/70">Redis Cache Hit Ratio</span>
          <div className="text-2xl font-serif font-black text-[#0A504A] mt-1.5">94.8%</div>
          <span className="text-[10px] text-[#0A504A]/70 mt-1 inline-block">24.2 MB / 512 MB memory used</span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#0A504A]/70">Background Jobs</span>
          <div className="text-2xl font-serif font-black text-emerald-600 mt-1.5">25,192 Done</div>
          <span className="text-[10px] text-[#0A504A]/70 mt-1 inline-block">1 failed (Retryable)</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#D1E7D8] scrollbar-none">
        {SYSTEM_TABS.map((tab) => {
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

      {/* Tab 1: Health & Uptime */}
      {activeTab === "health" && (
        <div className="rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#E8F8EE]/60 text-[#0A504A] font-bold border-b border-[#D1E7D8]">
                <tr>
                  <th className="px-5 py-3.5">Service Daemon</th>
                  <th className="px-5 py-3.5">Role / Topology</th>
                  <th className="px-5 py-3.5">Telemetry Status</th>
                  <th className="px-5 py-3.5">Latency</th>
                  <th className="px-5 py-3.5">Uptime</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1E7D8]/60">
                {SYSTEM_SERVICES.map((s, idx) => (
                  <tr key={idx} className="hover:bg-[#E8F8EE]/40 transition">
                    <td className="px-5 py-4 font-bold text-[#0A504A]">{s.name}</td>
                    <td className="px-5 py-4 text-[#0A504A]/70">{s.type}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>OPERATIONAL</span>
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono font-semibold text-[#00A86B]">{s.latency}</td>
                    <td className="px-5 py-4 font-mono font-semibold text-[#0A504A]">{s.uptime}</td>
                    <td className="px-5 py-4 text-right">
                      <button className="text-xs font-semibold text-[#00A86B] hover:underline">
                        Ping Check
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: BullMQ Queues */}
      {activeTab === "queues" && (
        <div className="rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#0A504A]">BullMQ Redis Job Queues</h3>
              <p className="text-xs text-[#0A504A]/70">Distributed task execution workers monitoring Redis keyspace.</p>
            </div>
            <button className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition">
              Retry Failed Jobs
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {QUEUES.map((q) => (
              <div key={q.name} className="p-4 rounded-xl border border-[#D1E7D8] bg-[#E8F8EE]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#0A504A]">{q.name}</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Active Worker
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-white border border-[#D1E7D8]">
                    <span className="text-[10px] text-[#0A504A]/70 block">Waiting</span>
                    <strong className="text-[#0A504A]">{q.waiting}</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-[#D1E7D8]">
                    <span className="text-[10px] text-[#0A504A]/70 block">Active</span>
                    <strong className="text-[#00A86B]">{q.active}</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-[#D1E7D8]">
                    <span className="text-[10px] text-[#0A504A]/70 block">Done</span>
                    <strong className="text-emerald-600">{q.completed}</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-[#D1E7D8]">
                    <span className="text-[10px] text-[#0A504A]/70 block">Failed</span>
                    <strong className={q.failed > 0 ? "text-rose-600" : "text-slate-400"}>
                      {q.failed}
                    </strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Redis Cache */}
      {activeTab === "cache" && (
        <div className="rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-[#0A504A]">Redis Cache Topology</h3>
            <p className="text-xs text-[#0A504A]/70">
              In-memory data store caching catalog listings, user sessions, and permission matrices.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#E8F8EE]/30 border border-[#D1E7D8]">
              <span className="text-[11px] font-bold text-[#0A504A]/70 uppercase">RAM Allocation</span>
              <div className="text-xl font-bold text-[#0A504A] mt-1">24.8 MB / 512 MB</div>
              <span className="text-[10px] text-emerald-600 font-semibold mt-1 inline-block">4.8% Capacity Used</span>
            </div>
            <div className="p-4 rounded-xl bg-[#E8F8EE]/30 border border-[#D1E7D8]">
              <span className="text-[11px] font-bold text-[#0A504A]/70 uppercase">Active Cached Keys</span>
              <div className="text-xl font-bold text-[#00A86B] mt-1">1,842 Keys</div>
              <span className="text-[10px] text-[#0A504A]/70 mt-1 inline-block">TTL Default: 3,600s</span>
            </div>
            <div className="p-4 rounded-xl bg-[#E8F8EE]/30 border border-[#D1E7D8]">
              <span className="text-[11px] font-bold text-[#0A504A]/70 uppercase">Key Eviction Policy</span>
              <div className="text-xl font-bold text-[#0A504A] mt-1">allkeys-lru</div>
              <span className="text-[10px] text-emerald-600 font-semibold mt-1 inline-block">Least recently used</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Server Logs */}
      {activeTab === "logs" && (
        <div className="rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#00A86B]" />
              <h3 className="text-base font-bold text-[#0A504A]">StdOut Stream Tail (Last 100 Lines)</h3>
            </div>
            <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Live streaming</span>
            </span>
          </div>

          <div className="rounded-xl bg-slate-950 text-slate-200 p-4 font-mono text-xs overflow-x-auto max-h-80 space-y-1">
            <div className="text-slate-500">[2026-09-12 22:15:01] INFO (Express): GET /api/admin/audit-logs HTTP/1.1 200 42ms</div>
            <div className="text-emerald-400">[2026-09-12 22:15:10] INFO (BullMQ): Job #8412 [order-notifications] completed in 18ms</div>
            <div className="text-slate-500">[2026-09-12 22:15:24] INFO (Prisma): Connected to PostgreSQL (pool size: 10, idle: 8)</div>
            <div className="text-slate-500">[2026-09-12 22:15:48] INFO (Redis): Client connection from 127.0.0.1:58190 established</div>
            <div className="text-purple-400">[2026-09-12 22:16:02] INFO (SocketIO): Rider Tariq Hassan GPS heartbeat updated (lat: 40.7589, lng: -73.9851)</div>
          </div>
        </div>
      )}

      {/* Tab 5: API Gateway */}
      {activeTab === "api" && (
        <div className="rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs p-6 space-y-4">
          <h3 className="text-base font-bold text-[#0A504A]">API Gateway Routing & Rate Limits</h3>
          <p className="text-xs text-[#0A504A]/70">
            Nginx ingress reverse proxy load balancing between Express API service clusters.
          </p>

          <div className="divide-y divide-[#D1E7D8]/60 pt-2">
            {[
              { route: "/api/products/*", method: "GET", limit: "300 req / min", status: "Active" },
              { route: "/api/orders/checkout", method: "POST", limit: "30 req / min", status: "Active" },
              { route: "/api/auth/*", method: "POST", limit: "15 req / min", status: "Active" },
              { route: "/api/admin/*", method: "ALL", limit: "600 req / min", status: "Protected" },
            ].map((r, i) => (
              <div key={i} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-[#00A86B] w-12">{r.method}</span>
                  <span className="font-mono text-[#0A504A] font-semibold">{r.route}</span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-[#0A504A]/70">{r.limit}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E8F8EE] text-[#0A504A]">{r.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
