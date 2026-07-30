"use client";
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import api from "@/lib/api";

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
  verified?: boolean;
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
    inviteCode?: string;
  }) => Promise<{ success: boolean; error?: string; user?: AuthUser }>;
  login: (input: {
    userOrEmail: string;
    password: string;
  }) => Promise<{ success: boolean; error?: string; user?: AuthUser }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Load user on mount ────────────────────────────────────────────────────
  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get("/auth/me");
      if (res.data?.success && res.data?.user) {
        setCurrentUser(res.data.user);
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Listen for unauthorized events from api interceptor
  useEffect(() => {
    const handleUnauthorized = () => {
      setCurrentUser(null);
    };
    window.addEventListener("armbiz_auth_unauthorized", handleUnauthorized);
    return () => window.removeEventListener("armbiz_auth_unauthorized", handleUnauthorized);
  }, []);

  // ── Register ──────────────────────────────────────────────────────────────
  const register = useCallback(async (input: {
    username?: string;
    displayName: string;
    email: string;
    password: string;
    accountType: AccountType;
    phone?: string;
    contactEmail?: string;
    inviteCode?: string;
    locale?: string;
  }) => {
    try {
      const activeLocale = input.locale || (typeof window !== "undefined" ? (localStorage.getItem("armbiz-locale") || localStorage.getItem("ARMBIZ_LOCALE")) : null) || "hy";
      const res = await api.post("/auth/register", {
        name: input.displayName,
        username: input.username,
        email: input.email,
        password: input.password,
        accountType: input.accountType,
        phone: input.phone,
        contactEmail: input.contactEmail,
        inviteCode: input.inviteCode,
        locale: activeLocale,
      });

      if (res.data?.success) {
        const u = res.data.user;
        const uKey = u.username || u.email || u.id || "";
        if (input.inviteCode && input.inviteCode.trim()) {
          const cleanInvite = input.inviteCode.trim();
          if (uKey) {
            localStorage.setItem(`armbiz_redeemed_code_${uKey}`, cleanInvite);
            localStorage.setItem(`armbiz_user_coins_${uKey}`, "100");
          }
          u.findyCoins = (u.findyCoins || 0) + 100;
          u.redeemedInviteCode = cleanInvite;
        }

        setCurrentUser(u);
        return { success: true, user: u };
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
      const res = await api.post("/auth/login", {
        email: input.userOrEmail,
        password: input.password,
      });

      if (res.data?.success) {
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
  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      setCurrentUser(null);
    }
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
