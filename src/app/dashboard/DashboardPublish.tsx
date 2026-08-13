"use client";
import { useState, useEffect } from "react";
import { Globe, Pencil, CheckCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { useRouter } from "next/navigation";
import { getApiUrl } from "@/lib/utils";
import axios from "axios";
import { getBusinessProfile, saveBusinessProfile } from "@/lib/auth";
import { CATEGORIES } from "@/lib/constants";
import { useAlert } from "@/context/AlertContext";

const API = getApiUrl();

function authHeader() {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function DashboardPublish() {
  const { currentUser } = useAuth();
  const { t } = useI18n();
  const { showAlert } = useAlert();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "draft" | "publishing" | "published">("loading");
  const [businessId, setBusinessId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    axios
      .get(`${API}/businesses/me/all`, { headers: authHeader() })
      .then((res) => {
        const businesses = res.data?.data || [];
        if (businesses.length > 0) {
          setBusinessId(businesses[0]._id);
          setStatus(businesses[0].active ? "published" : "draft");
        } else {
          setStatus("draft");
        }
      })
      .catch(() => setStatus("draft"));
  }, [currentUser]);

  const handlePublish = async () => {
    let activeBusinessId = businessId;
    setStatus("publishing");
    try {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
      
      // If no business exists on the backend, try to onboard the local profile
      if (!activeBusinessId && currentUser) {
        const userKey = currentUser.username || currentUser.email || "guest_vendor";
        let localProfile = getBusinessProfile(userKey) as any;
        
        // Try fallback keys if not found
        if (!localProfile && currentUser.username) {
          localProfile = getBusinessProfile(currentUser.username) as any;
        }
        if (!localProfile && currentUser.email) {
          localProfile = getBusinessProfile(currentUser.email) as any;
        }
        if (!localProfile) {
          localProfile = getBusinessProfile("guest_vendor") as any;
        }
        
        if (localProfile) {
          const selectedCategoryObject = CATEGORIES.find(c => c.slug === localProfile.category);
          
          const payload = {
            name: localProfile.businessName || currentUser.name || "My Business",
            description: localProfile.shortDesc || "Այս բիզնեսը դեռ չունի նկարագրություն",
            category: selectedCategoryObject?.slug || localProfile.category || "horeca",
            email: localProfile.email || currentUser.email || "contact@armbiz.am",
            phone: localProfile.phone || currentUser.phone || "+374 00 000000",
            address: localProfile.address || "Yerevan, Armenia",
            city: localProfile.city || "Yerevan",
            country: "Armenia",
            website: localProfile.website,
            services: localProfile.services ? localProfile.services.filter((s: any) => s && s.name && s.name.trim() !== "").map((s: any) => ({ name: s.name, price: Number(s.price) || 0, duration: s.duration })) : [],
            menu: [],
            coordinates: {
              latitude: Number(localProfile.latitude) || 40.1872,
              longitude: Number(localProfile.longitude) || 44.5152,
            },
            layoutConfig: {
              themeColor: "#0f172a",
              displayLogo: true,
              displayGallery: true,
              layoutType: localProfile.category === "horeca" ? "horeca" : "standard"
            }
          };

          const onboardRes = await axios.post(`${API}/businesses/onboard`, payload, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });

          if (onboardRes.data?.success && onboardRes.data.data?._id) {
            activeBusinessId = onboardRes.data.data._id;
            setBusinessId(activeBusinessId);
            
            // Auto-subscribe to standard plan
            try {
              await axios.post(`${API}/subscriptions/subscribe`, {
                businessId: activeBusinessId,
                plan: "standard"
              }, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
              });
            } catch (subErr) {
              console.warn("Auto-subscription failed, proceeding", subErr);
            }
          } else {
            throw new Error("Could not onboard local business profile to the database.");
          }
        } else {
          throw new Error("No business profile found. Please create a profile in dashboard settings first.");
        }
      }

      if (!activeBusinessId) {
        throw new Error("No business profile is available to publish.");
      }

      router.push("/dashboard/billing?tab=plans");
    } catch (err: any) {
      console.error("Publishing failed:", err);
      const msg = err.response?.data?.message || err.message || "Failed to publish business profile.";
      showAlert({ message: msg, type: "error" });
      setStatus("draft");
    }
  };

  const handleUnpublish = async () => {
    if (!businessId) return;
    try {
      await axios.put(`${API}/businesses/${businessId}`, { active: false }, { headers: authHeader() });
      
      // Update local storage status
      if (currentUser?.username) {
        const localProfile = getBusinessProfile(currentUser.username);
        if (localProfile) {
          saveBusinessProfile({
            ...localProfile,
            isPublished: false
          } as any);
        }
      }

      setStatus("draft");
    } catch (err: any) {
      console.error("Unpublishing failed:", err);
      const msg = err.response?.data?.message || err.message || "Failed to unpublish business profile.";
      showAlert({ message: msg, type: "error" });
    }
  };

  if (status === "loading") {
    return <Loader2 className="h-4 w-4 animate-spin text-[hsl(var(--muted-foreground))]" />;
  }

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
        className="flex h-9 items-center gap-1.5 rounded-xl px-4 text-xs font-semibold text-[hsl(var(--primary-foreground))] bg-[hsl(var(--primary))] transition-all hover:opacity-90 hover:shadow-lg hover:shadow-[hsl(var(--primary))]/20 disabled:opacity-60"
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
