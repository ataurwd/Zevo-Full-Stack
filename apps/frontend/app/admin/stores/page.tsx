"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  adminListStores,
  AdminStoreProfile,
} from "../../../lib/api/stores";
import {
  Building2,
  Store,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  ExternalLink,
  ShieldCheck,
  Settings,
  Package,
  Loader2,
  RefreshCw,
  Mail,
  User,
  ShoppingBag,
  Star,
} from "lucide-react";

export default function AdminStoresModule() {
  const params = useParams();
  const slug = (params?.slug as string[]) || [];
  const routeStatus = slug[0] && ["pending", "active", "suspended"].includes(slug[0]) ? slug[0].toUpperCase() : "ALL";

  const [stores, setStores] = useState<AdminStoreProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState(routeStatus);
  const [search, setSearch] = useState("");

  const loadStores = async (showSpin = false) => {
    if (showSpin) setIsRefreshing(true);
    try {
      const data = await adminListStores();
      setStores(data || []);
    } catch (err) {
      console.error("Failed to load stores from API:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadStores();
  }, []);

  const filteredStores = stores.filter((s) => {
    const isApproved = s.status === "APPROVED" || s.status === "ACTIVE";
    const isPending = s.status === "PENDING";
    const isSuspended = s.status === "SUSPENDED" || s.status === "REJECTED";

    let matchStatus = true;
    if (statusFilter === "ACTIVE") matchStatus = isApproved;
    else if (statusFilter === "PENDING") matchStatus = isPending;
    else if (statusFilter === "SUSPENDED") matchStatus = isSuspended;

    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.slug.toLowerCase().includes(q) ||
      (s.seller && s.seller.toLowerCase().includes(q)) ||
      (s.seller_email && s.seller_email.toLowerCase().includes(q));

    return matchStatus && matchSearch;
  });

  const activeCount = stores.filter((s) => s.status === "APPROVED" || s.status === "ACTIVE").length;
  const pendingCount = stores.filter((s) => s.status === "PENDING").length;
  const suspendedCount = stores.filter((s) => s.status === "SUSPENDED" || s.status === "REJECTED").length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F8EE] border border-[#A2E4B8]/30 text-[#0A504A] text-[11px] font-bold uppercase tracking-wider mb-2">
            <Building2 className="w-3.5 h-3.5 text-[#00A86B]" />
            <span>Multi-Vendor Store Hubs</span>
          </div>
          <h1 className="text-3xl font-serif font-black text-[#0A504A] tracking-tight">
            Stores Management
          </h1>
          <p className="text-xs text-[#0A504A]/70 mt-1">
            Live database of registered merchant storefronts, catalog permissions, and store policy compliance.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-[#0A504A]/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search stores, owners, or emails..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A] placeholder:text-[#0A504A]/50 focus:outline-none focus:border-[#00A86B]"
            />
          </div>
          <button
            onClick={() => loadStores(true)}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-white border border-[#D1E7D8] hover:bg-[#E8F8EE] text-[#0A504A] transition-colors cursor-pointer shrink-0"
            title="Refresh stores list"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-[#00A86B]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#D1E7D8] pb-2 overflow-x-auto scrollbar-none">
        {[
          { key: "ALL", label: "All Stores", count: stores.length },
          { key: "ACTIVE", label: "Active & Verified", count: activeCount },
          { key: "PENDING", label: "Pending Review", count: pendingCount, highlight: pendingCount > 0 },
          { key: "SUSPENDED", label: "Suspended", count: suspendedCount },
        ].map((tab) => {
          const isSelected = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 inline-flex items-center gap-2 cursor-pointer ${
                isSelected
                  ? "bg-[#00A86B] text-white shadow-2xs"
                  : "bg-white border border-[#D1E7D8] text-[#0A504A]/80 hover:bg-[#E8F8EE]"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  isSelected
                    ? "bg-white/25 text-white"
                    : tab.highlight
                    ? "bg-amber-100 text-amber-900 border border-amber-300"
                    : "bg-[#E8F8EE] text-[#0A504A]"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="py-20 text-center rounded-3xl bg-white border border-[#D1E7D8]">
          <Loader2 className="w-8 h-8 text-[#00A86B] animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-[#0A504A]/70">Loading active merchant storefronts...</p>
        </div>
      ) : filteredStores.length === 0 ? (
        <div className="py-16 px-4 text-center rounded-3xl bg-white border border-[#D1E7D8]">
          <div className="w-12 h-12 rounded-2xl bg-[#E8F8EE] text-[#00A86B] flex items-center justify-center mx-auto mb-3">
            <Store className="w-6 h-6" />
          </div>
          <h3 className="font-serif font-bold text-base text-[#0A504A]">No stores found</h3>
          <p className="text-xs text-[#0A504A]/70 max-w-sm mx-auto mt-1">
            {search ? "No merchant store matches your search criteria." : "There are currently no stores in this status."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStores.map((store) => {
            const isApproved = store.status === "APPROVED" || store.status === "ACTIVE";
            const isPending = store.status === "PENDING";

            return (
              <div
                key={store.id}
                className="p-6 rounded-3xl bg-white border border-[#D1E7D8] shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#E8F8EE] border border-[#D1E7D8] text-[#00A86B] flex items-center justify-center font-bold shrink-0">
                      <Store className="w-5 h-5" />
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                        isApproved
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : isPending
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      {store.status}
                    </span>
                  </div>

                  <h3 className="font-serif font-bold text-base text-[#0A504A] truncate" title={store.name}>
                    {store.name}
                  </h3>
                  <div className="space-y-0.5 mt-1 text-xs text-[#0A504A]/70">
                    <p className="flex items-center gap-1.5 truncate">
                      <User className="w-3 h-3 text-[#00A86B] shrink-0" />
                      <span>Owner: <strong className="text-[#0A504A]">{store.seller}</strong></span>
                    </p>
                    {store.seller_email && (
                      <p className="flex items-center gap-1.5 font-mono text-[11px] truncate">
                        <Mail className="w-3 h-3 text-[#00A86B] shrink-0" />
                        <span>{store.seller_email}</span>
                      </p>
                    )}
                  </div>

                  {store.description && (
                    <p className="text-[11px] text-[#0A504A]/60 mt-2 line-clamp-2 leading-relaxed">
                      {store.description}
                    </p>
                  )}

                  <div className="mt-4 pt-3 border-t border-[#D1E7D8] grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-[#0A504A]/70 uppercase block font-semibold">Catalog</span>
                      <span className="font-bold text-[#0A504A] flex items-center gap-1">
                        <Package className="w-3 h-3 text-[#00A86B]" />
                        <span>{store.productsCount} products</span>
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#0A504A]/70 uppercase block font-semibold">Revenue</span>
                      <span className="font-bold font-mono text-[#0A504A]">{store.ordersTotal}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-[#D1E7D8]/60">
                  <Link
                    href={`/admin/sellers?search=${encodeURIComponent(store.seller_email || store.seller)}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#00A86B] hover:underline"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>View Merchant KYC</span>
                  </Link>

                  <Link
                    href={`/products?store=${encodeURIComponent(store.slug)}`}
                    className="p-2 rounded-xl bg-[#E8F8EE] hover:bg-[#D1E7D8] text-[#0A504A] transition-colors"
                    title="View storefront"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
