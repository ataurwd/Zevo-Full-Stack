"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, LoginPayload, loginUser, logoutUser, refreshToken } from "../lib/api/auth";
import { setAccessToken, getAccessToken } from "../lib/api/client";
import { getProfile } from "../lib/api/users";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isProtectedPath(path: string): boolean {
  return (
    path.startsWith("/admin") ||
    path.startsWith("/dashboard") ||
    path.startsWith("/seller") ||
    path.startsWith("/delivery") ||
    path.startsWith("/orders") ||
    path.startsWith("/checkout") ||
    path.startsWith("/chat") ||
    path.startsWith("/profile")
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const profile = await getProfile();
      setUser(profile);
      if (typeof window !== "undefined" && profile) {
        localStorage.setItem("nexora_auth_user", JSON.stringify(profile));
        document.cookie = `nexora_role=${profile.role}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
        document.cookie = `zevo_role=${profile.role}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
      }
    } catch {
      setUser(null);
    }
  }, []);

  // 1. Initial Auth Bootstrap & Verification
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (typeof window !== "undefined") {
        try {
          const storedUser = localStorage.getItem("nexora_auth_user");
          const storedToken = localStorage.getItem("zevo_access_token") || localStorage.getItem("nexora_access_token");

          // Only trust initial storage if both user and token exist
          if (storedUser && storedToken) {
            const parsed = JSON.parse(storedUser);
            if (mounted) setUser(parsed);
          } else {
            if (mounted) setUser(null);
          }
        } catch {
          // ignore parsing errors
        }
      }

      try {
        const res = await refreshToken();
        if (mounted && res?.user) {
          setUser(res.user);
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem("nexora_auth_user", JSON.stringify(res.user));
              document.cookie = `nexora_role=${res.user.role}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
              document.cookie = `zevo_role=${res.user.role}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
            } catch {}
          }
        }
      } catch {
        // If refresh fails, try profile verification with stored access token
        try {
          const profile = await getProfile();
          if (mounted && profile) {
            setUser(profile);
            if (typeof window !== "undefined") {
              try {
                localStorage.setItem("nexora_auth_user", JSON.stringify(profile));
                document.cookie = `nexora_role=${profile.role}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
                document.cookie = `zevo_role=${profile.role}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
              } catch {}
            }
          }
        } catch {
          // Genuinely unauthenticated
          if (mounted) {
            setUser(null);
            setAccessToken(null);
            if (typeof window !== "undefined") {
              try {
                localStorage.removeItem("nexora_auth_user");
                localStorage.removeItem("zevo_auth_user");
                localStorage.removeItem("nexora_access_token");
                localStorage.removeItem("zevo_access_token");
                document.cookie = "nexora_token=; path=/; max-age=0; SameSite=Lax";
                document.cookie = "zevo_token=; path=/; max-age=0; SameSite=Lax";
                document.cookie = "nexora_role=; path=/; max-age=0; SameSite=Lax";
                document.cookie = "zevo_role=; path=/; max-age=0; SameSite=Lax";
              } catch {}
            }
          }
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  // 2. Real-time Cross-Tab Synchronization (BroadcastChannel + Storage Event Listener)
  useEffect(() => {
    if (typeof window === "undefined") return;

    let authChannel: BroadcastChannel | null = null;
    if ("BroadcastChannel" in window) {
      authChannel = new BroadcastChannel("zevo_auth_channel");
      authChannel.onmessage = (event) => {
        const { type, user: broadcastUser, token } = event.data || {};

        if (type === "LOGIN") {
          if (broadcastUser) setUser(broadcastUser);
          if (token) setAccessToken(token);
          setIsLoading(false);
        } else if (type === "LOGOUT") {
          setUser(null);
          setAccessToken(null);
          setIsLoading(false);

          // If current tab is on a protected route, gracefully navigate to login
          if (isProtectedPath(window.location.pathname)) {
            window.location.href = "/login";
          }
        }
      };
    }

    // Fallback: window storage event listener (triggers when localStorage changes in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "nexora_auth_user" || e.key === "zevo_auth_sync") {
        if (!e.newValue) {
          // Logged out in another tab
          setUser(null);
          setAccessToken(null);
          setIsLoading(false);
          if (isProtectedPath(window.location.pathname)) {
            window.location.href = "/login";
          }
        } else {
          // Logged in in another tab
          try {
            const storedUser = localStorage.getItem("nexora_auth_user");
            const storedToken = localStorage.getItem("zevo_access_token") || localStorage.getItem("nexora_access_token");
            if (storedUser && storedToken) {
              setUser(JSON.parse(storedUser));
              setAccessToken(storedToken);
              setIsLoading(false);
            }
          } catch {}
        }
      } else if (e.key === "zevo_access_token" || e.key === "nexora_access_token") {
        if (!e.newValue) {
          setUser(null);
          setAccessToken(null);
          setIsLoading(false);
          if (isProtectedPath(window.location.pathname)) {
            window.location.href = "/login";
          }
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      if (authChannel) authChannel.close();
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const login = async (payload: LoginPayload): Promise<User> => {
    const res = await loginUser(payload);
    setUser(res.user);

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("nexora_auth_user", JSON.stringify(res.user));
        document.cookie = `nexora_role=${res.user.role}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
        document.cookie = `zevo_role=${res.user.role}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;

        // Signal other tabs via storage and BroadcastChannel
        localStorage.setItem("zevo_auth_sync", JSON.stringify({ type: "LOGIN", timestamp: Date.now() }));
        if ("BroadcastChannel" in window) {
          const ch = new BroadcastChannel("zevo_auth_channel");
          ch.postMessage({ type: "LOGIN", user: res.user, token: res.access_token });
          ch.close();
        }
      } catch {}
    }
    return res.user;
  };

  const logout = async (): Promise<void> => {
    try {
      await logoutUser();
    } catch (err) {
      console.warn("Backend logout request warning:", err);
    } finally {
      setUser(null);
      setAccessToken(null);

      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("nexora_auth_user");
          localStorage.removeItem("zevo_auth_user");
          localStorage.removeItem("nexora_access_token");
          localStorage.removeItem("zevo_access_token");
          document.cookie = "nexora_token=; path=/; max-age=0; SameSite=Lax";
          document.cookie = "zevo_token=; path=/; max-age=0; SameSite=Lax";
          document.cookie = "nexora_role=; path=/; max-age=0; SameSite=Lax";
          document.cookie = "zevo_role=; path=/; max-age=0; SameSite=Lax";
          sessionStorage.clear();

          // Signal other tabs via storage and BroadcastChannel
          localStorage.setItem("zevo_auth_sync", JSON.stringify({ type: "LOGOUT", timestamp: Date.now() }));
          if ("BroadcastChannel" in window) {
            const ch = new BroadcastChannel("zevo_auth_channel");
            ch.postMessage({ type: "LOGOUT" });
            ch.close();
          }
        } catch {
          // ignore
        }
        window.location.href = "/login";
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: Boolean(user),
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
