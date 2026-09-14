"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Key,
  ShieldCheck,
  CheckCircle2,
  Save,
  Check,
  X,
} from "lucide-react";

interface PermissionRow {
  module: string;
  action: string;
  superAdmin: boolean;
  financeAdmin: boolean;
  catalogModerator: boolean;
  supportLead: boolean;
}

const INITIAL_PERMISSIONS: PermissionRow[] = [
  { module: "Users", action: "View user directory & KYC docs", superAdmin: true, financeAdmin: false, catalogModerator: true, supportLead: true },
  { module: "Users", action: "Suspend or ban user account", superAdmin: true, financeAdmin: false, catalogModerator: false, supportLead: false },
  { module: "Sellers", action: "Approve or reject vendor onboarding", superAdmin: true, financeAdmin: false, catalogModerator: true, supportLead: false },
  { module: "Catalog", action: "Moderate product listings & prices", superAdmin: true, financeAdmin: false, catalogModerator: true, supportLead: false },
  { module: "Orders", action: "Force cancel or refund order", superAdmin: true, financeAdmin: true, catalogModerator: false, supportLead: true },
  { module: "Treasury", action: "Authorize seller withdrawal payout", superAdmin: true, financeAdmin: true, catalogModerator: false, supportLead: false },
  { module: "Commissions", action: "Change platform take-rate percentages", superAdmin: true, financeAdmin: true, catalogModerator: false, supportLead: false },
  { module: "Fleet", action: "Dispatch or reassign courier tasks", superAdmin: true, financeAdmin: false, catalogModerator: false, supportLead: true },
  { module: "System", action: "View Redis cache, BullMQ queues & API keys", superAdmin: true, financeAdmin: false, catalogModerator: false, supportLead: false },
];

export default function AdminPermissionsPage() {
  const [permissions, setPermissions] = useState<PermissionRow[]>(INITIAL_PERMISSIONS);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const togglePermission = (index: number, role: "financeAdmin" | "catalogModerator" | "supportLead") => {
    setPermissions((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [role]: !row[role] } : row))
    );
  };

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F8EE] border border-[#A2E4B8]/30 text-[#0A504A] text-[11px] font-bold uppercase tracking-wider mb-2">
            <Key className="w-3.5 h-3.5 text-[#00A86B]" />
            <span>Granular Capability Matrix</span>
          </div>
          <h1 className="text-3xl font-serif font-black text-[#0A504A] tracking-tight">
            Permissions Matrix
          </h1>
          <p className="text-xs text-[#0A504A]/70 mt-1">
            Configure access controls and action boundaries across all administrative roles.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00A86B] text-white text-xs font-bold shadow-sm hover:bg-[#0A504A] transition"
        >
          <Save className="w-4 h-4" />
          <span>Save Permissions</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Permissions matrix updated. Access rules cached in Redis session store.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#D1E7D8] pb-4">
        <Link
          href="/admin/administrators"
          className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white border border-[#D1E7D8] text-[#0A504A]/70 hover:bg-[#E8F8EE] transition"
        >
          Administrators
        </Link>
        <Link
          href="/admin/roles"
          className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white border border-[#D1E7D8] text-[#0A504A]/70 hover:bg-[#E8F8EE] transition"
        >
          RBAC Roles
        </Link>
        <Link
          href="/admin/permissions"
          className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#00A86B] text-white shadow-2xs"
        >
          Permissions Matrix
        </Link>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#E8F8EE]/60 text-[#0A504A] font-bold border-b border-[#D1E7D8]">
              <tr>
                <th className="px-5 py-3.5">System Module</th>
                <th className="px-5 py-3.5">Action Capability</th>
                <th className="px-5 py-3.5 text-center">Super Admin</th>
                <th className="px-5 py-3.5 text-center">Finance Admin</th>
                <th className="px-5 py-3.5 text-center">Catalog Moderator</th>
                <th className="px-5 py-3.5 text-center">Support Lead</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D1E7D8]/60">
              {permissions.map((perm, idx) => (
                <tr key={idx} className="hover:bg-[#E8F8EE]/40 transition">
                  <td className="px-5 py-4 font-bold text-[#00A86B]">{perm.module}</td>
                  <td className="px-5 py-4 font-medium text-[#0A504A]">{perm.action}</td>
                  <td className="px-5 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-emerald-100 text-emerald-700">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <button
                      onClick={() => togglePermission(idx, "financeAdmin")}
                      className={`inline-flex items-center justify-center w-5 h-5 rounded-md transition cursor-pointer ${
                        perm.financeAdmin
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                      }`}
                    >
                      {perm.financeAdmin ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <button
                      onClick={() => togglePermission(idx, "catalogModerator")}
                      className={`inline-flex items-center justify-center w-5 h-5 rounded-md transition cursor-pointer ${
                        perm.catalogModerator
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                      }`}
                    >
                      {perm.catalogModerator ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <button
                      onClick={() => togglePermission(idx, "supportLead")}
                      className={`inline-flex items-center justify-center w-5 h-5 rounded-md transition cursor-pointer ${
                        perm.supportLead
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                      }`}
                    >
                      {perm.supportLead ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
