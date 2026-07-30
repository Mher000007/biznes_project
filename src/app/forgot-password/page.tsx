"use client";
import Link from "next/link";
import { useState } from "react";
import api from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const res = await api.post("/auth/forgot-password", { email });
      if (res.data?.success) {
        setMessage(res.data.message || "If an account with that email exists, a password reset link has been sent.");
      } else {
        setError(res.data?.message || "Failed to request password reset.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to request password reset. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-20">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-xl font-bold tracking-tight mb-1">Forgot your password?</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 leading-relaxed">
              {message}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Email address</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              placeholder="name@example.com"
              className="w-full rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-sm outline-none transition-colors focus:border-[hsl(var(--foreground))]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-lg text-sm font-medium btn-primary mt-1 disabled:opacity-50"
          >
            {loading ? "Sending link..." : "Send reset link"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
          Remembered your password? <Link href="/signin" className="font-medium text-[hsl(var(--foreground))] hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
