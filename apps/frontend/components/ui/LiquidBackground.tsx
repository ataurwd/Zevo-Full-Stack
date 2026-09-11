"use client";

import React from "react";

export function LiquidBackground() {
  return (
    <div className="liquid-mesh-container" aria-hidden="true">
      {/* Soft light base canvas */}
      <div className="absolute inset-0 bg-[#f8fafc]/90" />

      {/* Floating glowing pastel orbs */}
      <div className="liquid-orb liquid-orb-1" />
      <div className="liquid-orb liquid-orb-2" />
      <div className="liquid-orb liquid-orb-3" />

      {/* Fine-grained ambient grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#0f172a 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
      />
    </div>
  );
}
