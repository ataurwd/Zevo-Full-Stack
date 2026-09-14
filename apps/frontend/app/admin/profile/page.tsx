"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  UserCircle,
  Shield,
  Key,
  History,
  CheckCircle2,
  Lock,
  Smartphone,
  Save,
  LogOut,
  Mail,
  User,
} from "lucide-react";

const PROFILE_TABS = [
  { id: "profile", label: "Profile Overview" },
  { id: "edit", label: "Edit Account" },
  { id: "security", label: "Security & 2FA" },
  { id: "activity", label: "Recent Activity" },
];

export default function AdminProfilePage() {
  const params = useParams();
  const slug = (params?.slug as string[]) || [];
  const routeTab = slug[0] || "profile";

  const [activeTab, setActiveTab] = useState(routeTab);
  const [name, setName] = useState("Alex Vance");
  const [email, setEmail] = useState("alex@nexora.internal");
  const [title, setTitle] = useState("Chief Marketplace Administrator");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Security password state
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdFeedback, setPwdFeedback] = useState<string | null>(null);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      setPwdFeedback("New passwords do not match.");
      return;
    }
    setPwdFeedback("Password updated successfully.");
    setCurrentPwd("");
    setNewPwd("");
    setConfirmPwd("");
    setTimeout(() => setPwdFeedback(null), 3500);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F8EE] border border-[#A2E4B8]/30 text-[#0A504A] text-[11px] font-bold uppercase tracking-wider mb-2">
            <UserCircle className="w-3.5 h-3.5 text-[#00A86B]" />
            <span>23. Administrator Identity & Credentials</span>
          </div>
          <h1 className="text-3xl font-serif font-black text-[#0A504A] tracking-tight">
            Admin Profile & Security
          </h1>
          <p className="text-xs text-[#0A504A]/70 mt-1">
            Manage your master administrative credentials, TOTP hardware keys, and active session tokens.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Profile changes saved and propagated to your user session.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#D1E7D8] scrollbar-none">
        {PROFILE_TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                active
                  ? "bg-[#00A86B] text-white shadow-2xs"
                  : "bg-white border border-[#D1E7D8] text-[#0A504A]/70 hover:bg-[#E8F8EE]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Profile Overview */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4 p-6 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-[#00A86B] text-white font-serif text-2xl font-black mx-auto flex items-center justify-center ring-4 ring-[#D1E7D8]">
              AV
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0A504A]">{name}</h3>
              <p className="text-xs text-[#0A504A]/70">{title}</p>
            </div>
            <div className="pt-2">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#E8F8EE] text-[#00A86B]">
                SUPER_ADMIN (Full Platform Authority)
              </span>
            </div>
          </div>

          <div className="md:col-span-8 p-6 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-[#0A504A]">Account Details</h3>
            <div className="divide-y divide-[#D1E7D8]/60 text-xs">
              <div className="py-3 flex justify-between">
                <span className="text-[#0A504A]/70">Full Name:</span>
                <strong className="text-[#0A504A]">{name}</strong>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-[#0A504A]/70">Corporate Email:</span>
                <strong className="text-[#0A504A]">{email}</strong>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-[#0A504A]/70">Two-Factor Authentication:</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Enforced (TOTP)</span>
                </span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-[#0A504A]/70">Primary Location:</span>
                <strong className="text-[#0A504A]">Headquarters (New York, US)</strong>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-[#0A504A]/70">Role Assigned By:</span>
                <strong className="text-[#0A504A]">System Provisioning (Oct 2025)</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Edit Profile */}
      {activeTab === "edit" && (
        <form
          onSubmit={handleUpdateProfile}
          className="rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs p-6 max-w-xl space-y-4"
        >
          <h3 className="text-base font-bold text-[#0A504A]">Edit Administrator Identity</h3>

          <div>
            <label className="block text-xs font-bold text-[#0A504A] mb-1">Full Legal Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#E8F8EE]/40 border border-[#D1E7D8] text-xs font-bold text-[#0A504A] focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0A504A] mb-1">Corporate Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#E8F8EE]/40 border border-[#D1E7D8] text-xs font-bold text-[#0A504A] focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0A504A] mb-1">Designation Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#E8F8EE]/40 border border-[#D1E7D8] text-xs font-bold text-[#0A504A] focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#00A86B] text-white text-xs font-bold shadow-sm hover:bg-[#0A504A] transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Update Profile</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Security & 2FA */}
      {activeTab === "security" && (
        <div className="space-y-6 max-w-2xl">
          {pwdFeedback && (
            <div
              className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                pwdFeedback.includes("match")
                  ? "bg-rose-50 text-rose-800 border border-rose-200"
                  : "bg-emerald-50 text-emerald-800 border border-emerald-200"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{pwdFeedback}</span>
            </div>
          )}

          <form
            onSubmit={handleUpdatePassword}
            className="rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs p-6 space-y-4"
          >
            <h3 className="text-base font-bold text-[#0A504A]">Change Account Password</h3>

            <div>
              <label className="block text-xs font-bold text-[#0A504A] mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#E8F8EE]/40 border border-[#D1E7D8] text-xs text-[#0A504A] focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A504A] mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#E8F8EE]/40 border border-[#D1E7D8] text-xs text-[#0A504A] focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A504A] mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#E8F8EE]/40 border border-[#D1E7D8] text-xs text-[#0A504A] focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#00A86B] text-white text-xs font-bold shadow-sm hover:bg-[#0A504A] transition"
              >
                Update Password
              </button>
            </div>
          </form>

          <div className="rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs p-6 space-y-3">
            <h3 className="text-base font-bold text-[#0A504A]">Two-Factor Authenticator (TOTP)</h3>
            <p className="text-xs text-[#0A504A]/70">
              Hardware 2FA with Google Authenticator or 1Password is currently active on your account.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Enforced for all admin sessions</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Recent Activity */}
      {activeTab === "activity" && (
        <div className="rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs p-6 space-y-4">
          <h3 className="text-base font-bold text-[#0A504A]">Your Recent Admin Actions</h3>
          <div className="divide-y divide-[#D1E7D8]/60 text-xs">
            {[
              { action: "Authorized withdrawal payout for Modernist Footwear ($2,340.00)", time: "1 hour ago", ip: "192.168.1.42" },
              { action: "Updated Global Commission Rates in Platform Settings", time: "3 hours ago", ip: "192.168.1.42" },
              { action: "Purged Redis primary cache keys cluster", time: "Yesterday at 4:15 PM", ip: "192.168.1.42" },
              { action: "Successful 2FA login session initiated", time: "Yesterday at 9:00 AM", ip: "192.168.1.42" },
            ].map((act, i) => (
              <div key={i} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-[#0A504A] block">{act.action}</span>
                  <span className="text-[10px] text-[#0A504A]/70 font-mono">IP: {act.ip}</span>
                </div>
                <span className="text-[#0A504A]/70 text-[11px]">{act.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
