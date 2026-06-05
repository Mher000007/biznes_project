"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import { useI18n } from "@/i18n";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { t } = useI18n();

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
      scrolled ? "glass-strong border-b border-[hsl(var(--border))]" : ""
    }`}>
      <nav className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="text-base font-bold tracking-tight">
            arm<span className="gradient-text">biz</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/discover" className="text-[13px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">{t.nav.discover}</Link>
            <Link href="/categories" className="text-[13px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">{t.nav.categories}</Link>
            <Link href="/about" className="text-[13px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">{t.nav.about}</Link>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>
            <ThemeToggle />
            {currentUser ? (
              <>
                <Link href="/dashboard" className="hidden sm:inline-flex text-[13px] font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors cursor-pointer">
                  Hi, {currentUser.displayName}
                </Link>
                <button
                  onClick={handleLogout}
                  className="hidden sm:inline-flex h-8 items-center rounded-lg px-3.5 text-[13px] font-medium border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link href="/signin" className="hidden sm:inline-flex text-[13px] font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
                {t.nav.login}
              </Link>
            )}
            <Link href="/register" className="hidden sm:inline-flex h-8 items-center rounded-lg px-3.5 text-[13px] font-medium btn-primary">{t.nav.getStarted}</Link>
            <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-1.5">
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden pb-4 animate-fade-in">
            <Link href="/discover" onClick={() => setIsOpen(false)} className="block py-2 text-sm text-[hsl(var(--muted-foreground))]">{t.nav.discover}</Link>
            <Link href="/categories" onClick={() => setIsOpen(false)} className="block py-2 text-sm text-[hsl(var(--muted-foreground))]">{t.nav.categories}</Link>
            <Link href="/about" onClick={() => setIsOpen(false)} className="block py-2 text-sm text-[hsl(var(--muted-foreground))]">{t.nav.about}</Link>
            
            <div className="py-2.5 my-2.5 border-y border-[hsl(var(--border))] flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                Language
              </span>
              <LanguageSwitcher />
            </div>

            {currentUser ? (
              <>
                <Link href="/dashboard" onClick={() => setIsOpen(false)} className="block py-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
                  Hi, {currentUser.displayName}
                </Link>
                <button onClick={() => { handleLogout(); }} className="block w-full text-left py-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
                  Sign out
                </button>
              </>
            ) : (
              <Link href="/signin" onClick={() => setIsOpen(false)} className="block py-2 text-sm text-[hsl(var(--muted-foreground))]">{t.nav.login}</Link>
            )}
            <div className="mt-3">
              <Link href="/register" onClick={() => setIsOpen(false)} className="h-8 flex items-center rounded-lg px-3.5 text-sm font-medium btn-primary">{t.nav.getStarted}</Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
