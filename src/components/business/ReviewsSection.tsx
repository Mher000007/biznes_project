"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Star, ThumbsUp, MessageSquare, CheckCircle, AlertCircle, Loader2, User, Camera, X, Upload } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { getApiUrl } from "@/lib/utils";
import { useI18n } from "@/i18n";
import styles from "./ReviewsSection.module.scss";

interface Review {
  _id: string;
  author: { _id: string; name: string; avatar?: string } | null;
  authorName: string;
  rating: number;
  comment: string;
  isVerified: boolean;
  helpfulCount: number;
  createdAt: string;
  image?: string;
  images?: string[];
  videos?: string[];
}

interface ReviewsSectionProps {
  businessId: string;              // MongoDB ObjectId (24-char hex)
  businessSlug: string;            // used for localStorage fallback
  initialRating?: number;
  initialReviewCount?: number;
  onRatingUpdate?: (rating: number, reviewCount: number) => void;
}

// ─── Star display helper ──────────────────────────────────────────────────────
function StarRow({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className={styles.starRow}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          style={{ width: size, height: size }}
          className={s <= Math.round(value) ? styles.starFilled : styles.starEmpty}
        />
      ))}
    </span>
  );
}

// ─── Relative time ────────────────────────────────────────────────────────────
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

// ─── Avatar initials ──────────────────────────────────────────────────────────
function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return <div className={styles.avatar}>{initials || <User size={14} />}</div>;
}

