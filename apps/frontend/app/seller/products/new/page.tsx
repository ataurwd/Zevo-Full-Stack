"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createProduct } from "../../../../lib/api/products";
import { broadcastProductUpdate } from "../../../../hooks/useProducts";
import { CategoryItem } from "../../../../lib/api/categories";
import { useCategories } from "../../../../hooks/useCategories";
import {
  uploadImageToImgBB,
  getImgBBApiKey,
  setImgBBApiKey,
  MAX_FILE_SIZE_BYTES,
  MAX_IMAGES_COUNT,
} from "../../../../lib/utils/imageUpload";
import { generateProductSKU } from "../../../../lib/utils/sku";
import {
  ArrowLeft,
  Bell,
  HelpCircle,
  ExternalLink,
  Upload,
  UploadCloud,
  Bold,
  Italic,
  Underline,
  Link2,
  List,
  ListOrdered,
  Plus,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Info,
  X,
  Layers,
  DollarSign,
  Tag,
  Package,
  Key,
  RefreshCw,
  Clock,
  ShieldCheck,
} from "lucide-react";

export default function MerchantCreateProductPage() {
  const router = useRouter();

  // Category Selector State (Live sync with TanStack Query)
  const { data: categoryTree = [] } = useCategories();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedParentCategory, setSelectedParentCategory] = useState<string>("");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");

  // Sync categoryTree into local state whenever it changes
  useEffect(() => {
    if (categoryTree && categoryTree.length > 0) {
      setCategories(categoryTree);
      if (!selectedParentCategory) {
        setSelectedParentCategory(categoryTree[0].id);
      }
    }
  }, [categoryTree, selectedParentCategory]);

  // Product Basic Info
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("100");
  const [sku, setSku] = useState(() => generateProductSKU("NX"));
  const [sellingType, setSellingType] = useState<"in_store" | "online" | "both">("both");
  const [tagsInput, setTagsInput] = useState("");

  // Pricing
  const [basePrice, setBasePrice] = useState("9.99");
  const [compareAtPrice, setCompareAtPrice] = useState("");

  // Shipping & Delivery
  const [itemWeight, setItemWeight] = useState("1.0");
  const [weightUnit, setWeightUnit] = useState<"kg" | "lb" | "g">("kg");
  const [packageLength, setPackageLength] = useState("10");
  const [packageBreadth, setPackageBreadth] = useState("10");
  const [packageWidth, setPackageWidth] = useState("4");
  const [dimensionUnit, setDimensionUnit] = useState<"in" | "cm">("in");

  // Images State (Max 5 images, Max 2MB, ImgBB Hosted)
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [isImgBBModalOpen, setIsImgBBModalOpen] = useState(false);
  const [imgBBApiKeyInput, setImgBBApiKeyInput] = useState("");
  const [hasImgBBKey, setHasImgBBKey] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");
  const [imageError, setImageError] = useState<string | null>(null);
  const [replaceTargetIndex, setReplaceTargetIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const replaceFileInputRef = useRef<HTMLInputElement | null>(null);
  const txtInputRef = useRef<HTMLInputElement | null>(null);

  // Submission & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check ImgBB Key on mount
  useEffect(() => {
    const existingKey = getImgBBApiKey();
    if (existingKey) {
      setHasImgBBKey(true);
      setImgBBApiKeyInput(existingKey);
    }
  }, []);

  // Text formatting helper
  const handleFormatText = (tag: "bold" | "italic" | "underline" | "list" | "numlist" | "link") => {
    const textarea = document.getElementById("merchant-product-description") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = description.substring(start, end) || "text";
    let replacement = selectedText;

    switch (tag) {
      case "bold":
        replacement = `**${selectedText}**`;
        break;
      case "italic":
        replacement = `*${selectedText}*`;
        break;
      case "underline":
        replacement = `<u>${selectedText}</u>`;
        break;
      case "list":
        replacement = `\n- ${selectedText}`;
        break;
      case "numlist":
        replacement = `\n1. ${selectedText}`;
        break;
      case "link":
        replacement = `[${selectedText}](https://)`;
        break;
    }

    const newDesc = description.substring(0, start) + replacement + description.substring(end);
    setDescription(newDesc);
  };

  // Upload .txt file into description
  const handleTxtFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) setDescription(content);
    };
    reader.readAsText(file);
  };

  // Core Image Upload Worker
  const processFilesToUpload = async (files: File[]) => {
    setImageError(null);

    if (images.length >= MAX_IMAGES_COUNT) {
      setImageError(`A product can have a maximum of ${MAX_IMAGES_COUNT} images.`);
      return;
    }

    const availableSlots = MAX_IMAGES_COUNT - images.length;
    const filesToUpload = files.slice(0, availableSlots);
    if (files.length > availableSlots) {
      setImageError(`Only ${availableSlots} more image(s) can be added (Maximum ${MAX_IMAGES_COUNT} images per product).`);
    }

    for (const file of filesToUpload) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        setImageError(`"${file.name}" is ${sizeMB}MB. Each image must be 2MB or less.`);
        return;
      }
    }

    const currentKey = getImgBBApiKey();
    if (!currentKey) {
      setIsImgBBModalOpen(true);
      setImageError("ImgBB API key is required to upload images. Please configure your API key.");
      return;
    }

    setIsUploadingImages(true);
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        setUploadProgressText(`Uploading ${i + 1} of ${filesToUpload.length} to ImgBB: ${file.name}...`);
        const cdnUrl = await uploadImageToImgBB(file, currentKey);
        uploadedUrls.push(cdnUrl);
      }

      setImages((prev) => [...prev, ...uploadedUrls].slice(0, MAX_IMAGES_COUNT));
      setImageError(null);
    } catch (err: any) {
      console.error("ImgBB upload failed:", err);
      setImageError(err?.message || "Failed to upload to ImgBB. Please check your API key.");
    } finally {
      setIsUploadingImages(false);
      setUploadProgressText("");
    }
  };

  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    const files = Array.from(selectedFiles);
    if (fileInputRef.current) fileInputRef.current.value = "";
    await processFilesToUpload(files);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isUploadingImages || images.length >= MAX_IMAGES_COUNT) return;

    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/")
    );

    if (droppedFiles.length === 0) {
      setImageError("Please drop valid image files (PNG, JPG, WEBP, GIF).");
      return;
    }

    await processFilesToUpload(droppedFiles);
  };

  const handleTriggerReplace = (index: number) => {
    setReplaceTargetIndex(index);
    replaceFileInputRef.current?.click();
  };

  const handleReplaceFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || replaceTargetIndex === null) return;
    if (replaceFileInputRef.current) replaceFileInputRef.current.value = "";

    setImageError(null);

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setImageError(`"${file.name}" is ${sizeMB}MB. Each image must be 2MB or less.`);
      return;
    }

    const currentKey = getImgBBApiKey();
    if (!currentKey) {
      setIsImgBBModalOpen(true);
      return;
    }

    setIsUploadingImages(true);
    setUploadProgressText("Uploading replacement image to ImgBB...");

    try {
      const cdnUrl = await uploadImageToImgBB(file, currentKey);
      setImages((prev) => prev.map((img, idx) => (idx === replaceTargetIndex ? cdnUrl : img)));
      setImageError(null);
    } catch (err: any) {
      console.error("Replace upload failed:", err);
      setImageError(err?.message || "Failed to upload replacement image to ImgBB.");
    } finally {
      setIsUploadingImages(false);
      setUploadProgressText("");
      setReplaceTargetIndex(null);
    }
  };

  const handleSaveImgBBApiKey = () => {
    const trimmed = imgBBApiKeyInput.trim();
    if (!trimmed) {
      setImageError("Please enter a valid ImgBB API key.");
      return;
    }
    setImgBBApiKey(trimmed);
    setHasImgBBKey(true);
    setIsImgBBModalOpen(false);
    setImageError(null);
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    if (images.length >= MAX_IMAGES_COUNT) {
      setImageError(`Maximum ${MAX_IMAGES_COUNT} images reached.`);
      return;
    }
    setImages([...images, imageUrlInput.trim()].slice(0, MAX_IMAGES_COUNT));
    setImageUrlInput("");
    setIsUrlModalOpen(false);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, idx) => idx !== index));
    setImageError(null);
  };

  // Form Submission -> API -> Direct MongoDB Database with pending_review status
  const handleSubmitProduct = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!productName.trim()) {
      setErrorMessage("Please enter a valid product name.");
      return;
    }

    const priceNum = parseFloat(basePrice);
    if (!basePrice || isNaN(priceNum) || priceNum <= 0) {
      setErrorMessage("Please enter a valid product price (e.g. 9.99).");
      return;
    }

    if (images.length === 0) {
      setErrorMessage("Please upload at least 1 product image (Maximum 5 images).");
      return;
    }

    setIsSubmitting(true);

    try {
      const primaryPrice = priceNum;
      const targetCategoryId = selectedSubCategory || selectedParentCategory || (categories[0]?.id ?? "cat-1");
      const tagsArray = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        name: productName.trim(),
        category_id: targetCategoryId,
        description: description.trim() || `${productName.trim()} - Quality store produce and essential goods.`,
        base_price: Math.round(primaryPrice * 100),
        images: images.slice(0, MAX_IMAGES_COUNT),
        inventory_quantity: parseInt(quantity) || 100,
        sku: sku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
        selling_type: sellingType,
        shipping: {
          weight: parseFloat(itemWeight) || 1.0,
          weight_unit: weightUnit,
          dimensions: {
            length: parseFloat(packageLength) || 10,
            breadth: parseFloat(packageBreadth) || 10,
            width: parseFloat(packageWidth) || 4,
            unit: dimensionUnit,
          },
        },
        variants: [
          {
            sku: sku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
            name: "Standard",
            price: Math.round(primaryPrice * 100),
            compare_at_price: compareAtPrice ? Math.round(parseFloat(compareAtPrice) * 100) : undefined,
            attributes: {},
            quantity: parseInt(quantity) || 100,
            is_active: true,
          },
        ],
        tags: [
          sellingType,
          ...tagsArray,
          productName.split(" ")[0]?.toLowerCase() || "grocery",
        ].filter(Boolean),
      };

      const result = await createProduct(payload as any);
      broadcastProductUpdate();

      setSuccessMessage(
        `Product "${result.name}" successfully created! It has been submitted for Admin approval (Pending Review).`
      );
      setTimeout(() => {
        router.push("/seller/products");
      }, 1500);
    } catch (err: any) {
      console.error("Failed to save product:", err);
      setErrorMessage(err?.message || "Failed to create product. Please check your inputs.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20 font-sans">
      {/* ====================================================================
          TOP NAVBAR & ACTIONS
          ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D1E7D8]">
        <div>
          <Link
            href="/seller/products"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0A504A]/70 hover:text-[#00A86B] transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to merchant catalog</span>
          </Link>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[#E8F8EE] text-[#00A86B] font-mono text-[11px] font-bold border border-[#A2E4B8]">
              Merchant Portal
            </span>
            <span className="text-xs text-[#0A504A]/60 font-medium">Add New Catalog Item</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0A504A] tracking-tight">
            Add Product to Storefront
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/products"
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#D1E7D8] bg-white text-xs font-semibold text-[#0A504A] hover:bg-[#E8F8EE] shadow-2xs transition-all"
          >
            <span>View Marketplace</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Moderation Notice Banner */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start sm:items-center gap-3 shadow-2xs">
        <Clock className="w-5 h-5 shrink-0 text-amber-600 mt-0.5 sm:mt-0" />
        <div className="flex-1">
          <span className="font-bold block sm:inline">Compliance Moderation Notice: </span>
          <span>
            Products created by merchants are saved in <strong>Pending Review</strong> status. Once approved by an Admin or Super Admin, your product will instantly go live with real-time stock sync on the marketplace.
          </span>
        </div>
      </div>

      {/* Notifications Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-[#E8F8EE] border border-[#A2E4B8] text-[#0A504A] text-xs font-semibold flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-[#00A86B]" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* ====================================================================
          TWO-COLUMN WORKSPACE LAYOUT
          ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ==================================================================
            LEFT COLUMN (7 of 12 columns) - Product Details & Description
            ================================================================== */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. DESCRIPTION CARD */}
          <div className="bg-white rounded-2xl border border-[#D1E7D8] p-6 shadow-2xs space-y-5">
            <h3 className="text-base font-bold text-[#0A504A]">Description</h3>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#0A504A] block">Product Name *</label>
              <input
                type="text"
                required
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Organic Cavendish Bananas - Fresh Bunch"
                className="w-full px-4 py-2.5 rounded-xl border border-[#D1E7D8] bg-white text-sm text-[#0A504A] placeholder-[#0A504A]/40 focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] transition-all"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[#0A504A]">Detailed Product Description</label>
                <div>
                  <input
                    type="file"
                    accept=".txt"
                    ref={txtInputRef}
                    onChange={handleTxtFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => txtInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00A86B] hover:text-[#0A504A] transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload .txt file</span>
                  </button>
                </div>
              </div>

              {/* Rich-Text Editor Box */}
              <div className="rounded-xl border border-[#A2E4B8] bg-white overflow-hidden focus-within:ring-2 focus-within:ring-[#00A86B]/20 transition-all">
                {/* Formatting Floating Toolbar */}
                <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100 bg-[#F8FAF9] text-[#0A504A]">
                  <button
                    type="button"
                    onClick={() => handleFormatText("bold")}
                    className="p-1.5 rounded hover:bg-white hover:text-[#00A86B] transition-colors font-bold text-xs"
                    title="Bold"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatText("italic")}
                    className="p-1.5 rounded hover:bg-white hover:text-[#00A86B] transition-colors italic text-xs"
                    title="Italic"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatText("underline")}
                    className="p-1.5 rounded hover:bg-white hover:text-[#00A86B] transition-colors text-xs"
                    title="Underline"
                  >
                    <Underline className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-px h-4 bg-gray-200 mx-1" />
                  <button
                    type="button"
                    onClick={() => handleFormatText("link")}
                    className="p-1.5 rounded hover:bg-white hover:text-[#00A86B] transition-colors text-xs"
                    title="Insert Link"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatText("list")}
                    className="p-1.5 rounded hover:bg-white hover:text-[#00A86B] transition-colors text-xs"
                    title="Bullet List"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatText("numlist")}
                    className="p-1.5 rounded hover:bg-white hover:text-[#00A86B] transition-colors text-xs"
                    title="Numbered List"
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                  </button>
                </div>

                <textarea
                  id="merchant-product-description"
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Comprehensive description of product specifications, freshness certification, harvest origin, and storage instructions..."
                  className="w-full p-4 text-sm text-[#0A504A] placeholder-[#0A504A]/40 focus:outline-none resize-none leading-relaxed"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#0A504A] block">
                Tags (Comma-separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="organic, fresh, fruit, tropical, vegan"
                className="w-full px-4 py-2.5 rounded-xl border border-[#D1E7D8] bg-white text-sm text-[#0A504A] placeholder-[#0A504A]/40 focus:outline-none focus:border-[#00A86B] transition-all"
              />
            </div>
          </div>

          {/* 2. CATEGORY CARD */}
          <div className="bg-white rounded-2xl border border-[#D1E7D8] p-6 shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-[#0A504A]">Category</h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[#0A504A] block mb-1.5">
                  Product Category *
                </label>
                <select
                  value={selectedParentCategory}
                  onChange={(e) => setSelectedParentCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#D1E7D8] bg-white text-sm text-[#0A504A] focus:outline-none focus:border-[#00A86B] transition-all cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-[#0A504A] block mb-1.5">
                  Sub-Category / Department (Optional)
                </label>
                <select
                  value={selectedSubCategory}
                  onChange={(e) => setSelectedSubCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#D1E7D8] bg-white text-sm text-[#0A504A] focus:outline-none focus:border-[#00A86B] transition-all cursor-pointer"
                >
                  <option value="">Select Sub-Category (Optional)</option>
                  {categories.map((cat) => (
                    <option key={`sub-${cat.id}`} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 3. PRICING & INVENTORY CARD */}
          <div className="bg-white rounded-2xl border border-[#D1E7D8] p-6 shadow-2xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#0A504A]">Pricing & Inventory</h3>
              <p className="text-xs text-[#0A504A]/70 mt-0.5">
                Set item price, optional sale discount, and available stock.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#0A504A] block mb-1.5">
                  Price ($ USD) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    placeholder="12.99"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-[#D1E7D8] bg-white text-sm font-bold text-[#0A504A] focus:outline-none focus:border-[#00A86B] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#0A504A] block mb-1.5">
                  Compare-at Price ($ USD) (Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={compareAtPrice}
                    onChange={(e) => setCompareAtPrice(e.target.value)}
                    placeholder="15.99"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-[#D1E7D8] bg-white text-sm text-[#0A504A] focus:outline-none focus:border-[#00A86B] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#0A504A] block mb-1.5">Stock Quantity *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="100"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#D1E7D8] bg-white text-sm text-[#0A504A] focus:outline-none focus:border-[#00A86B] transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#0A504A] block">
                    SKU / Barcode <span className="text-[#00A86B] font-bold">(Auto-Generated)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setSku(generateProductSKU("NX"))}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00A86B] hover:text-[#0A504A] transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Generate New</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value.toUpperCase())}
                    placeholder="e.g. NX-842915"
                    className="w-full pl-4 pr-32 py-2.5 rounded-xl border border-[#D1E7D8] bg-white font-mono text-sm text-[#0A504A] focus:outline-none focus:border-[#00A86B] transition-all uppercase"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Active for POS/Sale
                  </span>
                </div>
                <p className="text-[11px] text-[#0A504A]/60 mt-1">
                  Unique SKU used for real-time inventory tracking, POS checkout, and dispatch.
                </p>
              </div>
            </div>
          </div>

          {/* 4. SELLING TYPE CARD */}
          <div className="bg-white rounded-2xl border border-[#D1E7D8] p-6 shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-[#0A504A]">Selling Type</h3>

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="sellingType"
                  checked={sellingType === "in_store"}
                  onChange={() => setSellingType("in_store")}
                  className="w-4 h-4 text-[#00A86B] border-gray-300 focus:ring-[#00A86B]"
                />
                <span className="text-sm font-medium text-[#0A504A]">In-store selling only</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="sellingType"
                  checked={sellingType === "online"}
                  onChange={() => setSellingType("online")}
                  className="w-4 h-4 text-[#00A86B] border-gray-300 focus:ring-[#00A86B]"
                />
                <span className="text-sm font-medium text-[#0A504A]">Online selling only</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="sellingType"
                  checked={sellingType === "both"}
                  onChange={() => setSellingType("both")}
                  className="w-4 h-4 text-[#00A86B] border-gray-300 focus:ring-[#00A86B]"
                />
                <span className="text-sm font-medium text-[#0A504A]">
                  Available both in-store and online
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* ==================================================================
            RIGHT COLUMN (5 of 12 columns) - Images, Shipping, Submission
            ================================================================== */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. PRODUCT IMAGES CARD (ImgBB Cloud Hosting + 2MB/5 Images Limit) */}
          <div className="bg-white rounded-2xl border border-[#D1E7D8] p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#0A504A]">Product Images</h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#E8F8EE] text-[#00A86B] border border-[#A2E4B8]">
                  {images.length}/{MAX_IMAGES_COUNT}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsImgBBModalOpen(true)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                    hasImgBBKey
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                      : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 animate-pulse"
                  }`}
                  title={hasImgBBKey ? "ImgBB API Key Configured" : "Click to set ImgBB API Key"}
                >
                  <Key className="w-3 h-3" />
                  <span>{hasImgBBKey ? "ImgBB Ready" : "Set ImgBB Key"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsUrlModalOpen(true)}
                  disabled={images.length >= MAX_IMAGES_COUNT}
                  className="text-xs font-semibold text-[#00A86B] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + URL
                </button>
              </div>
            </div>

            {/* Error Display */}
            {imageError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start justify-between gap-2 text-rose-700 text-xs">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span className="font-medium">{imageError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setImageError(null)}
                  className="text-rose-500 hover:text-rose-800 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Hidden Multi-file input */}
            <input
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,image/gif"
              ref={fileInputRef}
              onChange={handleImageFileSelect}
              className="hidden"
              disabled={isUploadingImages || images.length >= MAX_IMAGES_COUNT}
            />

            {/* Hidden Single-file replace input */}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              ref={replaceFileInputRef}
              onChange={handleReplaceFileSelect}
              className="hidden"
              disabled={isUploadingImages}
            />

            {/* Drag & Drop Upload Zone */}
            {images.length < MAX_IMAGES_COUNT ? (
              <div
                onClick={() => !isUploadingImages && fileInputRef.current?.click()}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all group ${
                  isDragging
                    ? "border-[#00A86B] bg-[#E8F8EE] ring-4 ring-[#00A86B]/20 scale-[1.01]"
                    : isUploadingImages
                    ? "border-[#A2E4B8] bg-[#E8F8EE]/50 cursor-wait"
                    : "border-[#A2E4B8] hover:border-[#00A86B] bg-[#E8F8EE]/30 hover:bg-[#E8F8EE]/50 cursor-pointer"
                }`}
              >
                {isDragging ? (
                  <div className="flex flex-col items-center gap-2 py-2 pointer-events-none animate-bounce">
                    <UploadCloud className="w-10 h-10 text-[#00A86B]" />
                    <p className="text-xs font-bold text-[#0A504A]">Drop images here to upload!</p>
                    <p className="text-[10px] text-[#00A86B]">Supports PNG, JPG, WEBP, GIF up to 2MB</p>
                  </div>
                ) : isUploadingImages ? (
                  <div className="flex flex-col items-center gap-2 py-2">
                    <Loader2 className="w-8 h-8 text-[#00A86B] animate-spin" />
                    <p className="text-xs font-bold text-[#0A504A]">{uploadProgressText || "Uploading to ImgBB..."}</p>
                    <p className="text-[10px] text-gray-500">Storing image permanently on high-speed CDN</p>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-[#E8F8EE] text-[#00A86B] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform shadow-xs">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-[#0A504A]">
                      Click to upload <span className="font-normal text-gray-500">or drag and drop</span>
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1">
                      PNG, JPG, WEBP • Max 2MB per image • Max 5 images
                    </p>
                    <div className="mt-2 inline-flex items-center gap-1 text-[10px] text-[#00A86B] bg-white px-2 py-0.5 rounded-md border border-[#A2E4B8]">
                      <Sparkles className="w-3 h-3" />
                      <span>Direct ImgBB Cloud Storage Integration</span>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="border border-[#D1E7D8] bg-gray-50 rounded-2xl p-4 text-center">
                <div className="w-8 h-8 rounded-full bg-[#E8F8EE] text-[#00A86B] flex items-center justify-center mx-auto mb-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold text-[#0A504A]">Maximum {MAX_IMAGES_COUNT} Images Uploaded</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  To add a different image, click Remove or Replace on any image below.
                </p>
              </div>
            )}

            {/* URL Modal Helper */}
            {isUrlModalOpen && (
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                <label className="text-[11px] font-bold text-gray-700 block">
                  Add Image from Direct URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="https://i.ibb.co/..."
                    className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-900 bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-3 py-1.5 rounded-lg bg-[#00A86B] text-white text-xs font-bold hover:bg-[#0A504A]"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsUrlModalOpen(false)}
                    className="p-1.5 text-gray-400 hover:text-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ImgBB API Key Modal */}
            {isImgBBModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#E8F8EE] text-[#00A86B] flex items-center justify-center">
                        <Key className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">ImgBB API Configuration</h4>
                        <p className="text-[10px] text-gray-500">Cloud image storage & CDN provider</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsImgBBModalOpen(false)}
                      className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed">
                    To upload images directly to ImgBB and host them on high-speed CDN, enter your free ImgBB API key below.
                  </p>

                  <div className="p-3 rounded-xl bg-[#E8F8EE] border border-[#A2E4B8] space-y-1 text-xs">
                    <div className="font-semibold text-[#0A504A] flex items-center justify-between">
                      <span>Don't have an API key?</span>
                      <a
                        href="https://api.imgbb.com/"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[#00A86B] hover:underline font-bold"
                      >
                        <span>Get Free Key</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-[11px] text-[#0A504A]/80">
                      Login to api.imgbb.com & click &quot;Get API Key&quot;. It&apos;s free and takes 10 seconds.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">ImgBB API Key</label>
                    <input
                      type="text"
                      value={imgBBApiKeyInput}
                      onChange={(e) => setImgBBApiKeyInput(e.target.value)}
                      placeholder="Paste your 32-character ImgBB API key..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 font-mono focus:outline-none focus:border-[#00A86B]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsImgBBModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveImgBBApiKey}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#00A86B] hover:bg-[#0A504A] shadow-xs"
                    >
                      Save API Key
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Images Gallery Grid with Replace & Remove */}
            {images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {images.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className="group relative h-36 rounded-xl overflow-hidden border border-gray-200 bg-gray-100 shadow-2xs"
                  >
                    <img
                      src={imgUrl}
                      alt={`Product preview ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* Primary Badge */}
                    {idx === 0 && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/80 text-white text-[9px] font-bold uppercase tracking-wider backdrop-blur-xs shadow-xs">
                        Primary
                      </span>
                    )}

                    {/* Image index counter badge */}
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-white/90 text-gray-800 text-[9px] font-bold shadow-xs">
                      #{idx + 1}
                    </span>

                    {/* Hover Overlay with Replace & Remove Buttons */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3">
                      <button
                        type="button"
                        onClick={() => handleTriggerReplace(idx)}
                        disabled={isUploadingImages}
                        className="w-full py-1.5 rounded-lg bg-white hover:bg-gray-100 text-gray-900 text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Replace</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        disabled={isUploadingImages}
                        className="w-full py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-gray-400">
                No images added yet. Upload up to 5 images (max 2MB each).
              </div>
            )}
          </div>

          {/* 2. SHIPPING AND DELIVERY CARD */}
          <div className="bg-white rounded-2xl border border-[#D1E7D8] p-6 shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-[#0A504A]">Shipping and Delivery</h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[#0A504A] block mb-1.5">
                  Items Weight
                </label>
                <div className="flex rounded-xl border border-[#D1E7D8] overflow-hidden">
                  <input
                    type="number"
                    step="0.01"
                    value={itemWeight}
                    onChange={(e) => setItemWeight(e.target.value)}
                    placeholder="1.00"
                    className="flex-1 px-4 py-2.5 bg-white text-sm text-[#0A504A] focus:outline-none"
                  />
                  <select
                    value={weightUnit}
                    onChange={(e) => setWeightUnit(e.target.value as any)}
                    className="px-3 bg-gray-50 border-l border-[#D1E7D8] text-xs font-semibold text-[#0A504A] focus:outline-none cursor-pointer"
                  >
                    <option value="kg">kg</option>
                    <option value="lb">lb</option>
                    <option value="g">g</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#0A504A] block mb-1.5">
                  Package Size (Dispatch dimensions)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex rounded-xl border border-[#D1E7D8] overflow-hidden bg-white">
                    <input
                      type="number"
                      value={packageLength}
                      onChange={(e) => setPackageLength(e.target.value)}
                      placeholder="Length"
                      className="w-full px-3 py-2 text-xs text-[#0A504A] focus:outline-none"
                    />
                    <span className="px-2 bg-gray-50 text-[10px] text-gray-500 font-semibold flex items-center border-l border-[#D1E7D8]">
                      {dimensionUnit}
                    </span>
                  </div>

                  <div className="flex rounded-xl border border-[#D1E7D8] overflow-hidden bg-white">
                    <input
                      type="number"
                      value={packageBreadth}
                      onChange={(e) => setPackageBreadth(e.target.value)}
                      placeholder="Breadth"
                      className="w-full px-3 py-2 text-xs text-[#0A504A] focus:outline-none"
                    />
                    <span className="px-2 bg-gray-50 text-[10px] text-gray-500 font-semibold flex items-center border-l border-[#D1E7D8]">
                      {dimensionUnit}
                    </span>
                  </div>

                  <div className="flex rounded-xl border border-[#D1E7D8] overflow-hidden bg-white">
                    <input
                      type="number"
                      value={packageWidth}
                      onChange={(e) => setPackageWidth(e.target.value)}
                      placeholder="Width"
                      className="w-full px-3 py-2 text-xs text-[#0A504A] focus:outline-none"
                    />
                    <span className="px-2 bg-gray-50 text-[10px] text-gray-500 font-semibold flex items-center border-l border-[#D1E7D8]">
                      {dimensionUnit}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. BOTTOM ACTION BUTTONS */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push("/seller/products")}
              className="px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              Discard
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmitProduct}
              className="px-6 py-2.5 rounded-xl bg-[#00A86B] hover:bg-[#0A504A] text-white text-xs font-bold transition-all shadow-md shadow-[#00A86B]/25 flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSubmitting ? "Submitting..." : "Submit for Approval"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
