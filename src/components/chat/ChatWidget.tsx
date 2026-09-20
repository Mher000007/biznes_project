"use client";
import { useState, useRef, useEffect, memo, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { toggleChat, addMessage, setLoading, setSessionId, clearChat } from "@/store/slices/chatSlice";
import type { ChatMessage, BusinessSuggestion } from "@/store/slices/chatSlice";
import { Search, MessageCircle, X, Send, Star, MapPin, ArrowRight, Sparkles, Bot, Tag, Users, Utensils, RotateCcw, ImagePlus, Calendar, Clock, Check, ChevronLeft, ChevronRight, Gift, UserPlus, LogIn, PhoneCall, QrCode } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { QRCodeSVG } from "qrcode.react";
import { useI18n } from "@/i18n";
import { useAuth } from "@/context/AuthContext";
import ChatMap from "./ChatMap";
import { MOCK_BUSINESSES } from "@/data/mock-businesses";

const logoCache = new Map<string, string>();
let cachedProfiles: any[] | null = null;
let lastProfilesFetch = 0;

const getCachedProfiles = (): any[] => {
  if (typeof localStorage === "undefined") return [];
  const now = Date.now();
  if (cachedProfiles && now - lastProfilesFetch < 10000) {
    return cachedProfiles;
  }
  try {
    const str = localStorage.getItem("armbiz-business-profiles");
    cachedProfiles = str ? JSON.parse(str) : [];
    lastProfilesFetch = now;
  } catch {
    cachedProfiles = [];
  }
  return cachedProfiles || [];
};

const resolveBusinessLogo = (item: any): string => {
  if (!item) return "";
  const cacheKey = item.id || item._id || item.slug || item.name || "";
  if (cacheKey && logoCache.has(cacheKey)) {
    return logoCache.get(cacheKey)!;
  }

  let result = "";

  // 1. Check direct custom base64 uploaded images first (highest priority)
  const metaCover = Array.isArray(item.metadata?.coverUrl) ? item.metadata.coverUrl[0] : item.metadata?.coverUrl;
  if (metaCover && typeof metaCover === 'string' && metaCover.trim().length > 0) {
    result = metaCover.trim();
  } else if (Array.isArray(item.highlights) && item.highlights.length > 0 && item.highlights[0]?.imageUrl) {
    result = item.highlights[0].imageUrl.trim();
  } else if (item.logo && typeof item.logo === 'string' && item.logo.trim().length > 0) {
    result = item.logo.trim();
  } else if (item.logoUrl && typeof item.logoUrl === 'string' && item.logoUrl.trim().length > 0) {
    result = item.logoUrl.trim();
  } else {
    // 2. Check cached localStorage custom business profiles for exact matches
    const profiles = getCachedProfiles();
    const itemKey = item.id || item.slug || item._id || "";
    const itemName = (item.name || item.businessName || "").toLowerCase().trim();

    if (profiles.length > 0) {
      const found = profiles.find((p: any) => {
        if (!p) return false;
        const pName = (p.businessName || p.name || "").toLowerCase().trim();
        const pSlug = pName.replace(/\s+/g, "-").replace(/[^\w\u0531-\u058F-]/g, "");
        return (
          (itemKey && (p.id === itemKey || p._id === itemKey || p.slug === itemKey || p.ownerUsername === itemKey || `custom-${p.ownerUsername}` === itemKey || pSlug === itemKey)) ||
          (itemName && pName && pName === itemName)
        );
      });
      if (found) {
        const pMetaCover = Array.isArray(found.metadata?.coverUrl) ? found.metadata.coverUrl[0] : found.metadata?.coverUrl;
        if (pMetaCover && typeof pMetaCover === 'string' && pMetaCover.trim().length > 0) result = pMetaCover.trim();
        else if (found.logo && typeof found.logo === 'string' && found.logo.trim().length > 0) result = found.logo.trim();
        else if (found.logoUrl && typeof found.logoUrl === 'string' && found.logoUrl.trim().length > 0) result = found.logoUrl.trim();
        else if (found.coverUrl && typeof found.coverUrl === 'string' && found.coverUrl.trim().length > 0) result = found.coverUrl.trim();
        else if (found.coverImageUrl && typeof found.coverImageUrl === 'string' && found.coverImageUrl.trim().length > 0) result = found.coverImageUrl.trim();
        else if (Array.isArray(found.images) && found.images.length > 0 && typeof found.images[0] === 'string' && found.images[0].trim().length > 0) result = found.images[0].trim();
      }
    }

    if (!result) {
      // 3. Check direct URLs
      if (item.coverImageUrl && typeof item.coverImageUrl === 'string' && item.coverImageUrl.trim().length > 0) {
        result = item.coverImageUrl.trim();
      } else if (item.coverUrl && typeof item.coverUrl === 'string' && item.coverUrl.trim().length > 0) {
        result = item.coverUrl.trim();
      } else if (item.coverImage && typeof item.coverImage === 'string' && item.coverImage.trim().length > 0) {
        result = item.coverImage.trim();
      } else if (item.image && typeof item.image === 'string' && item.image.trim().length > 0) {
        result = item.image.trim();
      } else if (Array.isArray(item.images) && item.images.length > 0 && typeof item.images[0] === 'string' && item.images[0].trim().length > 0) {
        result = item.images[0].trim();
      } else {
        // 4. Check MOCK_BUSINESSES
        const mockMatch = MOCK_BUSINESSES.find(
          (b) =>
            (itemKey && (b.id === itemKey || b.slug === itemKey)) ||
            (itemName && b.name && b.name.toLowerCase().trim() === itemName)
        );
        if (mockMatch) {
          result =
            mockMatch.logo ||
            mockMatch.logoUrl ||
            (Array.isArray(mockMatch.images) && mockMatch.images.length > 0 ? mockMatch.images[0] : "") ||
            mockMatch.coverImageUrl ||
            "";
        }
      }
    }
  }

  if (!result) result = "";
  if (cacheKey) logoCache.set(cacheKey, result);
  return result;
};

const galleryCache = new Map<string, string[]>();

const resolveBusinessGallery = (item: any): string[] => {
  if (!item) return [];
  const cacheKey = item.id || item._id || item.slug || item.name || "";
  if (cacheKey && galleryCache.has(cacheKey)) {
    return galleryCache.get(cacheKey)!;
  }

  const photos: string[] = [];
  const addPhoto = (url: any) => {
    if (typeof url === 'string' && url.trim().length > 0 && !photos.includes(url.trim())) {
      photos.push(url.trim());
    }
  };

  // 1. Direct item properties
  if (Array.isArray(item.photos)) item.photos.forEach(addPhoto);
  if (Array.isArray(item.gallery)) item.gallery.forEach(addPhoto);
  if (Array.isArray(item.images)) item.images.forEach(addPhoto);
  if (Array.isArray(item.highlights)) {
    item.highlights.forEach((h: any) => addPhoto(typeof h === 'string' ? h : h?.imageUrl));
  }
  if (item.metadata?.coverUrl) {
    if (Array.isArray(item.metadata.coverUrl)) item.metadata.coverUrl.forEach(addPhoto);
    else addPhoto(item.metadata.coverUrl);
  }
  if (item.metadata?.gallery) {
    if (Array.isArray(item.metadata.gallery)) item.metadata.gallery.forEach(addPhoto);
  }
  if (item.coverImageUrl) addPhoto(item.coverImageUrl);
  if (item.coverUrl) addPhoto(item.coverUrl);
  if (item.coverImage) addPhoto(item.coverImage);
  if (item.image) addPhoto(item.image);
  if (item.logo) addPhoto(item.logo);
  if (item.logoUrl) addPhoto(item.logoUrl);

  // 2. Check cached localStorage custom business profiles
  const profiles = getCachedProfiles();
  const itemKey = item.id || item.slug || item._id || "";
  const itemName = (item.name || item.businessName || "").toLowerCase().trim();

  if (profiles.length > 0) {
    const found = profiles.find((p: any) => {
      if (!p) return false;
      const pName = (p.businessName || p.name || "").toLowerCase().trim();
      const pSlug = pName.replace(/\s+/g, "-").replace(/[^\w\u0531-\u058F-]/g, "");
      return (
        (itemKey && (p.id === itemKey || p._id === itemKey || p.slug === itemKey || p.ownerUsername === itemKey || `custom-${p.ownerUsername}` === itemKey || pSlug === itemKey)) ||
        (itemName && pName && pName === itemName)
      );
    });
    if (found) {
      if (Array.isArray(found.gallery)) found.gallery.forEach(addPhoto);
      if (Array.isArray(found.images)) found.images.forEach(addPhoto);
      if (Array.isArray(found.highlights)) {
        found.highlights.forEach((h: any) => addPhoto(typeof h === 'string' ? h : h?.imageUrl));
      }
      if (found.coverUrl) {
        if (Array.isArray(found.coverUrl)) found.coverUrl.forEach(addPhoto);
        else addPhoto(found.coverUrl);
      }
      if (found.metadata?.coverUrl) {
        if (Array.isArray(found.metadata.coverUrl)) found.metadata.coverUrl.forEach(addPhoto);
        else addPhoto(found.metadata.coverUrl);
      }
      if (found.metadata?.gallery) {
        if (Array.isArray(found.metadata.gallery)) found.metadata.gallery.forEach(addPhoto);
      }
      if (found.coverImageUrl) addPhoto(found.coverImageUrl);
    }
  }

  // 3. Check MOCK_BUSINESSES
  const mockMatch = MOCK_BUSINESSES.find(
    (b) =>
      (itemKey && (b.id === itemKey || b.slug === itemKey)) ||
      (itemName && b.name && b.name.toLowerCase().trim() === itemName)
  );
  if (mockMatch) {
    if (Array.isArray(mockMatch.images)) mockMatch.images.forEach(addPhoto);
    if (mockMatch.coverImageUrl) addPhoto(mockMatch.coverImageUrl);
  }

  if (cacheKey) galleryCache.set(cacheKey, photos);
  return photos;
};

const GalleryCard = memo(function GalleryCard({
  biz,
  onBook,
  onMenu,
  isBusinessUser
}: {
  biz: BusinessSuggestion;
  onBook?: (bizId: string) => void;
  onMenu?: (biz: BusinessSuggestion) => void;
  isBusinessUser?: boolean;
}) {
  const [activePhotoIdx, setActivePhotoIdx] = useState<number | null>(null);
  const photos = resolveBusinessGallery(biz);

  if (photos.length === 0) {
    return (
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-center my-2 space-y-2">
        <div className="h-10 w-10 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
          <ImagePlus className="h-5 w-5" />
        </div>
        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
          «{biz.name}»
        </h4>
        <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
          Այս բիզնեսի «Ինտերիեր և Լուսանկարներ» բաժնում դեռ նկարներ չկան:
        </p>
      </div>
    );
  }

  const heroPhoto = photos[0];
  const thumbPhotos = photos.slice(1, 4);
  const remainingCount = photos.length - 4;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3.5 shadow-xs transition-all duration-300 hover:shadow-md hover:border-emerald-500/40 my-2 space-y-3 group">
      {/* Header Info */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <ImagePlus className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white truncate">
              {biz.name}
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              «Ինտերիեր և Լուսանկարներ» ({photos.length} նկար)
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 shrink-0">
          📸 Ինտերիեր և Լուսանկարներ
        </span>
      </div>

      {/* Photo Gallery Grid */}
      <div className="space-y-1.5">
        {/* Main Hero Photo */}
        <div 
          onClick={() => setActivePhotoIdx(0)}
          className="relative h-44 w-full rounded-xl overflow-hidden cursor-pointer group/hero shadow-xs"
        >
          <img 
            src={heroPhoto} 
            alt="Hall photo" 
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover/hero:scale-105" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/hero:opacity-100 transition-opacity flex items-end p-2.5">
            <span className="text-[11px] font-medium text-white flex items-center gap-1">
              🔍 Մեծացնել (1 / {photos.length})
            </span>
          </div>
        </div>

        {/* Thumbnail Row if more photos */}
        {thumbPhotos.length > 0 && (
          <div className="grid grid-cols-3 gap-1.5">
            {thumbPhotos.map((photo, idx) => {
              const photoRealIdx = idx + 1;
              const isLast = idx === 2 && remainingCount > 0;
              return (
                <div
                  key={idx}
                  onClick={() => setActivePhotoIdx(photoRealIdx)}
                  className="relative h-16 rounded-lg overflow-hidden cursor-pointer group/thumb shadow-2xs"
                >
                  <img
                    src={photo}
                    alt={`Thumbnail ${idx}`}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover/thumb:scale-110"
                  />
                  {isLast && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center text-white font-bold text-xs">
                      +{remainingCount + 1}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Symmetrical Action Buttons (50/50 Grid) */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[hsl(var(--border))]/40">
        <button
          type="button"
          onClick={() => onMenu?.(biz)}
          className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer hover:border-emerald-500/30 active:scale-[0.98]"
        >
          <Utensils className="h-3.5 w-3.5 text-emerald-500" />
          <span>Մենյու</span>
        </button>

        <button
          type="button"
          onClick={() => onBook?.(biz.id)}
          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer"
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>Ամրագրել</span>
        </button>
      </div>

      {/* Fullscreen Modal Lightbox */}
      {activePhotoIdx !== null && photos[activePhotoIdx] && (
        <div 
          onClick={() => setActivePhotoIdx(null)}
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="relative max-w-3xl max-h-[85vh] w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-full flex items-center justify-between text-white/90 mb-2 px-1">
              <span className="text-xs font-semibold bg-white/10 px-3 py-1 rounded-full border border-white/10">
                🖼️ {biz.name} — Ինտերիեր և Լուսանկարներ ({activePhotoIdx + 1} / {photos.length})
              </span>
              <button 
                onClick={() => setActivePhotoIdx(null)}
                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative w-full flex items-center justify-center">
              <img 
                src={photos[activePhotoIdx]} 
                alt={`${biz.name} Photo ${activePhotoIdx + 1}`} 
                className="max-h-[75vh] w-full object-contain rounded-2xl shadow-2xl border border-white/10" 
              />
              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => setActivePhotoIdx((activePhotoIdx - 1 + photos.length) % photos.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-xs border border-white/20 transition-all cursor-pointer"
                    title="Նախորդ"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setActivePhotoIdx((activePhotoIdx + 1) % photos.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-xs border border-white/20 transition-all cursor-pointer"
                    title="Հաջորդ"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

const BusinessCard = memo(function BusinessCard({ 
  biz, 
  onSelect, 
  onBook, 
  onViewPhotos,
  isBusinessUser 
}: { 
  biz: BusinessSuggestion; 
  onSelect?: (biz: BusinessSuggestion) => void; 
  onBook?: (bizId: string) => void; 
  onViewPhotos?: (biz: BusinessSuggestion) => void;
  isBusinessUser?: boolean 
}) {
  const [imgError, setImgError] = useState(false);
  const logo = resolveBusinessLogo(biz);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3.5 shadow-xs transition-all duration-300 hover:shadow-md hover:border-emerald-500/40 my-2 space-y-3 group">
      {/* Top Main Row: Avatar/Image + Title/Desc + Open Status Badge */}
      <div
        onClick={() => onSelect?.(biz)}
        className="flex items-center justify-between gap-3 cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Avatar / Business Image */}
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-base font-extrabold border border-emerald-500/20 shadow-2xs group-hover:scale-105 transition-transform overflow-hidden">
            {logo && !imgError ? (
              <img
                src={logo}
                alt={biz.name}
                loading="lazy"
                decoding="async"
                onError={() => setImgError(true)}
                className="h-full w-full object-cover rounded-xl"
              />
            ) : (
              <span>{biz.name?.[0]?.toUpperCase() || "B"}</span>
            )}
          </div>

          {/* Name & Subtitle */}
          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-[13.5px] font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {biz.name}
            </h4>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))] truncate mt-0.5 font-medium">
              {biz.shortDescription || "Ռեստորան / Սրճարան"}
            </p>
          </div>
        </div>

        {/* Status Pill */}
        <div className="shrink-0">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Բաց է</span>
          </span>
        </div>
      </div>

      {/* Symmetrical Meta Bar (Rating & Location) */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[hsl(var(--border))]/40">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
            <span>{biz.rating || "4.5"}</span>
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
            <MapPin className="h-3 w-3 text-emerald-500 shrink-0" />
            <span className="truncate max-w-[120px]">{biz.city || "Երևան"}</span>
          </span>
        </div>
      </div>

      {/* Symmetrical Bottom Action Buttons (3-column: Menu, Photos, Book) */}
      <div className="grid grid-cols-3 gap-1.5 pt-0.5">
        <button
          type="button"
          onClick={() => onSelect?.(biz)}
          className="w-full py-2 px-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer hover:border-emerald-500/30 active:scale-[0.98]"
        >
          <Utensils className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          <span className="truncate">Մենյու</span>
        </button>

        <button
          type="button"
          onClick={() => onViewPhotos?.(biz)}
          className="w-full py-2 px-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer hover:border-cyan-500/30 active:scale-[0.98]"
        >
          <ImagePlus className="h-3.5 w-3.5 text-cyan-500 shrink-0" />
          <span className="truncate">Սրահ</span>
        </button>

        <button
          type="button"
          onClick={() => onBook?.(biz.id)}
          className="w-full py-2 px-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold transition-all text-center flex items-center justify-center gap-1 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer"
        >
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Ամրագրել</span>
        </button>
      </div>
    </div>
  );
});

const LocationCard = memo(function LocationCard({ loc, onSelect }: { loc: BusinessSuggestion; onSelect: (loc: BusinessSuggestion) => void }) {
  return (
    <div
      onClick={() => onSelect(loc)}
      className="flex items-start gap-3 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3.5 transition-all hover:shadow-md hover:border-emerald-500/50 hover:bg-emerald-500/5 cursor-pointer group my-1.5"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-xs mt-0.5">
        <MapPin className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {loc.name || loc.city || "Մասնաճյուղ"}
          </h4>
          {loc.city && (
            <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              {loc.city}
            </span>
          )}
        </div>
        <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1 line-clamp-2 leading-relaxed">
          {loc.address || loc.shortDescription}
        </p>
        {loc.phone && (
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
            📞 {loc.phone}
          </p>
        )}
      </div>
      <button
        type="button"
        className="shrink-0 self-center text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-xl shadow-xs transition-all group-hover:shadow-md group-hover:scale-105 cursor-pointer"
      >
        Ընտրել
      </button>
    </div>
  );
});

const OfferCard = memo(function OfferCard({ item, onBook, isBusinessUser }: { item: BusinessSuggestion; onBook: (id: string) => void; isBusinessUser?: boolean }) {
  const priceFormatted = (item.price || 13000).toLocaleString() + " AMD";
  const paxText = (item.pax || 2) === 1 ? '👤 1' : `👥 ${item.pax || 2}`;
  const locationText = item.location || item.city || "Palermo Restaurant, Jrvej";
  const packageName = item.packageName || item.name || "Սեթ No 1";

  const atmosphere = item.atmosphere || 'family';
  const atmBadgeClass = atmosphere === 'family'
    ? 'bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300'
    : atmosphere === 'friends'
      ? 'bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/15 border-indigo-500/30 text-indigo-700 dark:text-indigo-300'
      : 'bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300';
  const atmText = atmosphere === 'family' ? '👨‍👩‍👧‍👦 Family' : atmosphere === 'friends' ? '👥 Friends' : '⚡ Active';

  const cuisine = item.cuisine || 'armenian';
  const cuisineBadgeClass = cuisine === 'armenian'
    ? 'bg-gradient-to-r from-red-500/10 via-orange-500/10 to-red-500/15 border-red-500/30 text-red-700 dark:text-red-300'
    : cuisine === 'georgian'
      ? 'bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/15 border-green-500/30 text-green-700 dark:text-green-300'
      : 'bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/15 border-purple-500/30 text-purple-700 dark:text-purple-300';
  const cuisineText = cuisine === 'armenian' ? '🇦🇲 Armenian' : cuisine === 'georgian' ? '🇬🇪 Georgian' : cuisine === 'japanese' ? '🇯🇵 Japanese' : cuisine === 'russian' ? '🇷🇺 Russian' : cuisine === 'italian' ? '🇮🇹 Italian' : '🍽️ Mix';

  return (
    <div className="relative group rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-sm transition-all hover:border-[hsl(var(--primary))]/30 hover:shadow-md my-2">
      <div className="flex justify-between items-start mb-2.5">
        <div>
          <h3 className="font-semibold text-base text-[hsl(var(--foreground))]">{packageName}</h3>
          {item.name && item.name !== packageName && (
            <p className="text-[11px] text-[hsl(var(--muted-foreground))] font-medium">{item.name}</p>
          )}
        </div>
      </div>

      <div className="space-y-2.5 text-xs text-[hsl(var(--muted-foreground))]">
        <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20 text-xs shadow-2xs">
              <Tag className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span>{priceFormatted}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] font-semibold text-xs border border-[hsl(var(--border))]">
              <Users className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))] shrink-0" />
              <span>{paxText}</span>
            </div>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1.5 border shadow-2xs backdrop-blur-xs transition-all ${atmBadgeClass}`}>
              <Sparkles className="w-3 h-3 shrink-0" />
              <span>{atmText}</span>
            </span>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1.5 border shadow-2xs backdrop-blur-xs transition-all ${cuisineBadgeClass}`}>
              <span>{cuisineText}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs bg-[hsl(var(--muted))]/40 border border-[hsl(var(--border))]/80 px-3 py-2 rounded-xl transition-all hover:bg-[hsl(var(--muted))]/70 group cursor-default" title={locationText}>
          <div className="p-1 rounded-lg bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] shrink-0 group-hover:scale-110 transition-transform">
            <MapPin className="w-3.5 h-3.5" />
          </div>
          <span className="truncate font-semibold text-[hsl(var(--foreground))] text-xs">{locationText}</span>
        </div>

        {(item.dishesHy || item.dishesEn || item.dishesRu) && (
          <div className="mt-2.5 pt-2.5 border-t border-[hsl(var(--border))]/60 space-y-1.5">
            <p className="font-bold text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
              <Utensils className="w-3 h-3 text-[hsl(var(--primary))]" />
              <span>Dishes</span>
            </p>
            {item.dishesHy && (
              <p className="line-clamp-2 text-xs font-medium text-[hsl(var(--foreground))] bg-[hsl(var(--muted))]/20 p-2 rounded-lg border border-[hsl(var(--border))]/40">
                🇦🇲 {item.dishesHy}
              </p>
            )}
            {item.dishesEn && (
              <p className="line-clamp-2 text-xs text-[hsl(var(--muted-foreground))] pl-1">
                🇬🇧 {item.dishesEn}
              </p>
            )}
            {item.dishesRu && (
              <p className="line-clamp-2 text-xs text-[hsl(var(--muted-foreground))] pl-1">
                🇷🇺 {item.dishesRu}
              </p>
            )}
          </div>
        )}

        {isBusinessUser ? (
          <button
            type="button"
            onClick={() => onBook(item.id)}
            className="w-full mt-2 py-2.5 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-dashed border-slate-300 dark:border-slate-700"
            title="Բիզնես հաշվով ամրագրումը հասանելի չէ"
          >
            <span>🔒 Ամրագրում (Հասանելի չէ բիզնես հաշվին)</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onBook(item.id)}
            className="w-full mt-2 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-md cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Ամրագրել Առաջարկը</span>
          </button>
        )}
      </div>
    </div>
  );
});

const AuthPromptCard = memo(function AuthPromptCard() {
  return (
    <div className="mt-3 p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/15 dark:from-emerald-950/40 dark:via-slate-900/50 dark:to-teal-950/40 border border-emerald-500/30 dark:border-emerald-500/20 shadow-md space-y-3.5 animate-scale-in">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm shadow-emerald-500/30">
          <Gift className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
            Ամրագրում և Բացառիկ Առավելություններ
          </h4>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            Գրանցվեք և ստացեք առավելագույն օգուտ
          </p>
        </div>
      </div>

      <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
        <div className="flex items-start gap-2">
          <span className="text-emerald-500 font-bold">🎁</span>
          <span><strong>Բոնուսներ & CashBack:</strong> Կուտակեք միավորներ յուրաքանչյուր ամրագրման դիմաց:</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-emerald-500 font-bold">🎫</span>
          <span><strong>Անհատական QR Կոդ:</strong> Յուրաքանչյուր հաստատության համար ստացեք անհատականացված QR կոդ:</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-emerald-500 font-bold">📱</span>
          <span><strong>Ամրագրումների Պատմություն:</strong> Հետևեք կարգավիճակին և կառավարեք Ձեր պրոֆիլից:</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <Link
          href="/register"
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 hover:shadow-lg transition-all active:scale-[0.98]"
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span>Գրանցվել (Անվճար)</span>
        </Link>
        <Link
          href="/login"
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-100 text-xs font-bold shadow-xs transition-all active:scale-[0.98]"
        >
          <LogIn className="h-3.5 w-3.5" />
          <span>Մուտք</span>
        </Link>
      </div>
    </div>
  );
});

const BookingSuccessCard = memo(function BookingSuccessCard({ item }: { item: any }) {
  const [showQrModal, setShowQrModal] = useState(false);
  const qrCodeValue = item?.qrToken || item?.bookingCode?.replace("#", "") || item?.id || "TREEO-BOOKING";

  return (
    <div className="mt-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/40 shadow-lg shadow-emerald-500/10 space-y-3 animate-scale-in">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-500/20">
          <Check className="h-3.5 w-3.5 text-emerald-500" />
          Հայտը ներկայացված է
        </span>
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
          {item?.bookingCode || `#${item?.qrToken?.substring(0, 8) || '10294'}`}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex flex-col flex-1 min-w-0">
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
            {item?.name || "Հաստատություն"}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 truncate">
            <MapPin className="h-3 w-3 text-emerald-500 shrink-0" />
            <span>{item?.city || "Երևան"}</span>
          </p>
          {item?.dateTime && (
            <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1 mt-1 font-medium">
              <Calendar className="h-3 w-3 text-teal-500 shrink-0" />
              <span>{item.dateTime.replace("T", "  🕒 ")}</span>
            </p>
          )}
        </div>

        {/* QR Code thumbnail */}
        <div 
          onClick={() => setShowQrModal(true)}
          className="p-1.5 rounded-xl bg-white dark:bg-white border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:scale-105 transition-transform"
          title="Սեղմեք՝ QR կոդը մեծացնելու համար"
        >
          <QRCodeSVG value={qrCodeValue} size={64} />
        </div>
      </div>

      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
        <p className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
          <PhoneCall className="h-3.5 w-3.5 shrink-0" />
          <span>Ձեզ հետ շուտով կկապնվեն հաստատելու համար</span>
        </p>
        <p className="text-slate-500 dark:text-slate-400 text-[10.5px]">
          Հաստատելուց հետո այս անհատական QR կոդը ներկայացրեք հաստատությունում: QR կոդը պահպանված է նաև Ձեր անձնական պրոֆիլում:
        </p>
      </div>

      <div className="flex gap-2">
        <Link
          href="/profile"
          className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs text-center shadow-md hover:shadow-lg transition-all"
        >
          📱 Դիտել Իմ Պրոֆիլում
        </Link>
      </div>

      {/* QR Lightbox Modal */}
      {showQrModal && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setShowQrModal(false)}
        >
          <div 
            className="relative bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl border border-white/20 space-y-4 animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowQrModal(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
            <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
              Ամրագրման QR Կոդ
            </h4>
            <div className="p-4 bg-white rounded-2xl inline-block shadow-inner border border-slate-100">
              <QRCodeSVG value={qrCodeValue} size={160} />
            </div>
            <p className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
              {qrCodeValue}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ներկայացրեք այս QR կոդը հաստատությունում այցելության ժամանակ:
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

const DateTimePickerCard = memo(function DateTimePickerCard({ msgId, onSelectDate }: { msgId: string; onSelectDate: (val: string, displayLabel?: string) => void }) {
  const formatInputDate = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const getTodayAt = (hours: number, minutes: number = 0) => {
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    return formatInputDate(d);
  };

  const getTomorrowAt = (hours: number, minutes: number = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(hours, minutes, 0, 0);
    return formatInputDate(d);
  };

  const defaultTime = getTodayAt(20, 0);
  const [selectedVal, setSelectedVal] = useState<string>(defaultTime);

  const shortcuts = [
    { label: "⚡ Այսօր 19:30", val: getTodayAt(19, 30), display: "Այսօր 19:30" },
    { label: "🌙 Այսօր 20:30", val: getTodayAt(20, 30), display: "Այսօր 20:30" },
    { label: "☀️ Վաղը 19:00", val: getTomorrowAt(19, 0), display: "Վաղը 19:00" },
    { label: "✨ Վաղը 20:00", val: getTomorrowAt(20, 0), display: "Վաղը 20:00" },
  ];

  const handleSubmit = () => {
    if (!selectedVal) return;
    const formattedDisplay = selectedVal.replace("T", " ");
    onSelectDate(selectedVal, `🗓️ ${formattedDisplay}`);
  };

  const handleShortcutClick = (sc: typeof shortcuts[0]) => {
    setSelectedVal(sc.val);
    onSelectDate(sc.val, `🗓️ ${sc.display}`);
  };

  return (
    <div className="mt-2.5 overflow-hidden rounded-2xl border border-emerald-500/25 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-4 shadow-xl shadow-emerald-500/5 space-y-3.5 animate-fade-in ring-1 ring-black/5 dark:ring-white/10">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-md shadow-emerald-500/20 shrink-0">
          <Calendar className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <span>Օրվա և Ժամի ընտրություն</span>
            <span className="text-[9px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Ամրագրում
            </span>
          </h4>
          <p className="text-[10.5px] text-[hsl(var(--muted-foreground))]">
            Ընտրեք Ձեզ հարմար օրն ու ժամը
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Արագ ընտրություն՝
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {shortcuts.map((sc) => (
            <button
              key={sc.label}
              type="button"
              onClick={() => handleShortcutClick(sc)}
              className={`text-[11px] font-semibold px-2.5 py-2 rounded-xl border transition-all text-left flex items-center justify-between cursor-pointer ${selectedVal === sc.val
                ? "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shadow-xs"
                : "border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 hover:border-emerald-500/40 hover:bg-emerald-500/5"
                }`}
            >
              <span>{sc.label}</span>
              {selectedVal === sc.val && <Check className="h-3 w-3 text-emerald-500" />}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`date-${msgId}`} className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Կամ նշեք ճշգրիտ ամսաթիվը՝
        </label>
        <div className="relative flex items-center">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-emerald-500 pointer-events-none">
            <Clock className="h-4 w-4" />
          </div>
          <input
            type="datetime-local"
            id={`date-${msgId}`}
            value={selectedVal}
            onChange={(e) => setSelectedVal(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all shadow-inner cursor-pointer"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer group"
      >
        <span>Հաստատել Ժամը</span>
        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
});

const MessageBubble = memo(function MessageBubble({ msg }: { msg: ChatMessage }) {
  const { t, locale } = useI18n();
  const { currentUser } = useAuth();
  const dispatch = useDispatch();
  const sessionId = useSelector((s: RootState) => s.chat.sessionId);
  const isUser = msg.role === "user";

  const isBusinessUser = currentUser?.accountType === "business" || currentUser?.role === "business" || currentUser?.role === "owner";

  const handleSendDate = (val: string, displayLabel?: string) => {
    if (!val) return;
    const userMsg: ChatMessage = { id: `msg-${Date.now()}`, role: "user", content: displayLabel || val, timestamp: Date.now() };
    dispatch(addMessage(userMsg));
    dispatch(setLoading(true));
    axios.post("/api/ai/chat", {
      message: val,
      sessionId,
      lang: locale,
      userId: (currentUser as any)?._id || (currentUser as any)?.id,
      userName: (currentUser as any)?.name || (currentUser as any)?.fullName || (currentUser as any)?.username,
      userPhone: (currentUser as any)?.phone,
      userRole: (currentUser as any)?.role || (currentUser as any)?.accountType,
      isBusinessUser,
      isGuest: !currentUser
    }).then(res => {
      dispatch(addMessage({ id: `msg-${Date.now() + 1}`, role: "assistant", content: res.data.response, timestamp: Date.now(), intent: res.data.intent, suggestions: res.data.suggestions, quickReplies: res.data.quickReplies }));
      if (res.data.intent === "booking_success" && res.data.suggestions && res.data.suggestions.length > 0) {
        try {
          const item = res.data.suggestions[0];
          const localBookings = JSON.parse(window.localStorage.getItem("armbiz-local-bookings") || "[]");
          const userBookings = JSON.parse(window.localStorage.getItem("armbiz_user_bookings") || "[]");
          const newBooking = {
            id: item.id || `booking-${Date.now()}`,
            businessId: item.businessId || item.id,
            businessName: item.name || "Business",
            customerName: (currentUser as any)?.name || (currentUser as any)?.fullName || (currentUser as any)?.username || "Treeo User",
            customerPhone: (currentUser as any)?.phone || "",
            date: item.dateTime ? item.dateTime.split("T")[0] : new Date().toISOString().split("T")[0],
            time: item.dateTime?.includes("T") ? item.dateTime.split("T")[1]?.substring(0, 5) : "20:00",
            timeSlot: item.dateTime?.includes("T") ? item.dateTime.split("T")[1]?.substring(0, 5) : "20:00",
            serviceName: "Table Reservation",
            status: "pending",
            qrToken: item.qrToken || item.bookingCode?.replace("#", "") || Math.random().toString(36).substr(2, 10).toUpperCase(),
            createdAt: new Date().toISOString()
          };
          localBookings.push(newBooking);
          userBookings.push(newBooking);
          window.localStorage.setItem("armbiz-local-bookings", JSON.stringify(localBookings));
          window.localStorage.setItem("armbiz_user_bookings", JSON.stringify(userBookings));
          window.dispatchEvent(new Event("bookingsUpdated"));
        } catch (e) {
          console.error("Error saving chat booking locally:", e);
        }
      }
      dispatch(setLoading(false));
    }).catch(() => dispatch(setLoading(false)));
  };

  const handleBook = (bizId: string) => {
    if (isBusinessUser) {
      dispatch(addMessage({
        id: `msg-warn-${Date.now()}`,
        role: "assistant",
        content: "⚠️ **Ուշադրություն.** Բիզնես (Business) հաշիվներով ամրագրում կատարել հնարավոր չէ:\n\nԱմրագրումներ կատարելու համար խնդրում ենք մուտք գործել կամ օգտագործել **անձնական (Personal)** հաշիվ:",
        timestamp: Date.now()
      }));
      return;
    }

    if (!currentUser) {
      dispatch(addMessage({
        id: `msg-auth-prompt-${Date.now()}`,
        role: "assistant",
        content: "🔒 **Ամրագրում կատարելու համար խնդրում ենք գրանցվել կամ մուտք գործել անձնական հաշիվ։**\n\n✨ **Ինչո՞ւ է գրանցումը շահեկան Ձեզ համար.**\n\n🎁 **1. Բոնուսներ և CashBack** — Յուրաքանչյուր ամրագրման դիմաց կուտակեք միավորներ և ստացեք բացառիկ զեղչեր ու նվերներ:\n\n🎫 **2. Անհատականեցված QR Կոդ** — Գրանցվելուց հետո Ձեր բոլոր ամրագրումները կունենան տվյալ բիզնեսին պատկանող անհատական QR կոդ, որը կպահպանվի Ձեր պրոֆիլում և կապահովի երաշխավորված սպասարկում:\n\n⚡ **3. Ակնթարթային ամրագրումներ** — Կարիք չի լինի ամեն անգամ լրացնել Ձեր կոնտակտային տվյալները:\n\n📱 **4. Պատմության և կարգավիճակի վերահսկում** — Դիտեք Ձեր ամրագրումների ընթացքն ու կարգավիճակը Ձեր անձնական էջում ցանկացած պահի:\n\n*Խնդրում ենք գրանցվել կամ մուտք գործել՝ ամրագրումը շարունակելու համար:*",
        intent: "show_auth_prompt",
        timestamp: Date.now()
      }));
      return;
    }

    handleSendDate(`book id:${bizId}`, "📅 Ամրագրել");
  };

  const handleSelectBiz = (biz: BusinessSuggestion) => {
    handleSendDate(`select_biz id:${biz.id} name:${biz.name}`, `🍽️ ${biz.name}`);
  };

  const handleViewPhotos = (biz: BusinessSuggestion) => {
    handleSendDate(`photos biz:${biz.id}`, `📸 «${biz.name}» սրահի նկարները`);
  };

  const handleSelectLocation = (loc: BusinessSuggestion) => {
    const displayAddr = loc.address || loc.shortDescription || loc.city || "Մասնաճյուղ";
    const userLabel = `📍 ${loc.name && loc.name !== loc.city ? `${loc.name} — ` : ''}${displayAddr}`;
    const payload = `select_location id:${loc.id} address:${encodeURIComponent(displayAddr)} city:${encodeURIComponent(loc.city || "")} name:${encodeURIComponent(loc.name || "")}`;
    handleSendDate(payload, userLabel);
  };

  const confirmBooking = () => {
    if (isBusinessUser) {
      dispatch(addMessage({
        id: `msg-warn-${Date.now()}`,
        role: "assistant",
        content: "⚠️ **Ուշադրություն.** Բիզնես (Business) հաշիվներով ամրագրում կատարել հնարավոր չէ:\n\nԱմրագրումներ կատարելու համար խնդրում ենք մուտք գործել կամ օգտագործել **անձնական (Personal)** հաշիվ:",
        timestamp: Date.now()
      }));
      return;
    }

    if (!currentUser) {
      dispatch(addMessage({
        id: `msg-auth-prompt-${Date.now()}`,
        role: "assistant",
        content: "🔒 **Ամրագրում կատարելու համար խնդրում ենք գրանցվել կամ մուտք գործել անձնական հաշիվ։**\n\n✨ **Ինչո՞ւ է գրանցումը շահեկան Ձեզ համար.**\n\n🎁 **1. Բոնուսներ և CashBack** — Յուրաքանչյուր ամրագրման դիմաց կուտակեք միավորներ և ստացեք բացառիկ զեղչեր ու նվերներ:\n\n🎫 **2. Անհատականեցված QR Կոդ** — Գրանցվելուց հետո Ձեր բոլոր ամրագրումները կունենան տվյալ բիզնեսին պատկանող անհատական QR կոդ, որը կպահպանվի Ձեր պրոֆիլում և կապահովի երաշխավորված սպասարկում:\n\n⚡ **3. Ակնթարթային ամրագրումներ** — Կարիք չի լինի ամեն անգամ լրացնել Ձեր կոնտակտային տվյալները:\n\n📱 **4. Պատմության և կարգավիճակի վերահսկում** — Դիտեք Ձեր ամրագրումների ընթացքն ու կարգավիճակը Ձեր անձնական էջում ցանկացած պահի:\n\n*Խնդրում ենք գրանցվել կամ մուտք գործել՝ ամրագրումը շարունակելու համար:*",
        intent: "show_auth_prompt",
        timestamp: Date.now()
      }));
      return;
    }

    handleSendDate(`confirm_booking`, "✅ Հաստատել ամրագրումը");
  };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}>
      <div className={`max-w-[85%] space-y-2`}>
        {!isUser && (
          <div className="flex items-center gap-2 mb-1 pl-1">
            <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-green-500 to-emerald-400 shadow-sm shadow-green-500/20">
              <Bot className="h-3.5 w-3.5 text-white" />
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-400 border border-white"></span>
            </div>
            <span className="text-[11px] font-bold tracking-wide text-[hsl(var(--muted-foreground))]">{t.chat?.assistantName || "Treeo Assistant"}</span>
          </div>
        )}
        <div className={`relative px-5 py-3.5 text-[14.5px] leading-relaxed transition-all duration-300 ${isUser
          ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-[24px] rounded-tr-[6px] shadow-lg shadow-emerald-500/25 ring-1 ring-white/20"
          : "bg-white/70 dark:bg-white/5 backdrop-blur-3xl text-slate-800 dark:text-slate-100 rounded-[24px] rounded-tl-[6px] border border-white/60 dark:border-white/10 shadow-xl shadow-black/5 prose prose-sm prose-slate dark:prose-invert max-w-none"
          }`}>
          {msg.imageUrl && (
            <div className="mb-3">
              <img src={msg.imageUrl} alt="Attached" className="rounded-xl max-h-48 w-auto object-cover shadow-sm border border-white/20" />
            </div>
          )}
          {isUser ? (
            <span className="whitespace-pre-wrap">{msg.content}</span>
          ) : (
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          )}
        </div>

        {msg.intent === "show_auth_prompt" && (
          <AuthPromptCard />
        )}

        {msg.intent === "booking_success" && msg.suggestions && msg.suggestions.length > 0 && (
          <BookingSuccessCard item={msg.suggestions[0]} />
        )}

        {(msg.intent === "show_datetime_picker" || msg.intent === "ask_datetime") && (
          <DateTimePickerCard msgId={msg.id} onSelectDate={handleSendDate} />
        )}

        {msg.intent === "show_summary_card" && msg.suggestions && msg.suggestions.length > 0 && (
          <div className="mt-2 p-4 bg-white dark:bg-slate-800 rounded-xl border border-[hsl(var(--border))] shadow-md space-y-3">
            <h4 className="font-bold text-base text-green-600 dark:text-green-400">Ամրագրման Ամփոփում</h4>
            <div className="text-sm space-y-1 text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              {msg.suggestions[0].shortDescription}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 p-2 rounded-lg">
              ℹ️ Անվճար չեղարկում մինչև ամրագրված ժամից 2 ժամ առաջ:
            </div>
            <button onClick={confirmBooking} className="w-full py-3 mt-2 rounded-xl text-white font-bold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer" style={{ backgroundColor: "#FD7B0A" }}>
              ՀԱՍՏԱՏԵԼ ԱՄՐԱԳՐՈՒՄԸ
            </button>
          </div>
        )}

        {msg.intent === "show_location_picker" && msg.suggestions && msg.suggestions.length > 0 && (
          <div className="space-y-2 mt-2">
            {msg.suggestions.map((loc) => (
              <LocationCard
                key={loc.id}
                loc={loc}
                onSelect={handleSelectLocation}
              />
            ))}
          </div>
        )}

        {msg.intent === "show_results" && msg.suggestions && msg.suggestions.length > 0 && (
          <div className="space-y-2 mt-2">
            {msg.suggestions.map(biz => (
              <OfferCard key={biz.id} item={biz} onBook={handleBook} isBusinessUser={isBusinessUser} />
            ))}
          </div>
        )}

        {msg.intent === "show_gallery" && msg.suggestions && msg.suggestions.length > 0 && (
          <div className="space-y-2 mt-2">
            {msg.suggestions.map(biz => (
              <GalleryCard key={biz.id} biz={biz} onBook={handleBook} onMenu={handleSelectBiz} isBusinessUser={isBusinessUser} />
            ))}
          </div>
        )}

        {msg.intent === "show_map" && msg.suggestions && msg.suggestions.length > 0 && (
          <div className="mt-2">
            <ChatMap suggestions={msg.suggestions} />
          </div>
        )}

        {msg.intent !== "show_results" && msg.intent !== "show_summary_card" && msg.intent !== "show_map" && msg.intent !== "show_location_picker" && msg.intent !== "show_gallery" && msg.intent !== "booking_success" && msg.intent !== "show_auth_prompt" && msg.suggestions && msg.suggestions.length > 0 && (
          <div className="space-y-2 mt-2">
            {msg.suggestions.map(biz => (
              <BusinessCard key={biz.id} biz={biz} onSelect={handleSelectBiz} onBook={handleBook} onViewPhotos={handleViewPhotos} isBusinessUser={isBusinessUser} />
            ))}
          </div>
        )}

        {msg.quickReplies && msg.quickReplies.length > 0 && (!msg.suggestions || msg.suggestions.length === 0) && msg.intent !== "show_results" && msg.intent !== "select_business" && msg.intent !== "show_gallery" && msg.intent !== "show_map" && msg.intent !== "show_location_picker" && msg.intent !== "show_summary_card" && msg.intent !== "booking_success" && msg.intent !== "show_auth_prompt" && (
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex flex-wrap gap-1.5">
              {msg.quickReplies.map(reply => (
                <QuickReplyButton key={reply} text={reply} />
              ))}
            </div>
            {msg.intent?.startsWith("ask_") && (
              <span className="text-[10px] text-slate-500 dark:text-slate-400 italic px-1">
                {locale?.startsWith('hy') ? '* Կարող եք ընտրել տարբերակներից կամ պարզապես գրել Ձեր պատասխանը' : locale?.startsWith('ru') ? '* Вы можете выбрать вариант или просто написать свой ответ' : '* You can choose an option or type your answer'}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

const QuickReplyButton = memo(function QuickReplyButton({ text }: { text: string }) {
  const { t, locale } = useI18n();
  const { currentUser } = useAuth();
  const dispatch = useDispatch();
  const sessionId = useSelector((s: RootState) => s.chat.sessionId);
  const isBusinessUser = currentUser?.accountType === "business" || currentUser?.role === "business" || currentUser?.role === "owner";

  const handleClick = async () => {
    const cleanText = text.replace(/^[\u{1F300}-\u{1F9FF}]\s*/u, "");

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: cleanText,
      timestamp: Date.now(),
    };
    dispatch(addMessage(userMsg));
    dispatch(setLoading(true));

    try {
      const res = await axios.post("/api/ai/chat", {
        message: cleanText,
        sessionId,
        lang: locale,
        userId: (currentUser as any)?._id || (currentUser as any)?.id,
        userName: (currentUser as any)?.name || (currentUser as any)?.fullName || (currentUser as any)?.username,
        userPhone: (currentUser as any)?.phone,
        userRole: (currentUser as any)?.role || (currentUser as any)?.accountType,
        isBusinessUser,
        isGuest: !currentUser
      });
      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: res.data.response,
        timestamp: Date.now(),
        suggestions: res.data.suggestions,
        quickReplies: res.data.quickReplies,
        intent: res.data.intent,
      };
      dispatch(addMessage(aiMsg));
      if (res.data.sessionId) dispatch(setSessionId(res.data.sessionId));

      if (res.data.intent === "booking_success" && res.data.suggestions && res.data.suggestions.length > 0) {
        try {
          const item = res.data.suggestions[0];
          const localBookings = JSON.parse(window.localStorage.getItem("armbiz-local-bookings") || "[]");
          const userBookings = JSON.parse(window.localStorage.getItem("armbiz_user_bookings") || "[]");
          const newBooking = {
            id: item.id || `booking-${Date.now()}`,
            businessId: item.businessId || item.id,
            businessName: item.name || "Business",
            customerName: (currentUser as any)?.name || (currentUser as any)?.fullName || (currentUser as any)?.username || "Treeo User",
            customerPhone: (currentUser as any)?.phone || "",
            date: item.dateTime ? item.dateTime.split("T")[0] : new Date().toISOString().split("T")[0],
            time: item.dateTime?.includes("T") ? item.dateTime.split("T")[1]?.substring(0, 5) : "20:00",
            timeSlot: item.dateTime?.includes("T") ? item.dateTime.split("T")[1]?.substring(0, 5) : "20:00",
            serviceName: "Table Reservation",
            status: "pending",
            qrToken: item.qrToken || item.bookingCode?.replace("#", "") || Math.random().toString(36).substr(2, 10).toUpperCase(),
            createdAt: new Date().toISOString()
          };
          localBookings.push(newBooking);
          userBookings.push(newBooking);
          window.localStorage.setItem("armbiz-local-bookings", JSON.stringify(localBookings));
          window.localStorage.setItem("armbiz_user_bookings", JSON.stringify(userBookings));
          window.dispatchEvent(new Event("bookingsUpdated"));
        } catch (e) {
          console.error("Error saving chat booking locally:", e);
        }
      }
    } catch {
      dispatch(addMessage({
        id: `msg-err-${Date.now()}`, role: "assistant",
        content: t.chat?.error || "Sorry, something went wrong.", timestamp: Date.now(),
      }));
    }
    dispatch(setLoading(false));
  };

  return (
    <button
      onClick={handleClick}
      className="group relative overflow-hidden rounded-full border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-800/95 px-4 py-2 text-[13px] font-semibold text-slate-700 dark:text-slate-200 transition-all duration-200 hover:border-green-500/40 hover:bg-green-50 dark:hover:bg-green-500/10 hover:text-green-700 dark:hover:text-green-300 hover:shadow-sm active:scale-[0.98] cursor-pointer"
    >
      <span className="relative z-10 flex items-center gap-1.5">{text}</span>
    </button>
  );
});

export default function ChatWidget() {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { isOpen, isWidgetVisible, messages, isLoading, sessionId } = useSelector((s: RootState) => s.chat);
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { t, locale } = useI18n();
  const { currentUser } = useAuth();
  const isBusinessUser = currentUser?.accountType === "business" || currentUser?.role === "business" || currentUser?.role === "owner";

  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragInitClient = useRef({ x: 0, y: 0 });
  const isPointerDown = useRef(false);
  const dragPreventClick = useRef(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)';
    }
  }, []);

  // Lock background page scroll when ChatWidget is open
  useEffect(() => {
    if (isOpen) {
      const prevBodyOverflow = document.body.style.overflow;
      const prevHtmlOverflow = document.documentElement.style.overflow;
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = prevBodyOverflow;
        document.documentElement.style.overflow = prevHtmlOverflow;
        document.body.style.paddingRight = "";
      };
    }
  }, [isOpen]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    isPointerDown.current = true;
    dragStartPos.current = { x: position.x, y: position.y };
    dragInitClient.current = { x: e.clientX, y: e.clientY };
    dragPreventClick.current = false;

    if (containerRef.current) {
      containerRef.current.style.transition = 'none';
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDown.current) return;
    const dx = e.clientX - dragInitClient.current.x;
    const dy = e.clientY - dragInitClient.current.y;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      dragPreventClick.current = true;
    }

    let newX = dragStartPos.current.x + dx;
    let newY = dragStartPos.current.y + dy;

    // Prevent dragging outside the screen or above the header/stories/hero
    if (typeof window !== "undefined") {
      const btnSize = 56;
      const marginX = window.innerWidth >= 640 ? 24 : 16;
      const marginY = 16;

      let topBoundary = 80;
      const storiesEl = document.querySelector('.stories-section-container');
      const headerEl = document.querySelector('header');
      const heroEl = document.querySelector('.hero-section');
      const categoryBarEl = document.querySelector('[class*="categoryBarInner"]');

      if (heroEl) topBoundary = Math.max(topBoundary, heroEl.getBoundingClientRect().bottom);
      if (storiesEl) topBoundary = Math.max(topBoundary, storiesEl.getBoundingClientRect().bottom);
      if (headerEl) topBoundary = Math.max(topBoundary, headerEl.getBoundingClientRect().bottom);
      if (categoryBarEl) topBoundary = Math.max(topBoundary, categoryBarEl.getBoundingClientRect().bottom);

      const maxMoveLeft = -(window.innerWidth - btnSize - marginX * 2);
      const maxMoveRight = 0; // Cannot move further right than initial position
      const maxMoveUp = -(window.innerHeight - btnSize - marginY - topBoundary);
      const maxMoveDown = 0;

      newX = Math.max(maxMoveLeft, Math.min(newX, maxMoveRight));
      newY = Math.max(maxMoveUp, Math.min(newY, maxMoveDown));
    }

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isPointerDown.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    if (containerRef.current) {
      containerRef.current.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)';
    }

    if (dragPreventClick.current && typeof window !== "undefined") {
      const btnSize = 56;
      const marginX = window.innerWidth >= 640 ? 24 : 16;
      const marginY = 16;

      let topBoundary = 80;
      const storiesEl = document.querySelector('.stories-section-container');
      const headerEl = document.querySelector('header');
      const heroEl = document.querySelector('.hero-section');
      const categoryBarEl = document.querySelector('[class*="categoryBarInner"]');

      if (heroEl) topBoundary = Math.max(topBoundary, heroEl.getBoundingClientRect().bottom);
      if (storiesEl) topBoundary = Math.max(topBoundary, storiesEl.getBoundingClientRect().bottom);
      if (headerEl) topBoundary = Math.max(topBoundary, headerEl.getBoundingClientRect().bottom);
      if (categoryBarEl) topBoundary = Math.max(topBoundary, categoryBarEl.getBoundingClientRect().bottom);

      const maxMoveLeft = -(window.innerWidth - btnSize - marginX * 2);
      const maxMoveRight = 0;
      const maxMoveUp = -(window.innerHeight - btnSize - marginY - topBoundary);
      const maxMoveDown = 0;

      const dx = e.clientX - dragInitClient.current.x;
      const dy = e.clientY - dragInitClient.current.y;

      let snapX = position.x;
      let snapY = position.y;
      const swipeThreshold = 40; // Push threshold

      const movedX = Math.abs(dx) > swipeThreshold;
      const movedY = Math.abs(dy) > swipeThreshold;

      // Always snap X to the left or right edge
      if (movedX) {
        snapX = dx < 0 ? maxMoveLeft : maxMoveRight;
      } else {
        const midX = maxMoveLeft / 2;
        snapX = position.x < midX ? maxMoveLeft : maxMoveRight;
      }

      // If Y was actively moved, snap it to Top or Bottom edge
      if (movedY) {
        snapY = dy < 0 ? maxMoveUp : maxMoveDown;
      } else {
        // Keep it where dropped vertically if not swiped, but strictly bounded
        snapY = Math.max(maxMoveUp, Math.min(position.y, maxMoveDown));
      }

      setPosition({ x: snapX, y: snapY });
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (dragPreventClick.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    dispatch(toggleChat());
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  // Show welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const userLang = locale || 'en';
      let welcomeStr = "Hello! 👋 I am Treeo AI. How can I help you today?";
      let btnStr = "🍽️ Restaurants";

      if (userLang.startsWith('hy')) {
        welcomeStr = "Ողջու՜յն 👋 ես Treeo AI-ն եմ: Ինչպե՞ս կարող եմ օգնել ձեզ այսօր:";
        btnStr = "🍽️ Ռեստորաններ";
      } else if (userLang.startsWith('ru')) {
        welcomeStr = "Привет! 👋 Я Treeo AI. Чем могу помочь сегодня?";
        btnStr = "🍽️ Рестораны";
      }

      dispatch(addMessage({
        id: "welcome",
        role: "assistant",
        content: welcomeStr,
        timestamp: Date.now(),
        quickReplies: [btnStr],
      }));
    }
  }, [isOpen, messages.length, dispatch, locale]);

  if (pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin")) {
    return null;
  }

  const sendMessage = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;
    const text = input.trim();
    const imageToSend = selectedImage;
    setInput("");
    setSelectedImage(null);

    const isBookingAction = text.toLowerCase().startsWith("book id:") || 
      text.toLowerCase().includes("confirm_booking") || 
      text.toLowerCase().includes("հաստատել ամրագրումը");

    if (isBusinessUser && isBookingAction) {
      dispatch(addMessage({
        id: `msg-warn-${Date.now()}`,
        role: "assistant",
        content: "⚠️ **Ուշադրություն.** Բիզնես (Business) հաշիվներով ամրագրում կատարել հնարավոր չէ:\n\nԱմրագրումներ կատարելու համար խնդրում ենք մուտք գործել կամ օգտագործել **անձնական (Personal)** հաշիվ:",
        timestamp: Date.now()
      }));
      return;
    }

    if (!currentUser && isBookingAction) {
      dispatch(addMessage({
        id: `msg-auth-prompt-${Date.now()}`,
        role: "assistant",
        content: "🔒 **Ամրագրում կատարելու համար խնդրում ենք գրանցվել կամ մուտք գործել անձնական հաշիվ։**\n\n✨ **Ինչո՞ւ է գրանցումը շահեկան Ձեզ համար.**\n\n🎁 **1. Բոնուսներ և CashBack** — Յուրաքանչյուր ամրագրման դիմաց կուտակեք միավորներ և ստացեք բացառիկ զեղչեր ու նվերներ:\n\n🎫 **2. Անհատականեցված QR Կոդ** — Գրանցվելուց հետո Ձեր բոլոր ամրագրումները կունենան տվյալ բիզնեսին պատկանող անհատական QR կոդ, որը կպահպանվի Ձեր պրոֆիլում և կապահովի երաշխավորված սպասարկում:\n\n⚡ **3. Ակնթարթային ամրագրումներ** — Կարիք չի լինի ամեն անգամ լրացնել Ձեր կոնտակտային տվյալները:\n\n📱 **4. Պատմության և կարգավիճակի վերահսկում** — Դիտեք Ձեր ամրագրումների ընթացքն ու կարգավիճակը Ձեր անձնական էջում ցանկացած պահի:\n\n*Խնդրում ենք գրանցվել կամ մուտք գործել՝ ամրագրումը շարունակելու համար:*",
        intent: "show_auth_prompt",
        timestamp: Date.now()
      }));
      return;
    }

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: text || "📸 Նկար",
      timestamp: Date.now(),
      imageUrl: imageToSend || undefined,
    };
    dispatch(addMessage(userMsg));
    dispatch(setLoading(true));

    try {
      const res = await axios.post("/api/ai/chat", {
        message: text,
        imageUrl: imageToSend,
        sessionId,
        lang: locale,
        userId: (currentUser as any)?._id || (currentUser as any)?.id,
        userName: (currentUser as any)?.name || (currentUser as any)?.fullName || (currentUser as any)?.username,
        userPhone: (currentUser as any)?.phone,
        userRole: (currentUser as any)?.role || (currentUser as any)?.accountType,
        isBusinessUser,
        isGuest: !currentUser
      });
      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: res.data.response,
        timestamp: Date.now(),
        suggestions: res.data.suggestions,
        quickReplies: res.data.quickReplies,
        intent: res.data.intent,
      };
      dispatch(addMessage(aiMsg));
      if (res.data.sessionId) dispatch(setSessionId(res.data.sessionId));

      if (res.data.intent === "booking_success" && res.data.suggestions && res.data.suggestions.length > 0) {
        try {
          const item = res.data.suggestions[0];
          const localBookings = JSON.parse(window.localStorage.getItem("armbiz-local-bookings") || "[]");
          const userBookings = JSON.parse(window.localStorage.getItem("armbiz_user_bookings") || "[]");
          const newBooking = {
            id: item.id || `booking-${Date.now()}`,
            businessId: item.businessId || item.id,
            businessName: item.name || "Business",
            customerName: (currentUser as any)?.name || (currentUser as any)?.fullName || (currentUser as any)?.username || "Treeo User",
            customerPhone: (currentUser as any)?.phone || "",
            date: item.dateTime ? item.dateTime.split("T")[0] : new Date().toISOString().split("T")[0],
            time: item.dateTime?.includes("T") ? item.dateTime.split("T")[1]?.substring(0, 5) : "20:00",
            timeSlot: item.dateTime?.includes("T") ? item.dateTime.split("T")[1]?.substring(0, 5) : "20:00",
            serviceName: "Table Reservation",
            status: "pending",
            qrToken: item.qrToken || item.bookingCode?.replace("#", "") || Math.random().toString(36).substr(2, 10).toUpperCase(),
            createdAt: new Date().toISOString()
          };
          localBookings.push(newBooking);
          userBookings.push(newBooking);
          window.localStorage.setItem("armbiz-local-bookings", JSON.stringify(localBookings));
          window.localStorage.setItem("armbiz_user_bookings", JSON.stringify(userBookings));
          window.dispatchEvent(new Event("bookingsUpdated"));
        } catch (e) {
          console.error("Error saving chat booking locally:", e);
        }
      }
    } catch {
      dispatch(addMessage({
        id: `msg-err-${Date.now()}`, role: "assistant",
        content: t.chat?.error || "Sorry, I couldn't process your request. Please try again.", timestamp: Date.now(),
      }));
    }
    dispatch(setLoading(false));
  };

  if (pathname.startsWith("/admin-secure")) {
    return null;
  }

  if (!isWidgetVisible) {
    return null;
  }

  return (
    <>
      {/* Backdrop Overlay (Dims background, locks scroll, and blocks clicks) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 dark:bg-black/60 backdrop-blur-[2px] transition-opacity duration-300 animate-fade-in touch-none overscroll-none"
          onClick={() => dispatch(toggleChat())}
          onTouchMove={(e) => e.preventDefault()}
        />
      )}

      {/* Ultra-Premium Glassmorphic Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-0 sm:bottom-8 right-0 sm:right-8 z-50 w-full sm:w-[460px] md:w-[480px] max-w-full animate-scale-in chat-widget-container origin-bottom-right">

          <div className="relative flex flex-col h-[100dvh] sm:h-[750px] max-h-screen sm:max-h-[85vh] sm:rounded-[2.5rem] bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-[40px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] overflow-hidden border-0 sm:border border-white/50 dark:border-white/10 ring-1 ring-black/5 dark:ring-white/5">

            {/* Dynamic Ambient Aura - Apple Intelligence Style */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
              <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[60%] bg-emerald-400/30 blur-[90px] rounded-full mix-blend-multiply dark:mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }}></div>
              <div className="absolute bottom-[-10%] right-[-20%] w-[60%] h-[60%] bg-cyan-400/30 blur-[90px] rounded-full mix-blend-multiply dark:mix-blend-screen animate-pulse" style={{ animationDuration: '7s' }}></div>
              <div className="absolute top-[30%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/20 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen animate-pulse" style={{ animationDuration: '5s' }}></div>
            </div>

            <div className="relative z-10 flex flex-col h-full w-full">
              {/* Header */}
              <div className="relative px-7 py-6 border-b border-white/30 dark:border-white/5">
                <div className="relative flex items-center justify-between z-10">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-emerald-400 to-cyan-600 shadow-xl shadow-emerald-500/30 text-white relative group border border-white/20">
                      <Sparkles className="h-6 w-6 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300" />
                      <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-400 border-[2.5px] border-white dark:border-slate-900"></span>
                      </span>
                    </div>
                    <div>
                      <h3 className="text-[19px] font-extrabold tracking-tight text-slate-900 dark:text-white drop-shadow-sm leading-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300">{t.chat?.title || "Treeo AI"}</h3>
                      <p className="text-[12px] font-bold text-emerald-600 dark:text-emerald-400 tracking-[0.15em] uppercase mt-1 opacity-90">{t.chat?.subtitle || "Premium Assistant"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => dispatch(clearChat())}
                      className="h-10 w-10 flex items-center justify-center rounded-full bg-white/40 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/40 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-300 border border-white/50 dark:border-white/5 backdrop-blur-md shadow-sm"
                      title="Վերագործարկել չաթը"
                      aria-label="Reset chat"
                    >
                      <RotateCcw className="h-4.5 w-4.5" />
                    </button>
                    <button
                      onClick={() => dispatch(toggleChat())}
                      className="h-10 w-10 flex items-center justify-center rounded-full bg-white/40 dark:bg-black/20 hover:bg-red-500/10 dark:hover:bg-red-500/20 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:rotate-90 transition-all duration-300 border border-white/50 dark:border-white/5 backdrop-blur-md shadow-sm"
                      aria-label="Close widget"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 pt-6 pb-28 space-y-6 custom-scrollbar">
                {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
                {isLoading && (
                  <div className="flex justify-start animate-fade-in">
                    <div className="max-w-[85%] space-y-2">
                      <div className="flex items-center gap-2 mb-1 pl-1">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 shadow-md shadow-emerald-500/20">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-[12px] font-bold tracking-wide text-slate-500 dark:text-slate-400">
                          {locale?.startsWith('hy') ? "Որոնում է տվյալների բազայում..." : locale?.startsWith('ru') ? "Поиск в базе данных..." : "Searching knowledge base..."}
                        </span>
                      </div>
                      <div className="bg-white/70 dark:bg-white/5 backdrop-blur-2xl rounded-[24px] rounded-tl-[6px] border border-white/60 dark:border-white/10 px-6 py-4 shadow-xl shadow-black/5 flex items-center gap-2.5 w-fit">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Seamless Fade Gradient over bottom of message scroll */}
              <div
                className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none z-10 rounded-b-[2.5rem] bg-gradient-to-t from-white via-white/80 to-transparent dark:from-[#0c1017] dark:via-[#0c1017]/80 dark:to-transparent"
              />

              {/* Floating Pill Input Container */}
              <div className="absolute bottom-5 sm:bottom-6 left-5 sm:left-6 right-5 sm:right-6 z-20 pointer-events-auto">
                {selectedImage && (
                  <div className="mb-3 pl-2">
                    <div className="relative inline-block">
                      <img src={selectedImage} alt="Preview" className="h-20 w-20 object-cover rounded-xl border-2 border-emerald-500/50 shadow-lg" />
                      <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1 shadow hover:bg-slate-700 transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}
                <form 
                  onSubmit={(e) => { e.preventDefault(); sendMessage(); }} 
                  className="flex items-center gap-2 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-white/10 rounded-full pl-4 pr-2 py-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-all duration-200 focus-within:ring-2 focus-within:ring-emerald-500/50 group transform-gpu"
                >

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setSelectedImage(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-slate-400 hover:text-emerald-500 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    title="Կցել նկար"
                  >
                    <ImagePlus className="h-5 w-5" />
                  </button>

                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={t.chat?.placeholder || "Ask about businesses..."}
                    className="flex-1 bg-transparent text-[15.5px] font-medium text-slate-900 focus:outline-none dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={(!input.trim() && !selectedImage) || isLoading}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white transition-all duration-300 disabled:opacity-40 disabled:from-slate-300 disabled:to-slate-300 dark:disabled:from-slate-700 dark:disabled:to-slate-700 hover:shadow-lg hover:shadow-cyan-500/40 hover:-translate-y-0.5 shrink-0 group-focus-within:rotate-12 cursor-pointer"
                  >
                    <Send className="h-5 w-5 ml-0.5" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAB Button */}
      <div
        ref={containerRef}
        className={`fixed bottom-4 right-4 sm:right-6 z-50 chat-widget-container ${isOpen ? "pointer-events-none" : ""} ${position.x >= -10 && position.y >= -10 ? "at-bottom-right" : ""
          }`}
        style={{
          transform: `translate(${position.x}px, calc(${position.y}px - var(--chat-offset-y, 0px)))`,
          touchAction: 'none'
        }}
      >
        <button
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onClick={handleClick}
          className={`flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 backdrop-blur-md border border-green-500/30 text-green-600 shadow-lg shadow-green-500/10 transition-all duration-300 hover:bg-green-500/20 ${isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100 hover:scale-110 cursor-grab active:cursor-grabbing"
            }`}
          aria-label="Open AI chat"
        >
          <Search className="h-7 w-7 pointer-events-none" strokeWidth={2} />
          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20 pointer-events-none" />
        </button>
      </div>
    </>
  );
}
