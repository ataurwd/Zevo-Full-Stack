"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { ZevoLogo, ZevoIcon } from "../branding/ZevoLogo";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Megaphone,
  Percent,
  Store,
  Truck,
  Wallet,
  Settings,
  Headphones,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  Bell,
  LogOut,
  ExternalLink,
  Shield,
  Layers,
  ArrowRight,
  Plus,
  ShoppingBag,
  Loader2,
} from "lucide-react";

// Pixel-perfect Brand SVGs for Apps matching reference image
export function ShopeeLogo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <div className="w-5 h-5 rounded-md bg-[#ee4d2d] text-white flex items-center justify-center font-bold text-[10px] shadow-2xs shrink-0">
      S
    </div>
  );
}

export function TiktokLogo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <div className="w-5 h-5 rounded-md bg-black text-white flex items-center justify-center font-bold text-[10px] shadow-2xs shrink-0">
      <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.47c1.78-1.68 2.37-3.72 2.37-6.55V8.12a8.28 8.28 0 0 0 4.8 1.52V6.69z" />
      </svg>
    </div>
  );
}

export function TokopediaLogo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <div className="w-5 h-5 rounded-md bg-[#03ac0e] text-white flex items-center justify-center font-bold text-[10px] shadow-2xs shrink-0">
      <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current">
        <path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm7 17H5V8h14v12z" />
      </svg>
    </div>
  );
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
}

interface NavSection {
  title: string;
  items: NavItem[];
  isApps?: boolean;
}

interface DashboardShellProps {
  children: React.ReactNode;
  activeRole?: string;
  onRoleChange?: (role: string) => void;
}

