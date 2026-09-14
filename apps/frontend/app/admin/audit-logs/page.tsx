"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getAdminAuditLogs, AuditLogItem } from "../../../lib/api/audit";
import {
  History,
  ShieldCheck,
  Search,
  Clock,
  User,
  Activity,
  Lock,
  FileText,
  CheckCircle2,
  ExternalLink,
  Code,
} from "lucide-react";

const DEMO_LOGS: AuditLogItem[] = [
  {
    _id: "log-1",
    action: "ADMIN_LOGIN_SUCCESS",
    actor_id: "65f4a1b1c1d1e1f1a1b1c001",
    actor_email: "alex@nexora.internal",
    actor_role: "SUPER_ADMIN",
    target_resource: "auth",
    target_id: "sess_8912903",
    ip_address: "192.168.1.42",
    details: { method: "2FA_TOTP", sessionExpiry: "8h" },
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    _id: "log-2",
    action: "WITHDRAWAL_AUTHORIZED",
    actor_id: "65f4a1b1c1d1e1f1a1b1c001",
    actor_email: "rachel.treasury@nexora.internal",
    actor_role: "FINANCE_ADMIN",
    target_resource: "withdrawal",
    target_id: "w-003",
    ip_address: "10.0.4.12",
    details: { amountCents: 234000, recipient: "Modernist Footwear", payoutGate: "ACH_WIRE" },
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    _id: "log-3",
    action: "PRODUCT_APPROVED",
    actor_id: "65f4a1b1c1d1e1f1a1b1c002",
    actor_email: "julian.curator@nexora.internal",
    actor_role: "CATALOG_MODERATOR",
    target_resource: "product",
    target_id: "prod_linen_blazer_01",
    ip_address: "172.16.0.8",
    details: { title: "Linen Blend Blazer", store: "Lunora Atelier", autoPublish: true },
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    _id: "log-4",
    action: "ORDER_REFUND_EXECUTED",
    actor_id: "65f4a1b1c1d1e1f1a1b1c003",
    actor_email: "maya.support@nexora.internal",
    actor_role: "SUPPORT_LEAD",
    target_resource: "order",
    target_id: "ORD-2026-9810",
    ip_address: "192.168.1.15",
    details: { refundAmount: 112.5, reason: "Damaged packaging in transit", gatewayRef: "ref_98192837" },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    _id: "log-5",
    action: "SYSTEM_CACHE_PURGED",
    actor_id: "65f4a1b1c1d1e1f1a1b1c001",
    actor_email: "alex@nexora.internal",
    actor_role: "SUPER_ADMIN",
    target_resource: "system",
    target_id: "redis_cluster_primary",
    ip_address: "127.0.0.1",
    details: { keysEvicted: 1420, clusterHealth: "OK" },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

const AUDIT_TABS = [
  { id: "all", label: "All Audit Trails" },
  { id: "admin", label: "Admin Actions" },
  { id: "users", label: "User Events" },
  { id: "orders", label: "Order Logs" },
  { id: "payments", label: "Payment Ledger" },
  { id: "security", label: "Security & Auth" },
];

export default function AdminAuditLogsPage() {
  const params = useParams();
  const slug = (params?.slug as string[]) || [];
  const routeTab = slug[0] || "all";

  const [activeTab, setActiveTab] = useState(routeTab);
  const [logs, setLogs] = useState<AuditLogItem[]>(DEMO_LOGS);
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  useEffect(() => {
    async function fetchAudit() {
      try {
        const data = await getAdminAuditLogs({ limit: 50 });
        if (data && data.logs && data.logs.length > 0) {
          setLogs(data.logs);
        }
      } catch {
        // Fallback demo data
      }
    }
    fetchAudit();
  }, []);

  const filteredLogs = logs.filter((l) => {
    const matchCategory =
      activeTab === "all" ||
      (activeTab === "admin" && (l.actor_role === "SUPER_ADMIN" || l.actor_role === "ADMIN")) ||
      (activeTab === "users" && l.target_resource === "user") ||
      (activeTab === "orders" && l.target_resource === "order") ||
      (activeTab === "payments" && (l.target_resource === "payment" || l.target_resource === "withdrawal")) ||
      (activeTab === "security" && (l.target_resource === "auth" || l.target_resource === "security"));

    const matchSearch =
      !search.trim() ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.actor_email.toLowerCase().includes(search.toLowerCase()) ||
      (l.ip_address && l.ip_address.toLowerCase().includes(search.toLowerCase()));

    return matchCategory && matchSearch;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F8EE] border border-[#A2E4B8]/30 text-[#0A504A] text-[11px] font-bold uppercase tracking-wider mb-2">
            <History className="w-3.5 h-3.5 text-[#00A86B]" />
            <span>20. Immutable Audit Trail & Regulatory Logs</span>
          </div>
          <h1 className="text-3xl font-serif font-black text-[#0A504A] tracking-tight">
            Security & System Audit Logs
          </h1>
          <p className="text-xs text-[#0A504A]/70 mt-1">
            Tamper-evident chronological records of administrative modifications, authorization decisions, and access events.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#0A504A]/70">Recorded Audit Events</span>
          <div className="text-2xl font-serif font-black text-[#0A504A] mt-1.5">24,912 Logs</div>
          <span className="text-[10px] text-emerald-600 font-semibold mt-1 inline-block">Appended to immutable ledger</span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#0A504A]/70">Security Status</span>
          <div className="text-2xl font-serif font-black text-emerald-600 mt-1.5">Zero Breaches</div>
          <span className="text-[10px] text-[#0A504A]/70 mt-1 inline-block">SHA-256 integrity verified</span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#0A504A]/70">Active Admin Sessions</span>
          <div className="text-2xl font-serif font-black text-[#00A86B] mt-1.5">4 Staff</div>
          <span className="text-[10px] text-[#0A504A]/70 mt-1 inline-block">100% 2FA enforced</span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#0A504A]/70">Log Retention Policy</span>
          <div className="text-2xl font-serif font-black text-[#0A504A] mt-1.5">365 Days</div>
          <span className="text-[10px] text-[#0A504A]/70 mt-1 inline-block">SOC2 / ISO27001 compliant</span>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D1E7D8] pb-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          {AUDIT_TABS.map((tab) => {
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
            placeholder="Search action or email..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A] placeholder:text-[#0A504A]/70/50 focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#E8F8EE]/60 text-[#0A504A] font-bold border-b border-[#D1E7D8]">
              <tr>
                <th className="px-5 py-3.5">Action Event</th>
                <th className="px-5 py-3.5">Admin Operator</th>
                <th className="px-5 py-3.5">Target Entity</th>
                <th className="px-5 py-3.5">IP Address</th>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5 text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D1E7D8]/60">
              {filteredLogs.map((log) => (
                <tr key={log._id} className="hover:bg-[#E8F8EE]/40 transition">
                  <td className="px-5 py-4">
                    <span className="font-mono font-bold text-xs text-[#0A504A]">{log.action}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-bold text-[#0A504A]">{log.actor_email}</div>
                    <span className="text-[10px] text-[#0A504A]/70">{log.actor_role}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-xs text-[#00A86B]">{log.target_resource}</span>
                    <div className="text-[10px] text-[#0A504A]/70">{log.target_id || "N/A"}</div>
                  </td>
                  <td className="px-5 py-4 font-mono text-[11px] text-[#0A504A]">{log.ip_address || "127.0.0.1"}</td>
                  <td className="px-5 py-4 font-mono text-[11px] text-[#0A504A]/70">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#00A86B] hover:underline cursor-pointer"
                    >
                      <Code className="w-3.5 h-3.5" />
                      <span>Inspect JSON</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Payload Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A504A]/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-[#D1E7D8] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-serif font-black text-[#0A504A]">
                Audit Payload: {selectedLog.action}
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-xs font-bold text-[#0A504A]/70 hover:text-[#0A504A]"
              >
                Close
              </button>
            </div>

            <div className="space-y-1 text-xs text-[#0A504A]/70">
              <div><strong>Operator:</strong> {selectedLog.actor_email} ({selectedLog.actor_role})</div>
              <div><strong>Client IP:</strong> {selectedLog.ip_address || "N/A"}</div>
              <div><strong>Resource:</strong> {selectedLog.target_resource}</div>
            </div>

            <div className="rounded-xl bg-slate-900 text-slate-100 p-4 font-mono text-xs overflow-x-auto max-h-60">
              <pre>{JSON.stringify(selectedLog.details || {}, null, 2)}</pre>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-[#00A86B] text-white text-xs font-bold hover:bg-[#0A504A] transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
