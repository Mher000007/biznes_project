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
  const { login, register } = useAuth();
  const { t } = useI18n();

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

  useEffect(() => {
    const handleAuthMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "GOOGLE_AUTH_SUCCESS") {
        handleGoogleAccountSelect(event.data.email, event.data.name);
      }
    };
    window.addEventListener("message", handleAuthMessage);
    return () => window.removeEventListener("message", handleAuthMessage);
  }, []);

  const handleGoogleAccountSelect = async (gEmail: string, gName: string) => {
    setError(null);
    
    // Try login first
    const loginResult = await login({
      userOrEmail: gEmail,
      password: "GoogleAuthMock_2026!"
    });
    
    if (loginResult.success) {
      router.push("/dashboard");
      return;
    }
    
    // Auto register if account does not exist
    const usernameFromEmail = gEmail.split("@")[0];
    const regResult = await register({
      username: usernameFromEmail,
      displayName: gName,
      email: gEmail,
      password: "GoogleAuthMock_2026!",
      accountType: "personal"
    });
    
    if (regResult.success) {
      router.push("/dashboard");
      return;
    }
    
    setError(regResult.error ?? "Google authentication failed.");
  };

  const handleGoogleClick = () => {
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    window.open(
      "/google-signup-mock",
      "Google Sign In",
      `width=${width},height=${height},left=${left},top=${top}`
    );
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

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = await register({
      username,
      displayName: name,
      email,
      password: regPassword,
      accountType: "personal"
    });

    if (!result.success) {
      setError(result.error ?? "Registration failed.");
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-5 py-20 overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 w-full max-w-md bg-[hsl(var(--card))]/90 text-[hsl(var(--card-foreground))] backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-[hsl(var(--border))] overflow-hidden">
        {mode === "login" ? (
          <>
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

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-[hsl(var(--border))]"></span></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-[hsl(var(--card))] px-2 text-[hsl(var(--muted-foreground))]">Or</span></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleClick}
              className="w-full flex items-center justify-center gap-2.5 h-10 rounded-lg border border-[hsl(var(--border))] bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.22-.66-.35-1.36-.35-2.09z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            <div className="mt-8 text-center space-y-2">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {t.auth.noAccount}{" "}
                <button onClick={() => toggleMode("signup")} className="font-semibold text-primary hover:text-primary/80 transition-colors bg-transparent border-0 cursor-pointer">
                  {t.auth.signUp}
                </button>
              </p>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {(t.auth as any).haveBusiness || "Are you a business?"}{" "}
                <Link href="/register" className="font-semibold text-primary hover:text-primary/80 transition-colors">
                  {(t.auth as any).registerBusiness || "Register Business"}
                </Link>
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-8 break-words">
              <h1 className="text-2xl font-bold tracking-tight mb-2">{t.auth.createAccount}</h1>
              <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">{(t.auth as any).personalSetup || "Enter your details to get started"}</p>
            </div>

            <form onSubmit={handleSignUpSubmit} className="space-y-3">
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold mb-1.5">{(t.auth as any).username || "Username"}</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  type="text"
                  required
                  placeholder="username"
                  className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))]/50 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">{t.auth.name}</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  type="text"
                  required
                  placeholder="John Doe"
                  className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))]/50 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">{t.auth.email}</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))]/50 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">{t.auth.password}</label>
                <div className="relative">
                  <input
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    type={showRegPassword ? "text" : "password"}
                    required
                    minLength={8}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))]/50 px-4 py-2.5 pr-10 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
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
              <button type="submit" className="w-full h-11 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors mt-2 shadow-md hover:shadow-lg">
                {t.auth.signUp}
              </button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-[hsl(var(--border))]"></span></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-[hsl(var(--card))] px-2 text-[hsl(var(--muted-foreground))]">Or</span></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleClick}
              className="w-full flex items-center justify-center gap-2.5 h-10 rounded-lg border border-[hsl(var(--border))] bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.22-.66-.35-1.36-.35-2.09z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            <div className="mt-8 text-center space-y-2">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {t.auth.haveAccount || "Have an account?"}{" "}
                <button onClick={() => toggleMode("login")} className="font-semibold text-primary hover:text-primary/80 transition-colors bg-transparent border-0 cursor-pointer">
                  {t.auth.login}
                </button>
              </p>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
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
