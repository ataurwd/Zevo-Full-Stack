import React from "react";

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function GlassButton({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  className = "",
  disabled,
  ...props
}: GlassButtonProps) {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3.5 text-base font-bold",
  }[size];

  const variantClasses = {
    primary: "liquid-btn-primary",
    secondary: "liquid-btn-secondary",
    danger:
      "bg-rose-600/80 hover:bg-rose-600 text-white border border-rose-500/40 shadow-lg shadow-rose-600/30",
    ghost:
      "bg-transparent hover:bg-white/[0.06] text-slate-300 hover:text-white border border-transparent",
  }[variant];

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
}
