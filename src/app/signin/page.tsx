"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function SignInPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [userOrEmail, setUserOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = await login({ userOrEmail, password });

    if (!result.success) {
      setError(result.error ?? "Unable to sign in.");
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-20">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <Link href="/" className="text-base font-bold tracking-tight mb-6 block">
            arm<span className="gradient-text">biz</span>
          </Link>
          <h1 className="text-xl font-bold tracking-tight mb-1">Welcome back</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Log in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Username or Email</label>
            <input
              value={userOrEmail}
              onChange={(e) => setUserOrEmail(e.target.value)}
              type="text"
              required
              className="w-full rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-sm outline-none transition-colors focus:border-[hsl(var(--foreground))]"
            />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm font-medium">Password</label>
              <Link href="/forgot-password" className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
                Forgot?
              </Link>
            </div>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              className="w-full rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-sm outline-none transition-colors focus:border-[hsl(var(--foreground))]"
            />
          </div>
          <button type="submit" className="w-full h-10 rounded-lg text-sm font-medium btn-primary mt-1">
            Log in
          </button>
        </form>
      </div>
    </div>
  );
}
