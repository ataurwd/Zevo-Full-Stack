"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getSellerProducts,
  deleteProduct,
  submitProductForReview,
  ProductItem,
} from "../../../lib/api/products";
import {
  Package,
  Plus,
  Search,
  Trash2,
  Send,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { getProductUrl } from "../../../lib/utils/slug";
import { broadcastProductUpdate } from "../../../hooks/useProducts";

export default function SellerProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadProducts = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await getSellerProducts();
      setProducts(data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts(false);

    const syncData = () => {
      loadProducts(true);
    };

    // 1. Intra-window custom event
    window.addEventListener("nexora:products_updated", syncData);

    // 2. Storage event across tabs & windows
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "nexora_products_sync_timestamp") {
        syncData();
      }
    };
    window.addEventListener("storage", handleStorage);

    // 3. Tab focus & visibility change
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        syncData();
      }
    };
    window.addEventListener("focus", syncData);
    document.addEventListener("visibilitychange", handleVisibility);

    // 4. Cross-tab BroadcastChannel
    let bc: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        bc = new BroadcastChannel("nexora_products_sync");
        bc.onmessage = (e) => {
          if (e.data?.type === "PRODUCTS_UPDATED") {
            syncData();
          }
        };
      } catch (err) {
        // Ignore
      }
    }

    // 5. Active background polling interval (every 3 seconds)
    const pollTimer = setInterval(() => {
      if (document.visibilityState === "visible") {
        syncData();
      }
    }, 3000);

    return () => {
      window.removeEventListener("nexora:products_updated", syncData);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", syncData);
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(pollTimer);
      if (bc) bc.close();
    };
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    setActionLoadingId(id);
    // Optimistic removal: 0ms instant UI update!
    setProducts((prev) => prev.filter((p) => p.id !== id));
    try {
      await deleteProduct(id);
      broadcastProductUpdate();
      await loadProducts(true);
      setMessage({ type: "success", text: `Product "${name}" deleted.` });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed deleting product" });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSubmitReview = async (id: string) => {
    setActionLoadingId(id);
    try {
      const updated = await submitProductForReview(id);
      broadcastProductUpdate();
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      setMessage({ type: "success", text: "Product submitted for compliance review!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Submission failed" });
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCents = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#D1E7D8] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[#E8F8EE] text-[#00A86B] font-mono text-[11px] font-bold border border-[#A2E4B8]">
              Catalog Management
            </span>
            <span className="text-xs text-[#0A504A]/60 font-medium">Merchant Inventory</span>
          </div>
          <h1 className="text-2xl font-black text-[#0A504A] tracking-tight">
            Product Inventory & Catalog
          </h1>
          <p className="text-xs text-[#0A504A]/70 mt-0.5">
            Manage your storefront catalog, variants, and moderation review statuses.
          </p>
        </div>

        <Link
          href="/seller/products/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00A86B] hover:bg-[#0A504A] text-xs font-bold text-white transition-all shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Product</span>
        </Link>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between shadow-2xs ${
            message.type === "success"
              ? "bg-[#E8F8EE] border-[#A2E4B8] text-[#0A504A]"
              : "bg-rose-50 border-rose-200 text-rose-700"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-[#00A86B]" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500" />
            )}
            <span className="font-semibold">{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-xs font-bold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#0A504A]/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by title or slug..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A] placeholder-[#0A504A]/40 focus:outline-none focus:border-[#00A86B] shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {["all", "draft", "pending_review", "approved", "rejected"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === status
                  ? "bg-[#0A504A] text-white shadow-xs"
                  : "bg-white border border-[#D1E7D8] text-[#0A504A]/70 hover:text-[#0A504A] hover:bg-[#E8F8EE]"
              }`}
            >
              {status.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-[#D1E7D8]">
          <Loader2 className="w-8 h-8 text-[#00A86B] animate-spin mb-3" />
          <p className="text-sm text-[#0A504A]/70 font-semibold">Loading catalog items...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#D1E7D8] p-12 text-center shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-[#E8F8EE] text-[#00A86B] flex items-center justify-center mx-auto mb-3 border border-[#A2E4B8]">
            <Package className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-[#0A504A]">No products match your criteria</h3>
          <p className="text-xs text-[#0A504A]/70 max-w-sm mx-auto mt-1 mb-5">
            Try clearing your search filters or create a brand new product.
          </p>
          <Link
            href="/seller/products/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#00A86B] hover:bg-[#0A504A] text-xs font-bold text-white transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Product</span>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#D1E7D8] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAF8] border-b border-[#D1E7D8]">
                <tr className="text-[#0A504A]/70 uppercase tracking-wider font-bold">
                  <th className="py-3.5 px-4">Item</th>
                  <th className="py-3.5 px-4">Base Price</th>
                  <th className="py-3.5 px-4">Variants</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8F8EE]">
                {filteredProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-[#E8F8EE]/30 transition-colors">
                    <td className="py-4 px-4">
                      <div>
                        <span className="font-bold text-[#0A504A] text-sm block">
                          {prod.name}
                        </span>
                        <span className="text-[11px] text-[#0A504A]/60 font-mono">
                          Slug: {prod.slug}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-[#0A504A]">
                      {formatCents(prod.base_price)}
                    </td>
                    <td className="py-4 px-4 text-[#0A504A]/80">
                      <span className="px-2 py-0.5 rounded bg-[#E8F8EE] border border-[#D1E7D8] text-[11px] font-mono font-bold">
                        {prod.variants.length} SKU(s)
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold ${
                            prod.status === "approved"
                              ? "bg-[#E8F8EE] text-[#00A86B] border border-[#A2E4B8]"
                              : prod.status === "pending_review"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : prod.status === "rejected"
                              ? "bg-rose-50 text-rose-600 border border-rose-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {prod.status.replace("_", " ")}
                        </span>
                        {prod.rejection_reason && (
                          <p className="text-[10px] text-rose-500 mt-1 max-w-xs truncate">
                            Reason: {prod.rejection_reason}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        {prod.status === "draft" && (
                          <button
                            onClick={() => handleSubmitReview(prod.id)}
                            disabled={actionLoadingId === prod.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#E8F8EE] hover:bg-[#A2E4B8] text-[#0A504A] border border-[#A2E4B8] text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            <Send className="w-3 h-3 text-[#00A86B]" />
                            <span>{actionLoadingId === prod.id ? "Sending..." : "Submit"}</span>
                          </button>
                        )}

                        {prod.status === "approved" && (
                          <Link
                            href={getProductUrl(prod)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#E8F8EE] hover:bg-[#00A86B] text-[#0A504A] hover:text-white border border-[#D1E7D8] text-[11px] font-bold transition-all"
                          >
                            <span>Live</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}

                        <button
                          onClick={() => handleDelete(prod.id, prod.name)}
                          disabled={actionLoadingId === prod.id}
                          className="p-1.5 rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-[#D1E7D8] hover:border-rose-200 transition-colors cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
