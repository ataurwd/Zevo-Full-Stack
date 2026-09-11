import React from "react";

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  interactive?: boolean;
  glow?: "indigo" | "cyan" | "emerald" | "amber" | "rose" | "none";
  className?: string;
}

export function GlassCard({
  children,
  interactive = false,
  glow = "none",
  className = "",
  ...props
}: GlassCardProps) {
  const glowClasses = {
    none: "",
    indigo: "hover:shadow-glow-indigo",
    cyan: "hover:shadow-glow-cyan",
    emerald: "hover:shadow-glow-emerald",
    amber: "hover:shadow-glow-amber",
    rose: "hover:shadow-glow-rose",
  }[glow];

  const baseClass = interactive
    ? "liquid-glass-card-interactive"
    : "liquid-glass-card";

  return (
    <div
      className={`${baseClass} ${glowClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
