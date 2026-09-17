"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  adminListProducts,
  adminApproveProduct,
  adminRejectProduct,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  ProductItem,
} from "../../../lib/api/products";
import {
  uploadImageToImgBB,
  getImgBBApiKey,
  MAX_FILE_SIZE_BYTES,
} from "../../../lib/utils/imageUpload";
import { getProductUrl } from "../../../lib/utils/slug";
import { broadcastProductUpdate } from "../../../hooks/useProducts";
import {
  Package,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Loader2,
  Search,
  Filter,
  Plus,
  Tag,
  Star,
  Eye,
  Check,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Edit3,
  Trash2,
  X,
  Sparkles,
  Layers,
  DollarSign,
  UploadCloud,
} from "lucide-react";

// Safe Image URL Parser
function getProductImageUrl(images: any): string | null {
  if (!images) return null;
  if (Array.isArray(images) && images.length > 0) {
    const first = images[0];
    if (typeof first === "string") return first;
    if (typeof first === "object" && first?.url) return first.url;
  }
  if (typeof images === "string") return images;
  return null;
}

export default function AdminProductsPage() {
  const params = useParams();
  const slug = (params?.slug as string[]) || [];
  const routeStatus = slug[0] && ["pending", "active", "draft", "rejected"].includes(slug[0])
    ? slug[0] === "pending"
      ? "pending_review"
      : slug[0] === "active"
      ? "approved"
      : slug[0]
    : "all";

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(routeStatus);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ProductItem | null>(null);
  const [rejectingProduct, setRejectingProduct] = useState<ProductItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Create Form State
  const [createForm, setCreateForm] = useState({
    name: "",
    category_id: "cat-women",
    price: "",
    description: "",
    imageUrl: "",
    sku: "",
    tags: "",
    status: "approved",
  });

  // Edit Form State
  const [editForm, setEditForm] = useState({
    name: "",
    category_id: "",
    price: "",
    description: "",
    imageUrl: "",
    status: "approved",
    tags: "",
  });

  // Fetch directly from backend API with silent live sync support
  const loadProducts = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await adminListProducts({
        status: statusFilter === "all" ? undefined : statusFilter,
        limit: 100,
      });
      setProducts(res?.items || []);
    } catch (err: any) {
      console.error("Failed loading products from API:", err);
      if (!silent) {
        setProducts([]);
        setFeedback({
          type: "error",
          text: err?.message || "Failed to load products from database API.",
        });
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Real-time synchronization across all tabs, windows, and active background polling
  useEffect(() => {
    // Initial fetch for current filter
    loadProducts(false);

    // Silent background sync callback
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

    // 3. Tab focus & visibility change (instantly refetch when user switches to this tab)
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
        bc.onmessage = (event) => {
          if (event.data?.type === "PRODUCTS_UPDATED") {
            syncData();
          }
        };
      } catch (e) {
        // Ignore
      }
    }

    // 5. Active live polling (every 3 seconds) so separate users/browsers sync automatically
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
  }, [statusFilter]);

  const [isUploadingImgBB, setIsUploadingImgBB] = useState(false);
  const quickFileInputRef = useRef<HTMLInputElement | null>(null);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleQuickUploadToImgBB = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "create" | "edit"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (e.target) e.target.value = "";

    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert(`"${file.name}" is ${(file.size / (1024 * 1024)).toFixed(2)}MB. Maximum allowed size is 2MB.`);
      return;
    }

    const key = getImgBBApiKey();
    if (!key) {
      const enteredKey = prompt(
        "Enter your ImgBB API key to upload to cloud storage:\n(Get one free at https://api.imgbb.com/)"
      );
      if (!enteredKey || !enteredKey.trim()) return;
      localStorage.setItem("nexora_imgbb_api_key", enteredKey.trim());
    }

    setIsUploadingImgBB(true);
    try {
      const url = await uploadImageToImgBB(file);
      if (target === "create") {
        setCreateForm((prev) => ({ ...prev, imageUrl: url }));
      } else {
        setEditForm((prev) => ({ ...prev, imageUrl: url }));
      }
      setFeedback({ type: "success", text: "Image successfully uploaded to ImgBB CDN!" });
    } catch (err: any) {
      alert(err?.message || "Failed to upload to ImgBB.");
    } finally {
      setIsUploadingImgBB(false);
    }
  };

  // 1. CREATE PRODUCT (Add)
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoadingId("create");
    setFeedback(null);

    try {
      const payload: any = {
        name: createForm.name.trim(),
        category_id: createForm.category_id,
        price: parseFloat(createForm.price) || 29.99,
        description: createForm.description.trim(),
        images: createForm.imageUrl.trim() ? [createForm.imageUrl.trim()] : [],
        tags: createForm.tags ? createForm.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        status: createForm.status,
      };

      const created = await adminCreateProduct(payload);
      broadcastProductUpdate();
      setFeedback({
        type: "success",
        text: `Product "${created.name}" created and saved to database successfully!`,
      });
      setIsCreateModalOpen(false);
      setCreateForm({
        name: "",
        category_id: "cat-women",
        price: "",
        description: "",
        imageUrl: "",
        sku: "",
        tags: "",
        status: "approved",
      });
      await loadProducts();
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err?.message || "Failed to create product in database.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // 2. EDIT / UPDATE PRODUCT
  const openEditModal = (prod: ProductItem) => {
    const primaryImg = getProductImageUrl(prod.images) || "";
    setEditingProduct(prod);
    setEditForm({
      name: prod.name,
      category_id: prod.category_id || "",
      price: (prod.base_price / 100).toFixed(2),
      description: prod.description || "",
      imageUrl: primaryImg,
      status: prod.status,
      tags: prod.tags?.join(", ") || "",
    });
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setActionLoadingId(editingProduct.id);
    setFeedback(null);

    try {
      const payload: any = {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        base_price: parseFloat(editForm.price) ? Math.round(parseFloat(editForm.price) * 100) : editingProduct.base_price,
        status: editForm.status,
        images: editForm.imageUrl.trim() ? [editForm.imageUrl.trim()] : editingProduct.images,
        tags: editForm.tags ? editForm.tags.split(",").map((t) => t.trim()).filter(Boolean) : editingProduct.tags,
      };

      const updated = await adminUpdateProduct(editingProduct.id, payload);
      broadcastProductUpdate();
      setFeedback({
        type: "success",
        text: `Product "${updated.name}" updated successfully in database!`,
      });
      setEditingProduct(null);
      await loadProducts();
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err?.message || "Failed to update product in database.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // 3. DELETE PRODUCT (Instant Optimistic UI + Real-time Broadcast)
  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    const target = deletingProduct;
    setActionLoadingId(target.id);
    setFeedback(null);

    // Optimistic update: instantly remove from list so UI updates in 0ms!
    setProducts((prev) => prev.filter((p) => p.id !== target.id));
    setDeletingProduct(null);

    try {
      await adminDeleteProduct(target.id);
      broadcastProductUpdate();
      setFeedback({
        type: "success",
        text: `Product "${target.name}" permanently deleted from database.`,
      });
      await loadProducts(true);
    } catch (err: any) {
      // Rollback on failure
      await loadProducts(false);
      setFeedback({
        type: "error",
        text: err?.message || "Failed to delete product from database.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // 4. APPROVE PRODUCT
  const handleApprove = async (id: string, name: string) => {
    setActionLoadingId(id);
    setFeedback(null);
    // Optimistic status update
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "approved" as const } : p))
    );
    try {
      await adminApproveProduct(id);
      broadcastProductUpdate();
      setFeedback({
        type: "success",
        text: `Product "${name}" approved and live on storefront!`,
      });
      await loadProducts(true);
    } catch (err: any) {
      await loadProducts(false);
      setFeedback({
        type: "error",
        text: err?.message || "Failed to approve product.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // 5. REJECT PRODUCT
  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingProduct) return;
    const target = rejectingProduct;
    setActionLoadingId(target.id);
    setFeedback(null);
    const reasonText = rejectReason.trim() || "Catalog compliance guidelines not met.";

    // Optimistic status update
    setProducts((prev) =>
      prev.map((p) =>
        p.id === target.id
          ? { ...p, status: "rejected" as const, rejection_reason: reasonText }
          : p
      )
    );
    setRejectingProduct(null);
    setRejectReason("");

    try {
      await adminRejectProduct(target.id, reasonText);
      broadcastProductUpdate();
      setFeedback({
        type: "success",
        text: `Product "${target.name}" marked as rejected.`,
      });
      await loadProducts(true);
    } catch (err: any) {
      await loadProducts(false);
      setFeedback({
        type: "error",
        text: err?.message || "Failed to reject product.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered displayed products
  const displayedProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.variants?.some((v) => v.sku?.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory =
        categoryFilter === "all" ||
        p.category_id?.toLowerCase().includes(categoryFilter.toLowerCase()) ||
        p.tags?.some((t) => t.toLowerCase().includes(categoryFilter.toLowerCase()));

      return matchSearch && matchCategory;
    });
  }, [products, searchQuery, categoryFilter]);

  // Statistics
  const totalCount = products.length;
  const pendingCount = products.filter((p) => p.status === "pending_review").length;
  const approvedCount = products.filter((p) => p.status === "approved").length;
  const rejectedCount = products.filter((p) => p.status === "rejected").length;

  return (
    <div className="w-full space-y-8 animate-fade-in pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F8EE] border border-[#A2E4B8]/40 text-[#0A504A] text-[11px] font-bold uppercase tracking-wider mb-2 font-mono">
            <Package className="w-3.5 h-3.5 text-[#00A86B]" />
            <span>06. Global Product Moderation & Database CRUD</span>
          </div>
          <h1 className="text-3xl font-serif font-black text-[#0A504A] tracking-tight">
            Products Catalog
          </h1>
          <p className="text-xs text-[#0A504A]/70 mt-1">
            Real-time database records, API-connected CRUD operations, merchant multi-variant approvals, and inventory management.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/products/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#0A504A] to-[#00A86B] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-[#0A504A]/25 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-[#D1E7D8] shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#0A504A]/70 uppercase tracking-wider block">
              Database SKUs
            </span>
            <div className="text-2xl font-serif font-black text-[#0A504A] mt-1">
              {totalCount}
            </div>
            <span className="text-[10px] text-[#00A86B] font-semibold mt-0.5 block">
              Live from MongoDB API
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#E8F8EE] border border-[#D1E7D8] flex items-center justify-center text-[#00A86B]">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#D1E7D8] shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
              Pending Review
            </span>
            <div className="text-2xl font-serif font-black text-amber-700 mt-1">
              {pendingCount}
            </div>
            <span className="text-[10px] text-amber-600/80 font-semibold mt-0.5 block flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              Awaiting admin decision
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#D1E7D8] shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
              Published & Active
            </span>
            <div className="text-2xl font-serif font-black text-emerald-700 mt-1">
              {approvedCount}
            </div>
            <span className="text-[10px] text-emerald-600/80 font-semibold mt-0.5 block">
              Live in storefront catalog
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#D1E7D8] shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">
              Rejected / Flags
            </span>
            <div className="text-2xl font-serif font-black text-rose-700 mt-1">
              {rejectedCount}
            </div>
            <span className="text-[10px] text-rose-600/80 font-semibold mt-0.5 block">
              Needs revision
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between gap-3 border shadow-xs ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-rose-50 text-rose-900 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-bold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Control Bar: Status Tabs + Search + Category Selector */}
      <div className="space-y-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-2 border-b border-[#D1E7D8] pb-3 overflow-x-auto custom-scrollbar">
          {[
            { key: "all", label: "All Items", badge: totalCount },
            { key: "pending_review", label: "Pending Review", badge: pendingCount },
            { key: "approved", label: "Published & Active", badge: approvedCount },
            { key: "draft", label: "Draft", badge: products.filter((p) => p.status === "draft").length },
            { key: "rejected", label: "Rejected", badge: rejectedCount },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                statusFilter === tab.key
                  ? "bg-[#00A86B] text-white shadow-sm shadow-[#00A86B]/30 scale-[1.02]"
                  : "bg-white border border-[#D1E7D8] text-[#0A504A]/80 hover:bg-[#E8F8EE] hover:text-[#0A504A]"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  statusFilter === tab.key
                    ? "bg-white/20 text-white"
                    : "bg-[#E8F8EE] text-[#00A86B]"
                }`}
              >
                {tab.badge}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Filter Inputs */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#0A504A]/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name, description, SKU, or tag..."
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A] placeholder-[#A2E4B8]/60 focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]/40 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#0A504A]/70 hover:text-[#0A504A]"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-[#0A504A]/70 hidden sm:block" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full sm:w-48 px-3 py-2 rounded-2xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A] font-semibold focus:outline-none focus:border-[#00A86B] shadow-2xs cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="women">Women's Fashion</option>
              <option value="men">Men's Fashion</option>
              <option value="tops">Tops & Blouses</option>
              <option value="outerwear">Jackets & Coats</option>
              <option value="bags">Leather & Bags</option>
              <option value="shoes">Footwear & Heels</option>
              <option value="dresses">Dresses & Evening</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table Card */}
      <div className="rounded-3xl bg-white border border-[#D1E7D8] shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 text-[#00A86B] animate-spin mx-auto mb-3" />
            <span className="text-xs font-semibold text-[#0A504A]/70">Loading products directly from backend database...</span>
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="py-20 text-center text-[#0A504A]/70 space-y-3">
            <Package className="w-12 h-12 mx-auto text-[#0A504A]/70/40" />
            <p className="text-sm font-bold text-[#0A504A]">No products found in database</p>
            <p className="text-xs text-[#0A504A]/70">Click below to create your first product via the API.</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-2xl bg-[#00A86B] text-white text-xs font-bold hover:bg-[#0A504A] transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#E8F8EE]/60 border-b border-[#D1E7D8]">
                <tr className="text-[#0A504A]/70 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 pl-6">Product Details</th>
                  <th className="py-3.5 px-4">SKU & Variants</th>
                  <th className="py-3.5 px-4">Base Price</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 pr-6 text-right">Actions (Edit / Delete / Review)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1E7D8]/60">
                {displayedProducts.map((prod) => {
                  const imageUrl = getProductImageUrl(prod.images);

                  return (
                    <tr key={prod.id} className="hover:bg-[#E8F8EE]/40 transition-colors">
                      <td className="py-4 pl-6 pr-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-14 h-14 rounded-2xl bg-[#E8F8EE] border border-[#D1E7D8] overflow-hidden shrink-0 shadow-2xs relative">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={prod.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#0A504A]/70">
                                <Package className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={getProductUrl(prod)}
                              className="font-bold text-[#0A504A] hover:text-[#00A86B] text-sm line-clamp-1 block transition-colors"
                            >
                              {prod.name}
                            </Link>
                            <span className="text-[11px] text-[#0A504A]/70 block mt-0.5 line-clamp-1">
                              {prod.description}
                            </span>
                            {prod.tags && prod.tags.length > 0 && (
                              <div className="flex items-center gap-1 mt-1 flex-wrap">
                                {prod.tags.slice(0, 3).map((tag, tIdx) => (
                                  <span
                                    key={tIdx}
                                    className="text-[9px] px-1.5 py-0.2 rounded-md bg-[#E8F8EE] text-[#00A86B] font-semibold"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-[#0A504A]">
                        <span className="font-mono font-bold block text-xs">
                          {prod.variants?.[0]?.sku || "SKU-AUTO"}
                        </span>
                        <span className="text-[10px] text-[#0A504A]/70 block mt-0.5">
                          {prod.variants?.length || 1} multi-variant option{prod.variants?.length > 1 ? "s" : ""}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-mono font-black text-sm text-[#0A504A]">
                          ${(prod.base_price / 100).toFixed(2)}
                        </span>
                        <span className="text-[10px] text-[#0A504A]/70 block">USD</span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 text-amber-600 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{prod.rating_avg ? prod.rating_avg.toFixed(1) : "5.0"}</span>
                          <span className="text-[10px] text-[#0A504A]/70 font-normal">
                            ({prod.rating_count || 0})
                          </span>
                        </div>
                        <span className="text-[10px] text-[#0A504A]/70 block mt-0.5">
                          {prod.total_sold || 0} units sold
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${
                            prod.status === "approved"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : prod.status === "pending_review"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : prod.status === "draft"
                              ? "bg-slate-100 text-slate-700 border-slate-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              prod.status === "approved"
                                ? "bg-emerald-500"
                                : prod.status === "pending_review"
                                ? "bg-amber-500 animate-pulse"
                                : prod.status === "draft"
                                ? "bg-slate-400"
                                : "bg-rose-500"
                            }`}
                          />
                          <span>{prod.status.replace(/_/g, " ").toUpperCase()}</span>
                        </span>

                        {prod.rejection_reason && (
                          <span className="text-[10px] text-rose-600 font-medium block mt-1 line-clamp-1 max-w-xs">
                            Reason: {prod.rejection_reason}
                          </span>
                        )}
                      </td>

                      <td className="py-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Approve / Reject buttons for pending items */}
                          {prod.status === "pending_review" && (
                            <>
                              <button
                                onClick={() => handleApprove(prod.id, prod.name)}
                                disabled={actionLoadingId === prod.id}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-all shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                title="Approve Product"
                              >
                                {actionLoadingId === prod.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Check className="w-3 h-3" />
                                )}
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => setRejectingProduct(prod)}
                                disabled={actionLoadingId === prod.id}
                                className="px-2.5 py-1.5 rounded-xl border border-rose-300 text-rose-600 hover:bg-rose-50 font-bold text-[11px] transition-colors cursor-pointer disabled:opacity-50"
                                title="Reject Product"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {/* EDIT Button */}
                          <Link
                            href={`/admin/products/${prod.id}/edit`}
                            className="p-1.5 rounded-xl bg-[#E8F8EE] hover:bg-[#A2E4B8] text-[#0A504A] hover:text-[#00A86B] transition-colors"
                            title="Edit Product"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Link>

                          {/* DELETE Button */}
                          <button
                            onClick={() => setDeletingProduct(prod)}
                            className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {/* PREVIEW Button */}
                          <Link
                            href={getProductUrl(prod)}
                            target="_blank"
                            className="p-1.5 rounded-xl bg-[#E8F8EE] hover:bg-[#E8F8EE] text-[#0A504A] transition-colors"
                            title="Preview on Live Storefront"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =====================================================================
          1. CREATE PRODUCT MODAL (Add)
          ===================================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-[#D1E7D8] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#D1E7D8] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#E8F8EE] text-[#00A86B] flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-black text-lg text-[#0A504A]">Add New Product</h3>
                  <span className="text-[11px] text-[#0A504A]/70">Inserts directly into database via API</span>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-[#E8F8EE] text-[#0A504A]/70 hover:text-[#0A504A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-[#0A504A] block mb-1">Product Title *</label>
                <input
                  required
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g. Silk Velvet Maxi Evening Dress"
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A] focus:outline-none focus:border-[#00A86B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#0A504A] block mb-1">Base Price ($ USD) *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="1"
                    value={createForm.price}
                    onChange={(e) => setCreateForm({ ...createForm, price: e.target.value })}
                    placeholder="79.99"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A] focus:outline-none focus:border-[#00A86B]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#0A504A] block mb-1">Category *</label>
                  <select
                    value={createForm.category_id}
                    onChange={(e) => setCreateForm({ ...createForm, category_id: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A] focus:outline-none focus:border-[#00A86B]"
                  >
                    <option value="cat-women">Women's Fashion</option>
                    <option value="cat-men">Men's Fashion</option>
                    <option value="cat-dresses">Dresses & Evening</option>
                    <option value="cat-tops">Tops & Blouses</option>
                    <option value="cat-shoes">Footwear & Heels</option>
                    <option value="cat-bags">Leather & Bags</option>
                    <option value="cat-accessories">Accessories</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#0A504A]">Primary Image URL</label>
                  <button
                    type="button"
                    disabled={isUploadingImgBB}
                    onClick={() => quickFileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#00A86B] hover:underline cursor-pointer"
                  >
                    {isUploadingImgBB ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <UploadCloud className="w-3 h-3" />
                    )}
                    <span>{isUploadingImgBB ? "Uploading..." : "Upload via ImgBB (Max 2MB)"}</span>
                  </button>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  ref={quickFileInputRef}
                  onChange={(e) => handleQuickUploadToImgBB(e, "create")}
                  className="hidden"
                />
                <input
                  type="url"
                  value={createForm.imageUrl}
                  onChange={(e) => setCreateForm({ ...createForm, imageUrl: e.target.value })}
                  placeholder="https://i.ibb.co/... or https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A] focus:outline-none focus:border-[#00A86B]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#0A504A] block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Detailed product fabric, tailoring, fit, and styling instructions..."
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A] focus:outline-none focus:border-[#00A86B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#0A504A] block mb-1">SKU / Code</label>
                  <input
                    type="text"
                    value={createForm.sku}
                    onChange={(e) => setCreateForm({ ...createForm, sku: e.target.value })}
                    placeholder="e.g. DR-SILK-01"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A] focus:outline-none focus:border-[#00A86B]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#0A504A] block mb-1">Initial Status</label>
                  <select
                    value={createForm.status}
                    onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A] focus:outline-none focus:border-[#00A86B]"
                  >
                    <option value="approved">Published & Active</option>
                    <option value="pending_review">Pending Review</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#0A504A] block mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={createForm.tags}
                  onChange={(e) => setCreateForm({ ...createForm, tags: e.target.value })}
                  placeholder="dress, silk, party, luxury"
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A] focus:outline-none focus:border-[#00A86B]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#D1E7D8]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#D1E7D8] text-xs font-semibold text-[#0A504A] hover:bg-[#E8F8EE]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === "create"}
                  className="px-5 py-2 rounded-xl bg-[#00A86B] hover:bg-[#0A504A] text-white text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {actionLoadingId === "create" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save to Database</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          2. EDIT PRODUCT MODAL (Update)
          ===================================================================== */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-[#D1E7D8] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#D1E7D8] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#E8F8EE] text-[#00A86B] flex items-center justify-center font-bold">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-black text-lg text-[#0A504A]">Edit Product</h3>
                  <span className="text-[11px] text-[#0A504A]/70">Modifies database document #{editingProduct.id.slice(-6)}</span>
                </div>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1.5 rounded-xl hover:bg-[#E8F8EE] text-[#0A504A]/70 hover:text-[#0A504A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-[#0A504A] block mb-1">Product Title</label>
                <input
                  required
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A] focus:outline-none focus:border-[#00A86B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#0A504A] block mb-1">Base Price ($ USD)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A] focus:outline-none focus:border-[#00A86B]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#0A504A] block mb-1">Moderation Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A] focus:outline-none focus:border-[#00A86B]"
                  >
                    <option value="approved">Published & Active</option>
                    <option value="pending_review">Pending Review</option>
                    <option value="draft">Draft</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#0A504A]">Image URL</label>
                  <button
                    type="button"
                    disabled={isUploadingImgBB}
                    onClick={() => editFileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#00A86B] hover:underline cursor-pointer"
                  >
                    {isUploadingImgBB ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <UploadCloud className="w-3 h-3" />
                    )}
                    <span>{isUploadingImgBB ? "Uploading..." : "Upload via ImgBB (Max 2MB)"}</span>
                  </button>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  ref={editFileInputRef}
                  onChange={(e) => handleQuickUploadToImgBB(e, "edit")}
                  className="hidden"
                />
                <input
                  type="url"
                  value={editForm.imageUrl}
                  onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A] focus:outline-none focus:border-[#00A86B]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#0A504A] block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A] focus:outline-none focus:border-[#00A86B]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#0A504A] block mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={editForm.tags}
                  onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A] focus:outline-none focus:border-[#00A86B]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#D1E7D8]">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-xl border border-[#D1E7D8] text-xs font-semibold text-[#0A504A] hover:bg-[#E8F8EE]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === editingProduct.id}
                  className="px-5 py-2 rounded-xl bg-[#00A86B] hover:bg-[#0A504A] text-white text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {actionLoadingId === editingProduct.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Update in Database</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          3. DELETE CONFIRMATION MODAL (Delete)
          ===================================================================== */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-rose-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-[#0A504A]">Delete Product</h3>
                <p className="text-xs text-[#0A504A]/70">This operation removes the item from the database.</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 bg-rose-50/50 p-3 rounded-2xl border border-rose-100">
              Are you sure you want to permanently delete <strong>&quot;{deletingProduct.name}&quot;</strong>? Customers will no longer be able to purchase this product.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                className="px-4 py-2 rounded-xl border border-[#D1E7D8] text-xs font-semibold text-[#0A504A] hover:bg-[#E8F8EE]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProduct}
                disabled={actionLoadingId === deletingProduct.id}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {actionLoadingId === deletingProduct.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          4. REJECT MODAL
          ===================================================================== */}
      {rejectingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#D1E7D8] shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-[#0A504A]">
                  Reject Catalog Submission
                </h3>
                <p className="text-xs text-[#0A504A]/70">
                  Product: <strong>{rejectingProduct.name}</strong>
                </p>
              </div>
            </div>

            <form onSubmit={handleReject} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#0A504A] block mb-1">
                  Reason for rejection
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Provide explicit reason (e.g. Low image resolution, copyright violation)..."
                  className="w-full p-3 rounded-2xl bg-[#E8F8EE]/30 border border-[#D1E7D8] text-xs text-[#0A504A] focus:border-[#00A86B] focus:outline-none transition-colors"
                />
              </div>

              {/* Quick suggestion chips */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#0A504A]/70 uppercase tracking-wider block">
                  Quick suggestions:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Low image resolution (< 1200px)",
                    "Pricing policy violation",
                    "Misleading title / description",
                    "Missing garment care labels",
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setRejectReason(chip)}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-[#E8F8EE] hover:bg-[#E8F8EE] text-[#00A86B] transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D1E7D8]">
                <button
                  type="button"
                  onClick={() => {
                    setRejectingProduct(null);
                    setRejectReason("");
                  }}
                  className="px-4 py-2 rounded-xl border border-[#D1E7D8] text-xs font-semibold text-[#0A504A] hover:bg-[#E8F8EE]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
