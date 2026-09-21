import { apiFetch } from "./client";

export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  attributes: Record<string, string>;
  price: number; // in cents
  compare_at_price?: number | null; // in cents
  weight_grams?: number | null;
  quantity?: number | null;
  is_active: boolean;
}

export interface ProductImage {
  url: string;
  alt?: string;
  is_primary: boolean;
}

export interface ProductItem {
  id: string;
  store_id: string;
  seller_id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  status: "draft" | "pending_review" | "approved" | "rejected" | "suspended";
  rejection_reason?: string | null;
  images: any[];
  tags: string[];
  attributes: Array<{ name: string; value: string }>;
  variants: ProductVariant[];
  base_price: number; // in cents
  compare_at_price?: number | null; // in cents
  inventory_quantity?: number | null;
  shipping?: {
    weight?: number;
    weight_unit?: "kg" | "lb" | "g";
    dimensions?: {
      length?: number;
      breadth?: number;
      width?: number;
      unit?: "in" | "cm";
    };
  } | null;
  selling_type?: "in_store" | "online" | "both" | null;
  sku?: string;
  rating_avg: number;
  rating_count: number;
  total_sold: number;
  created_at: string;
  updated_at?: string;
}

export interface CreateProductInput {
  category_id: string;
  name: string;
  description: string;
  images?: string[];
  tags?: string[];
  attributes?: Array<{ name: string; value: string }>;
  variants: Array<{
    sku?: string;
    name: string;
    attributes?: Record<string, string>;
    price: number; // in cents
    compare_at_price?: number;
    weight_grams?: number;
    quantity?: number;
    is_active?: boolean;
  }>;
  shipping?: any;
  selling_type?: "in_store" | "online" | "both";
  inventory_quantity?: number;
  sku?: string;
}

export interface BrowseProductsParams {
  q?: string;
  category?: string;
  store?: string;
  min_price?: number;
  max_price?: number;
  rating?: number;
  sort?: "price_asc" | "price_desc" | "rating" | "newest" | "best_selling";
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export async function browseProducts(
  params: BrowseProductsParams = {}
): Promise<PaginatedResult<ProductItem>> {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  });

  const queryStr = searchParams.toString();
  const endpoint = `/products${queryStr ? `?${queryStr}` : ""}`;
  const res = await apiFetch<{ success: boolean; data: PaginatedResult<ProductItem> }>(endpoint);
  return res.data;
}

export async function getProductPublicDetail(idOrSlug: string): Promise<ProductItem> {
  const encoded = encodeURIComponent(decodeURIComponent(idOrSlug));
  const res = await apiFetch<{ success: boolean; data: ProductItem }>(`/products/${encoded}`);
  return res.data;
}

export async function getSellerProducts(): Promise<ProductItem[]> {
  const res = await apiFetch<{ success: boolean; data: ProductItem[] }>("/products/seller/me");
  return res.data;
}

export async function getSellerProductById(id: string): Promise<ProductItem> {
  const res = await apiFetch<{ success: boolean; data: ProductItem }>(`/products/seller/${id}`);
  return res.data;
}

export async function createProduct(input: CreateProductInput): Promise<ProductItem> {
  const res = await apiFetch<{ success: boolean; data: ProductItem }>("/products/seller", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function updateProduct(
  id: string,
  input: Partial<CreateProductInput>
): Promise<ProductItem> {
  const res = await apiFetch<{ success: boolean; data: ProductItem }>(`/products/seller/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function deleteProduct(id: string): Promise<void> {
  await apiFetch(`/products/seller/${id}`, {
    method: "DELETE",
  });
}

export async function addProductVariant(
  productId: string,
  variant: {
    sku?: string;
    name: string;
    attributes?: Record<string, string>;
    price: number;
    compare_at_price?: number;
    weight_grams?: number;
    is_active?: boolean;
  }
): Promise<ProductItem> {
  const res = await apiFetch<{ success: boolean; data: ProductItem }>(
    `/products/seller/${productId}/variants`,
    {
      method: "POST",
      body: JSON.stringify(variant),
    }
  );
  return res.data;
}

export async function submitProductForReview(id: string): Promise<ProductItem> {
  const res = await apiFetch<{ success: boolean; data: ProductItem }>(
    `/products/seller/${id}/status`,
    {
      method: "PATCH",
    }
  );
  return res.data;
}

export async function adminListProducts(params: {
  status?: string;
  page?: number;
  limit?: number;
} = {}): Promise<PaginatedResult<ProductItem>> {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.append("status", params.status);
  if (params.page) searchParams.append("page", String(params.page));
  if (params.limit) searchParams.append("limit", String(params.limit));

  const queryStr = searchParams.toString();
  const endpoint = `/products/admin/all${queryStr ? `?${queryStr}` : ""}`;
  const res = await apiFetch<{ success: boolean; data: PaginatedResult<ProductItem> }>(endpoint);
  return res.data;
}

export async function adminApproveProduct(id: string): Promise<ProductItem> {
  const res = await apiFetch<{ success: boolean; data: ProductItem }>(
    `/products/admin/${id}/approve`,
    { method: "PATCH" }
  );
  return res.data;
}

export async function adminRejectProduct(id: string, reason: string): Promise<ProductItem> {
  const res = await apiFetch<{ success: boolean; data: ProductItem }>(
    `/products/admin/${id}/reject`,
    {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    }
  );
  return res.data;
}

export async function adminGetProductById(id: string): Promise<ProductItem> {
  try {
    const res = await apiFetch<{ success: boolean; data: ProductItem }>(`/products/admin/${id}`);
    return res.data;
  } catch (err: any) {
    console.warn(`[adminGetProductById] Direct /products/admin/${id} failed, attempting fallback to catalog list...`, err?.message);
    // Fallback: If deployed backend (e.g. Render) doesn't have /products/admin/:id route yet,
    // look up the product in /products/admin/all (which is supported and deployed on Render)
    try {
      const allRes = await apiFetch<{ success: boolean; data: ProductItem[] }>(`/products/admin/all?limit=500`);
      const items = Array.isArray(allRes.data) ? allRes.data : (allRes as any)?.items || [];
      const found = items.find((p: any) => (p._id || p.id) === id);
      if (found) return found;
    } catch (fallbackErr) {
      console.warn(`[adminGetProductById] /products/admin/all fallback failed:`, fallbackErr);
    }

    // Try public detail as secondary fallback
    try {
      const pubRes = await apiFetch<{ success: boolean; data: ProductItem }>(`/products/${id}`);
      if (pubRes.data) return pubRes.data;
    } catch {
      // ignore
    }

    throw err;
  }
}

export async function adminCreateProduct(input: any): Promise<ProductItem> {
  const res = await apiFetch<{ success: boolean; data: ProductItem }>("/products/admin", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function adminUpdateProduct(
  id: string,
  input: any
): Promise<ProductItem> {
  const res = await apiFetch<{ success: boolean; data: ProductItem }>(`/products/admin/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function adminDeleteProduct(id: string): Promise<void> {
  await apiFetch(`/products/admin/${id}`, {
    method: "DELETE",
  });
}
