"use client";
import { useState, useEffect } from "react";
import { Globe, Pencil, CheckCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { getBusinessProfile, saveBusinessProfile } from "@/lib/auth";

export default function DashboardPublish() {
  const { currentUser } = useAuth();
  const { t } = useI18n();
  const [status, setStatus] = useState<"draft" | "publishing" | "published">("draft");

  useEffect(() => {
    if (currentUser?.username) {
      const profile = getBusinessProfile(currentUser.username);
      if (profile && (profile as any).isPublished) {
        setStatus("published");
      } else {
        setStatus("draft");
      }
    }
  }, [currentUser]);

  const handlePublish = () => {
    setStatus("publishing");
    setTimeout(() => {
      setStatus("published");
      if (currentUser?.username) {
        const profile = getBusinessProfile(currentUser.username);
        if (profile) {
          saveBusinessProfile({
            ...profile,
            isPublished: true
          } as any);
        } else {
          // If no profile has been saved yet, create a skeleton with user details
          saveBusinessProfile({
            ownerUsername: currentUser.username,
            businessName: currentUser.displayName || currentUser.username,
            category: "technology",
            shortDesc: "Enterprise software & cloud solutions",
            fullDesc: "Leading software development company specializing in enterprise solutions.",
            foundedYear: "2026",
            city: "Yerevan",
            address: "Yerevan, Armenia",
            phone: "+374 10 555 123",
            email: currentUser.email,
            website: "",
            services: [],
            operatingHours: [],
            instagram: "",
            facebook: "",
            telegram: "",
            linkedin: "",
            tags: "",
            isPublished: true,
            ratingAvg: 0.0,
            reviewCount: 0,
            viewCount: 0,
            inquiryCount: 0
          } as any);
        }
      }
    }, 2000);
  };

  const handleUnpublish = () => {
    setStatus("draft");
    if (currentUser?.username) {
      const profile = getBusinessProfile(currentUser.username);
      if (profile) {
        saveBusinessProfile({
          ...profile,
          isPublished: false
        } as any);
      }
    }
  };

  if (status === "published") {
    return (
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
          <CheckCircle className="h-3.5 w-3.5" /> {t.dashboard.liveOn}
        </span>
        <button
          onClick={handleUnpublish}
          className="flex h-9 items-center gap-1.5 rounded-xl border border-[hsl(var(--border))] px-4 text-xs font-medium transition-all hover:bg-[hsl(var(--muted))]"
        >
          <Pencil className="h-3 w-3" /> {t.dashboard.edit}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
        <Pencil className="h-3 w-3" /> {t.dashboard.unpublished}
      </span>
      <button
        onClick={handlePublish}
        disabled={status === "publishing"}
        className="flex h-9 items-center gap-1.5 rounded-xl px-4 text-xs font-semibold text-white gradient-primary transition-all hover:opacity-90 hover:shadow-lg hover:shadow-[hsl(var(--primary))]/20 disabled:opacity-60"
      >
        {status === "publishing" ? (
          <><Loader2 className="h-3.5 w-3.5 animate-spin" /> {t.dashboard.publishing}</>
        ) : (
          <><Globe className="h-3.5 w-3.5" /> {t.dashboard.publish}</>
        )}
      </button>
    </div>
  );
}
