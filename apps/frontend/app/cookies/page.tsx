"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import {
  Cookie,
  ShieldCheck,
  Check,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sliders,
} from "lucide-react";

export default function CookiePolicyPage() {
  const lastUpdated = "September 17, 2026";
  const [preferencesSaved, setPreferencesSaved] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [marketingEnabled, setMarketingEnabled] = useState(false);

  const handleSavePreferences = () => {
    setPreferencesSaved(true);
    setTimeout(() => setPreferencesSaved(false), 4000);
  };

  return (
    <div className="min-h-screen bg-[#F7F7F2] text-[#0A504A] flex flex-col selection:bg-[#00A86B] selection:text-white">
      <Navbar />

      {/* Hero Header */}
      <section className="relative w-full bg-gradient-to-b from-[#E8F8EE] via-[#FAFDFB] to-[#F7F7F2] border-b border-[#D1E7D8] py-14 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#A2E4B8] text-[#00A86B] text-xs font-bold uppercase tracking-wider mb-4 shadow-2xs">
            <Cookie className="w-4 h-4" />
            <span>Transparency & Control</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-extrabold text-[#0A504A] tracking-tight">
            Cookie Policy
          </h1>
          <p className="mt-4 text-sm sm:text-base text-[#0A504A]/75 max-w-2xl mx-auto leading-relaxed">
            Understand how Zevo uses cookies and local storage tokens to deliver seamless real-time shopping, secure authentication, and personalized experiences.
          </p>
          <div className="flex items-center justify-center gap-2 mt-6 text-xs text-[#0A504A]/60 font-medium">
            <Clock className="w-3.5 h-3.5 text-[#00A86B]" />
            <span>Last Updated: {lastUpdated}</span>
            <span className="select-none">•</span>
            <span>Version 2.4</span>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 flex-1 w-full space-y-10">
        {/* Cookie Preference Manager Card */}
        <div className="bg-white rounded-3xl border border-[#D1E7D8] p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-[#E8F8EE]">
            <div>
              <h2 className="text-lg font-bold font-serif text-[#0A504A] flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#00A86B]" />
                <span>Customize Your Cookie Preferences</span>
              </h2>
              <p className="text-xs text-[#0A504A]/70 mt-1">
                Toggle optional telemetry cookies below. Essential cookies cannot be disabled as they are required for security and order checkout.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Category 1: Strictly Necessary */}
            <div className="p-4 rounded-2xl bg-[#F7F7F2] border border-[#D1E7D8] flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <strong className="text-xs sm:text-sm text-[#0A504A]">Strictly Necessary Cookies</strong>
                  <span className="px-2 py-0.5 rounded-full bg-[#E8F8EE] text-[#00A86B] text-[10px] font-bold uppercase">Required</span>
                </div>
                <p className="text-xs text-[#0A504A]/70 mt-1">
                  Enables user login, multi-tab session synchronization, guest cart tracking, and security token verification.
                </p>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-[#0A504A] text-white text-xs font-bold shrink-0 opacity-80 cursor-not-allowed">
                Always Active
              </div>
            </div>

            {/* Category 2: Performance & Analytics */}
            <div className="p-4 rounded-2xl bg-[#F7F7F2] border border-[#D1E7D8] flex items-center justify-between gap-4">
              <div>
                <strong className="text-xs sm:text-sm text-[#0A504A]">Performance & Telemetry Cookies</strong>
                <p className="text-xs text-[#0A504A]/70 mt-1">
                  Helps us measure page load speeds, catalog search responsiveness, and rider GPS map rendering efficiency.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAnalyticsEnabled(!analyticsEnabled)}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                  analyticsEnabled ? "bg-[#00A86B]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full bg-white shadow-xs block transition-transform transform ${
                    analyticsEnabled ? "translate-x-6" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            {/* Category 3: Marketing & Recommendations */}
            <div className="p-4 rounded-2xl bg-[#F7F7F2] border border-[#D1E7D8] flex items-center justify-between gap-4">
              <div>
                <strong className="text-xs sm:text-sm text-[#0A504A]">Personalized Offers & Recommendations</strong>
                <p className="text-xs text-[#0A504A]/70 mt-1">
                  Enables customized seasonal recipes, discount banner prompts, and personalized product recommendations.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMarketingEnabled(!marketingEnabled)}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                  marketingEnabled ? "bg-[#00A86B]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full bg-white shadow-xs block transition-transform transform ${
                    marketingEnabled ? "translate-x-6" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#E8F8EE] flex flex-col sm:flex-row items-center justify-between gap-3">
            {preferencesSaved ? (
              <span className="text-xs font-semibold text-[#00A86B] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Your cookie preferences have been updated!</span>
              </span>
            ) : (
              <span className="text-xs text-[#0A504A]/60">
                Changes take effect immediately on this browser.
              </span>
            )}

            <button
              type="button"
              onClick={handleSavePreferences}
              className="px-6 py-2.5 rounded-full bg-[#00A86B] hover:bg-[#0A504A] text-white text-xs font-bold transition-all shadow-md cursor-pointer self-end sm:self-auto"
            >
              Save Cookie Settings
            </button>
          </div>
        </div>

        {/* Informational Clauses */}
        <div className="bg-white rounded-3xl border border-[#D1E7D8] p-6 sm:p-10 shadow-sm space-y-6">
          <section className="space-y-3">
            <h2 className="text-xl font-bold font-serif text-[#0A504A]">What Are Cookies?</h2>
            <p className="text-xs sm:text-sm text-[#0A504A]/80 leading-relaxed">
              Cookies are small text fragments stored on your device when you visit websites. They remember your actions and preferences over time so you don&apos;t have to re-enter them whenever you return or switch between tabs.
            </p>
          </section>

          <hr className="border-[#E8F8EE]" />

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-serif text-[#0A504A]">How to Clear Cookies in Your Browser</h2>
            <p className="text-xs sm:text-sm text-[#0A504A]/80 leading-relaxed">
              You can also control or delete cookies directly through your web browser settings. Most modern browsers allow you to block third-party cookies, clear browsing history, or enable &ldquo;Do Not Track&rdquo; signals. Note that disabling essential cookies may impact your ability to check out or maintain a logged-in session on Zevo.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
