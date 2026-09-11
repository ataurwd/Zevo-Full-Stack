"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Navbar } from "../../components/Navbar";
import { browseProducts, ProductItem, BrowseProductsParams } from "../../lib/api/products";
import { getCategoryTree, CategoryItem } from "../../lib/api/categories";
import {
  Search,
  Filter,
  Package,
  SlidersHorizontal,
  ChevronRight,
  Star,
  Layers,
  ArrowRight,
  Loader2,
  Tag,
} from "lucide-react";

export default function MarketplaceBrowsePage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    total_pages: 1,
    has_next: false,
    has_prev: false,
  });

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sortBy, setSortBy] = useState<BrowseProductsParams["sort"]>("newest");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const minPriceCents = minPrice ? Math.round(parseFloat(minPrice) * 100) : undefined;
      const maxPriceCents = maxPrice ? Math.round(parseFloat(maxPrice) * 100) : undefined;

      const res = await browseProducts({
        q: searchQuery.trim() || undefined,
        category: selectedCategory || undefined,
        min_price: minPriceCents,
        max_price: maxPriceCents,
        sort: sortBy,
        page: pagination.page,
        limit: pagination.limit,
      });

      setProducts(res.items || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error("Failed loading marketplace products", err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategory, minPrice, maxPrice, sortBy, pagination.page, pagination.limit]);

  useEffect(() => {
    async function loadCats() {
      try {
        const tree = await getCategoryTree();
        setCategories(tree);
      } catch (err) {
        console.error("Failed loading categories", err);
      }
    }
    loadCats();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadData]);

  const formatCents = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col selection:bg-blue-600 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full">
        {/* Hero Banner / Title */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold mb-3">
            <Tag className="w-3.5 h-3.5" />
            <span>Discover Verified Merchant Catalogs</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            NEXORA Marketplace
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-lg">
            Browse verified multi-vendor products with real-time stock levels, multi-variant options, and instant hyperlocal dispatch.
          </p>
        </div>

        {/* Search Bar & Sort */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keywords, tags, or product title..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 shadow-2xs"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
              <option value="best_selling">Best Selling</option>
            </select>
          </div>
        </div>

        {/* Grid Layout: Sidebar Filters + Products */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <aside className="space-y-6">
            <div className="liquid-glass-card p-5 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                  <span>Filters</span>
                </span>
                {(selectedCategory || minPrice || maxPrice) && (
                  <button
                    onClick={() => {
                      setSelectedCategory("");
                      setMinPrice("");
                      setMaxPrice("");
                    }}
                    className="text-[11px] font-semibold text-blue-600 hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Categories */}
              <div>
                <h3 className="text-xs font-bold text-slate-800 mb-2">Category</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory("")}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                      selectedCategory === ""
                        ? "bg-blue-50 text-blue-700 font-bold border border-blue-200/80"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.slug)}
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center justify-between ${
                        selectedCategory === cat.slug
                          ? "bg-blue-50 text-blue-700 font-bold border border-blue-200/80"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <span>{cat.name}</span>
                      {cat.children && cat.children.length > 0 && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          +{cat.children.length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div>
                <h3 className="text-xs font-bold text-slate-800 mb-2">Price Range ($)</h3>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="Min $"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 shadow-2xs"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Max $"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 shadow-2xs"
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* Product Cards Grid */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                <p className="text-sm font-semibold text-slate-500">Discovering products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="liquid-glass-card p-12 text-center">
                <Package className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">No products found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                  No verified products match your search or filter settings.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("");
                    setMinPrice("");
                    setMaxPrice("");
                  }}
                  className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition-all shadow-md shadow-blue-500/25"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {products.map((prod) => (
                    <Link
                      key={prod.id}
                      href={`/products/${prod.id}`}
                      className="group liquid-glass-card-interactive overflow-hidden flex flex-col justify-between"
                    >
                      {/* Product Thumbnail Banner */}
                      <div className="h-48 w-full bg-slate-100 relative overflow-hidden flex items-center justify-center">
                        {prod.images && prod.images.length > 0 && prod.images[0]?.url ? (
                          <img
                            src={prod.images[0].url}
                            alt={prod.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400">
                            <Package className="w-12 h-12 stroke-1 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-mono mt-1 text-slate-400">
                              NEXORA Verified Item
                            </span>
                          </div>
                        )}

                        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/80 text-[10px] font-bold text-slate-700 shadow-2xs">
                          {prod.variants.length} SKU{prod.variants.length > 1 ? "s" : ""}
                        </div>
                      </div>

                      {/* Details Content */}
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1 text-amber-500 text-xs mb-1.5">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span className="font-bold text-slate-800">
                              {prod.rating_avg.toFixed(1)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ({prod.rating_count})
                            </span>
                          </div>

                          <h3 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-blue-600 transition-colors">
                            {prod.name}
                          </h3>

                          <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                            {prod.description}
                          </p>
                        </div>

                        {/* Price & CTA */}
                        <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                              From
                            </span>
                            <span className="text-base font-black text-slate-900 font-mono">
                              {formatCents(prod.base_price)}
                            </span>
                          </div>

                          <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                            <span>Details</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.total_pages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-2">
                    <button
                      disabled={!pagination.has_prev}
                      onClick={() =>
                        setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                      }
                      className="px-4 py-2 rounded-full bg-white disabled:opacity-40 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 text-xs font-mono text-slate-500">
                      Page {pagination.page} of {pagination.total_pages}
                    </span>
                    <button
                      disabled={!pagination.has_next}
                      onClick={() =>
                        setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                      }
                      className="px-4 py-2 rounded-full bg-white disabled:opacity-40 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
