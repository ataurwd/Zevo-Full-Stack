"use client";

import React from "react";

export function LiquidBackground() {
  return (
    <div className="liquid-mesh-container" aria-hidden="true">
      {/* Deep Obsidian base gradient */}
      <div className="absolute inset-0 bg-[#070a12]/95" />

      {/* Floating glowing orbs */}
      <div className="liquid-orb liquid-orb-1" />
      <div className="liquid-orb liquid-orb-2" />
      <div className="liquid-orb liquid-orb-3" />

      {/* Fine-grained ambient noise texture / grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />
    </div>
  );
}
