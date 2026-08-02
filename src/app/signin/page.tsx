"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import AnimatedBackground from "@/components/auth/AnimatedBackground";
import { useI18n } from "@/i18n";
import { getApiUrl } from "@/lib/utils";

export default function SignInPage() {
  const router = useRouter();
  const { login, register } = useAuth();
  const { t, locale } = useI18n();

  // Mode state: "login" or "signup"
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState<string | null>(null);

  // Login fields
  const [userOrEmail, setUserOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Signup fields
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [inviteCode, setInviteCode] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const refParam = urlParams.get("ref") || urlParams.get("invite") || urlParams.get("code");
      const errParam = urlParams.get("error");

      if (refParam) {
        setInviteCode(refParam);
        setMode("signup");
      }

      if (errParam) {
        setError("OAuth sign in failed or was cancelled. Please try again.");
      }
    }
  }, []);

  const handleGoogleClick = () => {
    window.location.href = `${getApiUrl()}/auth/google`;
  };

  useEffect(() => {
    const saved = localStorage.getItem("armbiz_remember_me");
    if (saved && mode === "login") {
      try {
        const { userOrEmail: savedEmail, password: savedPassword } = JSON.parse(saved);
        if (savedEmail) setUserOrEmail(savedEmail);
        if (savedPassword) setPassword(savedPassword);
        setRememberMe(true);
      } catch (e) { }
    }
  }, [mode]);

  const toggleMode = (newMode: "login" | "signup") => {
    setMode(newMode);
    setError(null);
  };

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await login({ userOrEmail, password });

      if (!result.success) {
        setError(result.error ?? "Unable to sign in.");
        return;
      }

      if (rememberMe) {
        localStorage.setItem("armbiz_remember_me", JSON.stringify({ userOrEmail, password }));
      } else {
        localStorage.removeItem("armbiz_remember_me");
      }

      if (result.user?.verified === false) {
        router.push("/verify-pending");
        return;
      }

      const uType = result.user?.accountType || (result.user as any)?.role;
      if (uType === "business" || uType === "business_owner") {
        router.push("/dashboard");
      } else {
        router.push("/profile");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !name.trim() || !email.trim() || !regPassword) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      const result = await register({
        username: username.trim(),
        displayName: name.trim(),
        email: email.trim().toLowerCase(),
        password: regPassword,
        accountType: "personal",
        inviteCode: inviteCode.trim() || undefined,
      });

      if (!result.success) {
        setError(result.error ?? "Unable to create account.");
        return;
      }

      router.push("/verify-pending");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 w-full max-w-[420px] rounded-3xl bg-[hsl(var(--card))]/80 backdrop-blur-xl border border-[hsl(var(--border))] shadow-2xl p-5 sm:p-7 transition-all">
        {mode === "login" ? (
          <>
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1.5">{t.auth.welcomeBack}</h1>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">{(t.auth as any).enterCredentials}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold mb-1">{(t.auth as any).userOrEmail || "Username or Email"}</label>
                <input
                  value={userOrEmail}
                  onChange={(e) => setUserOrEmail(e.target.value)}
                  type="text"
                  required
                  className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))]/50 px-3.5 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold">{t.auth.password}</label>
                  <Link href="/forgot-password" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                    {t.auth.forgotPassword}
                  </Link>
                </div>
                <div className="relative">
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))]/50 px-3.5 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-[hsl(var(--border))] text-primary focus:ring-primary accent-primary cursor-pointer"
                />
                <label htmlFor="rememberMe" className="text-xs sm:text-sm font-medium text-[hsl(var(--muted-foreground))] cursor-pointer select-none">
                  {t.auth.rememberMe}
                </label>
              </div>

              <button type="submit" disabled={loading} className="w-full h-10.5 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors mt-1 shadow-md hover:shadow-lg disabled:opacity-50">
                {loading ? "..." : t.auth.loginBtn}
              </button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-[hsl(var(--border))]"></span></div>
              <div className="relative flex justify-center text-[11px] uppercase"><span className="bg-[hsl(var(--card))] px-2.5 text-[hsl(var(--muted-foreground))] font-medium">Or continue with</span></div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleGoogleClick}
                className="flex items-center justify-center gap-2 h-10 rounded-xl border border-[hsl(var(--border))] bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.22-.66-.35-1.36-.35-2.09z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </button>
            </div>

            <div className="mt-6 text-center space-y-1.5">
              <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))]">
                {t.auth.noAccount}{" "}
                <button onClick={() => toggleMode("signup")} className="font-semibold text-primary hover:text-primary/80 transition-colors bg-transparent border-0 cursor-pointer">
                  {t.auth.signUp}
                </button>
              </p>
              <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))]">
                {(t.auth as any).haveBusiness || "Are you a business?"}{" "}
                <Link href="/register" className="font-semibold text-primary hover:text-primary/80 transition-colors">
                  {(t.auth as any).registerBusiness || "Register Business"}
                </Link>
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-5 break-words">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-1">{t.auth.createAccount}</h1>
              <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">{(t.auth as any).personalSetup || "Enter your details to get started"}</p>
            </div>

            <form onSubmit={handleSignUpSubmit} className="space-y-2.5">
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs sm:text-sm text-red-700">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold mb-1">{t.auth.username}</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  type="text"
                  required
                  placeholder="username"
                  className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))]/50 px-3.5 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">{t.auth.name}</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  type="text"
                  required
                  placeholder="John Doe"
                  className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))]/50 px-3.5 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">{t.auth.email}</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                  placeholder="john@example.com"
                  className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))]/50 px-3.5 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">{t.auth.password}</label>
                <div className="relative">
                  <input
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    type={showRegPassword ? "text" : "password"}
                    required
                    minLength={8}
                    className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))]/50 px-3.5 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                  >
                    {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold">{(t.auth as any).inviteCodeOptional}</label>
                  <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">+100 Coins Bonus</span>
                </div>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder={(t.auth as any).inviteCodePlaceholder}
                  className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))]/50 px-3.5 py-2 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono uppercase"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors mt-1 shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {loading ? "Creating account..." : t.auth.signUp}
              </button>
            </form>

            <div className="relative my-3.5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[hsl(var(--border))]" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase">
                <span className="bg-[hsl(var(--card))] px-2.5 text-[hsl(var(--muted-foreground))] font-medium">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleGoogleClick}
                className="flex items-center justify-center gap-2 h-9.5 rounded-xl border border-[hsl(var(--border))] bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.22-.66-.35-1.36-.35-2.09z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </button>
            </div>

            <div className="mt-5 text-center space-y-1.5">
              <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))]">
                {t.auth.haveAccount || "Have an account?"}{" "}
                <button onClick={() => toggleMode("login")} className="font-semibold text-primary hover:text-primary/80 transition-colors bg-transparent border-0 cursor-pointer">
                  {t.auth.login}
                </button>
              </p>
              <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))]">
                {(t.auth as any).haveBusiness || "Are you a business?"}{" "}
                <Link href="/register" className="font-semibold text-primary hover:text-primary/80 transition-colors">
                  {(t.auth as any).registerBusiness || "Register Business"}
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
