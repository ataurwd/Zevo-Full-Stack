"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../providers/AuthProvider";
import { useCart } from "../providers/CartProvider";
import { ShoppingBag, Store, ShieldCheck, User, LogOut, Package, ShoppingCart } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount, openDrawer } = useCart();

  const isSeller = user?.role === "SELLER" || user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-6 py-3.5 backdrop-blur-md bg-[#080b12]/80">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center font-black text-lg text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              N
            </div>
            <div className="flex items-center">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                NEXORA
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/products"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                pathname.startsWith("/products")
                  ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/25"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Marketplace</span>
            </Link>

            {isSeller && (
              <>
                <Link
                  href="/seller/dashboard"
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    pathname === "/seller/dashboard"
                      ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/25"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Seller Portal</span>
                </Link>

                <Link
                  href="/seller/inventory"
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    pathname.startsWith("/seller/inventory")
                      ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/25"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Inventory</span>
                </Link>
              </>
            )}

            {isAdmin && (
              <Link
                href="/admin/sellers"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  pathname.startsWith("/admin")
                    ? "bg-purple-500/15 text-purple-400 border border-purple-500/25"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Moderation</span>
              </Link>
            )}
          </nav>
        </div>

        {/* User / Actions */}
        <div className="flex items-center gap-3">
          {/* Shopping Cart Drawer Trigger */}
          <button
            onClick={openDrawer}
            className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-indigo-500/50 transition-colors"
            title="Shopping Cart"
          >
            <ShoppingCart className="w-4 h-4" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shadow-md shadow-indigo-600/50">
                {itemCount}
              </span>
            )}
          </button>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-medium text-slate-200">
                  {user.first_name ? `${user.first_name} ${user.last_name || ""}` : user.email}
                </span>
                <span className="text-[10px] uppercase font-mono text-indigo-400 tracking-wider">
                  {user.role}
                </span>
              </div>
              <button
                onClick={() => logout()}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm shadow-indigo-600/30"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
