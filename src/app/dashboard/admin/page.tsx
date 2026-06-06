"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { ShieldAlert, AlertOctagon, Star, CheckCircle, Trash2, HelpCircle, Loader2 } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";

interface ReportedReview {
  _id: string;
  comment: string;
  rating: number;
  authorName: string;
  author?: {
    name: string;
    email: string;
  };
  reportedReason: string;
  reportedAt: string;
  status: string;
  business: {
    _id: string;
    name: string;
    slug: string;
    email?: string;
  };
}

export default function AdminModerationPage() {
  const { currentUser } = useAuth();
  const [reports, setReports] = useState<ReportedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Moderation state
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [adminReply, setAdminReply] = useState("");
  const [actionType, setActionType] = useState<'keep' | 'delete' | null>(null);
  const [actionError, setActionError] = useState("");

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    let foundRealData = false;

    // 1. Try Backend API
    try {
      const apiURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
      
      const res = await axios.get(`${apiURL}/admin/reports`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (res.data?.success) {
        setReports(res.data.data);
        foundRealData = true;
      }
    } catch (err) {
      console.warn("Backend admin reports load failed, falling back to localStorage", err);
    }

    // 2. LocalStorage Fallback
    if (!foundRealData) {
      const aggregated: ReportedReview[] = [];
      try {
        const profilesRaw = window.localStorage.getItem("armbiz-business-profiles");
        const profiles = profilesRaw ? JSON.parse(profilesRaw) : [];
        
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && key.startsWith("armbiz-reviews-")) {
            const slug = key.replace("armbiz-reviews-", "");
            const reviewsRaw = window.localStorage.getItem(key);
            if (reviewsRaw) {
              const reviews = JSON.parse(reviewsRaw);
              reviews.forEach((r: any) => {
                if (r.status === 'reported') {
                  const profile = profiles.find((p: any) => {
                    const pSlug = p.businessName ? p.businessName.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]/g, "") : "";
                    return pSlug === slug;
                  });
                  const businessName = profile?.businessName || (slug === 'armtech-solutions' ? 'ArmTech Solutions' : slug);
                  
                  aggregated.push({
                    _id: r._id,
                    comment: r.comment,
                    rating: r.rating,
                    authorName: r.authorName || (r.author?.name) || 'Anonymous',
                    reportedReason: r.reportedReason || 'No reason provided',
                    reportedAt: r.reportedAt || r.createdAt || new Date().toISOString(),
                    status: r.status,
                    business: {
                      _id: r.businessId || `mock-${slug}`,
                      name: businessName,
                      slug: slug,
                      email: profile?.email || 'owner@example.com'
                    }
                  });
                }
              });
            }
          }
        }
      } catch (e) {
        console.error("Error loading local storage reports", e);
      }
      setReports(aggregated);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleStartResolve = (id: string, type: 'keep' | 'delete') => {
    setResolvingId(id);
    setActionType(type);
    setAdminReply("");
    setActionError("");
  };

  const handleCancelResolve = () => {
    setResolvingId(null);
    setActionType(null);
    setAdminReply("");
    setActionError("");
  };

  const handleSubmitResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingId || !actionType) return;
    if (adminReply.trim().length < 5) {
      setActionError("Please provide an explanation of at least 5 characters.");
      return;
    }

    const report = reports.find(r => r._id === resolvingId);
    if (!report) return;

    const isLocal = resolvingId.startsWith('local-') || !isNaN(Number(resolvingId)) || resolvingId.startsWith('mock-') || report.business._id.startsWith('mock-') || report.business._id === "1" || report.business._id.startsWith('custom-');

    if (isLocal) {
      // 1. Local storage resolution
      try {
        const slug = report.business.slug;
        const key = `armbiz-reviews-${slug}`;
        const reviewsRaw = window.localStorage.getItem(key);
        if (reviewsRaw) {
          const reviews = JSON.parse(reviewsRaw);
          const index = reviews.findIndex((r: any) => r._id === resolvingId);
          if (index !== -1) {
            const finalStatus = actionType === 'delete' ? 'resolved_deleted' : 'resolved_kept';
            reviews[index].status = finalStatus;
            reviews[index].adminReply = adminReply.trim();
            window.localStorage.setItem(key, JSON.stringify(reviews));

            // If deleted, we should update the mock business profile statistics
            if (actionType === 'delete') {
              const profilesRaw = window.localStorage.getItem("armbiz-business-profiles");
              if (profilesRaw) {
                const profiles = JSON.parse(profilesRaw);
                const pIndex = profiles.findIndex((p: any) => {
                  const pSlug = p.businessName ? p.businessName.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]/g, "") : "";
                  return pSlug === slug;
                });
                if (pIndex !== -1) {
                  const activeReviews = reviews.filter((r: any) => r.status !== 'resolved_deleted');
                  profiles[pIndex].reviewCount = activeReviews.length;
                  if (activeReviews.length > 0) {
                    const totalRating = activeReviews.reduce((sum: number, r: any) => sum + (Number(r.rating) || 0), 0);
                    profiles[pIndex].ratingAvg = totalRating / activeReviews.length;
                  } else {
                    profiles[pIndex].ratingAvg = 0;
                  }
                  window.localStorage.setItem("armbiz-business-profiles", JSON.stringify(profiles));
                }
              }
            }

            console.log(`[Offline Mock Email Sent] to ${report.business.email || 'owner@example.com'}`);
            console.log(`Subject: Review Report Resolution: ${report.business.name}`);
            console.log(`Reply: ${adminReply.trim()}`);
            
            setReports(prev => prev.filter(r => r._id !== resolvingId));
            handleCancelResolve();
            return;
          }
        }
      } catch (err) {
        console.error("Local resolution error", err);
      }
    }

    // 2. Backend API resolution
    try {
      const apiURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;

      const res = await axios.put(`${apiURL}/admin/reports/${resolvingId}/resolve`, {
        action: actionType,
        adminReply: adminReply.trim()
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (res.data?.success) {
        setReports(prev => prev.filter(r => r._id !== resolvingId));
        handleCancelResolve();
      }
    } catch (err: any) {
      console.error("Error submitting resolution to backend", err);
      const msg = err.response?.data?.message || "Failed to resolve report on backend.";
      setActionError(msg);
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight mb-0.5">Admin Moderation Dashboard</h1>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Inspect reported reviews, check compliance, and resolve reports.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-[hsl(var(--primary))] animate-spin" />
            <span className="text-xs text-[hsl(var(--muted-foreground))]">Loading reported reviews...</span>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center max-w-md mx-auto">
            <AlertOctagon className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-red-800 mb-1">Could not load reports</h3>
            <p className="text-xs text-red-600 mb-4">{error}</p>
            <button onClick={loadReports} className="px-3.5 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer">
              Retry
            </button>
          </div>
        ) : reports.length === 0 ? (
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-12 text-center max-w-md mx-auto">
            <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-1">Queue is clear!</h3>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">No reviews are currently flagged for moderation.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {reports.map((report) => (
              <div 
                key={report._id} 
                className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 hover:border-[hsl(var(--border))]/80 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Report on:</span>
                      <span className="text-sm font-bold text-[hsl(var(--foreground))]">{report.business.name}</span>
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">• By Business Owner</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">
                      <span>Reviewer: <strong>{report.authorName || report.author?.name}</strong></span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        Rating: 
                        <span className="flex text-amber-500 ml-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-3 w-3 ${i < report.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} 
                            />
                          ))}
                        </span>
                      </span>
                      <span>•</span>
                      <span>Date: {new Date(report.reportedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {resolvingId !== report._id && (
                    <div className="flex gap-2 self-start md:self-auto">
                      <button 
                        onClick={() => handleStartResolve(report._id, 'keep')}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all cursor-pointer shadow-sm"
                      >
                        <CheckCircle size={13} /> Keep Review
                      </button>
                      <button 
                        onClick={() => handleStartResolve(report._id, 'delete')}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all cursor-pointer shadow-sm"
                      >
                        <Trash2 size={13} /> Delete Review
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[hsl(var(--muted))]/30 p-3.5 rounded-xl border border-[hsl(var(--border))]/40">
                    <span className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider block mb-1">Review Content</span>
                    <p className="text-xs italic text-[hsl(var(--foreground))]">&ldquo;{report.comment}&rdquo;</p>
                  </div>
                  
                  <div className="bg-red-500/5 p-3.5 rounded-xl border border-red-500/10">
                    <span className="text-[10px] font-semibold text-red-500 uppercase tracking-wider block mb-1">Reporter&apos;s Reason</span>
                    <p className="text-xs text-[hsl(var(--foreground))]">{report.reportedReason}</p>
                  </div>
                </div>

                {resolvingId === report._id && (
                  <form onSubmit={handleSubmitResolve} className="mt-5 border-t border-[hsl(var(--border))]/40 pt-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="bg-[hsl(var(--muted))]/10 p-4 rounded-xl border border-[hsl(var(--border))]">
                      <h4 className="text-xs font-bold mb-2 text-[hsl(var(--foreground))] flex items-center gap-1.5">
                        {actionType === 'delete' ? (
                          <>
                            <Trash2 size={14} className="text-red-500" />
                            <span>Moderation Action: Delete Review & Reply</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle size={14} className="text-green-500" />
                            <span>Moderation Action: Keep Review & Reply</span>
                          </>
                        )}
                      </h4>
                      <p className="text-[11px] text-[hsl(var(--muted-foreground))] mb-3">
                        Provide a message explaining why this review was {actionType === 'delete' ? 'deleted' : 'kept'}. An official notification will be emailed to the business owner.
                      </p>

                      {actionError && (
                        <div className="mb-3 text-xs text-red-600 bg-red-500/10 p-2.5 rounded-xl border border-red-200/30">
                          {actionError}
                        </div>
                      )}

                      <textarea
                        value={adminReply}
                        onChange={(e) => setAdminReply(e.target.value)}
                        placeholder="Explain your decision (e.g. This review conforms to community guidelines / This review constitutes spam and is removed.)"
                        rows={3}
                        className="w-full text-xs rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 outline-none focus:border-[hsl(var(--primary))]"
                        required
                      />

                      <div className="flex justify-end gap-2 mt-3">
                        <button
                          type="button"
                          onClick={handleCancelResolve}
                          className="px-3 py-1.5 text-xs font-medium border border-[hsl(var(--border))] bg-[hsl(var(--card))] rounded-lg hover:bg-[hsl(var(--muted))]/50 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className={`px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-colors cursor-pointer ${
                            actionType === 'delete' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                          }`}
                        >
                          Submit Resolution
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
