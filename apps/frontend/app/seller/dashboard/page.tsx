"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "../../../components/Navbar";
import { ProtectedRoute } from "../../../components/auth/ProtectedRoute";
import { getMySellerProfile, SellerProfile } from "../../../lib/api/sellers";
import { getSellerProducts, submitProductForReview, ProductItem } from "../../../lib/api/products";
import {
  Store,
  DollarSign,
  Package,
  Clock,
  Plus,
  Settings,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Loader2,
  ExternalLink,
} from "lucide-react";

export default function SellerDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [profileData, productsData] = await Promise.allSettled([
          getMySellerProfile(),
          getSellerProducts(),
        ]);

        if (profileData.status === "fulfilled") {
          setProfile(profileData.value);
        } else {
          // If seller not onboarded, redirect to onboard
          router.push("/seller/onboard");
          return;
        }

        if (productsData.status === "fulfilled") {
          setProducts(productsData.value);
        }
      } catch (err) {
        console.error("Failed loading seller dashboard", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboard();
  }, [router]);

  const handleSubmitReview = async (productId: string) => {
    setActionLoadingId(productId);
    try {
      const updated = await submitProductForReview(productId);
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? updated : p))
      );
    } catch (err: any) {
      alert(err.message || "Failed submitting for review");
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatCents = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  return (
    <ProtectedRoute allowedRoles={["SELLER", "ADMIN", "SUPER_ADMIN"]}>
      <div className="min-h-screen bg-[#080b12] text-slate-100 flex flex-col">
        <Navbar />

        <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
              <p className="text-sm text-slate-400">Loading seller portal...</p>
            </div>
          ) : (
            <>
              {/* Top Banner */}
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 mb-8 border-b border-slate-800 gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1.5">
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                      {profile?.business_name || "Merchant Dashboard"}
                    </h1>
                    <span
                      className={`text-xs uppercase font-mono px-2.5 py-0.5 rounded-full border ${
                        profile?.status === "approved"
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                      }`}
                    >
                      {profile?.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Vendor ID: <span className="font-mono text-slate-300">{profile?.id}</span> • Stripe Connect:{" "}
                    <span className="font-mono text-indigo-400">
                      {profile?.stripe_account_id || "Unlinked"}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href="/seller/store/settings"
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Store Settings</span>
                  </Link>

                  <Link
                    href="/seller/products/new"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors shadow-lg shadow-indigo-600/30"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Product</span>
                  </Link>
                </div>
              </div>

              {/* Status Notice if not approved */}
              {profile?.status !== "approved" && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs mb-8 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>
                      Your merchant account is currently <strong>{profile?.status}</strong>. Complete KYC in the onboarding portal to publish active products.
                    </span>
                  </div>
                  <Link
                    href="/seller/onboard"
                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-white font-medium whitespace-nowrap transition-colors"
                  >
                    Verify Account
                  </Link>
                </div>
              )}

              {/* Stat Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                <div className="glass-card rounded-2xl p-5 border border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-400">Total Net Earnings</span>
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-white">
                    {formatCents(profile?.total_earnings || 0)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">Directly disbursed via Stripe Connect</p>
                </div>

                <div className="glass-card rounded-2xl p-5 border border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-400">Pending Balance</span>
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-white">
                    {formatCents(profile?.pending_balance || 0)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">Funds in 7-day clearing holding cycle</p>
                </div>

                <div className="glass-card rounded-2xl p-5 border border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-400">Total Catalog Items</span>
                    <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                      <Package className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-white">{products.length}</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {products.filter((p) => p.status === "approved").length} active in public catalog
                  </p>
                </div>

                <div className="glass-card rounded-2xl p-5 border border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-400">KYC Verification</span>
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-lg font-bold text-white capitalize mt-1">
                    {profile?.bank_verified ? "Bank Verified" : "Pending Action"}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Payer ID: {profile?.tax_id || "Unregistered"}
                  </p>
                </div>
              </div>

              {/* Products Catalog Table Preview */}
              <div className="glass-card rounded-2xl border border-slate-800 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-base font-bold text-white">Vendor Product Inventory</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Manage product statuses, pricing, and submission for admin compliance review.
                    </p>
                  </div>
                  <Link
                    href="/seller/products"
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                  >
                    <span>View All Catalog Items</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {products.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
                    <Package className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <h3 className="text-sm font-semibold text-slate-300">No products created yet</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                      Get started by creating your first product with customized variants, images, and prices.
                    </p>
                    <Link
                      href="/seller/products/new"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create First Product</span>
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                          <th className="pb-3 pl-2">Product Name</th>
                          <th className="pb-3">Base Price</th>
                          <th className="pb-3">Variants</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3 text-right pr-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {products.slice(0, 5).map((prod) => (
                          <tr key={prod.id} className="hover:bg-slate-900/40 transition-colors">
                            <td className="py-3.5 pl-2">
                              <div>
                                <span className="font-semibold text-slate-200 block text-sm">
                                  {prod.name}
                                </span>
                                <span className="text-[11px] text-slate-500 font-mono">
                                  {prod.slug}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 font-mono text-slate-200 font-semibold">
                              {formatCents(prod.base_price)}
                            </td>
                            <td className="py-3.5 text-slate-300">
                              {prod.variants.length} variant(s)
                            </td>
                            <td className="py-3.5">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-semibold ${
                                  prod.status === "approved"
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    : prod.status === "pending_review"
                                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                    : prod.status === "rejected"
                                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                    : "bg-slate-800 text-slate-400 border border-slate-700"
                                }`}
                              >
                                {prod.status.replace("_", " ")}
                              </span>
                            </td>
                            <td className="py-3.5 text-right pr-2">
                              {prod.status === "draft" && (
                                <button
                                  onClick={() => handleSubmitReview(prod.id)}
                                  disabled={actionLoadingId === prod.id}
                                  className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-medium transition-colors"
                                >
                                  {actionLoadingId === prod.id ? "Submitting..." : "Submit Review"}
                                </button>
                              )}
                              {prod.status === "approved" && (
                                <Link
                                  href={`/products/${prod.id}`}
                                  className="text-slate-400 hover:text-white inline-flex items-center gap-1 text-[11px]"
                                >
                                  <span>View Live</span>
                                  <ExternalLink className="w-3 h-3" />
                                </Link>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
