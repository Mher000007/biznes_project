"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, User, ArrowRight, ChevronLeft } from "lucide-react";
import { AccountType } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";

export default function SignUpPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!accountType) {
      setError("Please choose an account type.");
      return;
    }

    const result = await register({
      username,
      displayName: name,
      email,
      password,
      accountType,
    });

    if (!result.success) {
      setError(result.error ?? "Unable to create your account.");
      return;
    }

    if (accountType === "business") {
      router.push("/register");
      return;
    }

    router.push("/dashboard");
  };

  if (!accountType) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5 py-20">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <Link href="/" className="text-base font-bold tracking-tight mb-6 block">
              arm<span className="gradient-text">biz</span>
            </Link>
            <h1 className="text-xl font-bold tracking-tight mb-1">Create an account</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Choose how you want to use ArmBiz</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setAccountType("business")}
              className="group w-full flex items-center gap-4 rounded-xl border border-[hsl(var(--border))] p-4 text-left transition-all hover:border-[hsl(var(--muted-foreground))]/30 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--foreground))] text-[hsl(var(--background))]">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium">Business account</h3>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">List your business and manage bookings</p>
              </div>
              <ArrowRight className="h-4 w-4 text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
            Have an account? <Link href="/signin" className="font-medium text-[hsl(var(--foreground))] hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-20">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <Link href="/" className="text-base font-bold tracking-tight mb-6 block">
            arm<span className="gradient-text">biz</span>
          </Link>
          <div className="inline-flex items-center gap-1.5 rounded-md bg-[hsl(var(--muted))] px-2 py-1 text-xs mb-3">
            {accountType === "business" ? <Building2 className="h-3 w-3" /> : <User className="h-3 w-3" />}
            {accountType === "business" ? "Business" : "Personal"}
          </div>
          <h1 className="text-xl font-bold tracking-tight mb-1">Create your account</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {accountType === "business" ? "We'll set up your business profile next" : "Enter your details to get started"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              type="text"
              required
              className="w-full rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-sm outline-none transition-colors focus:border-[hsl(var(--foreground))]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              required
              className="w-full rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-sm outline-none transition-colors focus:border-[hsl(var(--foreground))]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="w-full rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-sm outline-none transition-colors focus:border-[hsl(var(--foreground))]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              minLength={8}
              className="w-full rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-sm outline-none transition-colors focus:border-[hsl(var(--foreground))]"
            />
          </div>
          <button type="submit" className="w-full h-10 rounded-lg text-sm font-medium btn-primary mt-1">
            {accountType === "business" ? "Continue" : "Create account"}
          </button>
        </form>

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
