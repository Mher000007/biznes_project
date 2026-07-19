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
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
}

