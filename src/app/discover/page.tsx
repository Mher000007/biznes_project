"use client";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { MOCK_BUSINESSES } from "@/data/mock-businesses";
import SearchBar from "@/components/discover/SearchBar";
import FilterPanel from "@/components/discover/FilterPanel";
import BusinessCard from "@/components/discover/BusinessCard";
import { Building2, Loader2 } from "lucide-react";
import axios from "axios";
import { getApiUrl } from "@/lib/utils";

const API = getApiUrl();

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

export default function DiscoverPage() {
  const filters = useSelector((s: RootState) => s.filters);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      if (filters.city && b.city !== filters.city) return false;
      if (filters.employeeCount && b.employeeCount !== filters.employeeCount) return false;
      if (filters.verifiedOnly && !b.isVerified) return false;
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
    <div className="pt-20 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Discover Businesses</h1>
          <p className="text-[hsl(var(--muted-foreground))]">
            Browse and filter through Armenia&apos;s business directory
          </p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
              <FilterPanel />
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1 min-w-0">
            {/* Search + count */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <SearchBar />
              </div>
              <div className="flex items-center text-sm text-[hsl(var(--muted-foreground))]">
                <Building2 className="h-4 w-4 mr-1" />
                {loading ? "Loading..." : `${filtered.length} result${filtered.length !== 1 ? "s" : ""}`}
              </div>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-[hsl(var(--muted-foreground))]/60 mb-4" />
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Loading businesses from database…
                </p>
              </div>
            ) : filtered.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((biz) => (
                  <BusinessCard key={biz.id} business={biz} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Building2 className="h-12 w-12 text-[hsl(var(--muted-foreground))]/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No businesses found</h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Try adjusting your filters or search term
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
