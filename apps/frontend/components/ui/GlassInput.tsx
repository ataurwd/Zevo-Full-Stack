import React from "react";

export interface GlassInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function GlassInput({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = "",
  id,
  ...props
}: GlassInputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-slate-300"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center">
            {leftIcon}
          </div>
        )}

        <input
          id={inputId}
          className={`liquid-glass-input w-full ${leftIcon ? "pl-10" : ""} ${
            rightIcon ? "pr-10" : ""
          } ${
            error
              ? "border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/20"
              : ""
          } ${className}`}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3 text-slate-400 pointer-events-none flex items-center">
            {rightIcon}
          </div>
        )}
      </div>

      {error ? (
        <p className="text-xs text-rose-400 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}
