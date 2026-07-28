"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import axios from "axios";
import { getApiUrl } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import StoryViewer from "./StoryViewer";
import { Sparkles, ChevronUp, ChevronDown } from "lucide-react";

const API = getApiUrl();

interface StoryItem {
  _id: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  caption?: string;
  createdAt: string;
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

export default function StoriesSection() {
  const { currentUser } = useAuth();
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(true);
  const [groups, setGroups] = useState<BusinessGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGroupIdx, setActiveGroupIdx] = useState<number | null>(null);
  const [viewedStoriesTrigger, setViewedStoriesTrigger] = useState(0);

  const loadStories = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/stories`);
      if (res.data?.success) {
        setGroups(res.data.data);
      }
    } catch (err: any) {
      console.log("Failed to load active stories:", err?.message || "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  // Check if a business group has all stories viewed
  const isGroupViewed = useCallback((group: BusinessGroup) => {
    if (typeof window === "undefined") return true;
    const viewedIds = JSON.parse(localStorage.getItem("armbiz-viewed-stories") || "[]");
    return group.stories.every((story) => viewedIds.includes(story._id));
  }, [viewedStoriesTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpdateViewed = () => {
    setViewedStoriesTrigger((prev) => prev + 1);
  };

  // If loading, show skeletons
  if (loading) {
    return (
      <div className="w-full bg-[hsl(var(--background))] border-b border-[hsl(var(--border))]/30 py-2.5 select-none overflow-x-hidden relative z-10 rounded-b-2xl shadow-[0_8px_16px_-6px_rgba(0,0,0,0.05)] stories-section-container">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 stories-content-wrapper">
          <div className="flex gap-5 overflow-x-auto scrollbar-none py-1.5">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 shrink-0 animate-pulse">
                <div className="w-[68px] h-[68px] rounded-full bg-[hsl(var(--muted))]/70" />
                <div className="w-12 h-2.5 rounded bg-[hsl(var(--muted))]/70" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isBusinessUser = currentUser && (currentUser.accountType === "business" || currentUser.role === "business_owner" || (currentUser as any)?.isBusiness);

  // If no stories are published and current user is not a business user, hide the entire section
  if (groups.length === 0 && !isBusinessUser) {
    return null;
  }

  return (
    <div className={`w-full bg-[hsl(var(--background))] border-b border-[hsl(var(--border))]/30 py-2.5 select-none relative z-10 rounded-b-2xl shadow-[0_8px_16px_-6px_rgba(0,0,0,0.05)] stories-section-container ${!isOpen ? "is-collapsed" : ""}`}>
      <div className="mx-auto max-w-6xl px-5 sm:px-8 stories-content-wrapper">
        <div className="flex items-center gap-5 overflow-x-auto scrollbar-none py-1.5 -mx-2 px-2">

          {/* "Add Story" circle only for business users */}
          {isBusinessUser && (
            <Link
              href="/dashboard/stories"
              className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0 group"
            >
              <div className="relative w-[68px] h-[68px] rounded-full p-[2px] bg-[hsl(var(--border))] group-hover:bg-[hsl(var(--primary))]/30 transition-colors flex items-center justify-center bg-[hsl(var(--background))]">
                <div className="w-full h-full rounded-full bg-[hsl(var(--card))] border border-[hsl(var(--border))] flex items-center justify-center transition-all group-hover:scale-95">
                  <span className="text-2xl font-bold text-[hsl(var(--primary))]" style={{ marginTop: "-2px" }}>+</span>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))] tracking-tight truncate max-w-[72px] transition-colors">
                {t.stories.addStory}
              </span>
            </Link>
          )}

          {/* Active Business Stories */}
          {groups.map((group, idx) => {
            const viewed = isGroupViewed(group);
            const borderClass = viewed
              ? "border-2 border-[hsl(var(--border))]/80 p-[2px]"
              : "p-[2px] bg-gradient-to-tr from-pink-500 via-purple-500 to-yellow-500";

            return (
              <button
                key={group.business._id}
                onClick={() => setActiveGroupIdx(idx)}
                className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0 focus:outline-none group"
              >
                {/* Outer ring */}
                <div className={`w-[68px] h-[68px] rounded-full flex items-center justify-center ${borderClass} transition-transform group-hover:scale-105`}>
                  <div className="w-full h-full rounded-full bg-[hsl(var(--background))] p-[2px]">
                    {group.business.logo ? (
                      <img
                        src={group.business.logo}
                        className="w-full h-full rounded-full object-cover border border-[hsl(var(--border))]/30"
                        alt=""
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-violet-600 flex items-center justify-center text-white text-base font-bold uppercase border border-[hsl(var(--border))]/30">
                        {group.business.name[0]}
                      </div>
                    )}
                  </div>
                </div>

                {/* Business name */}
                <span className={`text-[10px] font-semibold tracking-tight truncate max-w-[72px] transition-colors ${viewed ? "text-[hsl(var(--muted-foreground))]" : "text-[hsl(var(--foreground))] font-bold"
                  } group-hover:text-[hsl(var(--foreground))]`}>
                  {group.business.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Centered pull-tab toggle button - narrow rectangular with rounded bottom corners */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute top-full left-1/2 -translate-x-1/2 w-14 h-6 rounded-b-xl rounded-t-none bg-[hsl(var(--card))] border-b border-x border-t-0 border-[hsl(var(--border))] flex items-center justify-center text-[hsl(var(--foreground))] hover:border-emerald-500/60 hover:text-emerald-500 hover:bg-[hsl(var(--muted))] active:scale-95 transition-all duration-300 shadow-sm z-20 cursor-pointer hidden md:flex group"
        aria-label={isOpen ? "Collapse stories" : "Expand stories"}
        title={isOpen ? "Collapse Stories" : "Expand Stories"}
      >
        <ChevronUp className={`w-4 h-4 transition-transform duration-300 ${!isOpen ? "rotate-180 text-emerald-500" : "text-[hsl(var(--foreground))] group-hover:text-emerald-500"}`} />
      </button>

      {/* Story Lightbox Player Modal */}
      {activeGroupIdx !== null && (
        <StoryViewer
          groups={groups}
          initialGroupIndex={activeGroupIdx}
          onClose={() => setActiveGroupIdx(null)}
          onStoriesViewedUpdate={handleUpdateViewed}
        />
      )}
    </div>
  );
}
