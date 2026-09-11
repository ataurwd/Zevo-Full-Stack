import React from "react";

export interface GlassBadgeProps {
  children: React.ReactNode;
  variant?: "emerald" | "amber" | "rose" | "cyan" | "indigo" | "slate";
  dot?: boolean;
  className?: string;
}

export function GlassBadge({
  children,
  variant = "indigo",
  dot = true,
  className = "",
}: GlassBadgeProps) {
  const variantStyles = {
    emerald: {
      badge: "liquid-badge-emerald",
      dot: "bg-emerald-400 shadow-[0_0_8px_#10b981]",
    },
    amber: {
      badge: "liquid-badge-amber",
      dot: "bg-amber-400 shadow-[0_0_8px_#f59e0b]",
    },
    rose: {
      badge: "liquid-badge-rose",
      dot: "bg-rose-400 shadow-[0_0_8px_#f43f5e]",
    },
    cyan: {
      badge: "liquid-badge-cyan",
      dot: "bg-cyan-400 shadow-[0_0_8px_#06b6d4]",
    },
    indigo: {
      badge: "liquid-badge-indigo",
      dot: "bg-indigo-400 shadow-[0_0_8px_#6366f1]",
    },
    slate: {
      badge: "bg-slate-800/60 border border-white/[0.08] text-slate-400",
      dot: "bg-slate-400",
    },
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md ${variantStyles.badge} ${className}`}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full animate-pulse-slow ${variantStyles.dot}`}
        />
      )}
      <span>{children}</span>
    </span>
  );
}
