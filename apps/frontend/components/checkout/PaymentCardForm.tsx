"use client";

import React, { useRef, useState } from "react";
import {
  CreditCard,
  Lock,
  Calendar,
  User,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Eye,
  EyeOff,
} from "lucide-react";

export interface PaymentCardFormProps {
  cardHolder: string;
  setCardHolder: (v: string) => void;
  cardNumber: string;
  setCardNumber: (v: string) => void;
  cardExpiry: string;
  setCardExpiry: (v: string) => void;
  cardCvc: string;
  setCardCvc: (v: string) => void;
  error?: string | null;
}

export type CardBrand = "visa" | "mastercard" | "amex" | "discover" | "generic";

export function detectCardBrand(digits: string): CardBrand {
  const clean = digits.replace(/\D/g, "");
  if (/^4/.test(clean)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(clean)) return "mastercard";
  if (/^3[47]/.test(clean)) return "amex";
  if (/^(6011|65|64[4-9])/.test(clean)) return "discover";
  return "generic";
}

// Format digits into readable groups
export function formatCardNumberValue(raw: string): { formatted: string; brand: CardBrand } {
  const digits = raw.replace(/\D/g, "");
  const brand = detectCardBrand(digits);

  if (brand === "amex") {
    // Amex: 4-6-5 digits (max 15)
    const limited = digits.slice(0, 15);
    const parts: string[] = [];
    if (limited.length > 0) parts.push(limited.slice(0, 4));
    if (limited.length > 4) parts.push(limited.slice(4, 10));
    if (limited.length > 10) parts.push(limited.slice(10, 15));
    return { formatted: parts.join(" "), brand };
  }

  // Standard: 4-4-4-4 digits (max 16)
  const limited = digits.slice(0, 16);
  const parts: string[] = [];
  for (let i = 0; i < limited.length; i += 4) {
    parts.push(limited.slice(i, i + 4));
  }
  return { formatted: parts.join(" "), brand };
}

// Format expiry into MM / YY
export function formatExpiryValue(raw: string, prev = ""): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (!digits) return "";

  // If user hit backspace over the slash
  if (raw.length < prev.length && (prev.endsWith(" / ") || prev.endsWith("/"))) {
    return digits.slice(0, digits.length - 1);
  }

  // First digit: if 2-9, auto-prefix with 0 -> e.g. "5" -> "05 / "
  if (digits.length === 1) {
    const num = parseInt(digits, 10);
    if (num > 1) {
      return `0${num} / `;
    }
    return digits;
  }

  let month = digits.slice(0, 2);
  const monthNum = parseInt(month, 10);
  if (monthNum > 12) {
    month = "12";
  } else if (monthNum === 0) {
    month = "01";
  }

  if (digits.length === 2) {
    return `${month} / `;
  }

  const year = digits.slice(2, 4);
  return `${month} / ${year}`;
}

export function VisaIcon({ className = "w-8 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="#0A2540" />
      <path
        d="M19.46 21H16.88L18.5 11H21.08L19.46 21ZM14.92 11L12.44 17.84L12.14 16.32L11.26 11.96C11.14 11.38 10.74 11 10.22 11H6.04L6 11.22C6.9 11.42 7.84 11.72 8.64 12.18C9.12 12.46 9.28 12.68 9.44 13.28L11.58 21H14.28L18.44 11H14.92ZM32.66 21H35.08L33 11H30.82C30.28 11 29.84 11.3 29.64 11.78L25.32 21H27.98L28.52 19.54H31.76L32.06 21H32.66ZM29.24 17.48L30.58 13.84L31.36 17.48H29.24ZM26.24 13.86L26.68 11.76C26.16 11.56 25.4 11.36 24.48 11.36C22.02 11.36 20.26 12.64 20.24 14.48C20.22 15.84 21.46 16.6 22.42 17.06C23.4 17.52 23.74 17.82 23.74 18.24C23.74 18.88 22.96 19.16 22.24 19.16C21.36 19.16 20.64 18.96 19.88 18.6L19.5 18.42L19.06 20.54C19.74 20.84 20.98 21.1 22.22 21.12C24.84 21.12 26.54 19.86 26.56 17.92C26.58 16.32 25.48 15.42 24.24 14.84C23.44 14.44 22.94 14.2 22.94 13.76C22.94 13.26 23.54 12.98 24.18 12.98C24.86 12.96 25.44 13.1 26.24 13.86Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function MastercardIcon({ className = "w-8 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="#1F2937" />
      <circle cx="18" cy="16" r="9" fill="#EB001B" />
      <circle cx="30" cy="16" r="9" fill="#F79E1B" fillOpacity="0.85" />
    </svg>
  );
}

