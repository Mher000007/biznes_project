import Link from "next/link";
import { Star, MapPin, BadgeCheck } from "lucide-react";
import type { Business } from "@/types/business";
import styles from "./BusinessCard.module.scss";
import { useI18n } from "@/i18n";

// Force Next.js compilation reload: 1
// Helper to parse time string into minutes from midnight
function parseTimeToMinutes(timeStr: string, defaultMinutes: number): number {
  if (!timeStr) return defaultMinutes;

  const clean = timeStr.trim().toLowerCase();

  // Check for AM/PM format
  const isPM = clean.includes("pm");
  const isAM = clean.includes("am");

  // Extract numbers and colon
  const timeOnly = clean.replace(/[^0-9:]/g, "");

  const parts = timeOnly.split(":");
  let hours = parseInt(parts[0], 10);
  let minutes = parts[1] ? parseInt(parts[1], 10) : 0;

  if (isNaN(hours)) return defaultMinutes;
  if (isNaN(minutes)) minutes = 0;

  if (isPM && hours < 12) {
    hours += 12;
  } else if (isAM && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}

// Simple utility to determine if a business is currently open
export function getOpenStatus(operatingHours: any[] | undefined, t: any) {
  if (!operatingHours || operatingHours.length === 0) {
    return { isOpen: true, text: t.business.openNow || "Open Now" };
  }
  const now = new Date();
  const day = now.getDay(); // 0 is Sunday, 1-6 Mon-Sat

  const daysMap: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6
  };

  const normalizedHours = operatingHours.map((h: any) => {
    let dayNum = 1;
    if (typeof h.day === 'number') {
      dayNum = h.day;
    } else if (typeof h.day === 'string') {
      dayNum = daysMap[h.day.toLowerCase()] ?? 1;
    } else if (h.dayName && typeof h.dayName === 'string') {
      dayNum = daysMap[h.dayName.toLowerCase()] ?? 1;
    }

    const open = h.openTime || h.open || "";
    const close = h.closeTime || h.close || "";
    const closed = h.isClosed === true || h.closed === true || (!open && !close);

    return {
      day: dayNum,
      open,
      close,
      closed
    };
  });

  // Find operating hours for today (day matches)
  const todayHours = normalizedHours.find((h) => h.day === day);

  if (!todayHours || todayHours.closed || !todayHours.open || !todayHours.close) {
    return { isOpen: false, text: t.business.closed || "Closed" };
  }

  const currentHour = now.getHours();
  const currentMin = now.getMinutes();

  const currentVal = currentHour * 60 + currentMin;
  const openVal = parseTimeToMinutes(todayHours.open, 9 * 60);
  const closeVal = parseTimeToMinutes(todayHours.close, 18 * 60);

  if (currentVal >= openVal && currentVal < closeVal) {
    return { isOpen: true, text: t.business.openNow || "Open Now" };
  }
  return { isOpen: false, text: t.business.closed || "Closed" };
}

export default function BusinessCard({ business, viewMode = "list" }: { business: Business, viewMode?: "list" | "grid" }) {
  const { t } = useI18n();
  const status = getOpenStatus(business.operatingHours, t);

  return (
    <div className={viewMode === "grid" ? styles.cardGrid : styles.cardList}>
      {/* Image container */}
      <Link href={`/business/${business.slug}`} className={styles.imageContainer}>
        {business.logoUrl || business.coverImageUrl ? (
          <img
            src={business.logoUrl || business.coverImageUrl}
            alt={business.name}
            className={styles.image}
          />
        ) : (
          <div className={styles.imagePlaceholder}>
            {business.name[0]}
          </div>
        )}
      </Link>

      {/* Details container */}
      <div className={styles.details}>
        <div className={styles.contentCol}>
          <div className={styles.headerRow}>
            <div className="flex items-center gap-2 min-w-0">
              <Link href={`/business/${business.slug}`} className={styles.title}>
                {business.name}
              </Link>
              {business.isVerified && (
                <BadgeCheck className={`h-5 w-5 shrink-0 ${business.plan === "premium" || business.plan === "standard"
                  ? styles.verifiedBadgeGold
                  : styles.verifiedBadgeStarter
                  }`} />
              )}
            </div>
            {business.operatingHours && (
              <div className={`${styles.statusBadge} ${!status.isOpen ? styles.isClosedBadge : styles.isOpenBadge} shrink-0`}>
                <span className={`${styles.statusDot} ${!status.isOpen ? styles.closed : ""}`}></span>
                {status.text}
              </div>
            )}
          </div>

          <div className={styles.category}>{business.category.name}</div>

          <p className={styles.description}>{business.shortDescription}</p>

          <div className={styles.ratingRow}>
            <div className={styles.stars}>
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={styles.starIcon}
                  style={{
                    fill: i < Math.floor(business.ratingAvg || 0) ? "#D4AF37" : "none",
                    stroke: "#D4AF37",
                  }}
                />
              ))}
            </div>
            <span className={styles.reviewCount}>
              {business.ratingAvg?.toFixed(1) || "0.0"}
            </span>
          </div>

          <div className={styles.metaRow}>
            <span className={styles.metaItem}>
              <MapPin className={styles.metaIcon} />
              <span className={styles.metaText}>
                {business.address ? `${business.address}, ` : ""}{business.city}
              </span>
            </span>

            <div className={styles.footerRow}>
              <Link href={`/business/${business.slug}`} className={styles.actionButton}>
                {t.discover?.bookNow || "Visit"}
              </Link>
            </div>
          </div>

          {business.tags && business.tags.length > 0 && (
            <div className={styles.tagsRow}>
              {business.tags.slice(0, 3).map((tag, i) => (
                <span key={i} className={styles.tag}>
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
