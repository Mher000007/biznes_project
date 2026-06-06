"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Star, ThumbsUp, Trash2, MessageSquare, CheckCircle, AlertCircle, Loader2, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
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

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ReviewsSection({
  businessId,
  businessSlug,
  initialRating = 0,
  initialReviewCount = 0,
  onRatingUpdate,
}: ReviewsSectionProps) {
  const { currentUser } = useAuth();
  const isBackend = businessId.match(/^[0-9a-fA-F]{24}$/);

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
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      const apiURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await axios.get(
        `${apiURL}/businesses/${businessId}/reviews?page=${p}&limit=5`
      );
      if (res.data?.success) {
        setReviews(res.data.data);
        setTotalPages(res.data.pagination?.total ?? 1);
        setPage(p);

        // Rebuild distribution from all reviews (fetch all for accurate bars)
        const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        (res.data.data as Review[]).forEach((r) => {
          if (r.rating >= 1 && r.rating <= 5) dist[r.rating]++;
        });
        setDistribution(dist);
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
      if (raw) {
        const parsed: Review[] = JSON.parse(raw);
        setReviews(parsed);
        const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        parsed.forEach((r) => { if (r.rating >= 1 && r.rating <= 5) dist[r.rating]++; });
        setDistribution(dist);
      }
    } catch { /* ignore */ }
  }, [businessSlug]);

  useEffect(() => {
    if (isBackend) {
      fetchReviews(1);
    } else {
      loadLocalReviews();
    }
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

    setSubmitting(true);

    if (isBackend) {
      try {
        const token = localStorage.getItem("token");
        if (!token) { setSubmitError("You must be logged in to leave a review."); setSubmitting(false); return; }

        const apiURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
        const res = await axios.post(
          `${apiURL}/businesses/${businessId}/reviews`,
          { rating: selectedRating, comment: comment.trim() },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data?.success) {
          const newReview = res.data.data as Review;
          setReviews((prev) => [newReview, ...prev]);
          setReviewCount((c) => c + 1);

          // Recalculate avg
          const newAvg = ((avgRating * (reviewCount)) + selectedRating) / (reviewCount + 1);
          const rounded = Math.round(newAvg * 10) / 10;
          setAvgRating(rounded);
          onRatingUpdate?.(rounded, reviewCount + 1);

          setSubmitSuccess(true);
          setSelectedRating(0);
          setComment("");
          setCommentLength(0);
          setTimeout(() => setSubmitSuccess(false), 3500);
        }
      } catch (err: any) {
        const msg = err.response?.data?.message || "Something went wrong. Please try again.";
        setSubmitError(msg);
      }
    } else {
      // localStorage fallback for mock businesses
      const newReview: Review = {
        _id: `local-${Date.now()}`,
        author: null,
        authorName: currentUser?.name || currentUser?.displayName || "Anonymous",
        rating: selectedRating,
        comment: comment.trim(),
        isVerified: false,
        helpfulCount: 0,
        createdAt: new Date().toISOString(),
      };
      const updated = [newReview, ...reviews];
      setReviews(updated);
      try { localStorage.setItem(`armbiz-reviews-${businessSlug}`, JSON.stringify(updated)); } catch { /* ignore */ }

      const newCount = reviewCount + 1;
      const newAvg = ((avgRating * reviewCount) + selectedRating) / newCount;
      const rounded = Math.round(newAvg * 10) / 10;
      setAvgRating(rounded);
      setReviewCount(newCount);
      onRatingUpdate?.(rounded, newCount);

      setSubmitSuccess(true);
      setSelectedRating(0);
      setComment("");
      setCommentLength(0);
      setTimeout(() => setSubmitSuccess(false), 3500);
    }

    setSubmitting(false);
  };

  // ── helpful ──
  const handleHelpful = async (reviewId: string) => {
    if (helpfulSet.has(reviewId)) return;
    setHelpfulSet((prev) => new Set([...prev, reviewId]));
    setReviews((prev) =>
      prev.map((r) => (r._id === reviewId ? { ...r, helpfulCount: r.helpfulCount + 1 } : r))
    );

    if (isBackend) {
      try {
        const apiURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
        await axios.post(`${apiURL}/businesses/${businessId}/reviews/${reviewId}/helpful`);
      } catch { /* optimistic – ignore error */ }
    }
  };

  // ── delete ──
  const handleDelete = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    setDeletingId(reviewId);

    if (isBackend) {
      try {
        const token = localStorage.getItem("token");
        const apiURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
        await axios.delete(
          `${apiURL}/businesses/${businessId}/reviews/${reviewId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err: any) {
        alert(err.response?.data?.message || "Could not delete review.");
        setDeletingId(null);
        return;
      }
    }

    const toDelete = reviews.find((r) => r._id === reviewId);
    const updated = reviews.filter((r) => r._id !== reviewId);
    setReviews(updated);

    if (!isBackend) {
      try { localStorage.setItem(`armbiz-reviews-${businessSlug}`, JSON.stringify(updated)); } catch { /* ignore */ }
    }

    if (toDelete && reviewCount > 1) {
      const total = avgRating * reviewCount - toDelete.rating;
      const newCount = reviewCount - 1;
      const newAvg = Math.round((total / newCount) * 10) / 10;
      setAvgRating(newAvg);
      setReviewCount(newCount);
      onRatingUpdate?.(newAvg, newCount);
    } else if (reviewCount === 1) {
      setAvgRating(0);
      setReviewCount(0);
      onRatingUpdate?.(0, 0);
    }

    setDeletingId(null);
  };

  const isOwner = (review: Review) => {
    if (!currentUser) return false;
    const authorId = review.author?._id?.toString() || "";
    const userId = currentUser._id || currentUser.id || "";
    return authorId === userId;
  };

  return (
    <section className={styles.section}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <MessageSquare className={styles.headerIcon} />
        <h2 className={styles.title}>Reviews & Ratings</h2>
      </div>

      {/* ── Summary ── */}
      <div className={styles.summary}>
        <div className={styles.summaryLeft}>
          <span className={styles.bigRating}>{avgRating > 0 ? avgRating.toFixed(1) : "–"}</span>
          <StarRow value={avgRating} size={22} />
          <span className={styles.reviewMeta}>
            {reviewCount} review{reviewCount !== 1 ? "s" : ""}
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

      {/* ── Write Review Form ── */}
      <div className={styles.formCard}>
        <h3 className={styles.formTitle}>Write a Review</h3>

        {submitSuccess ? (
          <div className={styles.successBanner}>
            <CheckCircle size={18} />
            Your review has been submitted! Thank you for your feedback.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            {/* Star selector */}
            <div className={styles.starSelector}>
              <label className={styles.label}>Your Rating *</label>
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
                      className={`${styles.starIcon} ${
                        star <= (hoverRating || selectedRating)
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
                Your Review *
              </label>
              <textarea
                id="review-comment"
                rows={4}
                value={comment}
                maxLength={MAX_CHARS}
                placeholder="Share your honest experience with this business. What did you like? What could be improved? (minimum 10 characters)"
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
              disabled={submitting || !selectedRating || comment.trim().length < 10}
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
                  Submit Review
                </>
              )}
            </button>

            {!currentUser && (
              <p className={styles.loginHint}>
                <AlertCircle size={14} />
                You must be{" "}
                <a href="/signin" className={styles.loginLink}>
                  signed in
                </a>{" "}
                to post a review.
              </p>
            )}
          </form>
        )}
      </div>

      {/* ── Review List ── */}
      <div className={styles.list}>
        {loading && (
          <div className={styles.loadingRow}>
            <Loader2 size={20} className={styles.spin} />
            Loading reviews…
          </div>
        )}

        {!loading && reviews.length === 0 && (
          <div className={styles.emptyState}>
            <MessageSquare size={40} className={styles.emptyIcon} />
            <p>No reviews yet. Be the first to share your experience!</p>
          </div>
        )}

        {reviews.map((review, idx) => (
          <div
            key={review._id}
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

            <div className={styles.reviewFooter}>
              <button
                className={`${styles.helpfulBtn} ${helpfulSet.has(review._id) ? styles.helpfulActive : ""}`}
                onClick={() => handleHelpful(review._id)}
                disabled={helpfulSet.has(review._id)}
                aria-label="Mark as helpful"
              >
                <ThumbsUp size={13} />
                Helpful {review.helpfulCount > 0 && `(${review.helpfulCount})`}
              </button>
            </div>
          </div>
        ))}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              className={styles.pageBtn}
              onClick={() => fetchReviews(page - 1)}
              disabled={page <= 1 || loading}
            >
              ← Prev
            </button>
            <span className={styles.pageInfo}>
              {page} / {totalPages}
            </span>
            <button
              className={styles.pageBtn}
              onClick={() => fetchReviews(page + 1)}
              disabled={page >= totalPages || loading}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