export function DashboardShell({
  children,
  activeRole: customRole,
  onRoleChange,
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, isLoading, router, pathname]);

  // Active role can be overridden for preview switching
  const effectiveRole = customRole || user?.role || "SELLER";

  // Build role-based navigation groups exactly matching Saledash spec
  const getNavSections = (): NavSection[] => {
    if (effectiveRole === "ADMIN" || effectiveRole === "SUPER_ADMIN") {
      return [
        {
          title: "Main Menu",
          items: [
            { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
            { label: "Merchants", href: "/admin/sellers", icon: Store, badge: "3 New" },
            { label: "Products", href: "/admin/products", icon: Package, badge: "8" },
            { label: "Costumer", href: "/admin/audit-logs", icon: Users },
            { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
            { label: "Couriers", href: "/admin/riders", icon: Truck },
            { label: "Treasury", href: "/admin/withdrawals", icon: Wallet },
          ],
        },
        {
          title: "Sales Channel",
          items: [
            { label: "Marketplace Front", href: "/products", icon: ExternalLink },
            { label: "Audit & Governance", href: "/admin/audit-logs", icon: Shield },
          ],
        },
        {
          title: "Apps",
          isApps: true,
          items: [
            { label: "Shopee", href: "#shopee", icon: ShopeeLogo },
            { label: "Tiktok", href: "#tiktok", icon: TiktokLogo },
            { label: "Tokopedia", href: "#tokopedia", icon: TokopediaLogo },
          ],
        },
      ];
    }

    if (effectiveRole === "DELIVERY_AGENT") {
      return [
        {
          title: "Main Menu",
          items: [
            { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
            { label: "Dispatch Portal", href: "/delivery/dashboard", icon: Truck, badge: "Active" },
            { label: "Orders", href: "/orders", icon: ShoppingCart, badge: "3" },
            { label: "Costumer", href: "/chat", icon: Users },
            { label: "Analytics", href: "/delivery/dashboard", icon: BarChart3 },
            { label: "Earnings", href: "/delivery/dashboard", icon: Wallet },
          ],
        },
        {
          title: "Sales Channel",
          items: [
            { label: "Courier Hub", href: "/delivery/dashboard", icon: Store },
            { label: "Marketplace", href: "/products", icon: ExternalLink },
          ],
        },
        {
          title: "Apps",
          isApps: true,
          items: [
            { label: "Shopee", href: "#shopee", icon: ShopeeLogo },
            { label: "Tiktok", href: "#tiktok", icon: TiktokLogo },
            { label: "Tokopedia", href: "#tokopedia", icon: TokopediaLogo },
          ],
        },
      ];
    }

    if (effectiveRole === "CUSTOMER") {
      return [
        {
          title: "Main Menu",
          items: [
            { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
            { label: "Orders", href: "/orders", icon: ShoppingCart, badge: "2" },
            { label: "Products", href: "/products", icon: Package },
            { label: "Costumer Support", href: "/chat", icon: Users },
            { label: "Analytics", href: "/dashboard", icon: BarChart3 },
            { label: "Marketing", href: "/products", icon: Megaphone },
            { label: "Discount", href: "/products", icon: Percent },
          ],
        },
        {
          title: "Sales Channel",
          items: [
            { label: "Online store", href: "/products", icon: Store },
            { label: "Point of sale", href: "/cart", icon: ShoppingBag },
          ],
        },
        {
          title: "Apps",
          isApps: true,
          items: [
            { label: "Shopee", href: "#shopee", icon: ShopeeLogo },
            { label: "Tiktok", href: "#tiktok", icon: TiktokLogo },
            { label: "Tokopedia", href: "#tokopedia", icon: TokopediaLogo },
          ],
        },
      ];
    }

    // Default: SELLER / Merchant Navigation (100% faithful to reference image)
    return [
      {
        title: "Main Menu",
        items: [
          { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
          { label: "Orders", href: "/seller/orders", icon: ShoppingCart, badge: "10" },
          { label: "Products", href: "/seller/products", icon: Package },
          { label: "Inventory", href: "/seller/inventory", icon: Layers },
          { label: "Customer", href: "/chat", icon: Users },
          { label: "Analytics", href: "/seller/analytics", icon: BarChart3 },
          { label: "Marketing", href: "/seller/coupons", icon: Megaphone },
          { label: "Discount", href: "/seller/coupons", icon: Percent },
        ],
      },
      {
        title: "Sales Channel",
        items: [
          { label: "Online store", href: "/seller/store/settings", icon: Store },
          { label: "Payouts", href: "/seller/withdrawals", icon: Wallet },
          { label: "Point of sale", href: "/seller/products", icon: ShoppingBag },
        ],
      },
      {
        title: "Apps",
        isApps: true,
        items: [
          { label: "Shopee", href: "#shopee", icon: ShopeeLogo },
          { label: "Tiktok", href: "#tiktok", icon: TiktokLogo },
          { label: "Tokopedia", href: "#tokopedia", icon: TokopediaLogo },
        ],
      },
    ];
  };

  const navSections = getNavSections();

  // Dynamic greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#073A36] text-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#00A86B]" />
        <p className="text-xs font-mono text-emerald-200">Authenticating session...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const displayName = `${user.first_name} ${user.last_name || ""}`.trim();

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-50 flex text-[#0A504A] font-sans antialiased selection:bg-[#E8F8EE] selection:text-[#0A504A]">
      {/* ======================================================== */}
      {/* 1. LEFT COLLAPSIBLE SIDEBAR                             */}
      {/* ======================================================== */}
      <aside
        className={`bg-[#073A36] text-white border-r border-[#0A504A] shrink-0 transition-all duration-300 flex flex-col justify-between z-30 shadow-2xl ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        <div>
          {/* Brand Header & Collapse Chevron */}
          <div
            className={`h-20 flex border-b border-[#0A504A]/80 bg-[#042321]/80 backdrop-blur-md transition-all duration-300 ${
              collapsed
                ? "flex-col items-center justify-center gap-1.5 px-2 py-2"
                : "flex-row items-center justify-between px-6"
            }`}
          >
            <Link href="/" className="flex items-center gap-3 overflow-hidden group min-w-0" title="Go to Home">
              {collapsed ? (
                <ZevoIcon size="sm" inverted priority />
              ) : (
                <ZevoLogo variant="full" inverted size="md" subtitle="Merchant Hub" priority />
              )}
            </Link>

            {/* Collapse Toggle Chevron Circle */}
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className={`rounded-full bg-[#0A504A] hover:bg-[#00A86B] text-white flex items-center justify-center transition-colors border border-white/20 shadow-sm cursor-pointer shrink-0 ${
                collapsed ? "w-5 h-5" : "w-7 h-7"
              }`}
              title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {collapsed ? (
                <ChevronRight className="w-2.5 h-2.5" />
              ) : (
                <ChevronLeft className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Navigation Sections */}
          <div className={collapsed ? "py-3 px-1 space-y-5 overflow-y-auto max-h-[calc(100vh-160px)] scrollbar-thin scrollbar-thumb-[#0A504A] scrollbar-track-transparent" : "p-3.5 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)] scrollbar-thin scrollbar-thumb-[#0A504A] scrollbar-track-transparent"}>
            {navSections.map((section, idx) => (
              <div key={idx} className="space-y-1">
                {!collapsed && (
                  <p className="px-3 text-[11px] font-bold text-white/70 mb-2 font-mono uppercase tracking-wider">
                    {section.title}
                  </p>
                )}
                {section.items.map((item, itemIdx) => {
                  const isActive =
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(item.href) && item.href !== "#";

                  return (
                    <Link
                      key={itemIdx}
                      href={item.href}
                      className={
                        collapsed
                          ? `flex items-center justify-center w-10 h-10 mx-auto rounded-xl transition-all group ${
                              isActive
                                ? "bg-[#00A86B] text-white shadow-md shadow-[#00A86B]/30"
                                : "text-white/70 hover:text-white hover:bg-white/10"
                            }`
                          : `flex items-center gap-3 px-3 py-2 rounded-2xl text-xs font-semibold transition-all group ${
                              isActive
                                ? "bg-[#00A86B] text-white font-bold shadow-xs"
                                : "text-white/85 hover:text-white hover:bg-white/10 border border-transparent"
                            }`
                      }
                      title={collapsed ? item.label : undefined}
                    >
                      <item.icon
                        className={collapsed ? "w-5 h-5 text-white transition-transform group-hover:scale-110" : "w-4 h-4 shrink-0 text-white transition-transform group-hover:scale-105"}
                      />
                      {!collapsed && (
                        <div className="flex-1 flex items-center justify-between">
                          <span className="truncate">{item.label}</span>
                          {item.badge && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-[#00A86B] text-white border border-white/30"}`}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  );
                })}

                {/* + Add apps link for Apps section */}
                {section.isApps && !collapsed && (
                  <button
                    type="button"
                    onClick={() => alert("Zevo App Marketplace: Additional integration adapters can be configured from Settings.")}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-white/80 hover:text-white transition-colors mt-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-white" />
                    <span>Add apps</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Bottom Indicator */}
        <div className="p-3.5 border-t border-[#0A504A] bg-[#042321]/90">
          {!collapsed ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#A2E4B8] animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-white">
                  {effectiveRole} Mode
                </span>
              </div>
              <Link
                href="/products"
                className="text-[11px] font-semibold text-[#A2E4B8] hover:text-white flex items-center gap-1 transition-colors"
              >
                Store <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="flex justify-center">
              <span className="w-2 h-2 rounded-full bg-[#A2E4B8]" />
            </div>
          )}
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 2. MAIN HEADER & BODY WORKSPACE                         */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header Bar */}
        <header className="h-20 bg-white/90 backdrop-blur-md border-b border-[#D1E7D8] px-6 sm:px-10 flex items-center justify-between sticky top-0 z-20">
          {/* Greeting Headline */}
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-[#0A504A] tracking-tight flex items-center gap-2">
              <span>
                {getGreeting()}, {displayName}!
              </span>
            </h1>
            <p className="text-xs text-[#0A504A]/70 font-medium hidden sm:block">
              Here&apos;s what&apos;s happening with your store today
            </p>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Interactive 1-Click Role Switcher Pill for instant verification */}
            <div className="hidden lg:flex items-center p-1 bg-[#E8F8EE] rounded-2xl border border-[#D1E7D8] text-[11px] font-bold text-slate-600">
              {["CUSTOMER", "SELLER", "DELIVERY_AGENT", "ADMIN"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => onRoleChange?.(r)}
                  className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                    effectiveRole === r
                      ? "bg-[#0A504A] text-white shadow-2xs font-extrabold"
                      : "hover:text-[#0A504A] hover:bg-white text-slate-600"
                  }`}
                >
                  {r === "CUSTOMER"
                    ? "Customer"
                    : r === "SELLER"
                    ? "Merchant"
                    : r === "DELIVERY_AGENT"
                    ? "Rider"
                    : "Admin"}
                </button>
              ))}
            </div>

            {/* Contact Support Pill Button */}
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("open_support_chat"));
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#E8F8EE] hover:bg-[#A2E4B8]/40 border border-[#A2E4B8] text-xs font-bold text-[#0A504A] transition-all cursor-pointer shadow-2xs"
              title="Contact Admin & Support Desk"
            >
              <Headphones className="w-3.5 h-3.5 text-[#00A86B]" />
              <span className="hidden sm:inline">Contact Support</span>
            </button>
            {/* Date Pill Widget matching reference */}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-[#D1E7D8] text-xs font-semibold text-[#0A504A] shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-[#00A86B]" />
              <span>{todayFormatted}</span>
            </div>

            {/* Notification Bell with Badge 7 matching reference */}
            <Link
              href="/chat"
              className="w-10 h-10 rounded-2xl bg-white hover:bg-[#E8F8EE] border border-[#D1E7D8] flex items-center justify-center text-[#0A504A] relative shadow-2xs transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#00A86B] text-white text-[9px] font-black flex items-center justify-center border-2 border-white">
                7
              </span>
            </Link>

            {/* User Profile Avatar with Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-2xl bg-white hover:bg-[#E8F8EE] border border-[#D1E7D8] shadow-2xs transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-[#0A504A] text-white flex items-center justify-center font-bold text-xs">
                  {displayName.charAt(0)}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#00A86B]" />
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-[#D1E7D8] shadow-xl p-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-[#D1E7D8] mb-1">
                    <p className="text-xs font-bold text-[#0A504A]">{displayName}</p>
                    <p className="text-[11px] text-[#0A504A]/70 truncate">
                      {user?.email || `${effectiveRole.toLowerCase()}@zevo.com`}
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-[#E8F8EE] text-[#00A86B] border border-[#A2E4B8]">
                      {effectiveRole}
                    </span>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#0A504A] hover:bg-[#E8F8EE] transition-colors"
                  >
                    <Users className="w-3.5 h-3.5 text-[#00A86B]" />
                    <span>My Profile</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      if (typeof window !== "undefined") {
                        window.dispatchEvent(new CustomEvent("open_support_chat"));
                      }
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#0A504A] hover:bg-[#E8F8EE] transition-colors text-left cursor-pointer"
                  >
                    <Headphones className="w-3.5 h-3.5 text-[#00A86B]" />
                    <span>Contact Support</span>
                  </button>
                  <Link
                    href="/seller/store/settings"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#0A504A] hover:bg-[#E8F8EE] transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-[#00A86B]" />
                    <span>Store Settings</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                      router.push("/login");
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Dynamic Canvas Content */}
        <main className="flex-1 p-6 sm:p-10 space-y-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
