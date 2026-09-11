"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  CreditCard,
  Lock,
  Plus,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  AlertCircle,
  ChevronRight,
  Truck,
  CheckCircle2,
} from "lucide-react";
import { useCart } from "@/providers/CartProvider";
import { getAddresses, createAddress, Address, CreateAddressPayload } from "@/lib/api/users";
import { createOrder } from "@/lib/api/orders";
import { getAccessToken } from "@/lib/api/client";
import { GlassCard, GlassButton, GlassInput, GlassBadge } from "@/components/ui";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, isLoading: cartLoading, refreshCart } = useCart();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [notes, setNotes] = useState("");

  const [newAddr, setNewAddr] = useState<CreateAddressPayload>({
    recipient_name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "US",
    is_default: false,
  });

  const [cardHolder, setCardHolder] = useState("Jane Doe");
  const [cardNumber, setCardNumber] = useState("4242 •••• •••• 4242");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvc, setCardCvc] = useState("123");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Auth check and address load
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push("/login?redirect=/checkout");
      return;
    }

    const loadData = async () => {
      try {
        const addrList = await getAddresses();
        setAddresses(addrList);
        const defaultAddr = addrList.find((a) => a.is_default) || addrList[0];
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
        } else {
          setIsAddingAddress(true);
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Could not load saved addresses");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [router]);

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const created = await createAddress(newAddr);
      setAddresses((prev) => [created, ...prev]);
      setSelectedAddressId(created.id);
      setIsAddingAddress(false);
      setNewAddr({
        recipient_name: "",
        phone: "",
        line1: "",
        line2: "",
        city: "",
        state: "",
        postal_code: "",
        country: "US",
        is_default: false,
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed creating address");
    }
  };

  const handlePlaceOrder = async () => {
    setErrorMsg(null);
    if (!selectedAddressId) {
      setErrorMsg("Please select or add a shipping address");
      return;
    }

    if (!cart || !cart.items || cart.items.length === 0) {
      setErrorMsg("Your cart is empty. Please add items before checkout.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createOrder({
        address_id: selectedAddressId,
        notes: notes.trim() || undefined,
      });

      await refreshCart();
      router.push(`/orders/${result.order.id}?placed=true`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to place order. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (isLoading || cartLoading || !cart) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const subtotalDollars = (cart.subtotal / 100).toFixed(2);
  const discountDollars = (cart.discount / 100).toFixed(2);
  const deliveryFee = 5.0; // Flat $5.00
  const grandTotal = Math.max(0, cart.subtotal / 100 - cart.discount / 100 + deliveryFee).toFixed(2);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center text-xs font-semibold text-slate-400 mb-8 space-x-2">
        <Link href="/cart" className="hover:text-indigo-400 transition">
          Cart
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-white">Checkout</span>
      </nav>

      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-2">
          <GlassBadge variant="cyan">Liquid Glass Checkout</GlassBadge>
          <span className="text-xs text-slate-400">Escrow Protected</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">Finalize Your Order</h1>
        <p className="text-slate-400 text-sm mt-1">
          Review items, select shipping destination, and authorize payment securely.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-sm flex items-center gap-3 backdrop-blur-md">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Delivery & Payment Details */}
        <div className="lg:col-span-7 space-y-8">
          {/* Step 1: Shipping Address */}
          <GlassCard className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 font-black text-sm border border-indigo-500/30">
                  1
                </span>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-400" />
                  Shipping Destination
                </h2>
              </div>
              {!isAddingAddress && (
                <button
                  type="button"
                  onClick={() => setIsAddingAddress(true)}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> New Address
                </button>
              )}
            </div>

            {isAddingAddress ? (
              <form
                onSubmit={handleCreateAddress}
                className="space-y-4 p-5 rounded-xl bg-slate-950/50 border border-white/[0.08] backdrop-blur-md"
              >
                <h3 className="font-bold text-white text-xs uppercase tracking-wider">
                  Add Delivery Address
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <GlassInput
                    label="Recipient Full Name *"
                    required
                    value={newAddr.recipient_name}
                    onChange={(e) => setNewAddr({ ...newAddr, recipient_name: e.target.value })}
                  />
                  <GlassInput
                    label="Phone Number *"
                    required
                    value={newAddr.phone}
                    onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                  />
                </div>

                <GlassInput
                  label="Street Address (Line 1) *"
                  required
                  value={newAddr.line1}
                  onChange={(e) => setNewAddr({ ...newAddr, line1: e.target.value })}
                />

                <GlassInput
                  label="Apartment, suite, unit (optional)"
                  value={newAddr.line2 || ""}
                  onChange={(e) => setNewAddr({ ...newAddr, line2: e.target.value })}
                />

                <div className="grid grid-cols-3 gap-3">
                  <GlassInput
                    label="City *"
                    required
                    value={newAddr.city}
                    onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                  />
                  <GlassInput
                    label="State *"
                    required
                    value={newAddr.state}
                    onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                  />
                  <GlassInput
                    label="Postal Code *"
                    required
                    value={newAddr.postal_code}
                    onChange={(e) => setNewAddr({ ...newAddr, postal_code: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingAddress(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <GlassButton type="submit" size="sm">
                    Save Address
                  </GlassButton>
                </div>
              </form>
            ) : addresses.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-slate-400 text-sm">No saved addresses found.</p>
                <GlassButton
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setIsAddingAddress(true)}
                  className="mt-3"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add your first address
                </GlassButton>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id;

                  return (
                    <label
                      key={addr.id}
                      className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-indigo-950/40 border-indigo-500/60 shadow-[0_0_20px_rgba(99,102,241,0.2)] ring-1 ring-indigo-500/50"
                          : "bg-slate-950/30 border-white/[0.06] hover:border-white/[0.12]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="shipping_address"
                        checked={isSelected}
                        onChange={() => setSelectedAddressId(addr.id)}
                        className="mt-1 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
                      />
                      <div className="flex-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">
                            {addr.recipient_name}
                          </span>
                          {addr.is_default && (
                            <GlassBadge variant="cyan" dot={false} className="py-0.5 px-2 text-[10px]">
                              Default
                            </GlassBadge>
                          )}
                        </div>
                        <p className="text-slate-300 mt-1">
                          {addr.line1}
                          {addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}, {addr.state}{" "}
                          {addr.postal_code}, {addr.country}
                        </p>
                        <p className="text-slate-500 text-[11px] mt-1">Phone: {addr.phone}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Delivery Instructions */}
            <div className="mt-6 pt-6 border-t border-white/[0.06]">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Delivery Instructions (Optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Gate code, door drop preferences, etc."
                className="liquid-glass-input w-full"
              />
            </div>
          </GlassCard>

          {/* Step 2: Payment Method */}
          <GlassCard className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 font-black text-sm border border-indigo-500/30">
                  2
                </span>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-400" />
                  Stripe Escrow Payment
                </h2>
              </div>
              <GlassBadge variant="emerald">
                <Lock className="w-3 h-3" /> 256-Bit Encrypted
              </GlassBadge>
            </div>

            <div className="space-y-4">
              <GlassInput
                label="Cardholder Full Name"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value)}
              />

              <GlassInput
                label="Card Number"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                leftIcon={<CreditCard className="w-4 h-4" />}
              />

              <div className="grid grid-cols-2 gap-4">
                <GlassInput
                  label="Expiration Date"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  placeholder="MM/YY"
                />
                <GlassInput
                  label="Security CVC"
                  value={cardCvc}
                  onChange={(e) => setCardCvc(e.target.value)}
                  placeholder="123"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>
                  Funds remain safely locked in escrow until your delivery is fulfilled and confirmed.
                </span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-5">
          <GlassCard className="p-6 sm:p-8 sticky top-24">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-indigo-400" />
              Order Summary ({cart.item_count} items)
            </h2>

            {/* Items list */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1 divide-y divide-white/[0.05]">
              {cart.items.map((item) => (
                <div key={item.variant_id} className="pt-3 first:pt-0 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-950/80 border border-white/[0.08] overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                    <p className="text-[11px] text-slate-400 truncate">
                      {item.variant_name} × {item.quantity}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-indigo-300">
                    ${((item.price * item.quantity) / 100).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Cost Breakdown */}
            <div className="mt-6 pt-6 border-t border-white/[0.08] space-y-3 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Items Subtotal</span>
                <span className="font-semibold text-white">${subtotalDollars}</span>
              </div>

              {cart.discount > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Coupon Discount ({cart.coupon?.code})</span>
                  <span>-${discountDollars}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-slate-400" /> Flat Delivery Fee
                </span>
                <span className="font-semibold text-white">${deliveryFee.toFixed(2)}</span>
              </div>

              <div className="pt-4 border-t border-white/[0.08] flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-300">Grand Total</span>
                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-300">
                  ${grandTotal}
                </span>
              </div>
            </div>

            {/* Place Order CTA */}
            <GlassButton
              type="button"
              size="lg"
              isLoading={isSubmitting}
              disabled={cart.items.length === 0}
              onClick={handlePlaceOrder}
              className="mt-8 w-full"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Authorize & Place Order (${grandTotal})
            </GlassButton>

            <p className="text-[10px] text-slate-500 text-center mt-4">
              NEXORA Secure Multi-Vendor Checkout • Stripe Connect Verified
            </p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
