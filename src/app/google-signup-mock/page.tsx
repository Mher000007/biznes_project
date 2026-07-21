"use client";
import { useState } from "react";
import { UserPlus, ArrowLeft } from "lucide-react";

export default function GoogleSignupMock() {
  const [step, setStep] = useState<"choose" | "custom">("choose");
  const [emailInput, setEmailInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [error, setError] = useState("");

  const handleAccountSelect = (email: string, name: string) => {
    if (window.opener) {
      window.opener.postMessage(
        { type: "GOOGLE_AUTH_SUCCESS", email, name },
        window.location.origin
      );
      window.close();
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!emailInput.trim()) {
      setError("Email is required");
      return;
    }
    if (!emailInput.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    if (!nameInput.trim()) {
      setError("Name is required");
      return;
    }

    handleAccountSelect(emailInput.trim(), nameInput.trim());
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-[450px] bg-white dark:bg-slate-950 rounded-lg shadow-md border border-slate-200 dark:border-slate-800 p-8 space-y-6">
        {/* Google Header */}
        <div className="flex flex-col items-center text-center space-y-4">
          <svg className="h-8 w-8" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.22-.66-.35-1.36-.35-2.09z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <div>
            <h1 className="text-xl font-medium text-slate-800 dark:text-slate-100">
              Sign in with Google
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              to continue to ArmBiz
            </p>
          </div>
        </div>

        {step === "choose" ? (
          /* Account Chooser */
          <div className="space-y-3">
            <button
              onClick={() => handleAccountSelect("ivetik@gmail.com", "Ivetik Mot")}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-left transition-colors cursor-pointer"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white font-bold text-base">
                I
              </div>
              <div>
                <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Ivetik Mot
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  ivetik@gmail.com
                </div>
              </div>
            </button>

            <button
              onClick={() => handleAccountSelect("vahe@armbiz.am", "Vahe Martirosyan")}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-left transition-colors cursor-pointer"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white font-bold text-base">
                V
              </div>
              <div>
                <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Vahe Martirosyan
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  vahe@armbiz.am
                </div>
              </div>
            </button>

            <button
              onClick={() => setStep("custom")}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 text-left transition-colors cursor-pointer"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                <UserPlus className="h-5 w-5" />
              </div>
              <div className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Use another account (Enter custom Email)
              </div>
            </button>
          </div>
        ) : (
          /* Custom Account Form */
          <form onSubmit={handleCustomSubmit} className="space-y-4">
            {error && (
              <div className="p-2.5 rounded bg-red-50 border border-red-200 text-xs text-red-600">
                {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Email address
              </label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm outline-none bg-transparent text-slate-800 dark:text-slate-100 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="John Doe"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm outline-none bg-transparent text-slate-800 dark:text-slate-100 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setStep("choose");
                  setError("");
                }}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </form>
        )}

        {/* Footer info */}
        <div className="text-xs text-slate-500 dark:text-slate-400 leading-normal pt-2">
          To continue, Google will share your name, email address, language
          preference, and profile picture with ArmBiz.
        </div>
      </div>
    </div>
  );
}
