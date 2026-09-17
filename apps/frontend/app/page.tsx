"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { ZevoLogo } from "../components/branding/ZevoLogo";
import { useCart } from "../providers/CartProvider";
import { useProducts } from "../hooks/useProducts";
import { useCategories } from "../hooks/useCategories";
import { ProductItem } from "../lib/api/products";
import { CategoryItem } from "../lib/api/categories";
import { getProductImageUrl } from "../lib/utils/productImages";
import { getProductUrl } from "../lib/utils/slug";
import {
  ShoppingBag,
  ArrowRight,
  Star,
  Heart,
  Play,
  X,
  Check,
  Truck,
  RotateCcw,
  ShieldCheck,
  Headphones,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Tag,
  LayoutGrid,
  Layers,
  CreditCard,
  Flame,
  Clock,
  Quote,
  Zap,
} from "lucide-react";

// 4 Featured Collection Cards matching actual database categories
const FEATURED_COLLECTIONS = [
  {
    title: "Fresh Fruits Harvest",
    slug: "fruits",
    image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?q=80&w=800&auto=format&fit=crop",
    linkText: "Shop Fruits",
  },
  {
    title: "Eco Garden Greens",
    slug: "eco-garden",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=800&auto=format&fit=crop",
    linkText: "Shop Organics",
  },
  {
    title: "Artisan Fresh Nuts",
    slug: "fresh-nuts",
    image: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?q=80&w=800&auto=format&fit=crop",
    linkText: "Shop Nuts",
  },
  {
    title: "Pure Gourmet Spices",
    slug: "spices",
    image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=800&auto=format&fit=crop",
    linkText: "Shop Spices",
  },
];

// Verified Customer Reviews & Community Testimonials
const TESTIMONIALS = [
  {
    id: 1,
    name: "Sophia Martinez",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop",
    location: "Austin, TX",
    productPurchased: "Fresh Organic Dragon Fruit",
    rating: 5,
    quote:
      "The produce freshness blew me away! Delivered to my door in less than 35 minutes, perfectly chilled and crisp. Zevo is officially my everyday grocery go-to.",
    date: "2 days ago",
  },
  {
    id: 2,
    name: "David Sterling",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
    location: "Seattle, WA",
    productPurchased: "Artisan Cold Brew & Raw Honey",
    rating: 5,
    quote:
      "Clean UI, seamless 1-click checkout, and authentic artisan pantry items I could never find in regular supermarkets. Rider GPS tracking was spot on.",
    date: "Yesterday",
  },
  {
    id: 3,
    name: "Elena Rostova",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
    location: "New York, NY",
    productPurchased: "Eco Garden Fresh Greens",
    rating: 5,
    quote:
      "Super crisp farm-fresh greens and berries, exactly as pictured. The live chat concierge was incredibly helpful when I modified my delivery address!",
    date: "3 days ago",
  },
];

// ============================================================================
// HERO SLIDER CONFIGURATION (3 SLIDES)
// You can easily change the image URLs, titles, subtitles, or tags below:
// ============================================================================
export interface HeroSlideItem {
  id: string;
  tag: string;
  titleLine1: string;
  titleLine2: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  image: string; // <-- Change this image URL to your own image
  alt: string;
  circleBg: string;
  objectPosition?: string;
}

const HERO_SLIDES: HeroSlideItem[] = [
  {
    id: "01",
    tag: "ZEVO KITCHEN & GOURMET MEALS",
    titleLine1: "Chef-Crafted Meals,",
    titleLine2: "Family Dining",
    subtitle: "Explore expert-led meal plans, farm-fresh ingredients, and gourmet meal kits curated for wholesome family living.",
    buttonText: "EXPLORE MEAL KITS",
    buttonLink: "/products",
    image: "/images/hero-slide-1.jpg",
    alt: "Zevo Kitchen Expert Services and Gourmet Meal Kits",
    circleBg: "#E8F8EE",
    objectPosition: "center 20%",
  },
  {
    id: "02",
    tag: "100% ORGANIC & FARM-FRESH",
    titleLine1: "Pure Organic,",
    titleLine2: "Farm-Fresh Daily",
    subtitle: "Handpicked crisp greens, cold-pressed juices, artisan pantry staples, and everyday groceries delivered to your door in minutes.",
    buttonText: "SHOP FRESH HARVEST",
    buttonLink: "/products",
    image: "/images/hero-slide-2.jpg",
    alt: "Pure Organic Farm-Fresh Daily Groceries",
    circleBg: "#E5ECE9",
    objectPosition: "center 15%",
  },
  {
    id: "03",
    tag: "ORGANIC & SUSTAINABLE",
    titleLine1: "Wholesome Goodness,",
    titleLine2: "Delivered Daily",
    subtitle: "Farm-fresh organic greens, free-range poultry, and sustainable staples curated for your healthy home.",
    buttonText: "EXPLORE NOW",
    buttonLink: "/products",
    image: "/images/hero-slide-3.png",
    alt: "Wholesome Goodness Delivered Daily",
    circleBg: "#E8EFE9",
    objectPosition: "center 20%",
  },
];

