"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "../components/Navbar";
import { useCart } from "../providers/CartProvider";
import {
  ShoppingBag,
  Store,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  Search,
  Star,
  Plus,
  Box,
  Building2,
  Users,
  Check,
  ChevronDown,
  PackageCheck,
} from "lucide-react";

interface ProductCardData {
  id: string;
  name: string;
  category: string;
  vendor: string;
  rating: number;
  reviews: number;
  price: number;
  originalPrice: number;
  image: string;
  stock: number;
  variantId: string;
}

const SHOWCASE_PRODUCTS: ProductCardData[] = [
  {
    id: "prod-1",
    name: "AeroPulse Spatial Studio Headphones",
    category: "Audio & Tech",
    vendor: "Apex Acoustic Labs",
    rating: 4.9,
    reviews: 142,
    price: 34900,
    originalPrice: 39900,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
    stock: 14,
    variantId: "var-1",
  },
  {
    id: "prod-2",
    name: "Apex Chrono Horizon Smartwatch",
    category: "Wearables",
    vendor: "Zenith MicroTech",
    rating: 4.8,
    reviews: 98,
    price: 27900,
    originalPrice: 32000,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
    stock: 22,
    variantId: "var-2",
  },
  {
    id: "prod-3",
    name: "Ethiopia Yirgacheffe Single-Origin Roast",
    category: "Gourmet",
    vendor: "BrewCraft Artisans",
    rating: 5.0,
    reviews: 215,
    price: 2400,
    originalPrice: 2800,
    image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=80",
    stock: 45,
    variantId: "var-3",
  },
  {
    id: "prod-4",
    name: "LumbarSync Pro Ergonomic Task Chair",
    category: "Workstation",
    vendor: "ErgoForm Studio",
    rating: 4.9,
    reviews: 84,
    price: 68000,
    originalPrice: 75000,
    image: "https://images.unsplash.com/photo-1580481077194-436f5546b412?w=800&q=80",
    stock: 8,
    variantId: "var-4",
  },
  {
    id: "prod-5",
    name: "CyberDeck 75% Custom Mechanical Board",
    category: "Audio & Tech",
    vendor: "KeyForge Works",
    rating: 4.9,
    reviews: 176,
    price: 18900,
    originalPrice: 21900,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80",
    stock: 19,
    variantId: "var-5",
  },
  {
    id: "prod-6",
    name: "Minimalist Matte Aerodynamic Backpack",
    category: "Lifestyle",
    vendor: "Urban Nomad Gear",
    rating: 4.7,
    reviews: 110,
    price: 11900,
    originalPrice: 14500,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
    stock: 31,
    variantId: "var-6",
  },
];

