"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { resetPassword } from "@/lib/auth";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [userOrEmail, setUserOrEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    const result = resetPassword({ userOrEmail, newPassword });

    if (!result.success) {
      setError(result.error ?? "Unable to reset password.");
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/signin"), 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-20">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <Link href="/" className="text-base font-bold tracking-tight mb-6 block">
            arm<span className="gradient-text">biz</span>
          </Link>
          <h1 className="text-xl font-bold tracking-tight mb-1">Reset your password</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Use your username or email to reset your password.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              Password reset successfully. Redirecting to login...
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
            <label className="block text-sm font-medium mb-1">New password</label>
            <input
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              type="password"
              required
              minLength={8}
              className="w-full rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-sm outline-none transition-colors focus:border-[hsl(var(--foreground))]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirm password</label>
            <input
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type="password"
              required
              minLength={8}
              className="w-full rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-sm outline-none transition-colors focus:border-[hsl(var(--foreground))]"
            />
          </div>
          <button type="submit" className="w-full h-10 rounded-lg text-sm font-medium btn-primary mt-1">
            Reset password
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
          Remembered your password? <Link href="/signin" className="font-medium text-[hsl(var(--foreground))] hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
