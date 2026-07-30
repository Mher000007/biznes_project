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
    <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center shadow-xl space-y-6">
      {status === "loading" && (
        <div className="flex flex-col items-center justify-center space-y-3 py-6">
          <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Verifying your email address...
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Please wait a moment while we validate your link.
          </p>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col items-center justify-center space-y-3 py-4">
          <CheckCircle2 className="h-12 w-12 text-emerald-500" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Email Verified!
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {message}
          </p>
          <div className="pt-4">
            <Link
              href="/profile"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-5 py-2.5 rounded-xl transition-colors"
            >
              Go to Profile
            </Link>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center justify-center space-y-3 py-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Verification Failed
          </h2>
          <p className="text-sm text-red-600 dark:text-red-400">
            {message}
          </p>
          <div className="pt-4">
            <Link
              href="/signin"
              className="inline-block bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm px-5 py-2.5 rounded-xl transition-colors"
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
    <div className="min-h-screen flex items-center justify-center px-5 py-20 bg-slate-50 dark:bg-slate-950">
      <Suspense fallback={<div className="text-sm text-slate-500">Loading...</div>}>
        <VerifyEmailInner />
      </Suspense>
    </div>
  );
}
