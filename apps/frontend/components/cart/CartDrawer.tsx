"use client";

import React, { useState, useEffect } from "react";
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
  AlertCircle,
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
    validateCart,
    itemCount,
  } = useCart();

  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [outOfStockNotice, setOutOfStockNotice] = useState<string | null>(null);

  useEffect(() => {
    if (isDrawerOpen) {
      validateCart()
        .then((res) => {
          if (res && !res.is_valid && res.issues.length > 0) {
            const oosIssue = res.issues.find((i) => i.issue === "out_of_stock");
            if (oosIssue) {
              setOutOfStockNotice(
                oosIssue.message || "An out-of-stock item was automatically removed from your cart."
              );
            }
          }
        })
        .catch(() => {});
    }
  }, [isDrawerOpen, validateCart]);

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
    <div className="fixed inset-0 z-[80] overflow-hidden">
      {/* Dimmed backdrop */}
      <div
        onClick={closeDrawer}
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity cursor-pointer"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        {/* Solid white drawer container - No ugly transparency */}
        <div className="w-screen max-w-md bg-white text-gray-900 flex flex-col shadow-2xl border-l border-gray-200">
          {/* Drawer Header */}
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-[#00A86B] border border-emerald-200/60">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-black text-[#0A504A] tracking-tight">Your Shopping Cart</h2>
                <span className="text-xs text-gray-500 font-medium">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {cart && cart.items.length > 0 && (
                <button
                  onClick={() => clearCart()}
                  className="text-xs font-semibold text-gray-400 hover:text-rose-600 transition-colors px-2 py-1 cursor-pointer"
                >
                  Clear
                </button>
              )}
              <button
                onClick={closeDrawer}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                aria-label="Close cart"
              >
                <X className="w-5 h-5 stroke-[2.2]" />
              </button>
            </div>
          </div>

          {/* Out of Stock Removed Alert Notice */}
          {outOfStockNotice && (
            <div className="p-3 mx-6 mt-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between shadow-2xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-semibold">{outOfStockNotice}</span>
              </div>
              <button
                onClick={() => setOutOfStockNotice(null)}
                className="text-amber-700 hover:text-amber-900 p-1 cursor-pointer"
                title="Dismiss notice"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Items List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-[#F8FAF9]">
            {!cart || cart.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/60 mb-4 text-[#00A86B]">
                  <ShoppingBag className="w-8 h-8 stroke-[2]" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Your cart is empty</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mb-6 leading-relaxed">
                  Explore fresh items in our catalog and add them to your cart.
                </p>
                <button
                  onClick={() => {
                    closeDrawer();
                    router.push("/products");
                  }}
                  className="px-6 py-2.5 rounded-xl bg-[#00A86B] hover:bg-[#0A504A] text-xs font-bold text-white transition-all shadow-md shadow-[#00A86B]/20 cursor-pointer"
                >
                  Browse Catalog
                </button>
              </div>
            ) : (
              cart.items.map((item) => (
                <div
                  key={item.variant_id}
                  className="p-3.5 rounded-2xl bg-white border border-gray-200/80 flex gap-3.5 shadow-2xs hover:shadow-xs transition-shadow"
                >
                  {/* Product Image */}
                  <div className="w-16 h-16 rounded-xl bg-[#F4F6F5] border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden p-1">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Package className="w-6 h-6 text-[#00A86B]" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 truncate">{item.name}</h4>
                      {item.variant_name && item.variant_name !== "Default" && (
                        <span className="text-[11px] text-[#00A86B] font-semibold block truncate mt-0.5">
                          {item.variant_name}
                        </span>
                      )}
                      <span className="text-xs font-black text-[#0A504A] mt-1 block">
                        {formatCents(item.price)}
                      </span>
                    </div>

                    {/* Quantity Controls & Delete */}
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-50">
                      <div className="flex items-center rounded-lg bg-gray-50 border border-gray-200 p-0.5">
                        <button
                          onClick={() => updateQuantity(item.variant_id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="w-5 h-5 rounded flex items-center justify-center text-gray-500 hover:text-gray-900 disabled:opacity-30 cursor-pointer"
                        >
                          <Minus className="w-3 h-3 stroke-[2.5]" />
                        </button>
                        <span className="w-7 text-center font-mono text-xs font-bold text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.variant_id, item.quantity + 1)}
                          className="w-5 h-5 rounded flex items-center justify-center text-gray-500 hover:text-gray-900 cursor-pointer"
                        >
                          <Plus className="w-3 h-3 stroke-[2.5]" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.variant_id)}
                        className="p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
            <div className="p-5 bg-white border-t border-gray-100 space-y-4 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
              {/* Promo code form */}
              {cart.coupon ? (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-[#00A86B]" />
                    <span className="font-mono font-bold text-[#0A504A]">
                      {cart.coupon.code}
                    </span>
                    <span className="text-[10px] text-[#00A86B] font-bold">
                      (-{formatCents(cart.discount)})
                    </span>
                  </div>
                  <button
                    onClick={() => removeCoupon()}
                    className="text-[11px] font-bold text-gray-500 hover:text-rose-600 cursor-pointer"
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
                    placeholder="Coupon code (e.g. WELCOME10)"
                    className="flex-1 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-mono uppercase text-gray-900 focus:outline-none focus:border-[#00A86B] focus:bg-white transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={couponLoading || !couponCode.trim()}
                    className="px-4 py-2 rounded-xl bg-[#0A504A] hover:bg-[#00A86B] disabled:opacity-40 text-xs font-bold text-white transition-colors cursor-pointer"
                  >
                    {couponLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Apply"}
                  </button>
                </form>
              )}

              {couponError && (
                <p className="text-[11px] text-rose-500 font-medium">{couponError}</p>
              )}

              {/* Totals */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-mono text-gray-900 font-bold">{formatCents(cart.subtotal)}</span>
                </div>
                {cart.discount > 0 && (
                  <div className="flex justify-between text-[#00A86B] font-bold">
                    <span>Discount</span>
                    <span className="font-mono">-{formatCents(cart.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-900 font-bold text-sm pt-2.5 border-t border-gray-100">
                  <span>Estimated Total</span>
                  <span className="font-mono text-xl text-[#0A504A] font-black">{formatCents(cart.total)}</span>
                </div>
              </div>

              {/* Action Buttons in a clean Flex Row */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    closeDrawer();
                    router.push("/cart");
                  }}
                  className="flex-1 py-3 px-4 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-xs font-bold text-gray-800 transition-colors cursor-pointer text-center"
                >
                  View Cart
                </button>
                <button
                  type="button"
                  onClick={() => {
                    closeDrawer();
                    router.push("/checkout");
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-[#00A86B] hover:bg-[#0A504A] text-xs font-bold text-white transition-all shadow-md shadow-[#00A86B]/20 cursor-pointer active:scale-[0.98] text-center"
                >
                  <span>Checkout</span>
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