// Fallback alias for backward compatibility
const HERO_LOOKS = HERO_SLIDES;

// Customer avatar stack (as shown in reference design)
const HERO_CUSTOMERS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=160&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=160&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=160&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=160&auto=format&fit=crop",
];

export default function FashionHomePage() {
  const { addItem, openDrawer } = useCart();
  const {
    products,
    isLoading: isLoadingProducts,
    isFetching: isFetchingProducts,
  } = useProducts(
    { limit: 12 },
    { refetchInterval: 4000 } // 4s live real-time tracking
  );
  const {
    data: categories = [],
    isLoading: isLoadingCategories,
  } = useCategories({
    refetchInterval: 60000, // 60s background live tracking
  });

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isSliderHovered, setIsSliderHovered] = useState(false);
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});
  const [addedItemName, setAddedItemName] = useState<string | null>(null);
  const [isLookbookOpen, setIsLookbookOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [countdown, setCountdown] = useState<{ hours: string; minutes: string; seconds: string }>({
    hours: "08",
    minutes: "42",
    seconds: "15",
  });

  // Live countdown timer for Flash Deals (updates every second)
  useEffect(() => {
    const targetTime = Date.now() + 8 * 3600 * 1000 + 42 * 60 * 1000 + 15 * 1000;
    const updateCountdown = () => {
      const now = Date.now();
      const diff = Math.max(0, targetTime - now);
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setCountdown({
        hours: h.toString().padStart(2, "0"),
        minutes: m.toString().padStart(2, "0"),
        seconds: s.toString().padStart(2, "0"),
      });
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-advance hero slides every 2.8 seconds (pauses on hover)
  useEffect(() => {
    if (isSliderHovered) return;
    const interval = setInterval(() => {
      setActiveSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [isSliderHovered]);

  const toggleWishlist = (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlist((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };

  const handleAddToCart = (product: ProductItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const primaryVariant = product.variants[0];
    if (!primaryVariant) return;

    addItem(product.id, primaryVariant.id, 1);

    setAddedItemName(product.name);
    setTimeout(() => setAddedItemName(null), 3000);
    openDrawer();
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterSuccess(true);
    setNewsletterEmail("");
    setTimeout(() => setNewsletterSuccess(false), 5000);
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const currentSlide = HERO_SLIDES[activeSlideIndex] || HERO_SLIDES[0];
  const currentLook = currentSlide;

  return (
    <div className="min-h-screen bg-white text-[#0A504A] flex flex-col selection:bg-[#00A86B] selection:text-white relative">
      <Navbar />

      {/* Added to Bag Toast Alert */}
      {addedItemName && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0A504A] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-[#00A86B] animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-[#A2E4B8]" />
          <span className="text-xs font-semibold">
            <strong className="text-white">{addedItemName}</strong> added to bag
          </span>
        </div>
      )}

      {/* ====================================================================
          1. HERO SECTION (Editorial 3-Slide Slider with Zevo Brand Colors)
          ==================================================================== */}
      <section
        className="relative w-full bg-gradient-to-b from-[#F2FBF6] via-[#FAFDFB] to-white overflow-hidden border-b border-[#D1E7D8]"
        onMouseEnter={() => setIsSliderHovered(true)}
        onMouseLeave={() => setIsSliderHovered(false)}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 sm:pt-12 sm:pb-24 lg:pt-14 lg:pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">
            {/* Left Hero Content: Tag, Title, Subtitle, Explore Now, Social Proof */}
            <div className="lg:col-span-5 flex flex-col justify-center py-2 lg:pr-4 z-10">
              {/* Eyebrow Tag - animated on slide change */}
              <div key={currentSlide.id + "-tag"} className="mb-3 sm:mb-4 animate-hero-fade-up" style={{ animationDelay: "0ms" }}>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#E8F8EE] text-[#00A86B] border border-[#A2E4B8] text-xs font-bold tracking-[0.18em] uppercase shadow-2xs">
                  {currentSlide.tag}
                </span>
              </div>

              {/* Editorial Title */}
              <h1 key={currentSlide.id + "-title"} className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold text-[#0A504A] tracking-tight leading-[1.08] mb-4 sm:mb-5 font-sans animate-hero-fade-up" style={{ animationDelay: "60ms" }}>
                <span className="block">{currentSlide.titleLine1}</span>
                <span className="block">{currentSlide.titleLine2}</span>
              </h1>

              {/* Subtitle */}
              <p key={currentSlide.id + "-subtitle"} className="text-sm sm:text-base text-[#0A504A]/75 font-normal leading-relaxed max-w-md mb-7 sm:mb-9 animate-hero-fade-up" style={{ animationDelay: "120ms" }}>
                {currentSlide.subtitle}
              </p>

              {/* CTA Button: EXPLORE NOW */}
              <div className="mb-8 sm:mb-10">
                <Link
                  href={currentSlide.buttonLink}
                  className="group inline-flex items-center gap-2.5 px-7 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-[#00A86B] hover:bg-[#0A504A] active:scale-95 text-white text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-lg shadow-[#00A86B]/25 hover:shadow-xl hover:shadow-[#00A86B]/40"
                >
                  <span>{currentSlide.buttonText}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>

              {/* Social Proof: 4 Overlapping Avatars + 20K+ Customers + Stars & 4.8 Rating */}
              <div className="flex items-center gap-3.5 pt-1">
                <div className="flex -space-x-2.5 overflow-hidden">
                  {HERO_CUSTOMERS.map((avatar, idx) => (
                    <img
                      key={idx}
                      src={avatar}
                      alt={`Customer ${idx + 1}`}
                      className="inline-block w-9 h-9 sm:w-10 sm:h-10 rounded-full ring-2 ring-white object-cover shadow-xs"
                    />
                  ))}
                </div>

                <div className="flex flex-col">
                  <span className="text-xs sm:text-sm font-bold text-[#0A504A] leading-tight">
                    20K+ Happy Customers
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="flex items-center text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-gray-800 ml-0.5">4.8</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Center Art Column: Circular Disc + Olive Botanical Leaves + High-Fashion / Grocery Model */}
            <div className="lg:col-span-6 relative flex items-center justify-center min-h-[380px] sm:min-h-[460px] lg:min-h-[520px]">
              {/* Circular Backdrop Disc */}
              <div
                className="absolute w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] lg:w-[520px] lg:h-[520px] rounded-full"
                style={{
                  backgroundColor: currentSlide.circleBg,
                  transition: "background-color 0.7s cubic-bezier(0.22, 1, 0.36, 1)"
                }}
              />

              {/* Minimalist Emerald Leaves Botanical Branch */}
              <svg
                className="absolute right-0 sm:right-2 lg:right-4 top-2 sm:top-4 w-24 sm:w-32 lg:w-36 h-auto pointer-events-none opacity-85 z-0"
                viewBox="0 0 120 220"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M30 210 C45 160 55 110 90 20"
                  stroke="#00A86B"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path d="M42 175 C30 170 20 180 26 192 C32 195 44 190 42 175Z" fill="#00A86B" />
                <path d="M52 145 C66 142 74 152 68 163 C60 168 50 160 52 145Z" fill="#10B981" />
                <path d="M56 120 C42 112 34 122 40 134 C46 138 58 132 56 120Z" fill="#00A86B" />
                <path d="M68 90 C82 85 90 95 84 107 C76 112 66 104 68 90Z" fill="#10B981" />
                <path d="M74 65 C60 58 52 68 58 80 C64 84 76 78 74 65Z" fill="#00A86B" />
                <path d="M85 38 C97 32 105 42 99 53 C91 58 82 50 85 38Z" fill="#10B981" />
                <path d="M90 20 C92 10 99 12 98 22 C96 28 88 26 90 20Z" fill="#00A86B" />
              </svg>

              {/* Model Image with Soft Bottom Blend & Smooth Fade Transition */}
              <div className="relative z-10 w-full max-w-[440px] sm:max-w-[500px] lg:max-w-[560px] xl:max-w-[590px] h-[360px] sm:h-[460px] lg:h-[500px] flex items-center justify-center overflow-hidden rounded-2xl lg:rounded-3xl shadow-xl lg:shadow-2xl">
                <img
                  key={currentSlide.id}
                  src={currentSlide.image}
                  alt={currentSlide.alt}
                  style={{ objectPosition: currentSlide.objectPosition || "center 20%" }}
                  className="w-full h-full object-cover select-none pointer-events-none animate-hero-slide-in"
                />
              </div>
            </div>

            {/* Right Column: Vertical Slide Number Switcher (01, 02, 03) */}
            <div className="lg:col-span-1 flex lg:flex-col items-center justify-center gap-6 sm:gap-7 select-none">
              {HERO_SLIDES.map((slide, idx) => {
                const isActive = activeSlideIndex === idx;
                return (
                  <button
                    key={slide.id}
                    onClick={() => setActiveSlideIndex(idx)}
                    aria-label={`Go to slide ${slide.id}`}
                    className="group flex flex-col items-center cursor-pointer transition-all duration-300 focus:outline-none py-1 px-2"
                  >
                    <span
                      className={`text-sm sm:text-base font-semibold tracking-wider transition-colors duration-300 ${
                        isActive
                          ? "text-[#0A504A] font-bold"
                          : "text-[#0A504A]/40 group-hover:text-[#0A504A]"
                      }`}
                    >
                      {slide.id}
                    </span>
                    {/* Active brand green line */}
                    <span
                      className={`block h-[2.5px] rounded-full transition-all duration-300 ${
                        isActive
                          ? "w-6 bg-[#00A86B] mt-1 opacity-100"
                          : "w-0 bg-transparent mt-1 opacity-0 group-hover:w-3 group-hover:bg-[#D1E7D8] group-hover:opacity-100"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Auto-slide progress indicators */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
          {HERO_SLIDES.map((slide, idx) => (
            <button
              key={slide.id}
              onClick={() => setActiveSlideIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className="relative h-[3px] rounded-full overflow-hidden transition-all duration-300 cursor-pointer"
              style={{ width: activeSlideIndex === idx ? "32px" : "10px", backgroundColor: "rgba(0,168,107,0.15)" }}
            >
              {activeSlideIndex === idx && !isSliderHovered && (
                <span
                  className="absolute inset-y-0 left-0 bg-[#00A86B] rounded-full"
                  style={{ animation: "heroProgressBar 2.8s linear forwards" }}
                />
              )}
              {activeSlideIndex === idx && (
                <span className="absolute inset-0 bg-[#00A86B] rounded-full opacity-50" />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* ====================================================================
          2. TRUST FEATURES BAR (Positioned directly UNDER the hero section)
          4 Columns: Free Shipping, Easy Returns, Secure Payments, 24/7 Support
          ==================================================================== */}
      <section className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-10 mb-8 sm:mb-12">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-[#00A86B]/5 border border-[#D1E7D8] px-6 py-6 sm:px-8 sm:py-7">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x lg:divide-[#E8F8EE]">
            {/* 1. Free Shipping */}
            <div className="flex items-center gap-4 px-2 lg:px-6">
              <div className="w-12 h-12 rounded-2xl bg-[#E8F8EE] border border-[#D1E7D8] flex items-center justify-center text-[#00A86B] shrink-0 shadow-2xs">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-[#0A504A] leading-tight">
                  Free Shipping
                </h4>
                <p className="text-xs sm:text-sm text-[#0A504A]/70 font-medium mt-0.5">
                  On orders over $79
                </p>
              </div>
            </div>

            {/* 2. Easy Returns */}
            <div className="flex items-center gap-4 px-2 lg:px-6">
              <div className="w-12 h-12 rounded-2xl bg-[#E8F8EE] border border-[#D1E7D8] flex items-center justify-center text-[#00A86B] shrink-0 shadow-2xs">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-[#0A504A] leading-tight">
                  Easy Returns
                </h4>
                <p className="text-xs sm:text-sm text-[#0A504A]/70 font-medium mt-0.5">
                  Within 30 days
                </p>
              </div>
            </div>

            {/* 3. Secure Payments */}
            <div className="flex items-center gap-4 px-2 lg:px-6">
              <div className="w-12 h-12 rounded-2xl bg-[#E8F8EE] border border-[#D1E7D8] flex items-center justify-center text-[#00A86B] shrink-0 shadow-2xs">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-[#0A504A] leading-tight">
                  Secure Payments
                </h4>
                <p className="text-xs sm:text-sm text-[#0A504A]/70 font-medium mt-0.5">
                  100% protected
                </p>
              </div>
            </div>

            {/* 4. 24/7 Support */}
            <div className="flex items-center gap-4 px-2 lg:px-6">
              <div className="w-12 h-12 rounded-2xl bg-[#E8F8EE] border border-[#D1E7D8] flex items-center justify-center text-[#00A86B] shrink-0 shadow-2xs">
                <Headphones className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-[#0A504A] leading-tight">
                  24/7 Support
                </h4>
                <p className="text-xs sm:text-sm text-[#0A504A]/70 font-medium mt-0.5">
                  We&apos;re here to help
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          2. CIRCULAR CATEGORY HIGHLIGHTS ROW (Fixed clipping + 5 initial + View All)
          ==================================================================== */}
      {(() => {
        const rawList =
          categories.length > 0
            ? [
              ...categories.map((cat) => ({
                name: cat.name,
                slug: cat.slug,
                image: cat.image_url || "",
                isSaleBadge: false,
              })),
              { name: "Deals", slug: "deals", image: "", isSaleBadge: true },
            ]
            : [];

        const displayedCategories = showAllCategories ? rawList : rawList.slice(0, 5);

        return (
          <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm sm:text-base font-black text-[#0A504A] tracking-tight uppercase font-mono flex items-center gap-2">
                  <span>Curated Categories</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#E8F8EE] text-[#00A86B] border border-[#A2E4B8] lowercase font-sans">
                    {rawList.length} total
                  </span>
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowAllCategories(!showAllCategories)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00A86B] hover:text-[#0A504A] transition-colors cursor-pointer group"
              >
                <span>{showAllCategories ? "Show Less" : `View All (${rawList.length})`}</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Circular Category Items Row (Generous padding & overflow-safe image zoom) */}
            <div className="py-4 px-2 -my-2 flex items-center justify-between gap-4 sm:gap-6 overflow-x-auto scrollbar-none">
              {displayedCategories.map((cat, i) => (
                <Link
                  key={cat.slug || i}
                  href={cat.isSaleBadge ? "/products?sort=price_asc" : `/products?category=${cat.slug}`}
                  className="flex flex-col items-center gap-2.5 shrink-0 group focus:outline-none"
                >
                  {/* Outer circle container with smooth ring glow (never clips edges) */}
                  <div
                    className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 border-2 transition-all duration-300 flex items-center justify-center ${cat.isSaleBadge
                        ? "border-[#0A504A] bg-[#0A504A] text-white shadow-md group-hover:bg-[#00A86B] group-hover:border-[#00A86B] group-hover:ring-4 group-hover:ring-[#00A86B]/25"
                        : "border-[#D1E7D8] bg-white group-hover:border-[#00A86B] group-hover:ring-4 group-hover:ring-[#00A86B]/25 shadow-2xs"
                      }`}
                  >
                    {cat.isSaleBadge ? (
                      <span className="font-serif font-black tracking-wider text-xs sm:text-sm text-white uppercase">
                        SALE
                      </span>
                    ) : (
                      /* Inner mask with smooth image scale */
                      <div className="w-full h-full rounded-full overflow-hidden bg-[#E8F8EE] flex items-center justify-center">
                        {cat.image ? (
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-115"
                          />
                        ) : (
                          <Layers className="w-6 h-6 text-[#00A86B]/50" />
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-[#0A504A] group-hover:text-[#00A86B] transition-colors">
                    {cat.name}
                  </span>
                </Link>
              ))}

              {/* View All Button Card (Shown when initial 5 categories are displayed) */}
              {!showAllCategories && rawList.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllCategories(true)}
                  className="flex flex-col items-center gap-2.5 shrink-0 group cursor-pointer focus:outline-none"
                  title="View all categories"
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 border-2 border-[#0A504A] bg-[#0A504A] group-hover:bg-[#00A86B] group-hover:border-[#00A86B] group-hover:ring-4 group-hover:ring-[#00A86B]/25 transition-all duration-300 shadow-md flex flex-col items-center justify-center text-white">
                    <LayoutGrid className="w-6 h-6 text-[#A2E4B8] group-hover:text-white group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white mt-1">
                      View All
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[#0A504A] group-hover:text-[#00A86B] transition-colors flex items-center gap-1">
                    <span>+{rawList.length - 5} More</span>
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </button>
              )}
            </div>
          </section>
        );
      })()}

      {/* ====================================================================
          3. SHOP BY CATEGORY / FIND YOUR PERFECT STYLE (4 Editorial Cards)
          ==================================================================== */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#00A86B]">
              Shop by Category
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif text-[#0A504A] mt-1">
              Find Your Perfect Style
            </h2>
          </div>

          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00A86B] hover:text-[#0A504A] transition-colors"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURED_COLLECTIONS.map((item, idx) => (
            <Link
              key={idx}
              href={`/products?category=${item.slug}`}
              className="group relative h-96 rounded-3xl overflow-hidden shadow-md border border-[#D1E7D8] flex flex-col justify-end p-6"
            >
              <img
                src={item.image}
                alt={item.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A504A]/85 via-[#0A504A]/20 to-transparent transition-opacity" />

              <div className="relative z-10 text-white">
                <h3 className="font-serif text-xl font-bold mb-1 group-hover:translate-x-1 transition-transform">
                  {item.title}
                </h3>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A2E4B8] group-hover:text-white">
                  <span>{item.linkText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ====================================================================
          4. DUAL PROMOTIONAL EDITORIAL BANNERS
          ==================================================================== */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Banner 1: Spring Sale */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#E8F8EE] to-[#F7F7F2] border border-[#D1E7D8] p-8 flex items-center justify-between min-h-[260px] shadow-sm">
            <div className="relative z-10 max-w-xs">
              <span className="text-[10px] font-bold tracking-widest text-[#00A86B] uppercase block mb-1">
                Limited Time Offer
              </span>
              <h3 className="text-2xl sm:text-3xl font-serif text-[#0A504A] leading-tight mb-4">
                Spring Sale Up to 50% Off
              </h3>
              <Link
                href="/products?sort=price_asc"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0A504A] hover:bg-[#00A86B] text-white text-xs font-bold transition-all shadow-xs"
              >
                <span>Shop The Sale</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="w-36 h-48 sm:w-44 sm:h-56 rounded-2xl overflow-hidden shadow-lg border border-white/60 shrink-0">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop"
                alt="Spring Sale"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Banner 2: Fresh Styles Just Landed */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#E8F8EE] to-[#F7F7F2] border border-[#D1E7D8] p-8 flex items-center justify-between min-h-[260px] shadow-sm">
            <div className="relative z-10 max-w-xs">
              <span className="text-[10px] font-bold tracking-widest text-[#00A86B] uppercase block mb-1">
                New Arrivals
              </span>
              <h3 className="text-2xl sm:text-3xl font-serif text-[#0A504A] leading-tight mb-4">
                Fresh Styles Just Landed
              </h3>
              <Link
                href="/products?sort=newest"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0A504A] hover:bg-[#00A86B] text-white text-xs font-bold transition-all shadow-xs"
              >
                <span>Explore New In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="w-36 h-48 sm:w-44 sm:h-56 rounded-2xl overflow-hidden shadow-lg border border-white/60 shrink-0">
              <img
                src="https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=400&auto=format&fit=crop"
                alt="New Arrivals Clothes Rack"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          5. FLASH DEALS & LIVE COUNTDOWN TIMER
          ==================================================================== */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="bg-gradient-to-br from-[#E8F8EE]/70 via-white to-[#F2FBF6] rounded-3xl border border-[#A2E4B8]/70 p-6 sm:p-10 shadow-sm">
          {/* Header Row */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8 pb-6 border-b border-[#D1E7D8]">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F8EE] border border-[#A2E4B8] text-[#00A86B] text-[11px] font-black uppercase tracking-wider mb-2">
                <Flame className="w-3.5 h-3.5 fill-[#00A86B] text-[#00A86B]" />
                <span>Limited Time Daily Event</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#0A504A]">
                Flash Deals & Special Offers
              </h2>
              <p className="text-xs sm:text-sm text-[#0A504A]/70 mt-1">
                Grab these top-rated essentials at up to 40% off before the countdown expires!
              </p>
            </div>

            {/* Countdown Clock & CTA */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              {/* Live Timer Badges */}
              <div className="flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-2xl border border-[#D1E7D8] shadow-2xs">
                <Clock className="w-4 h-4 text-[#00A86B]" />
                <span className="text-[11px] font-bold text-[#0A504A] uppercase tracking-wider mr-1">
                  Ends In:
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="flex flex-col items-center">
                    <span className="min-w-[34px] h-8 px-1.5 rounded-lg bg-[#0A504A] text-white font-mono text-xs sm:text-sm font-bold flex items-center justify-center shadow-2xs">
                      {countdown.hours}
                    </span>
                    <span className="text-[9px] text-[#0A504A]/60 font-semibold mt-0.5">HRS</span>
                  </div>
                  <span className="text-[#0A504A] font-bold -mt-3">:</span>
                  <div className="flex flex-col items-center">
                    <span className="min-w-[34px] h-8 px-1.5 rounded-lg bg-[#0A504A] text-white font-mono text-xs sm:text-sm font-bold flex items-center justify-center shadow-2xs">
                      {countdown.minutes}
                    </span>
                    <span className="text-[9px] text-[#0A504A]/60 font-semibold mt-0.5">MIN</span>
                  </div>
                  <span className="text-[#0A504A] font-bold -mt-3">:</span>
                  <div className="flex flex-col items-center">
                    <span className="min-w-[34px] h-8 px-1.5 rounded-lg bg-[#00A86B] text-white font-mono text-xs sm:text-sm font-bold flex items-center justify-center shadow-2xs animate-pulse">
                      {countdown.seconds}
                    </span>
                    <span className="text-[9px] text-[#00A86B] font-semibold mt-0.5">SEC</span>
                  </div>
                </div>
              </div>

              <Link
                href="/products?sort=price_asc"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#00A86B] hover:bg-[#0A504A] text-white text-xs font-bold transition-all shadow-md shadow-[#00A86B]/20 shrink-0"
              >
                <span>View All Deals</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Flash Deals 4-Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(products.length >= 4 ? products.slice(0, 4) : products).map((prod, dealIdx) => {
              const discountRates = [35, 25, 40, 30];
              const discountRate = discountRates[dealIdx % discountRates.length];
              const originalPrice = Math.round(prod.base_price * (1 + discountRate / 100));
              const stockSold = [26, 19, 34, 15][dealIdx % 4];
              const stockAvailable = [6, 11, 4, 8][dealIdx % 4];
              const percentSold = Math.round((stockSold / (stockSold + stockAvailable)) * 100);
              const isFav = wishlist[prod.id];

              return (
                <div
                  key={"deal-" + prod.id}
                  className="group rounded-2xl bg-white border border-[#D1E7D8] overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-lg transition-all"
                >
                  {/* Image Container with Discount Badge & Quick Add */}
                  <div className="relative h-60 bg-[#F7F7F2] overflow-hidden flex items-center justify-center">
                    <span className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                      <Zap className="w-3 h-3 fill-white" />
                      -{discountRate}% OFF
                    </span>

                    <Link href={getProductUrl(prod)} className="w-full h-full block">
                      <img
                        src={getProductImageUrl(prod.images)}
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </Link>

                    {/* Wishlist Button */}
                    <button
                      onClick={(e) => toggleWishlist(prod.id, e)}
                      className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md border border-[#D1E7D8] flex items-center justify-center shadow-2xs hover:scale-110 transition-transform"
                      title="Add to wishlist"
                    >
                      <Heart
                        className={`w-4 h-4 transition-colors ${
                          isFav ? "fill-rose-500 text-rose-500" : "text-[#0A504A] hover:text-rose-500"
                        }`}
                      />
                    </button>

                    {/* Quick Add Button */}
                    <button
                      onClick={(e) => handleAddToCart(prod, e)}
                      className="absolute bottom-3 left-3 right-3 py-2 rounded-full bg-[#00A86B] hover:bg-[#0A504A] text-white text-[11px] font-bold backdrop-blur-md opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Claim Deal & Add</span>
                    </button>
                  </div>

                  {/* Details */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <Link href={getProductUrl(prod)} className="block">
                        <h3 className="font-semibold text-xs text-[#0A504A] line-clamp-1 group-hover:text-[#00A86B] transition-colors">
                          {prod.name}
                        </h3>
                      </Link>

                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-base font-black font-mono text-[#00A86B]">
                          {formatPrice(prod.base_price)}
                        </span>
                        <span className="text-xs font-mono text-gray-400 line-through">
                          {formatPrice(originalPrice)}
                        </span>
                      </div>
                    </div>

                    {/* Scarcity Progress Meter */}
                    <div className="mt-3 pt-2.5 border-t border-[#D1E7D8]">
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="text-[#0A504A]/70 font-medium">Sold: <strong>{stockSold}</strong></span>
                        <span className="text-rose-600 font-bold">Only {stockAvailable} left!</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#E8F8EE] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#00A86B] to-emerald-400 rounded-full"
                          style={{ width: `${percentSold}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ====================================================================
          6. BEST SELLERS / OUR MOST LOVED PICKS (Real Products Grid)
          ==================================================================== */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#00A86B]">
              Best Sellers
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif text-[#0A504A] mt-1">
              Our Most Loved Picks
            </h2>
          </div>

          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00A86B] hover:text-[#0A504A] transition-colors"
          >
            <span>View All Products</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoadingProducts && products.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-white border border-[#D1E7D8] overflow-hidden p-3 animate-pulse">
                <div className="h-64 bg-emerald-100/60 rounded-xl mb-3" />
                <div className="h-4 bg-emerald-100/80 rounded w-3/4 mb-2" />
                <div className="h-3 bg-emerald-100/60 rounded w-1/2 mb-3" />
                <div className="h-5 bg-emerald-100/80 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-[#D1E7D8]">
            <p className="text-[#00A86B] font-semibold text-sm">No products in catalog yet.</p>
            <p className="text-[#0A504A]/70 text-xs mt-1">Visit the admin panel to add products to the database.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.slice(0, 8).map((prod) => {
              const isFav = wishlist[prod.id];
              return (
                <div
                  key={prod.id}
                  className="group rounded-2xl bg-white border border-[#D1E7D8] overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-md transition-all"
                >
                  {/* Image Container with Wishlist */}
                  <div className="relative h-64 bg-[#F7F7F2] overflow-hidden flex items-center justify-center">
                    <Link href={getProductUrl(prod)} className="w-full h-full block">
                      <img
                        src={getProductImageUrl(prod.images)}
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </Link>

                    {/* Wishlist Heart Button */}
                    <button
                      onClick={(e) => toggleWishlist(prod.id, e)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md border border-[#D1E7D8] flex items-center justify-center shadow-2xs hover:scale-110 transition-transform"
                      title="Add to wishlist"
                    >
                      <Heart
                        className={`w-4 h-4 transition-colors ${isFav
                            ? "fill-rose-500 text-rose-500"
                            : "text-[#0A504A] hover:text-rose-500"
                          }`}
                      />
                    </button>

                    {/* Quick Add Button overlay */}
                    <button
                      onClick={(e) => handleAddToCart(prod, e)}
                      className="absolute bottom-3 left-3 right-3 py-2 rounded-full bg-[#0A504A]/90 hover:bg-[#00A86B] text-white text-[11px] font-bold backdrop-blur-md opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Quick Add</span>
                    </button>
                  </div>

                  {/* Details */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      {(() => {
                        const prodCat = categories.find(
                          (c) => c.id === prod.category_id || c.slug === prod.category_id
                        );
                        return prodCat ? (
                          <Link
                            href={`/products?category=${prodCat.slug}`}
                            className="text-[10px] uppercase font-bold tracking-wider text-[#00A86B] hover:underline block mb-0.5"
                          >
                            {prodCat.name}
                          </Link>
                        ) : null;
                      })()}
                      <Link href={getProductUrl(prod)} className="block">
                        <h3 className="font-semibold text-xs text-[#0A504A] line-clamp-1 group-hover:text-[#00A86B] transition-colors">
                          {prod.name}
                        </h3>
                      </Link>

                      <div className="flex items-center gap-1 mt-1 text-[11px] text-amber-500">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="font-bold text-[#0A504A]">
                          {(prod.rating_avg ?? 5.0).toFixed(1)}
                        </span>
                        <span className="text-[#0A504A]/70 text-[10px]">
                          ({prod.rating_count ?? 0})
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[#D1E7D8] flex items-center justify-between">
                      <span className="text-sm font-black font-mono text-[#0A504A]">
                        {formatPrice(prod.base_price)}
                      </span>

                      <span className="text-[10px] text-[#0A504A]/70 font-mono">
                        {prod.variants?.length || 1} SKU{(prod.variants?.length || 1) > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>


      {/* ====================================================================
          7. VERIFIED CUSTOMER REVIEWS & COMMUNITY TESTIMONIALS
          ==================================================================== */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#E8F8EE] border border-[#A2E4B8] text-[#00A86B] text-[11px] font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#00A86B]" />
            <span>Community Stories</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-serif font-bold text-[#0A504A]">
            Loved by 20,000+ Happy Customers
          </h2>
          <p className="text-xs sm:text-sm text-[#0A504A]/75 mt-2">
            See why households count on Zevo for daily farm-fresh groceries, rapid delivery, and transparent quality.
          </p>

          {/* Social Proof Trust Score Pill */}
          <div className="inline-flex items-center gap-2 mt-4 px-4 py-1.5 rounded-full bg-white border border-[#D1E7D8] shadow-2xs">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-xs font-bold text-[#0A504A]">4.9 / 5.0</span>
            <span className="text-[11px] text-[#0A504A]/60 font-medium">· 2,450+ Verified Ratings</span>
          </div>
        </div>

        {/* 3 Review Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.id}
              className="group relative bg-white rounded-3xl p-6 sm:p-8 border border-[#D1E7D8] shadow-2xs hover:shadow-lg hover:border-[#00A86B]/50 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Quote Icon & Stars */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#E8F8EE] flex items-center justify-center text-[#00A86B]">
                    <Quote className="w-4 h-4" />
                  </div>
                </div>

                {/* Quote text */}
                <p className="text-xs sm:text-sm text-[#0A504A]/90 leading-relaxed italic mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              <div>
                {/* Verified Item Tag */}
                <div className="pt-4 border-t border-[#E8F8EE] mb-4">
                  <span className="text-[10px] font-semibold text-[#00A86B] bg-[#E8F8EE] px-2.5 py-1 rounded-md inline-block">
                    ✓ Verified Purchase · {t.productPurchased}
                  </span>
                </div>

                {/* Reviewer Profile */}
                <div className="flex items-center gap-3.5">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-11 h-11 rounded-full object-cover border-2 border-[#A2E4B8] shadow-xs shrink-0"
                  />
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#0A504A] flex items-center gap-1.5">
                      <span>{t.name}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00A86B]" />
                    </h4>
                    <p className="text-[11px] text-[#0A504A]/60">
                      {t.location} · <span className="font-mono text-[10px]">{t.date}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ====================================================================
          8. NEWSLETTER / JOIN OUR STYLE LIST
          ==================================================================== */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-3xl overflow-hidden bg-white border border-[#D1E7D8] grid grid-cols-1 md:grid-cols-12 shadow-md">
          {/* Left Model Image */}
          <div className="md:col-span-4 h-64 md:h-auto relative overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=600&auto=format&fit=crop"
              alt="Fresh Organic Harvest"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Right Newsletter Form */}
          <div className="md:col-span-8 p-8 sm:p-12 flex flex-col justify-center bg-gradient-to-r from-white via-[#E8F8EE]/40 to-white">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#00A86B] mb-1">
              Get 10% Off Your First Order
            </span>
            <h2 className="text-3xl font-serif text-[#0A504A] mb-2">
              Join Our Fresh Harvest Club
            </h2>
            <p className="text-xs sm:text-sm text-[#0A504A]/70 max-w-md mb-6 leading-relaxed">
              Sign up for exclusive farm deals, new seasonal harvest alerts, and 10% off voucher for your first organic grocery order.
            </p>

            {newsletterSuccess ? (
              <div className="p-3.5 rounded-2xl bg-[#E8F8EE] border border-[#A2E4B8] text-[#0A504A] text-xs font-semibold flex items-center gap-2 max-w-md">
                <CheckCircle2 className="w-4 h-4 text-[#00A86B]" />
                <span>Thank you! Your 10% welcome voucher code has been applied.</span>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md">
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email address..."
                  className="flex-1 px-4 py-3 rounded-full bg-white border border-[#D1E7D8] text-xs text-[#0A504A] placeholder-[#0A504A]/50 focus:outline-none focus:border-[#00A86B] shadow-2xs"
                />
                <button
                  type="submit"
                  className="px-8 py-3 rounded-full bg-[#0A504A] hover:bg-[#00A86B] text-white text-xs font-bold transition-all shadow-md shadow-[#0A504A]/20 shrink-0"
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ====================================================================
          8. EDITORIAL FOOTER
          ==================================================================== */}
      <Footer />

      {/* ====================================================================
          LOOKBOOK MODAL OVERLAY
          ==================================================================== */}
      {isLookbookOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-3xl bg-[#F7F7F2] rounded-3xl overflow-hidden shadow-2xl border border-[#D1E7D8]">
            <div className="p-6 border-b border-[#D1E7D8] flex items-center justify-between bg-[#E8F8EE]/60">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#00A86B]" />
                <h3 className="font-serif text-lg font-bold text-[#0A504A]">
                  Seasonal Atelier Lookbook
                </h3>
              </div>
              <button
                onClick={() => setIsLookbookOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#E8F8EE] text-[#0A504A] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div className="rounded-2xl overflow-hidden shadow-md h-80">
                <img
                  src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop"
                  alt="Lookbook Feature"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-4">
                <span className="text-[10px] font-bold tracking-widest text-[#00A86B] uppercase block">
                  Couture Capsule 2026
                </span>
                <h4 className="text-2xl font-serif text-[#0A504A]">
                  Tailored Forms & Sensual Textures
                </h4>
                <p className="text-xs text-[#0A504A]/80 leading-relaxed">
                  Sculpted in natural European linens, brushed vegan leathers, and silk blends. Each garment is engineered for fluid ease and enduring confidence.
                </p>

                <div className="pt-2">
                  <Link
                    href="/products"
                    onClick={() => setIsLookbookOpen(false)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0A504A] hover:bg-[#00A86B] text-white text-xs font-bold transition-all shadow-md shadow-[#0A504A]/20"
                  >
                    <span>Shop Lookbook Pieces</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
