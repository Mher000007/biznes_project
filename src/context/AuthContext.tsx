"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import api from "@/lib/api";
import { User, AccountType } from "@/lib/auth";

interface AuthContextType {
  currentUser: User | null;
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
    locale?: string;
  }) => Promise<{ success: boolean; user?: User; error?: string }>;
  login: (input: {
    userOrEmail: string;
    password: string;
  }) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserVerifiedState: (verified: boolean) => void;
  deleteAccount: (confirmation: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // ── Fetch Current User on Mount (using httpOnly cookies) ───────────────────
  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get("/auth/me");
      if (res.data?.success && res.data.user) {
        setCurrentUser(res.data.user);
      } else {
        setCurrentUser(null);
      }
    } catch (e) {
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Listen for global 401 unauthorized events from Axios interceptor
  useEffect(() => {
    const handleUnauthorized = () => {
      setCurrentUser(null);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("armbiz_auth_unauthorized", handleUnauthorized);
      return () => {
        window.removeEventListener("armbiz_auth_unauthorized", handleUnauthorized);
      };
    }
  }, []);

  const updateUserVerifiedState = useCallback((verified: boolean) => {
    setCurrentUser((prev: User | null) => (prev ? { ...prev, verified } : null));
  }, []);

  // ── Register ──────────────────────────────────────────────────────────────
  const register = useCallback(
    async (input: {
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
        const activeLocale =
          input.locale ||
          (typeof window !== "undefined"
            ? localStorage.getItem("armbiz-locale") || localStorage.getItem("ARMBIZ_LOCALE")
            : null) ||
          "hy";
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
          (err.response?.status === 409
            ? "Email or username already exists"
            : "Registration failed");
        return { success: false, error: msg };
      }
    },
    []
  );

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(
    async (input: { userOrEmail: string; password: string }) => {
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
    },
    []
  );

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

  // ── Delete Account ────────────────────────────────────────────────────────
  const deleteAccount = useCallback(async (confirmation: string) => {
    try {
      const res = await api.delete("/auth/account", { data: { confirmation } });
      if (res.data?.success) {
        setCurrentUser(null);
        return { success: true };
      }
      return { success: false, error: res.data?.message || "Failed to delete account" };
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.message || "Failed to delete account",
      };
    }
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      isLoading,
      register,
      login,
      logout,
      refreshUser,
      updateUserVerifiedState,
      deleteAccount,
    }),
    [
      currentUser,
      isLoading,
      register,
      login,
      logout,
      refreshUser,
      updateUserVerifiedState,
      deleteAccount,
    ]
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
