"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Search, MapPin } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import { useI18n } from "@/i18n";
import { useAuth } from "@/context/AuthContext";
import { LocationSelect } from "@/components/ui/LocationSelect";
import axios from "axios";
import { getApiUrl } from "@/lib/utils";

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

  // Live search state
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounced search suggestions fetch
  useEffect(() => {
    const fetchSuggestions = async () => {
      setLoadingSuggestions(true);
      try {
        const endpoint = navQuery.trim()
          ? `${getApiUrl()}/businesses?search=${encodeURIComponent(navQuery.trim())}&limit=6`
          : `${getApiUrl()}/businesses?featured=true&limit=6`;

        const res = await axios.get(endpoint);
        const list = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data?.businesses)
          ? res.data.businesses
          : Array.isArray(res.data)
          ? res.data
          : [];
        setSuggestions(list);
      } catch (err) {
        console.error("Error fetching search suggestions:", err);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, navQuery.trim() ? 200 : 0);
    return () => clearTimeout(timer);
  }, [navQuery]);

  // Click outside listener to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setIsSuggestionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    setIsSuggestionsOpen(false);
    const params = new URLSearchParams();
    if (navQuery.trim()) params.append("q", navQuery.trim());
    if (navLocation) params.append("location", navLocation);
    router.push(`/discover?${params.toString()}`);
  };

  const isTransparent = pathname === "/" && !scrolled;

  return (
    <header className={`${styles.header} ${isTransparent ? styles.transparentHeader : ""}`}>
      {/* Logo */}
      <Link
        href="/"
        onClick={(e) => {
          e.preventDefault();
          router.push("/");
        }}
        className={styles.logo}
      >
        <img src="/logo.png" alt="Findy Logo" className={styles.logoImage} />
      </Link>

      {/* Search Form (always visible) */}
      <form onSubmit={handleNavSearch} className={styles.searchForm}>
        <div className={styles.searchGroup}>
          <div className={`${styles.inputWrapper} relative`} ref={suggestionsRef}>
            <Search className={styles.inputIcon} />
            <input
              type="text"
              placeholder={t.nav.serviceOrBusiness}
              className={styles.inputField}
              value={navQuery}
              onChange={(e) => setNavQuery(e.target.value)}
              onFocus={() => setIsSuggestionsOpen(true)}
            />
            {navQuery && (
              <button
                type="button"
                onClick={() => {
                  setNavQuery("");
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] p-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Live Search Suggestions Dropdown */}
            {isSuggestionsOpen && (
              <div className="absolute top-[calc(100%+6px)] left-0 w-[300px] sm:w-[360px] bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl shadow-2xl overflow-hidden z-[999] animate-in fade-in zoom-in-95 duration-150 max-h-[360px] overflow-y-auto custom-scrollbar">
                {loadingSuggestions ? (
                  <div className="p-4 text-xs text-center text-[hsl(var(--muted-foreground))] flex items-center justify-center gap-2">
                    <span className="h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    Loading...
                  </div>
                ) : suggestions.length > 0 ? (
                  <div className="py-1">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))/20]">
                      {navQuery.trim() ? `Search Results (${suggestions.length})` : "⭐ Popular Businesses"}
                    </div>
                    {suggestions.map((biz) => {
                      const targetSlug = biz.slug || biz._id;
                      return (
                        <Link
                          key={biz._id}
                          href={`/business/${targetSlug}`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setIsSuggestionsOpen(false);
                            setNavQuery("");
                            router.push(`/business/${targetSlug}`);
                          }}
                          className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-[hsl(var(--muted))/50] text-left transition-colors cursor-pointer border-b border-[hsl(var(--border))]/30 last:border-0"
                        >
                          {biz.images && biz.images[0] ? (
                            <img
                              src={biz.images[0]}
                              alt={biz.name}
                              className="h-9 w-9 rounded-md object-cover border border-[hsl(var(--border))] shrink-0"
                            />
                          ) : (
                            <div className="h-9 w-9 rounded-md bg-[hsl(var(--muted))] flex items-center justify-center text-xs font-bold text-[hsl(var(--muted-foreground))] shrink-0">
                              {biz.name?.charAt(0) || "B"}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-[hsl(var(--foreground))] truncate">
                              {biz.name}
                            </div>
                            <div className="text-[11px] text-[hsl(var(--muted-foreground))] truncate flex items-center gap-1.5">
                              <span>{biz.city || "Armenia"}</span>
                              {biz.category && typeof biz.category === "object" && (biz.category as any).name && (
                                <>
                                  <span>•</span>
                                  <span>{(biz.category as any).name}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 text-xs text-center text-[hsl(var(--muted-foreground))]">
                    No businesses found for &quot;{navQuery}&quot;
                  </div>
                )}
              </div>
            )}
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
