"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

import { useI18n } from "@/i18n";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useI18n();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const authT = (t as any).auth || {};

  useEffect(() => {
    if (!token) {
      setError("No reset token provided in the URL.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Invalid or missing reset token.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/auth/reset-password", { token, password });
      if (res.data?.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/profile");
        }, 2000);
      } else {
        setError(res.data?.message || "Failed to reset password.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid or expired password reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-tight mb-1">
          {authT.setNewPasswordTitle || "Set a new password"}
        </h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          {authT.setNewPasswordSubtitle || "Enter your new password below to update your account."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            Password reset successful! Redirecting to your account...
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1">
            {authT.newPasswordLabel || "New Password"}
          </label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            minLength={8}
            placeholder="••••••••"
            className="w-full rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-sm outline-none transition-colors focus:border-[hsl(var(--foreground))]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            {authT.confirmNewPasswordLabel || "Confirm New Password"}
          </label>
          <input
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            type="password"
            required
            minLength={8}
            placeholder="••••••••"
            className="w-full rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-sm outline-none transition-colors focus:border-[hsl(var(--foreground))]"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !token || success}
          className="w-full h-10 rounded-lg text-sm font-medium btn-primary mt-1 disabled:opacity-50"
        >
          {loading ? (authT.resettingPasswordBtn || "Updating password...") : (authT.resetPasswordBtn || "Reset password")}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
        <Link href="/signin" className="font-medium text-[hsl(var(--foreground))] hover:underline">
          {authT.backToSignIn || "Back to Sign in"}
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-20">
      <Suspense fallback={<div className="text-sm text-slate-500">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
