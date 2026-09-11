"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyEmailToken } from "../../../lib/api/auth";
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tokenFromUrl = searchParams.get("token") || "";

  const [token, setToken] = useState(tokenFromUrl);
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">(
    tokenFromUrl ? "verifying" : "idle"
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tokenFromUrl) {
      handleVerification(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const handleVerification = async (verifyToken: string) => {
    setStatus("verifying");
    setError(null);
    try {
      await verifyEmailToken(verifyToken);
      setStatus("success");
      setTimeout(() => {
        router.push("/profile");
      }, 2500);
    } catch (err: any) {
      setStatus("error");
      setError(err?.message || "Invalid or expired verification token.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-[#080b12] relative overflow-hidden">
      <div className="w-full max-w-md z-10 text-center">
        <div className="glass-card rounded-2xl p-8 border border-slate-800">
          {status === "verifying" && (
            <div className="py-8">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Verifying Your Account</h2>
              <p className="text-xs text-slate-400">Please wait while we confirm your email token...</p>
            </div>
          )}

          {status === "success" && (
            <div className="py-6">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Email Confirmed!</h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
                Your account is now activated. Redirecting you to your dashboard...
              </p>
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className="py-6">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Verification Failed</h2>
              <p className="text-xs text-rose-400 max-w-sm mx-auto mb-6">{error}</p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
              >
                <span>Return to Login</span>
              </Link>
            </div>
          )}

          {status === "idle" && (
            <div className="py-4">
              <h2 className="text-xl font-bold text-white mb-2">Verify Your Email</h2>
              <p className="text-xs text-slate-400 mb-6">
                Enter the verification token received in your email inbox below.
              </p>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste token here"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 mb-4 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={() => handleVerification(token)}
                disabled={!token}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all disabled:opacity-50"
              >
                Submit Verification
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#080b12] text-slate-300">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
