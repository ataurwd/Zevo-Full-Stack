"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ShieldAlert,
  ShieldCheck,
  Plus,
  Search,
  Key,
  CheckCircle2,
  Lock,
  UserCheck,
  Sliders,
} from "lucide-react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "FINANCE_ADMIN" | "CATALOG_MODERATOR" | "SUPPORT_LEAD";
  twoFactorEnabled: boolean;
  lastLogin: string;
  status: "active" | "suspended";
}

const DEMO_ADMINS: AdminUser[] = [
  {
    id: "adm-1",
    name: "Alex Vance",
    email: "alex@nexora.internal",
    role: "SUPER_ADMIN",
    twoFactorEnabled: true,
    lastLogin: "Active now",
    status: "active",
  },
  {
    id: "adm-2",
    name: "Rachel Sterling",
    email: "rachel.treasury@nexora.internal",
    role: "FINANCE_ADMIN",
    twoFactorEnabled: true,
    lastLogin: "2 hours ago",
    status: "active",
  },
  {
    id: "adm-3",
    name: "Julian Cross",
    email: "julian.curator@nexora.internal",
    role: "CATALOG_MODERATOR",
    twoFactorEnabled: false,
    lastLogin: "Yesterday",
    status: "active",
  },
  {
    id: "adm-4",
    name: "Maya Patel",
    email: "maya.support@nexora.internal",
    role: "SUPPORT_LEAD",
    twoFactorEnabled: true,
    lastLogin: "3 days ago",
    status: "active",
  },
];

const ADMIN_MGMT_TABS = [
  { id: "all", label: "Administrators", href: "/admin/administrators" },
  { id: "roles", label: "RBAC Roles", href: "/admin/roles" },
  { id: "permissions", label: "Permissions Matrix", href: "/admin/permissions" },
];

export default function AdminManagementPage() {
  const params = useParams();
  const slug = (params?.slug as string[]) || [];
  const isCreate = slug[0] === "create";

  const [admins, setAdmins] = useState<AdminUser[]>(DEMO_ADMINS);
  const [showCreateModal, setShowCreateModal] = useState(isCreate);
  const [search, setSearch] = useState("");

  // Create admin modal form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminUser["role"]>("CATALOG_MODERATOR");
  const [successMsg, setSuccessMsg] = useState(false);

  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const newAdmin: AdminUser = {
      id: `adm-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      role: role,
      twoFactorEnabled: true,
      lastLogin: "Never (Invitation sent)",
      status: "active",
    };

    setAdmins([newAdmin, ...admins]);
    setName("");
    setEmail("");
    setShowCreateModal(false);
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3500);
  };

  const filteredAdmins = admins.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      a.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F8EE] border border-[#A2E4B8]/30 text-[#0A504A] text-[11px] font-bold uppercase tracking-wider mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-[#00A86B]" />
            <span>19. Role-Based Access Control (RBAC) & Governance</span>
          </div>
          <h1 className="text-3xl font-serif font-black text-[#0A504A] tracking-tight">
            Admin Directory & Security Roles
          </h1>
          <p className="text-xs text-[#0A504A]/70 mt-1">
            Grant granular permissions, provision staff accounts, and mandate hardware two-factor authentication.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00A86B] text-white text-xs font-bold shadow-sm hover:bg-[#0A504A] transition"
        >
          <Plus className="w-4 h-4" />
          <span>Provision Admin</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Invitation email with secure 2FA setup link dispatched to the new administrator.</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#D1E7D8] pb-4">
        {ADMIN_MGMT_TABS.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              tab.id === "all"
                ? "bg-[#00A86B] text-white shadow-2xs"
                : "bg-white border border-[#D1E7D8] text-[#0A504A]/70 hover:bg-[#E8F8EE]"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Admins Table */}
      <div className="rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-[#D1E7D8] flex items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#0A504A]/70 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#E8F8EE]/40 border border-[#D1E7D8] text-xs text-[#0A504A] placeholder:text-[#0A504A]/70/50 focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20"
            />
          </div>
          <span className="text-xs font-bold text-[#0A504A]/70">{filteredAdmins.length} staff members</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#E8F8EE]/60 text-[#0A504A] font-bold border-b border-[#D1E7D8]">
              <tr>
                <th className="px-5 py-3.5">Administrator</th>
                <th className="px-5 py-3.5">Assigned RBAC Role</th>
                <th className="px-5 py-3.5">2FA Hardware Status</th>
                <th className="px-5 py-3.5">Last Login Activity</th>
                <th className="px-5 py-3.5">Account Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D1E7D8]/60">
              {filteredAdmins.map((admin) => (
                <tr key={admin.id} className="hover:bg-[#E8F8EE]/40 transition">
                  <td className="px-5 py-4">
                    <div className="font-bold text-[#0A504A]">{admin.name}</div>
                    <div className="text-[11px] text-[#0A504A]/70">{admin.email}</div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#E8F8EE] text-[#00A86B]">
                      {admin.role.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {admin.twoFactorEnabled ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Enforced (TOTP)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-amber-600 font-semibold text-[11px]">
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Not Configured</span>
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-[#0A504A]/70 font-mono text-[11px]">{admin.lastLogin}</td>
                  <td className="px-5 py-4">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                      {admin.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button className="text-xs font-semibold text-[#00A86B] hover:underline">
                      Manage Permissions
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A504A]/40 backdrop-blur-xs">
          <form
            onSubmit={handleCreateAdmin}
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#D1E7D8] space-y-4"
          >
            <h3 className="text-base font-serif font-black text-[#0A504A]">Provision Administrator Account</h3>
            <p className="text-xs text-[#0A504A]/70">
              New administrators will receive an invitation to set up their password and 2FA key.
            </p>

            <div>
              <label className="block text-xs font-bold text-[#0A504A] mb-1">Full Legal Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#E8F8EE]/40 border border-[#D1E7D8] text-xs text-[#0A504A] focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A504A] mb-1">Corporate Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sarah@nexora.internal"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#E8F8EE]/40 border border-[#D1E7D8] text-xs text-[#0A504A] focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A504A] mb-1">RBAC Role Assignment</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#E8F8EE]/40 border border-[#D1E7D8] text-xs font-semibold text-[#0A504A] focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20"
              >
                <option value="SUPER_ADMIN">SUPER_ADMIN (Full Platform Authority)</option>
                <option value="FINANCE_ADMIN">FINANCE_ADMIN (Settlements & Payouts Only)</option>
                <option value="CATALOG_MODERATOR">CATALOG_MODERATOR (Product & Store Approvals)</option>
                <option value="SUPPORT_LEAD">SUPPORT_LEAD (Customer Disputes & Live Chat)</option>
              </select>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#0A504A]/70 hover:bg-[#E8F8EE]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#00A86B] text-white text-xs font-bold hover:bg-[#0A504A] transition shadow-xs"
              >
                Dispatch Invitation
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
