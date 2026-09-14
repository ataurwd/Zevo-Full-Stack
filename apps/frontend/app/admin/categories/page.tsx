"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCategories,
  CATEGORIES_QUERY_KEY,
  broadcastCategoryUpdate,
} from "../../../hooks/useCategories";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  CategoryItem,
} from "../../../lib/api/categories";
import {
  uploadImageToImgBB,
  MAX_FILE_SIZE_BYTES,
  getImgBBApiKey,
} from "../../../lib/utils/imageUpload";
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  Loader2,
  CheckCircle2,
  UploadCloud,
  X,
  AlertCircle,
  Sparkles,
  Link2,
  Image as ImageIcon,
} from "lucide-react";

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const { data: categories = [], isLoading: loading, refetch: loadCats } = useCategories({
    refetchInterval: 10000,
  });
  const [saving, setSaving] = useState(false);

  // Modal & Form State
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [catName, setCatName] = useState("");
  const [catImage, setCatImage] = useState("");
  const [useDirectUrl, setUseDirectUrl] = useState(false);

  // Upload & Drag-and-Drop State
  const [isUploadingCatImage, setIsUploadingCatImage] = useState(false);
  const [catUploadProgress, setCatUploadProgress] = useState("");
  const [catImageError, setCatImageError] = useState<string | null>(null);
  const [isDraggingCatImage, setIsDraggingCatImage] = useState(false);
  const catFileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setCatName("");
    setCatImage("");
    setCatImageError(null);
    setUseDirectUrl(false);
    setShowModal(true);
  };

  const handleOpenEdit = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatImage(cat.image_url || "");
    setCatImageError(null);
    setUseDirectUrl(Boolean(cat.image_url && !cat.image_url.includes("ibb.co")));
    setShowModal(true);
  };

  // Upload Logic (supports ImgBB with 2MB limit)
  const processCatFile = async (file: File) => {
    setCatImageError(null);

    if (!file.type.startsWith("image/")) {
      setCatImageError(`"${file.name}" is not a valid image. Please select PNG, JPG, WEBP, or GIF.`);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setCatImageError(`"${file.name}" is ${sizeMB}MB. Category image must be 2MB or less.`);
      return;
    }

    const currentKey = getImgBBApiKey();
    if (!currentKey) {
      setCatImageError("ImgBB API key is required to upload images.");
      return;
    }

    setIsUploadingCatImage(true);
    setCatUploadProgress(`Uploading ${file.name} to ImgBB CDN...`);

    try {
      const uploadedUrl = await uploadImageToImgBB(file, currentKey);
      setCatImage(uploadedUrl);
      setCatImageError(null);
    } catch (err: any) {
      console.error("Category image upload failed:", err);
      setCatImageError(err?.message || "Failed to upload image. Please try again.");
    } finally {
      setIsUploadingCatImage(false);
      setCatUploadProgress("");
    }
  };

  const handleCatFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (catFileInputRef.current) catFileInputRef.current.value = "";
    await processCatFile(file);
  };

  // Drag and Drop Event Handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingCatImage(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    setIsDraggingCatImage(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingCatImage(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingCatImage(false);
    if (isUploadingCatImage) return;

    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/")
    );

    if (files.length === 0) {
      setCatImageError("Please drop a valid image file (PNG, JPG, WEBP, GIF).");
      return;
    }

    await processCatFile(files[0]);
  };

  // Form Submission (Add or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    try {
      setSaving(true);
      if (editingCategory) {
        // Update existing category
        await updateCategory(editingCategory.id, {
          name: catName.trim(),
          image_url: catImage.trim() || undefined,
        });
      } else {
        // Create new category
        await createCategory({
          name: catName.trim(),
          image_url: catImage.trim() || undefined,
          sort_order: categories.length + 1,
        });
      }

      await queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
      await queryClient.refetchQueries({ queryKey: CATEGORIES_QUERY_KEY });
      broadcastCategoryUpdate();

      setShowModal(false);
      setCatName("");
      setCatImage("");
      setEditingCategory(null);
    } catch (err) {
      console.error("Failed to save category via API:", err);
      alert("Failed to save category on server. Please check backend connection.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;
    try {
      await deleteCategory(id);
      await queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
      await queryClient.refetchQueries({ queryKey: CATEGORIES_QUERY_KEY });
      broadcastCategoryUpdate();
    } catch (err) {
      console.error("Failed to delete category:", err);
      alert("Failed to delete category on server.");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F8EE] border border-[#A2E4B8]/30 text-[#0A504A] text-[11px] font-bold uppercase tracking-wider mb-2">
            <Layers className="w-3.5 h-3.5 text-[#00A86B]" />
            <span>07. Taxonomy & Catalog Taxonomy</span>
          </div>
          <h1 className="text-3xl font-serif font-black text-[#0A504A] tracking-tight">
            Categories Architecture
          </h1>
          <p className="text-xs text-[#0A504A]/70 mt-1">
            Product classification tree, image artwork, hierarchy, sort prioritization, and slug endpoints.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A504A] hover:bg-[#00A86B] text-white text-xs font-bold transition-all shadow-md shadow-[#0A504A]/20 active:scale-95 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      {/* Category List */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#D1E7D8] shadow-2xs space-y-4">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-8 h-8 text-[#00A86B] animate-spin mx-auto mb-2" />
            <span className="text-xs font-semibold text-[#0A504A]/70">Loading category tree...</span>
          </div>
        ) : (
          <div className="divide-y divide-[#D1E7D8]">
            {categories.map((cat, idx) => (
              <div
                key={cat.id}
                className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3.5">
                  <span className="w-6 text-center font-mono text-xs font-bold text-[#0A504A]/70">
                    {String(idx + 1).padStart(2, "0")}
                  </span>

                  {/* Thumbnail Preview: Shows uploaded image or fallback icon */}
                  {cat.image_url ? (
                    <img
                      src={cat.image_url}
                      alt={cat.name}
                      className="w-11 h-11 rounded-xl object-cover border border-[#D1E7D8] bg-gray-50 shadow-2xs shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-[#E8F8EE] border border-[#D1E7D8] text-[#00A86B] flex items-center justify-center font-bold shrink-0">
                      <Layers className="w-5 h-5" />
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-bold text-[#0A504A]">{cat.name}</h3>
                    <span className="text-[11px] text-[#0A504A]/70 font-mono">
                      /products?category={cat.slug}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Active</span>
                  </span>

                  {/* Edit Category Button */}
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="p-2 rounded-xl bg-gray-50 hover:bg-emerald-50 text-gray-700 hover:text-[#00A86B] border border-gray-200 hover:border-emerald-200 transition-colors cursor-pointer"
                    title="Edit Category & Image"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <Link
                    href={`/products?category=${cat.slug}`}
                    target="_blank"
                    className="p-2 rounded-xl bg-[#E8F8EE] hover:bg-[#A2E4B8]/40 text-[#0A504A] transition-colors"
                    title="View Products"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>

                  <button
                    onClick={() => handleDelete(cat.id, cat.name)}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                    title="Delete Category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category Modal (Add / Edit with Drag-and-Drop Image Upload) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-[#D1E7D8] shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-serif font-bold text-xl text-[#0A504A]">
                {editingCategory ? "Edit Category" : "Add New Category"}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Category Name */}
              <div>
                <label className="text-[11px] font-bold text-[#0A504A] uppercase block mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Fresh Fruits, Organic Vegetables, Dairy..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D1E7D8] text-xs font-medium text-[#0A504A] placeholder-gray-400 focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]"
                />
              </div>

              {/* Category Image Upload Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-[#0A504A] uppercase">
                    Category Image Artwork
                  </label>
                  <button
                    type="button"
                    onClick={() => setUseDirectUrl(!useDirectUrl)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#00A86B] hover:underline"
                  >
                    <Link2 className="w-3 h-3" />
                    <span>{useDirectUrl ? "Switch to File Upload" : "Or paste image URL"}</span>
                  </button>
                </div>

                {/* Error Banner */}
                {catImageError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-2 text-rose-700 text-xs">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{catImageError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCatImageError(null)}
                      className="text-rose-500 hover:text-rose-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={catFileInputRef}
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleCatFileSelect}
                  className="hidden"
                  disabled={isUploadingCatImage}
                />

                {useDirectUrl ? (
                  /* Direct URL Input */
                  <div>
                    <input
                      type="url"
                      value={catImage}
                      onChange={(e) => setCatImage(e.target.value)}
                      placeholder="https://images.unsplash.com/... or https://i.ibb.co/..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A] placeholder-gray-400 focus:outline-none focus:border-[#00A86B]"
                    />
                    {catImage && (
                      <div className="mt-2 flex items-center gap-3 p-2 rounded-xl bg-[#E8F8EE]/60 border border-[#D1E7D8]">
                        <img
                          src={catImage}
                          alt="Preview"
                          className="w-12 h-12 rounded-lg object-cover border border-[#D1E7D8]"
                        />
                        <span className="text-xs font-semibold text-[#0A504A]">Direct URL Preview Active</span>
                      </div>
                    )}
                  </div>
                ) : catImage ? (
                  /* Image Preview with Replace / Remove */
                  <div className="p-3 rounded-2xl bg-[#E8F8EE]/50 border border-[#D1E7D8] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={catImage}
                        alt="Category preview"
                        className="w-16 h-16 rounded-xl object-cover border border-[#D1E7D8] bg-white shadow-2xs"
                      />
                      <div>
                        <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Image Uploaded & Ready</span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1 truncate max-w-[200px]">
                          {catImage}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => catFileInputRef.current?.click()}
                        disabled={isUploadingCatImage}
                        className="px-3 py-1.5 rounded-lg border border-[#D1E7D8] bg-white hover:bg-gray-50 text-xs font-semibold text-[#0A504A] transition-colors cursor-pointer"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={() => setCatImage("")}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                        title="Remove Image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Drag and Drop Zone */
                  <div
                    onClick={() => !isUploadingCatImage && catFileInputRef.current?.click()}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                      isDraggingCatImage
                        ? "border-[#00A86B] bg-emerald-50/80 ring-4 ring-[#00A86B]/20 scale-[1.01]"
                        : isUploadingCatImage
                        ? "border-emerald-300 bg-emerald-50/40 cursor-wait"
                        : "border-[#D1E7D8] hover:border-[#00A86B] bg-[#E8F8EE]/20 hover:bg-[#E8F8EE]/50"
                    }`}
                  >
                    {isDraggingCatImage ? (
                      <div className="flex flex-col items-center gap-2 py-2 pointer-events-none animate-bounce">
                        <UploadCloud className="w-9 h-9 text-[#00A86B]" />
                        <p className="text-xs font-bold text-[#00A86B]">Drop image here to upload!</p>
                        <p className="text-[10px] text-[#0A504A]/70">PNG, JPG, WEBP • Max 2MB</p>
                      </div>
                    ) : isUploadingCatImage ? (
                      <div className="flex flex-col items-center gap-2 py-2">
                        <Loader2 className="w-8 h-8 text-[#00A86B] animate-spin" />
                        <p className="text-xs font-bold text-[#0A504A]">{catUploadProgress || "Uploading to ImgBB..."}</p>
                        <p className="text-[10px] text-gray-400">Saving category image to high-speed CDN</p>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-2xl bg-[#E8F8EE] text-[#00A86B] flex items-center justify-center mb-2 shadow-2xs">
                          <UploadCloud className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-bold text-[#0A504A]">
                          Click to upload <span className="font-normal text-gray-500">or drag & drop</span>
                        </p>
                        <p className="text-[11px] text-gray-400 mt-1">
                          PNG, JPG, WEBP • Max 2MB • Hosted on ImgBB CDN
                        </p>
                        <div className="mt-2 inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-semibold">
                          <Sparkles className="w-3 h-3 text-[#00A86B]" />
                          <span>Direct Cloud Upload Enabled</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-gray-100">
                <button
                  type="button"
                  disabled={saving || isUploadingCatImage}
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#D1E7D8] text-xs font-semibold text-[#0A504A] hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || isUploadingCatImage}
                  className="px-6 py-2.5 rounded-xl bg-[#0A504A] hover:bg-[#00A86B] disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-[#0A504A]/20 cursor-pointer"
                >
                  {saving ? "Saving..." : editingCategory ? "Update Category" : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
