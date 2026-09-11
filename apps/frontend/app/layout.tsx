import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "../providers/QueryProvider";
import { AuthProvider } from "../providers/AuthProvider";
import { CartProvider } from "../providers/CartProvider";
import { CartDrawer } from "../components/cart/CartDrawer";
import { LiquidBackground } from "../components/ui/LiquidBackground";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "NEXORA — Multi-Vendor Commerce & Hyperlocal Logistics",
  description: "High-performance multi-vendor marketplace with real-time delivery tracking, multi-vendor cart routing, and instant payouts.",
  keywords: ["marketplace", "multi-vendor", "hyperlocal", "logistics", "delivery", "ecommerce", "real-time tracking"],
  authors: [{ name: "NEXORA Core Team" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased selection:bg-indigo-500 selection:text-white bg-[#070a12] text-slate-100 min-h-screen relative`}>
        <LiquidBackground />
        <QueryProvider>
          <AuthProvider>
            <CartProvider>
              <div className="relative z-10 min-h-screen flex flex-col">
                {children}
              </div>
              <CartDrawer />
            </CartProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
