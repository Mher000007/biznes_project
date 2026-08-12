"use client";
import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { MOCK_BUSINESSES } from "@/data/mock-businesses";
import { Star, MapPin, BadgeCheck, Globe, Phone, Mail, Clock, Users, Calendar, ArrowLeft, Send, X, Compass, ChevronLeft, ChevronRight, CheckCircle, Maximize2, ChevronDown, Heart, Bookmark, Sparkles, Coins } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { getApiUrl } from "@/lib/utils";
import styles from "@/components/business/BusinessProfile.module.scss";
import ReviewsSection from "@/components/business/ReviewsSection";
import StoryViewer from "@/components/landing/StoryViewer";
import { useI18n } from "@/i18n";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import dynamic from "next/dynamic";
import { getOpenStatus } from "@/components/discover/BusinessCard";
import CustomServiceSelect from "@/components/ui/CustomServiceSelect";

const BusinessMap = dynamic(() => import("@/components/map/BusinessMap"), {
  ssr: false,
  loading: () => <div className="h-[220px] rounded-xl bg-[hsl(var(--muted))] animate-pulse" />,
});



const DEFAULT_HOURS = [
  { day: "Monday", open: "09:00", close: "18:00", closed: false },
  { day: "Tuesday", open: "09:00", close: "18:00", closed: false },
  { day: "Wednesday", open: "09:00", close: "18:00", closed: false },
  { day: "Thursday", open: "09:00", close: "18:00", closed: false },
  { day: "Friday", open: "09:00", close: "18:00", closed: false },
  { day: "Saturday", open: "09:00", close: "18:00", closed: false },
  { day: "Sunday", open: "09:00", close: "18:00", closed: true },
];

interface Service {
  id?: string;
  _id?: string;
  name: string;
  description: string;
  price: number;
  priceRange?: string;
  duration?: string;
}

interface MenuItem {
  id?: string;
  _id?: string;
  name: string;
  description: string;
  price: number;
  category?: string;
}