export default function HomePage() {
  const { addItem, openDrawer } = useCart();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = ["All", "Audio & Tech", "Wearables", "Gourmet", "Workstation", "Lifestyle"];

  const filteredProducts = SHOWCASE_PRODUCTS.filter((prod) => {
    const matchesCat = selectedCategory === "All" || prod.category === selectedCategory;
    const matchesQuery =
      searchQuery === "" ||
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.vendor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const handleAddToCart = async (product: ProductCardData) => {
    try {
      await addItem(product.id, product.variantId, 1);
    } catch {
      // Handled in provider
    }
    openDrawer();
  };

  const formatCents = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar />

      <main className="flex-1 w-full flex flex-col items-center">
        {/* ====================================================================
            HERO SECTION (Matching SuppliX visual layout & light aesthetic)
            ==================================================================== */}
        <section className="w-full max-w-6xl mx-auto px-6 pt-14 pb-12 flex flex-col items-center text-center">
          {/* Top subtle pill badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold mb-6 shadow-xs">
            <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span>Next-Gen Multi-Vendor Commerce & Hyperlocal Logistics</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-6 max-w-4xl">
            Simplify Procurement, Boost Supply Chain.
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mb-8 font-normal">
            Nexora is a cloud-based platform that connects procurement, suppliers, and operations,
            empowering your business to achieve greater purchasing efficiency and success.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 mb-14">
            <Link
              href="/products"
              className="px-7 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-md shadow-blue-500/25 hover:shadow-blue-500/35 hover:-translate-y-0.5"
            >
              Get App
            </Link>
            <Link
              href="/seller/dashboard"
              className="px-6 py-3 rounded-full bg-white hover:bg-slate-50 border border-slate-300 text-blue-600 font-semibold text-sm transition-all shadow-xs hover:-translate-y-0.5"
            >
              Watch Demo
            </Link>
          </div>

          {/* ====================================================================
              HERO FROSTED GLASS DASHBOARD PREVIEW (Faithful to inspiration image)
              ==================================================================== */}
          <div className="w-full max-w-5xl rounded-3xl p-6 sm:p-8 liquid-glass-panel relative overflow-hidden transition-all shadow-xl shadow-slate-200/50">
            {/* Top Bar inside Dashboard */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search orders, vendors, SKUs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold">
                  <PackageCheck className="w-3.5 h-3.5" />
                  <span>Live Sync: 99.98%</span>
                </div>

                <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-medium shadow-2xs">
                  <span>Last 7 Days</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </div>
              </div>
            </div>

            {/* 4 Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-6">
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs text-left">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Total Orders
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-slate-900 font-mono">2,847</span>
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center">
                    +18%
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Active across 12 zones</span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs text-left">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Active Vendors
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-slate-900 font-mono">156</span>
                  <span className="text-[11px] font-bold text-blue-600 flex items-center">
                    +12 new
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Verified merchant partners</span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs text-left">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Fulfillment SLA
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-slate-900 font-mono">98.4%</span>
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center">
                    +2.1%
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Avg delivery in 24 mins</span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs text-left">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Gross Volume
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-slate-900 font-mono">$4.2M</span>
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center">
                    +24%
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Processed through Stripe</span>
              </div>
            </div>

            {/* Operational Visual Indicators */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Simulated Chart Bars */}
              <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs text-left">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-800">
                    Procurement Volume Trend
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500">
                    Hourly Dispatch Telemetry
                  </span>
                </div>
                <div className="h-28 flex items-end gap-3 pt-4 px-2">
                  {[35, 55, 42, 78, 60, 95, 70, 85, 90, 68, 88, 100].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <div
                        className="w-full rounded-t-md bg-blue-600 hover:bg-blue-700 transition-all cursor-pointer"
                        style={{ height: `${h}%` }}
                        title={`Period ${i + 1}: ${h}% capacity`}
                      />
                      <span className="text-[9px] font-mono text-slate-400">{i + 1}h</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* KPI indicators */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs text-left flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-800 mb-3">
                  Key Performance Indicators
                </span>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Avg Dispatch Time</span>
                    <span className="font-mono font-bold text-slate-900">11.2m</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Order Accuracy</span>
                    <span className="font-mono font-bold text-emerald-600">99.8%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Active Couriers</span>
                    <span className="font-mono font-bold text-blue-600">341 Online</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Inventory Turns</span>
                    <span className="font-mono font-bold text-slate-900">14.2x</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================================
            FEATURE PILLARS ("Start Building a Connected Supply Chain")
            ==================================================================== */}
        <section id="features" className="w-full max-w-6xl mx-auto px-6 py-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Our System
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Start Building a Connected Supply Chain
              </h2>
            </div>
            <p className="text-sm text-slate-600 max-w-md">
              Gain transformative insight into how modern teams manage multi-vendor sourcing, purchase orders, inventory, and instant fulfillment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Centralize */}
            <div className="liquid-glass-card-interactive p-8 flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 mb-6">
                  <Box className="w-7 h-7 stroke-[1.5]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Centralize</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-6">
                  All multi-vendor products, merchant tiers, and real-time inventory levels synchronized from one intuitive control deck.
                </p>
              </div>
              <Link
                href="/products"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                <span>Explore Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 2: Collaboration */}
            <div className="liquid-glass-card-interactive p-8 flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600 mb-6">
                  <Users className="w-7 h-7 stroke-[1.5]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Collaboration</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-6">
                  Real-time connectivity between buyers, store managers, and delivery agents with live tracking and status milestones.
                </p>
              </div>
              <Link
                href="/seller/dashboard"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                <span>Merchant Hub</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 3: Automation */}
            <div className="liquid-glass-card-interactive p-8 flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-cyan-50 border border-cyan-200/80 flex items-center justify-center text-cyan-600 mb-6">
                  <Zap className="w-7 h-7 stroke-[1.5]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Automation</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-6">
                  Two-phase inventory reservation, BullMQ background queues, and automated sub-order splitting with Stripe payouts.
                </p>
              </div>
              <Link
                href="/#pricing"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                <span>View Engine</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* ====================================================================
            LIVE PRODUCT SHOWCASE (User Requirement: Show Products & Details!)
            ==================================================================== */}
        <section className="w-full max-w-6xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold mb-2">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Featured Catalog</span>
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Explore Marketplace Products
              </h2>
              <p className="text-xs text-slate-600 mt-1 max-w-lg">
                Curated items from verified merchants with real-time inventory stock and same-hour hyperlocal delivery.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    selectedCategory === cat
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((prod) => (
              <div
                key={prod.id}
                className="liquid-glass-card group overflow-hidden flex flex-col justify-between"
              >
                {/* Image area */}
                <div className="h-52 w-full bg-slate-100 relative overflow-hidden flex items-center justify-center">
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/80 text-[10px] font-bold text-slate-800 shadow-xs">
                    {prod.category}
                  </div>
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[10px] font-bold text-emerald-700 shadow-xs">
                    In Stock ({prod.stock})
                  </div>
                </div>

                {/* Content details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Merchant & Rating */}
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-semibold text-slate-500 truncate max-w-[150px]">
                        {prod.vendor}
                      </span>
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-bold text-slate-800">{prod.rating.toFixed(1)}</span>
                        <span className="text-[10px] text-slate-400">({prod.reviews})</span>
                      </div>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-blue-600 transition-colors">
                      {prod.name}
                    </h3>
                  </div>

                  {/* Price & Add to Cart button */}
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-slate-900 font-mono">
                          {formatCents(prod.price)}
                        </span>
                        <span className="text-xs text-slate-400 line-through font-mono">
                          {formatCents(prod.originalPrice)}
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-600 font-semibold block">
                        Free 30-min delivery
                      </span>
                    </div>

                    <button
                      onClick={() => handleAddToCart(prod)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-slate-50 border border-slate-300 text-blue-600 font-bold text-xs shadow-xs hover:shadow-sm transition-all"
            >
              <span>Explore All Marketplace Products (500+)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* ====================================================================
            OPERATIONS BENTO GRID ("Building a Stronger, Smarter Supply Chain")
            ==================================================================== */}
        <section className="w-full max-w-6xl mx-auto px-6 py-16">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              About Nexora
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1 mb-3">
              Building a Stronger, Smarter Supply Chain
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              The complete set of tools to optimize operations and enhance purchasing decisions.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Big Card: Recent Purchase Orders Table Mockup */}
            <div className="lg:col-span-2 liquid-glass-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-800">
                      Recent Purchase Orders
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <span>Last 7 Days</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-blue-600 cursor-pointer">Sort ▾</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-[11px] font-semibold text-slate-400 border-b border-slate-100">
                        <th className="pb-3">PO Number</th>
                        <th className="pb-3">Supplier</th>
                        <th className="pb-3">Items</th>
                        <th className="pb-3">Amount</th>
                        <th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-3 font-mono font-semibold text-slate-700">PO-2026-0841</td>
                        <td className="py-3 font-medium text-slate-900">Apex Audio Labs</td>
                        <td className="py-3 text-slate-600">2 Items</td>
                        <td className="py-3 font-mono font-bold text-slate-900">$349.00</td>
                        <td className="py-3">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                            Delivered
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 font-mono font-semibold text-slate-700">PO-2026-0842</td>
                        <td className="py-3 font-medium text-slate-900">BrewCraft Artisans</td>
                        <td className="py-3 text-slate-600">6 Items</td>
                        <td className="py-3 font-mono font-bold text-slate-900">$144.00</td>
                        <td className="py-3">
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold">
                            In Transit
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 font-mono font-semibold text-slate-700">PO-2026-0843</td>
                        <td className="py-3 font-medium text-slate-900">Zenith MicroTech</td>
                        <td className="py-3 text-slate-600">1 Item</td>
                        <td className="py-3 font-mono font-bold text-slate-900">$279.00</td>
                        <td className="py-3">
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold">
                            Packing
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-4 mt-6 border-t border-slate-100 text-center">
                <span className="text-xs font-bold text-slate-900 block">
                  Advanced Procurement Center
                </span>
                <span className="text-[11px] text-slate-500">
                  Simplify sourcing, POs, and contract management — all in one place.
                </span>
              </div>
            </div>

            {/* Right Card: Collaborative Workspace */}
            <div className="liquid-glass-card p-6 flex flex-col justify-between text-center items-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 mb-4 mt-2">
                <ShieldCheck className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  Collaborative Workspace
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-xs mb-4">
                  Real-time communication and connection with 1,450+ verified local merchants and delivery fleets.
                </p>
              </div>

              <button className="w-full py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all">
                Enter Collaborative Workspace
              </button>
            </div>
          </div>
        </section>

        {/* ====================================================================
            PRICING TIERS ("Flexible Solutions for Every Organization")
            ==================================================================== */}
        <section id="pricing" className="w-full max-w-6xl mx-auto px-6 py-16">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1 mb-3">
              Flexible Solutions for Every Organization
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              From small shops to large enterprises, choose plans to fit your needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Tier 1: Starter */}
            <div className="liquid-glass-card p-8 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                  <Store className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Starter</h3>
                <p className="text-xs text-slate-500 mt-1 mb-6">
                  For small shops beginning their journey into digital commerce.
                </p>

                <div className="mb-6">
                  <span className="text-4xl font-black text-slate-900 font-mono">$49</span>
                  <span className="text-xs text-slate-400"> / month</span>
                </div>

                <ul className="space-y-3 text-xs text-slate-600 mb-8">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Support up to 20 online products</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Easily create and route orders</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Integrated dispatch workflows</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Standard email support</span>
                  </li>
                </ul>
              </div>

              <button className="w-full py-2.5 rounded-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all shadow-2xs">
                Go with Starter
              </button>
            </div>

            {/* Tier 2: Professional (Featured Blue Glass Card!) */}
            <div className="p-8 rounded-3xl bg-blue-50/90 border-2 border-blue-500 shadow-xl shadow-blue-500/10 flex flex-col justify-between relative scale-105">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                Most Popular
              </div>

              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-4 mt-2 shadow-sm">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Professional</h3>
                <p className="text-xs text-slate-600 mt-1 mb-6">
                  For growing businesses needing automated fulfillment.
                </p>

                <div className="mb-6">
                  <span className="text-4xl font-black text-blue-700 font-mono">$129</span>
                  <span className="text-xs text-blue-600"> / month</span>
                </div>

                <ul className="space-y-3 text-xs text-slate-700 mb-8 font-medium">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>All supplier tiers & unlimited SKUs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Two-phase stock reservation & Redis</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Real-time rider geospatial tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Integrated Stripe Connect custom payouts</span>
                  </li>
                </ul>
              </div>

              <button className="w-full py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition-all">
                Start with Professional
              </button>
            </div>

            {/* Tier 3: Enterprise */}
            <div className="liquid-glass-card p-8 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Enterprise</h3>
                <p className="text-xs text-slate-500 mt-1 mb-6">
                  Ideal for large organizations needing unified multi-hub supply chains.
                </p>

                <div className="mb-6">
                  <span className="text-4xl font-black text-slate-900">Custom</span>
                </div>

                <ul className="space-y-3 text-xs text-slate-600 mb-8">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Personalized routing & custom algorithms</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Dedicated account manager & 99.99% SLA</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Direct API & event webhooks access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Priority 24/7 phone & team support</span>
                  </li>
                </ul>
              </div>

              <button className="w-full py-2.5 rounded-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all shadow-2xs">
                Contact Sales
              </button>
            </div>
          </div>
        </section>

        {/* ====================================================================
            INSIGHTS & BLOG ("Next-Level Procurement Insights")
            ==================================================================== */}
        <section id="insights" className="w-full max-w-6xl mx-auto px-6 py-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Insights
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Next-Level Procurement Insights
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md">
              Everything required to simplify workflows and make smarter supply chain decisions.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Big Vertical Card: Warehouse */}
            <div className="liquid-glass-card group overflow-hidden flex flex-col justify-between">
              <div className="h-64 sm:h-80 w-full overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=900&q=80"
                  alt="Warehouse Logistics"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-blue-600 text-white text-[11px] font-bold">
                  Supply Chain
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                  The Future of Autonomous Cloud-Based Micro-Fulfillment
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  How AI-assisted inventory slotting and distributed city hubs are shrinking last-mile delivery times under 20 minutes.
                </p>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600">
                  <span>Learn More</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Right 2 Horizontal Cards */}
            <div className="flex flex-col gap-6">
              <div className="liquid-glass-card group overflow-hidden flex flex-col sm:flex-row">
                <div className="sm:w-48 h-40 sm:h-auto overflow-hidden shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&q=80"
                    alt="Delivery Fleet"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold inline-block mb-2">
                      Fleet Telematics
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                      Cold-Chain Logistics in Dense Urban Environments
                    </h4>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 mt-3">
                    <span>Learn More</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>

              <div className="liquid-glass-card group overflow-hidden flex flex-col sm:flex-row">
                <div className="sm:w-48 h-40 sm:h-auto overflow-hidden shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80"
                    alt="Partnership"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold inline-block mb-2">
                      Partnerships
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                      Building Long-Term Trust Between Vendors & Couriers
                    </h4>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 mt-3">
                    <span>Learn More</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================================
            PRE-FOOTER CALL TO ACTION BANNER
            ==================================================================== */}
        <section className="w-full max-w-5xl mx-auto px-6 mb-20">
          <div className="rounded-3xl p-8 sm:p-12 liquid-glass-panel border border-slate-200/90 text-center shadow-lg shadow-slate-200/50">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
              Ready to Make Your Procurement Faster and Easier?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto mb-8">
              Nexora empowers teams to automate sourcing, unify supplier relationships,
              and gain complete operational insight — all from one cloud platform.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/register"
                className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all"
              >
                Request a Demo
              </Link>
              <Link
                href="/products"
                className="px-6 py-3 rounded-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-all"
              >
                Explore Marketplace
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ====================================================================
          MODERN LIGHT-GLASS FOOTER
          ==================================================================== */}
      <footer className="w-full border-t border-slate-200 bg-white/80 backdrop-blur-xl pt-14 pb-10 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-base">
                N
              </div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                NEXORA
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed mb-4">
              Nexora simplifies procurement and sales with automated sourcing, connected suppliers,
              and full multi-tier hyperlocal logistics. We support your business needs.
            </p>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span className="text-[11px] font-mono text-slate-600">All Systems Operational</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Product
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li><Link href="/products" className="hover:text-blue-600">Overview</Link></li>
              <li><a href="#features" className="hover:text-blue-600">Features</a></li>
              <li><a href="#pricing" className="hover:text-blue-600">Pricing</a></li>
              <li><Link href="/products" className="hover:text-blue-600">Security</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Solutions
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li><Link href="/seller/dashboard" className="hover:text-blue-600">Procurement Teams</Link></li>
              <li><Link href="/seller/orders" className="hover:text-blue-600">Supply Chain Management</Link></li>
              <li><Link href="/seller/inventory" className="hover:text-blue-600">Fleet Operations</Link></li>
              <li><Link href="/admin/sellers" className="hover:text-blue-600">Enterprise Moderation</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Company
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li><Link href="/login" className="hover:text-blue-600">About Nexora</Link></li>
              <li><Link href="/register" className="hover:text-blue-600">Careers</Link></li>
              <li><a href="#insights" className="hover:text-blue-600">Insights</a></li>
              <li><Link href="/cart" className="hover:text-blue-600">Contact</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© 2026 NEXORA Platform. Engineered with Light Theme Liquid Glass Architecture.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-600 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-600 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-600 cursor-pointer">API Documentation</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
