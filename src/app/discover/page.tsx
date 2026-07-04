"use client";
// Force page compile cache reload
import { useState, useEffect, Suspense, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { setQuery, setCity, setCategory, setRatingMin, setVerifiedOnly, setSortBy, resetFilters } from "@/store/slices/filterSlice";
import { MOCK_BUSINESSES } from "@/data/mock-businesses";
import { CATEGORIES, SORT_OPTIONS } from "@/lib/constants";
import { LocationSelect } from "@/components/ui/LocationSelect";
import BusinessCard from "@/components/discover/BusinessCard";
import { Building2, Loader2, Map as MapIcon, List as ListIcon } from "lucide-react";
import axios from "axios";
import { getApiUrl } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import styles from "./Discover.module.scss";

const API = getApiUrl();

// Dynamically import Leaflet Map to prevent SSR errors
const DiscoverMap = dynamic(() => import("@/components/discover/DiscoverMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">
      <Loader2 className="h-6 w-6 animate-spin mr-2" />
      Loading map...
    </div>
  ),
});

// Normalize a backend business doc to the same shape as a MOCK_BUSINESSES entry
function normalizeBackendBusiness(b: any) {
  const cat = b.category || {};
  return {
    id: b._id,
    slug: b.slug,
    name: b.name,
    description: b.description || "",
    shortDescription: b.description?.substring(0, 100) || "",
    category: {
      id: cat._id || cat.id || "",
      name: cat.name || "",
      slug: cat.slug || "",
      description: "",
      icon: cat.icon || "Building2",
      count: 0,
    },
    categoryId: cat._id || cat.id || "",
    address: b.address || "",
    city: b.city || "Yerevan",
    region: b.city || "Yerevan",
    latitude: b.coordinates?.latitude || 40.1872,
    longitude: b.coordinates?.longitude || 44.5152,
    phone: b.phone || "",
    email: b.email || "",
    website: b.website || "",
    foundedYear: b.foundedYear || 2020,
    employeeCount: b.employeeCount || "1-10",
    services: (b.services || []).map((s: any) => ({
      id: s._id || String(Math.random()),
      name: s.name,
      description: s.description || "",
      priceRange: s.price ? `${s.price} AMD` : "Contact",
    })),
    logoUrl: b.logo || "",
    coverImageUrl: (Array.isArray(b.metadata?.coverUrl) ? b.metadata.coverUrl[0] : b.metadata?.coverUrl) || (b.images && b.images.length > 0 ? b.images[0] : "") || b.logo || "",
    images: b.images || [],
    status: b.active ? "active" : "inactive",
    isFeatured: b.featured || false,
    isVerified: b.verified || false,
    viewCount: b.views || 0,
    inquiryCount: 0,
    ratingAvg: b.rating || 0,
    reviewCount: b.reviewCount || 0,
    createdAt: b.createdAt || new Date().toISOString(),
    updatedAt: b.updatedAt || new Date().toISOString(),
    operatingHours: b.operatingHours || [],
    tags: b.tags || [],
    highlights: b.highlights || [],
  };
}

