"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Navbar } from "../../components/Navbar";
import { useCart } from "../../providers/CartProvider";
import { useProducts } from "../../hooks/useProducts";
import { useCategories } from "../../hooks/useCategories";
import { ProductItem } from "../../lib/api/products";
import { CategoryItem } from "../../lib/api/categories";
import { getProductImageUrl } from "../../lib/utils/productImages";
import { getProductUrl } from "../../lib/utils/slug";
import {
  Search,
  SlidersHorizontal,
  Check,
  ChevronDown,
  Star,
  Heart,
  Eye,
  ShoppingBag,
  ShoppingCart,
  X,
  Grid3X3,
  LayoutGrid,
  List,
  Filter,
  RotateCcw,
  Loader2,
  Package,
  CheckCircle,
  Plus,
  Minus,
  Sparkles,
} from "lucide-react";

const WEIGHT_OPTIONS = ["1kg", "200g", "250g", "500g"];
const BRAND_OPTIONS = ["Brand 1", "Brand 2", "Brand 3", "Brand 4"];
const TYPE_OPTIONS = ["Meat", "Organic", "Vegan"];

function ShopCatalogContent() {
  const { cart, addItem, openDrawer } = useCart();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Live Products & Categories from TanStack Query
  const { products, isLoading: isProductsLoading } = useProducts(
    { limit: 100 },
    { refetchInterval: 4000 }
  );
  const { data: categories = [], isLoading: isCategoriesLoading } = useCategories({
    refetchInterval: 60000,
  });
  const isLoading = isProductsLoading || isCategoriesLoading;

  // Filter States initialized from URL Search Params
  const [searchQuery, setSearchQuery] = useState(
    () => searchParams.get("q") || searchParams.get("search") || ""
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(
    () => searchParams.get("category") || searchParams.get("cat") || ""
  );
  const [minPrice, setMinPrice] = useState<number>(() => {
    const p = searchParams.get("min_price");
    return p ? Number(p) || 12 : 12;
  });
  const [maxPrice, setMaxPrice] = useState<number>(() => {
    const p = searchParams.get("max_price");
    return p ? Number(p) || 400 : 400;
  });
  const [selectedWeights, setSelectedWeights] = useState<string[]>(() => {
    const w = searchParams.get("weight");
    return w ? w.split(",").filter(Boolean) : [];
  });
  const [selectedBrands, setSelectedBrands] = useState<string[]>(() => {
    const b = searchParams.get("brand");
    return b ? b.split(",").filter(Boolean) : [];
  });
  const [selectedTypes, setSelectedTypes] = useState<string[]>(() => {
    const t = searchParams.get("type");
    return t ? t.split(",").filter(Boolean) : [];
  });
  const [sortBy, setSortBy] = useState<"default" | "price_asc" | "price_desc" | "rating" | "newest">(() => {
    const s = searchParams.get("sort");
    return (s as any) || "default";
  });
  const [currentPage, setCurrentPage] = useState<number>(() => {
    const p = searchParams.get("page");
    return p ? Math.max(1, Number(p)) || 1 : 1;
  });

  // Track if initial sync has occurred
  const isInitialSync = useRef(true);

  // Sync state when URL search params change externally (e.g. navigation / Back / Forward)
  useEffect(() => {
    const urlCat = searchParams.get("category") || searchParams.get("cat") || "";
    setSelectedCategory((prev) => (prev !== urlCat ? urlCat : prev));

    const urlQ = searchParams.get("q") || searchParams.get("search") || "";
    setSearchQuery((prev) => (prev !== urlQ ? urlQ : prev));

    if (searchParams.has("min_price")) {
      const min = Number(searchParams.get("min_price"));
      if (!isNaN(min)) setMinPrice(min);
    }
    if (searchParams.has("max_price")) {
      const max = Number(searchParams.get("max_price"));
      if (!isNaN(max)) setMaxPrice(max);
    }
    if (searchParams.has("weight")) {
      setSelectedWeights(searchParams.get("weight")!.split(",").filter(Boolean));
    }
    if (searchParams.has("brand")) {
      setSelectedBrands(searchParams.get("brand")!.split(",").filter(Boolean));
    }
    if (searchParams.has("type")) {
      setSelectedTypes(searchParams.get("type")!.split(",").filter(Boolean));
    }
    if (searchParams.has("sort")) {
      setSortBy(searchParams.get("sort") as any);
    }
    if (searchParams.has("page")) {
      const p = Number(searchParams.get("page"));
      if (!isNaN(p)) setCurrentPage(Math.max(1, p));
    }
  }, [searchParams]);

  // Sync state changes back to URL search params
  useEffect(() => {
    if (isInitialSync.current) {
      isInitialSync.current = false;
      return;
    }

    const params = new URLSearchParams();
    if (selectedCategory) params.set("category", selectedCategory);
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (minPrice !== 12) params.set("min_price", String(minPrice));
    if (maxPrice !== 400) params.set("max_price", String(maxPrice));
    if (selectedWeights.length > 0) params.set("weight", selectedWeights.join(","));
    if (selectedBrands.length > 0) params.set("brand", selectedBrands.join(","));
    if (selectedTypes.length > 0) params.set("type", selectedTypes.join(","));
    if (sortBy !== "default") params.set("sort", sortBy);
    if (currentPage > 1) params.set("page", String(currentPage));

    const newQuery = params.toString();
    const currentQuery = searchParams.toString();
    if (newQuery !== currentQuery) {
      const newUrl = newQuery ? `${pathname}?${newQuery}` : pathname;
      router.replace(newUrl, { scroll: false });
    }
  }, [
    selectedCategory,
    searchQuery,
    minPrice,
    maxPrice,
    selectedWeights,
    selectedBrands,
    selectedTypes,
    sortBy,
    currentPage,
    pathname,
    router,
    searchParams,
  ]);

  // View Layout: 4 cols, 3 cols (default), 2 cols, or list view
  const [viewMode, setViewMode] = useState<"grid-4" | "grid-3" | "grid-2" | "list">("grid-3");

  // Pagination (12 items per page matching the reference: "Showing 1-12 of 23 item(s)")
  const itemsPerPage = 12;

  // Mobile Filter Drawer
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Quick View Modal
  const [quickViewProduct, setQuickViewProduct] = useState<ProductItem | null>(null);
  const [quickViewQty, setQuickViewQty] = useState(1);
  const [cartToast, setCartToast] = useState<string | null>(null);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());

  // Deal Countdown Timer (ticks every second for deal badges)
  const [timerTick, setTimerTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTimerTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);



  // Helper: Format Countdown for Deal Products
  const formatCountdown = (baseSeconds: number) => {
    const remaining = Math.max(0, baseSeconds - timerTick);
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const mins = Math.floor((remaining % 3600) / 60);
    const secs = remaining % 60;
    return `${days}d : ${String(hours).padStart(2, "0")}h : ${String(mins).padStart(2, "0")}m : ${String(secs).padStart(2, "0")}s`;
  };

  // Helper: Extract Product Attributes / Tags for filtering
  const getProductWeight = (p: ProductItem): string => {
    const attr = p.attributes?.find((a) => a.name.toLowerCase() === "weight")?.value;
    if (attr) return attr;
    for (const w of WEIGHT_OPTIONS) {
      if (p.tags?.some((t) => t.toLowerCase() === w.toLowerCase())) return w;
    }
    return "";
  };

  const getProductBrand = (p: ProductItem): string => {
    const attr = p.attributes?.find((a) => a.name.toLowerCase() === "brand")?.value;
    if (attr) return attr;
    for (const b of BRAND_OPTIONS) {
      const slug = b.toLowerCase().replace(" ", "-");
      if (p.tags?.some((t) => t.toLowerCase() === slug)) return b;
    }
    return "";
  };

  const getProductTypes = (p: ProductItem): string[] => {
    const types: string[] = [];
    for (const t of TYPE_OPTIONS) {
      if (
        p.tags?.some((tag) => tag.toLowerCase() === t.toLowerCase()) ||
        p.attributes?.some((a) => a.value.toLowerCase() === t.toLowerCase())
      ) {
        types.push(t);
      }
    }
    return types;
  };

  // Dynamic Counts Calculation for Filters
  const filterCounts = useMemo(() => {
    const categoryCounts: Record<string, number> = {};
    const weightCounts: Record<string, number> = {};
    const brandCounts: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};

    categories.forEach((cat) => (categoryCounts[cat.slug] = 0));
    WEIGHT_OPTIONS.forEach((w) => (weightCounts[w] = 0));
    BRAND_OPTIONS.forEach((b) => (brandCounts[b] = 0));
    TYPE_OPTIONS.forEach((t) => (typeCounts[t] = 0));

    products.forEach((p) => {
      // Category count
      const cat = categories.find((c) => c.id === p.category_id || c.slug === p.category_id);
      if (cat && categoryCounts[cat.slug] !== undefined) {
        categoryCounts[cat.slug]++;
      }

      // Weight count
      const wt = getProductWeight(p);
      if (wt && weightCounts[wt] !== undefined) {
        weightCounts[wt]++;
      }

      // Brand count
      const br = getProductBrand(p);
      if (br && brandCounts[br] !== undefined) {
        brandCounts[br]++;
      }

      // Type count
      const types = getProductTypes(p);
      types.forEach((t) => {
        if (typeCounts[t] !== undefined) {
          typeCounts[t]++;
        }
      });
    });

    return { categoryCounts, weightCounts, brandCounts, typeCounts };
  }, [products, categories]);

  // Comprehensive Filtering & Sorting Logic
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // 1. Search query filter (Matches Product Name, Description, Tags, and SKU)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q)) ||
          p.variants?.some((v) => v.sku?.toLowerCase().includes(q))
      );
    }

    // 2. Category filter
    if (selectedCategory) {
      const selNorm = selectedCategory.toLowerCase().trim();
      const matchedCat = categories.find(
        (c) =>
          c.slug.toLowerCase() === selNorm ||
          c.id === selectedCategory ||
          c.name.toLowerCase() === selNorm
      );
      if (matchedCat) {
        result = result.filter(
          (p) =>
            p.category_id === matchedCat.id ||
            p.category_id === matchedCat.slug ||
            p.tags?.some((t) => t.toLowerCase() === matchedCat.slug.toLowerCase())
        );
      } else {
        // Fallback matching if categories have not loaded yet or direct slug/tag match
        result = result.filter(
          (p) =>
            p.category_id?.toLowerCase() === selNorm ||
            p.tags?.some((t) => t.toLowerCase() === selNorm) ||
            p.name.toLowerCase().includes(selNorm)
        );
      }
    }

    // 3. Price Range Filter
    result = result.filter((p) => {
      const priceVal = p.base_price / 100;
      return priceVal >= minPrice && priceVal <= maxPrice;
    });

    // 4. Weight Filter
    if (selectedWeights.length > 0) {
      result = result.filter((p) => {
        const wt = getProductWeight(p);
        return selectedWeights.includes(wt);
      });
    }

    // 5. Brand Filter
    if (selectedBrands.length > 0) {
      result = result.filter((p) => {
        const br = getProductBrand(p);
        return selectedBrands.includes(br);
      });
    }

    // 6. Type Filter
    if (selectedTypes.length > 0) {
      result = result.filter((p) => {
        const types = getProductTypes(p);
        return types.some((t) => selectedTypes.includes(t));
      });
    }

    // 7. Sorting
    switch (sortBy) {
      case "price_asc":
        result.sort((a, b) => a.base_price - b.base_price);
        break;
      case "price_desc":
        result.sort((a, b) => b.base_price - a.base_price);
        break;
      case "rating":
        result.sort((a, b) => (b.rating_avg || 5) - (a.rating_avg || 5));
        break;
      case "newest":
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "default":
      default:
        // Keep natural catalog ordering matching reference
        break;
    }

    return result;
  }, [
    products,
    categories,
    searchQuery,
    selectedCategory,
    minPrice,
    maxPrice,
    selectedWeights,
    selectedBrands,
    selectedTypes,
    sortBy,
  ]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    selectedCategory,
    minPrice,
    maxPrice,
    selectedWeights,
    selectedBrands,
    selectedTypes,
    sortBy,
  ]);

  // Paginated Slice
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Filter Toggles
  const toggleWeight = (weight: string) => {
    setSelectedWeights((prev) =>
      prev.includes(weight) ? prev.filter((w) => w !== weight) : [...prev, weight]
    );
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const resetAllFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setMinPrice(12);
    setMaxPrice(400);
    setSelectedWeights([]);
    setSelectedBrands([]);
    setSelectedTypes([]);
    setSortBy("default");
  };

  const hasActiveFilters =
    searchQuery ||
    selectedCategory ||
    minPrice !== 12 ||
    maxPrice !== 400 ||
    selectedWeights.length > 0 ||
    selectedBrands.length > 0 ||
    selectedTypes.length > 0;

  // Add to Cart handler
  const handleAddToCart = async (product: ProductItem, e?: React.MouseEvent, qty: number = 1) => {
    if (e) e.stopPropagation();
    try {
      const variantId = product.variants?.[0]?.id || `var-${product.id}`;
      await addItem(product.id, variantId, qty);
      setCartToast(`Added ${qty > 1 ? `${qty}x ` : ""} "${product.name}" to cart!`);
      setTimeout(() => setCartToast(null), 3000);
    } catch {
      setCartToast(`Added "${product.name}" to cart!`);
      setTimeout(() => setCartToast(null), 3000);
    }
  };

  // Toggle Wishlist
  const toggleWishlist = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWishlist((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  // Featured Products (3 items from the reference)
  const featuredProducts = useMemo(() => {
    const names = ["Cabbage Fresh", "Organic Potato", "Orange Juice"];
    const found = products.filter((p) => names.some((n) => p.name.toLowerCase().includes(n.toLowerCase())));
    return found.slice(0, 3);
  }, [products]);

  return (
    <div className="min-h-screen bg-white text-[#0A504A] font-sans antialiased flex flex-col">
      <Navbar />

      {/* Cart Toast Notification */}
      {cartToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#00A86B] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-fade-in text-sm font-semibold">
          <CheckCircle className="w-5 h-5 text-white" />
          <span>{cartToast}</span>
          <button
            onClick={openDrawer}
            className="ml-2 px-2.5 py-1 bg-white text-[#00A86B] rounded-lg text-xs font-bold hover:bg-gray-100"
          >
            View Cart
          </button>
        </div>
      )}

      {/* Store Page Hero Banner Section with 500px Desktop Height & 3D Illustration Background */}
      <section
        className="w-full relative overflow-hidden border-b border-[#D1E7D8] bg-[#c4ddc7] bg-no-repeat min-h-[380px] md:min-h-[440px]  flex items-center"
        style={{
          backgroundImage: `url('https://i.ibb.co.com/5hrXzWbV/8335b51ac60872f87269bd5682ca9c53.jpg')`,
          backgroundPosition: "center right",
          backgroundSize: "cover",
        }}
      >
        {/* Subtle gradient overlay to enhance text readability on the left while keeping the 3D illustration crisp on the right */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A504A]/90 via-[#0A504A]/70 to-transparent lg:via-[#0A504A]/40 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-0 w-full relative z-10">
          {/* Left Content Area - Flush with max-w-7xl grid */}
          <div className="max-w-xl lg:max-w-2xl space-y-3.5">
            {/* Breadcrumb - minimal text only */}
            <nav className="flex items-center gap-1.5 text-xs text-white/80 font-medium">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span className="text-white/50">/</span>
              <span className="text-white font-semibold">Shop Catalog</span>
            </nav>

            {/* Eyebrow Tag - subtle uppercase text */}
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.18em] text-white/90 uppercase">
              <Sparkles className="w-3.5 h-3.5 text-[#A2E4B8]" />
              Fresh Harvest & Daily Needs
            </span>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold text-white tracking-tight leading-[1.1] drop-shadow-sm">
              {selectedCategory
                ? `${categories.find((c) => c.slug.toLowerCase() === selectedCategory.toLowerCase() || c.id === selectedCategory)?.name || selectedCategory} Collection`
                : "Fresh Fruits & Daily Essentials"}
            </h1>

            {/* Subheading */}
            <p className="text-sm sm:text-[15px] text-white/85 max-w-lg leading-relaxed font-normal">
              Farm-fresh fruits, organic vegetables, and kitchen daily essentials handpicked and delivered fresh to your door with real-time tracking.
            </p>

            {/* Trust Highlights - inline text with dot separator, no pills */}
            <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-semibold text-white/80">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A2E4B8]"></span>
                Same-Day Delivery
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A2E4B8]"></span>
                100% Organic & Fresh
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A2E4B8]"></span>
                Freshness Guaranteed
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden flex items-center justify-between pb-4 mb-4 border-b border-gray-200">
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-800"
          >
            <Filter className="w-4 h-4 text-[#00A86B]" />
            <span>Filter Products</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-[#00A86B]"></span>
            )}
          </button>

          <span className="text-xs text-gray-500 font-medium">
            {filteredProducts.length} items found
          </span>
        </div>

        {/* Layout: Sidebar (Left) + Main Content (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* ===================================================================
              LEFT SIDEBAR FILTERS (Matching reference design exactly)
              =================================================================== */}
          <aside className="hidden lg:block lg:col-span-3 pr-8 lg:border-r border-gray-200 pb-12 space-y-7">
            {/* Active Filters / Reset Bar */}
            {hasActiveFilters && (
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Active Filters
                </span>
                <button
                  onClick={resetAllFilters}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#00A86B] hover:underline cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset All</span>
                </button>
              </div>
            )}

            {/* 1. CATEGORIES FILTER */}
            <div className="space-y-3">
              <h3 className="text-base font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100">
                Categories
              </h3>
              <div className="space-y-2 text-[13px]">
                {/* All Categories Option */}
                <button
                  onClick={() => setSelectedCategory("")}
                  className={`w-full flex items-center justify-between text-left transition-colors py-0.5 ${
                    selectedCategory === ""
                      ? "text-[#00A86B] font-bold"
                      : "text-gray-600 hover:text-gray-900 font-normal"
                  }`}
                >
                  <span>All Categories</span>
                  <span className="text-xs text-gray-400">({products.length})</span>
                </button>

                {/* Individual Categories with Active Green Checkmark matching reference */}
                {categories.map((cat) => {
                  const isSelected =
                    selectedCategory.toLowerCase() === cat.slug.toLowerCase() ||
                    selectedCategory === cat.id;
                  const count = filterCounts.categoryCounts[cat.slug] || 0;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(isSelected ? "" : cat.slug)}
                      className={`w-full flex items-center justify-between text-left transition-colors py-0.5 group ${
                        isSelected
                          ? "text-[#00A86B] font-bold"
                          : "text-gray-600 hover:text-gray-900 font-normal"
                      }`}
                    >
                      <span className="group-hover:translate-x-0.5 transition-transform">
                        {cat.name} ({count})
                      </span>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-[#00A86B] text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. PRICE RANGE FILTER */}
            <div className="space-y-3 pt-2">
              <h3 className="text-base font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100">
                Price
              </h3>
              <div className="space-y-3">
                {/* Interactive Range Slider Track */}
                <div className="relative pt-2 pb-1">
                  <div className="h-1.5 w-full bg-gray-200 rounded-full relative overflow-hidden">
                    <div
                      className="absolute h-full bg-[#00A86B] rounded-full"
                      style={{
                        left: `${((minPrice - 12) / (400 - 12)) * 100}%`,
                        right: `${100 - ((maxPrice - 12) / (400 - 12)) * 100}%`,
                      }}
                    />
                  </div>
                  <input
                    type="range"
                    min="12"
                    max="400"
                    value={minPrice}
                    onChange={(e) => {
                      const val = Math.min(Number(e.target.value), maxPrice - 5);
                      setMinPrice(val);
                    }}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer pointer-events-auto h-5"
                  />
                  <input
                    type="range"
                    min="12"
                    max="400"
                    value={maxPrice}
                    onChange={(e) => {
                      const val = Math.max(Number(e.target.value), minPrice + 5);
                      setMaxPrice(val);
                    }}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer pointer-events-auto h-5"
                  />
                </div>

                {/* Range Label matching reference: "Range : $12.00 - $400.00" */}
                <p className="text-xs text-gray-600 font-medium">
                  Range :{" "}
                  <span className="font-bold text-gray-900">
                    ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}
                  </span>
                </p>
              </div>
            </div>


            {/* 4. WEIGHT FILTER (Pill badges matching reference) */}
            <div className="space-y-3 pt-2">
              <h3 className="text-base font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100">
                Weight
              </h3>
              <div className="flex flex-wrap gap-2">
                {WEIGHT_OPTIONS.map((w) => {
                  const isSelected = selectedWeights.includes(w);
                  return (
                    <button
                      key={w}
                      type="button"
                      onClick={() => toggleWeight(w)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#00A86B] text-white border border-[#00A86B] shadow-xs"
                          : "bg-white text-gray-600 border border-gray-200 hover:border-gray-400 hover:text-gray-900"
                      }`}
                    >
                      {w}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. BRAND FILTER (Radio/Checkboxes with counts) */}
            <div className="space-y-3 pt-2">
              <h3 className="text-base font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100">
                Brand
              </h3>
              <div className="space-y-2">
                {BRAND_OPTIONS.map((b) => {
                  const isChecked = selectedBrands.includes(b);
                  const count = filterCounts.brandCounts[b] || 0;
                  return (
                    <button
                      key={b}
                      onClick={() => toggleBrand(b)}
                      className="w-full flex items-center justify-between text-left py-0.5 group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${
                            isChecked
                              ? "border-[#00A86B] bg-[#00A86B] text-white"
                              : "border-gray-300 group-hover:border-gray-400"
                          }`}
                        >
                          {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </span>
                        <span
                          className={`text-[13px] ${
                            isChecked ? "font-bold text-[#00A86B]" : "text-gray-600 group-hover:text-gray-900 font-normal"
                          }`}
                        >
                          {b} ({count})
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 6. TYPE FILTER */}
            <div className="space-y-3 pt-2">
              <h3 className="text-base font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100">
                Type
              </h3>
              <div className="space-y-2">
                {TYPE_OPTIONS.map((t) => {
                  const isChecked = selectedTypes.includes(t);
                  const count = filterCounts.typeCounts[t] || 0;
                  return (
                    <button
                      key={t}
                      onClick={() => toggleType(t)}
                      className="w-full flex items-center justify-between text-left py-0.5 group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${
                            isChecked
                              ? "border-[#00A86B] bg-[#00A86B] text-white"
                              : "border-gray-300 group-hover:border-gray-400"
                          }`}
                        >
                          {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </span>
                        <span
                          className={`text-[13px] ${
                            isChecked ? "font-bold text-[#00A86B]" : "text-gray-600 group-hover:text-gray-900 font-normal"
                          }`}
                        >
                          {t} ({count})
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 7. FEATURE PRODUCT WIDGET */}
            <div className="space-y-3.5 pt-2">
              <h3 className="text-base font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100">
                Feature Product
              </h3>
              <div className="space-y-3">
                {featuredProducts.map((p) => {
                  const imgUrl = getProductImageUrl(p.images);
                  const currentPrice = (p.base_price / 100).toFixed(2);
                  const compPrice = p.compare_at_price
                    ? (p.compare_at_price / 100).toFixed(2)
                    : (parseFloat(currentPrice) * 1.5).toFixed(2);

                  return (
                    <Link
                      key={p.id}
                      href={getProductUrl(p)}
                      className="flex items-center gap-3 group p-1.5 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-16 h-16 rounded-xl bg-[#F7F8F9] border border-gray-100 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                        <img
                          src={imgUrl}
                          alt={p.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="space-y-0.5 min-w-0 flex-1">
                        {/* 5 Stars */}
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <h4 className="text-xs font-bold text-gray-900 truncate group-hover:text-[#00A86B] transition-colors">
                          {p.name}
                        </h4>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="line-through text-gray-400 text-[11px]">${compPrice}</span>
                          <span className="font-bold text-rose-600">${currentPrice}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* ===================================================================
              RIGHT CATALOG AREA: Top Toolbar + Product Grid + Pagination
              =================================================================== */}
          <section className="lg:col-span-9 lg:pl-8 space-y-6">
            {/* Top Toolbar matching reference design */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-gray-100">
              {/* Item Counter on Left */}
              <div className="text-xs text-gray-500 font-medium">
                {filteredProducts.length > 0 ? (
                  <span>
                    Showing {startIndex + 1}–{Math.min(endIndex, filteredProducts.length)} of{" "}
                    {filteredProducts.length} item(s)
                  </span>
                ) : (
                  <span>Showing 0 items</span>
                )}
              </div>

              {/* Right Controls: View Switchers + Sort Dropdown */}
              <div className="flex items-center gap-3.5 self-end sm:self-auto">
                {/* Grid View Switchers */}
                <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200 text-gray-500">
                  {/* 4-Columns Button */}
                  <button
                    type="button"
                    onClick={() => setViewMode("grid-4")}
                    className={`p-1.5 rounded transition-all ${
                      viewMode === "grid-4" ? "bg-white text-[#00A86B] shadow-xs" : "hover:text-gray-900"
                    }`}
                    title="4 Columns Grid"
                  >
                    <Grid3X3 className="w-3.5 h-3.5" />
                  </button>

                  {/* 3-Columns Button (Default as shown in reference) */}
                  <button
                    type="button"
                    onClick={() => setViewMode("grid-3")}
                    className={`p-1.5 rounded transition-all ${
                      viewMode === "grid-3" ? "bg-white text-[#00A86B] shadow-xs" : "hover:text-gray-900"
                    }`}
                    title="3 Columns Grid"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>

                  {/* 2-Columns Button */}
                  <button
                    type="button"
                    onClick={() => setViewMode("grid-2")}
                    className={`p-1.5 rounded transition-all ${
                      viewMode === "grid-2" ? "bg-white text-[#00A86B] shadow-xs" : "hover:text-gray-900"
                    }`}
                    title="2 Columns Grid"
                  >
                    <div className="w-3.5 h-3.5 flex gap-0.5">
                      <div className="w-1.5 h-full bg-current rounded-xs" />
                      <div className="w-1.5 h-full bg-current rounded-xs" />
                    </div>
                  </button>

                  {/* List View Button */}
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={`p-1.5 rounded transition-all ${
                      viewMode === "list" ? "bg-white text-[#00A86B] shadow-xs" : "hover:text-gray-900"
                    }`}
                    title="List View"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Sort Dropdown matching "Default Sorting" with chevron */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="appearance-none pl-3 pr-8 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:border-gray-300 focus:outline-none focus:border-[#00A86B] cursor-pointer"
                  >
                    <option value="default">Default Sorting</option>
                    <option value="price_asc">Sort by price: low to high</option>
                    <option value="price_desc">Sort by price: high to low</option>
                    <option value="rating">Sort by rating</option>
                    <option value="newest">Sort by latest</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Keyword Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by title, organic tags, weight..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50/50 border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00A86B] focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Active Filter Chips / Badges */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 pt-1 pb-2">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mr-1">
                  Active Filters:
                </span>
                {selectedCategory && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F8EE] border border-[#A2E4B8] text-xs font-semibold text-[#0A504A] shadow-2xs">
                    <span>
                      Category:{" "}
                      <strong>
                        {categories.find(
                          (c) =>
                            c.slug.toLowerCase() === selectedCategory.toLowerCase() ||
                            c.id === selectedCategory
                        )?.name || selectedCategory}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedCategory("")}
                      className="hover:text-red-600 transition-colors p-0.5"
                      title="Remove category filter"
                    >
                      <X className="w-3 h-3 stroke-[2.5]" />
                    </button>
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-800 shadow-2xs">
                    <span>Search: &ldquo;{searchQuery}&rdquo;</span>
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="hover:text-red-600 transition-colors p-0.5"
                      title="Clear search"
                    >
                      <X className="w-3 h-3 stroke-[2.5]" />
                    </button>
                  </span>
                )}
                {(minPrice !== 12 || maxPrice !== 400) && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800 shadow-2xs">
                    <span>Price: ${minPrice} - ${maxPrice}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setMinPrice(12);
                        setMaxPrice(400);
                      }}
                      className="hover:text-red-600 transition-colors p-0.5"
                      title="Reset price"
                    >
                      <X className="w-3 h-3 stroke-[2.5]" />
                    </button>
                  </span>
                )}
                {selectedWeights.map((w) => (
                  <span
                    key={w}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-xs font-semibold text-teal-800 shadow-2xs"
                  >
                    <span>Weight: {w}</span>
                    <button
                      type="button"
                      onClick={() => toggleWeight(w)}
                      className="hover:text-red-600 transition-colors p-0.5"
                    >
                      <X className="w-3 h-3 stroke-[2.5]" />
                    </button>
                  </span>
                ))}
                {selectedBrands.map((b) => (
                  <span
                    key={b}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-800 shadow-2xs"
                  >
                    <span>Brand: {b}</span>
                    <button
                      type="button"
                      onClick={() => toggleBrand(b)}
                      className="hover:text-red-600 transition-colors p-0.5"
                    >
                      <X className="w-3 h-3 stroke-[2.5]" />
                    </button>
                  </span>
                ))}
                {selectedTypes.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 shadow-2xs"
                  >
                    <span>Type: {t}</span>
                    <button
                      type="button"
                      onClick={() => toggleType(t)}
                      className="hover:text-red-600 transition-colors p-0.5"
                    >
                      <X className="w-3 h-3 stroke-[2.5]" />
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer ml-auto"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Product Cards Grid */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-28 space-y-3">
                <Loader2 className="w-8 h-8 text-[#00A86B] animate-spin" />
                <p className="text-xs font-semibold text-gray-500">Loading catalog items...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="border border-dashed border-gray-300 rounded-2xl p-16 text-center space-y-3">
                <Package className="w-12 h-12 text-gray-300 mx-auto" />
                <h4 className="text-base font-bold text-gray-900">No products match your filters</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Try adjusting the price range or resetting color/category filters to see all available items.
                </p>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="px-4 py-2 rounded-xl bg-[#00A86B] text-white text-xs font-bold hover:bg-[#0A504A] transition-colors shadow-xs"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div
                className={`grid gap-6 ${
                  viewMode === "grid-4"
                    ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                    : viewMode === "grid-3"
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                    : viewMode === "grid-2"
                    ? "grid-cols-1 sm:grid-cols-2"
                    : "grid-cols-1"
                }`}
              >
                {paginatedProducts.map((p, pIdx) => {
                  const imgUrl = getProductImageUrl(p.images);
                  const variantTotal = p.variants?.reduce((sum, v: any) => sum + (v.quantity ?? 0), 0);
                  const totalStock = typeof p.inventory_quantity === "number"
                    ? p.inventory_quantity
                    : (variantTotal !== undefined ? variantTotal : 100);
                  const isOutOfStock = totalStock <= 0;
                  const isHot = p.tags?.includes("hot") || pIdx % 3 === 0;
                  const hasDeal = p.tags?.includes("deal") || p.name.includes("Cabbage") || p.name.includes("Eggs") || p.name.includes("Orange");
                  const discountPct = p.compare_at_price
                    ? Math.round(((p.compare_at_price - p.base_price) / p.compare_at_price) * 100)
                    : p.name.includes("Cabbage")
                    ? 38
                    : p.name.includes("Orange")
                    ? 37
                    : null;

                  const currentPrice = (p.base_price / 100).toFixed(2);
                  const comparePrice = p.compare_at_price
                    ? (p.compare_at_price / 100).toFixed(2)
                    : p.name.includes("Cabbage")
                    ? "80.00"
                    : p.name.includes("Orange")
                    ? "79.00"
                    : null;

                  const isRangePrice = p.name.includes("Adipi") || p.name.includes("Seafood");
                  const isLiked = wishlist.has(p.id);
                  const inCartQty =
                    cart?.items
                      ?.filter((it) => it.product_id === p.id)
                      ?.reduce((sum, it) => sum + it.quantity, 0) || 0;

                  // Base deal seconds for countdown timer
                  const baseDealSeconds = p.name.includes("Cabbage")
                    ? 322 * 86400 + 6 * 3600 + 18 * 60 + 2
                    : p.name.includes("Eggs")
                    ? 226 * 86400 + 6 * 3600 + 18 * 60 + 1
                    : 322 * 86400 + 6 * 3600 + 18 * 60 + 1;

                  // In list view: render horizontal card
                  if (viewMode === "list") {
                    return (
                      <div
                        key={p.id}
                        className="group flex flex-col sm:flex-row gap-5 p-4 rounded-2xl border border-gray-100 bg-white hover:shadow-lg hover:border-gray-200 transition-all"
                      >
                        {/* Image Canvas */}
                        <div className="relative w-full sm:w-56 h-48 rounded-xl bg-[#F7F8F9] flex items-center justify-center p-3 shrink-0 overflow-hidden">
                          <img
                            src={imgUrl}
                            alt={p.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                          {/* Badges */}
                          <div className="absolute top-2 left-2 flex flex-col gap-1">
                            {isOutOfStock ? (
                              <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase shadow-xs">
                                Stock Out
                              </span>
                            ) : (
                              <>
                                {inCartQty > 0 && (
                                  <span className="px-2 py-0.5 rounded-full bg-[#00A86B] text-white text-[10px] font-bold shadow-xs flex items-center gap-1">
                                    <ShoppingCart className="w-2.5 h-2.5" />
                                    {inCartQty} in Cart
                                  </span>
                                )}
                                {discountPct && (
                                  <span className="px-2 py-0.5 rounded-full bg-[#FB923C] text-white text-[10px] font-bold">
                                    -{discountPct}%
                                  </span>
                                )}
                                {isHot && (
                                  <span className="px-2 py-0.5 rounded-full bg-[#00A86B] text-white text-[10px] font-bold">
                                    Hot
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                          {isOutOfStock && (
                            <span className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-rose-600 text-white text-[9px] font-bold uppercase tracking-wider shadow-xs">
                              Stock Out
                            </span>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div className="space-y-1.5">
                            <Link href={getProductUrl(p)}>
                              <h3 className="text-base font-bold text-gray-900 hover:text-[#00A86B] transition-colors">
                                {p.name}
                              </h3>
                            </Link>
                            <p className="text-xs text-gray-500 line-clamp-2">{p.description}</p>
                            <div className="flex items-center gap-2 pt-1">
                              {isRangePrice ? (
                                <span className="font-bold text-rose-600 text-sm">
                                  ${(p.base_price / 100).toFixed(2)}–$79.00
                                </span>
                              ) : (
                                <>
                                  <span className="font-bold text-rose-600 text-sm">${currentPrice}</span>
                                  {comparePrice && (
                                    <span className="line-through text-gray-400 text-xs">${comparePrice}</span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 pt-3">
                            <button
                              type="button"
                              disabled={isOutOfStock}
                              onClick={(e) => !isOutOfStock && handleAddToCart(p, e)}
                              className={`px-4 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 ${
                                isOutOfStock
                                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                  : "bg-[#00A86B] hover:bg-[#0A504A] cursor-pointer"
                              }`}
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>{isOutOfStock ? "Stock Out" : "Add to Cart"}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickViewProduct(p)}
                              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
                              title="Quick View"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => toggleWishlist(p.id, e)}
                              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                                isLiked
                                  ? "bg-rose-50 text-rose-600 border border-rose-200"
                                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                              }`}
                              title="Wishlist"
                            >
                              <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-rose-600" : ""}`} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Standard Grid Card (Matching user's reference image)
                  const catName =
                    categories.find((c) => c.id === p.category_id || c.slug === p.category_id)?.name ||
                    "ORGANIC";

                  return (
                    <div
                      key={p.id}
                      className="group bg-white rounded-3xl p-3 border border-gray-200/80 hover:border-gray-300 hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative"
                    >
                      {/* Image Canvas matching reference image */}
                      <div className="relative w-full aspect-square rounded-2xl bg-[#ECEEF0] flex items-center justify-center p-5 overflow-hidden">
                        <Link href={getProductUrl(p)} className="w-full h-full flex items-center justify-center">
                          <img
                            src={imgUrl}
                            alt={p.name}
                            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                          />
                        </Link>

                        {/* Top-Left Badges (Stock Out OR In-Cart Count + BEST SELLER / -XX% OFF) */}
                        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 pointer-events-none">
                          {isOutOfStock ? (
                            <span className="px-3 py-1 rounded-full bg-rose-600 text-white text-[10px] font-black tracking-wider uppercase shadow-md flex items-center gap-1">
                              Stock Out
                            </span>
                          ) : (
                            <>
                              {inCartQty > 0 && (
                                <span className="px-2.5 py-1 rounded-full bg-[#00A86B] text-white text-[10px] font-black tracking-wider uppercase shadow-md flex items-center gap-1 pointer-events-auto animate-in zoom-in duration-200">
                                  <ShoppingCart className="w-3 h-3 stroke-[2.5]" />
                                  <span>{inCartQty} in cart</span>
                                </span>
                              )}
                              <span className="px-3 py-1 rounded-full bg-white text-[10px] font-black tracking-wider text-gray-900 uppercase shadow-xs">
                                {discountPct ? `-${discountPct}%` : isHot ? "BEST SELLER" : "ORGANIC"}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Top-Right Wishlist Heart Button matching image */}
                        <button
                          type="button"
                          onClick={(e) => toggleWishlist(p.id, e)}
                          className={`absolute top-3 right-3 w-8 h-8 rounded-full shadow-xs flex items-center justify-center transition-all duration-200 z-10 cursor-pointer ${
                            isLiked
                              ? "bg-rose-50 text-rose-500"
                              : "bg-white text-gray-400 hover:text-rose-500 hover:scale-110"
                          }`}
                          title={isLiked ? "Remove from wishlist" : "Add to wishlist"}
                        >
                          <Heart className={`w-4 h-4 ${isLiked ? "fill-rose-500 text-rose-500" : ""}`} />
                        </button>

                        {/* Floating Action Overlay on Hover matching image */}
                        <div className="absolute bottom-3 inset-x-3 flex items-center gap-2 z-20 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 pointer-events-auto">
                          {/* Quick View Button (White rounded pill) */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuickViewQty(1);
                              setQuickViewProduct(p);
                            }}
                            className="flex-1 py-2.5 px-3 bg-white/95 hover:bg-white text-gray-900 rounded-xl text-xs font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer backdrop-blur-xs"
                          >
                            <Eye className="w-3.5 h-3.5 text-gray-700" />
                            <span>Quick View</span>
                          </button>

                          {/* Plus Button (With live in-cart counter or disabled Stock Out) */}
                          <button
                            type="button"
                            disabled={isOutOfStock}
                            onClick={(e) => !isOutOfStock && handleAddToCart(p, e)}
                            className={`relative w-10 h-10 rounded-xl flex items-center justify-center shadow-md transition-all shrink-0 ${
                              isOutOfStock
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : inCartQty > 0
                                ? "bg-[#00A86B] hover:bg-[#0A504A] text-white ring-2 ring-[#A2E4B8] cursor-pointer hover:shadow-lg"
                                : "bg-black hover:bg-[#00A86B] text-white cursor-pointer hover:shadow-lg"
                            }`}
                            title={isOutOfStock ? "Stock Out - Item Unavailable" : inCartQty > 0 ? `Already ${inCartQty} in cart. Click to add more` : "Add to Cart"}
                          >
                            <Plus className="w-4 h-4 stroke-[3]" />
                            {inCartQty > 0 && !isOutOfStock && (
                              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#0A504A] text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white">
                                {inCartQty}
                              </span>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Card Content Below Canvas matching image */}
                      <div className="px-1 pt-3 pb-1 space-y-1.5">
                        {/* Row 1: Category Name + Rating */}
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                            {catName}
                          </span>
                          <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span className="text-gray-700">{p.rating_avg ? p.rating_avg.toFixed(1) : "4.8"}</span>
                          </div>
                        </div>

                        {/* Row 2: Product Name */}
                        <Link href={getProductUrl(p)} className="block">
                          <h3 className="font-bold text-sm text-gray-900 line-clamp-1 hover:text-[#00A86B] transition-colors mt-0.5">
                            {p.name}
                          </h3>
                        </Link>

                        {/* Row 3: Price + Color Swatches */}
                        <div className="flex items-center justify-between pt-0.5">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-base font-extrabold text-gray-900 font-sans tracking-tight">
                              ${currentPrice}
                            </span>
                            {comparePrice && (
                              <span className="text-xs text-gray-400 line-through font-normal">
                                ${comparePrice}
                              </span>
                            )}
                          </div>

                          {/* Fresh Badge */}
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Fresh
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Centered Pagination (Matching reference design: Green Active 1, Inactive 2, Chevron >) */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-8 pb-4">
                {[...Array(totalPages)].map((_, idx) => {
                  const pageNum = idx + 1;
                  const isActive = currentPage === pageNum;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => {
                        setCurrentPage(pageNum);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className={`w-9 h-9 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#00A86B] text-white shadow-xs"
                          : "bg-white text-gray-700 border border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {currentPage < totalPages && (
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="w-9 h-9 rounded-full bg-white text-gray-700 border border-gray-200 hover:border-gray-400 hover:bg-gray-50 text-xs font-bold flex items-center justify-center transition-all cursor-pointer"
                    title="Next Page"
                  >
                    &gt;
                  </button>
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Quick View Modal Popup */}
      {quickViewProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setQuickViewProduct(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setQuickViewProduct(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors z-10 cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Product Image Canvas */}
              <div className="relative aspect-square rounded-2xl bg-[#ECEEF0] p-6 flex items-center justify-center overflow-hidden border border-gray-100">
                <img
                  src={getProductImageUrl(quickViewProduct.images)}
                  alt={quickViewProduct.name}
                  className="w-full h-full object-contain"
                />
                <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white text-[10px] font-black tracking-wider text-gray-900 uppercase shadow-xs">
                  {categories.find((c) => c.id === quickViewProduct.category_id || c.slug === quickViewProduct.category_id)?.name || "ORGANIC"}
                </span>
              </div>

              {/* Product Info Section */}
              <div className="space-y-4">
                <div>
                  {/* Rating + Reviews */}
                  <div className="flex items-center gap-1.5 text-amber-400 mb-1.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="text-xs text-gray-600 font-semibold ml-1">
                      ({quickViewProduct.rating_avg ? quickViewProduct.rating_avg.toFixed(1) : "4.9"} / 5.0)
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="text-xs text-gray-400">
                      {quickViewProduct.rating_count || 18} reviews
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-snug">
                    {quickViewProduct.name}
                  </h3>

                  {/* Price */}
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-black text-gray-900">
                      ${(quickViewProduct.base_price / 100).toFixed(2)}
                    </span>
                    {quickViewProduct.compare_at_price && (
                      <span className="text-sm font-normal text-gray-400 line-through">
                        ${(quickViewProduct.compare_at_price / 100).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                  {quickViewProduct.description ||
                    "Freshly harvested, premium grade product sourced directly from verified organic producers and farm collectives."}
                </p>

                {/* Product Metadata & Stock */}
                {(() => {
                  const qvVariantTotal = quickViewProduct.variants?.reduce((sum, v: any) => sum + (v.quantity ?? 0), 0);
                  const qvTotalStock = typeof quickViewProduct.inventory_quantity === "number"
                    ? quickViewProduct.inventory_quantity
                    : (qvVariantTotal !== undefined ? qvVariantTotal : 100);
                  const isQvOutOfStock = qvTotalStock <= 0;

                  return (
                    <>
                      <div className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100 space-y-1.5 text-xs text-gray-600">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Stock Availability:</span>
                          {isQvOutOfStock ? (
                            <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              Stock Out
                            </span>
                          ) : (
                            <span className="text-[#00A86B] font-bold">
                              In Stock ({qvTotalStock} available)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">SKU / Item Barcode:</span>
                          <span className="font-mono font-bold text-gray-800 bg-white px-2 py-0.5 rounded border border-gray-200 text-[11px]">
                            {quickViewProduct.variants?.[0]?.sku || `NX-${quickViewProduct.id.slice(-6).toUpperCase()}`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Shipping:</span>
                          <span className="font-semibold text-gray-800">Hyperspeed Cold-Chain Delivery</span>
                        </div>
                      </div>

                      {/* Quantity Selector + Add to Cart */}
                      <div className="space-y-3 pt-1">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 p-1">
                            <button
                              type="button"
                              disabled={isQvOutOfStock}
                              onClick={() => setQuickViewQty((q) => Math.max(1, q - 1))}
                              className="w-8 h-8 rounded-lg bg-white hover:bg-gray-100 disabled:opacity-40 text-gray-700 font-bold flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-10 text-center font-bold text-xs text-gray-900">
                              {quickViewQty}
                            </span>
                            <button
                              type="button"
                              disabled={isQvOutOfStock || quickViewQty >= qvTotalStock}
                              onClick={() => setQuickViewQty((q) => q + 1)}
                              className="w-8 h-8 rounded-lg bg-white hover:bg-gray-100 disabled:opacity-40 text-gray-700 font-bold flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button
                            type="button"
                            disabled={isQvOutOfStock}
                            onClick={() => {
                              if (!isQvOutOfStock) {
                                handleAddToCart(quickViewProduct, undefined, quickViewQty);
                                setQuickViewProduct(null);
                              }
                            }}
                            className={`flex-1 py-3 px-5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
                              isQvOutOfStock
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-[#00A86B] hover:bg-[#0A504A] text-white shadow-[#00A86B]/20 hover:shadow-lg cursor-pointer"
                            }`}
                          >
                            <ShoppingBag className="w-4 h-4" />
                            <span>{isQvOutOfStock ? "Stock Out" : `Add to Cart (${quickViewQty})`}</span>
                          </button>
                        </div>
                      </div>
                    </>
                  );
                })()}

                  <Link
                    href={getProductUrl(quickViewProduct)}
                    className="block text-center py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors"
                  >
                    View Complete Product Specifications &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Mobile Filters Sliding Drawer */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden animate-fade-in">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full p-6 overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Filters</h3>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Categories</h4>
              <div className="space-y-1.5 text-xs">
                {categories.map((c) => {
                  const isSelected =
                    selectedCategory.toLowerCase() === c.slug.toLowerCase() ||
                    selectedCategory === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedCategory(isSelected ? "" : c.slug);
                        setIsMobileFilterOpen(false);
                      }}
                      className={`w-full flex items-center justify-between py-1 text-left ${
                        isSelected ? "text-[#00A86B] font-bold" : "text-gray-600"
                      }`}
                    >
                      <span>{c.name}</span>
                      <span>({filterCounts.categoryCounts[c.slug] || 0})</span>
                    </button>
                  );
                })}
              </div>
            </div>


            {/* Weights */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Weights</h4>
              <div className="flex flex-wrap gap-2">
                {WEIGHT_OPTIONS.map((w) => (
                  <button
                    key={w}
                    onClick={() => toggleWeight(w)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      selectedWeights.includes(w)
                        ? "bg-[#00A86B] text-white border-[#00A86B]"
                        : "bg-white text-gray-700 border-gray-200"
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex gap-2">
              <button
                type="button"
                onClick={resetAllFilters}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#00A86B] text-white text-xs font-bold"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ShopCatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white text-[#0A504A] flex flex-col">
          <Navbar />
          <div className="flex-1 flex flex-col items-center justify-center py-32 space-y-3">
            <Loader2 className="w-8 h-8 text-[#00A86B] animate-spin" />
            <p className="text-xs font-semibold text-gray-500">Loading catalog items...</p>
          </div>
        </div>
      }
    >
      <ShopCatalogContent />
    </Suspense>
  );
}
