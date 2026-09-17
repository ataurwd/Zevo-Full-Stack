"use client";

import React from "react";
import Link from "next/link";
import { ZevoLogo } from "./branding/ZevoLogo";
import { ShieldCheck, Truck, Sparkles, Headphones, CheckCircle2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full bg-[#0A504A] text-white pt-16 pb-12 mt-12 border-t border-[#00A86B]/30 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-[#00A86B]/30">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <ZevoLogo variant="full" inverted size="lg" subtitle="Atelier & Retail" />
            </Link>
            <p className="text-xs sm:text-sm text-emerald-50/90 max-w-sm leading-relaxed font-normal">
              Farm-fresh organics and modern lifestyle essentials delivered with lightning speed, precision, and verified quality.
            </p>

            {/* Value Highlights */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/60 border border-[#00A86B]/40 text-emerald-200 text-[11px] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-[#00A86B]" />
                100% Verified Quality
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/60 border border-[#00A86B]/40 text-emerald-200 text-[11px] font-semibold">
                <Truck className="w-3.5 h-3.5 text-[#00A86B]" />
                Rapid Doorstep Dispatch
              </span>
            </div>
          </div>

          {/* Shop Column */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-1.5">
              <span>Shop Catalog</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-emerald-100/85">
              <li>
                <Link href="/products" className="hover:text-white hover:translate-x-0.5 inline-block transition-all">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/products?sort=newest" className="hover:text-white hover:translate-x-0.5 inline-block transition-all">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link href="/products?category=fruits" className="hover:text-white hover:translate-x-0.5 inline-block transition-all">
                  Fresh Fruits & Produce
                </Link>
              </li>
              <li>
                <Link href="/products?category=eco-garden" className="hover:text-white hover:translate-x-0.5 inline-block transition-all">
                  Eco Garden Greens
                </Link>
              </li>
              <li>
                <Link href="/products?sort=price_asc" className="hover:text-white hover:translate-x-0.5 inline-block transition-all">
                  Flash Deals & Sale
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care Column */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-1.5">
              <span>Customer Care</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-emerald-100/85">
              <li>
                <Link href="/chat" className="hover:text-white hover:translate-x-0.5 inline-block transition-all">
                  Live Concierge Support
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-white hover:translate-x-0.5 inline-block transition-all">
                  Order Telemetry & Tracking
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-white hover:translate-x-0.5 inline-block transition-all">
                  Shipping & Coverage
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white hover:translate-x-0.5 inline-block transition-all">
                  Merchant Partner Portal
                </Link>
              </li>
              <li>
                <Link href="/delivery/dashboard" className="hover:text-white hover:translate-x-0.5 inline-block transition-all">
                  Rider Dispatch Console
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Policy Column */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-1.5">
              <span>Legal & Policies</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-emerald-100/85">
              <li>
                <Link href="/privacy" className="hover:text-white hover:translate-x-0.5 inline-block transition-all font-medium">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white hover:translate-x-0.5 inline-block transition-all font-medium">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-white hover:translate-x-0.5 inline-block transition-all">
                  Cookie Preferences
                </Link>
              </li>
              <li>
                <Link href="/terms#returns" className="hover:text-white hover:translate-x-0.5 inline-block transition-all">
                  Returns & Guarantee
                </Link>
              </li>
              <li>
                <Link href="/chat" className="hover:text-white hover:translate-x-0.5 inline-block transition-all">
                  Help & FAQs
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Quick Legal Links */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-emerald-100/80">
          <p>© 2026 ZEVO Atelier & Logistics. All rights reserved.</p>

          <div className="flex items-center gap-6 text-xs text-emerald-100/85">
            <Link href="/privacy" className="hover:text-white underline-offset-4 hover:underline transition-colors">
              Privacy Policy
            </Link>
            <span className="text-emerald-600 select-none">•</span>
            <Link href="/terms" className="hover:text-white underline-offset-4 hover:underline transition-colors">
              Terms of Service
            </Link>
            <span className="text-emerald-600 select-none">•</span>
            <Link href="/cookies" className="hover:text-white underline-offset-4 hover:underline transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
