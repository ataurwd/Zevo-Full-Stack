"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "../../components/Navbar";
import { useCart } from "../../providers/CartProvider";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Tag,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Package,
  Loader2,
  ArrowLeft,
} from "lucide-react";

export default function FullCartPage() {
  const router = useRouter();
  const {
    cart,
    isLoading,
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
  const [couponMsg, setCouponMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationIssues, setValidationIssues] = useState<string[]>([]);

  const formatCents = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponMsg(null);
    setCouponLoading(true);
    try {
      await applyCoupon(couponCode.trim());
      setCouponCode("");
      setCouponMsg({ type: "success", text: "Promotional discount applied!" });
    } catch (err: any) {
      setCouponMsg({ type: "error", text: err.message || "Invalid coupon code" });
    } finally {
      setCouponLoading(false);
    }
  };

  const handlePreCheckout = async () => {
    setIsValidating(true);
    setValidationIssues([]);
    try {
      const res = await validateCart();
      if (!res.is_valid) {
        setValidationIssues(res.issues.map((i) => i.message));
      } else {
        // Ready for Phase 8 checkout
        alert("Cart verified! Real-time prices & stock confirmed. Ready for checkout.");
      }
    } catch (err: any) {
      setValidationIssues([err.message || "Validation failed"]);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080b12] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
          <Link href="/products" className="hover:text-white transition-colors">
            Marketplace
          </Link>
          <span>/</span>
          <span className="text-slate-200">Shopping Cart</span>
        </div>

        {/* Page Title */}
        <div className="flex items-center justify-between pb-6 mb-8 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Review Your Cart Items
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Multi-vendor items reserved in your session. Stock and prices are validated before checkout.
            </p>
          </div>

          {cart && cart.items.length > 0 && (
            <button
              onClick={() => clearCart()}
              className="text-xs text-slate-400 hover:text-rose-400 transition-colors"
            >
              Clear Cart
            </button>
          )}
        </div>

        {/* Validation Issues Alert Banner */}
        {validationIssues.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs mb-8">
            <div className="flex items-center gap-2 font-bold mb-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Inventory & Pricing Updates Detected:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-300 pl-2">
              {validationIssues.map((issue, idx) => (
                <li key={idx}>{issue}</li>
              ))}
            </ul>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
            <p className="text-sm text-slate-400">Loading your shopping cart...</p>
          </div>
        ) : !cart || cart.items.length === 0 ? (
          /* Empty Cart State */
          <div className="glass-card rounded-2xl border border-slate-800 p-16 text-center max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-500">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-white mb-1">Your cart is currently empty</h2>
            <p className="text-xs text-slate-400 mb-6">
              You haven&apos;t added any items to your multi-vendor cart yet.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors shadow-lg shadow-indigo-600/30"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Explore Marketplace</span>
            </Link>
          </div>
        ) : (
          /* Cart Items & Order Summary Layout */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items Table */}
            <div className="lg:col-span-2 space-y-4">
              <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/80 border-b border-slate-800">
                      <tr className="text-slate-400 uppercase tracking-wider font-semibold">
                        <th className="py-3.5 px-4">Item Details</th>
                        <th className="py-3.5 px-4">Unit Price</th>
                        <th className="py-3.5 px-4">Quantity</th>
                        <th className="py-3.5 px-4">Line Total</th>
                        <th className="py-3.5 px-4 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {cart.items.map((item) => (
                        <tr key={item.variant_id} className="hover:bg-slate-900/30 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-14 h-14 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
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
                              <div>
                                <Link
                                  href={`/products/${item.product_id}`}
                                  className="font-semibold text-white hover:text-indigo-400 transition-colors block text-sm"
                                >
                                  {item.name}
                                </Link>
                                <span className="text-xs text-indigo-400 block mt-0.5">
                                  {item.variant_name}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  SKU: {item.sku}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4 font-mono text-slate-200">
                            {formatCents(item.price)}
                          </td>

                          <td className="py-4 px-4">
                            <div className="inline-flex items-center rounded-xl bg-slate-950 border border-slate-800 p-1">
                              <button
                                onClick={() =>
                                  updateQuantity(item.variant_id, item.quantity - 1)
                                }
                                disabled={item.quantity <= 1}
                                className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-30"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-8 text-center font-mono text-xs font-bold text-white">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(item.variant_id, item.quantity + 1)
                                }
                                className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </td>

                          <td className="py-4 px-4 font-mono font-bold text-white">
                            {formatCents(item.price * item.quantity)}
                          </td>

                          <td className="py-4 px-4 text-right">
                            <button
                              onClick={() => removeItem(item.variant_id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Guarantees Note */}
              <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
                <span className="text-xs text-slate-300">
                  NEXORA Multi-Vendor Routing: Each vendor fulfills their portion independently with dedicated tracking numbers.
                </span>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="space-y-6">
              <div className="glass-card rounded-2xl border border-slate-800 p-6 space-y-5">
                <h2 className="text-base font-bold text-white">Order Summary</h2>

                {/* Promo Code Box */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Promotional Coupon
                  </label>
                  {cart.coupon ? (
                    <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-indigo-400" />
                        <span className="font-mono font-bold text-indigo-300">
                          {cart.coupon.code}
                        </span>
                        <span className="text-emerald-400 font-semibold">
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
                        placeholder="e.g. WELCOME10"
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono uppercase text-white focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="submit"
                        disabled={couponLoading || !couponCode.trim()}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold text-white transition-colors"
                      >
                        {couponLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          "Apply"
                        )}
                      </button>
                    </form>
                  )}

                  {couponMsg && (
                    <p
                      className={`text-[11px] mt-1.5 ${
                        couponMsg.type === "success" ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {couponMsg.text}
                    </p>
                  )}
                </div>

                {/* Calculation breakdown */}
                <div className="space-y-2 text-xs pt-3 border-t border-slate-800">
                  <div className="flex justify-between text-slate-400">
                    <span>Items Subtotal</span>
                    <span className="font-mono text-slate-200">{formatCents(cart.subtotal)}</span>
                  </div>

                  {cart.discount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount Savings</span>
                      <span className="font-mono font-semibold">
                        -{formatCents(cart.discount)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-400">
                    <span>Estimated Shipping</span>
                    <span className="text-slate-300">Calculated at Checkout</span>
                  </div>

                  <div className="flex justify-between text-white font-bold text-base pt-3 border-t border-slate-800">
                    <span>Subtotal Due</span>
                    <span className="font-mono text-lg text-white">{formatCents(cart.total)}</span>
                  </div>
                </div>

                {/* CTAs */}
                <div className="space-y-2.5 pt-2">
                  <button
                    onClick={handlePreCheckout}
                    disabled={isValidating}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-xs font-bold text-white transition-colors shadow-lg shadow-indigo-600/30"
                  >
                    {isValidating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying Stock & Prices...</span>
                      </>
                    ) : (
                      <>
                        <span>Validate & Proceed to Checkout</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
