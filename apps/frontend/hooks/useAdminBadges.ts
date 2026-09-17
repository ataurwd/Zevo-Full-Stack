"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAdminBadgeCounts, AdminBadgeCounts } from "../lib/api/analytics";
import { getAccessToken } from "../lib/api/client";

export const ADMIN_BADGES_QUERY_KEY = ["admin", "badges"] as const;

const CHANNEL_NAME = "nexora_admin_badges_sync";

export function broadcastBadgeUpdate() {
  if (typeof window !== "undefined") {
    try {
      if ("BroadcastChannel" in window) {
        const bc = new BroadcastChannel(CHANNEL_NAME);
        bc.postMessage({ type: "BADGES_UPDATED", timestamp: Date.now() });
        bc.close();
      }
      window.dispatchEvent(new CustomEvent("nexora:badges_updated"));
    } catch {
      // Ignore broadcast errors
    }
  }
}

export function useAdminBadges(options: { enabled?: boolean; refetchInterval?: number } = {}) {
  const { enabled = true, refetchInterval = 15000 } = options;
  const queryClient = useQueryClient();

  const query = useQuery<AdminBadgeCounts, Error>({
    queryKey: ADMIN_BADGES_QUERY_KEY,
    queryFn: getAdminBadgeCounts,
    enabled: enabled && typeof window !== "undefined" && !!getAccessToken(),
    refetchInterval,
    refetchOnWindowFocus: true,
    staleTime: 10000,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    let bc: BroadcastChannel | null = null;
    try {
      if ("BroadcastChannel" in window) {
        bc = new BroadcastChannel(CHANNEL_NAME);
        bc.onmessage = () => {
          queryClient.invalidateQueries({ queryKey: ADMIN_BADGES_QUERY_KEY });
        };
      }
    } catch {
      // fallback
    }

    const handleCustomEvent = () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_BADGES_QUERY_KEY });
    };

    window.addEventListener("nexora:badges_updated", handleCustomEvent);
    window.addEventListener("nexora:orders_updated", handleCustomEvent);
    window.addEventListener("nexora:withdrawals_updated", handleCustomEvent);

    return () => {
      bc?.close();
      window.removeEventListener("nexora:badges_updated", handleCustomEvent);
      window.removeEventListener("nexora:orders_updated", handleCustomEvent);
      window.removeEventListener("nexora:withdrawals_updated", handleCustomEvent);
    };
  }, [queryClient]);

  return query;
}
