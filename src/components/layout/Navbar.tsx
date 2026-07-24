"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Search, MapPin, Bookmark } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import { useI18n } from "@/i18n";
import { useAuth } from "@/context/AuthContext";
import { LocationSelect } from "@/components/ui/LocationSelect";
import { MOCK_BUSINESSES } from "@/data/mock-businesses";
import axios from "axios";
import { getApiUrl } from "@/lib/utils";
import { transliterateArmenian } from "@/lib/transliterate";
import { FlyingBookmarkProvider } from "@/components/ui/FlyingBookmark";

// Force Next.js compilation reload: 2

import styles from "./Navbar.module.scss";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  const { t, locale } = useI18n();

  const [isOpen, setIsOpen] = useState(false);
  const [navQuery, setNavQuery] = useState("");
  const [navLocation, setNavLocation] = useState("");
  const [scrolled, setScrolled] = useState(false);

  // Favorites state for dropdown
  const [favorites, setFavorites] = useState<any[]>([]);

  useEffect(() => {
    const loadFavorites = () => {
      try {
        const itemsStr = localStorage.getItem("armbiz_favorites_items");
        if (itemsStr) {
          const map = JSON.parse(itemsStr);
          setFavorites(Object.values(map));
        } else {
          setFavorites([]);
        }
      } catch (e) {
        console.error("Failed to load favorites for navbar dropdown", e);
      }
    };

    loadFavorites();
    window.addEventListener("favoritesUpdated", loadFavorites);
    return () => window.removeEventListener("favoritesUpdated", loadFavorites);
  }, []);

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
            : `${getApiUrl()}/businesses?category=horeca&limit=8&sort=-rating`;

          const res = await axios.get(endpoint);
          backendResults = Array.isArray(res.data?.data)
            ? res.data.data
            : Array.isArray(res.data?.businesses)
              ? res.data.businesses
              : Array.isArray(res.data)
                ? res.data
                : [];
        } catch (err: any) {
          console.warn("Backend live search warning:", err?.message || err);
        }

        const armQuery = transliterateArmenian(query, "hy").toLowerCase();
        const enQuery = transliterateArmenian(query, "en").toLowerCase();

        const matchesQuery = (text?: string) => {
          if (!text) return false;
          const lText = text.toLowerCase();
          return lText.includes(query) || lText.includes(armQuery) || lText.includes(enQuery);
        };

        // Top Restaurants / HoReCa businesses for initial suggestions, or search matching
        const matchedMock = query
          ? MOCK_BUSINESSES.filter((b) => {
              const bName = b.name || "";
              const bCat = typeof b.category === "object" ? (b.category?.name || b.category?.slug || "") : (b.category || "");
              const bCity = b.city || "";
              const bDesc = b.description || b.shortDescription || "";
              const bTags = (b.tags || []).join(" ");
              return matchesQuery(bName) || matchesQuery(bCat) || matchesQuery(bCity) || matchesQuery(bDesc) || matchesQuery(bTags);
            })
          : MOCK_BUSINESSES.filter((b) => b.category?.slug === "horeca" || b.category?.id === "cat-horeca" || b.category?.name === "HoReCa")
              .sort((a, b) => (b.ratingAvg || 0) - (a.ratingAvg || 0) || (b.reviewCount || 0) - (a.reviewCount || 0));

        // Filter backend results if query is provided
        const filteredBackend = query
          ? backendResults.filter((b: any) => {
              const bName = b.name || "";
              const bCat = typeof b.category === "object" ? (b.category?.name || b.category?.slug || "") : (b.category || "");
              const bCity = b.city || "";
              const bDesc = b.description || b.shortDescription || "";
              const bTags = (b.tags || []).join(" ");
              return matchesQuery(bName) || matchesQuery(bCat) || matchesQuery(bCity) || matchesQuery(bDesc) || matchesQuery(bTags);
            })
          : backendResults;

        // Search localStorage custom business profiles ONLY when user types a query or matches category
        let matchedLocalProfiles: any[] = [];
        if (typeof window !== "undefined") {
          const profilesStr = window.localStorage.getItem("armbiz-business-profiles");
          if (profilesStr) {
            try {
              const profiles = JSON.parse(profilesStr);
              matchedLocalProfiles = profiles
                .filter((p: any) => {
                  if (!p.isPublished || !p.businessName) return false;
                  if (!query) {
                    // When empty query, only include if category is restaurant / horeca
                    const pCat = (p.category || "").toLowerCase();
                    return pCat.includes("horeca") || pCat.includes("restaurant") || pCat.includes("ռեստորան");
                  }
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
                    category: { name: p.category || "HoReCa" },
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
        const normalizedBackend = filteredBackend.map((b: any) => ({
          _id: b._id || b.id,
          slug: b.slug || b._id || b.id,
          name: b.name,
          city: b.city || "Yerevan",
          category: typeof b.category === "object" ? b.category : { name: b.category || "HoReCa" },
          images: b.images || [],
          logo: b.logo || b.logoUrl || "",
          rating: b.rating || b.ratingAvg || 0,
          verified: b.verified || b.isVerified,
        }));

        // Normalize mock items
        const normalizedMock = matchedMock.map((b: any) => ({
          _id: b.id,
          slug: b.slug || b.id,
          name: b.name,
          city: b.city || "Yerevan",
          category: b.category || { name: "HoReCa" },
          images: b.images || [],
          logo: b.logoUrl || "",
          rating: b.ratingAvg || 0,
          verified: b.isVerified,
        }));

        // Merge backend + Top Restaurants mock + matched local profiles
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
                    {locale === "hy" ? "Բեռնվում է..." : locale === "ru" ? "Загрузка..." : "Loading..."}
                  </div>
                ) : suggestions.length > 0 ? (
                  <div className="py-1">
                    <div className="px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))/25] flex items-center justify-between">
                      <span>
                        {navQuery.trim()
                          ? `${t.nav?.searchResults || "Search Results"} (${suggestions.length})`
                          : (t.nav?.popularBusinesses || "Popular Businesses")}
                      </span>
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
                          className={`w-full px-3.5 py-2.5 flex items-center gap-3 transition-colors cursor-pointer border-b border-[hsl(var(--border))]/20 last:border-0 ${isSelected ? "bg-primary/10 text-primary font-semibold" : "hover:bg-[hsl(var(--muted))/50]"
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
                    {t.nav?.noBusinessesFound || "No businesses found"} &quot;{navQuery}&quot;
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
        <div className="relative group/exchange flex items-center h-full">
          <Link
            href="/exchange"
            className={`${styles.navLink} ${(pathname as string) === "/exchange" ? styles.active : ""
              }`}
          >
            {t.nav.exchange || "Exchange"}
          </Link>
          
          {/* Exchange Coins Hover Popup */}
          {(pathname as string) !== "/exchange" && (
            <div className="absolute top-[120%] left-1/2 -translate-x-1/2 opacity-0 invisible group-hover/exchange:opacity-100 group-hover/exchange:visible group-hover/exchange:translate-y-0 translate-y-2 transition-all duration-300 z-50 pointer-events-none group-hover/exchange:pointer-events-auto">
              <div className="relative bg-[hsl(var(--background))]/90 backdrop-blur-xl px-3.5 py-1.5 rounded-xl border border-[hsl(var(--border))] shadow-xl whitespace-nowrap">
                {/* Little arrow pointing up */}
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[hsl(var(--background))]/90 border-t border-l border-[hsl(var(--border))] rotate-45 backdrop-blur-xl"></div>
                <h3 className="relative text-lg font-black text-[hsl(var(--foreground))] tracking-tight flex items-baseline gap-1">
                  0 <span className="text-emerald-500 text-[10px] font-extrabold uppercase tracking-[0.15em] drop-shadow-sm">Coins</span>
                </h3>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className={styles.navActions}>
        <div className="hidden lg:flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>

        {currentUser ? (
          <>
            <div className="relative group/fav flex items-center">
              <Link
                href="/dashboard"
                className={`hidden lg:inline-flex items-center gap-1.5 text-[13px] font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors cursor-pointer ${styles.authText}`}
              >
                <Bookmark id="navbar-bookmark-icon" className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                {t.nav.hello}{currentUser.name || currentUser.username}
              </Link>
              
              {/* Favorites Hover Dropdown */}
              <div className="absolute top-full right-0 pt-2 w-64 opacity-0 invisible group-hover/fav:opacity-100 group-hover/fav:visible transition-all duration-200 z-50 pointer-events-none group-hover/fav:pointer-events-auto">
                <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-lg p-2">
                  <div className="text-xs font-semibold text-[hsl(var(--muted-foreground))] px-2 py-1.5 mb-1 border-b border-[hsl(var(--border))]/50">
                    Saved Places
                  </div>
                  {favorites.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto scrollbar-thin flex flex-col gap-1">
                      {favorites.map((fav) => (
                        <Link
                          key={fav.id || fav.slug}
                          href={`/business/${fav.slug || fav.id}`}
                          className="flex items-center gap-2 p-2 hover:bg-[hsl(var(--muted))] rounded-lg transition-colors"
                        >
                          {(fav.logoUrl || fav.logo || fav.images?.[0]) ? (
                            <img src={fav.logoUrl || fav.logo || fav.images?.[0]} alt={fav.name} className="w-8 h-8 rounded bg-[hsl(var(--background))] object-cover shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {fav.name?.charAt(0) || "B"}
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium text-[hsl(var(--foreground))] truncate">{fav.name}</span>
                            <span className="text-[10px] text-[hsl(var(--muted-foreground))] truncate">{fav.category?.name || fav.category || "Place"}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-[hsl(var(--muted-foreground))]">
                      No saved places yet
                    </div>
                  )}
                </div>
              </div>
            </div>
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
            id="mobile-menu-btn"
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
          <Link
            href="/exchange"
            onClick={() => setIsOpen(false)}
            className={styles.navLink}
          >
            {t.nav.exchange || "Exchange"}
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
                className="flex items-center gap-1.5 py-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              >
                <Bookmark className="w-4 h-4 text-amber-500 fill-amber-500/20" />
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

      <FlyingBookmarkProvider />
    </header>
  );
}
