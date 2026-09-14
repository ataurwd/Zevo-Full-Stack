"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { ZevoLogo } from "../branding/ZevoLogo";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Store,
  Building2,
  Package,
  Layers,
  Box,
  ShoppingCart,
  CreditCard,
  Percent,
  Wallet,
  Truck,
  Star,
  Tag,
  Bell,
  Headphones,
  FileSpreadsheet,
  ShieldAlert,
  History,
  Cpu,
  Settings,
  UserCircle,
  Search,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  LogOut,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export interface AdminNavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeColor?: string;
  subRoutes?: { label: string; href: string }[];
}

export interface AdminNavGroup {
  groupTitle: string;
  items: AdminNavItem[];
}


export const SUPPORT_NAV_GROUPS: AdminNavGroup[] = [
  {
    groupTitle: "01. Support Operations",
    items: [
      {
        id: "dashboard",
        label: "Support Overview",
        href: "/admin",
        icon: LayoutDashboard,
      },
      {
        id: "chat",
        label: "Live Support Chat",
        href: "/admin/chat",
        icon: Headphones,
        badge: "Live",
        badgeColor: "bg-[#00A86B] text-white",
      },
      {
        id: "orders",
        label: "Orders & Fulfillment",
        href: "/admin/orders",
        icon: ShoppingCart,
        badge: "Telemetry",
        badgeColor: "bg-[#00A86B] text-white",
        subRoutes: [
          { label: "All Orders", href: "/admin/orders" },
          { label: "Pending", href: "/admin/orders/pending" },
          { label: "Confirmed", href: "/admin/orders/confirmed" },
          { label: "Preparing", href: "/admin/orders/preparing" },
          { label: "Ready for Courier", href: "/admin/orders/ready_for_pickup" },
          { label: "Completed", href: "/admin/orders/completed" },
        ],
      },
      {
        id: "delivery",
        label: "Courier Allocation",
        href: "/admin/delivery",
        icon: Truck,
        subRoutes: [
          { label: "Fleet Agents", href: "/admin/delivery/agents" },
          { label: "Delivery Tasks", href: "/admin/delivery/tasks" },
        ],
      },
    ],
  },
];

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    groupTitle: "01. Overview & Intelligence",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
      },
      {
        id: "analytics",
        label: "Analytics",
        href: "/admin/analytics",
        icon: BarChart3,
        subRoutes: [
          { label: "Revenue", href: "/admin/analytics/revenue" },
          { label: "Orders", href: "/admin/analytics/orders" },
          { label: "Products", href: "/admin/analytics/products" },
          { label: "Customers", href: "/admin/analytics/customers" },
          { label: "Merchants", href: "/admin/analytics/sellers" },
          { label: "Delivery", href: "/admin/analytics/delivery" },
        ],
      },
      {
        id: "reports",
        label: "Reports",
        href: "/admin/reports",
        icon: FileSpreadsheet,
        subRoutes: [
          { label: "Sales", href: "/admin/reports/sales" },
          { label: "Orders", href: "/admin/reports/orders" },
          { label: "Products", href: "/admin/reports/products" },
          { label: "Financial", href: "/admin/reports/financial" },
        ],
      },
    ],
  },
  {
    groupTitle: "02. Core Marketplace",
    items: [
      {
        id: "users",
        label: "Users",
        href: "/admin/users",
        icon: Users,
        badge: "2,847",
        subRoutes: [
          { label: "All Users", href: "/admin/users" },
          { label: "Create User", href: "/admin/users/create" },
        ],
      },
      {
        id: "sellers",
        label: "Merchants",
        href: "/admin/sellers",
        icon: Store,
        badge: "4 new",
        badgeColor: "bg-[#00A86B] text-white",
        subRoutes: [
          { label: "Pending", href: "/admin/sellers/pending" },
          { label: "Active", href: "/admin/sellers/active" },
          { label: "Suspended", href: "/admin/sellers/suspended" },
        ],
      },
      {
        id: "stores",
        label: "Stores",
        href: "/admin/stores",
        icon: Building2,
        subRoutes: [
          { label: "Active Stores", href: "/admin/stores/active" },
          { label: "Pending Approval", href: "/admin/stores/pending" },
          { label: "Suspended", href: "/admin/stores/suspended" },
        ],
      },
      {
        id: "products",
        label: "Products",
        href: "/admin/products",
        icon: Package,
        subRoutes: [
          { label: "All Products", href: "/admin/products" },
          { label: "Pending Review", href: "/admin/products/pending" },
          { label: "Active", href: "/admin/products/active" },
          { label: "Draft", href: "/admin/products/draft" },
          { label: "Rejected", href: "/admin/products/rejected" },
        ],
      },
      {
        id: "categories",
        label: "Categories",
        href: "/admin/categories",
        icon: Layers,
        subRoutes: [
          { label: "Category Tree", href: "/admin/categories" },
          { label: "Create Category", href: "/admin/categories/create" },
        ],
      },
      {
        id: "inventory",
        label: "Inventory",
        href: "/admin/inventory",
        icon: Box,
        badge: "3 low",
        badgeColor: "bg-rose-500 text-white",
        subRoutes: [
          { label: "Stock Overview", href: "/admin/inventory" },
          { label: "Low Stock", href: "/admin/inventory/low-stock" },
          { label: "Out of Stock", href: "/admin/inventory/out-of-stock" },
          { label: "Transactions", href: "/admin/inventory/transactions" },
        ],
      },
      {
        id: "orders",
        label: "Orders",
        href: "/admin/orders",
        icon: ShoppingCart,
        badge: "48",
        badgeColor: "bg-[#00A86B] text-white",
        subRoutes: [
          { label: "Pending", href: "/admin/orders/pending" },
          { label: "Confirmed", href: "/admin/orders/confirmed" },
          { label: "Processing", href: "/admin/orders/processing" },
          { label: "Shipped", href: "/admin/orders/shipped" },
          { label: "Delivered", href: "/admin/orders/delivered" },
          { label: "Cancelled", href: "/admin/orders/cancelled" },
        ],
      },
    ],
  },
  {
    groupTitle: "03. Finance & Logistics",
    items: [
      {
        id: "payments",
        label: "Payments",
        href: "/admin/payments",
        icon: CreditCard,
        subRoutes: [
          { label: "Successful", href: "/admin/payments/success" },
          { label: "Pending", href: "/admin/payments/pending" },
          { label: "Failed", href: "/admin/payments/failed" },
          { label: "Refunds", href: "/admin/payments/refunds" },
          { label: "Reconciliation", href: "/admin/payments/reconciliation" },
        ],
      },
      {
        id: "commissions",
        label: "Commissions",
        href: "/admin/commissions",
        icon: Percent,
        subRoutes: [
          { label: "Seller Tiers", href: "/admin/commissions/sellers" },
          { label: "Transactions", href: "/admin/commissions/transactions" },
          { label: "Rates Settings", href: "/admin/commissions/settings" },
        ],
      },
      {
        id: "withdrawals",
        label: "Withdrawals",
        href: "/admin/withdrawals",
        icon: Wallet,
        badge: "6 req",
        badgeColor: "bg-amber-500 text-white",
        subRoutes: [
          { label: "Pending", href: "/admin/withdrawals/pending" },
          { label: "Approved", href: "/admin/withdrawals/approved" },
          { label: "Rejected", href: "/admin/withdrawals/rejected" },
        ],
      },
      {
        id: "delivery",
        label: "Delivery & Fleet",
        href: "/admin/delivery",
        icon: Truck,
        subRoutes: [
          { label: "Fleet Agents", href: "/admin/delivery/agents" },
          { label: "Delivery Tasks", href: "/admin/delivery/tasks" },
          { label: "Live Telemetry", href: "/admin/delivery/live" },
          { label: "Earnings", href: "/admin/delivery/earnings" },
        ],
      },
    ],
  },
  {
    groupTitle: "04. Engagement & Marketing",
    items: [
      {
        id: "reviews",
        label: "Reviews",
        href: "/admin/reviews",
        icon: Star,
        subRoutes: [
          { label: "Pending Moderation", href: "/admin/reviews/pending" },
          { label: "Approved", href: "/admin/reviews/approved" },
          { label: "Reported", href: "/admin/reviews/reported" },
        ],
      },
      {
        id: "coupons",
        label: "Coupons & Promos",
        href: "/admin/coupons",
        icon: Tag,
        subRoutes: [
          { label: "All Coupons", href: "/admin/coupons" },
          { label: "Create Coupon", href: "/admin/coupons/create" },
          { label: "Flash Promotions", href: "/admin/promotions" },
        ],
      },
      {
        id: "notifications",
        label: "Notifications",
        href: "/admin/notifications",
        icon: Bell,
        subRoutes: [
          { label: "Sent Log", href: "/admin/notifications/sent" },
          { label: "Broadcast Alert", href: "/admin/notifications/create" },
          { label: "Templates", href: "/admin/notifications/templates" },
        ],
      },
      {
        id: "support",
        label: "Support & Chat",
        href: "/admin/support",
        icon: Headphones,
        badge: "2 open",
        subRoutes: [
          { label: "Tickets Queue", href: "/admin/support/tickets" },
          { label: "Live Chat Console", href: "/admin/chat" },
        ],
      },
    ],
  },
  {
    groupTitle: "05. Governance & System",
    items: [
      {
        id: "administrators",
        label: "Admin & Roles",
        href: "/admin/administrators",
        icon: ShieldAlert,
        subRoutes: [
          { label: "Admins List", href: "/admin/administrators" },
          { label: "Roles Matrix", href: "/admin/roles" },
          { label: "Permissions", href: "/admin/permissions" },
        ],
      },
      {
        id: "audit-logs",
        label: "Audit Logs",
        href: "/admin/audit-logs",
        icon: History,
        subRoutes: [
          { label: "Admin Actions", href: "/admin/audit-logs/admin" },
          { label: "User Events", href: "/admin/audit-logs/users" },
          { label: "Order Logs", href: "/admin/audit-logs/orders" },
          { label: "Security Logs", href: "/admin/audit-logs/security" },
        ],
      },
      {
        id: "system",
        label: "System Health",
        href: "/admin/system",
        icon: Cpu,
        subRoutes: [
          { label: "Health & Uptime", href: "/admin/system/health" },
          { label: "BullMQ Queues", href: "/admin/system/queues" },
          { label: "Redis Cache", href: "/admin/system/cache" },
          { label: "System Logs", href: "/admin/system/logs" },
        ],
      },
      {
        id: "settings",
        label: "Settings",
        href: "/admin/settings",
        icon: Settings,
        subRoutes: [
          { label: "General", href: "/admin/settings/general" },
          { label: "Store Config", href: "/admin/settings/store" },
          { label: "Payments", href: "/admin/settings/payment" },
          { label: "Delivery SLAs", href: "/admin/settings/delivery" },
          { label: "Commission", href: "/admin/settings/commission" },
          { label: "Integrations", href: "/admin/settings/integrations" },
        ],
      },
      {
        id: "profile",
        label: "Admin Profile",
        href: "/admin/profile",
        icon: UserCircle,
        subRoutes: [
          { label: "Profile Info", href: "/admin/profile" },
          { label: "Security & 2FA", href: "/admin/profile/security" },
          { label: "Activity Trail", href: "/admin/profile/activity" },
        ],
      },
    ],
  },
];

