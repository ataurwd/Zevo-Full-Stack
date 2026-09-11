import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./providers/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        void: "#06080e",
        obsidian: "#0a0e1a",
        glass: {
          surface: "rgba(15, 23, 42, 0.65)",
          elevated: "rgba(15, 23, 42, 0.85)",
          subtle: "rgba(15, 23, 42, 0.40)",
          border: "rgba(255, 255, 255, 0.10)",
          "border-subtle": "rgba(255, 255, 255, 0.06)",
          "border-active": "rgba(99, 102, 241, 0.45)",
        },
        nexora: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.12)",
        "glass-hover": "0 16px 40px -10px rgba(99, 102, 241, 0.28), inset 0 1px 0 0 rgba(255, 255, 255, 0.18)",
        "glow-indigo": "0 0 35px -5px rgba(99, 102, 241, 0.4)",
        "glow-cyan": "0 0 35px -5px rgba(6, 182, 212, 0.4)",
        "glow-emerald": "0 0 35px -5px rgba(16, 185, 129, 0.4)",
        "glow-amber": "0 0 35px -5px rgba(245, 158, 11, 0.4)",
        "glow-rose": "0 0 35px -5px rgba(244, 63, 94, 0.4)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "liquid-float": "float 8s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "50%": { transform: "translate(15px, -20px) scale(1.05)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
