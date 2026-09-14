"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Store,
  Building2,
  Mail,
  User,
  Calendar,
  LogOut,
  RefreshCw,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { getMySellerProfile, SellerProfile } from "../../../lib/api/sellers";
import { Navbar } from "../../../components/Navbar";

export default function MerchantPendingApprovalPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();

  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const checkStatus = async (isManual = false) => {
    if (isManual) setChecking(true);
    setStatusMsg(null);

    try {
      const p = await getMySellerProfile();
      setProfile(p);

      if (p.status === "approved") {
        setStatusMsg("Congratulations! Your merchant account has been approved.");
        setTimeout(() => {
          router.replace("/seller/dashboard");
        }, 1500);
      } else if (isManual) {
        setStatusMsg("Application is still under review by the administration team.");
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
      setChecking(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !user) {
        router.replace("/login?redirect=/seller/pending-approval");
        return;
      }
      checkStatus();
    }
  }, [authLoading, isAuthenticated, user, router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch {
      router.replace("/login");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F2] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00A86B]"></div>
      </div>
    );
  }

  const isApproved = profile?.status === "approved";
  const isRejected = profile?.status === "rejected";

  return (
    <div className="min-h-screen bg-[#F7F7F2] text-[#0A504A] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-12 flex flex-col justify-center">
        <div className="bg-white rounded-3xl border border-[#D1E7D8] shadow-xl shadow-[#0A504A]/5 p-6 sm:p-10 text-center animate-fade-in">
          {/* Status Animated Icon */}
          <div className="relative mx-auto w-24 h-24 mb-6">
            <div
              className={`w-24 h-24 rounded-3xl flex items-center justify-center shadow-lg transition-transform duration-300 ${
                isApproved
                  ? "bg-gradient-to-tr from-emerald-500 to-[#00A86B] text-white shadow-emerald-500/25 animate-bounce"
                  : isRejected
                  ? "bg-rose-100 border-2 border-rose-300 text-rose-600 shadow-rose-500/15"
                  : "bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-600 text-white shadow-amber-500/25"
              }`}
            >
              {isApproved ? (
                <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
              ) : isRejected ? (
                <AlertCircle className="w-12 h-12 stroke-[2.5]" />
              ) : (
                <Clock className="w-12 h-12 stroke-[2.5] animate-pulse" />
              )}
            </div>
            {!isApproved && !isRejected && (
              <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#00A86B] border-2 border-white flex items-center justify-center text-white">
                <Store className="w-3.5 h-3.5" />
              </span>
            )}
          </div>

          {/* Badge & Headlines */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-3 bg-amber-50 border border-amber-200 text-amber-800">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>
              {isApproved ? "Account Approved" : isRejected ? "Application Rejected" : "Merchant Application In Review"}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-[#0A504A] tracking-tight">
            {isApproved
              ? "Merchant Account Approved!"
              : isRejected
              ? "Merchant Application Needs Revision"
              : "Your Merchant Application is Under Review"}
          </h1>

          <p className="text-xs sm:text-sm text-[#0A504A]/70 max-w-lg mx-auto mt-2 leading-relaxed">
            {isApproved
              ? "Congratulations! Your store has been approved by platform administration. Redirecting to your merchant dashboard..."
              : isRejected
              ? `Application status: ${profile?.rejection_reason || "Verification documents did not meet standard requirements. Please contact support."}`
              : "Thank you for joining our marketplace! Our administration team is currently reviewing your store and account details. Once an administrator approves your application, your merchant dashboard and storefront will be activated automatically."}
          </p>

          {statusMsg && (
            <div
              className={`mt-4 p-3 rounded-xl text-xs font-bold inline-flex items-center gap-2 border ${
                isApproved
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#00A86B]" />
              <span>{statusMsg}</span>
            </div>
          )}

          {/* Application Details Summary Card */}
          <div className="mt-8 p-5 sm:p-6 rounded-2xl bg-[#F7F7F2] border border-[#D1E7D8] text-left">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0A504A]/70 font-mono mb-4 flex items-center justify-between">
              <span>Application Summary</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300">
                {profile?.status || "pending"}
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-[#D1E7D8]/80">
                <div className="w-9 h-9 rounded-lg bg-[#E8F8EE] text-[#00A86B] flex items-center justify-center shrink-0">
                  <Store className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-[#0A504A]/60 font-medium block">Store / Business Name</span>
                  <span className="font-bold text-[#0A504A] truncate block">
                    {profile?.business_name || "Merchant Store"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-[#D1E7D8]/80">
                <div className="w-9 h-9 rounded-lg bg-[#E8F8EE] text-[#00A86B] flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-[#0A504A]/60 font-medium block">Applicant Name</span>
                  <span className="font-bold text-[#0A504A] truncate block">
                    {user?.first_name} {user?.last_name}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-[#D1E7D8]/80">
                <div className="w-9 h-9 rounded-lg bg-[#E8F8EE] text-[#00A86B] flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-[#0A504A]/60 font-medium block">Registered Email</span>
                  <span className="font-bold text-[#0A504A] font-mono truncate block">{user?.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-[#D1E7D8]/80">
                <div className="w-9 h-9 rounded-lg bg-[#E8F8EE] text-[#00A86B] flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-[#0A504A]/60 font-medium block">Submission Date</span>
                  <span className="font-bold text-[#0A504A] block">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "Today"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => checkStatus(true)}
              disabled={checking}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#00A86B] hover:bg-[#0A504A] text-white font-black text-xs transition-all shadow-md shadow-[#00A86B]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? "animate-spin" : ""}`} />
              <span>{checking ? "Checking Approval..." : "Refresh Approval Status"}</span>
            </button>

            <Link
              href="/chat"
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white border border-[#D1E7D8] hover:border-[#00A86B] text-[#0A504A] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#00A86B]" />
              <span>Contact Support</span>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
