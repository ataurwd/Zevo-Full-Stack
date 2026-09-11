import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "../providers/QueryProvider";
import { AuthProvider } from "../providers/AuthProvider";
import { CartProvider } from "../providers/CartProvider";
import { CartDrawer } from "../components/cart/CartDrawer";

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
      <body className={`${inter.variable} antialiased selection:bg-indigo-500 selection:text-white`}>
        <QueryProvider>
          <AuthProvider>
            <CartProvider>
              {children}
              <CartDrawer />
            </CartProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
