"use client";

import React from "react";

export function AuthIllustrationDesk({ className = "" }: { className?: string }) {
  return (
    <div className={`relative w-full h-full flex items-center justify-center overflow-hidden ${className}`}>
      {/* Background Fluid Wave in Royal Blue */}
      <svg
        viewBox="0 0 520 520"
        className="w-full h-full object-contain select-none pointer-events-none drop-shadow-xl"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1d4ed8" />
            <stop offset="60%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="glowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="deskGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#78350f" />
            <stop offset="100%" stopColor="#451a03" />
          </linearGradient>
          <linearGradient id="screenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
          <filter id="softShadow" x="-10%" y="-10%" width="125%" height="125%">
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#0f172a" floodOpacity="0.12" />
          </filter>
        </defs>

        {/* Dynamic Curved Fluid Backdrop (Matches the docjus reference wave) */}
        <path
          d="M-40 -40 L340 -40 C280 120 310 200 250 300 C190 400 130 460 -40 540 Z"
          fill="url(#waveGrad)"
        />
        <path
          d="M-40 -40 L280 -40 C220 130 250 220 190 320 C130 420 80 470 -40 540 Z"
          fill="url(#glowGrad)"
        />

        {/* Ambient Floor Shadow */}
        <ellipse cx="270" cy="450" rx="190" ry="24" fill="#0f172a" fillOpacity="0.06" />

        {/* Modern Potted Office Plant (Left) */}
        <g filter="url(#softShadow)">
          {/* Pot */}
          <path d="M72 380 L118 380 L110 440 L80 440 Z" fill="#334155" />
          <ellipse cx="95" cy="380" rx="23" ry="5" fill="#475569" />
          
          {/* Broad Leaves */}
          <path
            d="M95 380 C80 320 40 310 30 330 C20 350 70 370 95 380 Z"
            fill="#10b981"
          />
          <path
            d="M95 380 C60 300 80 260 100 270 C120 280 110 340 95 380 Z"
            fill="#059669"
          />
          <path
            d="M95 380 C110 310 150 300 155 320 C160 340 120 365 95 380 Z"
            fill="#34d399"
          />
          <path
            d="M95 380 C90 330 65 345 50 360 C55 375 80 380 95 380 Z"
            fill="#047857"
          />
          {/* Plant Veins */}
          <path d="M95 380 Q75 325 35 330" stroke="#047857" strokeWidth="1.5" fill="none" />
          <path d="M95 380 Q90 300 100 270" stroke="#047857" strokeWidth="1.5" fill="none" />
          <path d="M95 380 Q120 320 152 322" stroke="#059669" strokeWidth="1.5" fill="none" />
        </g>

        {/* Office Desk */}
        <g filter="url(#softShadow)">
          {/* Desk Main Surface */}
          <rect x="180" y="275" width="220" height="12" rx="4" fill="url(#deskGrad)" />
          {/* Desk Side Panel / Modesty Board */}
          <path d="M305 287 L385 287 L385 430 L305 430 Z" fill="#581c87" fillOpacity="0" />
          <rect x="310" y="287" width="75" height="143" rx="3" fill="#3f1f10" />
          {/* Desk Legs (Left Steel Leg) */}
          <rect x="210" y="287" width="8" height="143" rx="2" fill="#64748b" />
          <rect x="200" y="426" width="28" height="6" rx="2" fill="#475569" />
          {/* Right Support Base */}
          <rect x="306" y="426" width="84" height="6" rx="2" fill="#291206" />
        </g>

        {/* Desktop Monitor on Desk */}
        <g filter="url(#softShadow)">
          {/* Stand Base */}
          <ellipse cx="320" cy="275" rx="22" ry="4" fill="#1e293b" />
          {/* Neck */}
          <rect x="317" y="255" width="6" height="20" rx="1" fill="#475569" />
          {/* Screen Outer */}
          <rect x="270" y="185" width="100" height="72" rx="7" fill="url(#screenGrad)" />
          {/* Screen Inner Display */}
          <rect x="274" y="189" width="92" height="64" rx="5" fill="#0f172a" />
          {/* Screen Content: Marketplace Analytics Chart */}
          <path d="M280 235 L292 225 L304 230 L318 215 L332 220 L346 205 L358 212" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <rect x="280" y="196" width="26" height="4" rx="2" fill="#3b82f6" />
          <circle cx="355" cy="198" r="3" fill="#10b981" />
        </g>

        {/* Office Swivel Chair */}
        <g>
          {/* Base & Wheels */}
          <ellipse cx="215" cy="435" rx="35" ry="6" fill="#334155" />
          <circle cx="185" cy="437" r="4" fill="#1e293b" />
          <circle cx="215" cy="439" r="4" fill="#1e293b" />
          <circle cx="245" cy="437" r="4" fill="#1e293b" />
          <rect x="212" y="375" width="6" height="60" fill="#94a3b8" />
          
          {/* Chair Seat */}
          <rect x="180" y="360" width="70" height="16" rx="8" fill="#1e293b" />
          {/* Chair Backrest */}
          <path d="M175 220 C165 220 160 260 160 320 C160 360 170 365 185 365 C190 365 190 345 190 320 C190 260 185 220 175 220 Z" fill="#1e293b" />
        </g>

        {/* The Professional Figure (Matches the docjus pose) */}
        <g>
          {/* Legs / Trousers in Bright Blue */}
          {/* Left Thigh & Leg */}
          <path d="M205 340 L270 340 L275 425 L245 425 L240 370 L205 370 Z" fill="#2563eb" />
          {/* Right Thigh & Leg (Folded forward towards pedals) */}
          <path d="M220 345 L290 350 L320 425 L290 435 L270 375 L220 370 Z" fill="#1d4ed8" />

          {/* Shoes (Dark Slate / Brown) */}
          <ellipse cx="258" cy="432" rx="16" ry="6" fill="#1e293b" />
          <ellipse cx="316" cy="437" rx="18" ry="7" fill="#0f172a" />

          {/* Torso & Shirt (Crisp White Shirt) */}
          <path d="M200 220 L260 220 L275 345 L195 345 Z" fill="#ffffff" filter="url(#softShadow)" />
          {/* Necktie (Vibrant Green) */}
          <path d="M228 225 L234 225 L237 295 L231 310 L225 295 Z" fill="#10b981" />
          {/* Shirt Collar */}
          <path d="M218 218 L228 230 L238 218 L244 230 L250 218" stroke="#cbd5e1" strokeWidth="2" fill="none" />

          {/* Left Arm resting toward keyboard / desk */}
          <path d="M255 230 C270 240 285 260 300 275 C295 280 280 280 270 270 C260 258 250 245 245 235 Z" fill="#ffffff" />
          <circle cx="302" cy="275" r="5" fill="#fbcfe8" />

          {/* Head & Neck */}
          <rect x="225" y="195" width="14" height="25" rx="3" fill="#fed7aa" />
          {/* Face */}
          <path d="M222 170 C222 155 242 155 242 170 C242 195 222 195 222 170 Z" fill="#fed7aa" />
          {/* Hair (Modern Black Styled Hair) */}
          <path d="M218 172 C216 150 234 140 248 145 C255 150 250 165 242 165 C238 165 238 160 232 160 C226 160 224 172 218 172 Z" fill="#0f172a" />

          {/* Right Arm holding Coffee Mug */}
          <path d="M215 230 C205 250 215 280 238 280 C248 280 250 270 245 265 C235 265 228 250 232 235 Z" fill="#ffffff" />
          <circle cx="242" cy="272" r="5" fill="#fed7aa" />
          {/* Red Coffee Mug */}
          <rect x="242" y="262" width="12" height="15" rx="3" fill="#ef4444" />
          <path d="M254 265 C258 265 258 273 254 273" stroke="#ef4444" strokeWidth="2" fill="none" />
          {/* Hot Steam */}
          <path d="M246 256 Q248 250 246 244" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.6" />
          <path d="M250 257 Q252 252 250 246" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.6" />
        </g>

        {/* Ambient Decorative Leaves & Accent Dots (Right of desk) */}
        <g opacity="0.85">
          <path d="M380 430 C390 370 420 340 430 350 C440 360 410 410 380 430 Z" fill="#10b981" />
          <path d="M385 430 C410 390 440 380 445 395 C450 410 415 430 385 430 Z" fill="#34d399" />
          <circle cx="410" cy="370" r="3" fill="#ffffff" />
          <circle cx="430" cy="410" r="2.5" fill="#ffffff" />
        </g>
      </svg>
    </div>
  );
}
