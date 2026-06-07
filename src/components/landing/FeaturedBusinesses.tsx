"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { MOCK_BUSINESSES } from "@/data/mock-businesses";
import { Star, MapPin, BadgeCheck, ArrowRight, Loader2 } from "lucide-react";
import { getApiUrl } from "@/lib/utils";
import axios from "axios";

export default function FeaturedBusinesses() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeatured() {
      try {
        const api = getApiUrl();
        const res = await axios.get(`${api}/businesses?limit=4`);
        if (res.data?.success && res.data.data?.length > 0) {
          const mapped = res.data.data.map((b: any) => ({
            id: b._id || b.id,
            name: b.name,
            slug: b.slug,
            category: { name: b.category?.name || "Business" },
            shortDescription: b.description,
            city: b.city,
            ratingAvg: b.rating || b.ratingAvg || 0,
            isVerified: b.verified || b.isVerified || false,
            logoUrl: b.logo || "",
          }));
          setBusinesses(mapped);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Failed to load featured businesses from backend, using static data", err);
      }
      
      // Fallback
      const featured = MOCK_BUSINESSES.filter((b) => b.isFeatured).slice(0, 4);
      setBusinesses(featured);
      setLoading(false);
    }
    loadFeatured();
  }, []);

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold mb-2 text-[hsl(var(--foreground))]">Featured businesses</h2>
            <p className="text-base text-[hsl(var(--muted-foreground))]">Top-rated and verified businesses on ArmBiz</p>
          </div>
          <Link href="/discover" className="hidden sm:inline-flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[hsl(var(--muted-foreground))]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {businesses.map((biz) => (
              <Link key={biz.id} href={`/business/${biz.slug}`}
                className="group feature-card p-5 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  {biz.logoUrl ? (
                    <img 
                      src={biz.logoUrl} 
                      alt={biz.name} 
                      className="h-10 w-10 shrink-0 rounded-lg object-cover" 
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--muted))] text-sm font-semibold text-[hsl(var(--muted-foreground))]">
                      {biz.name[0]}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium truncate text-[hsl(var(--foreground))]">{biz.name}</h3>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{biz.category?.name}</p>
                  </div>
                </div>
                <p className="text-sm text-[hsl(var(--muted-foreground))] line-clamp-2 mb-4">{biz.shortDescription}</p>
                <div className="flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{biz.city}</span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {biz.ratingAvg}
                    {biz.isVerified && <BadgeCheck className="h-3 w-3 text-[hsl(var(--accent))] ml-1" />}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
