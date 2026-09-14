"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../hooks/useAuth";
import { registerUser } from "../../../lib/api/auth";
import { ZevoLogo } from "../../../components/branding/ZevoLogo";
import { AuthIllustrationEcosystem } from "../../../components/auth/AuthIllustrationEcosystem";
import {
  Lock,
  Mail,
  User,
  Phone,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  ShoppingBag,
  Store,
  Bike,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, login } = useAuth();
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    role: "CUSTOMER" as "CUSTOMER" | "SELLER" | "DELIVERY_AGENT",
  });
  const [businessName, setBusinessName] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("Dhaka");
  const [deliveryZones, setDeliveryZones] = useState<string[]>([
    "Dhaka North",
    "Gulshan",
    "Banani",
    "Uttara",
    "Dhanmondi",
  ]);
  const [customZone, setCustomZone] = useState("");
  const [vehicleType, setVehicleType] = useState<"motorcycle" | "scooter" | "bicycle" | "car">("motorcycle");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Authenticated user guard: Redirect away if already logged in
  React.useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
        router.replace("/admin");
      } else if (user.role === "SELLER") {
        router.replace("/dashboard");
      } else if (user.role === "DELIVERY_AGENT") {
        router.replace("/delivery/dashboard");
      } else {
        router.replace("/");
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      setError("Please agree to the Terms of Service to proceed.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await registerUser({
        ...formData,
        ...(formData.role === "SELLER"
          ? {
              business_name: businessName.trim() || `${formData.first_name} Store`,
            }
          : {}),
        ...(formData.role === "DELIVERY_AGENT"
          ? {
              delivery_zones: deliveryZones,
              service_city: deliveryCity,
              vehicle_type: vehicleType,
              vehicle_number: vehicleNumber || "DHAKA-METRO-HA-" + Math.floor(1000 + Math.random() * 9000),
              license_number: licenseNumber || "LIC-BD-" + Math.floor(100000 + Math.random() * 900000),
            }
          : {}),
      });

      if (formData.role === "SELLER") {
        try {
          await login({ email: formData.email, password: formData.password });
          router.push("/seller/pending-approval");
          return;
        } catch {
          setSuccess(true);
        }
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please check your information and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || (isAuthenticated && user)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#F7F7F2]">
        <div className="p-8 rounded-3xl bg-white border border-[#D1E7D8] shadow-sm flex flex-col items-center gap-4 text-center max-w-sm w-full animate-fade-in">
          <div className="w-12 h-12 rounded-2xl bg-[#00A86B] text-white flex items-center justify-center shadow-md shadow-[#00A86B]/30">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <h3 className="text-base font-serif font-bold text-[#0A504A]">
              {isAuthenticated ? "Session Active" : "Verifying session..."}
            </h3>
            <p className="text-xs text-[#0A504A]/70 mt-1 leading-relaxed">
              {isAuthenticated
                ? "You are already logged in. Redirecting to your dashboard..."
                : "Please wait while we authenticate your session."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-10 bg-[#F7F7F2] relative overflow-hidden">
      {/* Decorative Dashed Background Curves */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-40 select-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M -50,160 Q 300,80 600,220 T 1200,120 T 1700,280"
          fill="none"
          stroke="#A2E4B8"
          strokeWidth="3"
          strokeDasharray="10 12"
          strokeLinecap="round"
        />
        <path
          d="M 120,780 Q 450,620 850,740 T 1450,660 T 1950,800"
          fill="none"
          stroke="#00A86B"
          strokeWidth="3"
          strokeDasharray="12 14"
          strokeLinecap="round"
        />
      </svg>

      {/* Main Dual-Panel Auth Card */}
      <div className="w-full max-w-5xl rounded-[2rem] sm:rounded-[2.5rem] bg-white/95 backdrop-blur-2xl border border-[#D1E7D8] shadow-[0_25px_70px_-15px_rgba(0,168,107,0.12)] overflow-hidden z-10 grid grid-cols-1 md:grid-cols-12 transition-all">
        
        {/* LEFT PANEL: Ecosystem & Logistics Illustration */}
        <div className="md:col-span-5 lg:col-span-5 bg-gradient-to-br from-[#E8F8EE] via-white/80 to-[#F7F7F2] relative flex flex-col justify-between p-6 sm:p-8 md:p-10 border-b md:border-b-0 md:border-r border-[#D1E7D8] overflow-hidden">
          {/* Top Category Badge */}
          <div className="flex items-center justify-between z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F8EE] border border-[#A2E4B8] text-[#0A504A] text-xs font-semibold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#00A86B]" />
              <span>Join ZEVO</span>
            </div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#00A86B] bg-[#E8F8EE] border border-[#D1E7D8] px-2.5 py-0.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-[#00A86B] animate-pulse" />
              <span>Zero Setup Fee</span>
            </div>
          </div>

          {/* Central Bespoke SVG Ecosystem Illustration */}
          <div className="my-auto py-4 sm:py-6 relative flex items-center justify-center">
            <AuthIllustrationEcosystem className="max-w-[390px] max-h-[350px]" />
          </div>

          {/* Bottom Trust & Feature Copy */}
          <div className="z-10 mt-2">
            <h2 className="text-xl font-black text-[#0A504A] tracking-tight leading-snug">
              Grow your business with <br />
              <span className="text-[#00A86B]">hyperlocal fulfillment</span>
            </h2>
            <p className="text-xs text-[#0A504A]/70 mt-1.5 leading-relaxed">
              Whether you are shopping, selling as an independent retailer, or delivering orders, ZEVO powers seamless commerce.
            </p>

            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-[#D1E7D8] text-center">
              <div className="p-2 rounded-xl bg-white/80 border border-[#D1E7D8]">
                <div className="text-xs font-bold text-[#0A504A]">150+</div>
                <div className="text-[10px] text-[#0A504A]/70">Local Stores</div>
              </div>
              <div className="p-2 rounded-xl bg-white/80 border border-[#D1E7D8]">
                <div className="text-xs font-bold text-[#0A504A]">15 Min</div>
                <div className="text-[10px] text-[#0A504A]/70">Avg Delivery</div>
              </div>
              <div className="p-2 rounded-xl bg-white/80 border border-[#D1E7D8]">
                <div className="text-xs font-bold text-[#0A504A]">Instant</div>
                <div className="text-[10px] text-[#0A504A]/70">Payouts</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Crisp Form & Role Selection */}
        <div className="md:col-span-7 lg:col-span-7 p-6 sm:p-10 md:p-12 flex flex-col justify-center bg-white">
          
          {/* Logo & Heading */}
          <div className="mb-6">
            <div className="mb-3">
              <ZevoLogo variant="full" size="lg" subtitle="Logistics & Retail" href="/" priority />
            </div>

            <h1 className="text-2xl font-extrabold text-[#0A504A] tracking-tight">
              Create an Account
            </h1>
            <p className="text-xs text-[#0A504A]/70 mt-1">
              Select your role and create your credentials to get started.
            </p>
          </div>

          {success ? (
            <div className="text-center py-8 px-4 rounded-2xl bg-emerald-50/50 border border-emerald-200">
              {formData.role === "SELLER" ? (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20 animate-in zoom-in">
                    <Store className="w-7 h-7" />
                  </div>
                  <h2 className="text-xl font-bold text-[#0A504A] mb-2">Merchant Application Submitted!</h2>
                  <p className="text-xs text-[#0A504A]/70 max-w-md mx-auto mb-6 leading-relaxed">
                    Your merchant application has been submitted and is currently under administrative review. Once approved by our administration team, your store and merchant dashboard will be activated.
                  </p>
                  <Link
                    href="/login?redirect=/seller/pending-approval"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#00A86B] hover:bg-[#0A504A] text-white font-bold text-xs transition-all shadow-md shadow-[#00A86B]/25"
                  >
                    <span>Sign In & Check Application Status</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-[#00A86B] text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#00A86B]/20 animate-in zoom-in">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h2 className="text-xl font-bold text-[#0A504A] mb-2">Account Created Successfully!</h2>
                  <p className="text-xs text-[#0A504A]/70 max-w-md mx-auto mb-6 leading-relaxed">
                    We sent a confirmation link to <span className="text-[#00A86B] font-bold">{formData.email}</span>. Click the link to activate your account and start using ZEVO.
                  </p>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#00A86B] hover:bg-[#0A504A] text-white font-bold text-xs transition-all shadow-md shadow-[#00A86B]/25"
                  >
                    <span>Proceed to Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </>
              )}
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Account Type / Role Selector Tabs */}
                <div>
                  <label className="block text-xs font-semibold text-[#0A504A] mb-1.5">
                    Select Account Role
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "CUSTOMER", label: "Customer", icon: ShoppingBag },
                      { id: "SELLER", label: "Merchant", icon: Store },
                      { id: "DELIVERY_AGENT", label: "Rider", icon: Bike },
                    ].map((role) => {
                      const Icon = role.icon;
                      const isSelected = formData.role === role.id;
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, role: role.id as any })}
                          className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? "bg-[#00A86B] border-[#00A86B] text-white shadow-sm shadow-[#00A86B]/30"
                              : "bg-[#E8F8EE] hover:bg-[#D1E7D8] border-[#D1E7D8] text-[#0A504A]"
                          }`}
                        >
                          <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-[#00A86B]"}`} />
                          <span>{role.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Name Grid (First & Last) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#0A504A] mb-1.5" htmlFor="reg-first-name">
                      First Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#00A86B] absolute left-3.5 top-3.5" />
                      <input
                        id="reg-first-name"
                        type="text"
                        required
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        placeholder="John"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F7F7F2] hover:bg-white focus:bg-white border border-[#D1E7D8] text-sm text-[#0A504A] placeholder:text-[#0A504A]/50 focus:outline-none focus:border-[#00A86B] focus:ring-2 focus:ring-[#A2E4B8]/20 shadow-2xs transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0A504A] mb-1.5" htmlFor="reg-last-name">
                      Last Name
                    </label>
                    <input
                      id="reg-last-name"
                      type="text"
                      required
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      placeholder="Doe"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F7F7F2] hover:bg-white focus:bg-white border border-[#D1E7D8] text-sm text-[#0A504A] placeholder:text-[#0A504A]/50 focus:outline-none focus:border-[#00A86B] focus:ring-2 focus:ring-[#A2E4B8]/20 shadow-2xs transition-all"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-semibold text-[#0A504A] mb-1.5" htmlFor="reg-email">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#00A86B] absolute left-3.5 top-3.5" />
                    <input
                      id="reg-email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F7F7F2] hover:bg-white focus:bg-white border border-[#D1E7D8] text-sm text-[#0A504A] placeholder:text-[#0A504A]/50 focus:outline-none focus:border-[#00A86B] focus:ring-2 focus:ring-[#A2E4B8]/20 shadow-2xs transition-all"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-semibold text-[#0A504A] mb-1.5" htmlFor="reg-phone">
                    Phone Number (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#00A86B] absolute left-3.5 top-3.5" />
                    <input
                      id="reg-phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F7F7F2] hover:bg-white focus:bg-white border border-[#D1E7D8] text-sm text-[#0A504A] placeholder:text-[#0A504A]/50 focus:outline-none focus:border-[#00A86B] focus:ring-2 focus:ring-[#A2E4B8]/20 shadow-2xs transition-all"
                    />
                  </div>
                </div>

                {/* Merchant Specific: Store & Business Details */}
                {formData.role === "SELLER" && (
                  <div className="p-4 rounded-2xl bg-[#E8F8EE]/80 border border-[#00A86B]/30 space-y-3 animate-fade-in">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-[#00A86B]" />
                      <h4 className="font-black text-xs text-[#0A504A] uppercase tracking-wider">
                        Merchant Store & Business Details
                      </h4>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#0A504A] mb-1">
                        Store / Business Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required={formData.role === "SELLER"}
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="e.g. Apex Styles, Matra Leather & Crafts"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A] focus:outline-none focus:border-[#00A86B] font-medium"
                      />
                      <p className="text-[10px] text-[#0A504A]/70 mt-1 leading-relaxed">
                        Upon registration, your merchant account will be placed under administrative review. Once approved by our team, your seller dashboard will be unlocked.
                      </p>
                    </div>
                  </div>
                )}

                {/* Rider Specific: Delivery Location & Vehicle Setup */}
                {formData.role === "DELIVERY_AGENT" && (
                  <div className="p-4 rounded-2xl bg-[#E8F8EE]/70 border border-[#00A86B]/30 space-y-3.5 animate-fade-in">
                    <div className="flex items-center gap-2">
                      <Bike className="w-4 h-4 text-[#00A86B]" />
                      <h4 className="font-black text-xs text-[#0A504A] uppercase tracking-wider">
                        Rider Delivery Location & Fleet Details
                      </h4>
                    </div>

                    {/* Primary City */}
                    <div>
                      <label className="block text-[11px] font-bold text-[#0A504A] mb-1">
                        Primary Delivery City
                      </label>
                      <input
                        type="text"
                        value={deliveryCity}
                        onChange={(e) => setDeliveryCity(e.target.value)}
                        placeholder="e.g. Dhaka, Chittagong"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A] focus:outline-none focus:border-[#00A86B]"
                      />
                    </div>

                    {/* Serviceable Delivery Zones */}
                    <div>
                      <label className="block text-[11px] font-bold text-[#0A504A] mb-1">
                        Serviceable Delivery Zones (Where you can deliver)
                      </label>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {[
                          "Dhaka North",
                          "Dhaka South",
                          "Gulshan",
                          "Banani",
                          "Uttara",
                          "Dhanmondi",
                          "Mirpur",
                          "Mohakhali",
                          "Badda",
                          "Chittagong",
                          "Sylhet",
                        ].map((z) => {
                          const isSelected = deliveryZones.includes(z);
                          return (
                            <button
                              key={z}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setDeliveryZones(deliveryZones.filter((zone) => zone !== z));
                                } else {
                                  setDeliveryZones([...deliveryZones, z]);
                                }
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-[#00A86B] text-white shadow-2xs"
                                  : "bg-white text-[#0A504A] border border-[#D1E7D8] hover:bg-[#D1E7D8]"
                              }`}
                            >
                              {isSelected ? "✓ " : "+ "}
                              {z}
                            </button>
                          );
                        })}
                      </div>

                      {/* Custom Zone Adder */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customZone}
                          onChange={(e) => setCustomZone(e.target.value)}
                          placeholder="Add custom zone or area name..."
                          className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-[#D1E7D8] text-xs text-[#0A504A] focus:outline-none focus:border-[#00A86B]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (customZone.trim() && !deliveryZones.includes(customZone.trim())) {
                              setDeliveryZones([...deliveryZones, customZone.trim()]);
                              setCustomZone("");
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#00A86B] text-white text-xs font-bold hover:bg-[#008f5b] cursor-pointer"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Vehicle Type & Plate Number */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-[#0A504A] mb-1">
                          Vehicle Type
                        </label>
                        <select
                          value={vehicleType}
                          onChange={(e) => setVehicleType(e.target.value as any)}
                          className="w-full px-2.5 py-2 rounded-xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A] focus:outline-none focus:border-[#00A86B]"
                        >
                          <option value="motorcycle">Motorcycle</option>
                          <option value="scooter">Scooter</option>
                          <option value="bicycle">Bicycle</option>
                          <option value="car">Car</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#0A504A] mb-1">
                          Vehicle Number / Plate
                        </label>
                        <input
                          type="text"
                          value={vehicleNumber}
                          onChange={(e) => setVehicleNumber(e.target.value)}
                          placeholder="DHAKA-METRO-HA-1234"
                          className="w-full px-2.5 py-2 rounded-xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A] focus:outline-none focus:border-[#00A86B]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#0A504A] mb-1">
                        Driving License Number
                      </label>
                      <input
                        type="text"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        placeholder="LIC-BD-998877"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A] focus:outline-none focus:border-[#00A86B]"
                      />
                    </div>
                  </div>
                )}

                {/* Password with Eye toggle */}
                <div>
                  <label className="block text-xs font-semibold text-[#0A504A] mb-1.5" htmlFor="reg-password">
                    Password (Min 8 characters)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#00A86B] absolute left-3.5 top-3.5" />
                    <input
                      id="reg-password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-[#F7F7F2] hover:bg-white focus:bg-white border border-[#D1E7D8] text-sm text-[#0A504A] placeholder:text-[#0A504A]/50 focus:outline-none focus:border-[#00A86B] focus:ring-2 focus:ring-[#A2E4B8]/20 shadow-2xs transition-all"
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

                {/* Terms of Service Checkbox */}
                <div className="pt-1">
                  <label className="inline-flex items-start gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded text-[#00A86B] border-[#D1E7D8] focus:ring-[#A2E4B8] cursor-pointer"
                    />
                    <span className="text-xs text-[#0A504A] leading-tight">
                      I agree to the{" "}
                      <Link href="/terms" className="text-[#00A86B] hover:underline font-medium">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-[#00A86B] hover:underline font-medium">
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                </div>

                {/* SIGNATURE PILL SUBMIT BUTTON */}
                <div className="pt-2">
                  <button
                    id="reg-submit-btn"
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
                      {loading ? "Creating Account..." : "CREATE ACCOUNT"}
                    </span>
                  </button>
                </div>
              </form>

              {/* Footer Login Link */}
              <div className="mt-6 pt-5 border-t border-[#D1E7D8] text-center">
                <p className="text-xs text-[#0A504A]/70">
                  Already have an account?{" "}
                  <Link href="/login" className="text-[#00A86B] hover:text-[#0A504A] font-extrabold hover:underline">
                    Sign in here
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
