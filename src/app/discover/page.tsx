"use client";
// Force page compile cache reload
import { useState, useEffect, Suspense, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { setQuery, setCity, setCategory, setRatingMin, setVerifiedOnly, setSortBy, resetFilters } from "@/store/slices/filterSlice";
import { MOCK_BUSINESSES } from "@/data/mock-businesses";
import { CATEGORIES, SORT_OPTIONS } from "@/lib/constants";
import { LocationSelect } from "@/components/ui/LocationSelect";
import { RatingSelect } from "@/components/ui/RatingSelect";
import { SortSelect } from "@/components/ui/SortSelect";
import { StatusSelect } from "@/components/ui/StatusSelect";
import BusinessCard, { getOpenStatus } from "@/components/discover/BusinessCard";
import { Building2, Loader2, Map as MapIcon, List as ListIcon, LayoutGrid } from "lucide-react";
import axios from "axios";
import { getApiUrl } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import styles from "./Discover.module.scss";
import { useI18n } from "@/i18n";

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
    locations: b.locations || [],
    status: b.active ? "active" : "inactive",
    isFeatured: b.featured || false,
    isVerified: b.verified || false,
    viewCount: b.views || 0,
    inquiryCount: 0,
    ratingAvg: b.rating || 0,
    reviewCount: b.reviewCount || 0,
    createdAt: b.createdAt || new Date().toISOString(),
    updatedAt: b.updatedAt || new Date().toISOString(),
    operatingHours: b.operatingHours || b.metadata?.operatingHours || [],
    tags: b.tags || [],
    highlights: b.highlights || [],
  };
}

function DiscoverContent() {
  const { t } = useI18n();
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const filters = useSelector((s: RootState) => s.filters);

  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">("all");

  // View mode and pagination state
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const feedColumnRef = useRef<HTMLDivElement>(null);

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
      if (statusFilter !== "all") {
        const { isOpen } = getOpenStatus(b.operatingHours, t);
        if (statusFilter === "open" && !isOpen) return false;
        if (statusFilter === "closed" && isOpen) return false;
      }
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

  // Calculate pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedFiltered = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
    if (feedColumnRef.current) {
      feedColumnRef.current.scrollTo({ top: 0, behavior: "smooth" });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [filters]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    if (feedColumnRef.current) {
      feedColumnRef.current.scrollTo({ top: 0, behavior: "smooth" });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className={styles.discoverPage}>
      {/* Main Column Container */}
      <div className={styles.mainContainer}>
        {/* Left Column (60%): Listing feed */}
        <div
          ref={feedColumnRef}
          className={`${styles.feedColumn} ${mobileView === "map" ? styles.hiddenMobile : ""
            }`}
        >
          <div className={styles.feedHeader}>

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
                onClick={() => {
                  dispatch(resetFilters());
                  setStatusFilter("all");
                }}
                className={`${styles.categoryButton} ${(!filters.category &&
                  !filters.city &&
                  filters.ratingMin === 0 &&
                  !filters.verifiedOnly &&
                  !filters.query &&
                  filters.sortBy === "popular" &&
                  statusFilter === "all")
                  ? styles.active
                  : ""
                  }`}
              >
                {t.discover.all || "All"}
              </button>

              {/* Location Selector Dropdown */}
              <div className="relative inline-block">
                <LocationSelect
                  value={filters.city}
                  onChange={(e) => dispatch(setCity(e.target.value))}
                  className={`${styles.categoryButton} ${filters.city ? styles.active : ""} cursor-pointer`}
                  placeholder={t.discover.allLocations || "All Locations"}
                  disablePlaceholder={false}
                />
              </div>

              {/* Rating Selector Dropdown */}
              <div className="relative inline-block">
                <RatingSelect
                  value={filters.ratingMin || 0}
                  onChange={(val) => dispatch(setRatingMin(val))}
                  className={`${styles.categoryButton} ${filters.ratingMin > 0 ? styles.active : ""} cursor-pointer`}
                />
              </div>

              {/* Open/Closed Selector Dropdown */}
              <div className="relative inline-block">
                <StatusSelect
                  value={statusFilter}
                  onChange={(val) => setStatusFilter(val)}
                  className={`${styles.categoryButton} ${statusFilter !== "all" ? styles.active : ""} cursor-pointer`}
                />
              </div>

              {/* Sort By Selector Dropdown */}
              <div className="relative inline-block">
                <SortSelect
                  value={filters.sortBy}
                  onChange={(val) => dispatch(setSortBy(val as any))}
                  className={`${styles.categoryButton} ${filters.sortBy !== "popular" ? styles.active : ""} cursor-pointer`}
                />
              </div>

              {/* View Toggle Icons */}
              <div className={styles.viewToggle}>
                <button
                  onClick={() => setViewMode("list")}
                  className={viewMode === "list" ? styles.active : ""}
                  title="List View"
                >
                  <ListIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={viewMode === "grid" ? styles.active : ""}
                  title="Grid View"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>



              {/* Reset Filters Button */}
              {(!filters.category &&
                !filters.city &&
                filters.ratingMin === 0 &&
                !filters.verifiedOnly &&
                !filters.query &&
                filters.sortBy === "popular" &&
                statusFilter === "all") ? null : (
                <button
                  onClick={() => {
                    dispatch(resetFilters());
                    setStatusFilter("all");
                  }}
                  className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors px-2 font-semibold cursor-pointer underline"
                >
                  {t.discover.reset || "Reset"}
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className={styles.centeredState}>
              <Loader2 className={styles.loaderIcon} />
              <p>Loading ...</p>
            </div>
          ) : filtered.length > 0 ? (
            <>
              <div className={viewMode === "grid" ? styles.feedGrid : styles.feedList}>
                {paginatedFiltered.map((biz) => (
                  <div
                    key={biz.id}
                    onMouseEnter={() => handleMouseEnterCard(biz.id)}
                    onMouseLeave={handleMouseLeaveCard}
                  >
                    <BusinessCard business={biz} viewMode={viewMode} />
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <span>Page {currentPage} of {totalPages}</span>
                  <button
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
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

