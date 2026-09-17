"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "../../components/Navbar";
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
  Banknote,
  Sparkles,
  ArrowLeft,
  Phone,
} from "lucide-react";
import { useCart } from "../../providers/CartProvider";
import { getAddresses, createAddress, Address, CreateAddressPayload } from "../../lib/api/users";
import { createOrder } from "../../lib/api/orders";
import { getAccessToken } from "../../lib/api/client";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { PaymentCardForm } from "../../components/checkout/PaymentCardForm";

const rawStripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
const isStripeConfigured =
  Boolean(rawStripeKey) &&
  !rawStripeKey.includes("...") &&
  rawStripeKey.startsWith("pk_");

let stripePromise: Promise<Stripe | null> | null = null;
if (typeof window !== "undefined" && isStripeConfigured) {
  stripePromise = loadStripe(rawStripeKey);
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: "#0A504A",
      fontSize: "14px",
      fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      fontSmoothing: "antialiased",
      "::placeholder": {
        color: "#9CA3AF",
      },
    },
    invalid: {
      color: "#DC2626",
      iconColor: "#DC2626",
    },
  },
  hidePostalCode: false,
};

function CheckoutForm() {
  const router = useRouter();
  const { cart, isLoading: cartLoading, refreshCart } = useCart();
  const stripe = useStripe();
  const elements = useElements();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cod">("card");

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

  // Real-time user input (No hardcoded demo values)
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAuthenticatedUser, setIsAuthenticatedUser] = useState(true);

  // 1. Auth check and address load
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setIsAuthenticatedUser(false);
      setIsLoading(false);
      return;
    }

    setIsAuthenticatedUser(true);
    const loadData = async () => {
      try {
        const addrList = await getAddresses();
        setAddresses(addrList || []);
        const defaultAddr = (addrList || []).find((a) => a.is_default) || (addrList || [])[0];
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
      setErrorMsg("Please select or add a delivery address to proceed.");
      return;
    }

    if (!cart || !cart.items || cart.items.length === 0) {
      setErrorMsg("Your cart is empty. Please add products to cart before checkout.");
      return;
    }

    if (paymentMethod === "card" && !isStripeConfigured) {
      const cleanCard = cardNumber.replace(/\s/g, "");
      const isAmex = /^3[47]/.test(cleanCard);
      const minLength = isAmex ? 15 : 16;

      if (!cardHolder.trim() || cardHolder.trim().length < 2) {
        setErrorMsg("Please enter the cardholder full name as it appears on your card.");
        return;
      }
      if (cleanCard.length < minLength) {
        setErrorMsg(`Please enter a valid ${minLength}-digit card number.`);
        return;
      }
      const cleanExpiry = cardExpiry.replace(/\s/g, "");
      if (cleanExpiry.length < 5 || !cleanExpiry.includes("/")) {
        setErrorMsg("Please enter a valid expiration date in MM / YY format.");
        return;
      }
      const [monthStr] = cleanExpiry.split("/");
      const month = parseInt(monthStr, 10);
      if (isNaN(month) || month < 1 || month > 12) {
        setErrorMsg("Please enter a valid expiration month (01 to 12).");
        return;
      }
      const cvcMin = isAmex ? 4 : 3;
      if (cardCvc.length < cvcMin) {
        setErrorMsg(`Please enter a valid ${cvcMin}-digit security code (CVC).`);
        return;
      }
    }

    const selectedAddr = addresses.find((a) => a.id === selectedAddressId);

    setIsSubmitting(true);
    try {
      // 1. Create order on backend (which reserves inventory and creates PaymentIntent)
      const result = await createOrder({
        address_id: selectedAddressId,
        notes: notes.trim() || undefined,
      });

      // 2. If card payment and live Stripe keys are configured, confirm card via Stripe.js
      if (paymentMethod === "card" && isStripeConfigured && stripe && elements) {
        const cardElement = elements.getElement(CardElement);
        if (cardElement && result.payment_intent_client_secret && !result.payment_intent_client_secret.startsWith("pi_mock_")) {
          const { error: stripeErr } = await stripe.confirmCardPayment(
            result.payment_intent_client_secret,
            {
              payment_method: {
                card: cardElement,
                billing_details: {
                  name: cardHolder || selectedAddr?.recipient_name || undefined,
                  phone: selectedAddr?.phone || undefined,
                  address: {
                    line1: selectedAddr?.line1 || undefined,
                    line2: selectedAddr?.line2 || undefined,
                    city: selectedAddr?.city || undefined,
                    state: selectedAddr?.state || undefined,
                    postal_code: selectedAddr?.postal_code || undefined,
                    country: selectedAddr?.country || "US",
                  },
                },
              },
            }
          );

          if (stripeErr) {
            throw new Error(stripeErr.message || "Stripe card authentication failed. Please check details and try again.");
          }
        }
      }

      // 3. Clear cart and navigate to live order tracking page
      await refreshCart();
      router.push(`/orders/${result.order.id}?placed=true`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to place order. Please check your details and try again.");
      setIsSubmitting(false);
    }
  };

  if (isLoading || cartLoading) {
    return (
      <div className="min-h-screen bg-[#fbfdfb] text-gray-900 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-32">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00A86B] mb-3"></div>
          <p className="text-xs font-semibold text-gray-500">Preparing secure checkout & delivery options...</p>
        </div>
      </div>
    );
  }

  const subtotalDollars = cart ? (cart.subtotal / 100).toFixed(2) : "0.00";
  const discountDollars = cart ? (cart.discount / 100).toFixed(2) : "0.00";
  const deliveryFee = 5.0; // Flat $5.00 fresh delivery
  const grandTotal = cart
    ? Math.max(0, cart.subtotal / 100 - cart.discount / 100 + deliveryFee).toFixed(2)
    : "5.00";

  return (
    <div className="min-h-screen bg-[#fbfdfb] text-gray-900 flex flex-col selection:bg-[#00A86B] selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Breadcrumb */}
        <nav className="flex items-center text-xs font-semibold text-gray-500 mb-6 space-x-2">
          <Link href="/products" className="hover:text-[#00A86B] transition-colors">
            Shop
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <Link href="/cart" className="hover:text-[#00A86B] transition-colors">
            Cart
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-[#00A86B] font-bold">Checkout & Delivery</span>
        </nav>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[#0A504A] text-[11px] font-bold tracking-wide uppercase">
              <Sparkles className="w-3 h-3 text-[#00A86B]" />
              Fresh Harvest Express Checkout
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-gray-500 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Escrow Protected
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0A504A] tracking-tight">
            Finalize Your Fresh Order
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm mt-1">
            Confirm your delivery drop-off location, payment preference, and authorize dispatch.
          </p>
        </div>

        {/* Auth Notice if guest */}
        {!isAuthenticatedUser && (
          <div className="mb-8 p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <h4 className="text-xs font-bold">Authentication Required for Order Placement</h4>
                <p className="text-xs text-amber-700 mt-0.5">
                  Please log in or sign up so we can connect your order to real-time delivery rider tracking.
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push("/login?redirect=/checkout")}
              className="px-5 py-2.5 rounded-xl bg-[#0A504A] hover:bg-[#00A86B] text-white text-xs font-bold transition-all shadow-md shadow-[#0A504A]/20 shrink-0 cursor-pointer"
            >
              Sign In to Checkout
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ================================================================
              LEFT COLUMN (7 of 12 columns): Delivery Destination & Payment
              ================================================================ */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Shipping Destination & Drop Location */}
            <div className="bg-white rounded-3xl border border-[#D1E7D8] p-6 sm:p-7 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-100 text-[#00A86B] font-black text-sm border border-emerald-200">
                    1
                  </span>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#00A86B]" />
                      <span>Shipping Destination & Drop Location</span>
                    </h2>
                    <p className="text-xs text-gray-500">Where should our courier deliver your fresh items?</p>
                  </div>
                </div>

                {!isAddingAddress && (
                  <button
                    type="button"
                    onClick={() => setIsAddingAddress(true)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#00A86B] hover:text-[#0A504A] transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Address</span>
                  </button>
                )}
              </div>

              {/* Address Form (if adding) */}
              {isAddingAddress ? (
                <form
                  onSubmit={handleCreateAddress}
                  className="space-y-4 p-5 rounded-2xl bg-[#F8FAF8] border border-[#D1E7D8]"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                    <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider">
                      Add New Delivery Destination
                    </h3>
                    {addresses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsAddingAddress(false)}
                        className="text-xs font-semibold text-gray-500 hover:text-gray-900 cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">
                        Recipient Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newAddr.recipient_name}
                        onChange={(e) => setNewAddr({ ...newAddr, recipient_name: e.target.value })}
                        placeholder="e.g. John Doe"
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-[#00A86B]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={newAddr.phone}
                        onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                        placeholder="+1 (555) 000-0000"
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-[#00A86B]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      Street Address (Line 1) *
                    </label>
                    <input
                      type="text"
                      required
                      value={newAddr.line1}
                      onChange={(e) => setNewAddr({ ...newAddr, line1: e.target.value })}
                      placeholder="e.g. 742 Evergreen Terrace"
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-[#00A86B]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      Apartment, Suite, Unit (Optional)
                    </label>
                    <input
                      type="text"
                      value={newAddr.line2 || ""}
                      onChange={(e) => setNewAddr({ ...newAddr, line2: e.target.value })}
                      placeholder="e.g. Apt 4B, Building C"
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-[#00A86B]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">City *</label>
                      <input
                        type="text"
                        required
                        value={newAddr.city}
                        onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                        placeholder="Springfield"
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-[#00A86B]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">State *</label>
                      <input
                        type="text"
                        required
                        value={newAddr.state}
                        onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                        placeholder="IL"
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-[#00A86B]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">Postal Code *</label>
                      <input
                        type="text"
                        required
                        value={newAddr.postal_code}
                        onChange={(e) => setNewAddr({ ...newAddr, postal_code: e.target.value })}
                        placeholder="62701"
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-[#00A86B]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingAddress(false)}
                      className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-[#00A86B] hover:bg-[#0A504A] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      Save Delivery Address
                    </button>
                  </div>
                </form>
              ) : addresses.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-gray-500 text-xs">No delivery address on file yet.</p>
                  <button
                    type="button"
                    onClick={() => setIsAddingAddress(true)}
                    className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00A86B] text-white text-xs font-bold shadow-xs hover:bg-[#0A504A] transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Delivery Address</span>
                  </button>
                </div>
              ) : (
                /* Address Selection Grid */
                <div className="space-y-3">
                  {addresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;

                    return (
                      <label
                        key={addr.id}
                        className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-[#E8F8EE]/60 border-[#00A86B] ring-2 ring-[#00A86B]/20 shadow-xs"
                            : "bg-white border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="shipping_address"
                          checked={isSelected}
                          onChange={() => setSelectedAddressId(addr.id)}
                          className="mt-1 text-[#00A86B] focus:ring-[#00A86B] h-4 w-4"
                        />
                        <div className="flex-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 text-sm">
                              {addr.recipient_name}
                            </span>
                            {addr.is_default && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#0A504A] text-[10px] font-extrabold uppercase">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-gray-700 font-medium mt-1">
                            {addr.line1}
                            {addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}, {addr.state}{" "}
                            {addr.postal_code}, {addr.country}
                          </p>
                          <p className="text-gray-500 text-[11px] mt-1 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span>{addr.phone}</span>
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Dedicated Drop Location & Delivery Instructions Box */}
              <div className="pt-4 border-t border-gray-100 space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#00A86B]" />
                  <label className="text-xs font-bold text-gray-900">
                    Drop-off Location & Rider Delivery Instructions
                  </label>
                </div>
                <p className="text-[11px] text-gray-500">
                  Specific delivery guidelines for your courier (e.g. Leave at front door, gate code #4920, ring doorbell, 3rd floor apartment 3B).
                </p>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Gate code is #1234. Please leave parcel behind the planter box on the front porch and ring bell."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]"
                />
              </div>
            </div>

            {/* Step 2: Payment Method */}
            <div className="bg-white rounded-3xl border border-[#D1E7D8] p-6 sm:p-7 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-100 text-[#00A86B] font-black text-sm border border-emerald-200">
                    2
                  </span>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#00A86B]" />
                      <span>Payment Method</span>
                    </h2>
                    <p className="text-xs text-gray-500">Encrypted checkout with customer escrow protection</p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold uppercase">
                  <Lock className="w-3 h-3 text-[#00A86B]" />
                  256-Bit SSL
                </span>
              </div>

              {/* Payment Mode Selector */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                    paymentMethod === "card"
                      ? "bg-[#E8F8EE]/60 border-[#00A86B] ring-2 ring-[#00A86B]/20"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <CreditCard className={`w-5 h-5 ${paymentMethod === "card" ? "text-[#00A86B]" : "text-gray-400"}`} />
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">Credit / Debit Card</span>
                    <span className="text-[10px] text-gray-500">Stripe Escrow Verified</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("cod")}
                  className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                    paymentMethod === "cod"
                      ? "bg-[#E8F8EE]/60 border-[#00A86B] ring-2 ring-[#00A86B]/20"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Banknote className={`w-5 h-5 ${paymentMethod === "cod" ? "text-[#00A86B]" : "text-gray-400"}`} />
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">Cash on Delivery</span>
                    <span className="text-[10px] text-gray-500">Pay at Doorstep</span>
                  </div>
                </button>
              </div>

              {paymentMethod === "card" ? (
                <div className="space-y-3.5 p-5 rounded-2xl bg-gray-50/70 border border-gray-200">
                  {/* Stripe Card Integration */}
                  {isStripeConfigured ? (
                    <div className="space-y-3.5">
                      <div>
                        <label className="text-[11px] font-bold text-gray-700 block mb-1">
                          Cardholder Full Name
                        </label>
                        <input
                          type="text"
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value)}
                          placeholder="Name as it appears on card"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-xs font-medium text-gray-900 focus:outline-none focus:border-[#00A86B]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-gray-700 block mb-1">
                          Card Details (Secured by Stripe)
                        </label>
                        <div className="p-3.5 rounded-xl bg-white border border-gray-300 focus-within:border-[#00A86B] transition-colors shadow-2xs">
                          <CardElement options={CARD_ELEMENT_OPTIONS} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <PaymentCardForm
                      cardHolder={cardHolder}
                      setCardHolder={setCardHolder}
                      cardNumber={cardNumber}
                      setCardNumber={setCardNumber}
                      cardExpiry={cardExpiry}
                      setCardExpiry={setCardExpiry}
                      cardCvc={cardCvc}
                      setCardCvc={setCardCvc}
                    />
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                  <h4 className="text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#00A86B]" />
                    <span>Pay Upon Delivery Selected</span>
                  </h4>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    You can inspect your fresh produce basket upon arrival and pay the delivery rider using cash or scan their digital QR payment terminal.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ================================================================
              RIGHT COLUMN (5 of 12 columns): Order Summary & Place Order
              ================================================================ */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl border border-[#D1E7D8] p-6 sm:p-7 shadow-xs sticky top-24 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#00A86B]" />
                  <span>Order Summary</span>
                </h2>
                <span className="text-xs font-bold text-[#00A86B] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {cart?.item_count || 0} {cart?.item_count === 1 ? "item" : "items"}
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-3.5 max-h-64 overflow-y-auto pr-1 divide-y divide-gray-100">
                {cart && cart.items.length > 0 ? (
                  cart.items.map((item) => (
                    <div key={item.variant_id} className="pt-3 first:pt-0 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ShoppingBag className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-gray-900 truncate">{item.name}</h4>
                        <p className="text-[11px] text-gray-500 truncate">
                          {item.variant_name} × {item.quantity}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-[#0A504A]">
                        ${((item.price * item.quantity) / 100).toFixed(2)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-xs text-gray-400">
                    No items in cart.
                  </div>
                )}
              </div>

              {/* Financial Breakdown */}
              <div className="pt-4 border-t border-gray-100 space-y-2.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Items Subtotal</span>
                  <span className="font-semibold text-gray-900 font-mono">${subtotalDollars}</span>
                </div>

                {cart && cart.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Coupon Savings ({cart.coupon?.code})</span>
                    <span className="font-mono">-${discountDollars}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-emerald-600" /> Flat Delivery Fee
                  </span>
                  <span className="font-semibold text-gray-900 font-mono">${deliveryFee.toFixed(2)}</span>
                </div>

                <div className="pt-3 border-t border-gray-200 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-gray-900">Grand Total</span>
                  <span className="text-2xl font-black text-[#0A504A] font-mono">
                    ${grandTotal}
                  </span>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                type="button"
                disabled={isSubmitting || !cart || cart.items.length === 0 || !isAuthenticatedUser}
                onClick={handlePlaceOrder}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-full bg-[#00A86B] hover:bg-[#0A504A] disabled:opacity-50 text-xs font-bold text-white transition-all shadow-md shadow-[#00A86B]/20 hover:shadow-[#0A504A]/30 active:scale-[0.98] cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Processing Your Order...</span>
                ) : (
                  <>
                    <span>Authorize & Place Order (${grandTotal})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-gray-100">
                <Link href="/cart" className="hover:text-[#00A86B] font-semibold transition-colors flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" />
                  <span>Modify Cart</span>
                </Link>
                <span className="text-emerald-700 font-medium">🛡️ Freshness Guaranteed</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}
