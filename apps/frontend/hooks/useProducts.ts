"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  browseProducts,
  getProductPublicDetail,
  createProduct,
  updateProduct,
  deleteProduct,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminApproveProduct,
  adminRejectProduct,
  BrowseProductsParams,
  PaginatedResult,
  ProductItem,
  CreateProductInput,
} from "../lib/api/products";

export interface UseProductsOptions {
  refetchInterval?: number | false;
  enabled?: boolean;
  keepPreviousData?: boolean;
}

export const PRODUCTS_QUERY_KEY = ["products"] as const;
export const PRODUCT_SYNC_CHANNEL = "nexora_products_sync";
export const PRODUCT_STORAGE_KEY = "nexora_products_sync_timestamp";

// Cross-tab, cross-window, and cross-component broadcast channel for instant real-time synchronization
export function broadcastProductUpdate() {
  if (typeof window !== "undefined") {
    try {
      if ("BroadcastChannel" in window) {
        const bc = new BroadcastChannel(PRODUCT_SYNC_CHANNEL);
        bc.postMessage({ type: "PRODUCTS_UPDATED", timestamp: Date.now() });
        bc.close();
      }
    } catch {
      // Ignore
    }

    try {
      // Triggers 'storage' event across all other open browser tabs & windows of this origin
      localStorage.setItem(PRODUCT_STORAGE_KEY, Date.now().toString());
    } catch {
      // Ignore
    }

    try {
      // Triggers CustomEvent in the current window/tab
      window.dispatchEvent(new CustomEvent("nexora:products_updated"));
    } catch {
      // Ignore
    }
  }
}

export function useProducts(
  params: BrowseProductsParams = {},
  options: UseProductsOptions = {}
) {
  // Ultra-responsive live polling: default 4 seconds so separate devices/browsers sync automatically
  const { refetchInterval = 4000, enabled = true } = options;
  const queryClient = useQueryClient();

  // Multi-tab, intra-window, storage-event, and focus real-time listener
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY, exact: false });
      queryClient.refetchQueries({ queryKey: PRODUCTS_QUERY_KEY, exact: false });
    };

    // 1. Intra-window custom event
    window.addEventListener("nexora:products_updated", handleUpdate);

    // 2. Storage event across tabs/windows
    const handleStorage = (e: StorageEvent) => {
      if (e.key === PRODUCT_STORAGE_KEY) {
        handleUpdate();
      }
    };
    window.addEventListener("storage", handleStorage);

    // 3. Tab focus / visibility change
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        handleUpdate();
      }
    };
    window.addEventListener("focus", handleUpdate);
    document.addEventListener("visibilitychange", handleVisibility);

    // 4. BroadcastChannel across tabs
    let bc: BroadcastChannel | null = null;
    if ("BroadcastChannel" in window) {
      try {
        bc = new BroadcastChannel(PRODUCT_SYNC_CHANNEL);
        bc.onmessage = (event) => {
          if (event.data?.type === "PRODUCTS_UPDATED") {
            handleUpdate();
          }
        };
      } catch {
        // Ignore
      }
    }

    return () => {
      window.removeEventListener("nexora:products_updated", handleUpdate);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleUpdate);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (bc) bc.close();
    };
  }, [queryClient]);

  const query = useQuery<PaginatedResult<ProductItem>, Error>({
    queryKey: [...PRODUCTS_QUERY_KEY, params],
    queryFn: () => browseProducts(params),
    staleTime: 1000 * 2, // 2 seconds fresh (guarantees fast live updates without stale caching)
    refetchInterval: refetchInterval || false, // Background live poll
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
    refetchOnReconnect: true,
    enabled,
  });

  return {
    ...query,
    products: query.data?.items || [],
    pagination: query.data?.pagination || {
      page: params.page || 1,
      limit: params.limit || 12,
      total: 0,
      total_pages: 1,
      has_next: false,
      has_prev: false,
    },
  };
}

export function useProduct(id: string, options: { enabled?: boolean; refetchInterval?: number | false } = {}) {
  const { enabled = true, refetchInterval = 4000 } = options;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof window === "undefined" || !id) return;

    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["product", id] });
      queryClient.refetchQueries({ queryKey: ["product", id] });
    };

    window.addEventListener("nexora:products_updated", handleUpdate);
    const handleStorage = (e: StorageEvent) => {
      if (e.key === PRODUCT_STORAGE_KEY) handleUpdate();
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleUpdate);

    let bc: BroadcastChannel | null = null;
    if ("BroadcastChannel" in window) {
      try {
        bc = new BroadcastChannel(PRODUCT_SYNC_CHANNEL);
        bc.onmessage = (event) => {
          if (event.data?.type === "PRODUCTS_UPDATED") {
            handleUpdate();
          }
        };
      } catch {
        // Ignore
      }
    }

    return () => {
      window.removeEventListener("nexora:products_updated", handleUpdate);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleUpdate);
      if (bc) bc.close();
    };
  }, [queryClient, id]);

  return useQuery<ProductItem, Error>({
    queryKey: ["product", id],
    queryFn: () => getProductPublicDetail(id),
    staleTime: 1000 * 2,
    refetchInterval,
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
    enabled: Boolean(id) && enabled,
  });
}

export function useInvalidateProducts() {
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY, exact: false });
    await queryClient.refetchQueries({ queryKey: PRODUCTS_QUERY_KEY, exact: false });
    broadcastProductUpdate();
  };
}

export function useProductMutations() {
  const queryClient = useQueryClient();

  const sync = async () => {
    await queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY, exact: false });
    await queryClient.refetchQueries({ queryKey: PRODUCTS_QUERY_KEY, exact: false });
    broadcastProductUpdate();
  };

  const createMutation = useMutation({
    mutationFn: (input: CreateProductInput) => createProduct(input),
    onSuccess: sync,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateProductInput> }) =>
      updateProduct(id, input),
    onSuccess: sync,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: sync,
  });

  const adminCreateMutation = useMutation({
    mutationFn: (input: any) => adminCreateProduct(input),
    onSuccess: sync,
  });

  const adminUpdateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: any }) =>
      adminUpdateProduct(id, input),
    onSuccess: sync,
  });

  const adminDeleteMutation = useMutation({
    mutationFn: (id: string) => adminDeleteProduct(id),
    onSuccess: sync,
  });

  const adminApproveMutation = useMutation({
    mutationFn: (id: string) => adminApproveProduct(id),
    onSuccess: sync,
  });

  const adminRejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminRejectProduct(id, reason),
    onSuccess: sync,
  });

  return {
    createProduct: createMutation,
    updateProduct: updateMutation,
    deleteProduct: deleteMutation,
    adminCreateProduct: adminCreateMutation,
    adminUpdateProduct: adminUpdateMutation,
    adminDeleteProduct: adminDeleteMutation,
    adminApproveProduct: adminApproveMutation,
    adminRejectProduct: adminRejectMutation,
  };
}
