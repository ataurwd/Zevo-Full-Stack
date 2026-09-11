"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "../../../components/Navbar";
import { ProtectedRoute } from "../../../components/auth/ProtectedRoute";
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

export default function SellerProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadProducts = async () => {
    try {
      const data = await getSellerProducts();
      setProducts(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    setActionLoadingId(id);
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
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
    <ProtectedRoute allowedRoles={["SELLER", "ADMIN", "SUPER_ADMIN"]}>
      <div className="min-h-screen bg-[#080b12] text-slate-100 flex flex-col">
        <Navbar />

        <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-800 gap-4">
            <div>
              <Link
                href="/seller/dashboard"
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Dashboard</span>
              </Link>
              <h1 className="text-2xl font-bold text-white">Product Inventory & Catalog</h1>
              <p className="text-xs text-slate-400 mt-1">
                Manage your storefront catalog, variants, and moderation review statuses.
              </p>
            </div>

            <Link
              href="/seller/products/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors shadow-lg shadow-indigo-600/30 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create Product</span>
            </Link>
          </div>

          {message && (
            <div
              className={`p-4 rounded-xl border text-xs mb-6 flex items-center justify-between ${
                message.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                  : "bg-rose-500/10 border-rose-500/20 text-rose-300"
              }`}
            >
              <div className="flex items-center gap-2">
                {message.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span>{message.text}</span>
              </div>
              <button
                onClick={() => setMessage(null)}
                className="text-xs font-bold hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by title or slug..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {["all", "draft", "pending_review", "approved", "rejected"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium capitalize whitespace-nowrap transition-colors ${
                    statusFilter === status
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {status.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Products Table */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
              <p className="text-sm text-slate-400">Loading catalog items...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="glass-card rounded-2xl border border-slate-800 p-12 text-center">
              <Package className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-200">No products match your criteria</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Try clearing your search filters or create a brand new product.
              </p>
              <Link
                href="/seller/products/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Product</span>
              </Link>
            </div>
          ) : (
            <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 border-b border-slate-800">
                    <tr className="text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="py-3.5 px-4">Item</th>
                      <th className="py-3.5 px-4">Base Price</th>
                      <th className="py-3.5 px-4">Variants</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredProducts.map((prod) => (
                      <tr key={prod.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-4 px-4">
                          <div>
                            <span className="font-semibold text-white text-sm block">
                              {prod.name}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              Slug: {prod.slug}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-mono font-semibold text-slate-200">
                          {formatCents(prod.base_price)}
                        </td>
                        <td className="py-4 px-4 text-slate-300">
                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono">
                            {prod.variants.length} SKU(s)
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-semibold ${
                                prod.status === "approved"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : prod.status === "pending_review"
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                  : prod.status === "rejected"
                                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                  : "bg-slate-800 text-slate-400 border border-slate-700"
                              }`}
                            >
                              {prod.status.replace("_", " ")}
                            </span>
                            {prod.rejection_reason && (
                              <p className="text-[10px] text-rose-400 mt-1 max-w-xs truncate">
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
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-medium transition-colors"
                              >
                                <Send className="w-3 h-3" />
                                <span>{actionLoadingId === prod.id ? "Sending..." : "Submit"}</span>
                              </button>
                            )}

                            {prod.status === "approved" && (
                              <Link
                                href={`/products/${prod.id}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
                              >
                                <span>Live</span>
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            )}

                            <button
                              onClick={() => handleDelete(prod.id, prod.name)}
                              disabled={actionLoadingId === prod.id}
                              className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 border border-slate-800 transition-colors"
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
        </main>
      </div>
    </ProtectedRoute>
  );
}
