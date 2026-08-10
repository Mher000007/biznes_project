"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import Link from "next/link";
import { Sparkles, Trash2, Eye, Calendar, Upload, Link as LinkIcon, AlertCircle, CheckCircle, Lock, Clock, ChevronDown, Check } from "lucide-react";

interface Story {
  _id: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  caption?: string;
  views: string[];
  createdAt: string;
  expiresAt: string;
}

interface BusinessInfo {
  _id: string;
  name: string;
  verified: boolean;
  active: boolean;
}

export default function DashboardStoriesPage() {
  const { currentUser } = useAuth();
  const { t } = useI18n();
  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [activeStories, setActiveStories] = useState<Story[]>([]);
  const [archivedStories, setArchivedStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form State
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [caption, setCaption] = useState("");
  const [activePlan, setActivePlan] = useState<string>("starter");
  const [duration, setDuration] = useState<number>(24);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Fetch user's business
      const bizRes = await api.get("/businesses/me/all");
      const biz = bizRes.data?.data?.[0]; // Get first business
      
      if (!biz) {
        setBusiness(null);
        setLoading(false);
        return;
      }

      setBusiness({
        _id: biz._id,
        name: biz.name,
        verified: biz.verified,
        active: biz.active,
      });

      // Fetch subscription plan
      try {
        if (typeof window !== "undefined") {
          const demoPlan = window.localStorage.getItem("demo_active_plan");
          if (demoPlan) {
            setActivePlan(demoPlan);
          } else {
            const subRes = await api.get(`/subscriptions/business/${biz._id}`);
            if (subRes.data?.data) {
              setActivePlan(subRes.data.data.plan);
            }
          }
        } else {
          const subRes = await api.get(`/subscriptions/business/${biz._id}`);
          if (subRes.data?.data) {
            setActivePlan(subRes.data.data.plan);
          }
        }
      } catch (err) {
        // ignore
      }

      // 2. Fetch business stories history
      const storiesRes = await api.get("/stories/my-business");
      if (storiesRes.data?.success) {
        const allStories: Story[] = storiesRes.data.data;
        const now = new Date();
        
        const active = allStories.filter(s => new Date(s.expiresAt) > now);
        // The user requested that active stories also appear in the archive
        const archive = allStories;
        
        setActiveStories(active);
        setArchivedStories(archive);
      }
    } catch (err: any) {
      console.error("Failed to load stories dashboard:", err);
      setError("Failed to fetch stories data. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Listen for plan updates
  useEffect(() => {
    const handlePlanUpdate = () => {
      const demoPlan = window.localStorage.getItem("demo_active_plan");
      if (demoPlan) setActivePlan(demoPlan);
    };
    handlePlanUpdate();
    window.addEventListener("plan_updated", handlePlanUpdate);
    return () => window.removeEventListener("plan_updated", handlePlanUpdate);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Convert uploaded file to Base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("File size should not exceed 2MB.");
      return;
    }

    const type = file.type.startsWith("video/") ? "video" : "image";
    setMediaType(type);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setMediaUrl(reader.result as string);
      setError("");
    };
    reader.onerror = () => {
      setError("Failed to read file.");
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUrl.trim()) {
      setError("Please upload a file or enter an image URL.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await api.post(
        "/stories",
        { mediaUrl, mediaType, caption, duration }
      );

      if (res.data?.success) {
        setSuccess(t.stories.successPublish);
        setMediaUrl("");
        setCaption("");
        setMediaType("image");
        if (fileInputRef.current) fileInputRef.current.value = "";
        loadData();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to publish story.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.stories.deleteConfirm)) return;
    
    try {
      await api.delete(`/stories/${id}`);
      setSuccess(t.stories.successDelete);
      loadData();
    } catch (err) {
      console.error("Failed to delete story:", err);
      setError("Failed to delete story.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 text-[hsl(var(--primary))] animate-spin">
          <svg fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
        </div>
        <span className="text-xs text-[hsl(var(--muted-foreground))]">{t.builder.publishing}</span>
      </div>
    );
  }

  // Verification checks
  if (!business) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center bg-[hsl(var(--card))] rounded-2xl shadow-sm border-0">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-lg font-bold mb-2">{t.stories.noBusinessProfile}</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6 leading-relaxed">
          {t.stories.noBusinessProfileDesc}
        </p>
      </div>
    );
  }

  if (!business.verified) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center bg-[hsl(var(--card))] rounded-2xl shadow-sm border-0">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-lg font-bold mb-2">{t.stories.verificationRequired}</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6 leading-relaxed">
          {t.stories.verificationRequiredDesc}
        </p>
      </div>
    );
  }

  const isStarterPlan = !activePlan || activePlan === "start" || activePlan === "starter" || activePlan === "free" || activePlan === "basic";

  if (isStarterPlan) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center bg-[hsl(var(--card))] rounded-3xl shadow-xl border border-[hsl(var(--border))] mt-10">
        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-500 shadow-inner">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold mb-2">Stories Feature Locked</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6 leading-relaxed">
          The Stories & Highlights feature is not available on the Start plan. Upgrade your plan to Pro or Premium to post stories.
        </p>
        <Link href="/dashboard/settings" className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm transition-all inline-block shadow-lg shadow-emerald-500/20 hover:scale-105">
          Upgrade Plan
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[hsl(var(--primary))]/10 flex items-center justify-center text-[hsl(var(--primary))]">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">{t.stories.manageStories}</h1>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">{t.stories.manageStoriesSubtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Publish Story Form Card */}
        <div className="lg:col-span-1 bg-[hsl(var(--card))] rounded-2xl p-5 shadow-sm space-y-4 h-fit border-0">
          <h2 className="text-sm font-bold tracking-wide">{t.stories.newStory}</h2>
          
          {error && (
            <div className="bg-red-500/10 text-red-500 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2 border-0">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 text-green-500 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2 border-0">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* File Upload Zone */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))]">{t.stories.mediaContent}</label>
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="group relative h-40 rounded-xl bg-[hsl(var(--muted))]/30 flex flex-col items-center justify-center border-0 cursor-pointer overflow-hidden transition-all hover:bg-[hsl(var(--muted))]/50"
              >
                {mediaUrl ? (
                  mediaType === "video" ? (
                    <video src={mediaUrl} className="w-full h-full object-cover" muted playsInline />
                  ) : (
                    <img src={mediaUrl} className="w-full h-full object-cover" alt="Preview" />
                  )
                ) : (
                  <div className="text-center p-4">
                    <Upload className="w-8 h-8 text-[hsl(var(--muted-foreground))]/60 mx-auto mb-2 transition-transform group-hover:-translate-y-0.5" />
                    <p className="text-xs font-semibold">{t.stories.choosePhoto}</p>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]/70 mt-1">{t.stories.fileSizeLimit}</p>
                  </div>
                )}

                {mediaUrl && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-medium">
                    {t.stories.changeMedia}
                  </div>
                )}
              </div>

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="image/*,video/*" 
                className="hidden" 
              />
            </div>

            {/* Duration Select (Custom details/summary list design) */}
            <div className="space-y-1.5 relative">
              <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))]">{t.stories.duration}</label>
              
              {(() => {
                const durationOptions = [
                  { value: 24, label: `${t.stories.durations?.hours24 || "24 Hours"} ${activePlan !== "premium" ? "(Pro)" : ""}` },
                  { value: 48, label: t.stories.durations?.hours48 || "48 Hours" },
                  { value: 72, label: t.stories.durations?.days3 || "3 Days" },
                  { value: 168, label: t.stories.durations?.week1 || "1 Week" },
                ].filter(opt => opt.value === 24 || activePlan === "premium");

                const currentOpt = durationOptions.find(o => o.value === duration) || durationOptions[0];

                return (
                  <details className="relative group w-full">
                    <summary className="list-none cursor-pointer flex items-center justify-between gap-2 px-3.5 py-2.5 bg-[hsl(var(--input))] hover:bg-[hsl(var(--muted))] rounded-xl text-xs font-medium text-[hsl(var(--foreground))] select-none border border-[hsl(var(--border))]/50 hover:border-[hsl(var(--border))] transition-all shadow-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
                        <span>{currentOpt?.label}</span>
                      </div>
                      <ChevronDown className="w-4 h-4 opacity-60 transition-transform group-open:rotate-180 duration-200" />
                    </summary>
                    
                    <div className="absolute left-0 right-0 top-full mt-1.5 p-1.5 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl z-50 shadow-xl backdrop-blur-lg flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-150">
                      {durationOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={(e) => {
                            setDuration(opt.value);
                            const details = e.currentTarget.closest('details');
                            if (details) details.removeAttribute('open');
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-all text-left font-medium ${
                            duration === opt.value
                              ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] font-semibold"
                              : "text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {opt.label}
                          </span>
                          {duration === opt.value && <Check className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />}
                        </button>
                      ))}
                    </div>
                  </details>
                );
              })()}

              {activePlan !== "premium" && (
                <p className="text-[9px] text-[hsl(var(--primary))] mt-1">Upgrade to Premium for custom durations.</p>
              )}
            </div>

            {/* Caption */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))]">{t.stories.caption}</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder={(t.stories as any).writeCaptionPlaceholder || "Write caption or special offer details..."}
                rows={2}
                maxLength={150}
                className="w-full text-xs rounded-xl bg-[hsl(var(--input))] p-3 outline-none focus:bg-[hsl(var(--card))] border-0 text-[hsl(var(--foreground))]"
              />
              <span className="text-[9px] text-[hsl(var(--muted-foreground))] text-right block pr-1">{caption.length}/150</span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl font-semibold text-xs text-white bg-[hsl(var(--primary))] hover:opacity-90 transition-all disabled:opacity-60 cursor-pointer border-0"
            >
              {submitting ? t.stories.publishing : t.stories.publish}
            </button>
          </form>
        </div>

        {/* Stories Listing Grid (Active and Archive) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Stories */}
          <div className="bg-[hsl(var(--card))] rounded-2xl p-5 shadow-sm space-y-4 border-0">
            <h2 className="text-sm font-bold tracking-wide">{t.stories.activeStories} <span className="text-xs font-normal text-[hsl(var(--muted-foreground))] ml-1">{t.stories.activeFor24}</span></h2>
            
            {activeStories.length === 0 ? (
              <div className="py-12 text-center text-xs text-[hsl(var(--muted-foreground))]/70">
                {t.stories.noActive}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeStories.map(story => (
                  <div key={story._id} className="relative rounded-xl overflow-hidden aspect-[9/10] bg-neutral-950 flex flex-col justify-between p-3 select-none group border-0">
                    <div className="absolute inset-0">
                      {story.mediaType === "video" ? (
                        <video src={story.mediaUrl} className="w-full h-full object-cover opacity-70" muted playsInline />
                      ) : (
                        <img src={story.mediaUrl} className="w-full h-full object-cover opacity-70" alt="" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/50" />
                    </div>

                    {/* Top Stats */}
                    <div className="relative flex justify-between items-center z-10">
                      <span className="text-[9px] text-white/80 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur font-medium">
                        {t.stories.expiresAt}: {new Date(story.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button 
                        onClick={() => handleDelete(story._id)}
                        className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer border-0"
                        title={t.stories.deleteConfirm}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Bottom Caption & Views */}
                    <div className="relative space-y-2 z-10 text-white">
                      {story.caption && (
                        <p className="text-xs font-medium leading-snug drop-shadow line-clamp-2">{story.caption}</p>
                      )}
                      <div className="flex items-center gap-1 text-[10px] text-white/70 font-semibold">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{story.views.length} {t.stories.viewsCount}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Historical/Expired Stories Archive */}
          <div className="bg-[hsl(var(--card))] rounded-2xl p-5 shadow-sm space-y-4 border-0">
            <h2 className="text-sm font-bold tracking-wide">{t.stories.archive} <span className="text-xs font-normal text-[hsl(var(--muted-foreground))] ml-1">{t.stories.expired}</span></h2>

            {archivedStories.length === 0 ? (
              <div className="py-8 text-center text-xs text-[hsl(var(--muted-foreground))]/70">
                {t.stories.historyEmpty}
              </div>
            ) : (
              <div className="divide-y divide-[hsl(var(--border))]/30">
                {archivedStories.map(story => (
                  <div key={story._id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-neutral-900 shrink-0 border-0">
                        {story.mediaType === "video" ? (
                          <video src={story.mediaUrl} className="w-full h-full object-cover" muted playsInline />
                        ) : (
                          <img src={story.mediaUrl} className="w-full h-full object-cover" alt="" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[hsl(var(--foreground))] truncate">
                          {story.caption || t.stories.newStory}
                        </p>
                        <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(story.createdAt).toLocaleDateString()}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))] font-semibold">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{story.views.length}</span>
                      </div>
                      <button
                        onClick={() => handleDelete(story._id)}
                        className="p-1.5 text-[hsl(var(--muted-foreground))] hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer border-0"
                        title={t.stories.deleteConfirm}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}