// ─── Rating distribution bar ──────────────────────────────────────────────────
function RatingBar({ count, total }: { count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className={styles.ratingBar}>
      <div className={styles.ratingBarFill} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── Seeded reviews helper ───────────────────────────────────────────────────
function getSeededReviews(slug: string): Review[] {
  const now = new Date();
  const date1 = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(); // 2 days ago
  const date2 = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(); // 5 days ago
  const date3 = new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(); // 12 days ago

  if (slug === "lavash-restaurant-group") {
    return [
      {
        _id: "seed-lavash-1",
        author: { _id: "u1", name: "Anahit Sargsyan" },
        authorName: "Anahit Sargsyan",
        rating: 5,
        comment: "Amazing traditional food! The lavash is always hot and fresh, and the khorovats was perfectly cooked. Excellent service too.",
        isVerified: true,
        helpfulCount: 14,
        createdAt: date1
      },
      {
        _id: "seed-lavash-2",
        author: { _id: "u2", name: "Aram Grigoryan" },
        authorName: "Aram Grigoryan",
        rating: 5,
        comment: "Best restaurant in Yerevan for traditional Armenian cuisine. The basturma and khachapuri are outstanding. Highly recommended!",
        isVerified: true,
        helpfulCount: 8,
        createdAt: date2
      },
      {
        _id: "seed-lavash-3",
        author: { _id: "u3", name: "Sarah Connor" },
        authorName: "Sarah Connor",
        rating: 4,
        comment: "Great atmosphere and delicious food. The seating area is beautiful. Service can be a bit slow during weekend peak hours, but overall a great experience.",
        isVerified: false,
        helpfulCount: 3,
        createdAt: date3
      }
    ];
  } else if (slug === "armstone-materials") {
    return [
      {
        _id: "seed-stone-1",
        author: { _id: "u4", name: "Gevorg Harutyunyan" },
        authorName: "Gevorg Harutyunyan",
        rating: 5,
        comment: "Outstanding tufa and basalt quality. We ordered in bulk for our home facade and they delivered on time with perfect specifications.",
        isVerified: true,
        helpfulCount: 9,
        createdAt: date1
      },
      {
        _id: "seed-stone-2",
        author: { _id: "u5", name: "Tigran Abrahamyan" },
        authorName: "Tigran Abrahamyan",
        rating: 4,
        comment: "Good service and competitive pricing. The stones were cut precisely. Minor delay in transport, but customer support was very helpful.",
        isVerified: true,
        helpfulCount: 2,
        createdAt: date2
      }
    ];
  } else if (slug === "ararat-organic-farms") {
    return [
      {
        _id: "seed-farms-1",
        author: { _id: "u6", name: "Mariam Davtyan" },
        authorName: "Mariam Davtyan",
        rating: 5,
        comment: "The sweetest peaches and fresh herbs! We buy wholesale for our market chain and our customers love the organic quality from Ararat.",
        isVerified: true,
        helpfulCount: 7,
        createdAt: date1
      },
      {
        _id: "seed-farms-2",
        author: { _id: "u7", name: "John Doe" },
        authorName: "John Doe",
        rating: 4,
        comment: "Excellent organic vegetables. They supply our cafe and the freshness is always top-notch. Highly recommended organic supplier.",
        isVerified: false,
        helpfulCount: 1,
        createdAt: date2
      }
    ];
  } else if (slug === "elite-build-materials") {
    return [
      {
        _id: "seed-elite-1",
        author: { _id: "u8", name: "Karen Karapetyan" },
        authorName: "Karen Karapetyan",
        rating: 5,
        comment: "A huge selection of construction tools and dry mixes. They offer great wholesale discounts for contractors. Very reliable partner.",
        isVerified: true,
        helpfulCount: 11,
        createdAt: date1
      },
      {
        _id: "seed-elite-2",
        author: { _id: "u9", name: "Narek Simonyan" },
        authorName: "Narek Simonyan",
        rating: 4,
        comment: "Good price range for power tool rentals. The mixers were in great condition. Smooth return process.",
        isVerified: true,
        helpfulCount: 4,
        createdAt: date2
      }
    ];
  }
  return [];
}

// ─── Mathematical rating distributor helper ──────────────────────────────────
function calculateMockDistribution(total: number, avg: number): Record<number, number> {
  const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  if (total <= 0) return dist;

  if (avg >= 4.7) {
    dist[5] = Math.round(total * 0.85);
    dist[4] = Math.round(total * 0.12);
    dist[3] = Math.round(total * 0.03);
  } else if (avg >= 4.5) {
    dist[5] = Math.round(total * 0.70);
    dist[4] = Math.round(total * 0.20);
    dist[3] = Math.round(total * 0.08);
    dist[2] = Math.round(total * 0.02);
  } else if (avg >= 4.0) {
    dist[5] = Math.round(total * 0.50);
    dist[4] = Math.round(total * 0.35);
    dist[3] = Math.round(total * 0.10);
    dist[2] = Math.round(total * 0.04);
    dist[1] = Math.round(total * 0.01);
  } else {
    dist[5] = Math.round(total * 0.30);
    dist[4] = Math.round(total * 0.30);
    dist[3] = Math.round(total * 0.20);
    dist[2] = Math.round(total * 0.15);
    dist[1] = Math.round(total * 0.05);
  }

  // Adjust sum due to rounding
  const sum = dist[1] + dist[2] + dist[3] + dist[4] + dist[5];
  const diff = total - sum;
  if (diff !== 0) {
    dist[5] = Math.max(0, dist[5] + diff);
  }

  return dist;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ReviewsSection({
  businessId,
  businessSlug,
  initialRating = 0,
  initialReviewCount = 0,
  onRatingUpdate
}: ReviewsSectionProps) {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const { t, locale } = useI18n();
  const isBackend = /^[0-9a-fA-F]{24}$/.test(businessId);

  // ── state ──
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [comment, setComment] = useState("");
  const [commentLength, setCommentLength] = useState(0);
  const MAX_CHARS = 1000;

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [helpfulSet, setHelpfulSet] = useState<Set<string>>(new Set());
  const [mediaFiles, setMediaFiles] = useState<{ url: string; type: 'image' }[]>([]);
  const [imageUploading, setImageUploading] = useState(false);
  const [guestName, setGuestName] = useState(currentUser?.name || currentUser?.username || "");

  // Update guestName if currentUser loads asynchronously
  useEffect(() => {
    const userDisplayName = currentUser?.name || currentUser?.username;
    if (userDisplayName && guestName !== userDisplayName) {
      setGuestName(userDisplayName);
    }
  }, [currentUser, guestName]);

  const handleMediaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (mediaFiles.length + files.length > 5) {
      setSubmitError("You can upload a maximum of 5 files.");
      return;
    }

    setImageUploading(true);

    try {
      const newMedia: { url: string; type: 'image' }[] = [];
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          throw new Error("Only images are allowed");
        }
        if (file.size > 15 * 1024 * 1024) {
          throw new Error("Image size must be less than 15MB");
        }

        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              let width = img.width;
              let height = img.height;
              const max_size = 1024;
              
              if (width > height && width > max_size) {
                height *= max_size / width;
                width = max_size;
              } else if (height > max_size) {
                width *= max_size / height;
                height = max_size;
              }
              
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.onerror = () => reject(new Error("Failed to process image"));
            if (event.target?.result) {
              img.src = event.target.result as string;
            }
          };
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(file);
        });

        newMedia.push({
          url: dataUrl,
          type: 'image'
        });
      }

      setMediaFiles(prev => [...prev, ...newMedia]);
      setSubmitError("");
    } catch (err: any) {
      setSubmitError(err.message || "Failed to process files");
    } finally {
      setImageUploading(false);
      e.target.value = '';
    }
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  // rating summary
  const [avgRating, setAvgRating] = useState(initialRating);
  const [reviewCount, setReviewCount] = useState(initialReviewCount);
  const [distribution, setDistribution] = useState<Record<number, number>>({
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
  });

  // ── fetch reviews ──
  const fetchReviews = useCallback(async (p = 1) => {
    if (!isBackend) return;
    setLoading(true);
    try {
      const apiURL = getApiUrl();
      const res = await axios.get(
        `${apiURL}/businesses/${businessId}/reviews?page=${p}&limit=3`
      );
      if (res.data?.success) {
        setReviews(res.data.data);
        setTotalPages(res.data.pagination?.total ?? 1);
        setPage(p);

        if (res.data.distribution) {
          setDistribution(res.data.distribution);
        }
      }
    } catch (err) {
      console.warn("Could not load reviews", err);
    } finally {
      setLoading(false);
    }
  }, [businessId, isBackend]);

  // Fallback localStorage reviews for mock/local businesses
  const loadLocalReviews = useCallback(() => {
    try {
      const raw = localStorage.getItem(`armbiz-reviews-${businessSlug}`);
      let parsed: Review[] = [];
      if (raw) {
        parsed = JSON.parse(raw);
      } else {
        parsed = getSeededReviews(businessSlug);
        if (parsed.length > 0) {
          localStorage.setItem(`armbiz-reviews-${businessSlug}`, JSON.stringify(parsed));
        }
      }

      setReviews(parsed);

      // Distinguish user-added reviews (IDs starting with "local-")
      const userAddedReviews = parsed.filter(r => r._id.startsWith("local-"));
      const userReviewsCount = userAddedReviews.length;

      // Calculate total count: initial count + user reviews
      const totalCount = initialReviewCount + userReviewsCount;

      // Calculate weighted average
      let calculatedAvg = initialRating;
      if (totalCount > 0) {
        const userSum = userAddedReviews.reduce((sum, r) => sum + r.rating, 0);
        calculatedAvg = ((initialRating * initialReviewCount) + userSum) / totalCount;
        calculatedAvg = Math.round(calculatedAvg * 10) / 10;
      }

      setAvgRating(calculatedAvg);
      setReviewCount(totalCount);
      onRatingUpdate?.(calculatedAvg, totalCount);

      // Compute distribution: base distribution from initial counts + user reviews
      const baseDist = calculateMockDistribution(initialReviewCount, initialRating);
      userAddedReviews.forEach(r => {
        if (r.rating >= 1 && r.rating <= 5) {
          baseDist[r.rating] = (baseDist[r.rating] || 0) + 1;
        }
      });
      setDistribution(baseDist);
      setTotalPages(Math.ceil(parsed.length / 3) || 1);
    } catch { /* ignore */ }
  }, [businessSlug, initialRating, initialReviewCount, onRatingUpdate]);

  useEffect(() => {
    setTimeout(() => {
      if (isBackend) {
        fetchReviews(1);
      } else {
        loadLocalReviews();
        setPage(1);
      }
    }, 1500);
  }, [businessId, isBackend, fetchReviews, loadLocalReviews]);

  // Sync initial counts when props change
  useEffect(() => { setAvgRating(initialRating); }, [initialRating]);
  useEffect(() => { setReviewCount(initialReviewCount); }, [initialReviewCount]);

  // ── submit review ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    if (!selectedRating) { setSubmitError("Please choose a star rating."); return; }
    if (comment.trim().length < 10) { setSubmitError("Comment must be at least 10 characters."); return; }
    // Note: photos are optional — don't block submission if no files uploaded

    setSubmitting(true);

    if (isBackend) {
      try {
        const token = localStorage.getItem("token");
        if (!token && (!guestName || guestName.trim().length < 2)) {
          setSubmitError("Please enter your name (minimum 2 characters).");
          setSubmitting(false);
          return;
        }

        const apiURL = getApiUrl();
        const headers: any = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const images = mediaFiles
          .filter(m => m.type === 'image')
          .map(m => m.url);
        const videos = mediaFiles
          .filter(m => (m as any).type === 'video')
          .map(m => m.url);

        const res = await axios.post(
          `${apiURL}/businesses/${businessId}/reviews`,
          {
            rating: selectedRating,
            comment: comment.trim(),
            images: images.length > 0 ? images : undefined,
            videos: videos.length > 0 ? videos : undefined,
            authorName: guestName.trim() || undefined
          },
          { headers }
        );

        if (res.data?.success) {
          const newReview = res.data.data as Review;
          const enrichedReview = {
            ...newReview,
            authorName: currentUser?.name || currentUser?.username || guestName.trim() || "Anonymous",
            userUsername: currentUser?.username || "",
            userEmail: currentUser?.email || "",
            businessSlug: businessSlug,
            rating: selectedRating,
            comment: comment.trim(),
            images: images.length > 0 ? images : (newReview.images || undefined),
            createdAt: newReview.createdAt || new Date().toISOString(),
          };

          setReviews((prev) => [enrichedReview, ...prev]);
          setReviewCount((c) => c + 1);

          try {
            if (currentUser) {
              const userReviewsStr = localStorage.getItem("armbiz_user_reviews");
              const userReviews = userReviewsStr ? JSON.parse(userReviewsStr) : [];
              if (!userReviews.some((r: any) => r._id === enrichedReview._id)) {
                userReviews.unshift(enrichedReview);
                localStorage.setItem("armbiz_user_reviews", JSON.stringify(userReviews));
              }
            }
            window.dispatchEvent(new Event("reviewsUpdated"));
          } catch { /* ignore */ }

          // Recalculate avg
          const newAvg = ((avgRating * (reviewCount)) + selectedRating) / (reviewCount + 1);
          const rounded = Math.round(newAvg * 10) / 10;
          setAvgRating(rounded);
          onRatingUpdate?.(rounded, reviewCount + 1);

          // Update distribution locally
          setDistribution((prev) => ({
            ...prev,
            [selectedRating]: (prev[selectedRating] || 0) + 1,
          }));

          setSubmitSuccess(true);
          setSelectedRating(0);
          setComment("");
          setCommentLength(0);
          setMediaFiles([]);
          setGuestName("");
          setTimeout(() => setSubmitSuccess(false), 3500);
        }
      } catch (err: any) {
        const msg = err.response?.data?.message || "Something went wrong. Please try again.";
        setSubmitError(msg);
      }
    } else {
      // localStorage fallback for mock businesses
      const images = mediaFiles.filter(m => m.type === 'image').map(m => m.url);
      const videos = mediaFiles.filter(m => (m as any).type === 'video').map(m => m.url);

      const newReview: Review & { userUsername?: string; userEmail?: string; businessSlug?: string; businessName?: string } = {
        _id: `local-${Date.now()}`,
        author: currentUser ? { _id: String((currentUser as any)._id || (currentUser as any).id || "user"), name: currentUser.name || currentUser.username || "Anonymous" } : null,
        authorName: currentUser?.name || currentUser?.username || guestName.trim() || "Anonymous",
        userUsername: currentUser?.username || "",
        userEmail: currentUser?.email || "",
        businessSlug: businessSlug,
        rating: selectedRating,
        comment: comment.trim(),
        isVerified: false,
        helpfulCount: 0,
        createdAt: new Date().toISOString(),
        images: images.length > 0 ? images : undefined,
        videos: videos.length > 0 ? videos : undefined,
      };
      let updated: Review[] = [];
      const existingIdx = reviews.findIndex(
        (r) =>
          r._id.startsWith("local-") &&
          (r.authorName === newReview.authorName ||
            (newReview.userUsername && (r as any).userUsername === newReview.userUsername))
      );

      if (existingIdx !== -1) {
        updated = [...reviews];
        updated[existingIdx] = {
          ...updated[existingIdx],
          ...newReview,
          _id: updated[existingIdx]._id,
        };
      } else {
        updated = [newReview, ...reviews];
      }

      setReviews(updated);
      try {
        localStorage.setItem(`armbiz-reviews-${businessSlug}`, JSON.stringify(updated));
        if (currentUser) {
          const userReviewsStr = localStorage.getItem("armbiz_user_reviews");
          let userReviews: any[] = userReviewsStr ? JSON.parse(userReviewsStr) : [];
          const uIdx = userReviews.findIndex((r) => r.businessSlug === businessSlug);
          if (uIdx !== -1) {
            userReviews[uIdx] = { ...userReviews[uIdx], ...newReview, _id: userReviews[uIdx]._id };
          } else {
            userReviews.unshift(newReview);
          }
          localStorage.setItem("armbiz_user_reviews", JSON.stringify(userReviews));
        }
        window.dispatchEvent(new Event("reviewsUpdated"));
      } catch { /* ignore */ }

      // Recalculate based on initial data + all user-added reviews
      const userAdded = updated.filter(r => r._id.startsWith("local-"));
      const userCount = userAdded.length;
      const totalCount = initialReviewCount + userCount;
      const userSum = userAdded.reduce((sum, r) => sum + r.rating, 0);
      const rounded = Math.round((((initialRating * initialReviewCount) + userSum) / totalCount) * 10) / 10;

      setAvgRating(rounded);
      setReviewCount(totalCount);
      onRatingUpdate?.(rounded, totalCount);

      // Update distribution
      const baseDist = calculateMockDistribution(initialReviewCount, initialRating);
      userAdded.forEach(r => {
        if (r.rating >= 1 && r.rating <= 5) {
          baseDist[r.rating] = (baseDist[r.rating] || 0) + 1;
        }
      });
      setDistribution(baseDist);

      setSubmitSuccess(true);
      setSelectedRating(0);
      setComment("");
      setCommentLength(0);
      setMediaFiles([]);
      setTimeout(() => setSubmitSuccess(false), 3500);
    }

    setSubmitting(false);
  };

  // ── helpful ──
  const handleHelpful = async (reviewId: string) => {
    if (!currentUser) {
      showToast();
      return;
    }
    if (helpfulSet.has(reviewId)) return;
    setHelpfulSet((prev) => new Set([...prev, reviewId]));
    setReviews((prev) =>
      prev.map((r) => (r._id === reviewId ? { ...r, helpfulCount: r.helpfulCount + 1 } : r))
    );

    if (isBackend) {
      try {
        const apiURL = getApiUrl();
        await axios.post(`${apiURL}/businesses/${businessId}/reviews/${reviewId}/helpful`);
      } catch { /* optimistic – ignore error */ }
    }
  };


  return (
    <section className={styles.section}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <MessageSquare className={styles.headerIcon} />
        <h2 className={styles.title}>{t.reviewsSection?.title || "Reviews & Ratings"}</h2>
      </div>

      {/* ── Summary ── */}
      <div className={styles.summary}>
        <div className={styles.summaryLeft}>
          <span className={styles.bigRating}>{avgRating > 0 ? avgRating.toFixed(1) : "–"}</span>
          <StarRow value={avgRating} size={22} />
          <span className={styles.reviewMeta}>
            {reviewCount} {t.business?.reviews || "reviews"}
          </span>
        </div>
        <div className={styles.summaryRight}>
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className={styles.distRow}>
              <span className={styles.distLabel}>{star}</span>
              <Star size={12} className={styles.distStar} />
              <RatingBar count={distribution[star] ?? 0} total={reviewCount} />
              <span className={styles.distCount}>{distribution[star] ?? 0}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.contentWrapper}>
        {/* ── Write Review Form ── */}
        <div className={styles.formColumn}>
          <div className={styles.formCard}>
            <h3 className={styles.formTitle}>{t.reviewsSection?.writeReview || "Write a Review"}</h3>

            {submitSuccess ? (
              <div className={styles.successBanner}>
                <CheckCircle size={18} />
                Your review has been submitted! Thank you for your feedback.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={styles.form} noValidate>
                <div className={styles.guestNameField}>
                  <label className={styles.label} htmlFor="guest-name">
                    {t.reviewsSection?.yourName || "Your Name *"}
                    {currentUser && (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-normal ml-2">
                        ({locale === "hy" ? "Մուտք գործված հաշիվ" : locale === "ru" ? "Авторизоваն" : "Logged in"})
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    id="guest-name"
                    value={guestName}
                    placeholder={t.reviewsSection?.enterName || "Enter your name"}
                    onChange={(e) => setGuestName(e.target.value)}
                    className={`${styles.inputField} ${
                      currentUser ? "opacity-80 cursor-not-allowed bg-[hsl(var(--muted))]/50" : ""
                    }`}
                    disabled={Boolean(currentUser)}
                    readOnly={Boolean(currentUser)}
                    required
                  />
                </div>

                {/* Star selector */}
                <div className={styles.starSelector}>
                  <label className={styles.label}>{t.reviewsSection?.yourRating || "Your Rating *"}</label>
                  <div className={styles.starButtons}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={styles.starBtn}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setSelectedRating(star)}
                        aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                      >
                        <Star
                          size={28}
                          className={`${styles.starIcon} ${star <= (hoverRating || selectedRating)
                            ? styles.starActive
                            : styles.starInactive
                            }`}
                        />
                      </button>
                    ))}
                    {selectedRating > 0 && (
                      <span className={styles.ratingLabel}>
                        {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][selectedRating]}
                      </span>
                    )}
                  </div>
                </div>

                {/* Comment textarea */}
                <div className={styles.commentField}>
                  <label className={styles.label} htmlFor="review-comment">
                    {t.reviewsSection?.yourReview || "Your Review *"}
                  </label>
                  <textarea
                    id="review-comment"
                    rows={4}
                    value={comment}
                    maxLength={MAX_CHARS}
                    placeholder={t.reviewsSection?.reviewPlaceholder || "Share your honest experience with this business. What did you like? What could be improved? (minimum 10 characters)"}
                    onChange={(e) => {
                      setComment(e.target.value);
                      setCommentLength(e.target.value.length);
                    }}
                    className={styles.textarea}
                    required
                  />
                  <div className={styles.charCount}>
                    <span className={commentLength > MAX_CHARS * 0.9 ? styles.charWarn : ""}>
                      {commentLength}
                    </span>
                    /{MAX_CHARS}
                  </div>
                </div>

                {/* Image/Video upload */}
                <div className={styles.imageUploadField}>
                  <label className={styles.label}>{t.reviewsSection?.addPhoto || "Add Photo * (Required, Max 5)"}</label>
                  <div className={styles.fileInputWrapper} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {/* Take Photo Button */}
                    <label className={styles.uploadTriggerBtn} style={{ flex: 1, justifyContent: 'center' }}>
                      <Camera size={16} />
                      {imageUploading ? "Processing..." : "Take Photo"}
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleMediaChange}
                        className={styles.fileInputHidden}
                        disabled={imageUploading || mediaFiles.length >= 5}
                      />
                    </label>

                    {/* Upload from Gallery Button */}
                    <label className={styles.uploadTriggerBtn} style={{ flex: 1, justifyContent: 'center' }}>
                      <Upload size={16} />
                      {imageUploading ? "Processing..." : "Upload Gallery"}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleMediaChange}
                        className={styles.fileInputHidden}
                        disabled={imageUploading || mediaFiles.length >= 5}
                      />
                    </label>

                    {mediaFiles.length > 0 && (
                      <div className={styles.mediaPreviewGrid} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
                        {mediaFiles.map((media, index) => (
                          <div key={index} className={styles.imagePreviewContainer} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}>
                            {(media as any).type === 'video' ? (
                              <video src={media.url} className={styles.previewImage} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                            ) : (
                              <img src={media.url} alt={`Preview ${index}`} className={styles.previewImage} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                            )}
                            <button
                              type="button"
                              onClick={() => removeMedia(index)}
                              className={styles.removePreviewBtn}
                              title="Remove photo"
                              style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ef4444', color: '#ffffff', borderRadius: '50%', border: '2px solid #ffffff', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', zIndex: 10 }}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Error */}
                {submitError && (
                  <div className={styles.errorBanner}>
                    <AlertCircle size={16} />
                    {submitError}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className={styles.submitBtn}
                  id="submit-review-btn"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className={styles.spin} />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <Star size={16} />
                      {t.reviewsSection?.submitReview || "Submit Review"}
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ── Review List ── */}
        <div className={styles.listColumn}>
          <div className={styles.list}>
            {loading && (
              <div className={styles.loadingRow}>
                <Loader2 size={20} className={styles.spin} />
                {locale === 'hy' ? "Բեռնվում են կարծիքները..." : "Loading reviews…"}
              </div>
            )}

            {!loading && reviews.length === 0 && (
              <div className={styles.emptyState}>
                <MessageSquare size={40} className={styles.emptyIcon} />
                <p>{locale === 'hy' ? "Կարծիքներ դեռ չկան: Եղեք առաջինը, ով կկիսվի իր տպավորություններով:" : "No reviews yet. Be the first to share your experience!"}</p>
              </div>
            )}

            {(!isBackend ? reviews.slice((page - 1) * 3, page * 3) : reviews).map((review, idx) => (
              <div
                key={review._id ? `${review._id}-${idx}` : `rev-${idx}`}
                className={styles.reviewCard}
                style={{ animationDelay: `${idx * 0.06}s` }}
              >
                <div className={styles.reviewHeader}>
                  <Avatar name={review.author?.name || review.authorName} />
                  <div className={styles.reviewMeta2}>
                    <span className={styles.reviewAuthor}>
                      {review.author?.name || review.authorName}
                    </span>
                    {review.isVerified && (
                      <span className={styles.verifiedBadge}>
                        <CheckCircle size={11} /> Verified
                      </span>
                    )}
                    <span className={styles.reviewTime}>{timeAgo(review.createdAt)}</span>
                  </div>
                  <StarRow value={review.rating} size={14} />
                </div>

                <p className={styles.reviewComment}>{review.comment}</p>

                {/* Media Gallery */}
                {(review.image || (review.images && review.images.length > 0) || (review.videos && review.videos.length > 0)) && (
                  <div className={styles.reviewMediaGallery} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                    {/* Fallback for legacy image */}
                    {review.image && !review.images?.length && (
                      <div className={styles.reviewImageContainer} style={{ width: '120px', height: '120px' }}>
                        <img src={review.image} alt="Review upload" className={styles.reviewImage} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                      </div>
                    )}
                    {/* Multiple images */}
                    {review.images?.map((imgUrl, i) => (
                      <div key={`img-${i}`} className={styles.reviewImageContainer} style={{ width: '120px', height: '120px' }}>
                        <img src={imgUrl} alt="Review upload" className={styles.reviewImage} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer' }} onClick={() => window.open(imgUrl, '_blank')} />
                      </div>
                    ))}
                    {/* Multiple videos */}
                    {review.videos?.map((vidUrl, i) => (
                      <div key={`vid-${i}`} className={styles.reviewImageContainer} style={{ width: '120px', height: '120px' }}>
                        <video src={vidUrl} controls className={styles.reviewVideo} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                      </div>
                    ))}
                  </div>
                )}

                <div className={styles.reviewFooter}>
                  <button
                    className={`${styles.helpfulBtn} ${helpfulSet.has(review._id) ? styles.helpfulActive : ""}`}
                    onClick={() => handleHelpful(review._id)}
                    disabled={helpfulSet.has(review._id)}
                    aria-label="Mark as helpful"
                  >
                    <ThumbsUp size={13} />
                    {t.reviewsSection?.helpful || "Helpful"} {review.helpfulCount > 0 && `(${review.helpfulCount})`}
                  </button>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageBtn}
                  onClick={() => {
                    if (isBackend) fetchReviews(page - 1);
                    else setPage(page - 1);
                  }}
                  disabled={page <= 1 || loading}
                >
                  ← Prev
                </button>
                <span className={styles.pageInfo}>
                  {page} / {totalPages}
                </span>
                <button
                  className={styles.pageBtn}
                  onClick={() => {
                    if (isBackend) fetchReviews(page + 1);
                    else setPage(page + 1);
                  }}
                  disabled={page >= totalPages || loading}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
