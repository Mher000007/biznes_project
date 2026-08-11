"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { MOCK_BUSINESSES } from "@/data/mock-businesses";
import { Star, MapPin, Crown, Medal, Loader2, UtensilsCrossed } from "lucide-react";
import { getApiUrl } from "@/lib/utils";
import axios from "axios";
import styles from "./FeaturedBusinesses.module.scss";
import { useI18n } from "@/i18n";
import BusinessCard from "@/components/discover/BusinessCard";
import type { Business } from "@/types/business";

interface RankedBusiness {
  id: string;
  name: string;
  slug: string;
  category: { name: string };
  shortDescription: string;
  city: string;
  ratingAvg: number;
  reviewCount: number;
  isVerified: boolean;
  logoUrl: string;
}

const SwipeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M19,12h-2v-1c0-0.6-0.4-1-1-1h-2v-1c0-0.6-0.4-1-1-1h-2V5c0-1.1-0.9-2-2-2S7,3.9,7,5v8.5l-2.1-1c-0.6-0.3-1.4-0.1-1.8,0.4 c-0.4,0.5-0.3,1.3,0.2,1.7l5.4,4.5C9.3,19.6,10.1,20,11,20h7c1.7,0,3-1.3,3-3v-4C21,12.4,20.1,12,19,12z" />
    <path d="M13,3h6c0.6,0,1,0.4,1,1s-0.4,1-1,1h-6C12.4,5,12,4.6,12,4S12.4,3,13,3z" />
    <path d="M15,7h4c0.6,0,1,0.4,1,1s-0.4,1-1,1h-4C14.4,9,14,8.6,14,8S14.4,7,15,7z" />
  </svg>
);

function normalizeBusiness(b: any): Business {
  const cat = b.category || {};
  return {
    id: b._id || b.id,
    slug: b.slug,
    name: b.name,
    description: b.description || "",
    shortDescription: b.shortDescription || b.description?.substring(0, 100) || "",
    category: {
      id: cat._id || cat.id || "",
      name: cat.name || "HoReCa",
      slug: cat.slug || "horeca",
      description: "",
      icon: cat.icon || "Building2",
      count: 0,
    },
    categoryId: cat._id || cat.id || "",
    address: b.address || "",
    city: b.city || "Երևան",
    region: b.region || b.city || "Երևան",
    latitude: b.coordinates?.latitude || 40.1872,
    longitude: b.coordinates?.longitude || 44.5152,
    phone: b.phone || "",
    email: b.email || "",
    website: b.website || "",
    foundedYear: b.foundedYear || 2020,
    employeeCount: b.employeeCount || "1-10",
    services: b.services || [],
    logo: b.logo || b.logoUrl || "",
    logoUrl: b.logo || b.logoUrl || "",
    coverImageUrl: (Array.isArray(b.metadata?.coverUrl) ? b.metadata.coverUrl[0] : b.metadata?.coverUrl) || (b.images && b.images.length > 0 ? b.images[0] : "") || b.coverImageUrl || b.logo || "",
    images: b.images || [],
    locations: b.locations || [],
    status: b.status || (b.active ? "active" : "inactive"),
    isFeatured: b.featured || b.isFeatured || false,
    isVerified: b.verified || b.isVerified || false,
    viewCount: b.views || b.viewCount || 0,
    inquiryCount: 0,
    ratingAvg: b.rating || b.ratingAvg || 0,
    reviewCount: b.reviewCount || 0,
    createdAt: b.createdAt || new Date().toISOString(),
    updatedAt: b.updatedAt || new Date().toISOString(),
    operatingHours: b.operatingHours || b.metadata?.operatingHours || [],
    tags: b.tags || [],
    plan: b.plan || 'premium',
  };
}

