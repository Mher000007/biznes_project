"use client";
import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !isLoading && !currentUser) {
      router.replace("/signin");
    }
  }, [hydrated, isLoading, currentUser, router]);

  if (!hydrated || isLoading || !currentUser) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">
        Redirecting to sign in...
      </div>
    );
  }

  return <>{children}</>;
}
