"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../../hooks/useAuth";
import { getMySellerProfile } from "../../../lib/api/sellers";
import { ZevoLogo } from "../../../components/branding/ZevoLogo";
import { ZevoLoader } from "../../../components/branding/ZevoLoader";
import { AuthIllustrationDesk } from "../../../components/auth/AuthIllustrationDesk";
import {
  Lock,
  Mail,
  AlertCircle,
  Loader2,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Zap,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const errorParam = searchParams.get("error");

  const { user, isAuthenticated, isLoading, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(
    errorParam === "unauthorized"
      ? "Access denied. Administrator credentials required to access this resource."
      : null
  );
  const [loading, setLoading] = useState(false);

  // Authenticated user guard: If user is already logged in, redirect them away immediately!
  React.useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (
        redirectParam &&
        redirectParam.startsWith("/") &&
        !redirectParam.startsWith("/login") &&
        !redirectParam.startsWith("/register")
      ) {
        router.replace(redirectParam);
      } else if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
        router.replace("/admin");
      } else if (user.role === "SUPPORT") {
        router.replace("/admin/chat");
      } else if (user.role === "SELLER") {
        router.replace("/dashboard");
      } else if (user.role === "DELIVERY_AGENT") {
        router.replace("/delivery/dashboard");
      } else {
        router.replace("/");
      }
    }
  }, [isLoading, isAuthenticated, user, redirectParam, router]);

  // Quick Demo account auto-fill helper for instant testing
  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const loggedInUser = await login({ email, password });
      
      // Role-based direct navigation: send each user directly to their respective dashboard
      const userRole = loggedInUser?.role || "CUSTOMER";
      if (userRole === "ADMIN" || userRole === "SUPER_ADMIN") {
        router.push(redirectParam && redirectParam.startsWith("/admin") ? redirectParam : "/admin");
      } else if (userRole === "SUPPORT") {
        router.push(redirectParam && redirectParam.startsWith("/admin") ? redirectParam : "/admin/chat");
      } else if (userRole === "SELLER") {
        try {
          const sellerProfile = await getMySellerProfile();
          if (sellerProfile && sellerProfile.status === "approved") {
            router.push(redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("/admin") ? redirectParam : "/dashboard");
          } else {
            router.push("/seller/pending-approval");
          }
        } catch {
          router.push("/seller/pending-approval");
        }
      } else if (userRole === "DELIVERY_AGENT") {
        router.push(redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("/admin") ? redirectParam : "/delivery/dashboard");
      } else {
        router.push(redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("/admin") && !redirectParam.startsWith("/seller") && !redirectParam.startsWith("/dashboard") ? redirectParam : "/");
      }
    } catch (err: any) {
      setError(err?.message || "Invalid credentials. Please verify your email and password.");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || (isAuthenticated && user)) {
    return <ZevoLoader size="responsive" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-10 bg-[#F7F7F2] relative overflow-hidden">
      {/* Decorative Graphic Curves */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-40 select-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M -50,120 Q 250,50 500,180 T 1100,100 T 1600,240"
          fill="none"
          stroke="#A2E4B8"
          strokeWidth="3"
          strokeDasharray="10 12"
          strokeLinecap="round"
        />
        <path
          d="M 100,750 Q 400,600 800,720 T 1400,640 T 1900,780"
          fill="none"
          stroke="#00A86B"
          strokeWidth="3"
          strokeDasharray="12 14"
          strokeLinecap="round"
        />
      </svg>

      {/* Main Dual-Panel Auth Card Container */}
      <div className="w-full max-w-5xl rounded-[2rem] sm:rounded-[2.5rem] bg-white/95 backdrop-blur-2xl border border-[#D1E7D8] shadow-[0_25px_70px_-15px_rgba(0,168,107,0.12)] overflow-hidden z-10 grid grid-cols-1 md:grid-cols-12 transition-all">
        
        {/* LEFT PANEL: Fluid Wave Illustration & Brand Metrics */}
        <div className="md:col-span-6 bg-gradient-to-br from-[#E8F8EE] via-white/80 to-[#F7F7F2] relative flex flex-col justify-between p-6 sm:p-8 md:p-10 border-b md:border-b-0 md:border-r border-[#D1E7D8] overflow-hidden">
          {/* Top Brand Pill & Live Status */}
          <div className="flex items-center justify-between z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F8EE] border border-[#A2E4B8] text-[#0A504A] text-xs font-semibold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#00A86B]" />
              <span>Next-Gen Commerce</span>
            </div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#00A86B] bg-[#E8F8EE] border border-[#D1E7D8] px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00A86B] animate-pulse" />
              <span>System Live</span>
            </div>
          </div>

          {/* Centerpiece Vector Illustration */}
          <div className="my-8 sm:my-10 flex justify-center items-center relative z-10">
            <AuthIllustrationDesk />
          </div>

          {/* Bottom Trust Floating Badge */}
          <div className="p-3 sm:p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-[#D1E7D8] shadow-sm flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00A86B] text-white flex items-center justify-center shadow-md shadow-[#00A86B]/20">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#0A504A]">15-Min Hyperlocal</p>
                <p className="text-[11px] text-[#0A504A]/70 font-medium">Live courier dispatch</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-[#00A86B]">
              <ShieldCheck className="w-4 h-4 text-[#00A86B]" />
              <span>Verified</span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Sleek Form & Quick Test Helper */}
        <div className="md:col-span-6 p-6 sm:p-8 md:p-10 flex flex-col justify-center bg-white/60">
          {/* Brand Logo & Header */}
          <div className="mb-5">
            <div className="mb-4">
              <Link href="/">
                <ZevoLogo variant="full" size="md" subtitle="Logistics & Retail" priority />
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0A504A] tracking-tight">
              Welcome Back
            </h1>
            <p className="text-xs sm:text-sm text-[#0A504A]/70 mt-1">
              Sign in to your multi-vendor marketplace account.
            </p>
          </div>

          {/* Quick Demo Test Autofill */}
          <div className="mb-5 p-3.5 rounded-2xl bg-[#E8F8EE]/90 border border-[#D1E7D8] shadow-2xs">
            <div className="text-[11px] font-semibold text-[#0A504A]/75 mb-2 flex items-center justify-between">
              <span>Quick Test Autofill:</span>
              <span className="text-[10px] text-[#00A86B] font-bold uppercase tracking-wider">1-Click Demo</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickFill("customer@nexora.com", "Password123!")}
                className="px-2 py-1.5 rounded-lg bg-white hover:bg-[#E8F8EE] border border-[#D1E7D8] hover:border-[#00A86B] text-[11px] font-semibold text-[#0A504A] hover:text-[#00A86B] transition-all shadow-2xs text-center cursor-pointer"
              >
                👤 Customer
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("seller@nexora.com", "Password123!")}
                className="px-2 py-1.5 rounded-lg bg-white hover:bg-[#E8F8EE] border border-[#D1E7D8] hover:border-[#00A86B] text-[11px] font-semibold text-[#0A504A] hover:text-[#00A86B] transition-all shadow-2xs text-center cursor-pointer"
              >
                🏪 Merchant
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("rider@nexora.com", "Password123!")}
                className="px-2 py-1.5 rounded-lg bg-white hover:bg-[#E8F8EE] border border-[#D1E7D8] hover:border-[#00A86B] text-[11px] font-semibold text-[#0A504A] hover:text-[#00A86B] transition-all shadow-2xs text-center cursor-pointer"
              >
                🛵 Rider
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("admin@nexora.com", "Password123!")}
                className="px-2 py-1.5 rounded-lg bg-white hover:bg-[#E8F8EE] border border-[#D1E7D8] hover:border-[#00A86B] text-[11px] font-semibold text-[#0A504A] hover:text-[#00A86B] transition-all shadow-2xs text-center cursor-pointer"
              >
                🛡️ Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("superadmin@nexora.com", "Password123!")}
                className="px-2 py-1.5 rounded-lg bg-white hover:bg-[#E8F8EE] border border-[#D1E7D8] hover:border-[#00A86B] text-[11px] font-semibold text-[#0A504A] hover:text-[#00A86B] transition-all shadow-2xs text-center cursor-pointer"
              >
                👑 Super Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("ataurrahman24707@gmail.com", "Password123!")}
                className="px-2 py-1.5 rounded-lg bg-white hover:bg-[#E8F8EE] border border-[#D1E7D8] hover:border-[#00A86B] text-[11px] font-bold text-[#00A86B] transition-all shadow-2xs text-center truncate cursor-pointer"
              >
                ⭐ My Account
              </button>
            </div>
          </div>

          {/* Error Message Notice */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-[#0A504A] mb-1.5" htmlFor="login-email">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#00A86B] absolute left-3.5 top-3.5" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl bg-[#F7F7F2] hover:bg-white focus:bg-white border border-[#D1E7D8] text-sm text-[#0A504A] placeholder:text-[#0A504A]/50 focus:outline-none focus:border-[#00A86B] focus:ring-2 focus:ring-[#A2E4B8]/20 shadow-2xs transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-[#0A504A] mb-1.5" htmlFor="login-password">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#00A86B] absolute left-3.5 top-3.5" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-2.5 sm:py-3 rounded-xl bg-[#F7F7F2] hover:bg-white focus:bg-white border border-[#D1E7D8] text-sm text-[#0A504A] placeholder:text-[#0A504A]/50 focus:outline-none focus:border-[#00A86B] focus:ring-2 focus:ring-[#A2E4B8]/20 shadow-2xs transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-[#0A504A]/60 hover:text-[#0A504A] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password Links */}
            <div className="flex items-center justify-between pt-1">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#00A86B] border-[#D1E7D8] focus:ring-[#A2E4B8] cursor-pointer"
                />
                <span className="text-xs text-[#0A504A] font-medium">Remember me</span>
              </label>

              <Link
                href="/forgot-password"
                className="text-xs font-medium text-[#00A86B] hover:text-[#0A504A] transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* SIGNATURE PILL SUBMIT BUTTON */}
            <div className="pt-2">
              <button
                id="login-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full h-12 sm:h-13 rounded-full bg-[#00A86B] hover:bg-[#0A504A] text-white font-bold text-xs sm:text-sm tracking-wide transition-all duration-200 shadow-md shadow-[#00A86B]/25 hover:shadow-lg hover:shadow-[#0A504A]/35 active:scale-[0.99] disabled:opacity-60 flex items-center justify-between p-1.5 pl-2 pr-6 group cursor-pointer"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#A2E4B8] text-[#0A504A] flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 group-hover:bg-[#E8F8EE] transition-all">
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  )}
                </div>

                <span className="font-extrabold tracking-wider uppercase flex-1 text-center pr-2">
                  {loading ? "Authenticating..." : "SIGN IN"}
                </span>
              </button>
            </div>
          </form>

          {/* Footer Register Link */}
          <div className="mt-8 pt-6 border-t border-[#D1E7D8] text-center">
            <p className="text-xs text-[#0A504A]/70">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-[#00A86B] hover:text-[#0A504A] font-extrabold hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F7F2] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#00A86B] border-t-transparent animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}
