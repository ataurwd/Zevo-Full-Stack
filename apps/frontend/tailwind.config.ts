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
      fontFamily: {
        sans: ["var(--font-manrope)", "Manrope", "sans-serif"],
        serif: ["var(--font-manrope)", "Manrope", "sans-serif"],
        manrope: ["var(--font-manrope)", "Manrope", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        void: "#06080e",
        obsidian: "#0a0e1a",
        // Emerald Canopy 4-Color Palette:
        // #00A86B (Vibrant Emerald Primary)
        // #A2E4B8 (Soft Mint Canopy Accent)
        // #0A504A (Deep Forest Contrast)
        // #F7F7F2 (Warm Crisp Canvas Background)
        emeraldCanopy: {
          primary: "#00A86B",
          mint: "#A2E4B8",
          forest: "#0A504A",
          canvas: "#F7F7F2",
          lightMint: "#E8F8EE",
          darkForest: "#073A36",
        },
        plum: {
          dark: "#0A504A",
          primary: "#00A86B",
          accent: "#A2E4B8",
          light: "#E8F8EE",
          cream: "#F7F7F2",
        },
        brand: {
          50: "#F7F7F2",
          100: "#E8F8EE",
          200: "#C7F1D6",
          300: "#A2E4B8",
          400: "#48C78E",
          500: "#00A86B",
          600: "#00945E",
          700: "#0B6B56",
          800: "#0A504A",
          900: "#073A36",
          950: "#042321",
        },
        nexora: {
          50: "#F7F7F2",
          100: "#E8F8EE",
          200: "#C7F1D6",
          300: "#A2E4B8",
          400: "#48C78E",
          500: "#00A86B",
          600: "#00945E",
          700: "#0B6B56",
          800: "#0A504A",
          900: "#073A36",
          950: "#042321",
        },
        primary: {
          DEFAULT: "#00A86B",
          dark: "#0A504A",
          accent: "#A2E4B8",
          light: "#E8F8EE",
          canvas: "#F7F7F2",
        },
        blue: {
          50: "#F7F7F2",
          100: "#E8F8EE",
          200: "#C7F1D6",
          300: "#A2E4B8",
          400: "#48C78E",
          500: "#00A86B",
          600: "#00945E",
          700: "#0B6B56",
          800: "#0A504A",
          900: "#073A36",
          950: "#042321",
        },
        indigo: {
          50: "#F7F7F2",
          100: "#E8F8EE",
          200: "#C7F1D6",
          300: "#A2E4B8",
          400: "#48C78E",
          500: "#00A86B",
          600: "#00945E",
          700: "#0B6B56",
          800: "#0A504A",
          900: "#073A36",
          950: "#042321",
        },
        glass: {
          surface: "rgba(255, 255, 255, 0.92)",
          elevated: "rgba(255, 255, 255, 0.98)",
          subtle: "rgba(247, 247, 242, 0.70)",
          border: "#D1E7D8",
          "border-subtle": "rgba(162, 228, 184, 0.4)",
          "border-active": "#00A86B",
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
        "hero-slide-in": "heroSlideIn 0.65s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "hero-fade-up": "heroFadeUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "hero-zoom-scale": "heroZoomScale 0.65s cubic-bezier(0.22, 1, 0.36, 1) forwards",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "50%": { transform: "translate(15px, -20px) scale(1.05)" },
        },
        heroSlideIn: {
          "0%": { opacity: "0", transform: "translateX(48px) scale(0.97)" },
          "100%": { opacity: "1", transform: "translateX(0px) scale(1)" },
        },
        heroFadeUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0px)" },
        },
        heroZoomScale: {
          "0%": { opacity: "0", transform: "scale(1.07)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
