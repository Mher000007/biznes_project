"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  getCurrentUser as getMockCurrentUser,
  registerUser as registerMockUser,
  signIn as signInMock,
  signOut as signOutMock,
  UserAccount,
  AccountType,
} from "@/lib/auth";

export interface AuthContextValue {
  currentUser: any | null;
  isLoading: boolean;
  register: (input: {
    username: string;
    displayName: string;
    email: string;
    password: string;
    accountType: AccountType;
  }) => Promise<{ success: boolean; error?: string; user?: any }>;
  login: (input: { userOrEmail: string; password: string }) => Promise<{ success: boolean; error?: string; user?: any }>;
  logout: () => void;
  resetPassword: (input: { userOrEmail: string; newPassword: string }) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize: Load user profile
  useEffect(() => {
    async function loadUser() {
      const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
      const apiURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      
      if (token) {
        try {
          const res = await axios.get(`${apiURL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data?.success && res.data?.user) {
            setCurrentUser(res.data.user);
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.warn("Backend auth fetch failed, attempting local storage mock fallback", err);
        }
      }
      
      // Local storage mock fallback
      const savedUser = getMockCurrentUser();
      setCurrentUser(savedUser);
      setIsLoading(false);
    }
    loadUser();
  }, []);

  const register = async (input: {
    username: string;
    displayName: string;
    email: string;
    password: string;
    accountType: AccountType;
  }) => {
    const apiURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    
    // 1. Try backend
    try {
      const response = await axios.post(`${apiURL}/auth/register`, {
        name: input.displayName || input.username,
        email: input.email,
        password: input.password,
        phone: ""
      });

      if (response.data?.success) {
        const { token, user } = response.data;
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('token', token);
        }
        setCurrentUser(user);
        return { success: true, user };
      }
    } catch (err: any) {
      console.warn("Backend registration failed, falling back to mock registration:", err.message);
      if (err.response?.data?.message) {
        return { success: false, error: err.response.data.message };
      }
    }

    // 2. Fallback to local storage mock
    const result = registerMockUser(input);
    if (result.success && result.user) {
      setCurrentUser(result.user);
    }
    return result as any;
  };

  const login = async (input: { userOrEmail: string; password: string }) => {
    const apiURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    // 1. Try backend
    try {
      const response = await axios.post(`${apiURL}/auth/login`, {
        email: input.userOrEmail,
        password: input.password
      });

      if (response.data?.success) {
        const { token, user } = response.data;
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('token', token);
        }
        setCurrentUser(user);
        return { success: true, user };
      }
    } catch (err: any) {
      console.warn("Backend login failed, falling back to mock authentication:", err.message);
      if (err.response?.data?.message) {
        return { success: false, error: err.response.data.message };
      }
    }

    // 2. Fallback to mock
    const result = signInMock(input);
    if (result.success && result.user) {
      setCurrentUser(result.user);
    }
    return result as any;
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('token');
    }
    signOutMock();
    setCurrentUser(null);
  };

  const resetPassword = async (input: { userOrEmail: string; newPassword: string }) => {
    // Standard mock reset
    return { success: true };
  };

  const value = useMemo(
    () => ({ currentUser, isLoading, register, login, logout, resetPassword }),
    [currentUser, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
