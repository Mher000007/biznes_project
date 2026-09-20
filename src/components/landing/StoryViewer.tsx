"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Pause, Play, BadgeCheck, Heart, Eye, MousePointerClick } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { getApiUrl } from "@/lib/utils";
import { useI18n } from "@/i18n";

const API = getApiUrl();

interface StoryItem {
  _id: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  caption?: string;
  createdAt: string;
  views?: any[];
  stats?: {
    clicks: number;
    saves: number;
    reactions: number;
  };
}

interface BusinessGroup {
  business: {
    _id: string;
    name: string;
    slug: string;
    logo?: string;
    verified?: boolean;
  };
  stories: StoryItem[];
}

interface StoryViewerProps {
  groups: BusinessGroup[];
  initialGroupIndex: number;
  onClose: () => void;
  onStoriesViewedUpdate: () => void;
  isOwner?: boolean;
}

export default function StoryViewer({
  groups,
  initialGroupIndex,
  onClose,
  onStoriesViewedUpdate,
  isOwner,
}: StoryViewerProps) {
  const { t } = useI18n();
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [likedStories, setLikedStories] = useState<string[]>([]);

  useEffect(() => {
    try {
      const liked = JSON.parse(localStorage.getItem("armbiz-liked-stories") || "[]");
      setLikedStories(liked);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const touchStartTime = useRef<number>(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const activeGroup = groups[groupIndex];
  const activeStory = activeGroup?.stories[storyIndex];

  // Auto-set first unviewed story index on group change
  useEffect(() => {
    if (activeGroup) {
      const viewedIds = JSON.parse(localStorage.getItem("armbiz-viewed-stories") || "[]");
      const unviewedIdx = activeGroup.stories.findIndex(s => !viewedIds.includes(s._id));
      setStoryIndex(unviewedIdx !== -1 ? unviewedIdx : 0);
      setProgress(0);
    }
  }, [groupIndex, activeGroup]);

  // Report view to API and save to viewed stories list
  const recordView = useCallback(async (storyId: string) => {
    try {
      const viewedIds = JSON.parse(localStorage.getItem("armbiz-viewed-stories") || "[]");
      if (!viewedIds.includes(storyId)) {
        viewedIds.push(storyId);
        localStorage.setItem("armbiz-viewed-stories", JSON.stringify(viewedIds));
        onStoriesViewedUpdate();
      }

      const viewerId = localStorage.getItem("armbiz-viewer-session") || Math.random().toString(36).substring(2);
      if (!localStorage.getItem("armbiz-viewer-session")) {
        localStorage.setItem("armbiz-viewer-session", viewerId);
      }

      await axios.post(`${API}/stories/${storyId}/view`, { viewerId });
    } catch (err) {
      console.error("Error reporting story view:", err);
    }
  }, [onStoriesViewedUpdate]);

  // Handle navigation
  const handlePrev = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex((prev) => prev - 1);
      setProgress(0);
    } else if (groupIndex > 0) {
      setGroupIndex((prev) => prev - 1);
    } else {
      // Reached start, repeat current story
      setProgress(0);
    }
  }, [storyIndex, groupIndex]);

  const handleNext = useCallback(() => {
    if (activeGroup && storyIndex < activeGroup.stories.length - 1) {
      setStoryIndex((prev) => prev + 1);
      setProgress(0);
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex((prev) => prev + 1);
    } else {
      // Reached end of all stories
      onClose();
    }
  }, [storyIndex, groupIndex, activeGroup, groups.length, onClose]);

  const handleLike = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeStory) return;

    const storyId = activeStory._id;
    if (likedStories.includes(storyId)) return;

    const newLiked = [...likedStories, storyId];
    setLikedStories(newLiked);
    localStorage.setItem("armbiz-liked-stories", JSON.stringify(newLiked));

    axios.post(`${API}/stories/${storyId}/stat`, { statType: 'reactions' }).catch(console.error);
  }, [activeStory, likedStories]);

  const isLiked = activeStory ? likedStories.includes(activeStory._id) : false;

  // Prevent body scroll when mounted
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.classList.add("story-viewer-open");
    return () => {
      document.body.style.overflow = "";
      document.body.classList.remove("story-viewer-open");
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handlePrev, handleNext, onClose]);

  useEffect(() => {
    if (activeStory) {
      recordView(activeStory._id);
      setProgress(0);
      if (activeStory.mediaType === "video") {
        setIsPaused(true);
      } else {
        setIsPaused(false);
      }
    }
  }, [storyIndex, groupIndex, activeStory, recordView]);

  // Handle progress bar animation tick
  useEffect(() => {
    if (isPaused || !activeStory) return;

    const duration = activeStory.mediaType === "video" ? 10000 : 5000; // 10s for video, 5s for image
    const intervalTime = 50; // tick every 50ms
    const step = (intervalTime / duration) * 100;

    progressInterval.current = setInterval(() => {
      setProgress((prev) => prev + step);
    }, intervalTime);

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [storyIndex, groupIndex, isPaused, activeStory]);

  // Handle progress completion in a safe context
  useEffect(() => {
    if (progress >= 100) {
      setProgress(0);
      handleNext();
    }
  }, [progress, handleNext]);

  // Click & hold helpers
  const handleMouseDown = () => {
    setIsPaused(true);
    touchStartTime.current = Date.now();
    if (videoRef.current) videoRef.current.pause();
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsPaused(false);
    if (videoRef.current) videoRef.current.play().catch(() => { });

    const holdDuration = Date.now() - touchStartTime.current;
    if (holdDuration < 250) {
      // It was a tap, not a long press hold
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const width = rect.width;

      if (x < width * 0.3) {
        handlePrev();
      } else {
        handleNext();
      }
    }
  };

  const handleTouchStart = () => {
    setIsPaused(true);
    touchStartTime.current = Date.now();
    if (videoRef.current) videoRef.current.pause();
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsPaused(false);
    if (videoRef.current) videoRef.current.play().catch(() => { });

    const holdDuration = Date.now() - touchStartTime.current;
    if (holdDuration < 250) {
      const rect = e.currentTarget.getBoundingClientRect();
      const touch = e.changedTouches[0];
      const x = touch.clientX - rect.left;
      const width = rect.width;

      if (x < width * 0.3) {
        handlePrev();
      } else {
        handleNext();
      }
    }
  };

  if (!activeGroup || !activeStory) return null;

  // Render readable publish time (e.g. 2h ago)
  const formatTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return diffMins <= 1 ? t.stories.justNow : `${diffMins}${t.stories.minutesAgo}`;
    }
    return `${diffHours}${t.stories.hoursAgo}`;
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md transition-opacity duration-300"
    >

      {/* Desktop navigation side buttons */}
      <button
        onClick={(e) => { e.stopPropagation(); handlePrev(); }}
        className="hidden md:flex absolute left-8 lg:left-24 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer shrink-0"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      {/* Main story player card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[480px] h-[100dvh] sm:h-[80vh] sm:max-h-[850px] sm:rounded-2xl overflow-hidden bg-neutral-950 flex flex-col justify-between shadow-2xl select-none animate-slide-up"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Progress Bars Segmented */}
        <div className="absolute top-[max(0.75rem,env(safe-area-inset-top))] inset-x-0 px-3 flex gap-1 z-50">
          {activeGroup.stories.map((s, idx) => {
            let barVal = 0;
            if (idx < storyIndex) barVal = 100;
            if (idx === storyIndex) barVal = progress;

            return (
              <div key={s._id} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all ease-linear"
                  style={{
                    width: `${barVal}%`,
                    transitionDuration: idx === storyIndex ? "100ms" : "0ms"
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Top business header metadata overlay */}
        <div
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          className="absolute top-[max(1.5rem,calc(env(safe-area-inset-top)+0.75rem))] inset-x-0 px-4 flex items-center justify-between z-50 bg-gradient-to-b from-black/60 to-transparent pt-2 pb-6"
        >
          <div className="flex items-center gap-2.5">
            {activeGroup.business.logo ? (
              <img
                src={activeGroup.business.logo}
                className="w-9 h-9 rounded-full object-cover border border-white/20 shadow"
                alt=""
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center text-white text-sm font-bold border border-white/20 shadow">
                {activeGroup.business.name[0]}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-white text-sm tracking-wide drop-shadow">{activeGroup.business.name}</span>
                {activeGroup.business.verified && (
                  <BadgeCheck className="w-4 h-4 text-sky-400 shrink-0 shadow-sm" />
                )}
              </div>
              <span className="text-white/60 text-[10px] font-medium drop-shadow">{formatTimeAgo(activeStory.createdAt)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isPaused && (
              <Pause className="w-4 h-4 text-white/70 animate-pulse" />
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="p-1.5 bg-black/30 hover:bg-black/50 text-white/80 hover:text-white rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Media Content Body (Image or Video) */}
        <div className="flex-1 w-full h-full flex items-center justify-center bg-black relative overflow-hidden">
          {activeStory.mediaType === "video" ? (
            <video
              ref={videoRef}
              src={activeStory.mediaUrl}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover pointer-events-none relative z-10"
              onPlay={() => setIsPaused(false)}
              onPlaying={() => setIsPaused(false)}
              onWaiting={() => setIsPaused(true)}
            />
          ) : (
            <>
              {/* Blurred background for non-9:16 images */}
              <img
                src={activeStory.mediaUrl}
                className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-40 scale-110 pointer-events-none"
                alt=""
              />
              {/* Main image */}
              <img
                src={activeStory.mediaUrl}
                className="relative w-full h-full object-contain pointer-events-none z-10"
                alt=""
              />
            </>
          )}
        </div>

        {/* Story Caption and Action CTA Button overlay */}
        <div
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          className="absolute bottom-0 inset-x-0 p-5 pt-20 pb-[max(1.25rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-black/90 via-black/50 to-transparent z-50 flex flex-col items-center gap-3.5 text-center"
        >
          {activeStory.caption && (
            <p className="text-white text-xs sm:text-sm font-medium tracking-wide drop-shadow leading-relaxed max-w-[90%]">
              {activeStory.caption}
            </p>
          )}
          {isOwner ? (
            <div className="flex items-center justify-center gap-3 text-sm text-white font-semibold mt-2 w-full">
              <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/20 shadow-md" title="Views">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>{activeStory.views?.length || 0}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/20 shadow-md" title="Clicks">
                <MousePointerClick className="w-4 h-4 text-blue-400" />
                <span>{activeStory.stats?.clicks || 0}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/20 shadow-md" title="Reactions">
                <Heart className="w-4 h-4 text-red-400" />
                <span>{activeStory.stats?.reactions || 0}</span>
              </div>
            </div>
          ) : (
            <div className="relative flex items-center w-full mt-2">
              <div className="flex-1 flex justify-start">
                {/* Empty spacer for perfect symmetry */}
              </div>
              
              <Link
                href={`/business/${activeGroup.business.slug}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeStory && activeStory._id) {
                    axios.post(`${getApiUrl()}/stories/${activeStory._id}/stat`, { statType: 'clicks' }).catch(console.error);
                  }
                  onClose();
                }}
                className="inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-full text-sm font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all active:scale-95 shadow-md group/cta shrink-0"
              >
                <span>{t.stories.visitProfile}</span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover/cta:translate-x-1" />
              </Link>
              
              <div className="flex-1 flex justify-end">
                <button
                  onClick={handleLike}
                  className={`p-3 rounded-full border backdrop-blur-md transition-all active:scale-95 shadow-md shrink-0 flex items-center justify-center ${
                    isLiked 
                      ? 'bg-red-500/20 border-red-500/50' 
                      : 'bg-white/10 hover:bg-white/20 border-white/20'
                  }`}
                >
                  <Heart 
                    className={`w-5 h-5 transition-colors ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} 
                  />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Desktop navigation right side button */}
      <button
        onClick={(e) => { e.stopPropagation(); handleNext(); }}
        className="hidden md:flex absolute right-8 lg:right-24 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer shrink-0"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

    </div>
  );
}
