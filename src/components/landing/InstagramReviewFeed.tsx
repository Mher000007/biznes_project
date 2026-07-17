"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { Heart, Loader2, ChevronLeft, ChevronRight, Volume2, VolumeX } from "lucide-react";
import { getApiUrl } from "@/lib/utils";
import { MOCK_BUSINESSES } from "@/data/mock-businesses";
import { useI18n } from "@/i18n";

interface UserProfile {
  name: string;
  initials: string;
}

interface BizProfile {
  name: string;
  slug: string;
  address: string;
  city: string;
  images?: string[];
}

export interface ReviewMedia {
  url: string;
  type: 'image' | 'video';
}

interface ReviewCardData {
  id: string;
  user: UserProfile;
  biz: BizProfile;
  time: string;
  media: ReviewMedia[];
  rating: number;
  likes: number;
  caption: string;
  businessId: string;
  createdAt?: string;
}

const FALLBACK_REVIEWS: ReviewCardData[] = [
  {
    id: "mock-1",
    user: { name: "Anahit Sargsyan", initials: "AS" },
    biz: { name: "Lavash Restaurant Group", slug: "lavash-restaurant-group", address: "22 Abovyan St", city: "Yerevan" },
    time: "2h ago",
    media: [{ url: "https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=800&auto=format&fit=crop&q=80", type: 'image' }],
    rating: 5,
    likes: 42,
    caption: "Amazing traditional food! The lavash is always hot and fresh, and the khorovats was perfectly cooked. Excellent service too.",
    businessId: "mock-biz-1",
  },
  {
    id: "mock-2",
    user: { name: "Gevorg Harutyunyan", initials: "GH" },
    biz: { name: "ArmStone Materials", slug: "armstone-materials", address: "14 Tumanyan St", city: "Yerevan" },
    time: "1d ago",
    media: [{ url: "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=800&auto=format&fit=crop&q=80", type: 'image' }],
    rating: 5,
    likes: 24,
    caption: "Outstanding tufa and basalt quality. We ordered in bulk for our home facade and they delivered on time with perfect specifications.",
    businessId: "mock-biz-2",
  },
  {
    id: "mock-3",
    user: { name: "Mariam Davtyan", initials: "MD" },
    biz: { name: "Ararat Organic Farms", slug: "ararat-organic-farms", address: "Artashat Highway, Km 12", city: "Artashat" },
    time: "3d ago",
    media: [{ url: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=800&auto=format&fit=crop&q=80", type: 'image' }],
    rating: 4,
    likes: 18,
    caption: "The sweetest peaches and fresh herbs! We buy wholesale for our market chain and our customers love the organic quality from Ararat.",
    businessId: "mock-biz-3",
  }
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default function InstagramReviewFeed() {
  const [reviews, setReviews] = useState<ReviewCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedMap, setLikedMap] = useState<Record<string, { liked: boolean; count: number }>>({});
  const [animateMap, setAnimateMap] = useState<Record<string, boolean>>({});
  const [heartPopMap, setHeartPopMap] = useState<Record<string, boolean>>({});
  const [mediaIndexMap, setMediaIndexMap] = useState<Record<string, number>>({});
  const [unmutedMap, setUnmutedMap] = useState<Record<string, boolean>>({});
  const { t } = useI18n();
  const [showAll, setShowAll] = useState(false);
  const [filterRating, setFilterRating] = useState<number | null>(null);

  useEffect(() => {
    async function loadReviews() {
      let backendReviews: ReviewCardData[] = [];
      try {
        const api = getApiUrl();
        // corrected double-path bug (removed extra '/api')
        const res = await axios.get(`${api}/reviews/all?limit=12`);
        if (res.data?.success && res.data.data?.length > 0) {
          backendReviews = res.data.data.map((r: any) => {
            const mediaList: ReviewMedia[] = [];
            if (r.videos && r.videos.length > 0) {
              r.videos.forEach((v: string) => mediaList.push({ url: v, type: 'video' }));
            }
            if (r.images && r.images.length > 0) {
              r.images.forEach((img: string) => mediaList.push({ url: img, type: 'image' }));
            }
            if (mediaList.length === 0 && r.image) {
              mediaList.push({ url: r.image, type: 'image' });
            }
            if (mediaList.length === 0 && r.business?.images?.length > 0) {
              r.business.images.forEach((img: string) => mediaList.push({ url: img, type: 'image' }));
            }
            if (mediaList.length === 0) {
              const nameLower = (r.business?.name || "").toLowerCase();
              if (nameLower.includes("restaurant") || nameLower.includes("lavash") || nameLower.includes("cafe")) {
                mediaList.push({ url: "https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=800&auto=format&fit=crop&q=80", type: 'image' });
              } else if (nameLower.includes("farm") || nameLower.includes("produce") || nameLower.includes("organic")) {
                mediaList.push({ url: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=800&auto=format&fit=crop&q=80", type: 'image' });
              } else {
                mediaList.push({ url: "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=800&auto=format&fit=crop&q=80", type: 'image' });
              }
            }

            const authorName = r.author?.name || r.authorName || "Anonymous User";

            return {
              id: r._id || r.id,
              user: {
                name: authorName,
                initials: getInitials(authorName),
              },
              biz: {
                name: r.business?.name || "Local Business",
                slug: r.business?.slug || "#",
                address: r.business?.address || "Armenia",
                city: r.business?.city || "",
              },
              time: timeAgo(r.createdAt),
              createdAt: r.createdAt,
              media: mediaList,
              rating: r.rating || 5,
              likes: r.helpfulCount || 0,
              caption: r.comment || "",
              businessId: r.business?._id || "",
            };
          });
        }
      } catch (err) {
        console.warn("Failed to load reviews from backend", err);
      }

      // Load local storage reviews
      const localReviews: ReviewCardData[] = [];
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("armbiz-reviews-")) {
            const slug = key.replace("armbiz-reviews-", "");
            const raw = localStorage.getItem(key);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) {
                parsed.forEach((r: any) => {
                  if (r._id && r._id.startsWith("local-")) {
                    const mockBiz = MOCK_BUSINESSES.find((b) => b.slug === slug);

                    const mediaList: ReviewMedia[] = [];
                    if (r.videos && r.videos.length > 0) {
                      r.videos.forEach((v: string) => mediaList.push({ url: v, type: 'video' }));
                    }
                    if (r.images && r.images.length > 0) {
                      r.images.forEach((img: string) => mediaList.push({ url: img, type: 'image' }));
                    }
                    if (mediaList.length === 0 && r.image) {
                      mediaList.push({ url: r.image, type: 'image' });
                    }
                    if (mediaList.length === 0 && mockBiz?.images && mockBiz.images.length > 0) {
                      mockBiz.images.forEach((img: string) => mediaList.push({ url: img, type: 'image' }));
                    }
                    if (mediaList.length === 0) {
                      const nameLower = (mockBiz?.name || "").toLowerCase();
                      if (nameLower.includes("restaurant") || nameLower.includes("lavash") || nameLower.includes("cafe")) {
                        mediaList.push({ url: "https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=800&auto=format&fit=crop&q=80", type: 'image' });
                      } else if (nameLower.includes("farm") || nameLower.includes("produce") || nameLower.includes("organic")) {
                        mediaList.push({ url: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=800&auto=format&fit=crop&q=80", type: 'image' });
                      } else {
                        mediaList.push({ url: "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=800&auto=format&fit=crop&q=80", type: 'image' });
                      }
                    }

                    localReviews.push({
                      id: r._id,
                      user: {
                        name: r.authorName || "Anonymous User",
                        initials: getInitials(r.authorName || "Anonymous User"),
                      },
                      biz: {
                        name: mockBiz?.name || "Local Business",
                        slug: slug,
                        address: mockBiz?.address || "Armenia",
                        city: mockBiz?.city || "",
                      },
                      time: timeAgo(r.createdAt),
                      createdAt: r.createdAt,
                      media: mediaList,
                      rating: r.rating || 5,
                      likes: r.helpfulCount || 0,
                      caption: r.comment || "",
                      businessId: mockBiz?.id || "local-biz",
                    });
                  }
                });
              }
            }
          }
        }
      } catch (err) {
        console.warn("Failed to load local storage reviews", err);
      }

      // Combine and sort user-written reviews by date
      const userReviews = [...backendReviews, ...localReviews];
      userReviews.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      // Merge user reviews with fallback reviews
      const merged: ReviewCardData[] = [...userReviews];

      FALLBACK_REVIEWS.forEach((fallback) => {
        if (merged.length < 6) {
          const hasDuplicate = merged.some((m) => m.biz.slug === fallback.biz.slug);
          if (!hasDuplicate) {
            merged.push(fallback);
          }
        }
      });

      if (merged.length < 3) {
        FALLBACK_REVIEWS.forEach((f) => {
          if (!merged.some((m) => m.id === f.id)) {
            merged.push(f);
          }
        });
      }

      setReviews(merged);

      // initialize liked map
      const initialLikedMap: Record<string, { liked: boolean; count: number }> = {};
      merged.forEach((r) => {
        initialLikedMap[r.id] = { liked: false, count: r.likes };
      });
      setLikedMap(initialLikedMap);
      setLoading(false);
    }

    loadReviews();
  }, []);

  const handleLike = async (reviewId: string, businessId: string) => {
    const isLiked = likedMap[reviewId]?.liked;
    const currentCount = likedMap[reviewId]?.count ?? 0;

    // Toggle state locally
    setLikedMap((prev) => ({
      ...prev,
      [reviewId]: {
        liked: !isLiked,
        count: isLiked ? currentCount - 1 : currentCount + 1,
      },
    }));

    // Trigger scale animation
    setAnimateMap((prev) => ({ ...prev, [reviewId]: true }));
    setTimeout(() => {
      setAnimateMap((prev) => ({ ...prev, [reviewId]: false }));
    }, 300);

    // Call API helper endpoint (only if it's a real backend business)
    if (businessId && !businessId.startsWith("mock-")) {
      try {
        const api = getApiUrl();
        await axios.post(`${api}/businesses/${businessId}/reviews/${reviewId}/helpful`);
      } catch (err) {
        // Optimistic update - ignore error
      }
    }
  };

  if (loading) {
    return (
      <section className="py-16 sm:py-24 border-t border-[hsl(var(--border))]">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 text-center">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--muted-foreground))] mb-3" />
            <p className="text-sm text-[hsl(var(--muted-foreground))]">{t.reviewsFeed?.loading || "Loading reviews feed..."}</p>
          </div>
        </div>
      </section>
    );
  }

  const filteredReviews = filterRating === null ? reviews : reviews.filter(r => r.rating === filterRating);

  return (
    <section className="py-16 sm:py-24 border-t border-[hsl(var(--border))]">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="mb-12">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-2 text-[hsl(var(--foreground))]">{t.reviewsFeed?.title || "Reviews"}</h2>
          <p className="text-base text-[hsl(var(--muted-foreground))]">{t.reviewsFeed?.subtitle || "Explore feedback and photos shared by customers in Armenia"}</p>
          
          <div className="flex flex-wrap items-center gap-2 mt-6">
            <span className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Filter by rating:</span>
            {[5, 4, 3, 2, 1].map(star => (
              <button
                key={star}
                onClick={() => {
                  setFilterRating(filterRating === star ? null : star);
                  setShowAll(false);
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                  filterRating === star 
                    ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] border-[hsl(var(--primary))]" 
                    : "bg-[hsl(var(--card))] text-[hsl(var(--foreground))] border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]"
                }`}
              >
                {star} <span style={{ color: "#F4B942" }}>★</span>
              </button>
            ))}
            {filterRating !== null && (
              <button
                onClick={() => {
                  setFilterRating(null);
                  setShowAll(false);
                }}
                className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] underline ml-2"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 justify-items-center">
          {(showAll ? filteredReviews : filteredReviews.slice(0, 6)).map((review) => {
            const reviewLiked = likedMap[review.id]?.liked ?? false;
            const reviewLikesCount = likedMap[review.id]?.count ?? review.likes;
            const isAnimating = animateMap[review.id] ?? false;
            const isHeartPopping = heartPopMap[review.id] ?? false;
            const currentMediaIndex = mediaIndexMap[review.id] ?? 0;
            const isUnmuted = unmutedMap[review.id] ?? false;

            return (
              <div
                key={review.id}
                className="w-full max-w-[360px] bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-[12px] flex flex-col overflow-hidden transition-all duration-300"
              >
                {/* Header */}
                <div className="flex items-center gap-3 p-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[1.5px]">
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-[hsl(var(--card))] p-[1.5px]">
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-[hsl(var(--muted))] text-[10px] font-bold text-[hsl(var(--foreground))] uppercase">
                        {review.user.initials || "U"}
                      </div>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col text-left">
                    <span className="text-[13px] font-bold text-[hsl(var(--foreground))] truncate leading-tight">
                      {review.user.name}
                    </span>
                    <Link
                      href={`/business/${review.biz.slug}`}
                      className="text-[11px] text-[hsl(var(--muted-foreground))] truncate leading-tight hover:underline hover:text-[hsl(var(--foreground))]"
                    >
                      {review.biz.name} {review.biz.city ? `(${review.biz.city})` : ""}
                    </Link>
                  </div>
                  <span className="text-[11px] text-[hsl(var(--muted-foreground))] self-start mt-0.5 shrink-0 ml-auto">
                    {review.time}
                  </span>
                </div>

                {/* Main 1:1 Photo / Carousel */}
                <div
                  className="relative w-full aspect-square bg-[hsl(var(--muted))] overflow-hidden border-y border-[hsl(var(--border))] cursor-pointer group"
                  onDoubleClick={() => {
                    setHeartPopMap((prev) => ({ ...prev, [review.id]: true }));
                    setTimeout(() => {
                      setHeartPopMap((prev) => ({ ...prev, [review.id]: false }));
                    }, 800);
                    
                    const isLiked = likedMap[review.id]?.liked;
                    if (!isLiked) {
                      handleLike(review.id, review.businessId);
                    }
                  }}
                >
                  <div 
                    className="flex w-full h-full transition-transform duration-300 ease-in-out"
                    style={{ transform: `translateX(-${currentMediaIndex * 100}%)` }}
                  >
                    {review.media.map((item, idx) => (
                      <div key={idx} className="w-full h-full shrink-0 relative">
                        {item.type === 'video' ? (
                          <video
                            src={item.url}
                            className="w-full h-full object-cover select-none transition-transform duration-500 group-active:scale-95"
                            autoPlay
                            loop
                            muted={!isUnmuted}
                            playsInline
                          />
                        ) : (
                          <img
                            src={item.url}
                            alt={`${review.biz.name} review`}
                            className="w-full h-full object-cover select-none transition-transform duration-500 group-active:scale-95"
                            loading="lazy"
                          />
                        )}
                        {/* Video Mute Toggle */}
                        {item.type === 'video' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setUnmutedMap((prev) => ({ ...prev, [review.id]: !isUnmuted }));
                            }}
                            className="absolute bottom-3 right-3 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-20"
                          >
                            {isUnmuted ? <Volume2 size={16} /> : <VolumeX size={16} />}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Carousel Controls */}
                  {review.media.length > 1 && (
                    <>
                      {currentMediaIndex > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMediaIndexMap((prev) => ({ ...prev, [review.id]: currentMediaIndex - 1 }));
                          }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/70 hover:bg-white text-black shadow-sm z-20 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <ChevronLeft size={20} />
                        </button>
                      )}
                      {currentMediaIndex < review.media.length - 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMediaIndexMap((prev) => ({ ...prev, [review.id]: currentMediaIndex + 1 }));
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/70 hover:bg-white text-black shadow-sm z-20 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <ChevronRight size={20} />
                        </button>
                      )}
                      {/* Dots */}
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                        {review.media.map((_, idx) => (
                          <div 
                            key={idx} 
                            className={`w-1.5 h-1.5 rounded-full transition-all ${
                              idx === currentMediaIndex ? "bg-[#0095f6]" : "bg-white/60"
                            }`} 
                          />
                        ))}
                      </div>
                    </>
                  )}

                  {/* Heart pop animation */}
                  <div 
                    className={`absolute inset-0 flex items-center justify-center pointer-events-none z-30 transition-all duration-500 ease-out ${
                      isHeartPopping ? "opacity-90 scale-125" : "opacity-0 scale-50"
                    }`}
                  >
                    <Heart 
                      className="text-white fill-white drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]" 
                      size={96} 
                    />
                  </div>
                </div>

                {/* Footer Interactions & Stars */}
                <div className="p-3.5 flex flex-col gap-2.5">
                  {/* Actions Bar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleLike(review.id, review.businessId)}
                        className={`p-1 select-none transition-transform duration-200 ${isAnimating ? "scale-125" : "active:scale-90"
                          }`}
                        aria-label={reviewLiked ? "Unlike" : "Like"}
                      >
                        <Heart
                          className={`h-5 w-5 transition-colors ${reviewLiked
                            ? "fill-pink-500 text-pink-500"
                            : "text-[hsl(var(--foreground))]"
                            }`}
                        />
                      </button>
                      <span className="text-[13px] font-semibold text-[hsl(var(--foreground))] ml-1">
                        {reviewLikesCount} {reviewLikesCount === 1 ? "like" : "likes"}
                      </span>
                    </div>

                    {/* Gold Star rating (gold colored #F4B942) */}
                    <div className="flex gap-0.5 text-[15px] select-none leading-none">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          style={{
                            color: star <= review.rating ? "#F4B942" : "#e2e8f0",
                          }}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Caption */}
                  <div className="text-left">
                    <p className="text-[13px] text-[hsl(var(--foreground))] leading-normal line-clamp-3">
                      <span className="font-bold mr-1.5">{review.user.name}</span>
                      {review.caption}
                    </p>
                  </div>

                  {/* Optional address field for wow-effect */}
                  <div className="text-left text-[11px] text-[hsl(var(--muted-foreground))] border-t border-[hsl(var(--border))] pt-2 mt-1 truncate">
                    📍 {review.biz.address}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {filteredReviews.length > 6 && !showAll && (
          <div className="flex justify-center mt-12 animate-fade-in">
            <button
              onClick={() => setShowAll(true)}
              className="px-6 py-3 border border-[hsl(var(--border))] rounded-full text-sm font-semibold text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-all duration-200 active:scale-95 shadow-sm"
            >
              {t.reviewsFeed?.showMore || "Show More"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
