import { useState, useEffect } from "react";
import Link from "next/link";
import { Star, MapPin, BadgeCheck, Bookmark } from "lucide-react";
import type { Business } from "@/types/business";
import styles from "./BusinessCard.module.scss";
import { useI18n } from "@/i18n";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

// Force Next.js compilation reload: 4
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
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const status = getOpenStatus(business.operatingHours, t);

  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const favsStr = localStorage.getItem("armbiz_favorites");
        if (favsStr) {
          const favs: string[] = JSON.parse(favsStr);
          if (favs.includes(business.id) || (business.slug && favs.includes(business.slug))) {
            setIsFavorited(true);
          }
        }
      } catch (e) { }
    }
  }, [business.id, business.slug]);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      showToast();
      return;
    }

    if (typeof window === "undefined") return;

    try {
      const favsStr = localStorage.getItem("armbiz_favorites");
      const itemsStr = localStorage.getItem("armbiz_favorites_items");

      let favs: string[] = favsStr ? JSON.parse(favsStr) : [];
      let itemsMap: Record<string, any> = itemsStr ? JSON.parse(itemsStr) : {};

      const key = business.slug || business.id;
      const isCurrentlyFav = favs.includes(business.id) || (business.slug && favs.includes(business.slug));

      if (isCurrentlyFav) {
        favs = favs.filter((id) => id !== business.id && id !== business.slug);
        delete itemsMap[business.id];
        if (business.slug) delete itemsMap[business.slug];
        setIsFavorited(false);
      } else {
        if (key && !favs.includes(key)) favs.push(key);
        itemsMap[key] = {
          id: business.id,
          slug: business.slug || business.id,
          name: business.name,
          city: business.city || "Yerevan",
          category: business.category,
          ratingAvg: business.ratingAvg || 5.0,
          images: business.images || (business.logo ? [business.logo] : business.logoUrl ? [business.logoUrl] : business.coverImageUrl ? [business.coverImageUrl] : []),
          logoUrl: business.logo || business.logoUrl || business.coverImageUrl || "",
          shortDescription: business.shortDescription || ""
        };
        setIsFavorited(true);

        // Dispatch animation event using button's bounding box for accuracy
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const startX = rect.left + rect.width / 2;
        const startY = rect.top + rect.height / 2;

        const event = new CustomEvent("fly-to-bookmark", {
          detail: { x: startX, y: startY },
        });
        window.dispatchEvent(event);
      }

      localStorage.setItem("armbiz_favorites", JSON.stringify(favs));
      localStorage.setItem("armbiz_favorites_items", JSON.stringify(itemsMap));
      window.dispatchEvent(new Event("favoritesUpdated"));
    } catch (e) {
      console.error("Failed to update favorites:", e);
    }
  };

  return (
    <div className={viewMode === "grid" ? styles.cardGrid : styles.cardList}>
      {/* Image container */}
      <div className="relative shrink-0 group">
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
        <button
          type="button"
          onClick={toggleFavorite}
          aria-label="Add to favorites"
          title={isFavorited ? "Remove from favorites" : "Save to favorites"}
          className={`absolute top-2 right-2 p-1.5 transition-all hover:scale-110 cursor-pointer z-10 bg-transparent border-0 ${
            isFavorited ? "opacity-100 scale-100" : "opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
          }`}
        >
          <Bookmark
            className="h-5 w-5 transition-all drop-shadow-md"
            style={{
              stroke: isFavorited ? "#f59e0b" : "white",
              fill: isFavorited ? "#f59e0b" : "none",
            }}
          />
        </button>
      </div>

      {/* Details container */}
      <div className={styles.details}>
        <div>
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
            <div className={`${styles.statusBadge} ${status.isOpen ? styles.isOpenBadge : styles.isClosedBadge} shrink-0`}>
              <span
                className={`${styles.statusDot} ${!status.isOpen ? styles.closed : ""
                  }`}
              />
              {status.text}
            </div>
          </div>

          <div className={styles.category}>{typeof business.category === "object" ? business.category.name : business.category}</div>

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
          <button
            type="button"
            onClick={toggleFavorite}
            aria-label="Add to favorites"
            title={isFavorited ? "Remove from favorites" : "Save to favorites"}
            className="bg-transparent border-0 p-1.5 transition-transform hover:scale-115 cursor-pointer flex items-center justify-center shrink-0"
          >
            <Bookmark
              className={`h-5 w-5 transition-all ${isFavorited ? "scale-110 drop-shadow-sm" : ""}`}
              style={{
                stroke: isFavorited ? "#f59e0b" : "hsl(var(--muted-foreground))",
                fill: isFavorited ? "#f59e0b" : "none",
              }}
            />
          </button>

          <Link href={`/business/${business.slug}`} className={styles.actionButton}>
            {t.discover?.bookNow || "Visit"}
          </Link>
        </div>
      </div>
    </div>
  );
}

