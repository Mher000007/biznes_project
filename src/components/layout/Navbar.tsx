"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Search, Bookmark, ArrowUp, ArrowDown, LogOut, ArrowRight, User } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import { useI18n } from "@/i18n";
import { useAuth } from "@/context/AuthContext";
import { MOCK_BUSINESSES } from "@/data/mock-businesses";
import axios from "axios";
import { getApiUrl } from "@/lib/utils";
import { transliterateArmenian } from "@/lib/transliterate";
import { FlyingBookmarkProvider } from "@/components/ui/FlyingBookmark";

import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import styles from "./Navbar.module.scss";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  const { t, locale } = useI18n();

  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [navQuery, setNavQuery] = useState("");
  const [navLocation, setNavLocation] = useState("");
  const [scrolled, setScrolled] = useState(false);

  // Favorites state for dropdown
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isFavOpen, setIsFavOpen] = useState(false);
  const [isStoryViewerOpen, setIsStoryViewerOpen] = useState(false);

  // Live search state
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const resolveBusinessLogo = (item: any): string => {
    if (!item) return "";
    const direct =
      item.logoUrl ||
      item.logo ||
      (Array.isArray(item.images) ? item.images[0] : typeof item.images === "string" ? item.images : "") ||
      (Array.isArray(item.gallery) ? item.gallery[0] : typeof item.gallery === "string" ? item.gallery : "") ||
      item.coverImageUrl ||
      item.coverUrl ||
      (Array.isArray(item.metadata?.coverUrl) ? item.metadata.coverUrl[0] : item.metadata?.coverUrl) ||
      item.image ||
      item.avatar ||
      "";
    if (direct && typeof direct === "string" && direct.trim().length > 0) {
      return direct.trim();
    }

    const itemKey = item.id || item.slug || "";
    const itemName = (item.name || item.businessName || "").toLowerCase().trim();

    const mockMatch = MOCK_BUSINESSES.find(
      (b) =>
        (itemKey && (b.id === itemKey || b.slug === itemKey)) ||
        (itemName && b.name && b.name.toLowerCase().trim() === itemName)
    );
    if (mockMatch) {
      const mockLogo =
        mockMatch.logo ||
        mockMatch.logoUrl ||
        (Array.isArray(mockMatch.images) ? mockMatch.images[0] : "") ||
        mockMatch.coverImageUrl ||
        "";
      if (mockLogo) return mockLogo;
    }

    if (typeof localStorage !== "undefined") {
      const profilesStr = localStorage.getItem("armbiz-business-profiles");
      if (profilesStr) {
        try {
          const profiles: any[] = JSON.parse(profilesStr);
          const found = profiles.find((p: any) => {
            if (!p) return false;
            const pName = (p.businessName || p.name || "").toLowerCase().trim();
            const pSlug = pName.replace(/\s+/g, "-").replace(/[^\w\u0531-\u058F-]/g, "");
            return (
              (itemKey && (p.id === itemKey || p.slug === itemKey || p.ownerUsername === itemKey || `custom-${p.ownerUsername}` === itemKey || pSlug === itemKey)) ||
              (itemName && pName && pName === itemName)
            );
          });
          if (found) {
            const profileLogo =
              found.logo ||
              found.logoUrl ||
              (Array.isArray(found.images) ? found.images[0] : "") ||
              (Array.isArray(found.gallery) ? found.gallery[0] : "") ||
              found.coverUrl ||
              found.coverImageUrl ||
              (Array.isArray(found.metadata?.coverUrl) ? found.metadata.coverUrl[0] : found.metadata?.coverUrl) ||
              found.image ||
              found.avatar ||
              "";
            if (profileLogo) return profileLogo;
          }
        } catch (e) { }
      }
    }
    return "";
  };

  useEffect(() => {
    const loadFavorites = () => {
      try {
        if (!currentUser) {
          setFavorites([]);
          return;
        }
        const uKey = currentUser.username || currentUser.email || (currentUser as any).id || (currentUser as any)._id || "";
        const favStr = uKey ? localStorage.getItem(`armbiz_favorites_${uKey}`) : null;
        const itemsStr = uKey ? localStorage.getItem(`armbiz_favorites_items_${uKey}`) : null;

        const favIds: string[] = favStr ? JSON.parse(favStr) : [];
        const itemsMap: Record<string, any> = itemsStr ? JSON.parse(itemsStr) : {};

        const list: any[] = [];
        const seen = new Set<string>();

        // 1. Process items from itemsMap
        Object.entries(itemsMap).forEach(([k, item]) => {
          if (!item) return;
          const itemKey = item.id || item.slug || k;
          if (!seen.has(itemKey)) {
            const logo = resolveBusinessLogo(item);
            list.push({ ...item, logoUrl: logo, logo: logo });
            seen.add(itemKey);
            if (item.id) seen.add(String(item.id));
            if (item.slug) seen.add(String(item.slug));
          }
        });

        // 2. Process items from favIds
        for (const key of favIds) {
          if (seen.has(key)) continue;

          const mockMatch = MOCK_BUSINESSES.find(b => b.id === key || b.slug === key);
          if (mockMatch) {
            const logo = resolveBusinessLogo(mockMatch);
            list.push({ ...mockMatch, logoUrl: logo, logo: logo });
            seen.add(key);
            if (mockMatch.id) seen.add(String(mockMatch.id));
            if (mockMatch.slug) seen.add(String(mockMatch.slug));
            continue;
          }

          const profilesStr = localStorage.getItem("armbiz-business-profiles");
          if (profilesStr) {
            try {
              const profiles: any[] = JSON.parse(profilesStr);
              const found = profiles.find((p: any) =>
                p.id === key ||
                p.slug === key ||
                p.ownerUsername === key ||
                `custom-${p.ownerUsername}` === key ||
                (p.businessName && p.businessName.toLowerCase().trim().replace(/\s+/g, "-") === key)
              );
              if (found) {
                const logo = resolveBusinessLogo(found);
                list.push({
                  ...found,
                  name: found.businessName || found.name,
                  slug: found.businessName ? found.businessName.toLowerCase().trim().replace(/\s+/g, "-") : key,
                  logoUrl: logo,
                  logo: logo
                });
                seen.add(key);
                if (found.id) seen.add(String(found.id));
                if (found.slug) seen.add(String(found.slug));
              }
            } catch (e) { }
          }
        }

        setFavorites(list);
      } catch (e) {
        console.error("Failed to load favorites for navbar dropdown", e);
        setFavorites([]);
      }
    };

    loadFavorites();
    window.addEventListener("favoritesUpdated", loadFavorites);
    window.addEventListener("storage", loadFavorites);
    return () => {
      window.removeEventListener("favoritesUpdated", loadFavorites);
      window.removeEventListener("storage", loadFavorites);
    };
  }, [currentUser]);

  const navigateToBusiness = (biz: any) => {
    const targetSlug = (biz.slug && String(biz.slug).trim()) || (biz._id && String(biz._id).trim()) || (biz.id && String(biz.id).trim());
    setIsSuggestionsOpen(false);
    setIsSearchOpen(false);
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

  // Click outside listener to close search / suggestions
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

    const handleStoryViewerOpened = () => setIsStoryViewerOpen(true);
    const handleStoryViewerClosed = () => setIsStoryViewerOpen(false);
    window.addEventListener("story-viewer-opened", handleStoryViewerOpened);
    window.addEventListener("story-viewer-closed", handleStoryViewerClosed);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("story-viewer-opened", handleStoryViewerOpened);
      window.removeEventListener("story-viewer-closed", handleStoryViewerClosed);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

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
      setIsSearchOpen(false);
      return;
    }
    setIsSuggestionsOpen(false);
    setIsSearchOpen(false);
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
      setIsSearchOpen(false);
      setSelectedIndex(-1);
    }
  };

  const isBusinessUser = currentUser?.role === "business_owner" || currentUser?.accountType === "business";

  const isChatOpen = useSelector((state: RootState) => state.chat.isOpen);
  const dimNavbarPages = ["/", "/discover", "/about", "/exchange"];
  const isDimmed = isChatOpen && dimNavbarPages.some(page => page === "/" ? pathname === "/" : pathname.startsWith(page));

  return (
    <>
      <div
        className={`klcqGG_inner ${styles.inner} ${isDimmed ? styles.dimmed : ""}`}
        data-open={isOpen ? "true" : "false"}
        data-expanded={isSearchOpen ? "true" : "false"}
        style={{ display: isStoryViewerOpen ? "none" : undefined }}
      >
        {/* Layered Liquid-Glass Pill Background */}
        <div className={`klcqGG_glass ${styles.glass}`} aria-hidden="true">
          <div className={`klcqGG_glassEffect ${styles.glassEffect}`} aria-hidden="true" />
          <div className={`klcqGG_glassTint ${styles.glassTint}`} aria-hidden="true" />
          <div className={`klcqGG_glassShine ${styles.glassShine}`} aria-hidden="true" />
        </div>

        {/* SVG liquid-glass distortion filter (used by .glassEffect) */}
        <svg
          aria-hidden="true"
          width="0"
          height="0"
          style={{ position: "absolute", width: 0, height: 0, overflow: "hidden", pointerEvents: "none" }}
        >
          <filter
            id="glass-distortion"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            filterUnits="objectBoundingBox"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0 0.008"
              numOctaves={1}
              seed={5}
              result="turbulence"
            />
            <feComponentTransfer in="turbulence" result="mapped">
              <feFuncR type="linear" slope={0} intercept={0.5} />
              <feFuncG type="gamma" amplitude={2} exponent={1} offset={-0.5} />
              <feFuncB type="linear" slope={0} intercept={0.5} />
            </feComponentTransfer>
            <feGaussianBlur in="mapped" stdDeviation={3} result="softMap" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="softMap"
              scale={60}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </svg>

        {/* Glass Content */}
        <div className={`klcqGG_glassContent ${styles.glassContent}`}>
          {/* Top Row: Logo | Nav Links | Actions */}
          <div className={`klcqGG_topRow ${styles.topRow}`}>
            {/* Logo */}
            <Link
              href="/"
              onClick={(e) => {
                e.preventDefault();
                router.push("/");
              }}
              className={`klcqGG_logo ${styles.logo}`}
              aria-label="Treeo — home"
            >
              <div role="img" aria-label="Treeo Logo" className={styles.logoImage} />
            </Link>

            {/* Desktop Navigation List */}
            <ul className={`F6duVW_list ${styles.navList}`} role="list" aria-label="Main navigation">
              <li className={`F6duVW_navItem ${styles.navItem}`}>
                <Link
                  href="/"
                  className={`F6duVW_navLink ${styles.navLink} ${pathname === "/" ? styles.active : ""}`}
                >
                  {t.nav.home}
                </Link>
              </li>
              <li className={`F6duVW_navItem ${styles.navItem}`}>
                <Link
                  href="/discover"
                  className={`F6duVW_navLink ${styles.navLink} ${pathname === "/discover" ? styles.active : ""}`}
                >
                  {t.nav.discover}
                </Link>
              </li>
              <li className={`F6duVW_navItem ${styles.navItem}`}>
                <Link
                  href="/about"
                  className={`F6duVW_navLink ${styles.navLink} ${pathname === "/about" ? styles.active : ""}`}
                >
                  {t.nav.about}
                </Link>
              </li>
              <li className={`F6duVW_navItem ${styles.navItem}`}>
                <Link
                  href="/about#faq"
                  className={`F6duVW_navLink ${styles.navLink}`}
                >
                  FAQ
                </Link>
              </li>
              <li className={`F6duVW_navItem ${styles.navItem} relative group/exchange flex items-center h-full`}>
                <Link
                  href="/exchange"
                  className={`F6duVW_navLink ${styles.navLink} ${pathname === "/exchange" ? styles.active : ""} flex items-center`}
                >
                  {t.nav.exchange || "Exchange"}
                  <div className="flex items-center overflow-hidden transition-all duration-300 max-w-0 opacity-0 group-hover/exchange:max-w-[24px] group-hover/exchange:opacity-100 group-hover/exchange:ml-1">
                    <ArrowUp className="w-3.5 h-3.5 text-emerald-500 -mr-1 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <ArrowDown className="w-3.5 h-3.5 text-emerald-500 animate-bounce" style={{ animationDelay: '500ms' }} />
                  </div>
                </Link>

                {/* Exchange Coins Hover Popup */}
                {pathname !== "/exchange" && Boolean(currentUser) && !isBusinessUser && (
                  <div className="absolute top-[120%] left-1/2 -translate-x-1/2 opacity-0 invisible group-hover/exchange:opacity-100 group-hover/exchange:visible group-hover/exchange:translate-y-0 translate-y-2 transition-all duration-300 z-50 pointer-events-none group-hover/exchange:pointer-events-auto">
                    <div className="relative bg-[hsl(var(--background))]/95 backdrop-blur-xl px-3.5 py-1.5 rounded-xl border border-[hsl(var(--border))] shadow-xl whitespace-nowrap">
                      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[hsl(var(--background))]/95 border-t border-l border-[hsl(var(--border))] rotate-45 backdrop-blur-xl" />
                      <h3 className="relative text-lg font-black text-[hsl(var(--foreground))] tracking-tight flex items-baseline gap-1">
                        {(() => {
                          const uKey = currentUser?.username || currentUser?.email || (currentUser as any)?.id || "";
                          const savedCoins = uKey && typeof localStorage !== "undefined" ? localStorage.getItem(`armbiz_user_coins_${uKey}`) : null;
                          if (savedCoins !== null && !isNaN(Number(savedCoins))) return Number(savedCoins);
                          return (currentUser as any)?.treeoCoins || 0;
                        })()} <span className="text-emerald-500 text-[10px] font-extrabold uppercase tracking-[0.15em] drop-shadow-sm">Coins</span>
                      </h3>
                    </div>
                  </div>
                )}
              </li>
            </ul>

            {/* Actions Section: Search Toggle | Language Switcher | Theme Toggle | CTA Buttons / Auth | Mobile Menu */}
            <div className={`klcqGG_actions ${styles.actions}`}>
              {/* Search Toggle Button */}
              <button
                type="button"
                className={`klcqGG_searchToggle ${styles.searchToggle}`}
                data-open={isSearchOpen ? "true" : "false"}
                aria-label="Search"
                aria-expanded={isSearchOpen}
                aria-controls="header-search-panel"
                onClick={() => {
                  setIsSearchOpen((prev) => {
                    const next = !prev;
                    if (next) {
                      setTimeout(() => searchInputRef.current?.focus(), 80);
                    }
                    return next;
                  });
                }}
              >
                {isSearchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
              </button>

              {/* Language Switcher & Theme Toggle */}
              <div className="hidden lg:flex items-center gap-1.5">
                <LanguageSwitcher />
                <ThemeToggle />
              </div>

              {/* Auth / Profile & CTA */}
              {currentUser ? (
                <div className="flex items-center gap-2">
                  <div
                    className={`relative ${isBusinessUser ? '' : 'group/fav'} flex items-center`}
                    onMouseEnter={() => setIsFavOpen(true)}
                    onMouseLeave={() => setIsFavOpen(false)}
                  >
                    <Link
                      href={isBusinessUser ? "/dashboard" : "/profile"}
                      className={styles.userProfilePill}
                    >
                      {!isBusinessUser && (
                        <Bookmark id="navbar-bookmark-icon" className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20 shrink-0" />
                      )}
                      <User className="w-4 h-4 shrink-0" />
                      <span className="truncate max-w-[120px]">
                        {currentUser.name || currentUser.username}
                      </span>
                    </Link>

                    {/* Favorites Hover Dropdown */}
                    {!isBusinessUser && (
                      <div
                        className={`hidden xl:block absolute top-full right-0 pt-2 w-72 transition-all duration-200 z-50 ${isFavOpen
                          ? "opacity-100 visible pointer-events-auto"
                          : "opacity-0 invisible pointer-events-none group-hover/fav:opacity-100 group-hover/fav:visible group-hover/fav:pointer-events-auto"
                          }`}
                      >
                        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/95 backdrop-blur-xl shadow-2xl p-2.5">
                          <div className="text-xs font-semibold text-[hsl(var(--muted-foreground))] px-2 py-1.5 mb-1 border-b border-[hsl(var(--border))]/50 flex items-center justify-between">
                            <span>{locale === 'hy' ? "Պահպանված Վայրեր" : locale === 'ru' ? "Сохраненные места" : "Saved Places"}</span>
                            <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-1.5 py-0.5 rounded-full">{favorites.length}</span>
                          </div>
                          {favorites.length > 0 ? (
                            <>
                              <div className="max-h-60 overflow-y-auto scrollbar-thin flex flex-col gap-1">
                                {favorites.map((fav) => {
                                  const logo = resolveBusinessLogo(fav);
                                  return (
                                    <Link
                                      key={fav.id || fav.slug}
                                      href={`/business/${fav.slug || fav.id}`}
                                      className="flex items-center gap-2 p-2 hover:bg-[hsl(var(--muted))] rounded-lg transition-colors"
                                    >
                                      {logo ? (
                                        <img src={logo} alt={fav.name} className="w-8 h-8 rounded bg-[hsl(var(--background))] object-cover shrink-0" />
                                      ) : (
                                        <div className="w-8 h-8 rounded bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                          {fav.name?.charAt(0)?.toUpperCase() || "B"}
                                        </div>
                                      )}
                                      <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-medium text-[hsl(var(--foreground))] truncate">{fav.name}</span>
                                        <span className="text-[10px] text-[hsl(var(--muted-foreground))] truncate">{typeof fav.category === "object" ? fav.category?.name : fav.category || "Place"}</span>
                                      </div>
                                    </Link>
                                  );
                                })}
                              </div>
                              <div className="pt-2 border-t border-[hsl(var(--border))]/50 mt-1">
                                <Link
                                  href="/profile?tab=favorites"
                                  className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline px-2 py-1"
                                >
                                  <span>{locale === 'hy' ? "Տեսնել բոլորը" : locale === 'ru' ? "Посмотреть все" : "View all saved"}</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            </>
                          ) : (
                            <div className="p-4 text-center text-xs text-[hsl(var(--muted-foreground))]">
                              {locale === 'hy' ? "Դեռ չկան պահպանված վայրեր" : locale === 'ru' ? "Пока нет сохраненных мест" : "No saved places yet"}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={() => {
                      logout();
                      router.push("/");
                    }}
                    title="Ելք (Log out)"
                    aria-label="Log Out"
                    className={styles.logoutButton}
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="hidden lg:flex items-center gap-2">
                  <Link
                    href="/signin"
                    className={`VLzsWq_button klcqGG_aiCloudCta ${styles.buttonCta}`}
                    data-variant="primary"
                    data-size="md"
                  >
                    {t.nav.login}
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                id="mobile-menu-btn"
                type="button"
                className={`klcqGG_menuButton ${styles.menuButton}`}
                aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={isOpen}
                aria-controls="mobile-menu"
                onClick={() => setIsOpen(!isOpen)}
              >
                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Expandable Search Panel (Eleveight style slide-down search bar) */}
          {isSearchOpen && (
            <div id="header-search-panel" className={styles.searchPanel} ref={suggestionsRef}>
              <form onSubmit={handleNavSearch} className={styles.searchForm}>
                <div className={styles.searchInputWrapper}>
                  <Search className={styles.searchIcon} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder={t.nav.serviceOrBusiness}
                    className={styles.searchInput}
                    value={navQuery}
                    onChange={(e) => {
                      setNavQuery(e.target.value);
                      if (!isSuggestionsOpen) setIsSuggestionsOpen(true);
                    }}
                    onFocus={() => setIsSuggestionsOpen(true)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                  />
                  {navQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setNavQuery("");
                        setSelectedIndex(-1);
                        searchInputRef.current?.focus();
                      }}
                      className={styles.clearSearchBtn}
                      aria-label="Clear search"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Suggestions Dropdown */}
                {isSuggestionsOpen && (
                  <div className={styles.suggestionsDropdown}>
                    {loadingSuggestions ? (
                      <div className="p-4 text-xs text-center text-[hsl(var(--muted-foreground))] flex items-center justify-center gap-2">
                        <span className="h-3.5 w-3.5 rounded-full border-2 border-[#00C853] border-t-transparent animate-spin" />
                        {locale === "hy" ? "Բեռնվում է..." : locale === "ru" ? "Загрузка..." : "Loading..."}
                      </div>
                    ) : suggestions.length > 0 ? (
                      <div className="py-1.5">
                        <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))] bg-black/5 dark:bg-white/5 flex items-center justify-between">
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
                              className={`w-full px-4 py-2.5 flex items-center gap-3 transition-colors cursor-pointer border-b border-black/5 dark:border-white/5 last:border-0 ${isSelected ? "bg-[#00C853]/10 text-[#00C853] font-semibold" : "hover:bg-black/5 dark:hover:bg-white/5"
                                }`}
                            >
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={biz.name}
                                  className="h-10 w-10 rounded-lg object-cover border border-black/10 dark:border-white/10 shrink-0 shadow-sm"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#00C853]/20 to-[#00C853]/5 border border-[#00C853]/20 flex items-center justify-center text-sm font-black text-[#00C853] shrink-0">
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
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div id="mobile-menu" className={styles.mobileMenu}>
          <button
            onClick={() => setIsOpen(false)}
            className={styles.mobileMenuClose}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>

          <div className={styles.mobileLinks}>
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className={`${styles.mobileNavLink} ${pathname === "/" ? styles.active : ""}`}
            >
              {t.nav.home}
            </Link>
            <Link
              href="/discover"
              onClick={() => setIsOpen(false)}
              className={`${styles.mobileNavLink} ${pathname === "/discover" ? styles.active : ""}`}
            >
              {t.nav.discover}
            </Link>
            <Link
              href="/about"
              onClick={() => setIsOpen(false)}
              className={`${styles.mobileNavLink} ${pathname === "/about" ? styles.active : ""}`}
            >
              {t.nav.about}
            </Link>
            <Link
              href="/about#faq"
              onClick={() => setIsOpen(false)}
              className={styles.mobileNavLink}
            >
              FAQ
            </Link>
            <Link
              href="/exchange"
              onClick={() => setIsOpen(false)}
              className={`${styles.mobileNavLink} ${pathname === "/exchange" ? styles.active : ""}`}
            >
              {t.nav.exchange || "Exchange"}
            </Link>
          </div>

          <div className="py-4 my-4 border-y border-black/10 dark:border-white/10 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              {locale === "hy" ? "Կարգավորումներ" : locale === "ru" ? "Настройки" : "Settings"}
            </span>
            <div className="flex gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>

          {currentUser ? (
            <div className="flex flex-col gap-2">
              <Link
                href={isBusinessUser ? "/dashboard" : "/profile"}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 p-3 rounded-xl bg-black/5 dark:bg-white/5 font-semibold text-sm"
              >
                <User className="w-4 h-4" />
                <span>{currentUser.name || currentUser.username}</span>
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                }}
                className="flex items-center gap-2 p-3 rounded-xl text-red-500 hover:bg-red-500/10 font-semibold text-sm transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>{t.nav.signOut || "Sign out"}</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 mt-2">
              <Link
                href="/signin"
                onClick={() => setIsOpen(false)}
                className={`${styles.buttonCta} w-full text-center`}
                data-variant="primary"
              >
                {t.nav.login}
              </Link>
            </div>
          )}
        </div>
      )}

      <FlyingBookmarkProvider />
    </>
  );
}