function DiscoverContent() {
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const filters = useSelector((s: RootState) => s.filters);

  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Track hovered business to highlight on map
  const [hoveredBusinessId, setHoveredBusinessId] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnterCard = (id: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredBusinessId(id);
  };

  const handleMouseLeaveCard = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredBusinessId(null);
    }, 300); // 300ms delay to allow cursor to reach the map
  };

  const handleMouseEnterMap = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const handleMouseLeaveMap = () => {
    setHoveredBusinessId(null);
  };

  // Mobile View Toggling: "list" or "map"
  const [mobileView, setMobileView] = useState<"list" | "map">("list");

  // Sync Redux filters with URL query parameters on load
  useEffect(() => {
    const q = searchParams.get("q");
    const city = searchParams.get("city") || searchParams.get("location");
    const cat = searchParams.get("category");

    if (q !== null) dispatch(setQuery(q));
    if (city !== null) dispatch(setCity(city));
    if (cat !== null) dispatch(setCategory(cat));
  }, [searchParams, dispatch]);

  useEffect(() => {
    async function loadBusinesses() {
      setLoading(true);
      try {
        const res = await axios.get(`${API}/businesses`, {
          params: { limit: 100 },
        });
        if (res.data?.success && res.data.data?.length > 0) {
          const normalized = res.data.data.map(normalizeBackendBusiness);
          setBusinesses(normalized);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Backend businesses fetch failed, using static mock data", err);
      }

      // Fallback: use static mock data
      setBusinesses(MOCK_BUSINESSES as any[]);
      setLoading(false);
    }

    loadBusinesses();
  }, []);

  const filtered = businesses
    .filter((b) => {
      if (filters.query) {
        const q = filters.query.toLowerCase();
        if (
          !b.name.toLowerCase().includes(q) &&
          !(b.shortDescription || "").toLowerCase().includes(q) &&
          !(b.tags || []).some((t: string) => t.toLowerCase().includes(q))
        )
          return false;
      }
      if (filters.category && b.category?.slug !== filters.category) return false;
      if (filters.city && b.city.toLowerCase() !== filters.city.toLowerCase()) return false;
      if (filters.employeeCount && b.employeeCount !== filters.employeeCount) return false;
      if (filters.verifiedOnly && !b.isVerified) return false;
      if (filters.ratingMin && (b.ratingAvg || 0) < filters.ratingMin) return false;
      return true;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case "rating":
          return (b.ratingAvg || 0) - (a.ratingAvg || 0);
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return (b.viewCount || 0) - (a.viewCount || 0);
      }
    });

  return (
    <div className={styles.discoverPage}>
      {/* Main Column Container */}
      <div className={styles.mainContainer}>
        {/* Left Column (60%): Listing feed */}
        <div
          className={`${styles.feedColumn} ${mobileView === "map" ? styles.hiddenMobile : ""
            }`}
        >
          <div className={styles.feedHeader}>
            <h1 className="text-xl font-bold tracking-tight text-[#111111] mb-1">
              Discover Directory
            </h1>
            <div className={styles.resultsCount}>
              {loading ? (
                <span>Loading directory...</span>
              ) : (
                <span>
                  Showing {filtered.length} business
                  {filtered.length !== 1 ? "es" : ""}
                </span>
              )}
            </div>
          </div>

          {/* Secondary Horizontal Filter Bar */}
          <div className={styles.categoryBar}>
            <div className={styles.categoryList}>
              {/* "All" Reset Button */}
              <button
                onClick={() => dispatch(resetFilters())}
                className={`${styles.categoryButton} ${(!filters.category &&
                  !filters.city &&
                  filters.ratingMin === 0 &&
                  !filters.verifiedOnly &&
                  !filters.query &&
                  filters.sortBy === "popular")
                  ? styles.active
                  : ""
                  }`}
              >
                All
              </button>

              {/* Location Selector Dropdown */}
              <div className="relative inline-block">
                <LocationSelect
                  value={filters.city}
                  onChange={(e) => dispatch(setCity(e.target.value))}
                  className={`${styles.categoryButton} ${filters.city ? styles.active : ""} cursor-pointer`}
                  placeholder="All Locations"
                  disablePlaceholder={false}
                />
              </div>

              {/* Rating Selector Dropdown */}
              <div className="relative inline-block">
                <select
                  value={filters.ratingMin || 0}
                  onChange={(e) => dispatch(setRatingMin(Number(e.target.value)))}
                  className={`${styles.categoryButton} ${filters.ratingMin > 0 ? styles.active : ""} !pr-8 bg-none cursor-pointer appearance-none outline-none`}
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='${filters.ratingMin > 0 ? "%23101012" : "%23666666"}' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                    backgroundPosition: "right 10px center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "14px",
                  }}
                >
                  <option value="0" className="bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">All Ratings</option>
                  <option value="4.5" className="bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">★ 4.5 & up</option>
                  <option value="4" className="bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">★ 4.0 & up</option>
                  <option value="3" className="bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">★ 3.0 & up</option>
                </select>
              </div>

              {/* Sort By Selector Dropdown */}
              <div className="relative inline-block">
                <select
                  value={filters.sortBy}
                  onChange={(e) => dispatch(setSortBy(e.target.value as any))}
                  className={`${styles.categoryButton} ${filters.sortBy !== "popular" ? styles.active : ""} !pr-8 bg-none cursor-pointer appearance-none outline-none`}
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='${filters.sortBy !== "popular" ? "%23101012" : "%23666666"}' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                    backgroundPosition: "right 10px center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "14px",
                  }}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Verified Only Toggle Button */}
              <button
                onClick={() => dispatch(setVerifiedOnly(!filters.verifiedOnly))}
                className={`${styles.categoryButton} ${filters.verifiedOnly ? styles.active : ""}`}
              >
                Verified Only
              </button>

              {/* Reset Filters Button */}
              {(filters.category || filters.city || filters.ratingMin > 0 || filters.verifiedOnly || filters.sortBy !== "popular") && (
                <button
                  onClick={() => dispatch(resetFilters())}
                  className="text-xs text-[hsl(var(--primary))] font-semibold hover:underline ml-2 cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className={styles.centeredState}>
              <Loader2 className={styles.loaderIcon} />
              <p>Loading premium businesses...</p>
            </div>
          ) : filtered.length > 0 ? (
            <div className={styles.feedList}>
              {filtered.map((biz) => (
                <div
                  key={biz.id}
                  onMouseEnter={() => handleMouseEnterCard(biz.id)}
                  onMouseLeave={handleMouseLeaveCard}
                >
                  <BusinessCard business={biz} />
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.centeredState}>
              <Building2 className="h-12 w-12 text-[#666666]/30 mb-4" />
              <h3>No businesses found</h3>
              <p>Try adjusting your search criteria or clear location filters.</p>
            </div>
          )}
        </div>

        {/* Right Column (40%): Sticky interactive map */}
        <div
          className={`${styles.mapColumn} ${mobileView === "list" ? styles.hiddenMobile : ""
            }`}
          onMouseEnter={handleMouseEnterMap}
          onMouseLeave={handleMouseLeaveMap}
        >
          <DiscoverMap
            businesses={filtered}
            hoveredBusinessId={hoveredBusinessId}
          />
        </div>
      </div>

      {/* Mobile view toggle switcher button */}
      <div className={styles.mobileToggleWrapper}>
        <button
          onClick={() => setMobileView(mobileView === "list" ? "map" : "list")}
          className={styles.mobileToggleButton}
        >
          {mobileView === "list" ? (
            <>
              <MapIcon className="h-4 w-4" /> Show Map
            </>
          ) : (
            <>
              <ListIcon className="h-4 w-4" /> Show List
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-white text-black font-sans">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p className="text-sm font-medium">Loading ArmBiz Directory...</p>
        </div>
      }
    >
      <DiscoverContent />
    </Suspense>
  );
}

