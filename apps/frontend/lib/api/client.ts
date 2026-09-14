export const getApiBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }
  if (
    typeof window !== "undefined" &&
    !window.location.hostname.includes("localhost") &&
    !window.location.hostname.includes("127.0.0.1")
  ) {
    return "https://zevo-full-stack.onrender.com/api/v1";
  }
  return "http://localhost:5000/api/v1";
};

export const API_BASE_URL = getApiBaseUrl();

let inMemoryAccessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      try {
        localStorage.setItem("zevo_access_token", token);
        localStorage.setItem("nexora_access_token", token);
        document.cookie = `zevo_token=${token}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
        document.cookie = `nexora_token=${token}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
      } catch (e) {
        // ignore
      }
    } else {
      try {
        localStorage.removeItem("zevo_access_token");
        localStorage.removeItem("nexora_access_token");
        document.cookie = "zevo_token=; path=/; max-age=0; SameSite=Lax";
        document.cookie = "nexora_token=; path=/; max-age=0; SameSite=Lax";
      } catch (e) {
        // ignore
      }
    }
  }
}

export function getAccessToken(): string | null {
  if (inMemoryAccessToken) return inMemoryAccessToken;
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("zevo_access_token") || localStorage.getItem("nexora_access_token");
      if (stored) {
        inMemoryAccessToken = stored;
        return stored;
      }
    } catch (e) {
      // ignore
    }
  }
  return null;
}

let inMemoryGuestCartId: string | null = null;

export function getGuestCartId(): string | null {
  if (inMemoryGuestCartId) return inMemoryGuestCartId;
  if (typeof window !== "undefined") {
    let stored = localStorage.getItem("zevo_guest_cart_id") || localStorage.getItem("nexora_guest_cart_id");
    if (!stored) {
      stored =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : "guest-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("zevo_guest_cart_id", stored);
    }
    inMemoryGuestCartId = stored;
    return stored;
  }
  return null;
}

export function clearGuestCartId(): void {
  inMemoryGuestCartId = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem("zevo_guest_cart_id");
    localStorage.removeItem("nexora_guest_cart_id");
  }
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = endpoint.startsWith("http") ? endpoint : `${baseUrl}${endpoint}`;

  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  const token = getAccessToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  } else {
    const guestCartId = getGuestCartId();
    if (guestCartId) {
      headers.set("x-guest-cart-id", guestCartId);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include", // send cookies (refresh_token)
  });

  // If 401 and not calling refresh/login endpoint, attempt silent token refresh
  if (response.status === 401 && !endpoint.includes("/auth/refresh") && !endpoint.includes("/auth/login")) {
    if (!isRefreshing) {
      isRefreshing = true;

      try {
        const refreshRes = await fetch(`${baseUrl}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        const refreshData = await refreshRes.json();

        if (refreshRes.ok && refreshData?.data?.access_token) {
          const newToken = refreshData.data.access_token;
          setAccessToken(newToken);
          processQueue(null, newToken);
          isRefreshing = false;

          // Retry original request
          headers.set("Authorization", `Bearer ${newToken}`);
          const retryRes = await fetch(url, {
            ...options,
            headers,
            credentials: "include",
          });
          const retryData = await retryRes.json();
          if (!retryRes.ok) {
            throw new Error(retryData?.error?.message || "Request failed after refresh");
          }
          return retryData;
        } else {
          setAccessToken(null);
          processQueue(new Error("Refresh failed"), null);
          isRefreshing = false;
        }
      } catch (err) {
        setAccessToken(null);
        processQueue(err, null);
        isRefreshing = false;
      }
    } else {
      // Queue requests while token is refreshing
      return new Promise<T>((resolve, reject) => {
        failedQueue.push({
          resolve: () => {
            if (inMemoryAccessToken) {
              headers.set("Authorization", `Bearer ${inMemoryAccessToken}`);
            }
            fetch(url, { ...options, headers, credentials: "include" })
              .then((r) => r.json())
              .then(resolve)
              .catch(reject);
          },
          reject,
        });
      });
    }
  }

  const data = await response.json();
  if (!response.ok) {
    const errorMsg = data?.error?.message || "An unexpected error occurred";
    const error = new Error(errorMsg) as any;
    error.status = response.status;
    error.code = data?.error?.code;
    error.details = data?.error?.details;
    throw error;
  }

  return data;
}
