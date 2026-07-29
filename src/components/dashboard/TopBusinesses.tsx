"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { getApiUrl } from "@/lib/utils";
import { Star, Award, MapPin, Eye, Crown, Medal, BadgeCheck, UtensilsCrossed } from "lucide-react";
import styles from "@/components/landing/FeaturedBusinesses.module.scss";

import { useI18n } from "@/i18n";

interface Business {
  _id: string;
  name: string;
  rating: number;
  reviewCount: number;
  views: number;
  category?: { name: string; slug: string };
  city?: string;
  coverImage?: string;
  logo?: string;
  shortDescription?: string;
  verified?: boolean;
}

export default function TopBusinesses() {
  const { t } = useI18n();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTopBusinesses() {
      try {
        const API = getApiUrl();
        // Fetch highest rated businesses (HoReCa category only to match Featured Businesses)
        const res = await axios.get(`${API}/businesses?category=horeca&limit=5&sort=-rating`);
        if (res.data?.success && res.data.data) {
          // Sort by rating descending, then by review count descending to match FeaturedBusinesses logic
          const sorted = res.data.data.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0) || (b.reviewCount || 0) - (a.reviewCount || 0));
          setBusinesses(sorted);
        }
      } catch (error) {
        console.error("Failed to load top businesses", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTopBusinesses();
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
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-sm animate-scale-in h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-[hsl(var(--foreground))] flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            {t.dashboard.top5Businesses}
          </h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{t.dashboard.highestRatedPlatform}</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {loading ? (
          <div className="flex-1 flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--primary))]"></div>
          </div>
        ) : businesses.length === 0 ? (
          <div className="flex-1 flex justify-center items-center py-10 text-[hsl(var(--muted-foreground))] text-sm">
            Տվյալներ դեռ չկան:
          </div>
        ) : (
          <div className={styles.rankingList}>
            {businesses.map((biz, index) => {
              const rank = index + 1;
              return (
                <div key={biz._id} className={`${styles.rankItem} ${getRankClass(rank)}`} style={{ cursor: 'default' }}>
                  <div className={styles.rankBadge}>
                    {getRankIcon(rank)}
                  </div>

                  <div className={styles.bizAvatar}>
                    {biz.logo ? (
                      <img src={biz.logo} alt={biz.name} className={styles.avatarImg} />
                    ) : (
                      <div className={styles.avatarPlaceholder}>
                        <UtensilsCrossed className={styles.avatarIcon} />
                      </div>
                    )}
                  </div>

                  <div className={styles.bizInfo}>
                    <div className={styles.bizNameRow}>
                      <h3 className={styles.bizName}>{biz.name}</h3>
                      {biz.verified && <BadgeCheck className={styles.verifiedIcon} />}
                    </div>
                    <p className={styles.bizDesc}>{biz.shortDescription || biz.category?.name || "HoReCa"}</p>
                    <div className={styles.bizMeta}>
                      {biz.city && (
                        <span className={styles.location}>
                          <MapPin className={styles.metaIcon} />
                          {biz.city}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={styles.ratingBlock}>
                    <div className={styles.ratingScore}>{biz.rating > 0 ? biz.rating.toFixed(1) : "0.0"}</div>
                    <div className={styles.starsRow}>{renderStars(biz.rating || 0)}</div>
                    <div className={styles.reviewCount}>{biz.reviewCount || 0} կարծիք</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