interface AdminDashboardShellProps {
  children: React.ReactNode;
}

export function AdminDashboardShell({ children }: AdminDashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isSupport = user?.role === "SUPPORT";
  const activeNavGroups = isSupport ? SUPPORT_NAV_GROUPS : ADMIN_NAV_GROUPS;

  useEffect(() => {
    if (isSupport) {
      const allowedPaths = ["/admin", "/admin/chat", "/admin/orders", "/admin/delivery", "/admin/profile"];
      const isAllowed = allowedPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));
      if (!isAllowed && pathname.startsWith("/admin")) {
        router.replace("/admin/chat");
      }
    }
  }, [isSupport, pathname, router]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (err) {
      console.warn("Logout error:", err);
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter items if user types in search
  const filteredGroups = activeNavGroups.map((group) => {
    if (!searchQuery.trim()) return group;
    const lower = searchQuery.toLowerCase();
    const matched = group.items.filter(
      (item) =>
        item.label.toLowerCase().includes(lower) ||
        item.subRoutes?.some((s) => s.label.toLowerCase().includes(lower))
    );
    return { ...group, items: matched };
  }).filter((group) => group.items.length > 0);

  // Generate breadcrumb pieces
  const pathParts = pathname.split("/").filter(Boolean);

  if (!user) {
    return null;
  }

  const adminName = `${user.first_name} ${user.last_name || ""}`.trim();
  const adminEmail = user.email;
  const adminInitials = `${user.first_name[0] || "A"}${user.last_name?.[0] || ""}`.toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 text-[#0A504A] flex flex-col selection:bg-[#00A86B] selection:text-white">
      {/* Top Mobile Bar */}
      <header className="lg:hidden bg-[#073A36] text-white border-b border-[#0A504A] px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl bg-[#0A504A] text-[#A2E4B8] border border-[#0A504A] hover:text-white"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity" title="Go to Home">
            <ZevoLogo variant="full" inverted size="sm" badge="ADMIN" />
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-[#0A504A] border border-[#00A86B]/60 text-[10px] font-bold text-[#A2E4B8]">
            {isSupport ? "SUPPORT DESK" : "SUPER ADMIN"}
          </span>
        </div>
      </header>

      <div className="flex-1 flex w-full min-h-screen">
        {/* ====================================================================
            SIDEBAR (Desktop & Mobile Slide-out) - Premium Dark Theme
            ==================================================================== */}
        <aside
          className={`fixed lg:sticky top-0 lg:top-0 h-screen w-72 bg-[#073A36] text-white border-r border-[#0A504A] flex flex-col z-50 transition-transform duration-300 shadow-2xl shrink-0 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          {/* Brand Header */}
          <div className="p-5 border-b border-[#0A504A]/80 flex items-center justify-between bg-[#042321]/90 backdrop-blur-md">
            <Link href="/" className="flex items-center gap-2.5 group" title="Go to Home">
              <ZevoLogo variant="full" inverted size="md" subtitle="Control Center" priority />
            </Link>

            <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-mono font-bold text-white border border-white/20 shadow-xs">
              v2.4
            </span>
          </div>

          {/* Search Nav Input */}
          <div className="p-3 border-b border-[#0A504A]/60 bg-[#042321]/50">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-white/80 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Jump to route / module..."
                className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-[#042321] border border-white/20 text-xs text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-white/80 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Navigation Items (23 Modules in 5 Groups) */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin scrollbar-thumb-[#0A504A] scrollbar-track-transparent">
            {filteredGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-white/70 block mb-2 font-mono">
                  {group.groupTitle}
                </span>

                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(item.href);
                  const isExpanded = expandedItems[item.id] ?? isActive;

                  return (
                    <div key={item.id} className="space-y-0.5">
                      <div
                        className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isActive
                            ? "bg-[#00A86B] text-white font-bold shadow-xs"
                            : "text-white/85 hover:bg-white/10 hover:text-white border border-transparent"
                        }`}
                        onClick={() => {
                          router.push(item.href);
                          if (mobileOpen) setMobileOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-transform ${
                              isActive
                                ? "text-white"
                                : "text-white group-hover:scale-105"
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.badge && (
                            <span
                              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold shadow-xs ${
                                item.badgeColor || (isActive ? "bg-white/20 text-white" : "bg-[#00A86B] text-white border border-white/30")
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}

                          {item.subRoutes && item.subRoutes.length > 0 && (
                            <button
                              onClick={(e) => toggleExpand(item.id, e)}
                              className="p-1 rounded hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-3 h-3 text-white" />
                              ) : (
                                <ChevronRight className="w-3 h-3 text-white/80 group-hover:text-white" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Sub-routes dropdown */}
                      {isExpanded && item.subRoutes && item.subRoutes.length > 0 && (
                        <div className="pl-7 pr-2 py-1 space-y-0.5 border-l-2 border-white/20 ml-5">
                          {item.subRoutes.map((sub, sIdx) => {
                            const isSubActive = pathname === sub.href;
                            return (
                              <Link
                                key={sIdx}
                                href={sub.href}
                                onClick={() => mobileOpen && setMobileOpen(false)}
                                className={`block px-2.5 py-1 rounded-lg text-[11px] transition-colors ${
                                  isSubActive
                                    ? "bg-[#00A86B] text-white font-bold shadow-xs"
                                    : "text-white/80 hover:bg-white/10 hover:text-white font-medium"
                                }`}
                              >
                                {sub.label}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* User Profile Card & Quick Actions */}
          <div className="p-3 border-t border-[#0A504A] bg-[#042321]/95 space-y-2">
            <div className="p-2.5 rounded-2xl bg-[#073A36] border border-white/10 flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#00A86B] text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-md ring-1 ring-white/30">
                  {adminInitials}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">{adminName}</h4>
                  <span className="text-[10px] text-white/70 font-semibold block truncate">
                    {adminEmail}
                  </span>
                </div>
              </div>

              <Link
                href="/admin/profile"
                className="p-1.5 rounded-lg hover:bg-white/10 text-white hover:text-white transition-colors"
                title="Admin Profile"
              >
                <Settings className="w-4 h-4 text-white" />
              </Link>
            </div>

            <div className="flex items-center justify-between px-1 text-[11px]">
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-white hover:underline font-bold transition-colors"
              >
                <span>Storefront</span>
                <ExternalLink className="w-3 h-3 text-white" />
              </Link>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                id="admin-sidebar-signout-btn"
                className="text-rose-300 hover:text-white hover:bg-rose-600/30 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <LogOut className={`w-3 h-3 text-white ${isLoggingOut ? "animate-spin" : ""}`} />
                <span>{isLoggingOut ? "Signing Out..." : "Sign Out"}</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Backdrop */}
        {mobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          />
        )}

        {/* ====================================================================
            MAIN WORKSPACE AREA
            ==================================================================== */}
        <main className="flex-1 flex flex-col min-w-0 w-full bg-slate-50">
          {/* Top Desktop Bar */}
          <div className="hidden lg:flex items-center justify-between px-8 py-3.5 bg-white border-b border-[#D1E7D8] sticky top-0 z-30 shadow-xs w-full">
            {/* Breadcrumb path */}
            <div className="flex items-center gap-2 text-xs font-semibold text-[#0A504A]/70">
              <Link href="/admin" className="hover:text-[#00A86B] transition-colors">
                Admin
              </Link>
              {pathParts.slice(1).map((part, idx) => (
                <React.Fragment key={idx}>
                  <span>/</span>
                  <span className="text-[#0A504A] capitalize font-bold">
                    {part === "sellers" ? "Merchants" : part.replace(/-/g, " ")}
                  </span>
                </React.Fragment>
              ))}
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-4">
              {/* Role Switcher Pills */}
              <div className="flex items-center bg-[#E8F8EE] border border-[#D1E7D8] rounded-full p-0.5 text-xs font-semibold">
                <span className="px-3 py-1 rounded-full bg-[#0A504A] text-white shadow-2xs font-bold">
                  ADMIN
                </span>
                <Link
                  href="/dashboard"
                  className="px-2.5 py-1 text-[#0A504A] hover:text-[#00A86B] transition-colors"
                >
                  SELLER
                </Link>
                <Link
                  href="/delivery/dashboard"
                  className="px-2.5 py-1 text-[#0A504A] hover:text-[#00A86B] transition-colors"
                >
                  RIDER
                </Link>
                <Link
                  href="/products"
                  className="px-2.5 py-1 text-[#0A504A] hover:text-[#00A86B] transition-colors"
                >
                  STORE
                </Link>
              </div>

              {/* Notification Bell */}
              <Link
                href="/admin/notifications"
                className="relative p-2 rounded-xl bg-[#E8F8EE] hover:bg-[#D1E7D8] text-[#0A504A] transition-colors border border-[#D1E7D8]"
                title="Notifications"
              >
                <Bell className="w-4 h-4 text-[#00A86B]" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#00A86B] text-white text-[9px] font-bold flex items-center justify-center">
                  3
                </span>
              </Link>

              {/* Status Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F8EE] border border-[#A2E4B8] text-[#00A86B] text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-[#00A86B] animate-pulse" />
                <span>System Operational</span>
              </div>
            </div>
          </div>

          {/* Child Page Viewport */}
          <div className="flex-1 p-6 sm:p-8 xl:p-10 w-full overflow-y-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
