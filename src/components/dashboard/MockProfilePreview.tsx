import React from "react";
import { BadgeCheck, Calendar, Eye, MapPin, Star, Phone, Mail, Navigation } from "lucide-react";
import styles from "@/components/business/BusinessProfile.module.scss";

interface MockProfilePreviewProps {
  plan: "starter" | "standard" | "premium";
}

export default function MockProfilePreview({ plan }: MockProfilePreviewProps) {
  const isPro = plan === "standard" || plan === "premium";
  const isPremium = plan === "premium";

  const coverImage = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";
  const avatarImage = "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80";

  return (
    <div className="w-full relative flex flex-col bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-2xl p-4 md:p-6 shadow-sm overflow-hidden animate-scale-in">
      <div className="flex items-center gap-2 text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-4 px-2">
        <Eye className="h-4 w-4" /> Live Profile Preview
      </div>

      <div className={styles.profileContainer} style={{ padding: "0px", maxWidth: "100%" }}>
        {/* Cover Image */}
        <div className={styles.coverGallery} style={{ height: "180px", borderRadius: "1rem", marginBottom: "1.5rem", position: "relative" }}>
          <img className={styles.sliderImage} alt="Cover" src={coverImage} />
          <div className={styles.coverOverlay} />
          {!isPro && (
             <div className="absolute inset-0 backdrop-grayscale flex items-center justify-center bg-black/40">
                <span className="text-white font-bold text-sm tracking-widest uppercase bg-black/50 px-4 py-2 rounded-lg backdrop-blur-md">Cover Photo Disabled</span>
             </div>
          )}
        </div>

        {/* Profile Header */}
        <div className={styles.profileHeader} style={{ gap: "1rem", marginBottom: "1.5rem" }}>
          <div className="flex items-center justify-center shrink-0">
            <div className="w-16 h-16 rounded-full shrink-0 flex items-center justify-center overflow-hidden border border-[hsl(var(--border))]/60 p-[2px]">
              <div className="w-full h-full rounded-full bg-[hsl(var(--background))] p-[2px] overflow-hidden relative">
                <img className="w-full h-full rounded-full object-cover" alt="Nameeeee" src={avatarImage} />
              </div>
            </div>
          </div>

          <div className={styles.titleBlock}>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.25rem", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                Nameeeee
                {isPremium && (
                  <span className={`${styles.verifiedBadge} ${styles.verifiedGold}`} style={{ fontSize: "0.65rem", padding: "0.15rem 0.45rem" }}>
                    <BadgeCheck className="w-3 h-3" /> Verified Partner
                  </span>
                )}
                {plan === "standard" && (
                  <span className={styles.verifiedBadge} style={{ fontSize: "0.65rem", padding: "0.15rem 0.45rem" }}>
                    <BadgeCheck className="w-3 h-3" /> Verified Partner
                  </span>
                )}
              </h1>
            </div>
            <p className="text-[hsl(var(--muted-foreground))] mt-0.5 text-xs">Since 2026</p>

            <div className="flex items-center gap-3 flex-wrap text-xs text-[hsl(var(--muted-foreground))] mt-2">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-[hsl(var(--primary))]" /> Norq Marash, Yerevan, Նորք-Մարաշ (Երևան)
              </span>
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> 0.0 (0 reviews)
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Est. 2026
              </span>
            </div>
          </div>

          <button type="button" className="btn-primary py-2 px-4 rounded-xl text-xs font-semibold shadow-md shrink-0 cursor-default">
            Book Appointment
          </button>
        </div>

        {/* Highlights (PRO feature) */}
        <div className={styles.highlightsContainer} style={{ marginBottom: "1.5rem" }}>
          <div className={styles.highlightsHeader}>
            <h2 style={{ fontSize: "0.85rem", margin: 0 }}>
              Ակնարկներ (Highlights)
              {!isPro && <span className="text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded ml-2">PRO</span>}
            </h2>
          </div>
          <div className={`${styles.highlightsWrapper} ${!isPro ? "opacity-30 grayscale pointer-events-none" : ""}`} style={{ gap: "0.75rem" }}>
            {['🍽️', '📸', '⭐', '🕒', '📍'].map((emoji, i) => (
              <div key={i} className={styles.highlightTile} style={{ minWidth: "64px", gap: "0.25rem" }}>
                <div className={styles.storyRing} style={{ height: "54px", width: "54px" }}>
                  <div className={styles.storyThumb}>
                    {emoji}
                  </div>
                </div>
                <span style={{ fontSize: "0.65rem" }}>
                  {["Մենյու", "Լուսանկարներ", "Կարծիքներ", "Ժամեր", "Տեղադրություն"][i]}
                </span>
              </div>
            ))}
          </div>
        </div>



      </div>
    </div>
  );
}
