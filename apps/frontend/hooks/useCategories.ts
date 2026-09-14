"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCategoryTree,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  CategoryItem,
} from "../lib/api/categories";

export interface UseCategoriesOptions {
  refetchInterval?: number | false;
  enabled?: boolean;
}

export const CATEGORIES_QUERY_KEY = ["categories"] as const;

// Cross-tab and cross-component broadcast channel
const CHANNEL_NAME = "nexora_categories_sync";

export function broadcastCategoryUpdate() {
  if (typeof window !== "undefined") {
    try {
      if ("BroadcastChannel" in window) {
        const bc = new BroadcastChannel(CHANNEL_NAME);
        bc.postMessage({ type: "CATEGORIES_UPDATED", timestamp: Date.now() });
        bc.close();
      }
      window.dispatchEvent(new CustomEvent("nexora:categories_updated"));
    } catch {
      // Ignore broadcast errors in non-browser environments
    }
  }
}

export function useCategories(options: UseCategoriesOptions = {}) {
  const { refetchInterval = 30000, enabled = true } = options;
  const queryClient = useQueryClient();

  // Multi-tab and intra-window real-time listener
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
      queryClient.refetchQueries({ queryKey: CATEGORIES_QUERY_KEY });
    };

    window.addEventListener("nexora:categories_updated", handleUpdate);

    let bc: BroadcastChannel | null = null;
    if ("BroadcastChannel" in window) {
      bc = new BroadcastChannel(CHANNEL_NAME);
      bc.onmessage = (event) => {
        if (event.data?.type === "CATEGORIES_UPDATED") {
          queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
          queryClient.refetchQueries({ queryKey: CATEGORIES_QUERY_KEY });
        }
      };
    }

    return () => {
      window.removeEventListener("nexora:categories_updated", handleUpdate);
      if (bc) bc.close();
    };
  }, [queryClient]);

  return useQuery<CategoryItem[], Error>({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: async () => {
      const data = await getCategoryTree();
      return data || [];
    },
    staleTime: 1000 * 5, // 5 seconds (ensures ultra-responsive fresh data)
    refetchInterval: refetchInterval || false, // Background live tracking
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
    enabled,
  });
}

export function useCategory(slug: string, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;

  return useQuery<CategoryItem, Error>({
    queryKey: ["category", slug],
    queryFn: () => getCategoryBySlug(slug),
    staleTime: 1000 * 30,
    enabled: Boolean(slug) && enabled,
  });
}

export function useCategoryMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
      await queryClient.refetchQueries({ queryKey: CATEGORIES_QUERY_KEY });
      broadcastCategoryUpdate();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateCategory>[1] }) =>
      updateCategory(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
      await queryClient.refetchQueries({ queryKey: CATEGORIES_QUERY_KEY });
      broadcastCategoryUpdate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
      await queryClient.refetchQueries({ queryKey: CATEGORIES_QUERY_KEY });
      broadcastCategoryUpdate();
    },
  });

  return {
    createCategory: createMutation,
    updateCategory: updateMutation,
    deleteCategory: deleteMutation,
  };
}
