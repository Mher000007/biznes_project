"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("");

  const { updateUserVerifiedState } = useAuth();

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided in the URL.");
      return;
    }

    async function doVerify() {
      try {
        const res = await api.post("/auth/verify-email", { token });
        if (res.data?.success) {
          setStatus("success");
          setMessage(res.data.message || "Your email address has been verified successfully!");
          updateUserVerifiedState(true);
          setTimeout(() => {
            router.push("/profile");
          }, 3000);
        } else {
          setStatus("error");
          setMessage(res.data?.message || "Failed to verify email address.");
        }
      } catch (err: any) {
        setStatus("error");
        setMessage(err.response?.data?.message || "Invalid or expired email verification link.");
      }
    }

    doVerify();
  }, [token, router]);

  return (
    <div className="w-full max-w-md bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-8 text-center shadow-xl space-y-6 transition-colors duration-200">
      {status === "loading" && (
        <div className="flex flex-col items-center justify-center space-y-3 py-6">
          <Loader2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400 animate-spin" />
          <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">
            Verifying your email address...
          </h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Please wait a moment while we validate your link.
          </p>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col items-center justify-center space-y-3 py-4">
          <CheckCircle2 className="h-12 w-12 text-emerald-500" />
          <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">
            Email Verified!
          </h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {message}
          </p>
          <div className="pt-4">
            <Link
              href="/profile"
              className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-5 py-2.5 rounded-xl transition-colors"
            >
              Go to Profile
            </Link>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center justify-center space-y-3 py-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">
            Verification Failed
          </h2>
          <p className="text-sm text-red-600 dark:text-red-400">
            {message}
          </p>
          <div className="pt-4">
            <Link
              href="/signin"
              className="inline-block bg-[hsl(var(--foreground))] text-[hsl(var(--background))] hover:opacity-90 font-medium text-sm px-5 py-2.5 rounded-xl transition-colors"
            >
              Return to Sign In
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-20 bg-[hsl(var(--background))] text-[hsl(var(--foreground))] transition-colors duration-200">
      <Suspense fallback={<div className="text-sm text-[hsl(var(--muted-foreground))]">Loading...</div>}>
        <VerifyEmailInner />
      </Suspense>
    </div>
  );
}
