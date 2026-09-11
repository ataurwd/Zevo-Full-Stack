const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

let inMemoryAccessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
}

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

let inMemoryGuestCartId: string | null = null;

export function getGuestCartId(): string | null {
  if (inMemoryGuestCartId) return inMemoryGuestCartId;
  if (typeof window !== "undefined") {
    let stored = localStorage.getItem("nexora_guest_cart_id");
    if (!stored) {
      stored =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : "guest-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("nexora_guest_cart_id", stored);
    }
    inMemoryGuestCartId = stored;
    return stored;
  }
  return null;
}

export function clearGuestCartId(): void {
  inMemoryGuestCartId = null;
  if (typeof window !== "undefined") {
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
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;

  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  if (inMemoryAccessToken) {
    headers.set("Authorization", `Bearer ${inMemoryAccessToken}`);
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
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
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
