import { apiFetch } from "./client";

export interface RevenueTimePoint {
  date: string;
  revenue: number; // cents
  orders: number;
}

export interface TopProductMetric {
  product_id: string;
  product_name: string;
  total_quantity: number;
  total_revenue: number; // cents
}

export interface SellerAnalyticsData {
  total_revenue: number;
  net_earnings: number;
  total_commission: number;
  total_orders: number;
  delivered_orders: number;
  pending_orders: number;
  revenue_chart: RevenueTimePoint[];
  top_products: TopProductMetric[];
}

export interface TopStoreMetric {
  store_id: string;
  store_name: string;
  total_gmv: number;
  orders_count: number;
}

export interface AdminAnalyticsData {
  platform_gmv: number;
  total_platform_fees: number;
  total_orders: number;
  total_sellers: number;
  total_riders: number;
  active_riders_online: number;
  revenue_chart: RevenueTimePoint[];
  top_stores: TopStoreMetric[];
}

export async function getSellerAnalytics(days = 30): Promise<SellerAnalyticsData> {
  const res = await apiFetch<{ success: boolean; data: SellerAnalyticsData }>(
    `/analytics/seller?days=${days}`
  );
  return res.data;
}

export async function getAdminAnalytics(days = 30): Promise<AdminAnalyticsData> {
  const res = await apiFetch<{ success: boolean; data: AdminAnalyticsData }>(
    `/analytics/admin?days=${days}`
  );
  return res.data;
}

export interface AdminBadgeCounts {
  users: number;
  merchants: {
    pending: number;
    total: number;
  };
  inventory: {
    low_stock: number;
    total: number;
  };
  orders: {
    total: number;
    pending: number;
  };
  withdrawals: {
    pending: number;
    total: number;
  };
  stores: {
    total: number;
  };
  products: {
    total: number;
    pending_review: number;
  };
}

export async function getAdminBadgeCounts(): Promise<AdminBadgeCounts> {
  const res = await apiFetch<{ success: boolean; data: AdminBadgeCounts }>(
    "/analytics/admin/badges"
  );
  return res.data;
}

