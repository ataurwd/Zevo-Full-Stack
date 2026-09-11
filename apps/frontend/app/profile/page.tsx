"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { ProtectedRoute } from "../../components/auth/ProtectedRoute";
import { useAuth } from "../../hooks/useAuth";
import { updateProfile, changePassword, uploadAvatar } from "../../lib/api/users";
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Camera, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Shield, 
  LogOut 
} from "lucide-react";

export default function ProfilePage() {
  const { user, refreshUser, logout } = useAuth();

  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    phone: user?.phone || "",
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);
    try {
      await updateProfile(profileForm);
      await refreshUser();
      setProfileMsg({ type: "success", text: "Profile details updated successfully!" });
    } catch (err: any) {
      setProfileMsg({ type: "error", text: err?.message || "Failed to update profile." });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordMsg({ type: "error", text: "New passwords do not match." });
      return;
    }
    setPasswordLoading(true);
    setPasswordMsg(null);
    try {
      await changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
      setPasswordMsg({ type: "success", text: "Password changed successfully!" });
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err?.message || "Failed to change password." });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarLoading(true);
    try {
      await uploadAvatar(file);
      await refreshUser();
    } catch (err: any) {
      alert(err?.message || "Failed uploading avatar");
    } finally {
      setAvatarLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#080b12] text-slate-100 py-10 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 mb-8 border-b border-slate-800">
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Account Settings</h1>
              <p className="text-xs text-slate-400 mt-1">Manage your profile, security credentials, and addresses</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/profile/addresses"
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-200 transition-colors flex items-center gap-2"
              >
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                <span>Address Book</span>
              </Link>
              <button
                onClick={() => logout()}
                className="px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-xs font-medium text-rose-400 transition-colors flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Card: Avatar & Summary */}
            <div className="glass-card rounded-2xl p-6 border border-slate-800 h-fit">
              <div className="flex flex-col items-center text-center pb-6 border-b border-slate-800/80">
                <div className="relative mb-4 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-3xl font-black text-white shadow-xl overflow-hidden">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span>{user?.first_name?.[0]?.toUpperCase() || "U"}</span>
                    )}
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    {avatarLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>

                <h2 className="text-lg font-bold text-white">
                  {user?.first_name} {user?.last_name}
                </h2>
                <p className="text-xs text-slate-400 mb-3">{user?.email}</p>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Role: {user?.role}</span>
                </div>
              </div>

              <div className="pt-6 space-y-3 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Email Verification</span>
                  <span className={user?.is_email_verified ? "text-emerald-400 font-medium" : "text-amber-400"}>
                    {user?.is_email_verified ? "Verified" : "Pending"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Account Status</span>
                  <span className={user?.is_active ? "text-emerald-400 font-medium" : "text-rose-400"}>
                    {user?.is_active ? "Active" : "Suspended"}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Profile & Password Forms */}
            <div className="lg:col-span-2 space-y-8">
              {/* Profile Details Form */}
              <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800">
                <h3 className="text-lg font-bold text-white mb-1">Personal Details</h3>
                <p className="text-xs text-slate-400 mb-6">Update your name and primary contact details</p>

                {profileMsg && (
                  <div
                    className={`mb-6 p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                      profileMsg.type === "success"
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                        : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                    }`}
                  >
                    {profileMsg.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{profileMsg.text}</span>
                  </div>
                )}

                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">First Name</label>
                      <input
                        type="text"
                        required
                        value={profileForm.first_name}
                        onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">Last Name</label>
                      <input
                        type="text"
                        required
                        value={profileForm.last_name}
                        onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Phone Number</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        placeholder="+1 234 567 8900"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={profileLoading}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {profileLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Save Changes</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Security Form */}
              <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800">
                <h3 className="text-lg font-bold text-white mb-1">Security & Password</h3>
                <p className="text-xs text-slate-400 mb-6">Ensure your account uses a secure password</p>

                {passwordMsg && (
                  <div
                    className={`mb-6 p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                      passwordMsg.type === "success"
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                        : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                    }`}
                  >
                    {passwordMsg.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{passwordMsg.text}</span>
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Current Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="password"
                        required
                        value={passwordForm.current_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">New Password</label>
                      <input
                        type="password"
                        required
                        value={passwordForm.new_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                        placeholder="Min 8 characters"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">Confirm New Password</label>
                      <input
                        type="password"
                        required
                        value={passwordForm.confirm_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                        placeholder="Repeat new password"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {passwordLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Update Password</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
