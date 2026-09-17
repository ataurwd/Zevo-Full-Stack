"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import {
  ShieldCheck,
  Lock,
  Eye,
  Database,
  UserCheck,
  Cookie,
  Mail,
  ArrowRight,
  CheckCircle2,
  FileText,
  Clock,
  HelpCircle,
} from "lucide-react";

export default function PrivacyPolicyPage() {
  const lastUpdated = "September 17, 2026";

  return (
    <div className="min-h-screen bg-[#F7F7F2] text-[#0A504A] flex flex-col selection:bg-[#00A86B] selection:text-white">
      <Navbar />

      {/* Hero Header */}
      <section className="relative w-full bg-gradient-to-b from-[#E8F8EE] via-[#FAFDFB] to-[#F7F7F2] border-b border-[#D1E7D8] py-14 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#A2E4B8] text-[#00A86B] text-xs font-bold uppercase tracking-wider mb-4 shadow-2xs">
            <ShieldCheck className="w-4 h-4" />
            <span>Privacy & Data Protection</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-extrabold text-[#0A504A] tracking-tight">
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm sm:text-base text-[#0A504A]/75 max-w-2xl mx-auto leading-relaxed">
            Your trust is our highest priority. Learn how Zevo collects, safeguards, encrypts, and handles your personal information across our multi-vendor ecosystem.
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
        {/* Quick Highlights Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-[#E8F8EE] border border-[#A2E4B8] text-[#00A86B] flex items-center justify-center mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[#0A504A]">Encrypted & Secure</h3>
            <p className="text-xs text-[#0A504A]/70 mt-1 leading-relaxed">
              All payment details and credentials use 256-bit TLS encryption. We never store raw card numbers.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-[#E8F8EE] border border-[#A2E4B8] text-[#00A86B] flex items-center justify-center mb-3">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[#0A504A]">Never Sold</h3>
            <p className="text-xs text-[#0A504A]/70 mt-1 leading-relaxed">
              We never sell your personal contact information, browsing habits, or order history to data brokers.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-[#E8F8EE] border border-[#A2E4B8] text-[#00A86B] flex items-center justify-center mb-3">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[#0A504A]">User In Control</h3>
            <p className="text-xs text-[#0A504A]/70 mt-1 leading-relaxed">
              You retain the right to access, export, update, or permanently delete your profile data at any time.
            </p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="bg-white rounded-3xl border border-[#D1E7D8] p-6 sm:p-10 shadow-sm space-y-8">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold font-serif text-[#0A504A] flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#E8F8EE] text-[#00A86B] font-mono text-xs flex items-center justify-center font-bold">1</span>
              <span>Information We Collect</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#0A504A]/80 leading-relaxed">
              When you interact with the Zevo platform (via website, mobile portals, or partner integrations), we collect information necessary to fulfill orders, process payments, and ensure smooth logistics:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-[#0A504A]/80 pl-4 list-disc marker:text-[#00A86B]">
              <li>
                <strong>Identity & Contact Information:</strong> Your full name, email address, contact phone number, and account credentials.
              </li>
              <li>
                <strong>Delivery & Geolocation Coordinates:</strong> Shipping addresses, delivery notes, and approximate device GPS telemetry during live order dispatch for accurate drop-offs.
              </li>
              <li>
                <strong>Transaction & Billing Data:</strong> Order records, transaction IDs, and payment tokens securely tokenized via PCI-DSS certified payment processors (such as Stripe).
              </li>
              <li>
                <strong>Merchant & Rider Information:</strong> Business registration numbers, storefront details, payout bank account information, vehicle details, and identity documents for seller and rider verification.
              </li>
            </ul>
          </section>

          <hr className="border-[#E8F8EE]" />

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold font-serif text-[#0A504A] flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#E8F8EE] text-[#00A86B] font-mono text-xs flex items-center justify-center font-bold">2</span>
              <span>How We Use Your Data</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#0A504A]/80 leading-relaxed">
              We process personal data strictly in accordance with applicable privacy laws and for legitimate commerce purposes:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-[#F7F7F2] border border-[#D1E7D8]/60 text-xs">
                <strong className="text-[#0A504A] block mb-0.5">Order Fulfillment:</strong>
                Transmitting delivery addresses and cart items to sellers for packaging and riders for route optimization.
              </div>
              <div className="p-3.5 rounded-xl bg-[#F7F7F2] border border-[#D1E7D8]/60 text-xs">
                <strong className="text-[#0A504A] block mb-0.5">Live Order Telemetry:</strong>
                Real-time WebSocket alerts on order acceptance, dispatch milestones, and GPS rider progress.
              </div>
              <div className="p-3.5 rounded-xl bg-[#F7F7F2] border border-[#D1E7D8]/60 text-xs">
                <strong className="text-[#0A504A] block mb-0.5">Customer Care & Support:</strong>
                Assisting via live concierge chat, resolving disputes, and processing instant refunds or replacements.
              </div>
              <div className="p-3.5 rounded-xl bg-[#F7F7F2] border border-[#D1E7D8]/60 text-xs">
                <strong className="text-[#0A504A] block mb-0.5">Fraud Prevention:</strong>
                Safeguarding accounts against unauthorized intrusions, automated attacks, and chargeback disputes.
              </div>
            </div>
          </section>

          <hr className="border-[#E8F8EE]" />

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold font-serif text-[#0A504A] flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#E8F8EE] text-[#00A86B] font-mono text-xs flex items-center justify-center font-bold">3</span>
              <span>Data Sharing & Third Parties</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#0A504A]/80 leading-relaxed">
              We only share necessary portions of your data with verified third parties strictly involved in fulfilling your transaction:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-[#0A504A]/80 pl-4 list-disc marker:text-[#00A86B]">
              <li>
                <strong>Marketplace Merchants:</strong> Store owners receive order details and customer names to prepare products.
              </li>
              <li>
                <strong>Delivery Agents:</strong> Assigned riders receive the recipient&apos;s name, phone number, and delivery coordinates until the delivery is marked completed.
              </li>
              <li>
                <strong>Payment Gateways:</strong> Encrypted financial transactions are routed directly through PCI-compliant gateways.
              </li>
              <li>
                <strong>Legal Authorities:</strong> Only when strictly required by enforceable statutory law, court subpoenas, or emergency public safety.
              </li>
            </ul>
          </section>

          <hr className="border-[#E8F8EE]" />

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold font-serif text-[#0A504A] flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#E8F8EE] text-[#00A86B] font-mono text-xs flex items-center justify-center font-bold">4</span>
              <span>Cookies & Tracking Technologies</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#0A504A]/80 leading-relaxed">
              We use functional session cookies and local storage tokens to maintain your authentication state across browser tabs, store guest cart items, and record preference settings. You can manage or clear cookies through your browser settings or via our dedicated Cookie Policy.
            </p>
          </section>

          <hr className="border-[#E8F8EE]" />

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold font-serif text-[#0A504A] flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#E8F8EE] text-[#00A86B] font-mono text-xs flex items-center justify-center font-bold">5</span>
              <span>Your Privacy Rights</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#0A504A]/80 leading-relaxed">
              Depending on your jurisdiction, you are entitled to exercise the following rights regarding your personal information:
            </p>
            <ul className="space-y-1.5 text-xs sm:text-sm text-[#0A504A]/80 pl-4 list-disc marker:text-[#00A86B]">
              <li>Request an export copy of all personal data held about you.</li>
              <li>Correct incomplete, inaccurate, or outdated profile information.</li>
              <li>Request permanent deletion of your account and personal identifiers.</li>
              <li>Opt-out of promotional newsletters and marketing communications with 1-click.</li>
            </ul>
          </section>

          <hr className="border-[#E8F8EE]" />

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold font-serif text-[#0A504A] flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#E8F8EE] text-[#00A86B] font-mono text-xs flex items-center justify-center font-bold">6</span>
              <span>Contact Data Protection Team</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#0A504A]/80 leading-relaxed">
              If you have any questions, concerns, or requests regarding this Privacy Policy, please contact our Data Protection Officer:
            </p>
            <div className="p-4 rounded-2xl bg-[#E8F8EE] border border-[#A2E4B8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-bold text-[#0A504A]">ZEVO Data Protection Office</p>
                <p className="text-[#0A504A]/70">Email: privacy@zevo.com • Support: Live 24/7 Concierge Chat</p>
              </div>
              <Link
                href="/chat"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00A86B] hover:bg-[#0A504A] text-white font-bold transition-all shrink-0 shadow-xs"
              >
                <span>Live Chat Concierge</span>
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
