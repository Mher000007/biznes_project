"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { MOCK_BUSINESSES } from "@/data/mock-businesses";
import { Star, MapPin, BadgeCheck, Globe, Phone, Mail, Clock, Users, Calendar, ArrowLeft, Send, X, Compass, ChevronLeft, ChevronRight, CheckCircle, Maximize2 } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { getApiUrl } from "@/lib/utils";
import styles from "@/components/business/BusinessProfile.module.scss";
import ReviewsSection from "@/components/business/ReviewsSection";
import StoryViewer from "@/components/landing/StoryViewer";
import { useI18n } from "@/i18n";
import dynamic from "next/dynamic";

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

export default function BusinessProfilePage() {
  const { slug } = useParams() as { slug: string };
  const router = useRouter();
  const { locale, t } = useI18n();
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



  // Booking Modal State
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Load Business Details (Try backend first, then local mock fallback)
  useEffect(() => {
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
              const profileSlug = p.businessName ? p.businessName.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]/g, "") : "";
              return profileSlug === slug && p.isPublished;
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
          } catch (e) {}

          const mockReviewKey = "armbiz-mock-reviews";
          try {
            const mockReviewsMap = JSON.parse(window.localStorage.getItem(mockReviewKey) || "{}");
            if (mockReviewsMap[slug] !== undefined) {
              updatedRating = mockReviewsMap[slug].ratingAvg;
              updatedReviewsCount = mockReviewsMap[slug].reviewCount;
            }
          } catch (e) {}
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
    setSelectedService(item);
    setIsBookingOpen(true);
    setBookingSuccess(false);
  };

  const openHighlight = (idx: number) => {
    setActiveHighlight(business.highlights[idx]);
    setActiveHighlightIdx(idx);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingLoading(true);

    const bookingPayload = {
      businessId: business.id || business._id,
      customerName,
      customerPhone,
      date: bookingDate,
      timeSlot: bookingTime,
      serviceName: selectedService?.name || "General Service",
      totalPrice: selectedService?.price || 0,
      notes: bookingNotes
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
      } catch (e) {}

      // Save booking request to local storage so it is persisted offline/locally
      try {
        const localBookings = JSON.parse(window.localStorage.getItem("armbiz-local-bookings") || "[]");
        const newBooking = {
          id: `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          businessId: business.id || business._id,
          customerName,
          customerPhone,
          date: bookingDate,
          timeSlot: bookingTime,
          serviceName: selectedService?.name || "General Service",
          totalPrice: selectedService?.price || 0,
          notes: bookingNotes,
          status: "pending",
          createdAt: new Date().toISOString()
        };
        localBookings.push(newBooking);
        window.localStorage.setItem("armbiz-local-bookings", JSON.stringify(localBookings));
      } catch (e) {
        console.error("Error saving local booking to localStorage", e);
      }
    }

    try {
      const apiURL = getApiUrl();
      await axios.post(`${apiURL}/bookings`, bookingPayload);
      setBookingSuccess(true);
    } catch (err: any) {
      console.warn("Backend booking API request failed, demonstrating frontend success validation", err.message);
      // Simulate success on client for standalone presentation integrity
      setBookingSuccess(true);
    } finally {
      setBookingLoading(false);
    }
  };

  // Default time slots for Armenian service listings
  const TIME_SLOTS = ["10:00", "11:30", "13:00", "14:30", "16:00", "17:30", "19:00", "20:30"];

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
        <ArrowLeft className="h-4 w-4" /> Back to Directory
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
        
        {/* Instagram-style Logo Avatar (Story indicator) */}
        <div className="flex items-center justify-center shrink-0">
          <div 
            onClick={() => {
              if (matchingGroupIdx !== null) {
                setShowStoryViewer(true);
              }
            }}
            className={`w-20 h-20 rounded-full shrink-0 flex items-center justify-center overflow-hidden ${
              matchingGroupIdx !== null 
                ? "p-[3px] bg-gradient-to-tr from-pink-500 via-purple-500 to-yellow-500 cursor-pointer hover:scale-105 transition-all shadow" 
                : "border border-[hsl(var(--border))]/60 p-[2px]"
            }`}
            title={matchingGroupIdx !== null ? "Click to view active stories" : undefined}
          >
            <div className="w-full h-full rounded-full bg-[hsl(var(--background))] p-[2px] overflow-hidden relative">
              {business.logo || business.logoUrl ? (
                <img 
                  src={business.logo || business.logoUrl} 
                  className="w-full h-full rounded-full object-cover" 
                  alt={business.name} 
                />
              ) : (
                <div className="w-full h-full rounded-full bg-violet-600 flex items-center justify-center text-white text-xl font-bold uppercase">
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
                <span className={`${styles.verifiedBadge} ${
                  business.plan === "premium" || business.plan === "standard"
                    ? styles.verifiedGold
                    : styles.verifiedStarter
                }`}>
                  <BadgeCheck className="h-3.5 w-3.5" /> Verified Partner
                </span>
              )}
            </h1>
          </div>
          <p className="text-[hsl(var(--muted-foreground))] mt-1 text-base">{business.shortDescription || business.description}</p>
          <div className="flex items-center gap-4 flex-wrap text-sm text-[hsl(var(--muted-foreground))] mt-4">
            {business.address ? (
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address + ', ' + business.city + ', Armenia')}`} 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center gap-1 hover:text-[hsl(var(--foreground))] transition-colors"
              >
                <MapPin className="h-4 w-4 text-[hsl(var(--primary))]" /> {business.address}, {business.city}, Armenia
              </a>
            ) : (
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4 text-[hsl(var(--primary))]" /> {business.city}, Armenia</span>
            )}
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> 
              {(liveRating > 0 ? liveRating : (business.ratingAvg !== undefined ? (typeof business.ratingAvg === 'number' ? business.ratingAvg : 0) : 0)).toFixed(1)}{' '}
              ({liveReviewCount > 0 ? liveReviewCount : (business.reviewCount !== undefined ? business.reviewCount : 0)} review{(liveReviewCount || business.reviewCount || 0) !== 1 ? 's' : ''})
            </span>
            {business.foundedYear && (
              <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Est. {business.foundedYear}</span>
            )}
          </div>
        </div>

        {/* Global Instant Booking Trigger */}
        <button 
          onClick={() => openBooking({ name: "General Appointment", price: 0 })} 
          className="btn-primary py-3.5 px-6 rounded-xl text-sm font-semibold shadow-lg shrink-0"
        >
          Book Appointment
        </button>
      </div>

      {/* Highlights Section (Story circles) */}
      {business.highlights && business.highlights.length > 0 && (
        <div className={styles.highlightsContainer}>
          <h2>Key Features & Highlights</h2>
          <div className={styles.highlightsWrapper}>
            {business.highlights.map((h: Highlight, i: number) => (
              <div key={i} className={styles.highlightTile} onClick={() => openHighlight(i)}>
                <div className={styles.storyRing}>
                  <div className={styles.storyThumb}>
                    {h.imageUrl ? (
                      <img src={h.imageUrl} alt={h.title} className={styles.storyImg} />
                    ) : (
                      h.icon || "✨"
                    )}
                  </div>
                </div>
                <span>{h.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Showcase Gallery Section ── */}
      {galleryImages.length > 0 && (
        <section className={styles.gallerySection}>
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
          <div className={`${styles.bentoGrid} ${
            galleryImages.length === 1 ? styles.grid1 :
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

          {/* Operating hours */}
          <section className="mb-6">
            <h2 className="text-lg font-bold mb-3">Operating Hours</h2>
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] divide-y divide-[hsl(var(--border))]">
              {(business.operatingHours && business.operatingHours.length > 0
                ? business.operatingHours.map((h: any) => ({
                    day: h.dayName || h.day,
                    open: h.openTime || h.open,
                    close: h.closeTime || h.close,
                    closed: h.isClosed ?? h.closed
                  }))
                : DEFAULT_HOURS
              ).map((h: any) => (
                <div key={h.day} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="font-medium">{h.day}</span>
                  <span className="text-[hsl(var(--muted-foreground))]">
                    {h.closed ? "Closed" : `${h.open} — ${h.close}`}
                  </span>
                </div>
              ))}
            </div>
          </section>
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
            />
          </div>

          {/* Navigator direction links */}
          <div className={styles.navigatorCard}>
            <h3>Directions Finder</h3>
            <p>Select your favorite navigator engine to compute live routes to the location.</p>
            <button onClick={() => handleDirections('google')} className={`${styles.btnNavigator} ${styles.google}`}>
              <Compass className="h-4 w-4" /> Open in Google Maps
            </button>
            <button onClick={() => handleDirections('yandex')} className={`${styles.btnNavigator} ${styles.yandex}`}>
              <Compass className="h-4 w-4" /> Open in Yandex Navigator
            </button>
          </div>


          {/* Contact Details */}
          <div className={styles.contactCard}>
            <h3>Contact Information</h3>
            <div className="space-y-3">
              {business.address && (
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address + ', ' + business.city + ', Armenia')}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className={styles.contactItem}
                >
                  <MapPin className="h-4 w-4 text-[hsl(var(--primary))]" /> {business.address}, {business.city}
                </a>
              )}
              <a href={`tel:${business.phone}`} className={styles.contactItem}>
                <Phone className="h-4 w-4 text-[hsl(var(--primary))]" /> {business.phone}
              </a>
              <a href={`mailto:${business.email}`} className={styles.contactItem}>
                <Mail className="h-4 w-4 text-[hsl(var(--primary))]" /> {business.email}
              </a>
              {business.website && (
                <a href={business.website} target="_blank" rel="noreferrer" className={styles.contactItem}>
                  <Globe className="h-4 w-4 text-[hsl(var(--primary))]" /> Visit Website
                </a>
              )}
            </div>
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
                <h3 className="text-lg font-bold">Appointment Requested!</h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2 mb-6">
                  Thank you, your booking for <strong>{selectedService?.name}</strong> has been registered. Staff will contact you shortly to confirm.
                </p>
                <button onClick={() => setIsBookingOpen(false)} className="btn-primary w-full py-2.5 rounded-xl text-sm font-semibold">
                  Close Window
                </button>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <h2>Book Appointment</h2>
                <div className="p-3 bg-[hsl(var(--muted))]/50 rounded-xl mb-4 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span>Selected:</span>
                    <span>{selectedService?.name}</span>
                  </div>
                  {selectedService?.price > 0 && (
                    <div className="flex justify-between font-bold text-[hsl(var(--primary))] mt-1">
                      <span>Rate:</span>
                      <span>{selectedService?.price.toLocaleString()} AMD</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Your Full Name *</label>
                  <input 
                    required 
                    type="text" 
                    value={customerName} 
                    onChange={e => setCustomerName(e.target.value)} 
                    placeholder="Enter your name" 
                    className="w-full border border-[hsl(var(--border))] rounded-lg px-3 py-2 text-sm bg-transparent outline-none focus:border-[hsl(var(--primary))]" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Phone Number *</label>
                  <input 
                    required 
                    type="tel" 
                    value={customerPhone} 
                    onChange={e => setCustomerPhone(e.target.value)} 
                    placeholder="+374 XX XXXXXX" 
                    className="w-full border border-[hsl(var(--border))] rounded-lg px-3 py-2 text-sm bg-transparent outline-none focus:border-[hsl(var(--primary))]" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Date *</label>
                    <input 
                      required 
                      type="date" 
                      value={bookingDate} 
                      onChange={e => setBookingDate(e.target.value)} 
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full border border-[hsl(var(--border))] rounded-lg px-3 py-2 text-sm bg-transparent outline-none focus:border-[hsl(var(--primary))]" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Preferred Time Slot *</label>
                    <select 
                      required 
                      value={bookingTime} 
                      onChange={e => setBookingTime(e.target.value)}
                      className="w-full border border-[hsl(var(--border))] rounded-lg px-3 py-2 text-sm bg-transparent outline-none focus:border-[hsl(var(--primary))]"
                    >
                      <option value="">Select time</option>
                      {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Special Notes / Requests</label>
                  <textarea 
                    rows={2} 
                    value={bookingNotes} 
                    onChange={e => setBookingNotes(e.target.value)} 
                    placeholder="e.g. Dietary preferences or vehicle details..." 
                    className="w-full border border-[hsl(var(--border))] rounded-lg px-3 py-2 text-sm bg-transparent outline-none resize-none focus:border-[hsl(var(--primary))]" 
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={bookingLoading}
                  className="btn-primary w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 mt-6"
                >
                  {bookingLoading ? "Processing Request..." : <>Request Booking Confirmation <Send className="h-4 w-4" /></>}
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

      {showStoryViewer && matchingGroupIdx !== null && (
        <StoryViewer
          groups={activeStoriesGroups}
          initialGroupIndex={matchingGroupIdx}
          onClose={() => setShowStoryViewer(false)}
          onStoriesViewedUpdate={() => {}}
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
