"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import AnimatedBackground from "@/components/auth/AnimatedBackground";
import { useI18n } from "@/i18n";

export default function SignInPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useI18n();
  const [userOrEmail, setUserOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("armbiz_remember_me");
    if (saved) {
      try {
        const { userOrEmail: savedEmail, password: savedPassword } = JSON.parse(saved);
        if (savedEmail) setUserOrEmail(savedEmail);
        if (savedPassword) setPassword(savedPassword);
        setRememberMe(true);
      } catch (e) { }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
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

    router.push("/dashboard");
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-5 py-20 overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 w-full max-w-md bg-[hsl(var(--card))]/90 text-[hsl(var(--card-foreground))] backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-[hsl(var(--border))] overflow-hidden">
        <div className="text-center mb-8 break-words">
          <h1 className="text-2xl font-bold tracking-tight mb-2">{t.auth.welcomeBack}</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">{t.auth.loginToContinue}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold mb-1.5">{t.auth.usernameOrEmail}</label>
            <input
              value={userOrEmail}
              onChange={(e) => setUserOrEmail(e.target.value)}
              type="text"
              required
              placeholder={(t.auth as any).emailPlaceholder || "name@example.com"}
              className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))]/50 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <div className="flex flex-wrap justify-between items-center gap-2 mb-1.5">
              <label className="text-sm font-semibold">{t.auth.password}</label>
              <Link href="/forgot-password" className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                {t.auth.forgotPassword}
              </Link>
            </div>
            <div className="relative">
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                required
                placeholder={(t.auth as any).passwordPlaceholder || "••••••••"}
                className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))]/50 px-4 py-2.5 pr-10 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
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
          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-[hsl(var(--border))] text-primary focus:ring-primary accent-primary cursor-pointer"
            />
            <label htmlFor="rememberMe" className="text-sm font-medium text-[hsl(var(--muted-foreground))] cursor-pointer select-none">
              {(t.auth as any).rememberMe || "Remember me"}
            </label>
          </div>
          <button type="submit" className="w-full h-11 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors mt-2 shadow-md hover:shadow-lg">
            {t.auth.loginBtn}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {t.auth.noAccount}{" "}
            <Link href="/register" className="font-semibold text-primary hover:text-primary/80 transition-colors">
              {t.auth.signUp}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