export function AmexIcon({ className = "w-8 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="#0077A6" />
      <path
        d="M10 20.5L13.8 11.5H16.8L20.6 20.5H18.2L17.4 18.4H13.2L12.4 20.5H10ZM13.8 16.7H16.8L15.3 13.1L13.8 16.7ZM21.5 20.5V11.5H24.3L26.7 17.1L29.1 11.5H31.9V20.5H29.8V14.6L27.6 19.5H25.8L23.6 14.6V20.5H21.5ZM33.5 20.5V11.5H38.5V13.3H35.6V15.1H38.2V16.9H35.6V18.7H38.5V20.5H33.5Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function DiscoverIcon({ className = "w-8 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="#FF6000" />
      <circle cx="34" cy="16" r="7" fill="#FFFFFF" fillOpacity="0.25" />
      <text x="8" y="20" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
        DISCOVER
      </text>
    </svg>
  );
}

export function PaymentCardForm({
  cardHolder,
  setCardHolder,
  cardNumber,
  setCardNumber,
  cardExpiry,
  setCardExpiry,
  cardCvc,
  setCardCvc,
  error,
}: PaymentCardFormProps) {
  const brand = detectCardBrand(cardNumber);
  const expiryRef = useRef<HTMLInputElement>(null);
  const cvcRef = useRef<HTMLInputElement>(null);
  const [showCvc, setShowCvc] = useState(false);

  // Handle number change with dynamic spacing
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { formatted, brand: detected } = formatCardNumberValue(e.target.value);
    setCardNumber(formatted);

    // Auto-advance to expiry if max length reached
    const maxDigits = detected === "amex" ? 15 : 16;
    const cleanDigits = formatted.replace(/\D/g, "");
    if (cleanDigits.length === maxDigits && expiryRef.current) {
      expiryRef.current.focus();
    }
  };

  // Handle expiry change with dynamic MM / YY formatting
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryValue(e.target.value, cardExpiry);
    setCardExpiry(formatted);

    // Auto-advance to CVC if complete (MM / YY = 7 chars)
    if (formatted.length === 7 && cvcRef.current) {
      cvcRef.current.focus();
    }
  };

  // Handle CVC change
  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const max = brand === "amex" ? 4 : 3;
    const digits = e.target.value.replace(/\D/g, "").slice(0, max);
    setCardCvc(digits);
  };

  // One-click demo test fill
  const handleFillTestCard = () => {
    setCardHolder("Alex Customer");
    setCardNumber("4242 4242 4242 4242");
    setCardExpiry("12 / 28");
    setCardCvc("123");
  };

  return (
    <div className="space-y-4">
      {/* Security & Supported Networks Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-[#D1E7D8] shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-[#E8F8EE] flex items-center justify-center text-[#00A86B] shrink-0 border border-[#A2E4B8]/40">
            <Lock className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#0A504A] block">256-Bit SSL Encrypted Payment</span>
            <span className="text-[10px] text-gray-500 block">Bank-grade TLS with atomic escrow protection</span>
          </div>
        </div>

        {/* Accepted Brand Badges & Test Autofill */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 opacity-90">
            <VisaIcon className="w-7 h-4.5" />
            <MastercardIcon className="w-7 h-4.5" />
            <AmexIcon className="w-7 h-4.5" />
            <DiscoverIcon className="w-7 h-4.5" />
          </div>

          <button
            type="button"
            onClick={handleFillTestCard}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#E8F8EE] hover:bg-[#00A86B] hover:text-white border border-[#00A86B]/30 text-[10px] font-bold text-[#00A86B] transition-all cursor-pointer shadow-2xs"
            title="Fill with standard 4242 test card details"
          >
            <Sparkles className="w-3 h-3" />
            <span>Test Card</span>
          </button>
        </div>
      </div>

      {/* Form Input Fields */}
      <div className="space-y-4">
        {/* Field 1: Cardholder Name */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#00A86B]" />
              <span>Cardholder Full Name</span>
            </label>
            <span className="text-[10px] text-gray-400 font-medium">As shown on card</span>
          </div>
          <div className="relative">
            <input
              type="text"
              value={cardHolder}
              onChange={(e) => setCardHolder(e.target.value)}
              placeholder="e.g. Alex Customer"
              className="w-full pl-3.5 pr-4 py-2.5 rounded-xl bg-white border border-gray-300 text-xs font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/20 transition-all shadow-xs"
            />
          </div>
        </div>

        {/* Field 2: Card Number (With 4-digit spacing and real brand logo) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-[#00A86B]" />
              <span>Card Number</span>
            </label>
            <span className="text-[10px] text-gray-400 font-mono">16 digits (or 15 for Amex)</span>
          </div>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={cardNumber}
              onChange={handleCardNumberChange}
              placeholder="4242  4242  4242  4242"
              maxLength={19}
              className="w-full pl-3.5 pr-14 py-2.5 rounded-xl bg-white border border-gray-300 font-mono text-sm font-bold tracking-wider text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/20 transition-all shadow-xs"
            />

            {/* Dynamic Card Brand Badge inside Input */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
              {brand === "visa" && <VisaIcon className="w-7 h-4.5" />}
              {brand === "mastercard" && <MastercardIcon className="w-7 h-4.5" />}
              {brand === "amex" && <AmexIcon className="w-7 h-4.5" />}
              {brand === "discover" && <DiscoverIcon className="w-7 h-4.5" />}
              {brand === "generic" && <CreditCard className="w-4 h-4 text-gray-400" />}
            </div>
          </div>
        </div>

        {/* Fields 3 & 4: Expiration Date & Security Code */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Expiration Date (Auto formatted MM / YY) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#00A86B]" />
                <span>Expiration Date</span>
              </label>
              <span className="text-[10px] text-gray-400 font-mono">MM / YY</span>
            </div>
            <div className="relative">
              <input
                ref={expiryRef}
                type="text"
                inputMode="numeric"
                value={cardExpiry}
                onChange={handleExpiryChange}
                placeholder="MM / YY"
                maxLength={7}
                className="w-full pl-3.5 pr-4 py-2.5 rounded-xl bg-white border border-gray-300 font-mono text-xs font-bold text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/20 transition-all shadow-xs"
              />
            </div>
          </div>

          {/* Security CVC */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#00A86B]" />
                <span>Security Code (CVC)</span>
              </label>
              <span className="text-[10px] text-gray-400 font-mono">
                {brand === "amex" ? "4 digits" : "3 digits"}
              </span>
            </div>
            <div className="relative">
              <input
                ref={cvcRef}
                type={showCvc ? "text" : "password"}
                inputMode="numeric"
                value={cardCvc}
                onChange={handleCvcChange}
                placeholder={brand === "amex" ? "••••" : "•••"}
                maxLength={brand === "amex" ? 4 : 3}
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-white border border-gray-300 font-mono text-xs font-bold text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/20 transition-all shadow-xs"
              />

              <button
                type="button"
                onClick={() => setShowCvc(!showCvc)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                title={showCvc ? "Hide CVC" : "Show CVC"}
              >
                {showCvc ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2 animate-shake">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Escrow Assurance Note */}
      <div className="flex items-start gap-2 pt-1 text-[11px] text-gray-600">
        <ShieldCheck className="w-4 h-4 text-[#00A86B] shrink-0 mt-0.5" />
        <span>
          <strong>Buyer Escrow Protection:</strong> Payment remains securely escrowed in the platform reserve until your delivery is completed and verified.
        </span>
      </div>
    </div>
  );
}
