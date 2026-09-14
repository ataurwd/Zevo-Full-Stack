"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Mail,
  Phone,
  Calendar,
  Bike,
  Store,
  ShoppingBag,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  MapPin,
  Check,
} from "lucide-react";
import {
  adminGetUsers,
  adminCreateUser,
  adminUpdateUser,
  AdminUserItem,
} from "@/lib/api/users";
import { getAccessToken } from "@/lib/api/client";

export default function AdminUsersModule() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string[]) || [];
  const isCreateRoute = slug[0] === "create";

  const [roleFilter, setRoleFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Inspector modal state
  const [inspectUser, setInspectUser] = useState<AdminUserItem | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [editRole, setEditRole] = useState<string>("");

  // Create User Modal state
  const [showCreateModal, setShowCreateModal] = useState(isCreateRoute);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    role: "CUSTOMER",
    serviceCity: "Dhaka",
    deliveryZones: "Dhaka, Gulshan, Banani, Uttara, Dhanmondi",
  });

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const loadUsers = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);
    setErrorMessage(null);

    try {
      const res = await adminGetUsers({
        role: roleFilter,
        search: debouncedSearch,
        limit: 100,
      });
      setUsers(res.users || []);
      setTotalCount(res.total || (res.users || []).length);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load users from database");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [roleFilter, debouncedSearch]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Handle Inspect user selection via slug
  useEffect(() => {
    if (slug[0] && slug[0] !== "create" && users.length > 0) {
      const found = users.find((u) => u.id === slug[0]);
      if (found) {
        setInspectUser(found);
        setEditRole(found.role);
      }
    }
  }, [slug, users]);

  const handleOpenInspect = (user: AdminUserItem) => {
    setInspectUser(user);
    setEditRole(user.role);
  };

  const handleToggleUserStatus = async () => {
    if (!inspectUser) return;
    setIsUpdatingStatus(true);
    try {
      const newStatus = !inspectUser.is_active;
      await adminUpdateUser(inspectUser.id, { is_active: newStatus });
      setSuccessMessage(`User account status updated to ${newStatus ? "ACTIVE" : "SUSPENDED"}`);
      setInspectUser((prev) => (prev ? { ...prev, is_active: newStatus, status: newStatus ? "ACTIVE" : "SUSPENDED" } : null));
      loadUsers(true);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update user status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSaveUserRole = async () => {
    if (!inspectUser || editRole === inspectUser.role) return;
    setIsUpdatingStatus(true);
    try {
      await adminUpdateUser(inspectUser.id, { role: editRole });
      setSuccessMessage(`User role successfully modified to ${editRole}`);
      setInspectUser((prev) => (prev ? { ...prev, role: editRole as any } : null));
      loadUsers(true);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update user role");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setErrorMessage(null);

    try {
      const zones = createForm.deliveryZones
        .split(",")
        .map((z) => z.trim())
        .filter(Boolean);

      await adminCreateUser({
        first_name: createForm.firstName,
        last_name: createForm.lastName,
        email: createForm.email,
        phone: createForm.phone || undefined,
        role: createForm.role,
        password: createForm.password || "Nexora@2026!",
        service_city: createForm.serviceCity || "Dhaka",
        delivery_zones: zones.length ? zones : undefined,
      });

      setSuccessMessage(`User "${createForm.firstName} ${createForm.lastName}" provisioned successfully!`);
      setShowCreateModal(false);
      setCreateForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        role: "CUSTOMER",
        serviceCity: "Dhaka",
        deliveryZones: "Dhaka, Gulshan, Banani, Uttara, Dhanmondi",
      });
      loadUsers(true);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create user");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F8EE] border border-[#A2E4B8]/30 text-[#0A504A] text-[11px] font-bold uppercase tracking-wider mb-2">
            <Users className="w-3.5 h-3.5 text-[#00A86B]" />
            <span>03. Identity & User Directory</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-serif font-black text-[#0A504A] tracking-tight">
              Users Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#E8F8EE] text-[#00A86B] text-xs font-bold font-mono">
              {totalCount} Total Accounts
            </span>
          </div>
          <p className="text-xs text-[#0A504A]/70 mt-1">
            Global account management, role allocation, suspension controls, and live user activity trail.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadUsers(false)}
            disabled={isRefreshing || isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#D1E7D8] bg-white hover:bg-[#E8F8EE] text-[#0A504A] text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#00A86B]" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A504A] hover:bg-[#00A86B] text-white text-xs font-bold transition-all shadow-md shadow-[#0A504A]/20 active:scale-95 self-start sm:self-auto cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create New User</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900 font-bold ml-2">✕</button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-700 hover:text-rose-900 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Role Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-white border border-[#D1E7D8] p-1 rounded-2xl w-full sm:w-auto overflow-x-auto">
          {["ALL", "CUSTOMER", "SELLER", "RIDER", "ADMIN"].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                roleFilter === r
                  ? "bg-[#00A86B] text-white shadow-2xs"
                  : "text-[#0A504A]/70 hover:text-[#0A504A] hover:bg-[#E8F8EE]"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#0A504A]/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, phone..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A] placeholder-[#0A504A]/40 focus:outline-none focus:border-[#00A86B]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#D1E7D8] shadow-2xs space-y-4">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00A86B]"></div>
            <p className="text-xs text-[#0A504A]/70 font-medium">Querying live users directory...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#E8F8EE] text-[#0A504A] flex items-center justify-center mx-auto">
              <Users className="w-6 h-6 text-[#00A86B]" />
            </div>
            <h3 className="font-bold text-sm text-[#0A504A]">No Accounts Found</h3>
            <p className="text-xs text-[#0A504A]/70 max-w-sm mx-auto">
              {searchQuery
                ? `No users match the search "${searchQuery}". Try a different keyword.`
                : `No ${roleFilter === "ALL" ? "" : roleFilter.toLowerCase()} accounts found in the database.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#D1E7D8] text-[#0A504A]/70 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 pl-2">User</th>
                  <th className="pb-3">Contact</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Activity</th>
                  <th className="pb-3">Joined Date</th>
                  <th className="pb-3 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1E7D8]/70">
                {users.map((u) => {
                  const initials = u.name
                    ? u.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()
                    : "UR";

                  return (
                    <tr key={u.id} className="hover:bg-[#E8F8EE]/40 transition-colors">
                      <td className="py-4 pl-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#E8F8EE] text-[#0A504A] font-bold flex items-center justify-center text-xs shrink-0">
                            {initials}
                          </div>
                          <div>
                            <span className="font-bold text-[#0A504A] block">{u.name}</span>
                            <span className="text-[11px] text-[#0A504A]/70">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-[#0A504A]/70 font-mono">
                        {u.phone || <span className="text-gray-400 italic">No phone</span>}
                      </td>
                      <td className="py-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            u.role === "ADMIN" || u.role === "SUPER_ADMIN"
                              ? "bg-[#0A504A] text-white"
                              : u.role === "SELLER"
                              ? "bg-[#00A86B] text-white"
                              : u.role === "RIDER"
                              ? "bg-[#008f5b] text-white"
                              : "bg-[#E8F8EE] text-[#0A504A]"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4">
                        <span
                          className={`inline-flex items-center gap-1 font-bold text-[11px] ${
                            u.is_active ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {u.is_active ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          <span>{u.status}</span>
                        </span>
                      </td>
                      <td className="py-4 text-[#0A504A]/70 font-mono">
                        {u.ordersCount > 0 ? (
                          <span>{u.ordersCount} actions</span>
                        ) : (
                          <span className="text-gray-400">0 orders</span>
                        )}
                      </td>
                      <td className="py-4 text-[#0A504A]/70 font-mono">{u.joined}</td>
                      <td className="py-4 pr-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenInspect(u)}
                          className="px-3 py-1.5 rounded-lg bg-[#E8F8EE] hover:bg-[#D1E7D8] text-[#00A86B] font-bold text-[11px] transition-colors inline-block cursor-pointer"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* USER INSPECTOR MODAL */}
      {inspectUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-[#D1E7D8] shadow-2xl space-y-5 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#D1E7D8]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#E8F8EE] text-[#0A504A] font-black flex items-center justify-center text-sm">
                  {inspectUser.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#0A504A]">
                    {inspectUser.name}
                  </h3>
                  <span className="text-[11px] text-[#0A504A]/70 font-mono">
                    ID: {inspectUser.id}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectUser(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Account Meta Grid */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#E8F8EE]/50 border border-[#D1E7D8]">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#0A504A]/60 block">Email Address</span>
                  <span className="font-bold text-[#0A504A] break-all">{inspectUser.email}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#0A504A]/60 block">Phone Number</span>
                  <span className="font-bold text-[#0A504A] font-mono">{inspectUser.phone || "Not specified"}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#0A504A]/60 block">Joined Date</span>
                  <span className="font-bold text-[#0A504A]">{inspectUser.joined}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#0A504A]/60 block">Current Status</span>
                  <span className={`font-bold ${inspectUser.is_active ? "text-emerald-600" : "text-rose-600"}`}>
                    {inspectUser.status}
                  </span>
                </div>
              </div>

              {/* Rider Profile Card if Delivery Agent */}
              {inspectUser.rider_profile && (
                <div className="p-4 rounded-2xl bg-white border border-[#00A86B]/30 shadow-2xs space-y-2.5">
                  <div className="flex items-center gap-2 text-[#0A504A] font-bold">
                    <Bike className="w-4 h-4 text-[#00A86B]" />
                    <span>Rider Fleet Profile</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-gray-500 block">Vehicle:</span>
                      <span className="font-semibold capitalize text-[#0A504A]">
                        {inspectUser.rider_profile.vehicle_type} ({inspectUser.rider_profile.vehicle_number})
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">License:</span>
                      <span className="font-semibold text-[#0A504A]">
                        {inspectUser.rider_profile.license_number}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Operating City:</span>
                      <span className="font-semibold text-[#0A504A]">
                        {inspectUser.rider_profile.service_city || "Dhaka"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Rating:</span>
                      <span className="font-semibold text-[#0A504A]">
                        ★ {inspectUser.rider_profile.rating?.toFixed(1) || "5.0"}
                      </span>
                    </div>
                  </div>
                  {inspectUser.rider_profile.delivery_zones && inspectUser.rider_profile.delivery_zones.length > 0 && (
                    <div className="pt-1">
                      <span className="text-[10px] text-gray-500 font-bold block mb-1">Approved Delivery Zones:</span>
                      <div className="flex flex-wrap gap-1">
                        {inspectUser.rider_profile.delivery_zones.map((zone, zIdx) => (
                          <span
                            key={zIdx}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
                          >
                            {zone}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Role Allocation Selector */}
              <div>
                <label className="text-[11px] font-bold text-[#0A504A] uppercase block mb-1">
                  Change Account Role
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A] font-bold focus:border-[#00A86B]"
                  >
                    <option value="CUSTOMER">CUSTOMER (Shopper)</option>
                    <option value="SELLER">SELLER (Store Merchant)</option>
                    <option value="RIDER">RIDER (Delivery Fleet)</option>
                    <option value="ADMIN">ADMIN (Operations Manager)</option>
                  </select>

                  <button
                    type="button"
                    disabled={isUpdatingStatus || editRole === inspectUser.role}
                    onClick={handleSaveUserRole}
                    className="px-4 py-2 rounded-xl bg-[#0A504A] hover:bg-[#00A86B] text-white text-xs font-bold transition disabled:opacity-40 cursor-pointer"
                  >
                    Save Role
                  </button>
                </div>
              </div>

              {/* Account Controls */}
              <div className="pt-2 flex items-center justify-between border-t border-[#D1E7D8]">
                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={handleToggleUserStatus}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50 ${
                    inspectUser.is_active
                      ? "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                  }`}
                >
                  {isUpdatingStatus
                    ? "Updating..."
                    : inspectUser.is_active
                    ? "Suspend Account"
                    : "Activate Account"}
                </button>

                <button
                  type="button"
                  onClick={() => setInspectUser(null)}
                  className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-[#D1E7D8] shadow-2xl space-y-4 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#D1E7D8]">
              <div>
                <h3 className="font-serif font-bold text-xl text-[#0A504A]">
                  Provision New User
                </h3>
                <p className="text-xs text-[#0A504A]/70">
                  Create a live user account with assigned permissions and role.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#0A504A] uppercase block mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.firstName}
                    onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                    placeholder="e.g. John"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A] focus:border-[#00A86B]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#0A504A] uppercase block mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.lastName}
                    onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                    placeholder="e.g. Doe"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A] focus:border-[#00A86B]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#0A504A] uppercase block mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="user@domain.com"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A] focus:border-[#00A86B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#0A504A] uppercase block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    placeholder="+880 1700 000000"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A] focus:border-[#00A86B]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#0A504A] uppercase block mb-1">
                    Initial Password
                  </label>
                  <input
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    placeholder="Default: Nexora@2026!"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A] focus:border-[#00A86B]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#0A504A] uppercase block mb-1">
                  Assigned Role *
                </label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A] focus:border-[#00A86B]"
                >
                  <option value="CUSTOMER">CUSTOMER (Standard Shopper)</option>
                  <option value="SELLER">SELLER (Store Merchant)</option>
                  <option value="RIDER">RIDER (Delivery Agent Fleet)</option>
                  <option value="ADMIN">ADMIN (Operations Manager)</option>
                </select>
              </div>

              {createForm.role === "RIDER" && (
                <div className="p-3.5 rounded-2xl bg-[#E8F8EE]/60 border border-[#00A86B]/30 space-y-3">
                  <div className="font-bold text-[11px] text-[#0A504A] flex items-center gap-1.5">
                    <Bike className="w-3.5 h-3.5 text-[#00A86B]" />
                    <span>Courier Fleet Parameters</span>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#0A504A] uppercase block mb-1">
                      Primary Service City
                    </label>
                    <input
                      type="text"
                      value={createForm.serviceCity}
                      onChange={(e) => setCreateForm({ ...createForm, serviceCity: e.target.value })}
                      placeholder="e.g. Dhaka"
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#0A504A] uppercase block mb-1">
                      Covered Delivery Zones (comma separated)
                    </label>
                    <input
                      type="text"
                      value={createForm.deliveryZones}
                      onChange={(e) => setCreateForm({ ...createForm, deliveryZones: e.target.value })}
                      placeholder="Dhaka North, Gulshan, Banani, Uttara"
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A]"
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-[#D1E7D8]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#D1E7D8] text-xs font-semibold text-[#0A504A] hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 rounded-xl bg-[#0A504A] hover:bg-[#00A86B] text-white text-xs font-bold shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isCreating ? "Provisioning..." : "Provision Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
