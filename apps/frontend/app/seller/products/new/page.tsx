"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "../../../../components/Navbar";
import { ProtectedRoute } from "../../../../components/auth/ProtectedRoute";
import { getCategoryTree, CategoryItem } from "../../../../lib/api/categories";
import { createProduct } from "../../../../lib/api/products";
import {
  Package,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Layers,
  Image as ImageIcon,
} from "lucide-react";

interface VariantRow {
  name: string;
  sku: string;
  price_dollars: string;
  compare_dollars: string;
  weight_grams: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    category_id: "",
    description: "",
    image_url: "",
    tags: "",
  });

  const [variants, setVariants] = useState<VariantRow[]>([
    {
      name: "Standard Edition",
      sku: "",
      price_dollars: "49.99",
      compare_dollars: "",
      weight_grams: "450",
    },
  ]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const tree = await getCategoryTree();
        // Flatten tree for select dropdown
        const flat: CategoryItem[] = [];
        const traverse = (items: CategoryItem[]) => {
          for (const item of items) {
            flat.push(item);
            if (item.children && item.children.length > 0) {
              traverse(item.children);
            }
          }
        };
        traverse(tree);
        setCategories(flat);
        if (flat.length > 0) {
          setFormData((prev) => ({ ...prev, category_id: flat[0].id }));
        }
      } catch (err) {
        console.error("Failed loading categories", err);
      } finally {
        setIsLoadingCategories(false);
      }
    }
    loadCategories();
  }, []);

  const handleAddVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        name: `Option ${prev.length + 1}`,
        sku: "",
        price_dollars: "49.99",
        compare_dollars: "",
        weight_grams: "450",
      },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 1) {
      alert("At least one product variant is required.");
      return;
    }
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index: number, field: keyof VariantRow, value: string) => {
    setVariants((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Product title is required.");
      return;
    }
    if (!formData.category_id) {
      setError("Please select a category.");
      return;
    }
    if (formData.description.trim().length < 10) {
      setError("Description must be at least 10 characters long.");
      return;
    }
    if (variants.length === 0) {
      setError("At least one variant is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Map variants to DTO format with integer cents
      const mappedVariants = variants.map((v) => {
        const priceCents = Math.round(parseFloat(v.price_dollars || "0") * 100);
        if (isNaN(priceCents) || priceCents <= 0) {
          throw new Error(`Invalid price for variant "${v.name}". Must be greater than 0.`);
        }
        const compareCents = v.compare_dollars
          ? Math.round(parseFloat(v.compare_dollars) * 100)
          : undefined;
        const weight = v.weight_grams ? parseFloat(v.weight_grams) : undefined;

        return {
          name: v.name,
          sku: v.sku.trim() || undefined,
          price: priceCents,
          compare_at_price: compareCents,
          weight_grams: weight,
          is_active: true,
        };
      });

      const tagsArray = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const imagesArray = formData.image_url.trim() ? [formData.image_url.trim()] : [];

      await createProduct({
        category_id: formData.category_id,
        name: formData.name.trim(),
        description: formData.description.trim(),
        images: imagesArray,
        tags: tagsArray,
        variants: mappedVariants,
      });

      router.push("/seller/products");
    } catch (err: any) {
      setError(err.message || "Failed creating product");
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["SELLER", "ADMIN", "SUPER_ADMIN"]}>
      <div className="min-h-screen bg-[#080b12] text-slate-100 flex flex-col">
        <Navbar />

        <main className="flex-1 max-w-4xl mx-auto px-6 py-10 w-full">
          {/* Top Back Navigation */}
          <div className="mb-6">
            <Link
              href="/seller/products"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Products</span>
            </Link>
            <h1 className="text-2xl font-bold text-white">Create New Catalog Product</h1>
            <p className="text-xs text-slate-400 mt-1">
              Add a product to your vendor storefront with custom SKU variants, pricing, and specs.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs mb-6 flex items-center gap-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Product Info */}
            <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Core Information
              </h2>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Product Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Wireless Noise-Canceling Studio Headphones"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Category <span className="text-rose-400">*</span>
                  </label>
                  {isLoadingCategories ? (
                    <div className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-500">
                      Loading categories...
                    </div>
                  ) : (
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name} ({cat.slug})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Tags (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="audio, wireless, anc, bluetooth"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Detailed Description <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Comprehensive description of product specifications, material quality, and box contents..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Primary Image URL (HTTPS)
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Variants Manager */}
            <div className="glass-card rounded-2xl p-6 border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span>Product Variants & SKUs</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Define specific variations (colors, sizes, storage tiers) with independent pricing.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Variant</span>
                </button>
              </div>

              <div className="space-y-3">
                {variants.map((v, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center gap-3"
                  >
                    <div className="flex-1 w-full sm:w-auto">
                      <label className="block text-[11px] text-slate-400 mb-1">Variant Name</label>
                      <input
                        type="text"
                        required
                        value={v.name}
                        onChange={(e) => handleVariantChange(index, "name", e.target.value)}
                        placeholder="e.g. Space Gray 256GB"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500"
                      />
                    </div>

                    <div className="w-full sm:w-32">
                      <label className="block text-[11px] text-slate-400 mb-1">SKU (Optional)</label>
                      <input
                        type="text"
                        value={v.sku}
                        onChange={(e) => handleVariantChange(index, "sku", e.target.value)}
                        placeholder="AUTO-GENERATED"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:border-indigo-500"
                      />
                    </div>

                    <div className="w-full sm:w-28">
                      <label className="block text-[11px] text-slate-400 mb-1">Price ($ USD)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={v.price_dollars}
                        onChange={(e) =>
                          handleVariantChange(index, "price_dollars", e.target.value)
                        }
                        placeholder="49.99"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:border-indigo-500"
                      />
                    </div>

                    <div className="w-full sm:w-28">
                      <label className="block text-[11px] text-slate-400 mb-1">Compare At ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={v.compare_dollars}
                        onChange={(e) =>
                          handleVariantChange(index, "compare_dollars", e.target.value)
                        }
                        placeholder="Optional"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:border-indigo-500"
                      />
                    </div>

                    <div className="w-full sm:w-24">
                      <label className="block text-[11px] text-slate-400 mb-1">Weight (g)</label>
                      <input
                        type="number"
                        value={v.weight_grams}
                        onChange={(e) =>
                          handleVariantChange(index, "weight_grams", e.target.value)
                        }
                        placeholder="grams"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:border-indigo-500"
                      />
                    </div>

                    <div className="sm:pt-5">
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(index)}
                        className="p-2 rounded-lg bg-slate-950 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 border border-slate-800 transition-colors"
                        title="Remove Variant"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Link
                href="/seller/products"
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-xs font-semibold text-white transition-colors shadow-lg shadow-indigo-600/30"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Save Product as Draft</span>
              </button>
            </div>
          </form>
        </main>
      </div>
    </ProtectedRoute>
  );
}
