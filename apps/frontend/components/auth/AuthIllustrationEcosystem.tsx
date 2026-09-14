"use client";

import React from "react";

export function AuthIllustrationEcosystem({ className = "" }: { className?: string }) {
  return (
    <div className={`relative w-full h-full flex items-center justify-center overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 520 520"
        className="w-full h-full object-contain select-none pointer-events-none drop-shadow-xl"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="regWaveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e40af" />
            <stop offset="50%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
          <linearGradient id="regGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="storeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="boxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <filter id="regSoftShadow" x="-10%" y="-10%" width="125%" height="125%">
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#0f172a" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Dynamic Curved Fluid Wave Backdrop */}
        <path
          d="M-40 -40 L360 -40 C300 130 330 220 260 320 C200 410 140 460 -40 540 Z"
          fill="url(#regWaveGrad)"
        />
        <path
          d="M-40 -40 L290 -40 C230 130 260 220 200 330 C130 430 70 470 -40 540 Z"
          fill="url(#regGlowGrad)"
        />

        {/* Ground Floor Shadow */}
        <ellipse cx="260" cy="450" rx="190" ry="22" fill="#0f172a" fillOpacity="0.06" />

        {/* Modern Smartphone / Marketplace Store Mockup */}
        <g filter="url(#regSoftShadow)">
          {/* Smartphone Frame */}
          <rect x="230" y="140" width="160" height="270" rx="28" fill="url(#storeGrad)" stroke="#334155" strokeWidth="4" />
          {/* Screen Inner */}
          <rect x="238" y="152" width="144" height="246" rx="20" fill="#f8fafc" />
          {/* Speaker bar */}
          <rect x="285" y="147" width="50" height="4" rx="2" fill="#475569" />

          {/* Store App Header */}
          <rect x="246" y="165" width="128" height="34" rx="10" fill="#2563eb" />
          <circle cx="262" cy="182" r="7" fill="#ffffff" />
          <rect x="275" y="177" width="60" height="4" rx="2" fill="#ffffff" />
          <rect x="275" y="184" width="35" height="3" rx="1.5" fill="#93c5fd" />

          {/* Grid Products on Screen */}
          <rect x="246" y="208" width="60" height="52" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
          <rect x="254" y="215" width="44" height="24" rx="4" fill="#eff6ff" />
          <rect x="254" y="244" width="35" height="3" rx="1.5" fill="#0f172a" />
          <rect x="254" y="250" width="20" height="3" rx="1.5" fill="#2563eb" />

          <rect x="314" y="208" width="60" height="52" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
          <rect x="322" y="215" width="44" height="24" rx="4" fill="#eff6ff" />
          <rect x="322" y="244" width="35" height="3" rx="1.5" fill="#0f172a" />
          <rect x="322" y="250" width="20" height="3" rx="1.5" fill="#2563eb" />

          {/* Dispatch Status Pill */}
          <rect x="246" y="270" width="128" height="42" rx="10" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="1.5" />
          <circle cx="262" cy="291" r="7" fill="#10b981" />
          <path d="M259 291 L261 293 L265 289" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="275" y="284" width="70" height="4" rx="2" fill="#166534" />
          <rect x="275" y="292" width="45" height="3" rx="1.5" fill="#22c55e" />

          {/* Bottom Nav Bar */}
          <rect x="246" y="365" width="128" height="22" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
          <circle cx="262" cy="376" r="4" fill="#2563eb" />
          <circle cx="288" cy="376" r="4" fill="#94a3b8" />
          <circle cx="314" cy="376" r="4" fill="#94a3b8" />
          <circle cx="340" cy="376" r="4" fill="#94a3b8" />
        </g>

        {/* Courier / Delivery Scooter Figure (Foreground Left) */}
        <g filter="url(#regSoftShadow)">
          {/* Scooter Rear & Front Wheels */}
          <circle cx="110" cy="430" r="26" fill="#1e293b" />
          <circle cx="110" cy="430" r="14" fill="#64748b" />
          <circle cx="110" cy="430" r="6" fill="#cbd5e1" />

          <circle cx="215" cy="430" r="26" fill="#1e293b" />
          <circle cx="215" cy="430" r="14" fill="#64748b" />
          <circle cx="215" cy="430" r="6" fill="#cbd5e1" />

          {/* Scooter Chassis & Body */}
          <path d="M100 420 L160 420 L180 375 L215 375 L200 420 Z" fill="#2563eb" />
          {/* Front Fork & Handlebars */}
          <rect x="204" y="340" width="8" height="85" rx="3" transform="rotate(-15 204 340)" fill="#475569" />
          <rect x="180" y="335" width="36" height="7" rx="3" fill="#1e293b" />
          {/* Headlight */}
          <circle cx="215" cy="360" r="7" fill="#fef08a" />
          {/* Scooter Seat */}
          <rect x="115" y="380" width="45" height="12" rx="5" fill="#0f172a" />

          {/* Delivery Parcel Cargo Box */}
          <rect x="75" y="335" width="45" height="50" rx="6" fill="url(#boxGrad)" />
          {/* Box Tape */}
          <rect x="75" y="355" width="45" height="10" fill="#fbbf24" fillOpacity="0.8" />
          {/* Nexora Express Logo on Box */}
          <circle cx="97" cy="345" r="4" fill="#ffffff" />
        </g>

        {/* Delivery Courier Rider Character */}
        <g>
          {/* Courier Helmet (Cyan / Blue) */}
          <ellipse cx="152" cy="270" rx="16" ry="17" fill="#38bdf8" />
          <path d="M140 274 C140 286 164 286 164 274 Z" fill="#0f172a" />
          {/* Visor */}
          <rect x="150" y="265" width="15" height="8" rx="3" fill="#0284c7" />

          {/* Jacket / Uniform (Navy & White) */}
          <path d="M135 287 L170 287 L175 365 L130 365 Z" fill="#1e40af" />
          <path d="M148 287 L157 287 L155 365 L150 365 Z" fill="#ffffff" />

          {/* Arms holding Handlebar */}
          <path d="M165 305 L190 335 L182 342 L158 315 Z" fill="#2563eb" />
          <circle cx="190" cy="337" r="5" fill="#0f172a" />

          {/* Rider Legs */}
          <path d="M140 365 L165 370 L170 415 L150 415 L145 385 L130 380 Z" fill="#0f172a" />
          <ellipse cx="165" cy="418" rx="14" ry="5" fill="#334155" />
        </g>

        {/* Ambient Floating Trust Metrics */}
        <g filter="url(#regSoftShadow)">
          {/* Floating Speed Tag */}
          <rect x="40" y="180" width="130" height="42" rx="12" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
          <circle cx="60" cy="201" r="10" fill="#ecfdf5" />
          <path d="M57 201 L64 195 L61 202 L66 202 L58 208 L60 203 Z" fill="#10b981" />
          <text x="76" y="196" fill="#0f172a" fontSize="10" fontWeight="bold">Instant Payouts</text>
          <text x="76" y="208" fill="#64748b" fontSize="8">Same-day settlement</text>
        </g>

        {/* Lush Greenery at Base (Right) */}
        <g opacity="0.9">
          <path d="M410 435 C420 375 450 350 460 360 C470 370 440 415 410 435 Z" fill="#10b981" />
          <path d="M415 435 C440 395 470 390 475 405 C480 420 445 435 415 435 Z" fill="#34d399" />
          <circle cx="435" cy="375" r="3" fill="#ffffff" />
          <circle cx="455" cy="415" r="2.5" fill="#ffffff" />
        </g>
      </svg>
    </div>
  );
}
