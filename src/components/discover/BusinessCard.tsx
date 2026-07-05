import Link from "next/link";
import { Star, MapPin, BadgeCheck } from "lucide-react";
import type { Business } from "@/types/business";
import styles from "./BusinessCard.module.scss";
import { useI18n } from "@/i18n";

// Simple utility to determine if a business is currently open
function getOpenStatus(operatingHours: any[] | undefined, t: any) {
  if (!operatingHours || operatingHours.length === 0) {
    return { isOpen: true, text: t.business.openNow };
  }
  const now = new Date();
  const day = now.getDay(); // 0 is Sunday, 1-6 Mon-Sat

  // Find operating hours for today (day matches, handling both 0 and 7 for Sunday if needed)
  const todayHours = operatingHours.find(
    (h) => h.day === day || (day === 0 && h.day === 7) || (day === 7 && h.day === 0)
  );

  if (!todayHours || todayHours.isClosed || !todayHours.openTime || !todayHours.closeTime) {
    return { isOpen: false, text: t.business.closed };
  }

  const currentHour = now.getHours();
  const currentMin = now.getMinutes();

  const [openH, openM] = todayHours.openTime.split(":").map(Number);
  const [closeH, closeM] = todayHours.closeTime.split(":").map(Number);

  const currentVal = currentHour * 60 + currentMin;
  const openVal = openH * 60 + openM;
  const closeVal = closeH * 60 + closeM;

  if (currentVal >= openVal && currentVal < closeVal) {
    return { isOpen: true, text: t.business.openNow };
  }
  return { isOpen: false, text: t.business.closed };
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
            src={business.coverImageUrl || business.logoUrl}
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
        <div>
          <div className={styles.headerRow}>
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
              {business.ratingAvg?.toFixed(1) || "0.0"} ({business.reviewCount || 0} {t.business.reviews})
            </span>
          </div>

          <div className={styles.metaRow}>
            <span className={styles.metaItem}>
              <MapPin className={styles.metaIcon} />
              {business.address ? `${business.address}, ` : ""}{business.city}
            </span>
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

        <div className={styles.footerRow}>
          <div className={styles.statusBadge}>
            <span
              className={`${styles.statusDot} ${!status.isOpen ? styles.closed : ""
                }`}
            />
            {status.text}
          </div>
          <Link href={`/business/${business.slug}`} className={styles.actionButton}>
            {t.discover?.bookNow || "Visit"}
          </Link>
        </div>
      </div>
    </div>
  );
}

