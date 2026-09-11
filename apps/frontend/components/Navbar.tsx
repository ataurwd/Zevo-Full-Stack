"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../providers/AuthProvider";
import { useCart } from "../providers/CartProvider";
import { ShoppingBag, Store, ShieldCheck, User, LogOut, Package, ShoppingCart, ClipboardList } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount, openDrawer } = useCart();

  const isSeller = user?.role === "SELLER" || user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  return (
    <header className="sticky top-0 z-50 px-6 py-3.5 backdrop-blur-xl bg-white/80 border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center font-black text-lg text-white shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
              N
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900 flex items-center gap-1.5">
              NEXORA
              <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                pathname === "/"
                  ? "bg-blue-50 text-blue-700 border border-blue-200/60"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
              }`}
            >
              Overview
            </Link>

            <Link
              href="/products"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                pathname.startsWith("/products")
                  ? "bg-blue-50 text-blue-700 border border-blue-200/60"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
              <span>Marketplace</span>
            </Link>

            <a
              href="/#features"
              className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 transition-all"
            >
              Features
            </a>

            <a
              href="/#pricing"
              className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 transition-all"
            >
              Pricing
            </a>

            <a
              href="/#insights"
              className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 transition-all"
            >
              Insights
            </a>

            {isAuthenticated && (
              <Link
                href="/orders"
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  pathname.startsWith("/orders")
                    ? "bg-blue-50 text-blue-700 border border-blue-200/60"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5 text-blue-600" />
                <span>My Orders</span>
              </Link>
            )}

            {isSeller && (
              <Link
                href="/seller/dashboard"
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  pathname.startsWith("/seller")
                    ? "bg-blue-50 text-blue-700 border border-blue-200/60"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                }`}
              >
                <Store className="w-3.5 h-3.5 text-blue-600" />
                <span>Seller Portal</span>
              </Link>
            )}

            {isAdmin && (
              <Link
                href="/admin/sellers"
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  pathname.startsWith("/admin")
                    ? "bg-purple-50 text-purple-700 border border-purple-200/60"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>Admin</span>
              </Link>
            )}
          </nav>
        </div>

        {/* User / Actions */}
        <div className="flex items-center gap-3">
          {/* Shopping Cart Drawer Trigger */}
          <button
            onClick={openDrawer}
            className="relative p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 shadow-xs hover:shadow-sm transition-all"
            title="Shopping Cart"
          >
            <ShoppingCart className="w-4 h-4" />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] px-1 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shadow-sm">
                {itemCount}
              </span>
            )}
          </button>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-800">
                  {user.first_name ? `${user.first_name} ${user.last_name || ""}` : user.email}
                </span>
                <span className="text-[10px] uppercase font-mono text-blue-600 font-bold tracking-wider">
                  {user.role}
                </span>
              </div>
              <button
                onClick={() => logout()}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 shadow-xs transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 rounded-full text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-5 py-2 rounded-full text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md shadow-blue-500/25 hover:shadow-blue-500/35"
              >
                Get App
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
