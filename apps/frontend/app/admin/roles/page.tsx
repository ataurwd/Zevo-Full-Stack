"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ShieldCheck,
  Plus,
  Users,
  Key,
  CheckCircle2,
  Lock,
  ArrowRight,
} from "lucide-react";

interface RoleDef {
  id: string;
  name: string;
  code: string;
  description: string;
  userCount: number;
  permissionsCount: number;
  isSystem: boolean;
}

const DEMO_ROLES: RoleDef[] = [
  {
    id: "r-1",
    name: "Super Administrator",
    code: "SUPER_ADMIN",
    description: "Complete unconstrained authority across entire marketplace infrastructure, billing, and system keys.",
    userCount: 2,
    permissionsCount: 48,
    isSystem: true,
  },
  {
    id: "r-2",
    name: "Treasury & Finance Admin",
    code: "FINANCE_ADMIN",
    description: "Access to Stripe ledger, commission rate adjustments, and vendor disbursement approvals.",
    userCount: 3,
    permissionsCount: 16,
    isSystem: false,
  },
  {
    id: "r-3",
    name: "Catalog Moderator",
    code: "CATALOG_MODERATOR",
    description: "Review and approve new vendor onboarding KYC, product listings, category taxonomy, and customer reviews.",
    userCount: 5,
    permissionsCount: 22,
    isSystem: false,
  },
  {
    id: "r-4",
    name: "Support Desk Lead",
    code: "SUPPORT_LEAD",
    description: "Handle disputes, live chat interactions, order refund escalations, and notification broadcasts.",
    userCount: 8,
    permissionsCount: 14,
    isSystem: false,
  },
];

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<RoleDef[]>(DEMO_ROLES);
  const [showModal, setShowModal] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [roleDesc, setRoleDesc] = useState("");

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) return;

    const newR: RoleDef = {
      id: `r-${Date.now()}`,
      name: roleName.trim(),
      code: roleName.trim().toUpperCase().replace(/\s+/g, "_"),
      description: roleDesc.trim() || "Custom marketplace role.",
      userCount: 0,
      permissionsCount: 8,
      isSystem: false,
    };

    setRoles([...roles, newR]);
    setRoleName("");
    setRoleDesc("");
    setShowModal(false);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F8EE] border border-[#A2E4B8]/30 text-[#0A504A] text-[11px] font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00A86B]" />
            <span>Role-Based Access Control</span>
          </div>
          <h1 className="text-3xl font-serif font-black text-[#0A504A] tracking-tight">
            RBAC Roles
          </h1>
          <p className="text-xs text-[#0A504A]/70 mt-1">
            Define role boundaries, security policies, and user assignment quotas.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00A86B] text-white text-xs font-bold shadow-sm hover:bg-[#0A504A] transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Custom Role</span>
        </button>
      </div>

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
          className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#00A86B] text-white shadow-2xs"
        >
          RBAC Roles
        </Link>
        <Link
          href="/admin/permissions"
          className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white border border-[#D1E7D8] text-[#0A504A]/70 hover:bg-[#E8F8EE] transition"
        >
          Permissions Matrix
        </Link>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((role) => (
          <div
            key={role.id}
            className="p-6 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs flex flex-col justify-between space-y-4 hover:border-[#A2E4B8]/50 transition"
          >
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#0A504A]">{role.name}</h3>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#E8F8EE] text-[#00A86B] font-bold">
                  {role.code}
                </span>
              </div>
              <p className="text-xs text-[#0A504A]/70 mt-2 leading-relaxed">{role.description}</p>
            </div>

            <div className="pt-4 border-t border-[#D1E7D8]/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-4 text-[#0A504A]">
                <span className="font-semibold">{role.userCount} Active Staff</span>
                <span className="text-[#0A504A]/70">·</span>
                <span className="font-semibold text-[#00A86B]">{role.permissionsCount} Privileges</span>
              </div>

              <Link
                href="/admin/permissions"
                className="inline-flex items-center gap-1 font-bold text-[#00A86B] hover:underline text-xs"
              >
                <span>Edit Privileges</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A504A]/40 backdrop-blur-xs">
          <form
            onSubmit={handleCreateRole}
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#D1E7D8] space-y-4"
          >
            <h3 className="text-base font-serif font-black text-[#0A504A]">Create Security Role</h3>
            <div>
              <label className="block text-xs font-bold text-[#0A504A] mb-1">Role Display Name</label>
              <input
                type="text"
                required
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="e.g. Regional Fleet Coordinator"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#E8F8EE]/40 border border-[#D1E7D8] text-xs text-[#0A504A] focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#0A504A] mb-1">Description & Purpose</label>
              <textarea
                rows={3}
                value={roleDesc}
                onChange={(e) => setRoleDesc(e.target.value)}
                placeholder="Scope of responsibilities..."
                className="w-full p-3 rounded-xl bg-[#E8F8EE]/40 border border-[#D1E7D8] text-xs text-[#0A504A] focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20 resize-none"
              />
            </div>
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#0A504A]/70 hover:bg-[#E8F8EE]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#00A86B] text-white text-xs font-bold hover:bg-[#0A504A] transition shadow-xs"
              >
                Save Role
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
