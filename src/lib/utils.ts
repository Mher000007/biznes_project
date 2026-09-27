import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toString();
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

/**
 * Returns the base API URL.
 * - In the browser: returns a relative `/api/backend` path so all requests go
 *   through the Next.js rewrite proxy (no CORS issues).
 * - On the server (SSR / API routes): returns the absolute backend URL so
 *   server-to-server requests work without needing a proxy.
 */
export function getApiUrl(): string {
  if (typeof window !== "undefined") {
    // Client-side: use the Next.js rewrite proxy
    return "/api/backend";
  }
  // Server-side: hit the backend directly
  return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5001/api";
}

/**
 * Returns the absolute backend API URL for OAuth redirect flows.
 *
 * OAuth (Google / Facebook) triggers a full-page redirect chain:
 *   browser → backend → Google → backend callback → frontend
 *
 * This MUST bypass the Next.js rewrite proxy because:
 *  1. The proxy can't handle multi-step redirect chains properly on mobile.
 *  2. Cookies set by the backend in the callback need to be on the correct
 *     domain (backend → frontend redirect), not swallowed by the proxy.
 *
 * Uses NEXT_BACKEND_URL (the absolute backend origin) with an /api
 * suffix so it resolves to e.g. https://biznesprojectapi-production.up.railway.app/api
 */
export function getOAuthUrl(): string {
  return (
    process.env.NEXT_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://biznesprojectapi-production.up.railway.app/api"
  );
}

