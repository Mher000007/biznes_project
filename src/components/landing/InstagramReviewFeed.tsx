"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { Heart, Loader2 } from "lucide-react";
import { getApiUrl } from "@/lib/utils";
import { MOCK_BUSINESSES } from "@/data/mock-businesses";

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

interface ReviewCardData {
  id: string;
  user: UserProfile;
  biz: BizProfile;
  time: string;
  img: string;
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
    img: "https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=800&auto=format&fit=crop&q=80",
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
    img: "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=800&auto=format&fit=crop&q=80",
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
    img: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=800&auto=format&fit=crop&q=80",
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
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    async function loadReviews() {
      let backendReviews: ReviewCardData[] = [];
      try {
        const api = getApiUrl();
        // corrected double-path bug (removed extra '/api')
        const res = await axios.get(`${api}/reviews?limit=12`);
        if (res.data?.success && res.data.data?.length > 0) {
          backendReviews = res.data.data.map((r: any) => {
            let imageToShow = r.image;
            if (!imageToShow && r.business?.images?.length > 0) {
              imageToShow = r.business.images[0];
            }
            if (!imageToShow) {
              const nameLower = (r.business?.name || "").toLowerCase();
              if (nameLower.includes("restaurant") || nameLower.includes("lavash") || nameLower.includes("cafe")) {
                imageToShow = "https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=800&auto=format&fit=crop&q=80";
              } else if (nameLower.includes("farm") || nameLower.includes("produce") || nameLower.includes("organic")) {
                imageToShow = "https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=800&auto=format&fit=crop&q=80";
              } else {
                imageToShow = "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=800&auto=format&fit=crop&q=80";
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
              img: imageToShow,
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
                    
                    let imageToShow = r.image;
                    if (!imageToShow && mockBiz?.images && mockBiz.images.length > 0) {
                      imageToShow = mockBiz.images[0];
                    }
                    if (!imageToShow) {
                      const nameLower = (mockBiz?.name || "").toLowerCase();
                      if (nameLower.includes("restaurant") || nameLower.includes("lavash") || nameLower.includes("cafe")) {
                        imageToShow = "https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=800&auto=format&fit=crop&q=80";
                      } else if (nameLower.includes("farm") || nameLower.includes("produce") || nameLower.includes("organic")) {
                        imageToShow = "https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=800&auto=format&fit=crop&q=80";
                      } else {
                        imageToShow = "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=800&auto=format&fit=crop&q=80";
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
                      img: imageToShow,
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
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading reviews feed...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 sm:py-24 border-t border-[hsl(var(--border))]">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="mb-12">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-2 text-[hsl(var(--foreground))]">Browse recent reviews</h2>
          <p className="text-base text-[hsl(var(--muted-foreground))]">Explore feedback and photos shared by customers in Armenia</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 justify-items-center">
          {(showAll ? reviews : reviews.slice(0, 6)).map((review) => {
            const reviewLiked = likedMap[review.id]?.liked ?? false;
            const reviewLikesCount = likedMap[review.id]?.count ?? review.likes;
            const isAnimating = animateMap[review.id] ?? false;

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

                {/* Main 1:1 Photo */}
                <div 
                  className="relative w-full aspect-square bg-[hsl(var(--muted))] overflow-hidden border-y border-[hsl(var(--border))] cursor-pointer group"
                  onDoubleClick={() => {
                    const isLiked = likedMap[review.id]?.liked;
                    if (!isLiked) {
                      handleLike(review.id, review.businessId);
                    }
                  }}
                >
                  <img
                    src={review.img}
                    alt={`${review.biz.name} review`}
                    className="w-full h-full object-cover select-none transition-transform duration-500 group-active:scale-95"
                    loading="lazy"
                  />
                  {/* Optional icon overlay could go here, but this enables the functionality */}
                </div>

                {/* Footer Interactions & Stars */}
                <div className="p-3.5 flex flex-col gap-2.5">
                  {/* Actions Bar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleLike(review.id, review.businessId)}
                        className={`p-1 select-none transition-transform duration-200 ${
                          isAnimating ? "scale-125" : "active:scale-90"
                        }`}
                        aria-label={reviewLiked ? "Unlike" : "Like"}
                      >
                        <Heart
                          className={`h-5 w-5 transition-colors ${
                            reviewLiked
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
        {reviews.length > 6 && !showAll && (
          <div className="flex justify-center mt-12 animate-fade-in">
            <button
              onClick={() => setShowAll(true)}
              className="px-6 py-3 border border-[hsl(var(--border))] rounded-full text-sm font-semibold text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-all duration-200 active:scale-95 shadow-sm"
            >
              Show More
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
