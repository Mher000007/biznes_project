"use client";
import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { CATEGORIES } from "@/lib/constants";
import { LocationSelect } from "@/components/ui/LocationSelect";
import BusinessMap from "@/components/map/BusinessMap";
import { useAuth } from "@/context/AuthContext";
import { getBusinessProfile, saveBusinessProfile } from "@/lib/auth";
import Link from "next/link";
import { Save, CheckCircle, Plus, X, Image as ImageIcon, Star, Phone, Mail, Globe, MapPin, Clock, Camera, Trash2, Eye, ChevronRight, ChevronLeft, Award, PlusCircle, Sparkles, Smartphone, Settings, Grid as GridIcon, User as UserIcon, BadgeCheck, Compass, ArrowLeft, Calendar, Navigation, Lock } from "lucide-react";
import axios from "axios";
import styles from "@/components/dashboard/Dashboard.module.scss";
import profileStyles from "@/components/business/BusinessProfile.module.scss";
import { useI18n } from "@/i18n";
import { getApiUrl } from "@/lib/utils";
import { useSearchParams, useRouter } from "next/navigation";

const CURRENT_YEAR = new Date().getFullYear();

const LocationPicker = dynamic(() => import("@/components/map/LocationPicker"), {
  ssr: false,
  loading: () => <div className="h-[280px] rounded-xl bg-[hsl(var(--muted))] animate-pulse" />
});



interface Service {
  name: string;
  price: string;
}

interface Story {
  id: string;
  imageUrl: string;
  title: string;
}

interface Highlight {
  id: string;
  imageUrl: string;
  title: string;
  stories?: string[]; // Array of story IDs
}

const isDefaultImage = (url: string) => {
  if (!url) return false;
  return (
    url.includes("photo-1497366216548-37526070297c") ||
    url.includes("photo-1497366811353-6870744d04b2") ||
    url.includes("photo-1497215728101-856f4ea42174") ||
    url.includes("photo-1618005182384-a83a8bd57fbe") ||
    url.includes("photo-1516321318423-f06f85e504b3")
  );
};

const isDefaultHighlight = (h: any) => {
  if (!h) return false;
  const url = h.imageUrl || "";
  const title = h.title || "";
  return (
    (title === "Menu" && url.includes("photo-1504674900247-0877df9cc836")) ||
    (title === "Interior" && url.includes("photo-1554118811-1e0d58224f24")) ||
    (title === "Reviews" && url.includes("photo-1522071820081-009f0129c71c"))
  );
};

