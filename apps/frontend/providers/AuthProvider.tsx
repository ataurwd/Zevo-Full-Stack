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

  // Silent refresh on initial page mount
  useEffect(() => {
    let mounted = true;
    async function initAuth() {
      try {
        const res = await refreshToken();
        if (mounted && res?.user) {
          setUser(res.user);
        }
      } catch {
        if (mounted) setUser(null);
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
    return res.user;
  };

  const logout = async (): Promise<void> => {
    await logoutUser();
    setUser(null);
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