export default function FeaturedBusinesses() {
  const [businesses, setBusinesses] = useState<RankedBusiness[]>([]);
  const [premiumBusinesses, setPremiumBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();

  useEffect(() => {
    async function loadData() {
      const api = getApiUrl();

      // 1. Load Top 5 Restaurants
      try {
        const res = await axios.get(`${api}/businesses?category=horeca&limit=5&sort=-rating`);
        if (res.data?.success && res.data.data?.length > 0) {
          const mapped: RankedBusiness[] = res.data.data.map((b: any) => ({
            id: b._id || b.id,
            name: b.name,
            slug: b.slug,
            category: { name: b.category?.name || "HoReCa" },
            shortDescription: b.description || b.shortDescription || "",
            city: b.city || "",
            ratingAvg: b.rating || b.ratingAvg || 0,
            reviewCount: b.reviewCount || 0,
            isVerified: b.verified || b.isVerified || false,
            logoUrl: b.logo || "",
          }));
          mapped.sort((a, b) => b.ratingAvg - a.ratingAvg || b.reviewCount - a.reviewCount);
          setBusinesses(mapped.slice(0, 5));
        } else {
          const horeca = MOCK_BUSINESSES
            .filter((b) => b.category?.slug === "horeca")
            .sort((a, b) => (b.ratingAvg || 0) - (a.ratingAvg || 0) || (b.reviewCount || 0) - (a.reviewCount || 0))
            .slice(0, 5)
            .map((b) => ({
              id: b.id,
              name: b.name,
              slug: b.slug,
              category: { name: b.category?.name || "HoReCa" },
              shortDescription: b.shortDescription || "",
              city: b.city || "",
              ratingAvg: b.ratingAvg || 0,
              reviewCount: b.reviewCount || 0,
              isVerified: b.isVerified || false,
              logoUrl: b.logoUrl || "",
            }));
          setBusinesses(horeca);
        }
      } catch (err) {
        const horeca = MOCK_BUSINESSES
          .filter((b) => b.category?.slug === "horeca")
          .sort((a, b) => (b.ratingAvg || 0) - (a.ratingAvg || 0) || (b.reviewCount || 0) - (a.reviewCount || 0))
          .slice(0, 5)
          .map((b) => ({
            id: b.id,
            name: b.name,
            slug: b.slug,
            category: { name: b.category?.name || "HoReCa" },
            shortDescription: b.shortDescription || "",
            city: b.city || "",
            ratingAvg: b.ratingAvg || 0,
            reviewCount: b.reviewCount || 0,
            isVerified: b.isVerified || false,
            logoUrl: b.logoUrl || "",
          }));
        setBusinesses(horeca);
      }

      // 2. Load Premium Businesses only (must have valid images/photos)
      try {
        const pRes = await axios.get(`${api}/businesses?limit=50`);
        let premList: Business[] = [];
        if (pRes.data?.success && pRes.data.data?.length > 0) {
          const filteredPrem = pRes.data.data.filter(
            (b: any) => (b.verified || b.plan === "premium" || b.featured) && (b.logo || b.logoUrl || b.metadata?.coverUrl || (b.images && b.images.length > 0))
          );
          premList = filteredPrem.map(normalizeBusiness).filter((b: Business) => !!(b.logoUrl || b.coverImageUrl || b.logo));
        }

        if (premList.length < 3) {
          const mockPrem = MOCK_BUSINESSES.filter(
            (b) => (b.isVerified || b.plan === "premium" || b.isFeatured) && !!(b.logoUrl || b.coverImageUrl)
          );
          const combined = [...premList];
          for (const mb of mockPrem) {
            if (!combined.some((b) => b.slug === mb.slug)) {
              combined.push(mb as Business);
            }
          }
          premList = combined.filter((b: Business) => !!(b.logoUrl || b.coverImageUrl || b.logo));
        }

        setPremiumBusinesses(premList);
      } catch (err) {
        const mockPrem = MOCK_BUSINESSES.filter(
          (b) => (b.isVerified || b.plan === "premium" || b.isFeatured) && !!(b.logoUrl || b.coverImageUrl)
        ).filter((b) => !!(b.logoUrl || b.coverImageUrl));
        setPremiumBusinesses(mockPrem as Business[]);
      }

      setLoading(false);
    }

    loadData();
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className={styles.rankIconGold} />;
      case 2: return <Medal className={styles.rankIconSilver} />;
      case 3: return <Medal className={styles.rankIconBronze} />;
      default: return <span className={styles.rankNumber}>{rank}</span>;
    }
  };

  const getRankClass = (rank: number) => {
    switch (rank) {
      case 1: return styles.rankGold;
      case 2: return styles.rankSilver;
      case 3: return styles.rankBronze;
      default: return styles.rankDefault;
    }
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.3;
    const stars = [];
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className={styles.starFilled} />);
      } else if (i === fullStars && hasHalf) {
        stars.push(
          <span key={i} className={styles.starHalf}>
            <Star className={styles.starEmpty} />
            <Star className={styles.starFilledOverlay} />
          </span>
        );
      } else {
        stars.push(<Star key={i} className={styles.starEmpty} />);
      }
    }
    return stars;
  };

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        {loading ? (
          <div className={styles.loaderWrap}>
            <Loader2 className={styles.loader} />
          </div>
        ) : (
          <>
            {/* Offers (Premium Businesses Cards Grid) */}
            {premiumBusinesses.length > 0 && (
              <div className="mb-14">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[hsl(var(--foreground))]">
                      {t.featured.premiumTitle}
                    </h2>
                    <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))]">
                      {t.featured.premiumSubtitle}
                    </p>
                  </div>
                  <Link href="/discover?verified=true" className={styles.viewAll}>
                    {t.featured.viewAll}
                  </Link>
                  <div className={styles.swipeIndicator}>
                    <span className={styles.swipeText}>Թերթել</span>
                    <SwipeIcon className={styles.swipeIcon} />
                  </div>
                </div>

                <div className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory custom-scrollbar">
                  {premiumBusinesses.map((biz) => (
                    <div key={biz.id} className="w-[85vw] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] shrink-0 snap-start">
                      <BusinessCard business={biz} viewMode="grid" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top 5 Ranking List */}
            <div className={premiumBusinesses.length > 0 ? "pt-10 border-t border-white/10" : ""}>
              <div className={styles.header}>
                <div className={styles.headerLeft}>
                  <div>
                    <h2 className={styles.title}>{t.featured.title}</h2>
                    <p className={styles.subtitle}>{t.featured.subtitle}</p>
                  </div>
                </div>
                <Link href="/discover?category=horeca" className={styles.viewAll}>
                  {t.featured.viewAll}
                </Link>
              </div>

              <div className={styles.rankingList}>
                {businesses.map((biz, index) => {
                  const rank = index + 1;
                  return (
                    <Link key={biz.id} href={`/business/${biz.slug}`} className={`${styles.rankItem} ${getRankClass(rank)}`}>
                      <div className={styles.rankBadge}>
                        {getRankIcon(rank)}
                      </div>

                      <div className={styles.bizAvatar}>
                        {biz.logoUrl ? (
                          <img src={biz.logoUrl} alt={biz.name} className={styles.avatarImg} />
                        ) : (
                          <div className={styles.avatarPlaceholder}>
                            <UtensilsCrossed className={styles.avatarIcon} />
                          </div>
                        )}
                      </div>

                      <div className={styles.bizInfo}>
                        <div className={styles.bizNameRow}>
                          <h3 className={styles.bizName}>{biz.name}</h3>
                        </div>
                        <p className={styles.bizDesc}>{biz.shortDescription}</p>
                        <div className={styles.bizMeta}>
                          <span className={styles.location}>
                            <MapPin className={styles.metaIcon} />
                            {biz.city}
                          </span>
                        </div>
                      </div>

                      <div className={styles.ratingBlock}>
                        <div className={styles.ratingScore}>{biz.ratingAvg.toFixed(1)}</div>
                        <div className={styles.starsRow}>{renderStars(biz.ratingAvg)}</div>
                        <div className={styles.reviewCount}>{biz.reviewCount} {t.business.reviews}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
