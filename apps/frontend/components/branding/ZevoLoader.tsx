"use client";

import React from "react";
import Image from "next/image";

export interface ZevoLoaderProps {
  fullScreen?: boolean;
  size?: "sm" | "md" | "lg" | "responsive";
  className?: string;
  showText?: boolean;
}

export function ZevoLoader({
  fullScreen = true,
  size = "responsive",
  className = "",
  showText = true,
}: ZevoLoaderProps) {
  // Configured dimensions for different size modes
  const isFixedSm = size === "sm";
  const isFixedMd = size === "md";
  const isFixedLg = size === "lg";

  const containerSize = isFixedSm
    ? "w-20 h-20"
    : isFixedMd
    ? "w-28 h-28"
    : isFixedLg
    ? "w-36 h-36"
    : "w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44";

  const iconSize = isFixedSm
    ? "w-12 h-12"
    : isFixedMd
    ? "w-16 h-16"
    : isFixedLg
    ? "w-20 h-20"
    : "w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24";

  return (
    <div
      className={`relative flex flex-col items-center justify-center select-none ${
        fullScreen ? "min-h-screen w-full bg-[#F7F7F2]" : ""
      } ${className}`}
    >
      {/* Dynamic Ambient Emerald Aurora Glow */}
      <div className="absolute w-56 h-56 sm:w-72 sm:h-72 md:w-96 md:h-96 rounded-full bg-[#00A86B]/15 blur-3xl animate-pulse pointer-events-none" />

      {/* Main Orbital Stage */}
      <div className="relative flex flex-col items-center justify-center gap-6">
        <div className={`relative ${containerSize} flex items-center justify-center`}>
          {/* Outer Rapid Track Accent */}
          <div
            className="absolute -inset-2 rounded-full border-2 border-transparent border-t-[#00A86B] border-l-[#A2E4B8] animate-spin"
            style={{ animationDuration: "1.8s" }}
          />

          {/* Secondary Counter-Rotating Orbital Ring */}
          <div
            className="absolute -inset-4 rounded-full border border-dashed border-[#00A86B]/30 animate-spin"
            style={{ animationDuration: "6s", animationDirection: "reverse" }}
          />

          {/* Pure Luminous White Glass Pod with Rich Soft Shadows (high contrast) */}
          <div className="absolute inset-0 rounded-full bg-white shadow-2xl shadow-[#00A86B]/20 border-2 border-[#D1E7D8] flex items-center justify-center" />

          {/* Zevo Brand Icon with Elegant Pulse */}
          <div className={`relative z-10 ${iconSize} flex items-center justify-center animate-pulse`} style={{ animationDuration: "2.2s" }}>
            <Image
              src="/images/branding/zevo-icon.png"
              alt="Zevo"
              width={96}
              height={96}
              className="object-contain w-full h-full drop-shadow-md select-none"
              priority
            />
          </div>
        </div>

        {/* Minimal High-End Typography & Breathing Indicator */}
        {showText && (
          <div className="flex flex-col items-center gap-2 animate-fade-in">
            <span className="text-[#0A504A] font-extrabold text-xs sm:text-sm tracking-[0.35em] uppercase pl-[0.35em]">
              ZEVO
            </span>
            {/* Sleek Gradient Shimmer Bar */}
            <div className="w-16 sm:w-20 h-1 rounded-full bg-[#E0F2E9] overflow-hidden">
              <div className="w-full h-full bg-gradient-to-r from-transparent via-[#00A86B] to-transparent animate-pulse" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ZevoLoader;
