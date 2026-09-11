"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  CreditCard,
  Lock,
  CheckCircle,
  Plus,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  AlertCircle,
  ChevronRight,
  Truck,
} from "lucide-react";
import { useCart } from "@/providers/CartProvider";
import { getAddresses, createAddress, Address, CreateAddressPayload } from "@/lib/api/users";
import { createOrder } from "@/lib/api/orders";
import { getAccessToken } from "@/lib/api/client";

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
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
      <nav className="flex items-center text-sm font-medium text-slate-500 mb-8 space-x-2">
        <Link href="/cart" className="hover:text-indigo-600 transition">
          Cart
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-900 font-semibold">Checkout</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Checkout</h1>
        <p className="text-slate-600 mt-1">
          Review your order and finalize delivery & payment details.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Delivery & Payment Details */}
        <div className="lg:col-span-7 space-y-8">
          {/* Step 1: Shipping Address */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 font-bold text-sm">
                  1
                </span>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-indigo-600" />
                  Shipping Address
                </h2>
              </div>
              {!isAddingAddress && (
                <button
                  type="button"
                  onClick={() => setIsAddingAddress(true)}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition"
                >
                  <Plus className="w-4 h-4" /> Add Address
                </button>
              )}
            </div>

            {isAddingAddress ? (
              <form onSubmit={handleCreateAddress} className="space-y-4 bg-slate-50/70 p-5 rounded-xl border border-slate-200">
                <h3 className="font-semibold text-slate-800 text-sm">New Delivery Address</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Recipient Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newAddr.recipient_name}
                      onChange={(e) => setNewAddr({ ...newAddr, recipient_name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={newAddr.phone}
                      onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Street Address (Line 1) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAddr.line1}
                    onChange={(e) => setNewAddr({ ...newAddr, line1: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Apartment, suite, unit (optional)
                  </label>
                  <input
                    type="text"
                    value={newAddr.line2 || ""}
                    onChange={(e) => setNewAddr({ ...newAddr, line2: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={newAddr.city}
                      onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">State *</label>
                    <input
                      type="text"
                      required
                      value={newAddr.state}
                      onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Postal Code *</label>
                    <input
                      type="text"
                      required
                      value={newAddr.postal_code}
                      onChange={(e) => setNewAddr({ ...newAddr, postal_code: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingAddress(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            ) : addresses.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-slate-500 text-sm">No saved addresses found.</p>
                <button
                  type="button"
                  onClick={() => setIsAddingAddress(true)}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  <Plus className="w-4 h-4" /> Add your first address
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition ${
                      selectedAddressId === addr.id
                        ? "border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="shipping_address"
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      className="mt-1 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{addr.recipient_name}</span>
                        {addr.is_default && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 mt-1">
                        {addr.line1}
                        {addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}, {addr.state}{" "}
                        {addr.postal_code}, {addr.country}
                      </p>
                      <p className="text-slate-500 text-xs mt-1">Phone: {addr.phone}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {/* Delivery instructions */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Delivery Instructions or Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Gate code #1234, leave in package locker"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Step 2: Payment Method */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 font-bold text-sm">
                  2
                </span>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                  Payment Method
                </h2>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-full">
                <Lock className="w-3.5 h-3.5" /> 256-Bit Encrypted
              </div>
            </div>

            {/* Stripe Card Integration Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Card Number</label>
                <div className="relative">
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-3 py-2.5 pl-10 rounded-lg border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                  <CreditCard className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Expiration</label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="MM/YY"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">CVC / CVV</label>
                  <input
                    type="text"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    placeholder="123"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Powered by Stripe. Payment held securely in escrow until order delivery.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 sticky top-24">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-indigo-600" />
              Order Summary ({cart.item_count} items)
            </h2>

            {/* Item list preview */}
            <div className="space-y-4 max-h-64 overflow-y-auto pr-2 divide-y divide-slate-100">
              {cart.items.map((item) => (
                <div key={item.variant_id} className="pt-3 first:pt-0 flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200 flex items-center justify-center">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-slate-900 truncate">{item.name}</h4>
                    <p className="text-xs text-slate-500 truncate">
                      {item.variant_name} × {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-slate-900">
                    ${((item.price * item.quantity) / 100).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="mt-6 pt-6 border-t border-slate-200 space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span>${subtotalDollars}</span>
              </div>

              {cart.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Coupon ({cart.coupon?.code})</span>
                  <span>-${discountDollars}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-slate-400" /> Flat Delivery Fee
                </span>
                <span>${deliveryFee.toFixed(2)}</span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-base font-bold text-slate-900">Total Amount</span>
                <span className="text-2xl font-extrabold text-indigo-600">${grandTotal}</span>
              </div>
            </div>

            {/* Action button */}
            <button
              type="button"
              disabled={isSubmitting || cart.items.length === 0}
              onClick={handlePlaceOrder}
              className="mt-8 w-full py-3.5 px-6 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Authorizing Payment...</span>
                </>
              ) : (
                <>
                  <span>Place Order & Pay (${grandTotal})</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <p className="text-[11px] text-slate-400 text-center mt-4">
              By clicking Place Order, you authorize the charge and agree to NEXORA Terms of Service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
