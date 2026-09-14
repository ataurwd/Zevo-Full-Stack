"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import {
  ChevronRight,
  Sparkles,
  ArrowRight,
  LayoutGrid,
  AlertCircle,
  RefreshCw,
  Search,
  ShoppingBag,
} from "lucide-react";
import { useCategories } from "../../hooks/useCategories";

interface CategoryMegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function CategoryMegaMenu({
  isOpen,
  onClose,
  onMouseEnter,
  onMouseLeave,
}: CategoryMegaMenuProps) {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  const { data: categoryData, isLoading, isError, refetch } = useCategories();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      refetch();
      setSearchQuery("");
    }
  }, [isOpen, refetch]);

  // Map active categories and their image_url directly from MongoDB database
  const categories = useMemo(() => {
    if (!categoryData || !Array.isArray(categoryData)) return [];
    return categoryData
      .filter((cat) => cat.is_active !== false)
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        image: cat.image_url || "",
        tag: cat.description || "Curated",
      }));
  }, [categoryData]);

  // Filtered categories based on optional quick search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    return categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(q) ||
        (cat.tag && cat.tag.toLowerCase().includes(q))
    );
  }, [categories, searchQuery]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <>
      {/* Dimmed backdrop overlay starting strictly below navbar to create high contrast with page */}
      <div
        onClick={onClose}
        onMouseEnter={onMouseLeave}
        className="fixed inset-0 top-[65px] bg-black/45 backdrop-blur-xs z-40 transition-opacity duration-200 cursor-pointer"
        aria-hidden="true"
      />

      {/* Floating Mega Menu Container */}
      <div
        className="fixed inset-x-0 top-[65px] z-50 pointer-events-none"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-8">
          <div
            ref={menuRef}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={{
              backgroundColor: "#ffffff",
              boxShadow:
                "0 25px 65px -12px rgba(0, 0, 0, 0.45), 0 15px 35px -8px rgba(10, 80, 74, 0.35), 0 0 0 1px rgba(0, 168, 107, 0.3), 0 6px 20px rgba(0, 0, 0, 0.15)",
            }}
            className="relative w-full pointer-events-auto bg-white border border-[#A2E4B8] rounded-3xl p-5 sm:p-6 transition-all duration-200 animate-in fade-in-0 slide-in-from-top-2"
          >
            {/* Invisible top hover bridge connecting smoothly to navbar bottom border */}
            <div className="absolute -top-3 inset-x-0 h-3 pointer-events-auto" />

            {/* Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E8F8EE] mb-4 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#E8F8EE] border border-[#A2E4B8] flex items-center justify-center text-[#00A86B] shadow-2xs shrink-0">
                  <LayoutGrid className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#0A504A] tracking-tight flex items-center gap-2">
                    Browse Categories
                    <span className="px-2.5 py-0.5 rounded-full bg-[#E8F8EE] text-[#00A86B] font-mono text-xs font-bold border border-[#A2E4B8]">
                      {isLoading ? "Syncing..." : `${categories.length} Departments`}
                    </span>
                  </h3>
                  <p className="text-[11px] text-[#0A504A]/70 mt-0.5">
                    Select a department to explore artisan and farm-fresh collections
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                {/* Compact search filter for large catalogs */}
                {categories.length > 6 && (
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#0A504A]/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Quick filter..."
                      className="w-36 sm:w-44 pl-8 pr-3 py-1.5 rounded-full bg-[#F7F7F2] border border-[#D1E7D8] text-xs text-[#0A504A] placeholder-[#0A504A]/40 focus:bg-white focus:outline-none focus:border-[#00A86B] transition-all"
                    />
                  </div>
                )}

                <Link
                  href="/products"
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#0A504A] hover:bg-[#00A86B] text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
                >
                  <span>All Products</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Dynamic Category Compact Tiles Grid - Fits 12+ categories without scrolling */}
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div
                    key={`skel-${idx}`}
                    className="flex items-center gap-3 p-2.5 rounded-2xl bg-gray-50 border border-[#D1E7D8]/60 animate-pulse"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#D1E7D8]/60 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 bg-[#D1E7D8]/70 rounded w-3/4" />
                      <div className="h-2.5 bg-[#D1E7D8]/40 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="py-6 text-center flex flex-col items-center justify-center bg-rose-50 rounded-2xl border border-rose-200 p-4">
                <AlertCircle className="w-7 h-7 text-rose-500 mb-1.5" />
                <p className="text-xs font-bold text-rose-700">Could not load categories from the server</p>
                <button
                  onClick={() => refetch()}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0A504A] hover:bg-[#00A86B] text-white text-xs font-bold"
                >
                  <RefreshCw className="w-3 h-3" /> Retry
                </button>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="py-8 text-center bg-[#F7F7F2] rounded-2xl border border-[#D1E7D8] p-4">
                <p className="text-xs font-bold text-[#0A504A]">No categories matched &ldquo;{searchQuery}&rdquo;</p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-2 text-xs font-bold text-[#00A86B] underline"
                >
                  Clear search filter
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
                {filteredCategories.map((cat, idx) => (
                  <Link
                    key={cat.id || cat.slug || idx}
                    href={`/products?category=${cat.slug}`}
                    onClick={onClose}
                    className="group flex items-center gap-3 p-2 sm:p-2.5 rounded-2xl bg-[#F7F7F2]/60 hover:bg-[#E8F8EE] border border-[#D1E7D8]/80 hover:border-[#00A86B] shadow-2xs hover:shadow-md transition-all duration-200"
                  >
                    {/* Compact Image Thumbnail */}
                    <div className="relative w-12 h-12 sm:w-13 sm:h-13 rounded-xl overflow-hidden bg-[#E8F8EE] border border-[#D1E7D8] shrink-0">
                      {cat.image ? (
                        <img
                          src={cat.image}
                          alt={cat.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#00A86B]/40 bg-[#E8F8EE]">
                          <LayoutGrid className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    {/* Category Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs sm:text-sm font-black text-[#0A504A] group-hover:text-[#00A86B] transition-colors truncate">
                          {cat.name}
                        </h4>
                      </div>
                      <span className="text-[10px] text-[#0A504A]/60 font-medium group-hover:text-[#0A504A]/80 transition-colors flex items-center gap-1 mt-0.5">
                        <span>Browse Department</span>
                        <ChevronRight className="w-3 h-3 text-[#00A86B] transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Compact Special Deals & Seasonal Specials Banner */}
            <div className="mt-4 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#0A504A] via-[#086358] to-[#00A86B] text-white flex flex-col sm:flex-row items-center justify-between gap-3 border border-[#00A86B]/40 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white shrink-0 shadow-inner">
                  <Sparkles className="w-4 h-4 text-[#A2E4B8]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-black tracking-tight">
                      Limited Deals & Seasonal Specials
                    </span>
                    <span className="px-2 py-0.2 rounded-full bg-white/20 text-[9px] font-bold uppercase tracking-wider text-white">
                      Up to 50% Off
                    </span>
                  </div>
                  <p className="text-[11px] text-[#A2E4B8] mt-0.5">
                    Handcrafted pantry staples, organic fresh picks, and artisan delicacies on sale.
                  </p>
                </div>
              </div>

              <Link
                href="/products?sort=price_asc"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-[#0A504A] hover:bg-[#E8F8EE] text-xs font-bold transition-all shadow-xs shrink-0 hover:scale-105 cursor-pointer"
              >
                <span>View Clearance</span>
                <ArrowRight className="w-3 h-3 text-[#00A86B]" />
              </Link>
            </div>

            {/* Quick Footer Links */}
            <div className="mt-3.5 pt-3 border-t border-[#E8F8EE] flex flex-wrap items-center justify-between gap-2 text-xs text-[#0A504A]/70">
              <div className="flex items-center gap-3 text-[11px]">
                <Link
                  href="/products?sort=newest"
                  onClick={onClose}
                  className="hover:text-[#00A86B] font-semibold transition-colors flex items-center gap-1"
                >
                  <span>✨ New Arrivals</span>
                </Link>
                <span className="text-[#D1E7D8]">•</span>
                <Link
                  href="/products?sort=rating_desc"
                  onClick={onClose}
                  className="hover:text-[#00A86B] font-semibold transition-colors flex items-center gap-1"
                >
                  <span>⭐ Top Rated Products</span>
                </Link>
              </div>

              <Link
                href="/products"
                onClick={onClose}
                className="text-[#00A86B] hover:text-[#0A504A] font-bold flex items-center gap-1 transition-colors text-[11px]"
              >
                <span>View Full Catalog</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

export default CategoryMegaMenu;
