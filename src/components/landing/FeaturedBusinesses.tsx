"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { MOCK_BUSINESSES } from "@/data/mock-businesses";
import { Star, MapPin, BadgeCheck, Trophy, Crown, Medal, Loader2, UtensilsCrossed } from "lucide-react";
import { getApiUrl } from "@/lib/utils";
import axios from "axios";
import styles from "./FeaturedBusinesses.module.scss";

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

export default function FeaturedBusinesses() {
  const [businesses, setBusinesses] = useState<RankedBusiness[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTopRestaurants() {
      try {
        const api = getApiUrl();
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
          // Sort by rating descending, then by review count descending
          mapped.sort((a, b) => b.ratingAvg - a.ratingAvg || b.reviewCount - a.reviewCount);
          setBusinesses(mapped.slice(0, 5));
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Failed to load restaurants from backend, using static data", err);
      }

      // Fallback: filter mock businesses by HoReCa category
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
      setLoading(false);
    }
    loadTopRestaurants();
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
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <Trophy className={styles.trophyIcon} />
            </div>
            <div>
              <h2 className={styles.title}>Top 5 Restaurants</h2>
              <p className={styles.subtitle}>Highest rated restaurants on ArmBiz</p>
            </div>
          </div>
          <Link href="/discover?category=horeca" className={styles.viewAll}>
            View all
            <UtensilsCrossed className={styles.viewAllIcon} />
          </Link>
        </div>

        {loading ? (
          <div className={styles.loaderWrap}>
            <Loader2 className={styles.loader} />
          </div>
        ) : (
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
                      {biz.isVerified && <BadgeCheck className={styles.verifiedIcon} />}
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
                    <div className={styles.reviewCount}>{biz.reviewCount} reviews</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
