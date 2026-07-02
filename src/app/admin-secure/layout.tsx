"use client";
import { useEffect } from "react";
import type { Metadata } from "next";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Force dark background on body/html for admin panel
    document.body.classList.add("admin-dark");
    document.documentElement.classList.add("admin-dark");
    return () => {
      document.body.classList.remove("admin-dark");
      document.documentElement.classList.remove("admin-dark");
    };
  }, []);

  return <>{children}</>;
}
