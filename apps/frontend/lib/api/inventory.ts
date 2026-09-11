import { apiFetch } from "./client";

export interface InventoryItem {
  id: string;
  product_id: string;
  variant_id: string;
  sku: string;
  store_id: string;
  seller_id: string;
  quantity_available: number;
  quantity_reserved: number;
  low_stock_threshold: number;
  is_low_stock: boolean;
  is_trackable: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryTransaction {
  id: string;
  inventory_id: string;
  sku: string;
  type: "restock" | "adjustment" | "reserve" | "release" | "deduct";
  quantity_change: number;
  balance_after: number;
  reference_id?: string | null;
  reason?: string | null;
  created_at: string;
}

export interface InventoryListResult {
  items: InventoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export async function getSellerInventory(params: {
  search?: string;
  low_stock_only?: boolean;
  page?: number;
  limit?: number;
} = {}): Promise<InventoryListResult> {
  const query = new URLSearchParams();
  if (params.search) query.append("search", params.search);
  if (params.low_stock_only) query.append("low_stock_only", "true");
  if (params.page) query.append("page", String(params.page));
  if (params.limit) query.append("limit", String(params.limit));

  const queryStr = query.toString();
  const endpoint = `/inventory/seller/me${queryStr ? `?${queryStr}` : ""}`;
  const res = await apiFetch<{ success: boolean; data: InventoryListResult }>(endpoint);
  return res.data;
}

export async function getInventoryBySku(sku: string): Promise<InventoryItem> {
  const res = await apiFetch<{ success: boolean; data: InventoryItem }>(
    `/inventory/seller/me/${sku}`
  );
  return res.data;
}

export async function updateStock(
  sku: string,
  data: {
    quantity_change: number;
    type: "restock" | "adjustment";
    note?: string;
  }
): Promise<InventoryItem> {
  const res = await apiFetch<{ success: boolean; data: InventoryItem }>(
    `/inventory/seller/me/${sku}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
  return res.data;
}

export async function setLowStockThreshold(
  sku: string,
  threshold: number
): Promise<InventoryItem> {
  const res = await apiFetch<{ success: boolean; data: InventoryItem }>(
    `/inventory/seller/me/${sku}/threshold`,
    {
      method: "PATCH",
      body: JSON.stringify({ low_stock_threshold: threshold }),
    }
  );
  return res.data;
}

export async function getInventoryTransactions(
  limit = 50
): Promise<InventoryTransaction[]> {
  const res = await apiFetch<{ success: boolean; data: InventoryTransaction[] }>(
    `/inventory/seller/me/transactions?limit=${limit}`
  );
  return res.data;
}
