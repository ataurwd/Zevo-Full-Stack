"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../../providers/AuthProvider";
import { AdminDashboardShell } from "../../components/admin/AdminDashboardShell";
import { ZevoIcon, ZevoLogo } from "../../components/branding/ZevoLogo";
import { ZevoLoader } from "../../components/branding/ZevoLoader";
import { ShieldAlert, Loader2, Lock } from "lucide-react";
import Link from "next/link";

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Not logged in -> Redirect immediately to login
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      } else if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && user.role !== "SUPPORT") {
        // Logged in with wrong role -> Deny and redirect
        router.replace("/login?error=unauthorized");
      }
    }
  }, [user, isLoading, router, pathname]);

  // 1. Loading / Authenticating state
  if (isLoading) {
    return <ZevoLoader size="responsive" />;
  }

  // 2. Unauthenticated or Unauthorized Gate (NEVER render dashboard)
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && user.role !== "SUPPORT")) {
    return (
      <div className="min-h-screen bg-[#073A36] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mb-5 shadow-xl">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold font-serif mb-2 text-white">
          Administrator Access Required
        </h2>
        <p className="text-sm text-emerald-200 max-w-md mb-6 leading-relaxed">
          This area is restricted to authorized personnel only. You are not authenticated as an Administrator. Please log in with your administrative account to proceed.
        </p>
        <Link
          href={`/login?redirect=${encodeURIComponent(pathname)}`}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#00A86B] to-[#0A504A] text-white text-xs font-bold shadow-lg hover:brightness-110 transition-all border border-white/20 cursor-pointer"
        >
          <Lock className="w-4 h-4" />
          <span>Sign In to Admin Portal</span>
        </Link>
      </div>
    );
  }

  // 3. Authorized Admin User
  return <AdminDashboardShell>{children}</AdminDashboardShell>;
}
