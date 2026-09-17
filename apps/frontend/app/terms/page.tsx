"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import {
  FileText,
  ShieldCheck,
  RotateCcw,
  CreditCard,
  Truck,
  Store,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function TermsOfServicePage() {
  const lastUpdated = "September 17, 2026";

  return (
    <div className="min-h-screen bg-[#F7F7F2] text-[#0A504A] flex flex-col selection:bg-[#00A86B] selection:text-white">
      <Navbar />

      {/* Hero Header */}
      <section className="relative w-full bg-gradient-to-b from-[#E8F8EE] via-[#FAFDFB] to-[#F7F7F2] border-b border-[#D1E7D8] py-14 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#A2E4B8] text-[#00A86B] text-xs font-bold uppercase tracking-wider mb-4 shadow-2xs">
            <FileText className="w-4 h-4" />
            <span>Marketplace Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-extrabold text-[#0A504A] tracking-tight">
            Terms of Service
          </h1>
          <p className="mt-4 text-sm sm:text-base text-[#0A504A]/75 max-w-2xl mx-auto leading-relaxed">
            Please read these terms and conditions carefully before using the Zevo marketplace platform, services, and associated mobile solutions.
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
        {/* Core Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-[#E8F8EE] border border-[#A2E4B8] text-[#00A86B] flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[#0A504A]">Verified Quality</h3>
            <p className="text-xs text-[#0A504A]/70 mt-1 leading-relaxed">
              Every seller and food artisan on Zevo is verified for food safety and authenticity standards.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-[#E8F8EE] border border-[#A2E4B8] text-[#00A86B] flex items-center justify-center mb-3">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[#0A504A]">30-Day Returns</h3>
            <p className="text-xs text-[#0A504A]/70 mt-1 leading-relaxed">
              Hassle-free return policy on eligible non-perishables and immediate replacement on produce.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-[#E8F8EE] border border-[#A2E4B8] text-[#00A86B] flex items-center justify-center mb-3">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[#0A504A]">Transparent Pricing</h3>
            <p className="text-xs text-[#0A504A]/70 mt-1 leading-relaxed">
              Clear item costs, taxes, and shipping rates displayed with zero hidden fees at checkout.
            </p>
          </div>
        </div>

        {/* Legal Text Clauses */}
        <div className="bg-white rounded-3xl border border-[#D1E7D8] p-6 sm:p-10 shadow-sm space-y-8">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold font-serif text-[#0A504A] flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#E8F8EE] text-[#00A86B] font-mono text-xs flex items-center justify-center font-bold">1</span>
              <span>Acceptance of Terms & Eligibility</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#0A504A]/80 leading-relaxed">
              By accessing, browsing, registering for, or making purchases on the Zevo marketplace (the &ldquo;Platform&rdquo;), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree to these terms, you must refrain from using the platform. You must be at least 18 years of age or possess legal parental consent to create an account.
            </p>
          </section>

          <hr className="border-[#E8F8EE]" />

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold font-serif text-[#0A504A] flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#E8F8EE] text-[#00A86B] font-mono text-xs flex items-center justify-center font-bold">2</span>
              <span>Account Registration & Security</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#0A504A]/80 leading-relaxed">
              When creating an account, you agree to provide truthful, accurate, and current information. You are solely responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. Zevo operates role-based access for:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-[#0A504A]/80 pl-4 list-disc marker:text-[#00A86B]">
              <li><strong>Customers:</strong> Permitted to browse catalogs, manage wishlists, place orders, and communicate with support.</li>
              <li><strong>Merchants / Sellers:</strong> Bound by merchant agreements to maintain accurate inventory, comply with food hygiene laws, and fulfill orders on time.</li>
              <li><strong>Delivery Agents / Riders:</strong> Bound by rider codes of conduct, traffic regulations, and food handling standards during transport.</li>
            </ul>
          </section>

          <hr className="border-[#E8F8EE]" />

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold font-serif text-[#0A504A] flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#E8F8EE] text-[#00A86B] font-mono text-xs flex items-center justify-center font-bold">3</span>
              <span>Orders, Pricing & Payments</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#0A504A]/80 leading-relaxed">
              All prices displayed on the platform are in USD ($) unless explicitly specified otherwise. Prices include item base costs and applicable sales taxes. Shipping fees are calculated dynamically based on package weight, volume, and distance from the fulfilling merchant. Payment must be authorized in full before an order is confirmed for fulfillment.
            </p>
          </section>

          <hr className="border-[#E8F8EE]" />

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold font-serif text-[#0A504A] flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#E8F8EE] text-[#00A86B] font-mono text-xs flex items-center justify-center font-bold">4</span>
              <span>Delivery & Real-Time Telemetry</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#0A504A]/80 leading-relaxed">
              Delivery timelines are estimates provided based on traffic conditions and merchant preparation speeds. While Zevo coordinates with dedicated couriers to achieve 30-to-45-minute delivery for express orders, unforeseen weather or traffic events may cause delays. Real-time GPS telemetry is provided for order tracking transparency.
            </p>
          </section>

          <hr className="border-[#E8F8EE]" />

          {/* Section 5 - Returns & Guarantee Anchor */}
          <section id="returns" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-bold font-serif text-[#0A504A] flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#E8F8EE] text-[#00A86B] font-mono text-xs flex items-center justify-center font-bold">5</span>
              <span>Returns, Refunds & Freshness Guarantee</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#0A504A]/80 leading-relaxed">
              We stand behind every item ordered through Zevo:
            </p>
            <div className="space-y-2.5 text-xs sm:text-sm text-[#0A504A]/80">
              <div className="p-3.5 rounded-2xl bg-[#E8F8EE]/70 border border-[#A2E4B8] flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#00A86B] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#0A504A]">30-Day Non-Perishable Returns:</strong>
                  <p className="text-[#0A504A]/75 text-xs mt-0.5">
                    Unopened pantry goods, packaged artisan supplies, and lifestyle merchandise in original packaging can be returned within 30 days of delivery.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#E8F8EE]/70 border border-[#A2E4B8] flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#00A86B] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#0A504A]">Freshness Guarantee on Produce & Groceries:</strong>
                  <p className="text-[#0A504A]/75 text-xs mt-0.5">
                    If organic fruits, vegetables, or dairy arrive damaged or substandard, report it within 24 hours via live chat or order history for an immediate instant replacement or wallet refund.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <hr className="border-[#E8F8EE]" />

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold font-serif text-[#0A504A] flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#E8F8EE] text-[#00A86B] font-mono text-xs flex items-center justify-center font-bold">6</span>
              <span>Prohibited Activities & Marketplace Integrity</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#0A504A]/80 leading-relaxed">
              Users agree not to engage in fraudulent transactions, abusive reviews, harassment of delivery riders, unlawful distribution of copyrighted materials, or unauthorized attempts to probe, reverse-engineer, or exploit the Zevo platform infrastructure. Violations result in immediate permanent account suspension and possible legal action.
            </p>
          </section>

          <hr className="border-[#E8F8EE]" />

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold font-serif text-[#0A504A] flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#E8F8EE] text-[#00A86B] font-mono text-xs flex items-center justify-center font-bold">7</span>
              <span>Dispute Resolution & Contact</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#0A504A]/80 leading-relaxed">
              Any dispute or claim arising out of your use of Zevo shall first be submitted to our dedicated Concierge Dispute Mediation team for informal resolution. For inquiries regarding these terms:
            </p>
            <div className="p-4 rounded-2xl bg-[#E8F8EE] border border-[#A2E4B8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-bold text-[#0A504A]">ZEVO Legal & Compliance Division</p>
                <p className="text-[#0A504A]/70">Email: legal@zevo.com • Support: 24/7 Concierge Chat</p>
              </div>
              <Link
                href="/chat"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00A86B] hover:bg-[#0A504A] text-white font-bold transition-all shrink-0 shadow-xs"
              >
                <span>Contact Legal Support</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
