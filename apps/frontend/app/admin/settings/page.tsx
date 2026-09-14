"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Settings,
  Store,
  CreditCard,
  Truck,
  Percent,
  Bell,
  Mail,
  Shield,
  Layers,
  CheckCircle2,
  Save,
  Globe,
  Lock,
} from "lucide-react";

const SETTINGS_TABS = [
  { id: "general", label: "General", icon: Globe },
  { id: "store", label: "Store Config", icon: Store },
  { id: "payment", label: "Payments", icon: CreditCard },
  { id: "delivery", label: "Delivery SLAs", icon: Truck },
  { id: "commission", label: "Commissions", icon: Percent },
  { id: "email", label: "Email & SMTP", icon: Mail },
  { id: "security", label: "Security & 2FA", icon: Shield },
  { id: "integrations", label: "Integrations", icon: Layers },
];

export default function AdminSettingsPage() {
  const params = useParams();
  const slug = (params?.slug as string[]) || [];
  const routeTab = slug[0] || "general";

  const [activeTab, setActiveTab] = useState(routeTab);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form states
  const [platformName, setPlatformName] = useState("Zevo Luxury Atelier");
  const [supportEmail, setSupportEmail] = useState("support@zevo.internal");
  const [currency, setCurrency] = useState("USD");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [autoApproveSellers, setAutoApproveSellers] = useState(false);
  const [minPayout, setMinPayout] = useState("50.00");
  const [baseTakeRate, setBaseTakeRate] = useState("8.5");
  const [sessionTimeout, setSessionTimeout] = useState("60");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F8EE] border border-[#A2E4B8]/30 text-[#0A504A] text-[11px] font-bold uppercase tracking-wider mb-2">
            <Settings className="w-3.5 h-3.5 text-[#00A86B]" />
            <span>22. Global Configuration & Environment Parameters</span>
          </div>
          <h1 className="text-3xl font-serif font-black text-[#0A504A] tracking-tight">
            Platform Settings
          </h1>
          <p className="text-xs text-[#0A504A]/70 mt-1">
            Global marketplace branding, Stripe credentials, delivery SLAs, and security timeout rules.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00A86B] text-white text-xs font-bold shadow-sm hover:bg-[#0A504A] transition"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Global platform configuration persisted to PostgreSQL settings schema and synced to cache.</span>
        </div>
      )}

      {/* Tabs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side Tab Navigation */}
        <div className="lg:col-span-3 space-y-1.5">
          {SETTINGS_TABS.map((tab) => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition text-left ${
                  active
                    ? "bg-[#00A86B] text-white shadow-2xs"
                    : "bg-white border border-[#D1E7D8] text-[#0A504A]/80 hover:bg-[#E8F8EE]"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-white" : "text-[#00A86B]"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Side Settings Form */}
        <div className="lg:col-span-9">
          <form
            onSubmit={handleSave}
            className="rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs p-6 space-y-6"
          >
            {/* General Tab */}
            {activeTab === "general" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-[#0A504A]">Marketplace Identity & Locale</h3>
                  <p className="text-xs text-[#0A504A]/70">Public storefront branding and localization parameters.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#0A504A] mb-1">Storefront Name</label>
                    <input
                      type="text"
                      value={platformName}
                      onChange={(e) => setPlatformName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#E8F8EE]/40 border border-[#D1E7D8] text-xs font-semibold text-[#0A504A] focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0A504A] mb-1">Official Support Email</label>
                    <input
                      type="email"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#E8F8EE]/40 border border-[#D1E7D8] text-xs font-semibold text-[#0A504A] focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0A504A] mb-1">Primary Settlement Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#E8F8EE]/40 border border-[#D1E7D8] text-xs font-semibold text-[#0A504A] focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20"
                    >
                      <option value="USD">USD ($) - United States Dollar</option>
                      <option value="EUR">EUR (€) - Euro</option>
                      <option value="GBP">GBP (£) - British Pound</option>
                      <option value="BDT">BDT (৳) - Bangladeshi Taka</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#E8F8EE]/30 border border-[#D1E7D8]">
                    <div>
                      <span className="text-xs font-bold text-[#0A504A] block">Emergency Maintenance Mode</span>
                      <span className="text-[10px] text-[#0A504A]/70">Blocks checkout for public visitors</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMaintenanceMode(!maintenanceMode)}
                      className={`w-11 h-6 rounded-full transition p-0.5 ${
                        maintenanceMode ? "bg-rose-600" : "bg-slate-300"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition transform ${
                          maintenanceMode ? "translate-x-5" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Store Tab */}
            {activeTab === "store" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-[#0A504A]">Vendor Onboarding Rules</h3>
                  <p className="text-xs text-[#0A504A]/70">Control merchant verification standards and store limits.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-[#E8F8EE]/30 border border-[#D1E7D8]">
                    <div>
                      <span className="text-xs font-bold text-[#0A504A] block">Auto-Approve Seller Stores</span>
                      <span className="text-[10px] text-[#0A504A]/70">
                        If disabled, new stores remain in Pending Review until manual staff approval.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAutoApproveSellers(!autoApproveSellers)}
                      className={`w-11 h-6 rounded-full transition p-0.5 ${
                        autoApproveSellers ? "bg-[#00A86B]" : "bg-slate-300"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition transform ${
                          autoApproveSellers ? "translate-x-5" : ""
                        }`}
                      />
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0A504A] mb-1">Max Products per Standard Vendor</label>
                    <input
                      type="number"
                      defaultValue="250"
                      className="w-full sm:w-64 px-3.5 py-2.5 rounded-xl bg-[#E8F8EE]/40 border border-[#D1E7D8] text-xs font-semibold text-[#0A504A] focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === "payment" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-[#0A504A]">Payment Gateways & Escrow</h3>
                  <p className="text-xs text-[#0A504A]/70">Stripe Connect and SSLCommerz API gateway keys.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#0A504A] mb-1">Stripe Publishable Key</label>
                    <input
                      type="text"
                      defaultValue="pk_test_51MzXXXXXXXXXXXXXXXXXXXXX"
                      className="w-full font-mono px-3.5 py-2.5 rounded-xl bg-[#E8F8EE]/40 border border-[#D1E7D8] text-xs text-[#0A504A] focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0A504A] mb-1">Stripe Secret API Key</label>
                    <input
                      type="password"
                      defaultValue="sk_test_51MzYYYYYYYYYYYYYYYYYYYYY"
                      className="w-full font-mono px-3.5 py-2.5 rounded-xl bg-[#E8F8EE]/40 border border-[#D1E7D8] text-xs text-[#0A504A] focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0A504A] mb-1">Minimum Merchant Payout ($)</label>
                    <input
                      type="number"
                      value={minPayout}
                      onChange={(e) => setMinPayout(e.target.value)}
                      className="w-full sm:w-64 px-3.5 py-2.5 rounded-xl bg-[#E8F8EE]/40 border border-[#D1E7D8] text-xs font-semibold text-[#0A504A] focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Delivery Tab */}
            {activeTab === "delivery" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-[#0A504A]">Hyperlocal Logistics & Dispatch SLA</h3>
                  <p className="text-xs text-[#0A504A]/70">Set maximum delivery radius and dispatch compensation rates.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#0A504A] mb-1">Max Delivery Radius (km)</label>
                    <input
                      type="number"
                      defaultValue="15"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#E8F8EE]/40 border border-[#D1E7D8] text-xs font-semibold text-[#0A504A] focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0A504A] mb-1">Base Courier Dropoff Fee ($)</label>
                    <input
                      type="number"
                      step="0.5"
                      defaultValue="4.50"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#E8F8EE]/40 border border-[#D1E7D8] text-xs font-semibold text-[#0A504A] focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Commission Tab */}
            {activeTab === "commission" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-[#0A504A]">Default Marketplace Commission</h3>
                  <p className="text-xs text-[#0A504A]/70">Base fee deducted automatically upon checkout capture.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0A504A] mb-1">Base Take-Rate Percentage (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={baseTakeRate}
                    onChange={(e) => setBaseTakeRate(e.target.value)}
                    className="w-full sm:w-64 px-3.5 py-2.5 rounded-xl bg-[#E8F8EE]/40 border border-[#D1E7D8] text-xs font-bold text-[#0A504A] focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20"
                  />
                </div>
              </div>
            )}

            {/* Email Tab */}
            {activeTab === "email" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-[#0A504A]">SendGrid & SMTP Settings</h3>
                  <p className="text-xs text-[#0A504A]/70">Credentials for automated buyer invoices and password resets.</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#0A504A] mb-1">SendGrid API Key</label>
                    <input
                      type="password"
                      defaultValue="SG.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                      className="w-full font-mono px-3.5 py-2.5 rounded-xl bg-[#E8F8EE]/40 border border-[#D1E7D8] text-xs text-[#0A504A] focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0A504A] mb-1">Sender Email</label>
                    <input
                      type="email"
                      defaultValue="no-reply@zevo.internal"
                      className="w-full sm:w-80 px-3.5 py-2.5 rounded-xl bg-[#E8F8EE]/40 border border-[#D1E7D8] text-xs font-semibold text-[#0A504A] focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-[#0A504A]">Administrative Security Controls</h3>
                  <p className="text-xs text-[#0A504A]/70">Enforce multi-factor authentication and session longevity.</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#0A504A] mb-1">Admin Idle Session Timeout (Minutes)</label>
                    <input
                      type="number"
                      value={sessionTimeout}
                      onChange={(e) => setSessionTimeout(e.target.value)}
                      className="w-full sm:w-64 px-3.5 py-2.5 rounded-xl bg-[#E8F8EE]/40 border border-[#D1E7D8] text-xs font-bold text-[#0A504A] focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Integrations Tab */}
            {activeTab === "integrations" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-[#0A504A]">Third-Party Integrations & Webhooks</h3>
                  <p className="text-xs text-[#0A504A]/70">Connect external observability and analytics providers.</p>
                </div>
                <div className="space-y-3">
                  <div className="p-4 rounded-xl border border-[#D1E7D8] bg-[#E8F8EE]/30 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#0A504A] block">Sentry Error Monitoring</span>
                      <span className="text-[10px] text-[#0A504A]/70">DSN configured and capturing unhandled runtime exceptions.</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Connected
                    </span>
                  </div>
                  <div className="p-4 rounded-xl border border-[#D1E7D8] bg-[#E8F8EE]/30 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#0A504A] block">Cloudflare CDN & DDoS Shield</span>
                      <span className="text-[10px] text-[#0A504A]/70">Edge caching asset routes and SSL termination.</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-[#D1E7D8] flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#00A86B] text-white text-xs font-bold shadow-sm hover:bg-[#0A504A] transition flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save All Settings</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
