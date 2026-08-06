"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, User, ArrowRight, ChevronLeft } from "lucide-react";
import { AccountType, getUsers } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import axios from "axios";
import { getApiUrl } from "@/lib/utils";

export default function SignUpPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const { register } = useAuth();
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  // Live password validation rules
  const pwdMinLength = password.length >= 8;
  const pwdUpper = /[A-Z]/.test(password);
  const pwdNumber = /\d/.test(password);
  const pwdSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const refParam = urlParams.get("ref") || urlParams.get("invite") || urlParams.get("code");
      const errParam = urlParams.get("error");
      if (refParam) {
        setInviteCode(refParam);
      }
      if (errParam) {
        setError("OAuth sign up failed or was cancelled. Please try again.");
      }
    }
  }, []);

  // Debounced check for Username availability
  useEffect(() => {
    if (!username.trim()) {
      setUsernameError(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await axios.get(`${getApiUrl()}/auth/check-availability?username=${encodeURIComponent(username.trim())}`);
        if (res.data?.usernameTaken || res.data?.available === false) {
          setUsernameError((t.auth as any).usernameTaken || "⚠️ Այս Օգտանունը արդեն զբաղված է:");
        } else {
          setUsernameError(null);
        }
      } catch (err) {
        setUsernameError(null);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [username]);

  // Debounced check for Email availability
  useEffect(() => {
    if (!email.trim() || !email.includes("@")) {
      setEmailError(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await axios.get(`${getApiUrl()}/auth/check-availability?email=${encodeURIComponent(email.trim())}`);
        if (res.data?.emailTaken || res.data?.available === false) {
          setEmailError((t.auth as any).emailTaken || "⚠️ Այս էլ. հասցեն (email) արդեն գոյություն ունի:");
        } else {
          setEmailError(null);
        }
      } catch (err) {
        setEmailError(null);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [email]);

  // Debounced check for Name availability
  useEffect(() => {
    if (!name.trim()) {
      setNameError(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await axios.get(`${getApiUrl()}/auth/check-availability?name=${encodeURIComponent(name.trim())}`);
        if (res.data?.available === false) {
          setNameError("Այս Անունը (Name) արդեն զբաղված է:");
        } else {
          setNameError(null);
        }
      } catch (err) {
        const users = getUsers();
        if (users.some((u) => u.displayName && u.displayName.toLowerCase() === name.trim().toLowerCase())) {
          setNameError("Այս Անունը (Name) արդեն զբաղված է:");
        } else {
          setNameError(null);
        }
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [name]);

  const handleGoogleClick = () => {
    window.location.href = `${getApiUrl()}/auth/google`;
  };

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!accountType) {
      setError("Please choose an account type.");
      return;
    }

    if (usernameError || emailError || nameError) {
      setError(usernameError || emailError || nameError || "Please fix input errors before submitting.");
      return;
    }

    if (!pwdMinLength || !pwdUpper || !pwdNumber || !pwdSymbol) {
      setError("Գաղտնաբառը չի համապատասխանում պահանջներին (առնվազն 8 նիշ, 1 մեծատառ, 1 թիվ և 1 սիմվոլ):");
      return;
    }

    if (password !== confirmPassword) {
      setError((t.auth as any).passwordsDoNotMatch || "⚠️ Գաղտնաբառերը չեն համընկնում:");
      return;
    }

    setLoading(true);

    try {
      const result = await register({
        username,
        displayName: name,
        email,
        password,
        accountType,
        inviteCode,
      });

      if (!result.success) {
        setError(result.error ?? "Unable to create your account.");
        return;
      }

      if (accountType === "business") {
        router.push("/register");
        return;
      }

      router.push("/verify-pending");
    } finally {
      setLoading(false);
    }
  };

  if (!accountType) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5 py-20">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-xl font-bold tracking-tight mb-1">{t.auth.createAccount}</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">{t.auth.chooseType}</p>
          </div>

          <div className="space-y-3">
            {/* Personal Account Option */}
            <button
              onClick={() => setAccountType("personal")}
              className="group w-full flex items-center gap-4 rounded-xl border border-[hsl(var(--border))] p-4 text-left transition-all hover:border-[hsl(var(--muted-foreground))]/30 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--foreground))] text-[hsl(var(--background))]">
                <User className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium">{t.auth.personal}</h3>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{t.auth.personalDesc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            {/* Business Account Option */}
            <button
              onClick={() => setAccountType("business")}
              className="group w-full flex items-center gap-4 rounded-xl border border-[hsl(var(--border))] p-4 text-left transition-all hover:border-[hsl(var(--muted-foreground))]/30 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--foreground))] text-[hsl(var(--background))]">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium">{t.auth.business}</h3>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{t.auth.businessDesc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
            {t.auth.haveAccount}{" "}
            <Link href="/signin" className="font-medium text-[hsl(var(--foreground))] hover:underline">
              {t.auth.login}
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-20">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-xl font-bold tracking-tight mb-1">
            {accountType === "business" ? t.auth.business : t.auth.personal}
          </h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{(t.auth as any).personalSetup || "Enter your details to get started"}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">{t.auth.username}</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              type="text"
              required
              className="w-full rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-sm outline-none transition-colors focus:border-[hsl(var(--foreground))]"
            />
            {usernameError && (
              <p className="text-xs text-red-500 mt-1">{usernameError}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t.auth.name}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              required
              className="w-full rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-sm outline-none transition-colors focus:border-[hsl(var(--foreground))]"
            />
            {nameError && (
              <p className="text-xs text-red-500 mt-1">{nameError}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t.auth.email}</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="w-full rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-sm outline-none transition-colors focus:border-[hsl(var(--foreground))]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t.auth.password}</label>
            <input
              id="signup-new-password"
              name="new-password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              minLength={8}
              pattern="(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':&quot;\\|,.<>\/?~`]).{8,}"
              title="Գաղտնաբառը պետք է լինի առնվազն 8 նիշ, պարունակի 1 մեծատառ, 1 թիվ և 1 սիմվոլ (!@#$%^&*)"
              className="w-full rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-sm outline-none transition-colors focus:border-[hsl(var(--foreground))]"
            />
            {/* Live Password Criteria Checklist */}
            {password.length > 0 && (
              <div className="mt-2 text-xs space-y-1 bg-[hsl(var(--card))]/60 p-2.5 rounded-xl border border-[hsl(var(--border))]">
                <div className={`flex items-center gap-1.5 transition-colors ${pwdMinLength ? "text-emerald-500 font-semibold" : "text-amber-500/80 font-normal"}`}>
                  <span>{pwdMinLength ? "✓" : "○"}</span>
                  <span>{(t.auth as any).pwdMinLength || "Առնվազն 8 նիշ"}</span>
                </div>
                <div className={`flex items-center gap-1.5 transition-colors ${pwdUpper ? "text-emerald-500 font-semibold" : "text-amber-500/80 font-normal"}`}>
                  <span>{pwdUpper ? "✓" : "○"}</span>
                  <span>{(t.auth as any).pwdUpper || "1 մեծատառ (A-Z)"}</span>
                </div>
                <div className={`flex items-center gap-1.5 transition-colors ${pwdNumber ? "text-emerald-500 font-semibold" : "text-amber-500/80 font-normal"}`}>
                  <span>{pwdNumber ? "✓" : "○"}</span>
                  <span>{(t.auth as any).pwdNumber || "1 թիվ (0-9)"}</span>
                </div>
                <div className={`flex items-center gap-1.5 transition-colors ${pwdSymbol ? "text-emerald-500 font-semibold" : "text-amber-500/80 font-normal"}`}>
                  <span>{pwdSymbol ? "✓" : "○"}</span>
                  <span>{(t.auth as any).pwdSymbol || "1 սիմվոլ (!@#$%^&*)"}</span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-sm font-medium mb-1">{(t.auth as any).confirmPassword || "Կրկնել գաղտնաբառը"}</label>
            <input
              id="signup-confirm-password"
              name="confirm-password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type="password"
              required
              placeholder="••••••••"
              className={`w-full rounded-lg border ${
                confirmPassword && confirmPassword !== password
                  ? "border-red-500 bg-red-500/5 focus:border-red-500"
                  : confirmPassword && confirmPassword === password
                  ? "border-emerald-500 bg-emerald-500/5 focus:border-emerald-500"
                  : "border-[hsl(var(--border))] focus:border-[hsl(var(--foreground))]"
              } px-3 py-2 text-sm outline-none transition-colors`}
            />
            {confirmPassword && confirmPassword !== password && (
              <p className="mt-1 text-[11px] text-red-500 font-medium">
                {(t.auth as any).passwordsDoNotMatch || "⚠️ Գաղտնաբառերը չեն համընկնում:"}
              </p>
            )}
            {confirmPassword && confirmPassword === password && (
              <p className="mt-1 text-[11px] text-emerald-500 font-medium">
                ✓ Գաղտնաբառերը համընկնում են:
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center justify-between">
              <span>{locale === 'hy' ? "Հրավերի Կոդ (Invite Code)" : "Invite Code (Optional)"}</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">+100 Coins</span>
            </label>
            <input
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              type="text"
              placeholder={t.auth.inviteCodePlaceholder}
              className="w-full rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-sm outline-none transition-colors focus:border-emerald-500 font-mono uppercase"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !!usernameError || !!nameError}
            className="w-full h-10 rounded-lg text-sm font-medium btn-primary mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "..." : accountType === "business" ? "Continue" : "Create account"}
          </button>
        </form>

        {accountType === "personal" && (
          <>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-[hsl(var(--border))]"></span></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-[hsl(var(--background))] px-2 text-[hsl(var(--muted-foreground))]">Or continue with</span></div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleGoogleClick}
                className="flex items-center justify-center gap-2 h-10 rounded-lg border border-[hsl(var(--border))] bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
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
          </>
        )}

        <button
          onClick={() => setAccountType(null)}
          className="flex items-center gap-1 mx-auto mt-4 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
        >
          <ChevronLeft className="h-3 w-3" /> Back
        </button>
      </div>
    </div>
  );
}