interface Highlight {
  imageUrl?: string;
  title: string;
  icon?: string;
  description?: string;
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
const formatAddress = (address: string, city: string) => {
  if (!address) return city || '';
  const parts = address.split(',').map((p: string) => p.trim()).filter(Boolean);
  const short = parts.slice(0, 2).join(', ');
  return city && !short.includes(city) ? `${short}, ${city}` : short;
};

export default function BusinessProfilePage() {
  const { slug } = useParams() as { slug: string };
  const router = useRouter();
  const { locale, t } = useI18n();
  const { showToast } = useToast();
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [activeHighlight, setActiveHighlight] = useState<Highlight | null>(null);
  const [activeHighlightIdx, setActiveHighlightIdx] = useState<number>(-1);
  const [activeGalleryIdx, setActiveGalleryIdx] = useState<number | null>(null);

  // Extract gallery images
  const galleryImages: string[] = (() => {
    if (!business) return [];
    return business.images || [];
  })();

  // Keyboard navigation for gallery lightbox
  useEffect(() => {
    if (activeGalleryIdx === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveGalleryIdx(null);
      } else if (e.key === "ArrowLeft") {
        setActiveGalleryIdx(prev =>
          prev !== null && galleryImages.length > 0 ? (prev - 1 + galleryImages.length) % galleryImages.length : null
        );
      } else if (e.key === "ArrowRight") {
        setActiveGalleryIdx(prev =>
          prev !== null && galleryImages.length > 0 ? (prev + 1) % galleryImages.length : null
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeGalleryIdx, galleryImages]);

  // Rating / Reviews State (live-synced from ReviewsSection)
  const [liveRating, setLiveRating] = useState(0);
  const [liveReviewCount, setLiveReviewCount] = useState(0);

  // Active stories states
  const [activeStoriesGroups, setActiveStoriesGroups] = useState<any[]>([]);
  const [matchingGroupIdx, setMatchingGroupIdx] = useState<number | null>(null);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [isLogoStoryViewed, setIsLogoStoryViewed] = useState(false);

  useEffect(() => {
    if (slug && typeof window !== "undefined") {
      const viewed = localStorage.getItem(`viewed_story_${slug}`);
      if (viewed === "true") {
        setIsLogoStoryViewed(true);
      }
    }
  }, [slug]);

  const handleMarkStoryAsViewed = () => {
    setIsLogoStoryViewed(true);
    if (slug && typeof window !== "undefined") {
      localStorage.setItem(`viewed_story_${slug}`, "true");
    }
  };

  // Highlights Story Viewer State
  const [showHighlightViewer, setShowHighlightViewer] = useState(false);
  const [highlightViewerGroups, setHighlightViewerGroups] = useState<any[]>([]);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const apiURL = getApiUrl();
        const res = await axios.get(`${apiURL}/stories`);
        if (res.data?.success && res.data?.data) {
          const allGroups = res.data.data;
          setActiveStoriesGroups(allGroups);

          // Find the group index for the current business slug
          const idx = allGroups.findIndex((g: any) => g.business.slug === slug);
          if (idx !== -1) {
            setMatchingGroupIdx(idx);
          }
        }
      } catch (err) {
        console.error("Failed to fetch stories for profile:", err);
      }
    };
    if (slug) fetchStories();
  }, [slug]);



  const formatPhoneDigits = (raw: string) => {
    if (!raw) return "";
    const clean = raw.replace(/^\+374/, "").replace(/\D/g, "").slice(0, 8);
    return clean.match(/.{1,2}/g)?.join(" ") || "";
  };

  const { currentUser } = useAuth();
  const isBusinessUser = currentUser?.role === "business_owner" || currentUser?.accountType === "business";
  // Booking Modal State
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [customerName, setCustomerName] = useState(currentUser?.name || currentUser?.username || "");
  const [customerPhone, setCustomerPhone] = useState(formatPhoneDigits(currentUser?.phone || ""));
  const [bookingDate, setBookingDate] = useState("");

  useEffect(() => {
    const displayName = currentUser?.name || currentUser?.username;
    if (displayName && customerName !== displayName) {
      setCustomerName(displayName);
    }
    if (currentUser?.phone && !customerPhone) {
      setCustomerPhone(formatPhoneDigits(currentUser.phone));
    }
  }, [currentUser, customerName, customerPhone]);
  const [bookingTime, setBookingTime] = useState("");
  const [isCustomDateClosed, setIsCustomDateClosed] = useState(false);
  const [bookingLocation, setBookingLocation] = useState("");
  const [isLocDropdownOpen, setIsLocDropdownOpen] = useState(false);
  const [bookingNotes, setBookingNotes] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [businessOffers, setBusinessOffers] = useState<any[]>([]);

  useEffect(() => {
    async function fetchOffersForBiz() {
      if (!business) return;
      const bId = business._id || business.id;
      if (!bId) return;
      try {
        const apiURL = getApiUrl();
        const res = await axios.get(`${apiURL}/offers/business/${bId}`);
        if (res.data?.success && res.data?.data) {
          setBusinessOffers(res.data.data);
        }
      } catch (e) {
        if (business.offers && Array.isArray(business.offers)) {
          setBusinessOffers(business.offers);
        }
      }
    }
    fetchOffersForBiz();
  }, [business]);

  const isClosed = business
    ? !getOpenStatus(business.operatingHours || business.metadata?.operatingHours, t).isOpen
    : false;

  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    if (!currentUser || isBusinessUser) {
      setIsFavorited(false);
      return;
    }
    if (typeof window !== "undefined" && business) {
      try {
        const uKey = currentUser.username || currentUser.email || (currentUser as any).id || (currentUser as any)._id || "";
        const userFavsKey = `armbiz_favorites_${uKey}`;
        const favsStr = localStorage.getItem(userFavsKey);
        if (favsStr) {
          const favs: string[] = JSON.parse(favsStr);
          if (favs.includes(business.id) || (business.slug && favs.includes(business.slug))) {
            setIsFavorited(true);
          } else {
            setIsFavorited(false);
          }
        } else {
          setIsFavorited(false);
        }
      } catch (e) { }
    }
  }, [business, currentUser, isBusinessUser]);

  const toggleFavorite = () => {
    if (isBusinessUser) return;
    if (!currentUser) {
      showToast();
      return;
    }
    if (typeof window === "undefined" || !business) return;

    try {
      const uKey = currentUser.username || currentUser.email || (currentUser as any).id || (currentUser as any)._id || "";
      if (!uKey) return;
      const userFavsKey = `armbiz_favorites_${uKey}`;
      const userItemsKey = `armbiz_favorites_items_${uKey}`;

      const favsStr = localStorage.getItem(userFavsKey);
      const itemsStr = localStorage.getItem(userItemsKey);

      let favs: string[] = favsStr ? JSON.parse(favsStr) : [];
      let itemsMap: Record<string, any> = itemsStr ? JSON.parse(itemsStr) : {};

      const key = business.slug || business.id;
      const isCurrentlyFav = favs.includes(business.id) || (business.slug && favs.includes(business.slug));

      const getSafeLogo = (raw: any) => {
        if (!raw || typeof raw !== "string") return "";
        if (raw.startsWith("data:") && raw.length > 500000) return "";
        return raw;
      };
      const rawLogo = (business.logoUrl || business.logo || (Array.isArray(business.images) && business.images[0]) || business.coverImageUrl || (business as any).coverUrl || (business as any).image || (business as any).avatar || "") as string;
      const logo = getSafeLogo(rawLogo);

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
          name: business.name ? String(business.name).slice(0, 100) : "",
          city: business.city || "Yerevan",
          category: typeof business.category === "object" ? business.category?.name : business.category,
          ratingAvg: business.ratingAvg || 5.0,
          logo: logo,
          logoUrl: logo
        };
        setIsFavorited(true);
      }

      const safeSet = (k: string, val: string) => {
        try { localStorage.setItem(k, val); } catch (err) { }
      };

      safeSet(userFavsKey, JSON.stringify(favs));
      safeSet(userItemsKey, JSON.stringify(itemsMap));

      window.dispatchEvent(new Event("favoritesUpdated"));
    } catch (e) {
      console.error("Failed to update favorites:", e);
    }
  };

  // Prevent background scrolling when Booking Modal is open
  useEffect(() => {
    if (isBookingOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isBookingOpen]);

  // Check if custom date is closed
  useEffect(() => {
    if (!bookingDate || !business?._id) {
      setIsCustomDateClosed(false);
      return;
    }
    const checkDateClosure = async () => {
      try {
        const res = await axios.get(`${getApiUrl()}/businesses/${business._id}/calendar/check-date?date=${bookingDate}`);
        if (res.data?.success) {
          setIsCustomDateClosed(res.data.isClosed === true);
        }
      } catch (err) {
        console.warn("Failed to check date closure:", err);
        setIsCustomDateClosed(false);
      }
    };
    checkDateClosure();
  }, [bookingDate, business]);

  // Resolve today's operating hours for time selection validation
  const todayOperatingHours = React.useMemo(() => {
    if (!bookingDate) return null;

    // Parse the date (YYYY-MM-DD) carefully to avoid timezone shift
    const [y, m, d] = bookingDate.split('-').map(Number);
    const localDate = new Date(y, m - 1, d);
    const dayName = localDate.toLocaleDateString("en-US", { weekday: 'long' });

    // Resolve operating hours layout
    const hours = business?.operatingHours && business.operatingHours.length > 0
      ? business.operatingHours.map((h: any) => ({
        day: h.dayName || h.day,
        open: h.openTime || h.open,
        close: h.closeTime || h.close,
        closed: h.closed === true || h.isClosed === true || (!h.openTime && !h.open && !h.closeTime && !h.close)
      }))
      : DEFAULT_HOURS;

    const todayHours = hours.find((h: any) => h.day?.toLowerCase() === dayName.toLowerCase());
    return todayHours || null;
  }, [bookingDate, business]);

  const fetchedSlug = useRef<string | null>(null);

  // Load Business Details (Try backend first, then local mock fallback)
  useEffect(() => {
    if (fetchedSlug.current === slug) return;
    fetchedSlug.current = slug;

    async function loadBusiness() {
      setLoading(true);
      try {
        const apiURL = getApiUrl();
        const res = await axios.get(`${apiURL}/businesses/slug/${slug}`);
        if (res.data?.success && res.data?.data) {
          const biz = res.data.data;
          // Clean default placeholder assets from business
          biz.logo = biz.logo && !isDefaultImage(biz.logo) ? biz.logo : "";
          biz.images = (biz.images || []).filter((url: string) => !isDefaultImage(url));
          biz.highlights = (biz.highlights || []).filter((h: any) => !isDefaultHighlight(h));
          if (biz.metadata?.coverUrl) {
            if (Array.isArray(biz.metadata.coverUrl)) {
              biz.metadata.coverUrl = biz.metadata.coverUrl.filter((url: string) => !isDefaultImage(url));
            } else if (typeof biz.metadata.coverUrl === 'string' && isDefaultImage(biz.metadata.coverUrl)) {
              biz.metadata.coverUrl = "";
            }
          }
          // Resolve operatingHours from metadata if not present at top-level
          biz.operatingHours = biz.operatingHours || biz.metadata?.operatingHours || [];

          setBusiness(biz);
          setLiveRating(biz.rating || 0);
          setLiveReviewCount(biz.reviewCount || 0);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Backend lookup failed, checking local mock database", err);
      }

      // Check local storage first
      if (typeof window !== "undefined") {
        const profilesStr = window.localStorage.getItem("armbiz-business-profiles");
        if (profilesStr) {
          try {
            const profiles = JSON.parse(profilesStr);
            const foundProfileIndex = profiles.findIndex((p: any) => {
              const profileSlug = p.businessName ? p.businessName.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w\u0531-\u058F-]/g, "") : "";
              const decodedSlug = typeof slug === "string" ? decodeURIComponent(slug) : slug;
              return (profileSlug === slug || profileSlug === decodedSlug || p.ownerUsername === slug || `custom-${p.ownerUsername}` === slug) && p.isPublished;
            });
            if (foundProfileIndex !== -1) {
              const foundProfile = profiles[foundProfileIndex];
              // Increment viewCount
              const currentViews = foundProfile.viewCount !== undefined ? foundProfile.viewCount : 0;
              foundProfile.viewCount = currentViews + 1;
              window.localStorage.setItem("armbiz-business-profiles", JSON.stringify(profiles));

              const categorySlug = foundProfile.category || "building-material";
              const categoryObj = {
                id: `cat-${categorySlug}`,
                name: categorySlug === "building-material" ? "Building Material" : categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1),
                slug: categorySlug,
                description: "",
                icon: categorySlug === "building-material" ? "Hammer" : "Monitor",
                count: 0
              };
              const servicesMapped = (foundProfile.services || []).map((s: any, idx: number) => ({
                id: `custom-s-${idx}`,
                name: s.name,
                description: s.description || "",
                price: Number(s.price) || 0,
                priceRange: s.price ? `${s.price} AMD` : "Contact",
                duration: "45 mins"
              }));

              const daysMap: Record<string, number> = {
                "Sunday": 0, "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6
              };
              const hoursMapped = (foundProfile.operatingHours || []).map((h: any) => ({
                day: daysMap[h.day] ?? 1,
                dayName: h.day,
                openTime: h.open,
                closeTime: h.close,
                isClosed: h.closed
              }));

              const normalizedBiz = {
                id: `custom-${foundProfile.ownerUsername}`,
                slug: slug,
                name: foundProfile.businessName || "My Custom Business",
                description: foundProfile.fullDesc || foundProfile.shortDesc || "",
                shortDescription: foundProfile.shortDesc || "",
                category: categoryObj,
                categoryId: categoryObj.id,
                address: foundProfile.address || "",
                city: foundProfile.city || "Yerevan",
                region: foundProfile.city || "Yerevan",
                latitude: 40.1872,
                longitude: 44.5152,
                phone: foundProfile.phone || "",
                email: foundProfile.email || "",
                website: foundProfile.website || "",
                foundedYear: Number(foundProfile.foundedYear) || 2026,
                employeeCount: "11-50",
                services: servicesMapped,
                logoUrl: foundProfile.logo && !isDefaultImage(foundProfile.logo) ? foundProfile.logo : "",
                coverImageUrl: foundProfile.coverUrl ? (Array.isArray(foundProfile.coverUrl) ? foundProfile.coverUrl.filter((url: string) => !isDefaultImage(url))[0] : (!isDefaultImage(foundProfile.coverUrl) ? foundProfile.coverUrl : "")) : "",
                images: (foundProfile.gallery || []).filter((url: string) => !isDefaultImage(url)),
                status: "active",
                isFeatured: false,
                isVerified: true,
                viewCount: foundProfile.viewCount !== undefined ? foundProfile.viewCount : 0,
                inquiryCount: foundProfile.inquiryCount !== undefined ? foundProfile.inquiryCount : 0,
                ratingAvg: foundProfile.ratingAvg !== undefined ? foundProfile.ratingAvg : 0.0,
                reviewCount: foundProfile.reviewCount !== undefined ? foundProfile.reviewCount : 0,
                createdAt: foundProfile.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                operatingHours: hoursMapped,
                tags: foundProfile.tags ? foundProfile.tags.split(",").map((t: string) => t.trim()) : [],
                menu: categoryObj.slug === "horeca" ? [
                  { name: "Armenian Khorovats (BBQ)", price: 4200, description: "Charcoal grilled marinated pork loin", category: "Main Course" },
                  { name: "Lavash Wrap", price: 1800, description: "Flatbread wrap with fresh greens and cheese", category: "Appetizer" }
                ] : [],
                highlights: (foundProfile.highlights || [])
                  .filter((h: any) => !isDefaultHighlight(h))
                  .map((h: any) => ({
                    title: h.title,
                    imageUrl: h.imageUrl || "",
                    icon: h.imageUrl ? undefined : "✨",
                    description: h.description || ""
                  }))
              };
              setBusiness(normalizedBiz);
              setLiveRating(normalizedBiz.ratingAvg || 0);
              setLiveReviewCount(normalizedBiz.reviewCount || 0);
              setLoading(false);
              return;
            }
          } catch (e) {
            console.error("Error parsing localstorage business profiles", e);
          }
        }
      }

      // Fallback to MOCK_BUSINESSES
      const mockBiz = MOCK_BUSINESSES.find((b) => b.slug === slug);
      if (mockBiz) {
        // Increment mock views in localStorage
        let updatedViews = mockBiz.viewCount;
        let updatedInqs = mockBiz.inquiryCount;
        let updatedRating = mockBiz.ratingAvg;
        let updatedReviewsCount = mockBiz.reviewCount;
        if (typeof window !== "undefined") {
          const mockViewsKey = "armbiz-mock-views";
          try {
            const mockViewsMap = JSON.parse(window.localStorage.getItem(mockViewsKey) || "{}");
            const currentViews = mockViewsMap[slug] !== undefined ? mockViewsMap[slug] : mockBiz.viewCount;
            updatedViews = currentViews + 1;
            mockViewsMap[slug] = updatedViews;
            window.localStorage.setItem(mockViewsKey, JSON.stringify(mockViewsMap));
          } catch (e) {
            console.error("Error updating mock views in localStorage", e);
          }

          const mockInqKey = "armbiz-mock-inquiries";
          try {
            const mockInqMap = JSON.parse(window.localStorage.getItem(mockInqKey) || "{}");
            if (mockInqMap[slug] !== undefined) {
              updatedInqs = mockInqMap[slug];
            }
          } catch (e) { }

          const mockReviewKey = "armbiz-mock-reviews";
          try {
            const mockReviewsMap = JSON.parse(window.localStorage.getItem(mockReviewKey) || "{}");
            if (mockReviewsMap[slug] !== undefined) {
              updatedRating = mockReviewsMap[slug].ratingAvg;
              updatedReviewsCount = mockReviewsMap[slug].reviewCount;
            }
          } catch (e) { }
        }

        // Map mock structures to DB structures
        const normalizedBiz = {
          ...mockBiz,
          viewCount: updatedViews,
          inquiryCount: updatedInqs,
          ratingAvg: updatedRating,
          reviewCount: updatedReviewsCount,
          services: mockBiz.services.map(s => ({
            name: s.name,
            description: s.description,
            price: s.priceRange && s.priceRange.includes('$') ? parseInt(s.priceRange.replace(/[^0-9]/g, '')) * 400 || 5000 : 8000,
            duration: "45 mins"
          })),
          menu: mockBiz.category.slug === "horeca" ? [
            { name: "Armenian Khorovats (BBQ)", price: 4200, description: "Charcoal grilled marinated pork loin", category: "Main Course" },
            { name: "Lavash Wrap", price: 1800, description: "Flatbread wrap with fresh greens and cheese", category: "Appetizer" },
            { name: "Basturma Platter", price: 3200, description: "Air-cured beef with fenugreek spice", category: "Appetizer" },
            { name: "Khachapuri", price: 2500, description: "Cheese-filled crusty bread", category: "Main Course" },
            { name: "Armenian Brandy (10 Y.O)", price: 4500, description: "Premium local brandy glass", category: "Drinks" }
          ] : [],
          highlights: []
        };
        setBusiness(normalizedBiz);
        setLiveRating(normalizedBiz.ratingAvg || 0);
        setLiveReviewCount(normalizedBiz.reviewCount || 0);
      }
      setLoading(false);
    }
    if (slug) loadBusiness();
  }, [slug]);

  if (loading) {
    return (
      <div className="pt-32 pb-24 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[hsl(var(--primary))] border-r-transparent align-[-0.125em]" />
        <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">Loading profile details...</p>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="pt-32 pb-24 text-center">
        <h2 className="text-2xl font-bold">Business Not Found</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">The requested listing could not be resolved.</p>
        <Link href="/discover" className="btn-primary mt-6 px-4 py-2 inline-block">
          Return to Directory
        </Link>
      </div>
    );
  }

  // handleRateSubmit is now handled inside ReviewsSection

  // Extract coordinates supporting both flat and nested database formats
  const lat = business.coordinates?.latitude || business.latitude || 40.1872;
  const lng = business.coordinates?.longitude || business.longitude || 44.5152;

  // Handle Navigator Direction Redirects
  const handleDirections = (provider: 'google' | 'yandex') => {
    const url = provider === 'google'
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
      : `https://yandex.com/maps/?rtext=~${lat},${lng}`;
    window.open(url, '_blank');
  };

  // Open booking flow for selected service/menu item
  const openBooking = (item: any) => {
    if (isBusinessUser) return;
    if (!currentUser) {
      showToast();
      return;
    }
    setSelectedService(item);
    setIsBookingOpen(true);
    setBookingSuccess(false);
  };

  const openHighlight = (idx: number) => {
    const highlight = business.highlights[idx];
    if (highlight.stories && highlight.stories.length > 0) {
      // It's a collection of stories! Open StoryViewer.
      const pseudoGroup = {
        business: {
          _id: business.id || business._id,
          name: highlight.title, // Show highlight title as the group name
          slug: business.slug,
          logo: highlight.imageUrl || business.logo || business.logoUrl,
          verified: business.isVerified || business.verified
        },
        stories: highlight.stories
      };
      setHighlightViewerGroups([pseudoGroup]);
      setShowHighlightViewer(true);
    } else {
      // Legacy static highlight fallback
      setActiveHighlight(highlight);
      setActiveHighlightIdx(idx);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBusinessUser) return;
    setBookingLoading(true);

    if (isCustomDateClosed || todayOperatingHours?.closed) {
      alert("This business is closed for bookings on the selected date.");
      setBookingLoading(false);
      return;
    }

    if (business.locations && business.locations.length > 0 && !bookingLocation) {
      alert("Please select a branch/location before booking.");
      setBookingLoading(false);
      return;
    }

    const cleanPhoneDigits = customerPhone.replace(/\D/g, "");
    const fullCustomerPhone = cleanPhoneDigits ? `+374${cleanPhoneDigits}` : "";

    if (!customerName.trim() || !fullCustomerPhone || !bookingDate || !bookingTime) {
      alert("Please fill in all required fields (Name, Phone, Date, and Time).");
      setBookingLoading(false);
      return;
    }

    const extraPackageInfo = selectedService?.dishes ? ` [Package: ${selectedService?.packageName || selectedService?.name}, Pax: ${selectedService?.pax || 1}, Dishes: ${Array.isArray(selectedService?.dishes) ? selectedService?.dishes.join(", ") : selectedService?.dishes}]` : "";

    const bookingPayload = {
      businessId: business.id || business._id,
      customerName,
      customerPhone: fullCustomerPhone,
      date: bookingDate,
      timeSlot: bookingTime,
      serviceName: selectedService?.packageName || selectedService?.name || "General Service",
      totalPrice: selectedService?.price || 0,
      notes: bookingNotes ? `${bookingNotes}${extraPackageInfo}` : extraPackageInfo.trim(),
      locationId: bookingLocation || undefined
    };

    // Increment local storage inquiryCount for this business
    if (typeof window !== "undefined") {
      const profilesStr = window.localStorage.getItem("armbiz-business-profiles");
      if (profilesStr) {
        try {
          const profiles = JSON.parse(profilesStr);
          const foundProfileIndex = profiles.findIndex((p: any) => {
            const profileSlug = p.businessName ? p.businessName.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]/g, "") : "";
            return profileSlug === slug;
          });
          if (foundProfileIndex !== -1) {
            const foundProfile = profiles[foundProfileIndex];
            const currentInq = foundProfile.inquiryCount !== undefined ? foundProfile.inquiryCount : 0;
            foundProfile.inquiryCount = currentInq + 1;
            window.localStorage.setItem("armbiz-business-profiles", JSON.stringify(profiles));
          }
        } catch (e) {
          console.error("Error updating local storage profile inquiryCount", e);
        }
      }

      // Also increment mock inquiries just in case they are looking at a mock business
      const mockInqKey = "armbiz-mock-inquiries";
      try {
        const mockInqMap = JSON.parse(window.localStorage.getItem(mockInqKey) || "{}");
        const currentInq = mockInqMap[slug] !== undefined ? mockInqMap[slug] : 0;
        mockInqMap[slug] = currentInq + 1;
        window.localStorage.setItem(mockInqKey, JSON.stringify(mockInqMap));
      } catch (e) { }
    }

    try {
      const apiURL = getApiUrl();
      const res = await axios.post(`${apiURL}/bookings`, bookingPayload);
      const backendBooking = res.data?.data;
      
      // Save booking request to local storage so it is persisted offline/locally
      if (typeof window !== "undefined") {
        try {
          const localBookings = JSON.parse(window.localStorage.getItem("armbiz-local-bookings") || "[]");
          const userBookings = JSON.parse(window.localStorage.getItem("armbiz_user_bookings") || "[]");
          
          const bookingId = backendBooking?._id || backendBooking?.id || `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const qrToken = backendBooking?.qrToken || Math.random().toString(36).substr(2, 10).toUpperCase();

          const newBooking = {
            id: bookingId,
            businessId: business.id || business._id,
            businessName: business.name || "Business Listing",
            businessSlug: business.slug || slug || "",
            userKey: currentUser?.username || currentUser?.email || currentUser?.name || customerName,
            userEmail: currentUser?.email || "",
            customerName,
            customerPhone: fullCustomerPhone,
            date: bookingDate,
            time: bookingTime,
            timeSlot: bookingTime,
            service: selectedService?.name || "General Service",
            serviceName: selectedService?.name || "General Service",
            totalPrice: selectedService?.price || 0,
            notes: bookingNotes,
            status: "pending",
            qrToken: qrToken,
            createdAt: new Date().toISOString()
          };
          localBookings.push(newBooking);
          userBookings.push(newBooking);
          window.localStorage.setItem("armbiz-local-bookings", JSON.stringify(localBookings));
          window.localStorage.setItem("armbiz_user_bookings", JSON.stringify(userBookings));
          window.dispatchEvent(new Event("bookingsUpdated"));
        } catch (e) {
          console.error("Error saving local booking to localStorage", e);
        }
      }
      
      setBookingSuccess(true);
    } catch (err: any) {
      console.error("Backend booking API request failed", err);
      alert(err.response?.data?.message || "Failed to submit booking. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };


  // Extract cover image
  const coverImage = (() => {
    if (business) {
      if (business.coverImageUrl) {
        if (Array.isArray(business.coverImageUrl)) {
          if (business.coverImageUrl.length > 0) return business.coverImageUrl[0];
        } else {
          return business.coverImageUrl;
        }
      }
      const metadataCover = business.metadata?.coverUrl;
      if (metadataCover) {
        if (Array.isArray(metadataCover)) {
          if (metadataCover.length > 0) return metadataCover[0];
        } else {
          return metadataCover;
        }
      }
      // Fallback to first gallery image if no cover image
      if (business.images && business.images.length > 0) {
        return business.images[0];
      }
      // Fallback to logo
      return business.logo || business.logoUrl || "";
    }
    return "";
  })();

  return (
    <div className={styles.profileContainer}>
      {/* Back Link */}
      <Link href="/discover" className={styles.backLink}>
        <ArrowLeft className="h-4 w-4" /> {t.business?.backToDirectory || "Back to Directory"}
      </Link>

      {/* Cover / Media Gallery */}
      <div className={styles.coverGallery}>
        {coverImage ? (
          <img
            src={coverImage}
            alt={`${business.name} Cover`}
            className={styles.sliderImage}
          />
        ) : (
          <span className={styles.initialLogo}>{business.name ? business.name[0] : "B"}</span>
        )}
        <div className={styles.coverOverlay} />
      </div>

      {/* Profile Header Details */}
      <div className={styles.profileHeader}>

        {/* Logo Avatar (Green Story indicator when active & unviewed) */}
        <div className="flex items-center justify-center shrink-0">
          <div
            onClick={() => {
              if (matchingGroupIdx !== null) {
                handleMarkStoryAsViewed();
                setShowStoryViewer(true);
              }
            }}
            className={`w-20 h-20 rounded-full shrink-0 flex items-center justify-center overflow-hidden transition-all cursor-pointer ${matchingGroupIdx !== null && !isLogoStoryViewed
                ? "p-[3px] bg-emerald-500 hover:scale-105 shadow-md ring-2 ring-emerald-500/20"
                : "border border-[hsl(var(--border))]/60 p-[2px]"
              }`}
            title={matchingGroupIdx !== null ? (isLogoStoryViewed ? "Stories viewed" : "Click to view active stories") : undefined}
          >
            <div className="w-full h-full rounded-full bg-[hsl(var(--background))] p-[2px] overflow-hidden relative cursor-pointer">
              {business.logo || business.logoUrl ? (
                <img
                  src={business.logo || business.logoUrl}
                  className="w-full h-full rounded-full object-cover cursor-pointer"
                  alt={business.name}
                />
              ) : (
                <div className="w-full h-full rounded-full bg-violet-600 flex items-center justify-center text-white text-xl font-bold uppercase cursor-pointer">
                  {business.name[0]}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.titleBlock}>
          <div className="flex items-center gap-3 flex-wrap">
            <h1>
              {business.name}
              {(business.isVerified || business.verified) && (
                <span className={`${styles.verifiedBadge} ${business.plan === "premium" || business.plan === "standard"
                  ? styles.verifiedGold
                  : styles.verifiedStarter
                  }`}>
                  <BadgeCheck className="h-3.5 w-3.5" /> Verified Partner
                </span>
              )}
            </h1>
            <span className="flex items-center gap-1 text-[15px] font-medium ml-2">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              {(liveRating > 0 ? liveRating : (business.ratingAvg !== undefined ? (typeof business.ratingAvg === 'number' ? business.ratingAvg : 0) : 0)).toFixed(1)}
            </span>
            {business && (() => {
              const status = getOpenStatus(business.operatingHours || business.metadata?.operatingHours, t);
              return (
                <div className={`${styles.statusBadge} ${status.isOpen ? styles.isOpenBadge : styles.isClosedBadge}`}>
                  <span
                    className={`${styles.statusDot} ${!status.isOpen ? styles.closed : ""
                      }`}
                  />
                  {status.text}
                </div>
              );
            })()}

            {!isBusinessUser && (
              <button
                type="button"
                onClick={toggleFavorite}
                className="bg-transparent border-0 p-1.5 transition-transform hover:scale-115 cursor-pointer flex items-center justify-center"
                title={isFavorited ? "Remove from favorites" : "Save to favorites"}
              >
                <Bookmark className={`h-6 w-6 transition-all ${isFavorited ? "fill-amber-500 text-amber-500 scale-110 drop-shadow-sm" : "text-[hsl(var(--muted-foreground))] hover:text-amber-500"}`} />
              </button>
            )}
          </div>
          <p className="text-[hsl(var(--muted-foreground))] mt-1 text-base">{business.shortDescription || business.description}</p>

          {business.foundedYear && (
            <div className="flex items-center gap-4 flex-wrap text-sm text-[hsl(var(--muted-foreground))] mt-4">
              <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Est. {business.foundedYear}</span>
            </div>
          )}
        </div>

        {/* Global Instant Booking Trigger */}
        {!isBusinessUser && (
          <button
            onClick={() => {
              if (!currentUser) {
                showToast();
                return;
              }
              if (!isClosed) {
                openBooking({ name: "General Appointment", price: 0 });
              }
            }}
            disabled={isClosed}
            className={`py-3.5 px-6 rounded-xl text-sm font-semibold shadow-lg shrink-0 transition-all ${isClosed
              ? "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border))] cursor-not-allowed opacity-60"
              : "btn-primary cursor-pointer"
              }`}
          >
            {isClosed ? (t.business?.closed || "Closed") : (t.business?.bookAppointment || "Book Appointment")}
          </button>
        )}
      </div>

      {/* Highlights Section (Story circles) */}
      {(() => {
        const defaultSmartHighlights = [
          ...(business?.menu && business.menu.length > 0 ? [{
            id: 'highlight-menu',
            title: locale === 'hy' ? 'Մենյու' : locale === 'ru' ? 'Меню' : 'Menu',
            icon: '🍽️',
            sectionId: 'hours-section'
          }] : []),
          ...(business?.services && business.services.length > 0 ? [{
            id: 'highlight-services',
            title: locale === 'hy' ? 'Ծառայություններ' : locale === 'ru' ? 'Услуги' : 'Services',
            icon: '🛠️',
            sectionId: 'hours-section'
          }] : []),
          ...(galleryImages && galleryImages.length > 0 ? [{
            id: 'highlight-gallery',
            title: locale === 'hy' ? 'Լուսանկարներ' : locale === 'ru' ? 'Галерея' : 'Gallery',
            icon: '📸',
            imageUrl: galleryImages[0],
            sectionId: 'gallery-section'
          }] : []),
          {
            id: 'highlight-reviews',
            title: locale === 'hy' ? 'Կարծիքներ' : locale === 'ru' ? 'Отзывы' : 'Reviews',
            icon: '⭐',
            sectionId: 'reviews-section'
          },
          {
            id: 'highlight-hours',
            title: locale === 'hy' ? 'Ժամեր' : locale === 'ru' ? 'Часы' : 'Hours',
            icon: '🕒',
            sectionId: 'hours-section'
          },
          {
            id: 'highlight-location',
            title: locale === 'hy' ? 'Տեղադրություն' : locale === 'ru' ? 'Локация' : 'Location',
            icon: '📍',
            sectionId: 'location-section'
          }
        ];

        const highlightsToRender = (business?.highlights && business.highlights.length > 0)
          ? business.highlights
          : defaultSmartHighlights;

        if (!highlightsToRender || highlightsToRender.length === 0) return null;

        return (
          <div className={styles.highlightsContainer}>
            <div className={styles.highlightsHeader}>
              <h2>
                {locale === 'hy' ? 'Ակնարկներ (Highlights)' : locale === 'ru' ? 'Подборки (Highlights)' : 'Highlights'}
              </h2>
            </div>
            <div className={styles.highlightsWrapper}>
              {highlightsToRender.map((h: any, i: number) => (
                <div
                  key={h.id || i}
                  className={styles.highlightTile}
                  onClick={() => {
                    if (h.sectionId) {
                      const el = document.getElementById(h.sectionId);
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    } else {
                      openHighlight(i);
                    }
                  }}
                >
                  <div className={styles.storyRing}>
                    <div className={styles.storyThumb}>
                      {h.imageUrl ? (
                        <img src={h.imageUrl} alt={h.title} className={styles.storyImg} />
                      ) : (
                        <span>{h.icon || "✨"}</span>
                      )}
                    </div>
                  </div>
                  <span title={h.title}>{h.title}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── Showcase Gallery Section ── */}
      {galleryImages.length > 0 && (
        <section id="gallery-section" className={styles.gallerySection}>
          <div className={styles.sectionHeader}>
            <h2>{t.business.gallery}</h2>
            <span className={styles.photoCount}>
              {galleryImages.length} {
                locale === "hy" ? "լուսանկար" :
                  locale === "ru" ? "фото" :
                    galleryImages.length === 1 ? "photo" : "photos"
              }
            </span>
          </div>
          <div className={`${styles.bentoGrid} ${galleryImages.length === 1 ? styles.grid1 :
            galleryImages.length === 2 ? styles.grid2 :
              galleryImages.length === 3 ? styles.grid3 :
                galleryImages.length === 4 ? styles.grid4 :
                  styles.grid5
            }`}>
            {galleryImages.slice(0, 5).map((url: string, index: number) => {
              const isLastAndMore = index === 4 && galleryImages.length > 5;
              return (
                <div
                  key={index}
                  className={styles.galleryItem}
                  onClick={() => setActiveGalleryIdx(index)}
                >
                  <img
                    src={url}
                    alt={`${business.name} Interior ${index + 1}`}
                    loading="lazy"
                  />
                  {isLastAndMore ? (
                    <div className={styles.morePhotosOverlay}>
                      <span className={styles.moreCount}>+{galleryImages.length - 4}</span>
                      <span className={styles.moreText}>{t.featured.viewAll}</span>
                    </div>
                  ) : (
                    <div className={styles.itemOverlay}>
                      <Maximize2 className="h-6 w-6" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Main Grid Content */}
      <div className={styles.gridContent}>
        {/* Left Column: digital catalogs */}
        <div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] lg:grid-cols-[1fr_300px] gap-6 mb-6 items-stretch">
            {/* Operating hours */}
            <section id="hours-section" className="flex flex-col h-full">
              <h2 className="text-lg font-bold mb-3">{t.business?.operatingHours || "Operating Hours"}</h2>
              <div className="flex flex-col gap-1 flex-1">
                {(business.operatingHours && business.operatingHours.length > 0
                  ? business.operatingHours.map((h: any) => ({
                    day: h.dayName || h.day,
                    open: h.openTime || h.open,
                    close: h.closeTime || h.close,
                    closed: h.isClosed ?? h.closed
                  }))
                  : DEFAULT_HOURS
                ).map((h: any) => {
                  const isToday = h.day?.toLowerCase() === new Date().toLocaleDateString("en-US", { weekday: 'long' }).toLowerCase();

                  return (
                    <div
                      key={h.day}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-300 ${isToday ? 'bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/20 shadow-sm' : 'hover:bg-[hsl(var(--muted))]/60 border border-transparent hover:scale-[1.01]'}`}
                    >
                      <div className="flex items-center gap-2.5">
                        {isToday ? (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--primary))] opacity-60"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(var(--primary))]"></span>
                          </span>
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--border))]"></span>
                        )}
                        <span className={`text-[14px] ${isToday ? 'font-bold text-[hsl(var(--primary))]' : 'font-medium text-[hsl(var(--foreground))]'}`}>
                          {t.business?.days?.[h.day.toLowerCase() as keyof typeof t.business.days] || h.day}
                        </span>
                      </div>

                      {h.closed ? (
                        <span className="text-[11px] font-bold tracking-wider uppercase px-2 py-1 rounded bg-red-500/10 text-red-500">
                          {t.business?.closed || "Closed"}
                        </span>
                      ) : (
                        <div className={`flex items-center text-[14px] font-semibold tracking-tight ${isToday ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]'}`}>
                          <span className="tabular-nums">{h.open}</span>
                          <span className="mx-1.5 opacity-40 font-normal">—</span>
                          <span className="tabular-nums">{h.close}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Contact Details */}
            <section id="location-section" className="flex flex-col h-full">
              <h2 className="text-lg font-bold mb-3">{t.business?.contact || "Information"}</h2>
              <div className={`${styles.contactCard} !mt-0 flex-1 flex flex-col justify-center`}>
                <div className="space-y-4">
                  {business.locations && business.locations.length > 0 ? (
                    <div className="space-y-6">
                      {/* Addresses Group */}
                      <div>
                        <div className="space-y-3">
                          {business.locations.map((loc: any, idx: number) => (
                            <div key={`addr-${idx}`} className="space-y-1.5">
                              <div className="flex items-start gap-3">
                                <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-[hsl(var(--primary))]" />
                                <div className="min-w-0">
                                  <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.address + (loc.city ? ', ' + loc.city : '') + ', Armenia')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[13px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors line-clamp-2 leading-snug"
                                    title={loc.address + (loc.city ? `, ${loc.city}` : '')}
                                  >
                                    {formatAddress(loc.address, loc.city)}
                                  </a>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Phones Group */}
                      {business.locations.some((l: any) => l.phone) && (
                        <div className="pt-4 border-t border-[hsl(var(--border))]">
                          <div className="space-y-3">
                            {business.locations.filter((l: any) => l.phone).map((loc: any, idx: number) => (
                              <div key={`phone-${idx}`} className="space-y-1.5">
                                <div className="flex items-start gap-3">
                                  <Phone className="h-4 w-4 shrink-0 mt-0.5 text-[hsl(var(--primary))]" />
                                  <div className="min-w-0">
                                    <a href={`tel:${loc.phone}`} className="text-[13px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors">
                                      {loc.phone}
                                    </a>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  ) : (
                    <>
                      {business.address && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address + (business.city ? ', ' + business.city : '') + ', Armenia')}`}
                          target="_blank"
                          rel="noreferrer"
                          className={`${styles.contactItem} items-start`}
                        >
                          <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-[hsl(var(--primary))]" />
                          <span className="leading-snug">{formatAddress(business.address, business.city)}</span>
                        </a>
                      )}
                      <a href={`tel:${business.phone}`} className={styles.contactItem}>
                        <Phone className="h-4 w-4 shrink-0 text-[hsl(var(--primary))]" /> {business.phone}
                      </a>
                    </>
                  )}

                  {/* Common Email and Website */}
                  {(business.email || business.website) && (
                    <div className={`pt-4 ${business.locations && business.locations.length > 0 ? 'border-t border-[hsl(var(--border))] mt-6' : ''}`}>
                      <div className="space-y-3">
                        {business.email && (
                          <div className="flex items-start gap-3">
                            <Mail className="h-4 w-4 shrink-0 mt-0.5 text-[hsl(var(--primary))]" />
                            <a href={`mailto:${business.email}`} className="text-[13px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors">
                              {business.email}
                            </a>
                          </div>
                        )}
                        {business.website && (
                          <div className="flex items-start gap-3">
                            <Globe className="h-4 w-4 shrink-0 mt-0.5 text-[hsl(var(--primary))]" />
                            <a href={business.website} target="_blank" rel="noreferrer" className="text-[13px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors line-clamp-1">
                              {business.website}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Right Column: sidebar widgets */}
        <div className={styles.sidebar}>

          {/* Live Location Map */}
          <div className="mb-4">
            <BusinessMap
              lat={lat}
              lng={lng}
              name={business.name}
              address={business.address || ""}
              locations={business.locations}
            />
          </div>

        </div>
      </div>

      {/* Booking Form Modal */}
      {isBookingOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <button onClick={() => setIsBookingOpen(false)} className={styles.btnClose}>
              <X className="h-4 w-4" />
            </button>

            {bookingSuccess ? (
              <div className="text-center py-6">
                <div className="flex justify-center mb-4">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
                <h3 className="text-lg font-bold">
                  {locale === 'hy' ? "Ամրագրման հարցումն ուղարկված է!" : locale === 'ru' ? "Запрос на бронирование отправлен!" : "Appointment Requested!"}
                </h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2 mb-6">
                  {locale === 'hy' ? (
                    <>Շնորհակալություն, ձեր ամրագրումը <strong>{selectedService?.name || selectedService?.packageName}</strong>-ի համար գրանցված է: Աշխատակիցները շուտով կկապվեն ձեզ հետ հաստատելու համար:</>
                  ) : locale === 'ru' ? (
                    <>Спасибо, ваше бронирование на <strong>{selectedService?.name || selectedService?.packageName}</strong> зарегистрировано. Сотрудники свяжутся с вами в ближайшее время для подтверждения.</>
                  ) : (
                    <>Thank you, your booking for <strong>{selectedService?.name || selectedService?.packageName}</strong> has been registered. Staff will contact you shortly to confirm.</>
                  )}
                </p>
                <button onClick={() => setIsBookingOpen(false)} className="btn-primary w-full py-2.5 rounded-xl text-sm font-semibold">
                  {locale === 'hy' ? "Փակել պատուհանը" : locale === 'ru' ? "Закрыть окно" : "Close Window"}
                </button>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <h2>{t.business?.bookAppointment || "Book Appointment"}</h2>
                {/* Selected Package / Service & Menus & Offers Dropdown */}
                <div className="p-3 bg-[hsl(var(--muted))]/50 rounded-xl mb-4 text-xs border border-[hsl(var(--border))]/60 space-y-2">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-[hsl(var(--muted-foreground))]">
                      {locale === 'hy' ? "Ընտրված է:" : locale === 'ru' ? "Выбрано:" : "Selected:"}
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {selectedService?.packageName || selectedService?.name || "General Appointment"}
                    </span>
                  </div>

                  {/* Menus & Offers Selector Dropdown */}
                  {(businessOffers.length > 0 || (business.services && business.services.length > 0)) && (
                    <div className="pt-2 border-t border-[hsl(var(--border))]/40">
                      <label className="block text-[11px] font-semibold text-[hsl(var(--muted-foreground))] mb-1">
                        {locale === 'hy' ? "Ընտրեք «Menus & Offers» առաջարկ կամ ծառայություն:" : locale === 'ru' ? "Выберите предложение «Menus & Offers» или услугу:" : "Choose Package from Menus & Offers or Services:"}
                      </label>
                      <CustomServiceSelect
                        value={selectedService?._id || selectedService?.id || selectedService?.packageName || selectedService?.name || "General Appointment"}
                        onChange={(val) => {
                          const offerMatch = businessOffers.find((o: any) => (o._id || o.packageName) === val);
                          if (offerMatch) {
                            setSelectedService({
                              _id: offerMatch._id,
                              name: offerMatch.packageName,
                              packageName: offerMatch.packageName,
                              price: offerMatch.price,
                              pax: offerMatch.pax,
                              dishes: offerMatch.dishes,
                              inclusions: offerMatch.inclusions,
                              type: "offer"
                            });
                          } else {
                            const srvMatch = business.services?.find((s: any) => (s._id || s.id || s.name) === val);
                            if (srvMatch) {
                              setSelectedService(srvMatch);
                            } else {
                              setSelectedService({ name: "General Appointment", price: 0 });
                            }
                          }
                        }}
                        businessOffers={businessOffers}
                        businessServices={business.services}
                        locale={locale}
                      />
                    </div>
                  )}

                  {/* Details of the selected offer/package */}
                  {selectedService && (
                    <div className="pt-2 border-t border-[hsl(var(--border))]/40 space-y-1">
                      {selectedService.price > 0 && (
                        <div className="flex justify-between font-bold text-[hsl(var(--primary))]">
                          <span>{locale === 'hy' ? "Արժեքը:" : locale === 'ru' ? "Стоимость:" : "Rate:"}</span>
                          <span>{Number(selectedService.price).toLocaleString()} AMD</span>
                        </div>
                      )}
                      {/* 1% Findy Coins Cashback Reward */}
                      {selectedService.price > 0 && (
                        <div className="flex items-center justify-between p-2 my-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                            <Coins className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>
                              +{Math.floor(Number(selectedService.price) * 0.01).toLocaleString()} {locale === 'hy' ? "Coins (1% քեշբեք)" : locale === 'ru' ? "Coins (1% кэшбэк)" : "Coins (1% cashback)"}
                            </span>
                          </div>
                          <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                            {locale === 'hy' ? "Հաստատվելուց հետո" : locale === 'ru' ? "После подтверждения" : "Upon confirmation"}
                          </span>
                        </div>
                      )}
                      {selectedService.pax > 0 && (
                        <div className="flex justify-between text-[11px] text-[hsl(var(--muted-foreground))]">
                          <span>{locale === 'hy' ? "Անձանց քանակը:" : locale === 'ru' ? "Количество человек:" : "Persons (Pax):"}</span>
                          <span className="font-semibold text-[hsl(var(--foreground))]">{selectedService.pax} {locale === 'hy' ? "անձ" : locale === 'ru' ? "чел." : "pax"}</span>
                        </div>
                      )}
                      {selectedService.dishes && (Array.isArray(selectedService.dishes) ? selectedService.dishes.length > 0 : Boolean(selectedService.dishes)) && (
                        <div className="text-[11px]">
                          <span className="font-semibold text-[hsl(var(--foreground))]">{locale === 'hy' ? "Ուտեստներ: " : locale === 'ru' ? "Блюда: " : "Dishes: "}</span>
                          <span className="text-[hsl(var(--muted-foreground))] italic">{Array.isArray(selectedService.dishes) ? selectedService.dishes.join(", ") : selectedService.dishes}</span>
                        </div>
                      )}
                      {selectedService.inclusions && (Array.isArray(selectedService.inclusions) ? selectedService.inclusions.length > 0 : Boolean(selectedService.inclusions)) && (
                        <div className="text-[11px]">
                          <span className="font-semibold text-[hsl(var(--foreground))]">{locale === 'hy' ? "Ներառված է: " : locale === 'ru' ? "Включено: " : "Inclusions: "}</span>
                          <span className="text-[hsl(var(--muted-foreground))] italic">{Array.isArray(selectedService.inclusions) ? selectedService.inclusions.join(", ") : selectedService.inclusions}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    {locale === 'hy' ? "Ձեր Անուն Ազգանունը *" : locale === 'ru' ? "Ваше Имя Фамилия *" : "Your Full Name *"}
                    {currentUser && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal ml-2">
                        {locale === 'hy' ? "(Մուտք գործված է որպես " : locale === 'ru' ? "(Вошли как " : "(Logged in as "}{currentUser.name || currentUser.username})
                      </span>
                    )}
                  </label>
                  <input
                    required
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder={locale === 'hy' ? "Մուտքագրեք ձեր անունը" : locale === 'ru' ? "Введите ваше имя" : "Enter your name"}
                    disabled={Boolean(currentUser)}
                    readOnly={Boolean(currentUser)}
                    className={`w-full border border-[hsl(var(--border))] rounded-lg px-3 py-2 text-sm bg-transparent outline-none focus:border-[hsl(var(--primary))] ${currentUser ? "opacity-80 cursor-not-allowed bg-[hsl(var(--muted))]/50" : ""
                      }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    {locale === 'hy' ? "Հեռախոսահամար *" : locale === 'ru' ? "Номер Телефона *" : "Phone Number *"}
                    {currentUser && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal ml-2">
                        {locale === 'hy' ? "(Մուտք գործված հաշիվ)" : locale === 'ru' ? "(Аккаунт в системе)" : "(Logged in account)"}
                      </span>
                    )}
                  </label>
                  <div className={`flex w-full border border-[hsl(var(--border))] rounded-lg overflow-hidden transition-all ${currentUser ? "opacity-80 cursor-not-allowed bg-[hsl(var(--muted))]/50" : "bg-transparent focus-within:border-[hsl(var(--primary))] focus-within:ring-1 focus-within:ring-[hsl(var(--primary))]"
                    }`}>
                    <div className="px-3 py-2 bg-[hsl(var(--muted))]/50 text-sm font-medium border-r border-[hsl(var(--border))] flex items-center justify-center text-[hsl(var(--foreground))] select-none shrink-0">
                      +374
                    </div>
                    <input
                      required
                      type="tel"
                      inputMode="numeric"
                      value={customerPhone}
                      onChange={e => {
                        const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 8);
                        const formatted = digitsOnly.match(/.{1,2}/g)?.join(" ") || "";
                        setCustomerPhone(formatted);
                      }}
                      disabled={Boolean(currentUser)}
                      readOnly={Boolean(currentUser)}
                      maxLength={11}
                      placeholder="99 12 34 56"
                      className={`flex-1 px-3 py-2 text-sm outline-none w-full font-medium tracking-wider bg-transparent ${currentUser ? "cursor-not-allowed" : ""
                        }`}
                    />
                  </div>
                </div>

                {business.locations && business.locations.length > 0 && (
                  <div className="relative">
                    <label className="block text-xs font-semibold mb-1">{locale === 'hy' ? "Մասնաճյուղ / Հասցե *" : locale === 'ru' ? "Филиал / Локация *" : "Branch / Location *"}</label>
                    <button
                      type="button"
                      onClick={() => setIsLocDropdownOpen(!isLocDropdownOpen)}
                      className="w-full flex items-center justify-between border border-[hsl(var(--border))] rounded-lg px-3 py-2.5 text-sm bg-[hsl(var(--muted))]/20 hover:bg-[hsl(var(--muted))]/40 transition-all focus:border-[hsl(var(--primary))] outline-none"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <MapPin className="h-4 w-4 shrink-0 text-[hsl(var(--primary))]" />
                        <span className={`truncate ${bookingLocation ? "text-[hsl(var(--foreground))] font-medium" : "text-[hsl(var(--muted-foreground))]"}`}>
                          {bookingLocation
                            ? business.locations.find((l: any) => (l._id || l.id || l.address) === bookingLocation)?.address || (locale === 'hy' ? "Մասնաճյուղ ընտրված է" : locale === 'ru' ? "Филиал выбран" : "Branch Selected")
                            : (locale === 'hy' ? "Ընտրեք մասնաճյուղ" : locale === 'ru' ? "Выберите филиал" : "Select a branch")}
                        </span>
                      </div>
                      <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isLocDropdownOpen ? "rotate-180 text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))]"}`} />
                    </button>
                    {isLocDropdownOpen && (
                      <div className="absolute top-[65px] left-0 w-full bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl shadow-lg z-50 overflow-hidden py-1 max-h-52 overflow-y-auto animate-in fade-in slide-in-from-top-1">
                        {business.locations.map((loc: any) => (
                          <button
                            key={loc._id || loc.id || loc.address}
                            type="button"
                            onClick={() => {
                              setBookingLocation(loc._id || loc.id || loc.address);
                              setIsLocDropdownOpen(false);
                            }}
                            className={`w-full flex items-start flex-col px-3 py-2 text-sm transition-colors hover:bg-[hsl(var(--muted))] ${bookingLocation === (loc._id || loc.id || loc.address) ? "bg-[hsl(var(--primary))]/10 border-l-2 border-[hsl(var(--primary))]" : "border-l-2 border-transparent"
                              }`}
                          >
                            <span className={`font-semibold ${bookingLocation === (loc._id || loc.id || loc.address) ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--foreground))]"}`}>
                              {loc.address}
                            </span>
                            {loc.city && <span className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5">{loc.city}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">{locale === 'hy' ? "Ամսաթիվ *" : locale === 'ru' ? "Дата *" : "Date *"}</label>
                    <input
                      required
                      type="date"
                      value={bookingDate}
                      onChange={e => {
                        setBookingDate(e.target.value);
                        setBookingTime(""); // Reset time if date changes
                      }}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full border border-[hsl(var(--border))] rounded-lg px-3 py-2 text-sm bg-transparent outline-none focus:border-[hsl(var(--primary))]"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold">{locale === 'hy' ? "Նախընտրելի Ժամ *" : locale === 'ru' ? "Предпочтительное Время *" : "Preferred Time *"}</label>
                      {todayOperatingHours && !todayOperatingHours.closed && todayOperatingHours.open && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]">
                          {todayOperatingHours.open} - {todayOperatingHours.close}
                        </span>
                      )}
                    </div>
                    {!bookingDate ? (
                      <div className="w-full flex items-center gap-2 border border-dashed border-[hsl(var(--border))] rounded-lg px-3 py-2.5 text-[13px] bg-[hsl(var(--muted))]/10 text-[hsl(var(--muted-foreground))] opacity-80 cursor-not-allowed">
                        <Clock className="h-4 w-4 shrink-0" />
                        <span>{locale === 'hy' ? "Խնդրում ենք նախ ընտրել ամսաթիվ" : locale === 'ru' ? "Пожалуйста, сначала выберите дату" : "Please select a date first"}</span>
                      </div>
                    ) : (isCustomDateClosed || todayOperatingHours?.closed || !todayOperatingHours?.open || !todayOperatingHours?.close) ? (
                      <div className="w-full flex items-center gap-2 border border-red-500/20 rounded-lg px-3 py-2.5 text-[13px] bg-red-500/5 text-red-500 font-medium cursor-not-allowed">
                        <X className="h-4 w-4 shrink-0" />
                        <span>{locale === 'hy' ? "Այս ամսաթվին բիզնեսը փակ է" : locale === 'ru' ? "В эту дату заведение закрыто" : "Business is closed on this date"}</span>
                      </div>
                    ) : (
                      <div className="relative flex items-center w-full">
                        <Clock className="absolute left-3 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                        <input
                          required
                          type="time"
                          min={todayOperatingHours.open}
                          max={todayOperatingHours.close}
                          value={bookingTime}
                          onChange={e => setBookingTime(e.target.value)}
                          className="w-full border border-[hsl(var(--border))] rounded-lg pl-9 pr-3 py-2.5 text-[13px] bg-transparent outline-none focus:border-[hsl(var(--primary))] focus:ring-1 focus:ring-[hsl(var(--primary))]/30 transition-all"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">{locale === 'hy' ? "Հատուկ Նշումներ / Հարցումներ" : locale === 'ru' ? "Особые Отметки / Запросы" : "Special Notes / Requests"}</label>
                  <textarea
                    rows={2}
                    value={bookingNotes}
                    onChange={e => setBookingNotes(e.target.value)}
                    placeholder={locale === 'hy' ? "օրինակ՝ Սննդակարգի նախասիրություններ կամ մեքենայի տվյալներ..." : locale === 'ru' ? "напр. Диетические предпочтения или детали автомобиля..." : "e.g. Dietary preferences or vehicle details..."}
                    className="w-full border border-[hsl(var(--border))] rounded-lg px-3 py-2 text-sm bg-transparent outline-none resize-none focus:border-[hsl(var(--primary))]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="btn-primary w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 mt-6"
                >
                  {bookingLoading ? (locale === 'hy' ? "Մշակվում է..." : locale === 'ru' ? "Обработка..." : "Processing Request...") : <>{locale === 'hy' ? "Ուղարկել Ամրագրման Հարցում" : locale === 'ru' ? "Отправить Запрос на Бронирование" : "Request Booking Confirmation"} <Send className="h-4 w-4" /></>}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Highlight Story Lightbox Modal */}
      {activeHighlight && (
        <div className={styles.lightboxOverlay} onClick={() => { setActiveHighlight(null); setActiveHighlightIdx(-1); }}>
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            {/* Close */}
            <button
              onClick={() => { setActiveHighlight(null); setActiveHighlightIdx(-1); }}
              className={styles.lightboxClose}
              aria-label="Close stories"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Slider media */}
            <div className={styles.lightboxMediaWrapper}>
              {activeHighlight.imageUrl ? (
                <img
                  src={activeHighlight.imageUrl}
                  alt={activeHighlight.title}
                  className={styles.lightboxImage}
                />
              ) : (
                <div className={styles.lightboxPlaceholder}>
                  <span className="text-6xl">{activeHighlight.icon || "✨"}</span>
                </div>
              )}

              {/* Text overlay */}
              <div className={styles.lightboxText}>
                <h3>{activeHighlight.title}</h3>
                {activeHighlight.description && <p>{activeHighlight.description}</p>}
              </div>
            </div>

            {/* Nav Arrows */}
            {business.highlights.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const prevIdx = (activeHighlightIdx - 1 + business.highlights.length) % business.highlights.length;
                    setActiveHighlightIdx(prevIdx);
                    setActiveHighlight(business.highlights[prevIdx]);
                  }}
                  className={styles.lightboxPrev}
                  aria-label="Previous Highlight"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const nextIdx = (activeHighlightIdx + 1) % business.highlights.length;
                    setActiveHighlightIdx(nextIdx);
                    setActiveHighlight(business.highlights[nextIdx]);
                  }}
                  className={styles.lightboxNext}
                  aria-label="Next Highlight"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Reviews Section ── */}
      <div id="reviews-section">
        <ReviewsSection
          businessId={business._id || business.id || ""}
          businessSlug={slug}
          initialRating={business.ratingAvg || business.rating || 0}
          initialReviewCount={business.reviewCount || 0}
          onRatingUpdate={(rating, count) => {
            setLiveRating(rating);
            setLiveReviewCount(count);
          }}
        />
      </div>

      {showStoryViewer && matchingGroupIdx !== null && (
        <StoryViewer
          groups={activeStoriesGroups}
          initialGroupIndex={matchingGroupIdx}
          onClose={() => {
            setShowStoryViewer(false);
            handleMarkStoryAsViewed();
          }}
          onStoriesViewedUpdate={() => {
            handleMarkStoryAsViewed();
          }}
        />
      )}

      {showHighlightViewer && highlightViewerGroups.length > 0 && (
        <StoryViewer
          groups={highlightViewerGroups}
          initialGroupIndex={0}
          onClose={() => setShowHighlightViewer(false)}
          onStoriesViewedUpdate={() => { }}
        />
      )}



      {/* ── Gallery Fullscreen Lightbox Modal ── */}
      {activeGalleryIdx !== null && galleryImages.length > 0 && (
        <div
          className={styles.lightboxOverlay}
          onClick={() => setActiveGalleryIdx(null)}
        >
          <div className={styles.galleryLightboxContent} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setActiveGalleryIdx(null)}
              className={styles.lightboxClose}
              aria-label="Close lightbox"
            >
              <X className="h-6 w-6" />
            </button>

            <div className={styles.lightboxMediaWrapper}>
              <img
                src={galleryImages[activeGalleryIdx]}
                alt={`${business.name} Interior ${activeGalleryIdx + 1}`}
                className={styles.galleryLightboxImage}
              />
              <div className={styles.lightboxText}>
                <h3>{business.name}</h3>
                <p>{t.business.gallery} ({activeGalleryIdx + 1} / {galleryImages.length})</p>
              </div>
            </div>

            {galleryImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveGalleryIdx((activeGalleryIdx - 1 + galleryImages.length) % galleryImages.length);
                  }}
                  className={styles.lightboxPrev}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveGalleryIdx((activeGalleryIdx + 1) % galleryImages.length);
                  }}
                  className={styles.lightboxNext}
                  aria-label="Next image"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
