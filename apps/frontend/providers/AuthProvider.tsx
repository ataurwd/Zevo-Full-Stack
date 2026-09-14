"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, LoginPayload, loginUser, logoutUser, refreshToken } from "../lib/api/auth";
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const profile = await getProfile();
      setUser(profile);
    } catch {
      setUser(null);
    }
  }, []);

  // Synchronous init from localStorage, then verify with backend
  useEffect(() => {
    let mounted = true;
    async function initAuth() {
      if (typeof window !== "undefined") {
        try {
          const storedUser = localStorage.getItem("nexora_auth_user");
          if (storedUser) {
            const parsed = JSON.parse(storedUser);
            if (mounted) setUser(parsed);
          }
        } catch {
          // ignore
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
              } catch {}
            }
          }
        } catch {
          // Genuinely unauthenticated
          if (mounted) {
            setUser(null);
            if (typeof window !== "undefined") {
              try {
                localStorage.removeItem("nexora_auth_user");
                localStorage.removeItem("nexora_access_token");
                document.cookie = "nexora_token=; path=/; max-age=0; SameSite=Lax";
                document.cookie = "nexora_role=; path=/; max-age=0; SameSite=Lax";
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

  const login = async (payload: LoginPayload): Promise<User> => {
    const res = await loginUser(payload);
    setUser(res.user);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("nexora_auth_user", JSON.stringify(res.user));
        document.cookie = `nexora_role=${res.user.role}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
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
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("nexora_auth_user");
          localStorage.removeItem("nexora_access_token");
          document.cookie = "nexora_token=; path=/; max-age=0; SameSite=Lax";
          document.cookie = "nexora_role=; path=/; max-age=0; SameSite=Lax";
          sessionStorage.clear();
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
