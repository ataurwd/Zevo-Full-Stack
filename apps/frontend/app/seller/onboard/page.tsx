"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
      const data = await getMySellerProfile();
      setProfile(data);
    } catch {
      // Profile doesn't exist yet
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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-5 border-b border-[#D1E7D8]">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full bg-[#E8F8EE] text-[#00A86B] font-mono text-[11px] font-bold border border-[#A2E4B8]">
            Merchant Identity & KYC
          </span>
          <span className="text-xs text-[#0A504A]/70 font-medium">Verification</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#0A504A] tracking-tight">
          Seller Onboarding & KYC
        </h1>
        <p className="text-xs sm:text-sm text-[#0A504A]/70 mt-1 font-medium">
          Verify your business coordinates with automated Stripe Connect payouts and integrated hyperlocal logistics.
        </p>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-3xl border border-[#D1E7D8] p-20 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#00A86B] animate-spin mb-3" />
          <p className="text-xs font-bold text-[#0A504A]/70 uppercase">Loading merchant records...</p>
        </div>
      ) : profile ? (
        <div className="space-y-6">
          {/* Status Banner */}
          <div
            className={`p-6 rounded-3xl border shadow-2xs ${
              profile.status === "approved"
                ? "bg-[#E8F8EE] border-[#A2E4B8] text-[#0A504A]"
                : profile.status === "rejected"
                ? "bg-rose-50 border-rose-200 text-rose-800"
                : "bg-amber-50 border-amber-200 text-amber-800"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-2xl bg-white shadow-2xs">
                {profile.status === "approved" ? (
                  <CheckCircle2 className="w-6 h-6 text-[#00A86B]" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-black capitalize text-[#0A504A]">
                    Status: {profile.status.replace("_", " ")}
                  </h2>
                  <span className="text-xs uppercase font-mono px-2 py-0.5 rounded-full bg-white border border-[#D1E7D8] font-bold">
                    {profile.business_type}
                  </span>
                </div>

                <p className="text-xs mt-1 text-[#0A504A]/80 font-medium">
                  {profile.status === "approved"
                    ? "Your merchant account is fully verified and authorized to publish products and receive customer payments."
                    : profile.status === "rejected"
                    ? `Application rejected: ${profile.rejection_reason || "Check your verification documents."}`
                    : "Your application is awaiting administrative review. Ensure Stripe KYC is completed below."}
                </p>
              </div>
            </div>
          </div>

          {/* Account Details Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#D1E7D8] shadow-2xs space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0A504A]/70 font-mono">
              Merchant Account Overview
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-[#F4FAF6] border border-[#D1E7D8]">
                <span className="text-xs text-[#0A504A]/70 font-medium">Business Name</span>
                <p className="text-base font-bold text-[#0A504A] mt-1 truncate">
                  {profile.business_name}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-[#F4FAF6] border border-[#D1E7D8]">
                <span className="text-xs text-[#0A504A]/70 font-medium">Stripe Connect ID</span>
                <p className="text-xs font-mono font-bold text-[#00A86B] mt-1 truncate">
                  {profile.stripe_account_id || "Not connected"}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-[#F4FAF6] border border-[#D1E7D8]">
                <span className="text-xs text-[#0A504A]/70 font-medium">Bank Verification</span>
                <p className="text-sm font-bold text-[#0A504A] mt-1 flex items-center gap-1.5">
                  {profile.bank_verified ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#00A86B]" />
                      <span className="text-[#00A86B]">Verified</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                      <span className="text-amber-600">Pending</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Stripe Simulator / Quick Actions */}
            <div className="p-5 rounded-2xl bg-[#F4FAF6] border border-[#D1E7D8] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-[#0A504A] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#00A86B]" />
                  <span>Development Sandbox Verification</span>
                </h4>
                <p className="text-xs text-[#0A504A]/70 mt-0.5">
                  Simulate the Stripe Connect webhook callback to verify your merchant bank account instantly.
                </p>
              </div>
              <button
                onClick={handleSimulate}
                disabled={isSimulating || profile.stripe_onboarding_complete}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#00A86B] hover:bg-[#088758] disabled:opacity-50 text-xs font-bold text-white transition-all shadow-2xs whitespace-nowrap cursor-pointer"
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
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => router.push("/seller/store/settings")}
                className="px-4 py-2 rounded-2xl bg-white border border-[#D1E7D8] hover:bg-[#E8F8EE] text-xs font-bold text-[#0A504A] transition-colors shadow-2xs cursor-pointer"
              >
                Store Settings
              </button>
              <button
                onClick={() => router.push("/seller/products")}
                className="flex items-center gap-2 px-5 py-2 rounded-2xl bg-[#0A504A] hover:bg-[#083c37] text-xs font-bold text-white transition-colors shadow-2xs cursor-pointer"
              >
                <span>Manage Products</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Registration Form */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#D1E7D8] shadow-2xs max-w-2xl mx-auto">
          <h2 className="text-xl font-black text-[#0A504A] mb-1">Business Information</h2>
          <p className="text-xs text-[#0A504A]/70 mb-6 font-medium">
            Enter your commercial identification details to initialize your vendor profile.
          </p>

          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs mb-6 flex items-center gap-3">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-2xl bg-[#E8F8EE] border border-[#A2E4B8] text-[#0A504A] text-xs mb-6 flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#00A86B]" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#0A504A] mb-1.5">
                Legal Business Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                placeholder="e.g. Apex Hyper-Audio Inc."
                className="w-full px-4 py-2.5 rounded-2xl bg-[#F4FAF6] border border-[#D1E7D8] text-sm text-[#0A504A] font-semibold focus:outline-none focus:border-[#00A86B] transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#0A504A] mb-1.5">
                  Business Structure <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.business_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      business_type: e.target.value as "individual" | "company",
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#F4FAF6] border border-[#D1E7D8] text-sm text-[#0A504A] font-semibold focus:outline-none focus:border-[#00A86B] transition-colors"
                >
                  <option value="company">Registered Company / LLC</option>
                  <option value="individual">Sole Proprietorship / Individual</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0A504A] mb-1.5">
                  Tax Identification Number (EIN/SSN)
                </label>
                <input
                  type="text"
                  value={formData.tax_id}
                  onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                  placeholder="XX-XXXXXXX"
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#F4FAF6] border border-[#D1E7D8] text-sm text-[#0A504A] font-semibold focus:outline-none focus:border-[#00A86B] transition-colors"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-[#00A86B] hover:bg-[#088758] disabled:opacity-50 text-sm font-bold text-white transition-all shadow-2xs cursor-pointer"
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
    </div>
  );
}
