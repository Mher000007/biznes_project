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
import { MOCK_BUSINESSES } from "@/data/mock-businesses";
import axios from "axios";
import { getApiUrl } from "@/lib/utils";
import { transliterateArmenian } from "@/lib/transliterate";

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
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const navigateToBusiness = (biz: any) => {
    const targetSlug = (biz.slug && String(biz.slug).trim()) || (biz._id && String(biz._id).trim()) || (biz.id && String(biz.id).trim());
    setIsSuggestionsOpen(false);
    setSelectedIndex(-1);
    setNavQuery("");
    if (targetSlug) {
      router.push(`/business/${targetSlug}`);
    }
  };

  // Debounced search suggestions fetch (API + Mock + LocalStorage)
  useEffect(() => {
    const fetchSuggestions = async () => {
      setLoadingSuggestions(true);
      const query = navQuery.trim().toLowerCase();

      try {
        let backendResults: any[] = [];
        try {
          const endpoint = query
            ? `${getApiUrl()}/businesses?search=${encodeURIComponent(navQuery.trim())}&limit=8`
            : `${getApiUrl()}/businesses?featured=true&limit=8`;

          const res = await axios.get(endpoint);
          backendResults = Array.isArray(res.data?.data)
            ? res.data.data
            : Array.isArray(res.data?.businesses)
              ? res.data.businesses
              : Array.isArray(res.data)
                ? res.data
                : [];
        } catch (err) {
          console.warn("Backend live search warning:", err);
        }

        const armQuery = transliterateArmenian(query, "hy").toLowerCase();
        const enQuery = transliterateArmenian(query, "en").toLowerCase();

        const matchesQuery = (text?: string) => {
          if (!text) return false;
          const lText = text.toLowerCase();
          return lText.includes(query) || lText.includes(armQuery) || lText.includes(enQuery);
        };

        // Search local mock businesses
        const matchedMock = query
          ? MOCK_BUSINESSES.filter((b) => {
              const nameMatch = matchesQuery(b.name);
              const catMatch = matchesQuery(b.category?.name) || matchesQuery(b.category?.slug);
              const cityMatch = matchesQuery(b.city);
              const descMatch = matchesQuery(b.description) || matchesQuery(b.shortDescription);
              const tagMatch = (b.tags || []).some((t) => matchesQuery(t));
              return nameMatch || catMatch || cityMatch || descMatch || tagMatch;
            })
          : MOCK_BUSINESSES.filter((b) => b.isFeatured);

        // Search localStorage custom business profiles
        let matchedLocalProfiles: any[] = [];
        if (typeof window !== "undefined") {
          const profilesStr = window.localStorage.getItem("armbiz-business-profiles");
          if (profilesStr) {
            try {
              const profiles = JSON.parse(profilesStr);
              matchedLocalProfiles = profiles
                .filter((p: any) => {
                  if (!p.isPublished || !p.businessName) return false;
                  if (!query) return true;
                  return matchesQuery(p.businessName) || matchesQuery(p.shortDesc) || matchesQuery(p.fullDesc) || matchesQuery(p.category) || matchesQuery(p.city);
                })
                .map((p: any) => {
                  const generatedSlug = p.businessName
                    ? p.businessName.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w\u0531-\u058F-]/g, "")
                    : "";
                  const validSlug = generatedSlug || `custom-${p.ownerUsername}`;
                  return {
                    _id: `custom-${p.ownerUsername}`,
                    slug: validSlug,
                    name: p.businessName,
                    city: p.city || "Yerevan",
                    category: { name: p.category || "Business" },
                    images: p.gallery || [],
                    logo: p.logo || "",
                    rating: p.ratingAvg || 5.0,
                    verified: true,
                  };
                });
            } catch (e) {
              console.error("Failed to parse local profiles for search", e);
            }
          }
        }

        // Normalize backend items
        const normalizedBackend = backendResults.map((b: any) => ({
          _id: b._id || b.id,
          slug: b.slug || b._id || b.id,
          name: b.name,
          city: b.city || "Yerevan",
          category: typeof b.category === "object" ? b.category : { name: b.category || "" },
          images: b.images || [],
          logo: b.logo || "",
          rating: b.rating || 0,
          verified: b.verified,
        }));

        // Normalize mock items
        const normalizedMock = matchedMock.map((b: any) => ({
          _id: b.id,
          slug: b.slug || b.id,
          name: b.name,
          city: b.city || "Yerevan",
          category: b.category || { name: "" },
          images: b.images || [],
          logo: b.logoUrl || "",
          rating: b.ratingAvg || 0,
          verified: b.isVerified,
        }));

        // Merge backend + mock + local storage, removing duplicates
        const combined = [...normalizedBackend, ...normalizedMock, ...matchedLocalProfiles];
        const uniqueList: any[] = [];
        const seenKeys = new Set<string>();

        for (const item of combined) {
          const key = (item.slug || item._id || item.name).toLowerCase().trim();
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            uniqueList.push(item);
          }
        }

        // Sort so exact or prefix name matches come first
        if (query) {
          uniqueList.sort((a, b) => {
            const aName = a.name.toLowerCase();
            const bName = b.name.toLowerCase();
            const aStartsWith = aName.startsWith(query);
            const bStartsWith = bName.startsWith(query);
            if (aStartsWith && !bStartsWith) return -1;
            if (!aStartsWith && bStartsWith) return 1;
            return 0;
          });
        }

        setSuggestions(uniqueList.slice(0, 7));
        setSelectedIndex(-1);
      } catch (err) {
        console.error("Error building search suggestions:", err);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, navQuery.trim() ? 150 : 0);
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
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      navigateToBusiness(suggestions[selectedIndex]);
      return;
    }
    setIsSuggestionsOpen(false);
    const params = new URLSearchParams();
    if (navQuery.trim()) params.append("q", navQuery.trim());
    if (navLocation) params.append("location", navLocation);
    router.push(`/discover?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSuggestionsOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Escape") {
      setIsSuggestionsOpen(false);
      setSelectedIndex(-1);
    }
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
              onChange={(e) => {
                setNavQuery(e.target.value);
                if (!isSuggestionsOpen) setIsSuggestionsOpen(true);
              }}
              onFocus={() => setIsSuggestionsOpen(true)}
              onKeyDown={handleKeyDown}
            />
            {navQuery && (
              <button
                type="button"
                onClick={() => {
                  setNavQuery("");
                  setSelectedIndex(-1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] p-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Live Search Suggestions Dropdown */}
            {isSuggestionsOpen && (
              <div className="absolute top-[calc(100%+8px)] left-0 w-[310px] sm:w-[380px] bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl shadow-2xl overflow-hidden z-[999] animate-in fade-in zoom-in-95 duration-150 max-h-[380px] overflow-y-auto custom-scrollbar">
                {loadingSuggestions ? (
                  <div className="p-4 text-xs text-center text-[hsl(var(--muted-foreground))] flex items-center justify-center gap-2">
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    Loading...
                  </div>
                ) : suggestions.length > 0 ? (
                  <div className="py-1">
                    <div className="px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))/25] flex items-center justify-between">
                      <span>{navQuery.trim() ? `Search Results (${suggestions.length})` : "⭐ Popular Businesses"}</span>
                      <span className="text-[9px] font-normal text-[hsl(var(--muted-foreground))] opacity-75">Use ↑↓ to navigate</span>
                    </div>
                    {suggestions.map((biz, idx) => {
                      const isSelected = idx === selectedIndex;
                      const imageUrl = (biz.images && biz.images[0]) || biz.logo;
                      const categoryName = typeof biz.category === "object" ? biz.category?.name : biz.category;

                      return (
                        <div
                          key={biz._id || biz.slug || idx}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            navigateToBusiness(biz);
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            navigateToBusiness(biz);
                          }}
                          className={`w-full px-3.5 py-2.5 flex items-center gap-3 transition-colors cursor-pointer border-b border-[hsl(var(--border))]/20 last:border-0 ${
                            isSelected ? "bg-primary/10 text-primary font-semibold" : "hover:bg-[hsl(var(--muted))/50]"
                          }`}
                        >
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={biz.name}
                              className="h-10 w-10 rounded-lg object-cover border border-[hsl(var(--border))] shrink-0 shadow-sm"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-sm font-black text-primary shrink-0">
                              {biz.name?.charAt(0)?.toUpperCase() || "B"}
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-[hsl(var(--foreground))] truncate flex items-center gap-1.5">
                              <span className="truncate">{biz.name}</span>
                              {biz.verified && (
                                <span className="text-blue-500 shrink-0 text-[11px]" title="Verified">
                                  ✓
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[hsl(var(--muted-foreground))] truncate flex items-center gap-1.5 mt-0.5">
                              <span>{biz.city || "Armenia"}</span>
                              {categoryName && (
                                <>
                                  <span className="opacity-40">•</span>
                                  <span className="font-medium">{categoryName}</span>
                                </>
                              )}
                            </div>
                          </div>

                          {biz.rating > 0 && (
                            <div className="flex items-center gap-1 shrink-0 text-amber-500 text-xs font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">
                              <span>★</span>
                              <span>{Number(biz.rating).toFixed(1)}</span>
                            </div>
                          )}
                        </div>
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
            className="hidden lg:inline-flex h-9 items-center justify-center rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 text-xs font-semibold text-[hsl(var(--foreground))] transition-all duration-200 hover:scale-105 hover:shadow-md cursor-pointer"
          >
            {t.nav.login}
          </Link>
        )}

        {/* {(!currentUser || currentUser.role !== "business_owner") && pathname !== "/register" && (
          <Link href="/register" className={styles.registerButton}>
            {t.nav.getStarted}
          </Link>
        )} */}

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

          {/* {(!currentUser || currentUser.role !== "business_owner") && pathname !== "/register" && (
            <div className="mt-3">
              <Link
                href="/register"
                onClick={() => setIsOpen(false)}
                className="h-10 flex items-center justify-center rounded-lg bg-black text-white text-sm font-medium w-full"
              >
                {t.nav.getStarted}
              </Link>
            </div>
          )} */}
        </div>
      )}
    </header>
  );
}
