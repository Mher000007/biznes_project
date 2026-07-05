"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Search, MapPin } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import { useI18n } from "@/i18n";
import { useAuth } from "@/context/AuthContext";
import { LocationSelect } from "@/components/ui/LocationSelect";

import styles from "./Navbar.module.scss";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  const { t } = useI18n();

  const [isOpen, setIsOpen] = useState(false);
  const [navQuery, setNavQuery] = useState("");
  const [navLocation, setNavLocation] = useState("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (pathname.startsWith("/admin-secure")) {
    return null;
  }

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  const handleNavSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (navQuery.trim()) params.append("q", navQuery.trim());
    if (navLocation) params.append("location", navLocation);
    router.push(`/discover?${params.toString()}`);
  };

  const isTransparent = pathname === "/" && !scrolled;

  return (
    <header className={`${styles.header} ${isTransparent ? styles.transparentHeader : ""}`}>
      {/* Logo */}
      <Link href="/" className={styles.logo}>
        <img src="/logo.png" alt="Findy Logo" className={styles.logoImage} />
      </Link>

      {/* Search Form (always visible) */}
      <form onSubmit={handleNavSearch} className={styles.searchForm}>
        <div className={styles.searchGroup}>
          <div className={styles.inputWrapper}>
            <Search className={styles.inputIcon} />
            <input
              type="text"
              placeholder={t.nav.serviceOrBusiness}
              className={styles.inputField}
              value={navQuery}
              onChange={(e) => setNavQuery(e.target.value)}
            />
          </div>
          <div className={styles.divider}></div>
          <div className={styles.inputWrapper}>
            <MapPin className={styles.inputIcon} />
            <LocationSelect
              className={styles.selectField}
              value={navLocation}
              onChange={(e) => setNavLocation(e.target.value)}
              placeholder={t.nav.allLocations}
              disablePlaceholder={false}
            />
          </div>
        </div>
        <button type="submit" className={styles.searchButton}>
          {t.nav?.searchButton || "Search"}
        </button>
      </form>

      <div className={styles.links}>
        <Link
          href="/"
          className={`${styles.navLink} ${(pathname as string) === "/" ? styles.active : ""
            }`}
        >
          {t.nav.home}
        </Link>
        <Link
          href="/discover"
          className={`${styles.navLink} ${(pathname as string) === "/discover" ? styles.active : ""
            }`}
        >
          {t.nav.discover}
        </Link>
        {/* <Link
          href="/categories"
          className={`${styles.navLink} ${
            (pathname as string) === "/categories" ? styles.active : ""
          }`}
        >
          {t.nav.categories}
        </Link> */}
        <Link
          href="/about"
          className={`${styles.navLink} ${(pathname as string) === "/about" ? styles.active : ""
            }`}
        >
          {t.nav.about}
        </Link>
      </div>

      {/* Actions */}
      <div className={styles.navActions}>

        <div className="hidden lg:flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>

        {currentUser ? (
          <>

            <Link
              href="/dashboard"
              className={`hidden lg:inline-flex text-[13px] font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors cursor-pointer ${styles.authText}`}
            >
              {t.nav.hello}{currentUser.name || currentUser.username}
            </Link>
            <button
              onClick={handleLogout}
              className={`hidden lg:inline-flex h-9 items-center rounded-lg px-4 text-[13px] font-medium border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors cursor-pointer ${styles.authButton}`}
            >
              {t.nav.signOut}
            </button>
          </>
        ) : (
          <Link
            href="/signin"
            className="hidden lg:inline-flex text-[13px] font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
          >
            {t.nav.login}
          </Link>
        )}

        {(!currentUser || currentUser.role !== "business_owner") && pathname !== "/register" && (
          <Link href="/register" className={styles.registerButton}>
            {t.nav.getStarted}
          </Link>
        )}

        {/* Mobile controls */}
        <div className={styles.mobileControls}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={styles.iconButton}
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div className={styles.mobileMenu}>
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className={`${styles.navLink} ${pathname === "/" ? styles.active : ""
              }`}
          >
            {t.nav.home}
          </Link>
          <Link
            href="/discover"
            onClick={() => setIsOpen(false)}
            className={styles.navLink}
          >
            {t.nav.discover}
          </Link>
          {/* <Link
              href="/categories"
              onClick={() => setIsOpen(false)}
              className={styles.navLink}
            >
              {t.nav.categories}
            </Link> */}
          <Link
            href="/about"
            onClick={() => setIsOpen(false)}
            className={styles.navLink}
          >
            {t.nav.about}
          </Link>

          <div className="py-2.5 my-2 border-y border-[hsl(var(--border))] flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
              Settings
            </span>
            <div className="flex gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>

          {currentUser ? (
            <>
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="block py-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              >
                Hi, {currentUser.name || currentUser.username}
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                }}
                className="block w-full text-left py-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/signin"
              onClick={() => setIsOpen(false)}
              className="block py-2 text-sm text-[hsl(var(--muted-foreground))]"
            >
              {t.nav.login}
            </Link>
          )}

          {(!currentUser || currentUser.role !== "business_owner") && pathname !== "/register" && (
            <div className="mt-3">
              <Link
                href="/register"
                onClick={() => setIsOpen(false)}
                className="h-10 flex items-center justify-center rounded-lg bg-black text-white text-sm font-medium w-full"
              >
                {t.nav.getStarted}
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

