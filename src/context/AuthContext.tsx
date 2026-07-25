"use client";
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import { getApiUrl } from "@/lib/utils";

const API = getApiUrl();

// ─── Types ────────────────────────────────────────────────────────────────────

export type AccountType = "personal" | "business";

export interface AuthUser {
  id: string;
  name: string;
  username?: string;
  email: string;
  role: "user" | "business_owner" | "admin";
  accountType?: AccountType;
  avatar?: string;
  phone?: string;
  findyCoins?: number;
}

export interface AuthContextValue {
  currentUser: AuthUser | null;
  isLoading: boolean;
  register: (input: {
    username?: string;
    displayName: string;
    email: string;
    password: string;
    accountType: AccountType;
    phone?: string;
    contactEmail?: string;
  }) => Promise<{ success: boolean; error?: string; user?: AuthUser }>;
  login: (input: {
    userOrEmail: string;
    password: string;
  }) => Promise<{ success: boolean; error?: string; user?: AuthUser }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getToken = () =>
    typeof window !== "undefined" ? window.localStorage.getItem("token") : null;

  const setToken = (token: string) => {
    if (typeof window !== "undefined") window.localStorage.setItem("token", token);
  };

  const clearToken = () => {
    if (typeof window !== "undefined") window.localStorage.removeItem("token");
  };

  // ── Load user on mount ────────────────────────────────────────────────────
  const refreshUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setCurrentUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const res = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success && res.data?.user) {
        setCurrentUser(res.data.user);
      } else {
        clearToken();
        setCurrentUser(null);
      }
    } catch {
      // Token invalid / expired — clear it silently
      clearToken();
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // ── Register ──────────────────────────────────────────────────────────────
  const register = useCallback(async (input: {
    username?: string;
    displayName: string;
    email: string;
    password: string;
    accountType: AccountType;
    phone?: string;
    contactEmail?: string;
  }) => {
    try {
      const res = await axios.post(`${API}/auth/register`, {
        name: input.displayName,
        username: input.username,
        email: input.email,
        password: input.password,
        accountType: input.accountType,
        phone: input.phone,
        contactEmail: input.contactEmail,
      });

      if (res.data?.success) {
        setToken(res.data.token);
        setCurrentUser(res.data.user);
        return { success: true, user: res.data.user };
      }
      return { success: false, error: res.data?.message || "Registration failed" };
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        (err.response?.status === 409 ? "Email or username already exists" : "Registration failed");
      return { success: false, error: msg };
    }
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (input: { userOrEmail: string; password: string }) => {
    try {
      const res = await axios.post(`${API}/auth/login`, {
        email: input.userOrEmail,   // field name 'email' accepts both email & username on backend
        password: input.password,
      });

      if (res.data?.success) {
        setToken(res.data.token);
        setCurrentUser(res.data.user);
        return { success: true, user: res.data.user };
      }
      return { success: false, error: res.data?.message || "Login failed" };
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        (err.response?.status === 401 ? "Invalid email or password" : "Login failed");
      return { success: false, error: msg };
    }
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    clearToken();
    setCurrentUser(null);
  }, []);

  const value = useMemo(
    () => ({ currentUser, isLoading, register, login, logout, refreshUser }),
    [currentUser, isLoading, register, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
