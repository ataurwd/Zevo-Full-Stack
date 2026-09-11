"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "../../../components/Navbar";
import { useCart } from "../../../providers/CartProvider";
import {
  getProductPublicDetail,
  ProductItem,
  ProductVariant,
} from "../../../lib/api/products";
import {
  Package,
  Star,
  ShieldCheck,
  Truck,
  CheckCircle2,
  ArrowLeft,
  Share2,
  ShoppingCart,
  Zap,
  Loader2,
  Store,
  Tag,
} from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<ProductItem | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartSuccess, setCartSuccess] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      if (!productId) return;
      try {
        const data = await getProductPublicDetail(productId);
        setProduct(data);
        if (data.variants && data.variants.length > 0) {
          // Select first active variant
          const activeVar = data.variants.find((v) => v.is_active) || data.variants[0];
          setSelectedVariant(activeVar);
        }
      } catch (err: any) {
        setError(err.message || "Product not found or unavailable.");
      } finally {
        setIsLoading(false);
      }
    }
    loadProduct();
  }, [productId]);

  const formatCents = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    if (!product || !selectedVariant) return;
    setIsAdding(true);
    try {
      await addItem(product.id, selectedVariant.id, quantity);
      setCartSuccess(true);
      setTimeout(() => {
        setCartSuccess(false);
      }, 2500);
    } catch (err: any) {
      alert(err.message || "Failed adding to cart");
    } finally {
      setIsAdding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080b12] text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-32">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
          <p className="text-sm text-slate-400">Retrieving product telemetry & inventory...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#080b12] text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-lg mx-auto px-6 py-24 text-center">
          <Package className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Product Unavailable</h2>
          <p className="text-xs text-slate-400 mb-6">{error || "This item is not currently active."}</p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Marketplace</span>
          </Link>
        </div>
      </div>
    );
  }

  const currentPrice = selectedVariant ? selectedVariant.price : product.base_price;
  const comparePrice = selectedVariant?.compare_at_price;
  const discountPercent =
    comparePrice && comparePrice > currentPrice
      ? Math.round(((comparePrice - currentPrice) / comparePrice) * 100)
      : null;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col selection:bg-blue-600 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
          <Link href="/products" className="hover:text-blue-600 transition-colors">
            Marketplace
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-medium truncate">{product.name}</span>
        </div>

        {/* Product Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Gallery / Image Display */}
          <div className="space-y-4">
            <div className="aspect-square w-full rounded-3xl bg-white border border-slate-200/80 overflow-hidden flex items-center justify-center relative shadow-xs">
              {product.images && product.images.length > 0 && product.images[0]?.url ? (
                <img
                  src={product.images[0].url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400">
                  <Package className="w-24 h-24 stroke-1 mb-2" />
                  <span className="text-xs font-mono text-slate-400">
                    High-Resolution Photography
                  </span>
                </div>
              )}

              {discountPercent && (
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-rose-600 text-white font-black text-xs shadow-md">
                  SAVE {discountPercent}%
                </div>
              )}
            </div>

            {/* Hyperlocal logistics promise card */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-blue-600 text-white">
                <Truck className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">Hyperlocal Fast Dispatch</span>
                <span className="text-slate-600">
                  Shipped directly by verified merchant with live Socket.IO courier GPS tracking.
                </span>
              </div>
            </div>
          </div>

          {/* Product Purchasing & Variant Controls */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-amber-500 text-xs mb-2">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-slate-800">{product.rating_avg.toFixed(1)}</span>
                </div>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500">({product.rating_count} verified reviews)</span>
                <span className="text-slate-300">•</span>
                <span className="text-emerald-700 font-bold">In Stock</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                {product.name}
              </h1>

              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-slate-500">Vendor:</span>
                <span className="text-xs font-semibold text-blue-600 font-mono">
                  Store #{product.store_id.slice(-6)}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                  Verified Partner
                </span>
              </div>
            </div>

            {/* Price Box */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-baseline gap-3">
              <span className="text-3xl font-black text-slate-900 font-mono">
                {formatCents(currentPrice)}
              </span>
              {comparePrice && comparePrice > currentPrice && (
                <span className="text-sm font-mono text-slate-400 line-through">
                  {formatCents(comparePrice)}
                </span>
              )}
              {selectedVariant?.sku && (
                <span className="ml-auto text-xs font-mono text-slate-400">
                  SKU: {selectedVariant.sku}
                </span>
              )}
            </div>

            {/* Variant Selector */}
            {product.variants && product.variants.length > 0 && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Select Edition / Variant
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {product.variants.map((v) => (
                    <button
                      key={v.id || v.sku}
                      onClick={() => setSelectedVariant(v)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        selectedVariant?.sku === v.sku
                          ? "bg-blue-50 border-blue-500 text-slate-900 shadow-sm"
                          : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300"
                      }`}
                    >
                      <span className="block text-xs font-bold truncate">{v.name}</span>
                      <span className="block text-xs font-mono text-blue-600 mt-1 font-bold">
                        {formatCents(v.price)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector & Add to Cart */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center rounded-xl bg-white border border-slate-200 p-1 shadow-2xs">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 text-sm font-bold"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-mono text-sm font-bold text-slate-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 text-sm font-bold"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-blue-600 hover:bg-blue-700 text-sm font-bold text-white transition-all shadow-md shadow-blue-500/25 hover:shadow-blue-500/35"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>{cartSuccess ? "Added to Cart!" : "Add to Cart"}</span>
                </button>
              </div>

              {cartSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Item reserved in cart. Proceed to checkout anytime.</span>
                </div>
              )}
            </div>

            {/* Description & Tags */}
            <div className="pt-6 border-t border-slate-200 space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Description
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>

              {product.tags && product.tags.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {product.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-[11px] text-slate-600 font-mono shadow-2xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