export default function DashboardProfilePage() {
  const { currentUser } = useAuth();
  const { t } = useI18n();
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Track the MongoDB ObjectId of the category so we can send it back on save
  const [categoryId, setCategoryId] = useState<string | null>(null);

  // Layout Tab State (from search query param)
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawTab = searchParams.get("tab") || "branding";
  const activeFormTab = rawTab === "branding" ? "identity" : rawTab === "credentials" ? "info" : rawTab === "stories" ? "stories" : rawTab === "hours" ? "hours" : "identity";

  const handleTabChange = (tabId: string) => {
    router.push(`/dashboard/profile?tab=${tabId}`);
  };

  const [activePreviewTab, setActivePreviewTab] = useState<"about" | "gallery">("about");

  // Simulated Phone Screen Story overlay
  const [openStoryIndex, setOpenStoryIndex] = useState<number | null>(null);

  // Fullscreen and Lightbox Overlays
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);
  const [zoomImageIdx, setZoomImageIdx] = useState<number | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const storyInputRef = useRef<HTMLInputElement>(null);
  const highlightInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("File conversion failed"));
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert("File size exceeds 3MB limit");
        return;
      }
      convertFileToBase64(file).then(setLogoUrl).catch(console.error);
    }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert("File size exceeds 3MB limit");
        return;
      }
      convertFileToBase64(file).then(base64 => {
        setCoverUrls(prev => [...prev, base64]);
      }).catch(console.error);
    }
  };

  const handleStoryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert("File size exceeds 3MB limit");
        return;
      }
      convertFileToBase64(file).then(setNewStoryImg).catch(console.error);
    }
  };

  const handleHighlightUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert("File size exceeds 3MB limit");
        return;
      }
      convertFileToBase64(file).then(setNewHighlightImg).catch(console.error);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newImages: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 3 * 1024 * 1024) {
          alert(`File ${file.name} exceeds 3MB limit and was skipped`);
          continue;
        }
        try {
          const base64 = await convertFileToBase64(file);
          newImages.push(base64);
        } catch (err) {
          console.error(err);
        }
      }
      if (newImages.length > 0) {
        setGallery(prev => [...prev, ...newImages]);
      }
    }
  };

  // Instagram-style speech note bubble
  const [noteText, setNoteText] = useState("");

  // Form Fields State
  const [name, setName] = useState("");
  const [foundedYear, setFoundedYear] = useState("");
  const [category, setCategory] = useState("building-material");
  const [city, setCity] = useState("Yerevan");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState(40.1872);
  const [lng, setLng] = useState(44.5152);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");

  // Branding Visuals
  const [logoUrl, setLogoUrl] = useState("");
  const [coverUrls, setCoverUrls] = useState<string[]>([]);
  const [newCoverUrl, setNewCoverUrl] = useState("");
  const [activeCoverIdx, setActiveCoverIdx] = useState(0);

  // Rating and review states for preview sync
  const [rating, setRating] = useState(0.0);
  const [reviewCount, setReviewCount] = useState(0);

  // Services State
  const [services, setServices] = useState<Service[]>([]);

  // Instagram-like Stories State
  const [stories, setStories] = useState<Story[]>([]);

  // Instagram-style Highlights State
  const [highlights, setHighlights] = useState<Highlight[]>([]);

  // Story Archive State (for Highlights builder)
  const [storyArchive, setStoryArchive] = useState<any[]>([]);
  const [isStoryArchiveModalOpen, setIsStoryArchiveModalOpen] = useState(false);
  const [selectedArchiveStories, setSelectedArchiveStories] = useState<string[]>([]);

  // Gallery Images List State
  const [gallery, setGallery] = useState<string[]>([]);

  // Weekly Working Hours State
  const [operatingHours, setOperatingHours] = useState([
    { day: "Monday", open: "09:00", close: "18:00", closed: false },
    { day: "Tuesday", open: "09:00", close: "18:00", closed: false },
    { day: "Wednesday", open: "09:00", close: "18:00", closed: false },
    { day: "Thursday", open: "09:00", close: "18:00", closed: false },
    { day: "Friday", open: "09:00", close: "18:00", closed: false },
    { day: "Saturday", open: "10:00", close: "16:00", closed: false },
    { day: "Sunday", open: "09:00", close: "18:00", closed: true }
  ]);

  // Custom Add Fields
  const [newStoryTitle, setNewStoryTitle] = useState("");
  const [newStoryImg, setNewStoryImg] = useState("");
  const [newHighlightTitle, setNewHighlightTitle] = useState("");
  const [newHighlightImg, setNewHighlightImg] = useState("");
  const [newGalleryUrl, setNewGalleryUrl] = useState("");

  // Active Subscription
  const [activePlan, setActivePlan] = useState<"starter" | "standard" | "premium">("standard");
  const [activeSubscription, setActiveSubscription] = useState<any>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [promoMessage, setPromoMessage] = useState("");
  const [promoMessageType, setPromoMessageType] = useState<"success" | "error" | "">("");
  const [applyingPromo, setApplyingPromo] = useState(false);

  // Load business info from backend/local mock on init
  useEffect(() => {
    async function fetchBusinessData() {
      try {
        const apiURL = getApiUrl();
        const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;

        const res = await axios.get(`${apiURL}/businesses/me/all`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        if (res.data?.success && res.data.data?.length > 0) {
          const biz = res.data.data[0];
          setName(biz.name);
          setDescription(biz.description);
          setCategory(biz.category?.slug || "building-material");
          if (biz.category?._id) setCategoryId(biz.category._id);
          setCity(biz.city);
          setAddress(biz.address);
          if (biz.latitude) setLat(biz.latitude);
          else if (biz.coordinates?.latitude) setLat(biz.coordinates.latitude);
          if (biz.longitude) setLng(biz.longitude);
          else if (biz.coordinates?.longitude) setLng(biz.coordinates.longitude);
          setEmail(biz.email);
          setPhone(biz.phone);
          setWebsite(biz.website || "");
          setLogoUrl(biz.logo && !isDefaultImage(biz.logo) ? biz.logo : "");
          setGallery((biz.images || []).filter((url: string) => !isDefaultImage(url)));
          setHighlights((biz.highlights || [])
            .map((h: any, index: number) => ({
              id: index.toString(),
              imageUrl: h.imageUrl,
              title: h.title,
              stories: h.stories || []
            }))
            .filter((h: any) => !isDefaultHighlight(h))
          );
          setServices((biz.services || []).map((s: any) => ({ name: s.name, price: s.price.toString() })));

          setRating(biz.rating !== undefined ? biz.rating : (biz.ratingAvg !== undefined ? biz.ratingAvg : 0.0));
          setReviewCount(biz.reviewCount || 0);

          // Fetch extra attributes from metadata mixin
          if (biz.metadata?.coverUrl) {
            if (Array.isArray(biz.metadata.coverUrl)) {
              setCoverUrls(biz.metadata.coverUrl.filter((url: string) => !isDefaultImage(url)));
            } else if (typeof biz.metadata.coverUrl === 'string' && !isDefaultImage(biz.metadata.coverUrl)) {
              setCoverUrls([biz.metadata.coverUrl]);
            } else {
              setCoverUrls([]);
            }
          } else {
            setCoverUrls([]);
          }

          // Fetch Story Archive
          try {
            const archiveRes = await axios.get(`${apiURL}/stories/my-business`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            if (archiveRes.data?.success) {
              setStoryArchive(archiveRes.data.data);
            }
          } catch (err) {
            console.error("Failed to fetch story archive", err);
          }
          setStories(biz.metadata?.stories || []);
          if (biz.metadata?.operatingHours) setOperatingHours(biz.metadata.operatingHours);
          setNoteText(biz.metadata?.noteText || "");
          setFoundedYear(biz.metadata?.foundedYear ? biz.metadata.foundedYear.toString() : "");

          setBusinessId(biz._id);

          // Fetch active subscription
          const subRes = await axios.get(`${apiURL}/subscriptions/business/${biz._id}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
          if (subRes.data?.success && subRes.data.data) {
            setActivePlan(subRes.data.data.plan);
            setActiveSubscription(subRes.data.data);
          }
          return;
        }
      } catch (err) {
        console.warn("Could not retrieve business from backend, attempting local storage fallback", err);
      }

      // Fallback: Load from local storage mock database
      if (currentUser?.username) {
        const mockProfile = getBusinessProfile(currentUser.username) as any;
        if (mockProfile) {
          setName(mockProfile.businessName || "");
          setCategory(mockProfile.category || "building-material");
          setCity(mockProfile.city || "Yerevan");
          setAddress(mockProfile.address || "");
          setEmail(mockProfile.email || "");
          setPhone(mockProfile.phone || "");
          setWebsite(mockProfile.website || "");
          setDescription(mockProfile.shortDesc || "");
          if (mockProfile.foundedYear) setFoundedYear(mockProfile.foundedYear);
          if (mockProfile.latitude) setLat(mockProfile.latitude);
          if (mockProfile.longitude) setLng(mockProfile.longitude);

          setLogoUrl(mockProfile.logo && !isDefaultImage(mockProfile.logo) ? mockProfile.logo : "");
          if (mockProfile.coverUrl) {
            if (Array.isArray(mockProfile.coverUrl)) {
              setCoverUrls(mockProfile.coverUrl.filter((url: string) => !isDefaultImage(url)));
            } else if (typeof mockProfile.coverUrl === 'string' && !isDefaultImage(mockProfile.coverUrl)) {
              setCoverUrls([mockProfile.coverUrl]);
            } else {
              setCoverUrls([]);
            }
          } else {
            setCoverUrls([]);
          }
          setGallery((mockProfile.gallery || []).filter((url: string) => !isDefaultImage(url)));
          setStories(mockProfile.stories || []);
          setHighlights((mockProfile.highlights || []).filter((h: any) => !isDefaultHighlight(h)));
          if (mockProfile.operatingHours) setOperatingHours(mockProfile.operatingHours);
          setNoteText(mockProfile.noteText || "");
          setServices((mockProfile.services || []).map((s: any) => ({ name: s.name, price: s.price.toString() })));
          setRating(mockProfile.ratingAvg !== undefined ? mockProfile.ratingAvg : 0.0);
          setReviewCount(mockProfile.reviewCount || 0);
        }
      }
    }
    if (currentUser) {
      fetchBusinessData();
    }
  }, [currentUser]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setSaved(false);
    setSaveError(null);
    let currentSaveError: string | null = null;

    // Send the ObjectId if we have it, otherwise fall back to slug
    const categoryValue = categoryId || category;

    const payload = {
      name,
      description,
      category: categoryValue,
      email,
      phone,
      website,
      logo: logoUrl,
      images: gallery,
      services: services.map(s => ({ name: s.name, price: Number(s.price) || 0 })),
      highlights: highlights.map(h => ({ imageUrl: h.imageUrl, title: h.title, stories: h.stories || [] })),
      layoutConfig: {
        themeColor: '#0f172a',
        displayLogo: true,
        displayGallery: true,
        layoutType: 'standard'
      },
      metadata: {
        coverUrl: coverUrls,
        stories,
        operatingHours,
        noteText,
        foundedYear
      }
    };

    // 1. Try backend update
    let backendSaveOk = false;
    try {
      const apiURL = getApiUrl();
      const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;

      const listRes = await axios.get(`${apiURL}/businesses/me/all`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (listRes.data?.success && listRes.data.data?.length > 0) {
        const bizId = listRes.data.data[0]._id;
        const updateRes = await axios.put(`${apiURL}/businesses/${bizId}`, payload, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (updateRes.data?.success) {
          backendSaveOk = true;
          // Update categoryId if the backend returned a resolved category
          if (updateRes.data.data?.category) {
            const resolvedCat = updateRes.data.data.category;
            if (typeof resolvedCat === 'string') {
              setCategoryId(resolvedCat);
            } else if (resolvedCat._id) {
              setCategoryId(resolvedCat._id);
            }
          }
        }
      }
    } catch (err: any) {
      currentSaveError = err.response?.data?.message || err.message || 'Unknown error';
      console.error("Backend update failed:", currentSaveError, err);
      setSaveError(currentSaveError);
    }

    // 2. Synchronize to local storage mock database
    let wasPublished = false;
    let existingProfile: any = null;
    if (currentUser?.username) {
      existingProfile = getBusinessProfile(currentUser.username);
      if (existingProfile && (existingProfile as any).isPublished) {
        wasPublished = true;
      }
    }

    saveBusinessProfile({
      ownerUsername: currentUser?.username || "guest_vendor",
      businessName: name,
      category,
      shortDesc: description,
      fullDesc: description,
      foundedYear: foundedYear,
      city,
      address,
      latitude: lat,
      longitude: lng,
      phone,
      email,
      website,
      services: services,
      operatingHours: operatingHours,
      instagram: "",
      facebook: "",
      telegram: "",
      linkedin: "",
      tags: category,
      logo: logoUrl,
      coverUrl: coverUrls,
      stories: stories,
      highlights: highlights,
      gallery: gallery,
      noteText: noteText,
      isPublished: wasPublished,
      ratingAvg: existingProfile?.ratingAvg !== undefined ? existingProfile.ratingAvg : rating,
      reviewCount: existingProfile?.reviewCount !== undefined ? existingProfile.reviewCount : reviewCount,
      viewCount: existingProfile?.viewCount !== undefined ? existingProfile.viewCount : 0,
      inquiryCount: existingProfile?.inquiryCount !== undefined ? existingProfile.inquiryCount : 0
    } as any);

    setLoading(false);
    if (!currentSaveError) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      setTimeout(() => setSaveError(null), 8000);
    }
  };

  // Service helpers
  const addService = () => setServices([...services, { name: "", price: "" }]);
  const removeService = (i: number) => setServices(services.filter((_, idx) => idx !== i));
  const updateService = (i: number, field: keyof Service, val: string) => {
    const updated = [...services];
    updated[i] = { ...updated[i], [field]: val };
    setServices(updated);
  };

  // Story actions
  const addStoryItem = () => {
    if (!newStoryImg || !newStoryTitle) return;
    const newStory = {
      id: Date.now().toString(),
      title: newStoryTitle,
      imageUrl: newStoryImg
    };
    setStories([...stories, newStory]);
    setNewStoryTitle("");
    setNewStoryImg("");
  };
  const removeStoryItem = (id: string) => setStories(stories.filter(s => s.id !== id));

  // Highlight actions
  const addHighlightItem = () => {
    if (!newHighlightImg || !newHighlightTitle) return;
    const newHighlight = {
      id: Date.now().toString(),
      title: newHighlightTitle,
      imageUrl: newHighlightImg
    };
    setHighlights([...highlights, newHighlight]);
    setNewHighlightTitle("");
    setNewHighlightImg("");
  };
  const removeHighlightItem = (id: string) => setHighlights(highlights.filter(h => h.id !== id));

  // Gallery actions
  const addGalleryItem = () => {
    if (!newGalleryUrl) return;
    setGallery([...gallery, newGalleryUrl]);
    setNewGalleryUrl("");
  };
  const removeGalleryItem = (url: string) => setGallery(gallery.filter(g => g !== url));

  // Hours actions
  const toggleDayClosed = (index: number) => {
    const updated = [...operatingHours];
    updated[index].closed = !updated[index].closed;
    setOperatingHours(updated);
  };
  const updateDayHours = (index: number, field: "open" | "close", value: string) => {
    const updated = [...operatingHours];
    updated[index] = { ...updated[index], [field]: value };
    setOperatingHours(updated);
  };

  const handlePlanUpgrade = async (plan: "starter" | "standard" | "premium") => {
    setActivePlan(plan);
    try {
      const apiURL = getApiUrl();
      const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
      const listRes = await axios.get(`${apiURL}/businesses/me/all`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (listRes.data?.success && listRes.data.data?.length > 0) {
        const bizId = listRes.data.data[0]._id;
        await axios.post(`${apiURL}/subscriptions/subscribe`, {
          businessId: bizId,
          plan
        }, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
      }
    } catch (err) {
      console.warn("Backend subscription change failed, simulated locally", err);
    }
  };

  const handlePromoApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCodeInput.trim() || !businessId) return;
    setApplyingPromo(true);
    setPromoMessage("");
    setPromoMessageType("");
    try {
      const apiURL = getApiUrl();
      const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
      const res = await axios.post(
        `${apiURL}/subscriptions/promo/activate`,
        {
          businessId,
          code: promoCodeInput.trim(),
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (res.data?.success) {
        setPromoMessageType("success");
        setPromoMessage(res.data.message || "Promo code applied successfully!");
        setPromoCodeInput("");
        // Reload subscription details
        const subRes = await axios.get(`${apiURL}/subscriptions/business/${businessId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (subRes.data?.success && subRes.data.data) {
          setActivePlan(subRes.data.data.plan);
          setActiveSubscription(subRes.data.data);
        }
      }
    } catch (err: any) {
      setPromoMessageType("error");
      setPromoMessage(err.response?.data?.message || "Failed to apply promo code");
    } finally {
      setApplyingPromo(false);
    }
  };

  // Cover banner selection logic for preview (matches public detail view logic)
  const previewCoverImage = coverUrls && coverUrls.length > 0
    ? coverUrls[0]
    : (gallery && gallery.length > 0
      ? gallery[0]
      : logoUrl || "");

  return (
    <div className="pb-16">
      {/* Visual Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-8 border-b border-[hsl(var(--border))] gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-1 text-[hsl(var(--foreground))]">
            {t.builder.title}
          </h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {t.builder.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saved && !saveError && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-900 animate-fade-in">
              <CheckCircle className="h-3.5 w-3.5" /> {t.builder.published}
            </span>
          )}
          {saveError && (
            <span className="flex items-center gap-1.5 text-xs text-red-600 font-semibold bg-red-50 dark:bg-red-950/30 px-3 py-1.5 rounded-full border border-red-200 dark:border-red-900 animate-fade-in max-w-xs truncate">
              <X className="h-3.5 w-3.5 shrink-0" /> {saveError}
            </span>
          )}
          <button
            onClick={() => handleSave()}
            disabled={loading}
            className="btn-primary flex items-center justify-center gap-2 rounded-xl text-sm font-semibold shadow-lg px-5 py-2.5 cursor-pointer"
          >
            <Save className="h-4 w-4" />
            {loading ? t.builder.publishing : t.builder.saveSync}
          </button>
        </div>
      </div>

      {/* Mobile/Fallback Builder Navigation Tabs (Hidden on Desktop) */}
      <div className="lg:hidden flex items-center justify-start gap-1 border-b border-[hsl(var(--border))] overflow-x-auto pb-px mb-8">
        {[
          { id: "branding", label: t.builder.tabs.branding, icon: Sparkles },
          { id: "credentials", label: t.builder.tabs.credentials, icon: Lock },
          { id: "stories", label: t.builder.tabs.stories, icon: Camera },
          { id: "hours", label: t.builder.tabs.hours, icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = rawTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer ${isActive
                ? "border-[hsl(var(--primary))] text-[hsl(var(--foreground))]"
                : "border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* SPLIT-SCREEN LAYOUT: EDITOR PANEL ON LEFT, PREVIEW MOCKUP ON RIGHT */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

        {/* EDITING PANELS */}
        {activeFormTab && (
          <div className="col-span-12 xl:col-span-5 space-y-6">
            <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 shadow-sm min-h-[480px]">
              {/* TAB 1: BRANDING IDENTITY */}
              {activeFormTab === "identity" && (
                <div className="space-y-6 animate-scale-in">
                  <div>
                    <h3 className="text-base font-bold text-[hsl(var(--foreground))] mb-1">{t.builder.branding.title}</h3>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{t.builder.branding.subtitle}</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-1.5">{t.builder.branding.noteBubble}</label>
                      <input
                        value={noteText}
                        onChange={e => setNoteText(e.target.value)}
                        placeholder={`${t.builder.branding.noteBubble}...`}
                        type="text"
                        className="w-full rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-xs outline-none bg-transparent text-[hsl(var(--foreground))]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-1.5">{t.builder.branding.logoUrl}</label>
                      <div className="flex gap-2">
                        <input
                          value={logoUrl}
                          onChange={e => setLogoUrl(e.target.value)}
                          placeholder="Avatar/Logo URL"
                          type="text"
                          className="flex-1 rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-xs outline-none bg-transparent text-[hsl(var(--foreground))]"
                        />
                        <button
                          type="button"
                          onClick={() => logoInputRef.current?.click()}
                          className="px-3 py-2 bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] rounded-lg text-xs hover:bg-[hsl(var(--border))] transition-colors border border-[hsl(var(--border))] flex items-center gap-1 font-semibold"
                        >
                          <Camera className="h-3.5 w-3.5" /> Upload
                        </button>
                        <button
                          type="button"
                          onClick={() => setLogoUrl("https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=150&auto=format&fit=crop")}
                          className="px-3 py-2 bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] rounded-lg text-xs hover:bg-[hsl(var(--border))] transition-colors border border-[hsl(var(--border))]"
                        >
                          {t.builder.branding.reset}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-1.5">{t.builder.branding.coverUrl}</label>
                      <div className="flex gap-2">
                        <input
                          value={newCoverUrl}
                          onChange={e => setNewCoverUrl(e.target.value)}
                          placeholder="Facebook cover-style banner URL"
                          type="text"
                          className="flex-1 rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-xs outline-none bg-transparent text-[hsl(var(--foreground))]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newCoverUrl.trim()) {
                              setCoverUrls([...coverUrls, newCoverUrl.trim()]);
                              setNewCoverUrl("");
                            }
                          }}
                          className="px-3 py-2 bg-[hsl(var(--primary))] text-white rounded-lg text-xs hover:opacity-90 transition-colors font-semibold font-semibold"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => coverInputRef.current?.click()}
                          className="px-3 py-2 bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] rounded-lg text-xs hover:bg-[hsl(var(--border))] transition-colors border border-[hsl(var(--border))] flex items-center gap-1 font-semibold"
                        >
                          <Camera className="h-3.5 w-3.5" /> Upload
                        </button>
                      </div>

                      {coverUrls.length > 0 && (
                        <div className="grid grid-cols-3 gap-3 mt-3">
                          {coverUrls.map((url, index) => (
                            <div key={index} className="relative group aspect-video rounded-xl border border-[hsl(var(--border))] overflow-hidden bg-slate-900 shadow-sm">
                              <img src={url} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                              <button
                                type="button"
                                onClick={() => setCoverUrls(coverUrls.filter((_, idx) => idx !== index))}
                                className="absolute top-1.5 right-1.5 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {coverUrls.length === 0 && (
                        <p className="text-[11px] text-[hsl(var(--muted-foreground))] italic mt-1.5">No cover images added. Please add at least one.</p>
                      )}
                      <input
                        type="file"
                        ref={coverInputRef}
                        onChange={handleCoverUpload}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>

                    {/* Divider */}
                    <hr className="border-[hsl(var(--border))]/60 my-4" />

                    {/* Showcase Gallery Upload (Interior/Salon Photos) */}
                    <div>
                      <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-1.5">{t.builder.gallery.title} (Սրահի նկարներ)</label>
                      <p className="text-[11px] text-[hsl(var(--muted-foreground))] mb-2">{t.builder.gallery.subtitle}</p>
                      <div className="flex gap-2 mb-3">
                        <input
                          type="text"
                          placeholder={t.builder.gallery.placeholder}
                          value={newGalleryUrl}
                          onChange={e => setNewGalleryUrl(e.target.value)}
                          className="flex-1 rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-xs outline-none bg-transparent text-[hsl(var(--foreground))]"
                        />
                        <button
                          type="button"
                          onClick={() => galleryInputRef.current?.click()}
                          className="flex items-center gap-1 px-3 py-2 bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] rounded-lg text-xs hover:bg-[hsl(var(--border))] border border-[hsl(var(--border))] transition-colors font-semibold"
                        >
                          <Camera className="h-3.5 w-3.5" /> Upload
                        </button>
                        <button
                          type="button"
                          onClick={addGalleryItem}
                          className="flex items-center gap-1.5 px-4 py-2 bg-[hsl(var(--primary))] text-white font-semibold rounded-lg text-xs hover:opacity-90 font-semibold"
                        >
                          <Plus className="h-4 w-4" /> {t.builder.gallery.addPhoto}
                        </button>
                      </div>

                      <input
                        type="file"
                        ref={galleryInputRef}
                        onChange={handleGalleryUpload}
                        accept="image/*"
                        multiple
                        className="hidden"
                      />

                      {gallery.length > 0 && (
                        <div className="grid grid-cols-3 gap-3">
                          {gallery.map((url, i) => (
                            <div key={i} className="relative group aspect-square rounded-xl border border-[hsl(var(--border))] overflow-hidden bg-slate-900 shadow-sm">
                              <img src={url} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                              <button
                                type="button"
                                onClick={() => removeGalleryItem(url)}
                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {gallery.length === 0 && (
                        <p className="text-[11px] text-[hsl(var(--muted-foreground))] italic">No salon/interior images added yet.</p>
                      )}
                    </div>
                  </div>


                </div>
              )}

              {/* TAB 2: CREDENTIALS INFO */}
              {activeFormTab === "info" && (
                <div className="space-y-5 animate-scale-in">
                  <div>
                    <h3 className="text-base font-bold text-[hsl(var(--foreground))] mb-1">{t.builder.credentials.title}</h3>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{t.builder.credentials.subtitle}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-1">{t.builder.credentials.name}</label>
                      <input value={name} onChange={e => setName(e.target.value)} type="text" className="w-full rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-xs outline-none bg-transparent text-[hsl(var(--foreground))]" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-1">{t.builder.credentials.category}</label>
                      <select disabled value={category} onChange={e => {
                        setCategory(e.target.value);
                        setCategoryId(null); // Clear categoryId so categoryValue resolves to the new selected category slug
                      }} className="w-full rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-xs outline-none bg-transparent text-[hsl(var(--foreground))] opacity-75 cursor-not-allowed">
                        {CATEGORIES.filter(c => c.slug === "horeca").map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>


                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-1">{t.builder.credentials.email}</label>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-xs outline-none bg-transparent text-[hsl(var(--foreground))]" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-1">{t.builder.credentials.phone}</label>
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-xs outline-none bg-transparent text-[hsl(var(--foreground))]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-1">{t.builder.credentials.website}</label>
                      <input type="url" value={website} onChange={e => setWebsite(e.target.value)} className="w-full rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-xs outline-none bg-transparent text-[hsl(var(--foreground))]" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-1">Founded Year (e.g. 1997)</label>
                      <input
                        type="text"
                        value={foundedYear}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === "") {
                            setFoundedYear("");
                            return;
                          }
                          const numericVal = parseInt(val, 10);
                          if (!isNaN(numericVal)) {
                            if (numericVal > CURRENT_YEAR) {
                              setFoundedYear(CURRENT_YEAR.toString());
                            } else {
                              setFoundedYear(val);
                            }
                          }
                        }}
                        className="w-full rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-xs outline-none bg-transparent text-[hsl(var(--foreground))]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: HIGHLIGHTS ONLY */}
              {activeFormTab === "stories" && (
                <div className="space-y-6 animate-scale-in">

                  {/* Highlights Editor */}
                  <div>
                    <h3 className="text-base font-bold text-[hsl(var(--foreground))] mb-1">{t.builder.stories.highlightsTitle}</h3>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{t.builder.stories.highlightsSubtitle}</p>

                    <div className="grid grid-cols-1 gap-2 mt-3">
                      <input
                        type="text"
                        placeholder={t.builder.stories.highlightsPlaceholder}
                        value={newHighlightTitle}
                        onChange={e => setNewHighlightTitle(e.target.value)}
                        className="w-full rounded-lg border border-[hsl(var(--border))] px-2.5 py-1.5 text-xs outline-none bg-transparent text-[hsl(var(--foreground))]"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setIsStoryArchiveModalOpen(true)}
                          className="flex-1 px-2.5 py-1.5 bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] rounded-lg text-xs hover:bg-[hsl(var(--border))] transition-colors border border-[hsl(var(--border))] flex justify-center items-center gap-2 font-semibold"
                        >
                          <GridIcon className="h-4 w-4" />
                          {selectedArchiveStories.length > 0 ? `${selectedArchiveStories.length} stories selected` : "Select from Archive"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!newHighlightTitle || selectedArchiveStories.length === 0) return;
                            const firstSelected = storyArchive.find((s: any) => s._id === selectedArchiveStories[0]);
                            const newHighlight = {
                              id: Date.now().toString(),
                              title: newHighlightTitle,
                              imageUrl: firstSelected?.mediaUrl || "",
                              stories: [...selectedArchiveStories]
                            };
                            setHighlights([...highlights, newHighlight]);
                            setNewHighlightTitle("");
                            setSelectedArchiveStories([]);
                          }}
                          disabled={!newHighlightTitle || selectedArchiveStories.length === 0}
                          className="px-4 py-1.5 bg-[hsl(var(--primary))] text-white font-semibold rounded-lg text-xs hover:opacity-90 disabled:opacity-50"
                        >
                          {t.builder.stories.add}
                        </button>
                      </div>
                    </div>

                    {/* Highlights list */}
                    <div className="flex gap-3 overflow-x-auto py-3 mt-2">
                      {highlights.map(h => (
                        <div key={h.id} className="relative group flex flex-col items-center shrink-0 w-16">
                          <img src={h.imageUrl} className="h-10 w-10 object-cover rounded-full border border-[hsl(var(--border))]" alt="" />
                          <span className="text-[10px] mt-1 text-[hsl(var(--muted-foreground))] truncate w-full text-center">{h.title}</span>
                          <button
                            type="button"
                            onClick={() => removeHighlightItem(h.id)}
                            className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}



              {/* TAB 5: HOURS & LOCATION */}
              {activeFormTab === "hours" && (
                <div className="space-y-6 animate-scale-in">
                  <div>
                    <h3 className="text-base font-bold text-[hsl(var(--foreground))] mb-1">{t.builder.hours.title}</h3>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{t.builder.hours.subtitle}</p>
                  </div>



                  <div className="border-[hsl(var(--border))] pt-2">
                    <h3 className="text-base font-bold text-[hsl(var(--foreground))] mb-3">{t.builder.hours.schedule}</h3>

                    <div className="space-y-2.5">
                      {operatingHours.map((d, index) => (
                        <div key={d.day} className="flex items-center justify-between border-b border-[hsl(var(--border))]/40 pb-2 last:border-0 last:pb-0">
                          <span className="text-xs font-semibold text-[hsl(var(--foreground))] w-24">{d.day}</span>

                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={!d.closed}
                                onChange={() => toggleDayClosed(index)}
                                className="rounded border-[hsl(var(--border))] text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
                              />
                              <span>{t.builder.hours.open}</span>
                            </label>

                            {!d.closed && (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={d.open}
                                  onChange={e => updateDayHours(index, "open", e.target.value)}
                                  className="w-16 rounded border border-[hsl(var(--border))] px-2 py-1 text-center text-xs outline-none bg-transparent text-[hsl(var(--foreground))]"
                                />
                                <span className="text-xs text-[hsl(var(--muted-foreground))]">-</span>
                                <input
                                  type="text"
                                  value={d.close}
                                  onChange={e => updateDayHours(index, "close", e.target.value)}
                                  className="w-16 rounded border border-[hsl(var(--border))] px-2 py-1 text-center text-xs outline-none bg-transparent text-[hsl(var(--foreground))]"
                                />
                              </div>
                            )}
                            {d.closed && (
                              <span className="text-xs font-semibold text-red-500 w-[140px] text-center">{t.builder.hours.closed}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* CLIENT-SIDE INTERACTIVE LIVE PREVIEW */}
        <div className={`col-span-12 flex flex-col w-full mx-auto mt-10 ${activeFormTab ? "xl:col-span-7 xl:mt-0" : "xl:col-span-12"
          }`}>
          <div className="flex items-center justify-between w-full mb-3 gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[hsl(var(--muted-foreground))]">
              <Eye className="h-4 w-4" /> {t.builder.preview.liveTitle}
            </div>
            <button
              type="button"
              onClick={() => setIsFullscreenPreview(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-[hsl(var(--primary))] hover:underline cursor-pointer bg-[hsl(var(--primary))]/5 px-2.5 py-1.5 rounded-lg border border-[hsl(var(--primary))]/20 transition-all hover:bg-[hsl(var(--primary))]/10"
            >
              <Eye className="h-3.5 w-3.5" /> {t.builder.preview.viewFullscreen}
            </button>
          </div>

          {/* Live Business Profile Preview Canvas */}
          <div className="w-full relative flex flex-col bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-2xl p-4 md:p-6 shadow-sm overflow-hidden animate-scale-in">
            <div className={profileStyles.profileContainer} style={{ padding: "0", maxWidth: "100%" }}>

              {/* Cover / Media Gallery */}
              <div className={profileStyles.coverGallery} style={{ height: "180px", borderRadius: "1rem", marginBottom: "1.5rem", position: "relative" }}>
                {previewCoverImage ? (
                  <img
                    src={previewCoverImage}
                    className={profileStyles.sliderImage}
                    alt=""
                  />
                ) : (
                  <span className={profileStyles.initialLogo} style={{ fontSize: "3rem" }}>{name ? name[0] : "A"}</span>
                )}
                <div className={profileStyles.coverOverlay} />
              </div>

              {/* Profile Header Details */}
              <div className={profileStyles.profileHeader} style={{ gap: "1rem", marginBottom: "1.5rem" }}>
                <div className={profileStyles.titleBlock}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.25rem", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                      {name || "Business Name"}
                      <span className={`${profileStyles.verifiedBadge} ${activePlan === "premium" || activePlan === "standard"
                        ? profileStyles.verifiedGold
                        : profileStyles.verifiedStarter
                        }`} style={{ fontSize: "0.65rem", padding: "0.15rem 0.45rem" }}>
                        <BadgeCheck className="h-3 w-3" /> Verified Partner
                      </span>
                    </h1>
                  </div>
                  {foundedYear && <p className="text-[hsl(var(--muted-foreground))] mt-0.5 text-xs">Since {foundedYear}</p>}
                  <div className="flex items-center gap-3 flex-wrap text-xs text-[hsl(var(--muted-foreground))] mt-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-[hsl(var(--primary))]" /> {address ? `${address}, ${city}` : `${city}, Armenia`}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{' '}
                      {rating.toFixed(1)} ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
                    </span>
                    {foundedYear && (
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Est. {foundedYear}</span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-primary py-2 px-4 rounded-xl text-xs font-semibold shadow-md shrink-0 cursor-default"
                >
                  Book Appointment
                </button>
              </div>

              {/* Highlights Section */}
              {highlights && highlights.length > 0 && (
                <div className={profileStyles.highlightsContainer} style={{ marginBottom: "1.5rem" }}>
                  <h2 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.75rem" }}>Key Features & Highlights</h2>
                  <div className={profileStyles.highlightsWrapper}>
                    {highlights.map((h, i) => (
                      <div key={i} className={profileStyles.highlightTile} style={{ minWidth: "64px" }}>
                        <div className={profileStyles.storyRing} style={{ height: "54px", width: "54px" }}>
                          {h.imageUrl ? (
                            <img src={h.imageUrl} className={profileStyles.storyThumb} alt={h.title} style={{ borderRadius: "50%" }} />
                          ) : (
                            <div className={profileStyles.storyThumb}>✨</div>
                          )}
                        </div>
                        <span style={{ fontSize: "0.65rem" }}>{h.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Showcase Gallery Section */}
              {gallery && gallery.length > 0 && (
                <section className={profileStyles.gallerySection} style={{ marginBottom: "1.5rem" }}>
                  <div className={profileStyles.galleryHeader}>
                    <h2 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Gallery</h2>
                    <span className={profileStyles.photoCount} style={{ fontSize: "0.75rem" }}>
                      {gallery.length} {gallery.length === 1 ? "photo" : "photos"}
                    </span>
                  </div>
                  <div className={`${profileStyles.bentoGrid} ${gallery.length === 1 ? profileStyles.grid1 :
                    gallery.length === 2 ? profileStyles.grid2 :
                      gallery.length === 3 ? profileStyles.grid3 :
                        gallery.length === 4 ? profileStyles.grid4 :
                          profileStyles.grid5
                    }`}>
                    {gallery.slice(0, 5).map((url: string, index: number) => {
                      const isLastAndMore = index === 4 && gallery.length > 5;
                      return (
                        <div
                          key={index}
                          className={profileStyles.galleryItem}
                          onClick={() => setZoomImageIdx(index)}
                          style={{ cursor: "zoom-in" }}
                        >
                          <img src={url} alt={`Gallery ${index + 1}`} />
                          {isLastAndMore && (
                            <div className={profileStyles.moreOverlay}>
                              <span className={profileStyles.moreCount}>+{gallery.length - 4}</span>
                              <span className={profileStyles.moreText} style={{ fontSize: "0.65rem" }}>view all</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Main Grid Content */}
              <div className="grid grid-cols-1 gap-6 w-full">
                <div>

                  {/* Operating hours */}
                  <section className="mb-6">
                    <h2 className="text-sm font-bold mb-2">Operating Hours</h2>
                    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] divide-y divide-[hsl(var(--border))]">
                      {operatingHours.map((h) => (
                        <div key={h.day} className="flex items-center justify-between px-3 py-2 text-xs">
                          <span className="font-medium">{h.day}</span>
                          <span className="text-[hsl(var(--muted-foreground))]">
                            {h.closed ? "Closed" : `${h.open} — ${h.close}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                {/* Sidebar area */}
                <div className="space-y-4">


                  <div className="mb-4">
                    <BusinessMap
                      lat={lat}
                      lng={lng}
                      name={name || "Your Business"}
                      address={address || ""}
                    />
                  </div>

                  {/* Contact Details */}
                  <div className={profileStyles.contactCard} style={{ padding: "1rem", borderRadius: "1rem" }}>
                    <h3 style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.75rem" }}>{t.business?.contact || "Information"}</h3>
                    <div className="space-y-2">
                      <a href={`tel:${phone}`} className={profileStyles.contactItem} style={{ fontSize: "0.75rem" }}>
                        <Phone className="h-3.5 w-3.5 text-[hsl(var(--primary))]" /> {phone}
                      </a>
                      <a href={`mailto:${email}`} className={profileStyles.contactItem} style={{ fontSize: "0.75rem" }}>
                        <Mail className="h-3.5 w-3.5 text-[hsl(var(--primary))]" /> {email}
                      </a>
                      {website && (
                        <a href={website} target="_blank" rel="noreferrer" className={profileStyles.contactItem} style={{ fontSize: "0.75rem" }}>
                          <Globe className="h-3.5 w-3.5 text-[hsl(var(--primary))]" /> Visit Website
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* STORY ARCHIVE MODAL */}
      {isStoryArchiveModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-2xl p-6 shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col relative">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">Story Archive</h2>
              <button
                onClick={() => setIsStoryArchiveModalOpen(false)}
                className="p-2 bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] rounded-full hover:bg-[hsl(var(--border))] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">Select stories to include in this Highlight collection. The first selected story will be used as the cover image.</p>

            <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar pr-2 pb-4">
              {storyArchive.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center text-[hsl(var(--muted-foreground))]">
                  <GridIcon className="h-10 w-10 mb-2 opacity-20" />
                  <p>No stories found in your archive.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {storyArchive.map((story) => {
                    const isSelected = selectedArchiveStories.includes(story._id);
                    const selectedIndex = selectedArchiveStories.indexOf(story._id);
                    return (
                      <div
                        key={story._id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedArchiveStories(prev => prev.filter(id => id !== story._id));
                          } else {
                            setSelectedArchiveStories(prev => [...prev, story._id]);
                          }
                        }}
                        className={`relative aspect-[9/16] rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${isSelected ? 'border-[hsl(var(--primary))] scale-[0.98] shadow-lg' : 'border-transparent hover:border-[hsl(var(--border))]'}`}
                      >
                        {story.mediaType === 'video' ? (
                          <video src={story.mediaUrl} className="w-full h-full object-cover" />
                        ) : (
                          <img src={story.mediaUrl} className="w-full h-full object-cover" alt="Story" />
                        )}

                        {/* Selected Indicator */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-[hsl(var(--primary))] text-white flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm z-10">
                            {selectedIndex + 1}
                          </div>
                        )}

                        {/* Expiration overlay */}
                        {new Date(story.expiresAt) < new Date() && (
                          <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white backdrop-blur-md">
                            Archived
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[hsl(var(--border))] flex justify-end gap-3 mt-auto">
              <button
                type="button"
                onClick={() => setIsStoryArchiveModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--border))]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN PREVIEW OVERLAY */}
      {isFullscreenPreview && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md p-4 md:p-8 flex items-start justify-center animate-fade-in select-none">
          <button
            type="button"
            onClick={() => setIsFullscreenPreview(false)}
            className="fixed top-6 right-6 z-50 p-2.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors border border-white/10 cursor-pointer shadow-lg"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="w-full max-w-5xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-2xl overflow-hidden shadow-2xl relative my-8 flex flex-col text-[hsl(var(--foreground))] p-6 md:p-10">
            <div className={profileStyles.profileContainer} style={{ padding: "0", maxWidth: "100%", width: "100%" }}>

              {/* Back Link */}
              <div className={profileStyles.backLink} style={{ cursor: "default" }}>
                <ArrowLeft className="h-4 w-4" /> Back to Directory
              </div>

              {/* Cover / Media Gallery */}
              <div className={profileStyles.coverGallery}>
                {previewCoverImage ? (
                  <img
                    src={previewCoverImage}
                    className={profileStyles.sliderImage}
                    alt=""
                  />
                ) : (
                  <span className={profileStyles.initialLogo}>{name ? name[0] : "A"}</span>
                )}
                <div className={profileStyles.coverOverlay} />
              </div>

              {/* Profile Header Details */}
              <div className={profileStyles.profileHeader}>
                <div className={profileStyles.titleBlock}>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1>
                      {name || "Business Name"}
                      <span className={`${profileStyles.verifiedBadge} ${activePlan === "premium" || activePlan === "standard"
                        ? profileStyles.verifiedGold
                        : profileStyles.verifiedStarter
                        }`}>
                        <BadgeCheck className="h-3.5 w-3.5" /> Verified Partner
                      </span>
                    </h1>
                  </div>
                  {foundedYear && <p className="text-[hsl(var(--muted-foreground))] mt-1 text-base">Since {foundedYear}</p>}
                  <div className="flex items-center gap-4 flex-wrap text-sm text-[hsl(var(--muted-foreground))] mt-4">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-[hsl(var(--primary))]" /> {address ? `${address}, ${city}` : `${city}, Armenia`}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />{' '}
                      {rating.toFixed(1)} ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
                    </span>
                    {foundedYear && (
                      <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Est. {foundedYear}</span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-primary py-3.5 px-6 rounded-xl text-sm font-semibold shadow-lg shrink-0 cursor-default"
                >
                  Book Appointment
                </button>
              </div>

              {/* Highlights Section (Story circles) */}
              {highlights && highlights.length > 0 && (
                <div className={profileStyles.highlightsContainer}>
                  <h2>Key Features & Highlights</h2>
                  <div className={profileStyles.highlightsWrapper}>
                    {highlights.map((h, i) => (
                      <div key={i} className={profileStyles.highlightTile}>
                        <div className={profileStyles.storyRing}>
                          {h.imageUrl ? (
                            <img src={h.imageUrl} className={profileStyles.storyThumb} alt={h.title} style={{ borderRadius: "50%" }} />
                          ) : (
                            <div className={profileStyles.storyThumb}>✨</div>
                          )}
                        </div>
                        <span>{h.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Showcase Gallery Section */}
              {gallery && gallery.length > 0 && (
                <section className={profileStyles.gallerySection} style={{ marginBottom: "2rem" }}>
                  <div className={profileStyles.galleryHeader}>
                    <h2>Gallery</h2>
                    <span className={profileStyles.photoCount}>
                      {gallery.length} {gallery.length === 1 ? "photo" : "photos"}
                    </span>
                  </div>
                  <div className={`${profileStyles.bentoGrid} ${gallery.length === 1 ? profileStyles.grid1 :
                    gallery.length === 2 ? profileStyles.grid2 :
                      gallery.length === 3 ? profileStyles.grid3 :
                        gallery.length === 4 ? profileStyles.grid4 :
                          profileStyles.grid5
                    }`}>
                    {gallery.slice(0, 5).map((url: string, index: number) => {
                      const isLastAndMore = index === 4 && gallery.length > 5;
                      return (
                        <div
                          key={index}
                          className={profileStyles.galleryItem}
                          onClick={() => setZoomImageIdx(index)}
                          style={{ cursor: "zoom-in" }}
                        >
                          <img src={url} alt={`Gallery ${index + 1}`} />
                          {isLastAndMore && (
                            <div className={profileStyles.moreOverlay}>
                              <span className={profileStyles.moreCount}>+{gallery.length - 4}</span>
                              <span className={profileStyles.moreText}>view all photos</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Main Grid Content */}
              <div className={profileStyles.gridContent}>
                {/* Left Column: digital catalogs */}
                <div>

                  <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] lg:grid-cols-[1fr_300px] gap-6 mb-6 items-stretch">
                    {/* Operating hours */}
                    <section className="flex flex-col h-full">
                      <h2 className="text-lg font-bold mb-3">Operating Hours</h2>
                      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] divide-y divide-[hsl(var(--border))] flex-1">
                        {operatingHours.map((h) => (
                          <div key={h.day} className="flex items-center justify-between px-4 py-2.5 text-sm">
                            <span className="font-medium">{h.day}</span>
                            <span className="text-[hsl(var(--muted-foreground))]">
                              {h.closed ? "Closed" : `${h.open} — ${h.close}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* Contact Details */}
                    <section className="flex flex-col h-full">
                      <h2 className="text-lg font-bold mb-3">{t.business?.contact || "Information"}</h2>
                      <div className={`${profileStyles.contactCard} !mt-0 flex-1 flex flex-col justify-center`}>
                        <div className="space-y-3">
                          <a href={`tel:${phone}`} className={profileStyles.contactItem}>
                            <Phone className="h-4 w-4 text-[hsl(var(--primary))]" /> {phone}
                          </a>
                          <a href={`mailto:${email}`} className={profileStyles.contactItem}>
                            <Mail className="h-4 w-4 text-[hsl(var(--primary))]" /> {email}
                          </a>
                          {website && (
                            <a href={website} target="_blank" rel="noreferrer" className={profileStyles.contactItem}>
                              <Globe className="h-4 w-4 text-[hsl(var(--primary))]" /> Visit Website
                            </a>
                          )}
                        </div>
                      </div>
                    </section>
                  </div>
                </div>

                {/* Right Column: sidebar widgets */}
                <div className={profileStyles.sidebar}>


                  <div className="mb-4">
                    <BusinessMap
                      lat={lat}
                      lng={lng}
                      name={name || "Your Business"}
                      address={address || ""}
                    />
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* GALLERY LIGHTBOX ZOOM */}
      {zoomImageIdx !== null && gallery.length > 0 && (
        <div
          className={profileStyles.lightboxOverlay}
          onClick={() => setZoomImageIdx(null)}
        >
          <div className={profileStyles.galleryLightboxContent} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setZoomImageIdx(null)}
              className={profileStyles.lightboxClose}
              aria-label="Close lightbox"
            >
              <X className="h-6 w-6" />
            </button>

            <div className={profileStyles.lightboxMediaWrapper}>
              <img
                src={gallery[zoomImageIdx]}
                alt={`Gallery ${zoomImageIdx + 1}`}
                className={profileStyles.galleryLightboxImage}
              />
              <div className={profileStyles.lightboxText}>
                <h3>{name || "Business Name"}</h3>
                <p>Gallery ({zoomImageIdx + 1} / {gallery.length})</p>
              </div>
            </div>

            {gallery.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoomImageIdx((zoomImageIdx - 1 + gallery.length) % gallery.length);
                  }}
                  className={profileStyles.lightboxPrev}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoomImageIdx((zoomImageIdx + 1) % gallery.length);
                  }}
                  className={profileStyles.lightboxNext}
                  aria-label="Next image"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Hidden File Input for Logo Upload */}
      <input
        type="file"
        ref={logoInputRef}
        onChange={handleLogoUpload}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
}
