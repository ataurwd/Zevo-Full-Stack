"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "../../../components/Navbar";
import { ProtectedRoute } from "../../../components/auth/ProtectedRoute";
import {
  getMySellerProfile,
  onboardSeller,
  simulateOnboarding,
  SellerProfile,
} from "../../../lib/api/sellers";
import {
  Store,
  Building2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Loader2,
} from "lucide-react";

export default function SellerOnboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    business_name: "",
    business_type: "company" as "individual" | "company",
    tax_id: "",
  });

  const loadProfile = async () => {
    try {
      setError(null);
      const res = await getMySellerProfile();
      setProfile(res);
    } catch (err: any) {
      // 404 or not found means seller profile doesn't exist yet, which is expected
      if (err.status !== 404 && err.code !== "NOT_FOUND") {
        console.error(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await onboardSeller(formData);
      setProfile(res.seller);
      setSuccessMsg("Seller registration initialized successfully!");
    } catch (err: any) {
      setError(err.message || "Failed initializing seller account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulate = async () => {
    setError(null);
    setIsSimulating(true);
    try {
      const res = await simulateOnboarding();
      setProfile(res.seller);
      setSuccessMsg("Stripe Connect onboarding simulated & bank verified!");
    } catch (err: any) {
      setError(err.message || "Simulation failed");
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#080b12] text-slate-100 flex flex-col">
        <Navbar />

        <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
          {/* Header */}
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-4">
              <Store className="w-3.5 h-3.5" />
              <span>Seller Onboarding & KYC</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Launch Your Vendor Storefront
            </h1>
            <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
              Join the NEXORA platform to distribute products with automated Stripe Connect payouts and integrated hyperlocal logistics.
            </p>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
              <p className="text-sm text-slate-400">Loading merchant records...</p>
            </div>
          ) : profile ? (
            /* Existing Profile Status View */
            <div className="space-y-6">
              {/* Status Banner */}
              <div
                className={`p-6 rounded-2xl border ${
                  profile.status === "approved"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : profile.status === "rejected"
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-300"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-xl bg-slate-900/50">
                    {profile.status === "approved" ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-amber-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-bold capitalize text-white">
                        Status: {profile.status.replace("_", " ")}
                      </h2>
                      <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700">
                        {profile.business_type}
                      </span>
                    </div>

                    <p className="text-xs mt-1 text-slate-300">
                      {profile.status === "approved"
                        ? "Your merchant account is fully verified and authorized to publish products and receive customer payments."
                        : profile.status === "rejected"
                        ? `Application rejected: ${profile.rejection_reason || "Check your documents."}`
                        : "Your application is awaiting administrative review. Ensure Stripe KYC is completed below."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Account Details Card */}
              <div className="glass-card rounded-2xl p-6 border border-slate-800">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
                  Merchant Account Overview
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-xs text-slate-400">Business Name</span>
                    <p className="text-base font-semibold text-white mt-1">
                      {profile.business_name}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-xs text-slate-400">Stripe Connect ID</span>
                    <p className="text-xs font-mono text-indigo-400 mt-1 truncate">
                      {profile.stripe_account_id || "Not connected"}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-xs text-slate-400">Bank Verification</span>
                    <p className="text-sm font-semibold text-white mt-1 flex items-center gap-1.5">
                      {profile.bank_verified ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-emerald-400">Verified</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-amber-400" />
                          <span className="text-amber-400">Pending</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Stripe Simulator / Quick Actions */}
                <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-400" />
                      Development Sandbox Verification
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Simulate the Stripe Connect webhook callback to verify your merchant bank account instantly.
                    </p>
                  </div>
                  <button
                    onClick={handleSimulate}
                    disabled={isSimulating || profile.stripe_onboarding_complete}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-xs font-semibold text-white transition-colors whitespace-nowrap"
                  >
                    {isSimulating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    <span>{profile.stripe_onboarding_complete ? "KYC Completed" : "Simulate KYC"}</span>
                  </button>
                </div>

                {/* Navigation CTA */}
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => router.push("/seller/store/settings")}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
                  >
                    Store Settings
                  </button>
                  <button
                    onClick={() => router.push("/seller/dashboard")}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors shadow-lg shadow-indigo-600/30"
                  >
                    <span>Seller Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Registration Form */
            <div className="glass-card rounded-2xl p-8 border border-slate-800 max-w-2xl mx-auto">
              <h2 className="text-xl font-bold text-white mb-1">Business Information</h2>
              <p className="text-xs text-slate-400 mb-6">
                Enter your commercial identification details to initialize your vendor profile.
              </p>

              {error && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs mb-6 flex items-center gap-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs mb-6 flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Legal Business Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                    placeholder="e.g. Apex Hyper-Audio Inc."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Business Structure <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={formData.business_type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          business_type: e.target.value as "individual" | "company",
                        })
                      }
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    >
                      <option value="company">Registered Company / LLC</option>
                      <option value="individual">Sole Proprietorship / Individual</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Tax Identification Number (EIN/SSN)
                    </label>
                    <input
                      type="text"
                      value={formData.tax_id}
                      onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                      placeholder="XX-XXXXXXX"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-sm font-semibold text-white transition-colors shadow-lg shadow-indigo-600/30"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Registering...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Registration & Connect Stripe</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
