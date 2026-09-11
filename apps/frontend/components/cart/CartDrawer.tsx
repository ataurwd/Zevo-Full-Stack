"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "../../providers/CartProvider";
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Tag,
  Loader2,
  Package,
} from "lucide-react";

export function CartDrawer() {
  const router = useRouter();
  const {
    cart,
    isDrawerOpen,
    closeDrawer,
    updateQuantity,
    removeItem,
    clearCart,
    applyCoupon,
    removeCoupon,
    itemCount,
  } = useCart();

  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  if (!isDrawerOpen) return null;

  const formatCents = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponError(null);
    setCouponLoading(true);
    try {
      await applyCoupon(couponCode.trim());
      setCouponCode("");
    } catch (err: any) {
      setCouponError(err.message || "Invalid coupon code");
    } finally {
      setCouponLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dark backdrop */}
      <div
        onClick={closeDrawer}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#090d16] border-l border-slate-800 text-slate-100 flex flex-col shadow-2xl">
          {/* Drawer Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-600/10 text-indigo-400">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Your Shopping Cart</h2>
                <span className="text-xs text-slate-400">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {cart && cart.items.length > 0 && (
                <button
                  onClick={() => clearCart()}
                  className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors"
                >
                  Clear
                </button>
              )}
              <button
                onClick={closeDrawer}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {!cart || cart.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 mb-4 text-slate-500">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-semibold text-slate-300">Your cart is empty</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mb-6">
                  Explore verified multi-vendor products and add items to your cart.
                </p>
                <button
                  onClick={() => {
                    closeDrawer();
                    router.push("/products");
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors shadow-lg shadow-indigo-600/30"
                >
                  Browse Marketplace
                </button>
              </div>
            ) : (
              cart.items.map((item) => (
                <div
                  key={item.variant_id}
                  className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex gap-3.5"
                >
                  {/* Image */}
                  <div className="w-16 h-16 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-6 h-6 text-slate-600" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-white truncate">{item.name}</h4>
                    <span className="text-[11px] text-indigo-400 block truncate">
                      {item.variant_name}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-200 mt-1 block">
                      {formatCents(item.price)}
                    </span>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between mt-2.5">
                      <div className="flex items-center rounded-lg bg-slate-950 border border-slate-800 p-0.5">
                        <button
                          onClick={() => updateQuantity(item.variant_id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-30"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center font-mono text-xs font-bold text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.variant_id, item.quantity + 1)}
                          className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.variant_id)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer / Summary */}
          {cart && cart.items.length > 0 && (
            <div className="p-5 border-t border-slate-800 space-y-4 bg-slate-950/60">
              {/* Promo code form */}
              {cart.coupon ? (
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="font-mono font-semibold text-indigo-300">
                      {cart.coupon.code}
                    </span>
                    <span className="text-[10px] text-indigo-400">
                      (-{formatCents(cart.discount)})
                    </span>
                  </div>
                  <button
                    onClick={() => removeCoupon()}
                    className="text-[11px] text-slate-400 hover:text-rose-400"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Coupon (e.g. WELCOME10)"
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono uppercase text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={couponLoading || !couponCode.trim()}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold text-white transition-colors"
                  >
                    {couponLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Apply"}
                  </button>
                </form>
              )}

              {couponError && (
                <p className="text-[11px] text-rose-400">{couponError}</p>
              )}

              {/* Totals */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-mono text-slate-200">{formatCents(cart.subtotal)}</span>
                </div>
                {cart.discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount</span>
                    <span className="font-mono">-{formatCents(cart.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-slate-800">
                  <span>Estimated Total</span>
                  <span className="font-mono text-base text-white">{formatCents(cart.total)}</span>
                </div>
              </div>

              {/* Checkout CTA */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => {
                    closeDrawer();
                    router.push("/cart");
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-colors shadow-lg shadow-indigo-600/30"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
