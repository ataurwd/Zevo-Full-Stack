"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../providers/AuthProvider";
import { useCart } from "../providers/CartProvider";
import { ZevoLogo } from "./branding/ZevoLogo";
import { CategoryMegaMenu } from "./categories/CategoryMegaMenu";
import {
  ShoppingBag,
  Store,
  ShieldCheck,
  User,
  LogOut,
  Package,
  ShoppingCart,
  ClipboardList,
  Bike,
  MessageSquare,
  LayoutDashboard,
  LayoutGrid,
  ChevronDown,
} from "lucide-react";
import { NotificationBell } from "./notifications/NotificationBell";

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount, openDrawer } = useCart();

  const isSeller = user?.role === "SELLER";
  const isRider = user?.role === "DELIVERY_AGENT";
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  const userPortalHref = isAdmin
    ? "/admin"
    : isSeller
    ? "/dashboard"
    : isRider
    ? "/delivery/dashboard"
    : "/orders";

  const [isCategoryMegaOpen, setIsCategoryMegaOpen] = useState(false);
  const megaMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleOpenMegaMenu = () => {
    if (megaMenuTimeoutRef.current) {
      clearTimeout(megaMenuTimeoutRef.current);
      megaMenuTimeoutRef.current = null;
    }
    setIsCategoryMegaOpen(true);
  };

  const handleCloseMegaMenu = () => {
    if (megaMenuTimeoutRef.current) {
      clearTimeout(megaMenuTimeoutRef.current);
    }
    megaMenuTimeoutRef.current = setTimeout(() => {
      setIsCategoryMegaOpen(false);
    }, 180);
  };

  const handleImmediateCloseMegaMenu = () => {
    if (megaMenuTimeoutRef.current) {
      clearTimeout(megaMenuTimeoutRef.current);
      megaMenuTimeoutRef.current = null;
    }
    setIsCategoryMegaOpen(false);
  };

  useEffect(() => {
    handleImmediateCloseMegaMenu();
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (megaMenuTimeoutRef.current) {
        clearTimeout(megaMenuTimeoutRef.current);
      }
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/95 border-b border-[#D1E7D8] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-1.5 group">
            <ZevoLogo size="md" priority />
            <span className="h-2 w-2 rounded-full bg-[#00A86B] animate-pulse ml-0.5"></span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                pathname === "/"
                  ? "bg-[#E8F8EE] text-[#0A504A] border border-[#A2E4B8] font-bold"
                  : "text-[#0A504A]/75 hover:text-[#0A504A] hover:bg-[#E8F8EE]"
              }`}
            >
              Overview
            </Link>

            <Link
              href="/products"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                pathname.startsWith("/products") || pathname.startsWith("/shop")
                  ? "bg-[#E8F8EE] text-[#0A504A] border border-[#A2E4B8] font-bold"
                  : "text-[#0A504A]/75 hover:text-[#0A504A] hover:bg-[#E8F8EE]"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#00A86B]" />
              <span>Shop</span>
            </Link>

            {/* Categories Mega Menu Trigger (Hover to open, mouseleave to auto-hide) */}
            <div
              className="relative inline-flex items-center"
              onMouseEnter={handleOpenMegaMenu}
              onMouseLeave={handleCloseMegaMenu}
            >
              <button
                type="button"
                onClick={() => setIsCategoryMegaOpen(!isCategoryMegaOpen)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  isCategoryMegaOpen
                    ? "bg-[#0A504A] text-white shadow-md shadow-[#0A504A]/30 border border-[#0A504A]"
                    : "text-[#0A504A]/75 hover:text-[#0A504A] hover:bg-[#E8F8EE]"
                }`}
                title="Browse Categories"
              >
                <LayoutGrid className={`w-3.5 h-3.5 ${isCategoryMegaOpen ? "text-[#A2E4B8]" : "text-[#00A86B]"}`} />
                <span>Categories</span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-200 ${
                    isCategoryMegaOpen ? "rotate-180 text-[#A2E4B8]" : "text-[#0A504A]/60"
                  }`}
                />
              </button>
            </div>

            {/* Role-Specific Portal Link */}
            {isAdmin && (
              <Link
                href="/admin"
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  pathname.startsWith("/admin")
                    ? "bg-[#0A504A] text-white shadow-sm"
                    : "bg-[#00A86B] text-white hover:bg-[#0A504A] shadow-sm"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Portal</span>
              </Link>
            )}

            {isSeller && (
              <Link
                href="/dashboard"
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  pathname.startsWith("/dashboard") || pathname.startsWith("/seller")
                    ? "bg-[#E8F8EE] text-[#0A504A] border border-[#A2E4B8] font-bold"
                    : "text-[#0A504A]/75 hover:text-[#0A504A] hover:bg-[#E8F8EE]"
                }`}
              >
                <Store className="w-3.5 h-3.5 text-[#00A86B]" />
                <span>Seller Portal</span>
              </Link>
            )}

            {isRider && (
              <Link
                href="/delivery/dashboard"
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  pathname.startsWith("/delivery")
                    ? "bg-[#E8F8EE] text-[#0A504A] border border-[#A2E4B8] font-bold"
                    : "text-[#0A504A]/75 hover:text-[#0A504A] hover:bg-[#E8F8EE]"
                }`}
              >
                <Bike className="w-3.5 h-3.5 text-[#00A86B]" />
                <span>Rider Dispatch</span>
              </Link>
            )}

            {isAuthenticated && !isAdmin && (
              <>
                <Link
                  href="/orders"
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    pathname.startsWith("/orders")
                      ? "bg-[#E8F8EE] text-[#0A504A] border border-[#A2E4B8] font-bold"
                      : "text-[#0A504A]/75 hover:text-[#0A504A] hover:bg-[#E8F8EE]"
                  }`}
                >
                  <ClipboardList className="w-3.5 h-3.5 text-[#00A86B]" />
                  <span>My Orders</span>
                </Link>
                <Link
                  href="/chat"
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    pathname.startsWith("/chat")
                      ? "bg-[#E8F8EE] text-[#0A504A] border border-[#A2E4B8] font-bold"
                      : "text-[#0A504A]/75 hover:text-[#0A504A] hover:bg-[#E8F8EE]"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#00A86B]" />
                  <span>Chat</span>
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* User / Actions */}
        <div className="flex items-center gap-2.5">
          {/* Mobile Categories Button */}
          <button
            type="button"
            onClick={() => setIsCategoryMegaOpen(!isCategoryMegaOpen)}
            className={`md:hidden p-2 rounded-xl border text-[#0A504A] transition-all cursor-pointer ${
              isCategoryMegaOpen
                ? "bg-[#0A504A] text-white border-[#0A504A]"
                : "bg-white border-[#D1E7D8] hover:text-[#00A86B] hover:border-[#A2E4B8] shadow-xs"
            }`}
            title="Browse Categories"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>

          {/* Notification Bell */}
          {isAuthenticated && <NotificationBell />}

          {/* Shopping Cart Drawer Trigger */}
          <button
            onClick={openDrawer}
            className="relative p-2.5 rounded-xl bg-white border border-[#D1E7D8] text-[#0A504A] hover:text-[#00A86B] hover:border-[#A2E4B8] shadow-xs hover:shadow-md transition-all cursor-pointer group"
            title={`Shopping Cart (${itemCount} items)`}
            aria-label={`Shopping Cart with ${itemCount} items`}
          >
            <ShoppingCart className="w-4 h-4 group-hover:scale-110 transition-transform" />
            {itemCount > 0 && (
              <span
                key={itemCount}
                className="absolute -top-1.5 -right-2 min-w-[20px] h-5 px-1 rounded-full bg-[#00A86B] text-white font-black text-[11px] flex items-center justify-center shadow-md ring-2 ring-white"
              >
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </button>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <Link
                href={userPortalHref}
                className="hidden sm:flex flex-col text-right hover:opacity-80 transition-opacity"
                title={`Open ${user.role} Portal`}
              >
                <span className="text-xs font-semibold text-[#0A504A]">
                  {user.first_name ? `${user.first_name} ${user.last_name || ""}` : user.email}
                </span>
                <span className="text-[10px] uppercase font-mono text-[#00A86B] font-bold tracking-wider">
                  {user.role}
                </span>
              </Link>
              <button
                onClick={() => logout()}
                className="p-2 rounded-xl bg-white border border-[#D1E7D8] text-slate-500 hover:text-rose-600 hover:border-rose-200 shadow-xs transition-colors cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 rounded-full text-xs font-semibold text-[#0A504A] hover:text-[#00A86B] hover:bg-[#E8F8EE] transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-5 py-2 rounded-full text-xs font-semibold bg-[#00A86B] hover:bg-[#0A504A] text-white transition-all shadow-md shadow-[#00A86B]/25 hover:shadow-[#0A504A]/30"
              >
                Get App
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Categories Mega Menu */}
      <CategoryMegaMenu
        isOpen={isCategoryMegaOpen}
        onClose={handleImmediateCloseMegaMenu}
        onMouseEnter={handleOpenMegaMenu}
        onMouseLeave={handleCloseMegaMenu}
      />
    </header>
  );
}
