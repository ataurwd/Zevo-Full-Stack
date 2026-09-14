import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "../providers/QueryProvider";
import { AuthProvider } from "../providers/AuthProvider";
import { CartProvider } from "../providers/CartProvider";
import { SocketProvider } from "../providers/SocketProvider";
import { CartDrawer } from "../components/cart/CartDrawer";
import { SupportChatWidget } from "../components/chat/SupportChatWidget";
import { LiquidBackground } from "../components/ui/LiquidBackground";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "ZEVO — Multi-Vendor Commerce & Hyperlocal Logistics",
  description: "High-performance multi-vendor marketplace with real-time delivery tracking, multi-vendor cart routing, and instant payouts.",
  keywords: ["zevo", "marketplace", "multi-vendor", "hyperlocal", "logistics", "delivery", "ecommerce", "real-time tracking"],
  authors: [{ name: "ZEVO Core Team" }],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/images/branding/zevo-icon.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/images/branding/zevo-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
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
    <html lang="en">
      <body className={`${inter.variable} antialiased selection:bg-[#00A86B] selection:text-white bg-white text-[#0A504A] min-h-screen relative`}>
        <LiquidBackground />
        <QueryProvider>
          <AuthProvider>
            <SocketProvider>
              <CartProvider>
                <div className="relative z-10 min-h-screen flex flex-col">
                  {children}
                </div>
                <CartDrawer />
                <SupportChatWidget />
              </CartProvider>
            </SocketProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
