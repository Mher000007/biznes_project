"use client";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { MOCK_BUSINESSES } from "@/data/mock-businesses";
import SearchBar from "@/components/discover/SearchBar";
import FilterPanel from "@/components/discover/FilterPanel";
import BusinessCard from "@/components/discover/BusinessCard";
import { Building2 } from "lucide-react";

export default function DiscoverPage() {
  const filters = useSelector((s: RootState) => s.filters);
  const [customBusinesses, setCustomBusinesses] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const profilesStr = window.localStorage.getItem("armbiz-business-profiles");
      if (profilesStr) {
        try {
          const profiles = JSON.parse(profilesStr);
          const published = profiles.filter((p: any) => p.isPublished);
          const mapped = published.map((p: any) => {
            const categorySlug = p.category || "technology";
            const categoryObj = {
              id: `cat-${categorySlug}`,
              name: categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1),
              slug: categorySlug,
              description: "",
              icon: "Monitor",
              count: 0
            };
            
            const servicesMapped = (p.services || []).map((s: any, idx: number) => ({
              id: `custom-s-${idx}`,
              name: s.name,
              description: s.description || "",
              priceRange: s.price ? `${s.price} AMD` : "Contact"
            }));

            const daysMap: Record<string, number> = {
              "Sunday": 0, "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6
            };
            const hoursMapped = (p.operatingHours || []).map((h: any) => ({
              day: daysMap[h.day] ?? 1,
              dayName: h.day,
              openTime: h.open,
              closeTime: h.close,
              isClosed: h.closed
            }));

            return {
              id: `custom-${p.ownerUsername}`,
              slug: p.businessName ? p.businessName.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]/g, "") : "custom-biz",
              name: p.businessName || "My Custom Business",
              description: p.fullDesc || p.shortDesc || "",
              shortDescription: p.shortDesc || "",
              category: categoryObj,
              categoryId: categoryObj.id,
              address: p.address || "",
              city: p.city || "Yerevan",
              region: p.city || "Yerevan",
              latitude: 40.1872,
              longitude: 44.5152,
              phone: p.phone || "",
              email: p.email || "",
              website: p.website || "",
              foundedYear: Number(p.foundedYear) || 2026,
              employeeCount: "11-50",
              services: servicesMapped,
              logoUrl: p.logo || "",
              coverImageUrl: p.coverUrl || "",
              images: p.gallery || [],
              status: "active",
              isFeatured: false,
              isVerified: true,
              viewCount: p.viewCount !== undefined ? p.viewCount : 0,
              inquiryCount: p.inquiryCount !== undefined ? p.inquiryCount : 0,
              ratingAvg: p.ratingAvg !== undefined ? p.ratingAvg : 0.0,
              reviewCount: p.reviewCount !== undefined ? p.reviewCount : 0,
              createdAt: p.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              operatingHours: hoursMapped,
              tags: p.tags ? p.tags.split(",").map((t: string) => t.trim()) : [],
            };
          });
          setCustomBusinesses(mapped);
        } catch (e) {
          console.error("Error parsing business profiles from localstorage", e);
        }
      }
    }
  }, []);

  const allBusinesses = [...customBusinesses, ...MOCK_BUSINESSES];

  const filtered = allBusinesses.filter((b) => {
    if (filters.query) {
      const q = filters.query.toLowerCase();
      if (!b.name.toLowerCase().includes(q) && !b.shortDescription.toLowerCase().includes(q) && !b.tags.some((t: string) => t.includes(q))) return false;
    }
    if (filters.category && b.category.slug !== filters.category) return false;
    if (filters.city && b.city !== filters.city) return false;
    if (filters.employeeCount && b.employeeCount !== filters.employeeCount) return false;
    if (filters.verifiedOnly && !b.isVerified) return false;
    return true;
  }).sort((a, b) => {
    switch (filters.sortBy) {
      case "rating": return b.ratingAvg - a.ratingAvg;
      case "newest": return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "name": return a.name.localeCompare(b.name);
      default: return b.viewCount - a.viewCount;
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
                {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              </div>
            </div>

            {/* Results Grid */}
            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((biz) => (
                  <BusinessCard key={biz.id} business={biz} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Building2 className="h-12 w-12 text-[hsl(var(--muted-foreground))]/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No businesses found</h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Try adjusting your filters or search term</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
