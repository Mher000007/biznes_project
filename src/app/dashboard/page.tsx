"use client";
import { useState, useEffect } from "react";
import { Eye, MessageSquare, Star, TrendingUp, ArrowUpRight, Award, Gem, AlertTriangle, Lock, ShieldAlert, Sparkles, CheckCircle } from "lucide-react";
import DashboardPublish from "./DashboardPublish";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { getApiUrl } from "@/lib/utils";
import styles from "@/components/dashboard/Dashboard.module.scss";

const API = getApiUrl();

const DEFAULT_STATS = [
  { label: "Total Views", value: "0", change: "+0%", icon: Eye },
  { label: "Inquiries", value: "0", change: "+0%", icon: MessageSquare },
  { label: "Avg. Rating", value: "0.0", change: "+0.0", icon: Star },
  { label: "Profile Rank", value: "#–", change: "+0", icon: TrendingUp },
];

interface DashboardInquiry {
  id: string | number;
  name: string;
  subject: string;
  time: string;
  status: string;
  phone?: string;
  timeSlot?: string;
  price?: number;
  notes?: string;
  rating?: number;
  type?: "booking" | "review";
  createdAt?: string;
  reportedReason?: string;
  adminReply?: string;
}

function authHeader() {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const displayName = currentUser?.name || currentUser?.username || "User";

  const [stats, setStats] = useState(DEFAULT_STATS);
  const [recentInquiries, setRecentInquiries] = useState<DashboardInquiry[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "bookings" | "reviews">("all");
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);

  // Subscription & Verification States
  const [activePlan, setActivePlan] = useState<"starter" | "standard" | "premium">("starter");
  const [activeSubscription, setActiveSubscription] = useState<any>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [promoMessage, setPromoMessage] = useState("");
  const [promoMessageType, setPromoMessageType] = useState<"success" | "error" | "">("");
  const [applyingPromo, setApplyingPromo] = useState(false);

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [activeReportReviewId, setActiveReportReviewId] = useState<string | number | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportError, setReportError] = useState("");

  const handleOpenReportModal = (reviewId: string | number) => {
    setActiveReportReviewId(reviewId);
    setReportReason("");
    setReportError("");
    setReportModalOpen(true);
  };

  const handleCloseReportModal = () => {
    setReportModalOpen(false);
    setActiveReportReviewId(null);
    setReportReason("");
    setReportError("");
  };

  const handleSubmitReport = async () => {
    if (!activeReportReviewId || reportReason.trim().length < 5) return;
    setIsSubmittingReport(true);
    setReportError("");
    try {
      const res = await axios.post(
        `${API}/businesses/${businessId}/reviews/${activeReportReviewId}/report`,
        { reportedReason: reportReason.trim() },
        { headers: authHeader() }
      );
      if (res.data?.success) {
        setRecentInquiries((prev) =>
          prev.map((inq) =>
            inq.id === activeReportReviewId
              ? { ...inq, status: "reported", reportedReason: reportReason.trim() }
              : inq
          )
        );
        handleCloseReportModal();
      }
    } catch (err: any) {
      setReportError(err.response?.data?.message || "Could not submit report. Please try again.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleUpdateStatus = async (bookingId: string | number, newStatus: "confirmed" | "cancelled") => {
    try {
      await axios.put(`${API}/bookings/${bookingId}/status`, { status: newStatus }, { headers: authHeader() });
    } catch (e) {
      console.error("Error updating booking status", e);
    }
    setRecentInquiries((prev) => prev.map((inq) => (inq.id === bookingId ? { ...inq, status: newStatus } : inq)));
  };

  const handleDeleteBooking = async (bookingId: string | number) => {
    if (!confirm("Are you sure you want to delete this booking request?")) return;
    try {
      await axios.delete(`${API}/bookings/${bookingId}`, { headers: authHeader() });
    } catch (e) {
      console.error("Error deleting booking", e);
    }
    setRecentInquiries((prev) => prev.filter((inq) => inq.id !== bookingId));
  };

  const handlePlanUpgrade = async (plan: "starter" | "standard" | "premium") => {
    setActivePlan(plan);
    try {
      if (businessId) {
        await axios.post(`${API}/subscriptions/subscribe`, {
          businessId,
          plan
        }, {
          headers: authHeader()
        });
        // Reload subscription details
        const subRes = await axios.get(`${API}/subscriptions/business/${businessId}`, { headers: authHeader() });
        if (subRes.data?.success && subRes.data.data) {
          setActivePlan(subRes.data.data.plan);
          setActiveSubscription(subRes.data.data);
        }
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
      const res = await axios.post(
        `${API}/subscriptions/promo/activate`,
        {
          businessId,
          code: promoCodeInput.trim(),
        },
        { headers: authHeader() }
      );
      if (res.data?.success) {
        setPromoMessageType("success");
        setPromoMessage(res.data.message || "Promo code applied successfully!");
        setPromoCodeInput("");
        // Reload subscription details
        const subRes = await axios.get(`${API}/subscriptions/business/${businessId}`, { headers: authHeader() });
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

  useEffect(() => {
    async function loadDashboardData() {
      if (!currentUser) return;
      try {
        const bizRes = await axios.get(`${API}/businesses/me/all`, { headers: authHeader() });
        const businesses = bizRes.data?.data || [];

        if (businesses.length === 0) {
          setStats(DEFAULT_STATS);
          setLoading(false);
          return;
        }

        const biz = businesses[0];
        setBusinessId(biz._id);
        setIsVerified(biz.verified || false);

        // Load active subscription
        try {
          const subRes = await axios.get(`${API}/subscriptions/business/${biz._id}`, { headers: authHeader() });
          if (subRes.data?.success && subRes.data.data) {
            setActivePlan(subRes.data.data.plan);
            setActiveSubscription(subRes.data.data);
          }
        } catch (e) {
          console.warn("Could not load subscription details", e);
        }

        const views = biz.views || 0;
        const rating = biz.rating || 0;
        let reviewCount = biz.reviewCount || 0;
        const allItems: DashboardInquiry[] = [];

        // Load bookings
        try {
          const bookingsRes = await axios.get(`${API}/bookings/business/${biz._id}`, { headers: authHeader() });
          if (bookingsRes.data?.success) {
            allItems.push(
              ...(bookingsRes.data.data || []).map((b: any) => ({
                id: b._id,
                name: b.customerName,
                subject: `Appointment — ${b.serviceName}`,
                time: new Date(b.date || b.createdAt).toLocaleDateString(),
                status: b.status || "pending",
                phone: b.customerPhone,
                timeSlot: b.timeSlot,
                price: b.totalPrice,
                notes: b.notes,
                type: "booking" as const,
                createdAt: b.createdAt || b.date,
              }))
            );
          }
        } catch { /* bookings endpoint may not exist yet */ }

        // Load reviews
        try {
          const reviewsRes = await axios.get(`${API}/businesses/${biz._id}/reviews`, { headers: authHeader() });
          if (reviewsRes.data?.success) {
            const revs = reviewsRes.data.data || [];
            reviewCount = revs.length;
            allItems.push(
              ...revs.map((r: any) => ({
                id: r._id,
                name: r.authorName || r.author?.name || "Anonymous",
                subject: `Review — "${(r.comment || "").substring(0, 60)}"`,
                time: new Date(r.createdAt).toLocaleDateString(),
                status: r.status || "approved",
                notes: r.comment,
                rating: r.rating,
                type: "review" as const,
                createdAt: r.createdAt,
                reportedReason: r.reportedReason,
                adminReply: r.adminReply,
              }))
            );
          }
        } catch { /* reviews endpoint may not be mounted yet */ }

        allItems.sort((a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime());

        const inquiriesCount = allItems.filter((i) => i.type === "booking").length;
        const rankVal = views > 0 ? `#${Math.max(1, 15 - Math.floor(views / 10))}` : "#–";

        setStats([
          { label: "Total Views", value: views.toLocaleString(), change: views > 0 ? `+${(views * 0.125).toFixed(1)}%` : "+0%", icon: Eye },
          { label: "Inquiries", value: inquiriesCount.toLocaleString(), change: "+0%", icon: MessageSquare },
          { label: "Avg. Rating", value: `${rating.toFixed(1)} (${reviewCount} review${reviewCount !== 1 ? "s" : ""})`, change: "+0.0", icon: Star },
          { label: "Profile Rank", value: rankVal, change: "+0", icon: TrendingUp },
        ]);
        setRecentInquiries(allItems);
      } catch (err) {
        console.warn("Dashboard data load failed", err);
        setStats(DEFAULT_STATS);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [currentUser]);

  return (
    <ProtectedRoute>
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">Dashboard</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Welcome back, {displayName}! Here&apos;s your business overview.</p>
          </div>
          <DashboardPublish />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]">
                  <stat.icon className="h-4 w-4" />
                </div>
                <span className="flex items-center gap-0.5 text-xs font-medium text-green-600">
                  {stat.change} <ArrowUpRight className="h-3 w-3" />
                </span>
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Verification Pending Banner or Subscription Management */}
        {!loading && (
          !isVerified ? (
            /* Verification Pending Banner */
            <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-500/5 p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-scale-in">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 shrink-0 animate-pulse">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[hsl(var(--foreground))] mb-1">Բիզնեսի հաստատումը ընթացքի մեջ է</h3>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed max-w-2xl">
                    Ձեր բիզնեսի էջը ներկայումս գտնվում է ստուգման փուլում ադմինիստրատորների կողմից: Պլանների ընտրությունը, պրեմիում ֆունկցիաների ակտիվացումը և պրոմո կոդերի կիրառումը հասանելի կդառնան հաստատումից հետո:
                  </p>
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 font-semibold text-xs border border-amber-200/30 uppercase tracking-wide">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                Pending Verification
              </div>
            </div>
          ) : (
            /* Subscription & Billing Section */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-8 animate-scale-in">
              {/* Active subscription card (left) */}
              <div className="lg:col-span-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-sm flex flex-col justify-between min-h-[300px]">
                <div>
                  <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase font-bold tracking-wider">Active Plan</span>
                  <h2 className="text-xl font-black mt-1 text-[hsl(var(--foreground))]">{activePlan === "starter" ? "Starter Plan (Freemium)" : activePlan === "standard" ? "Standard Plan" : "Premium Plan"}</h2>
                  
                  {activeSubscription ? (
                    <div className="mt-6 flex flex-col gap-3">
                      <div className="flex items-center justify-between text-xs border-b border-[hsl(var(--border))]/50 pb-2">
                        <span className="text-[hsl(var(--muted-foreground))]">Status:</span>
                        <span className="font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 uppercase text-[10px]">{activeSubscription.status}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs border-b border-[hsl(var(--border))]/50 pb-2">
                        <span className="text-[hsl(var(--muted-foreground))]">Expires on:</span>
                        <span className="font-bold text-[hsl(var(--foreground))]">{new Date(activeSubscription.endDate).toLocaleDateString()}</span>
                      </div>
                      
                      {activeSubscription.isGifted && (
                        <div className="mt-2 p-3 bg-purple-500/5 border border-purple-500/20 text-purple-400 rounded-xl text-xs flex flex-col gap-1">
                          <span className="font-bold flex items-center gap-1.5">🎁 Gifted by Admin</span>
                          {activeSubscription.giftReason && <p className="italic text-[11px] text-purple-300/80">&ldquo;{activeSubscription.giftReason}&rdquo;</p>}
                        </div>
                      )}
                      {activeSubscription.promoCode && (
                        <div className="mt-2 p-3 bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex flex-col gap-1">
                          <span className="font-bold flex items-center gap-1.5">🎟️ Promo Activated</span>
                          <p className="text-[11px] text-emerald-300/80">Applied Code: <strong>{activeSubscription.promoCode}</strong></p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">No billing cycle active. Upgrade to a paid plan below.</p>
                  )}
                </div>
                
                <div className="flex items-center gap-3 mt-6 border-t border-[hsl(var(--border))]/50 pt-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] shrink-0">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase font-bold tracking-wide">Privileges</span>
                    <p className="text-xs text-[hsl(var(--foreground))] font-semibold">Active listing features enabled</p>
                  </div>
                </div>
              </div>

              {/* Pricing Upgrade Grid (right) */}
              <div className="lg:col-span-8 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-sm">
                <h3 className="text-base font-bold text-[hsl(var(--foreground))] mb-1">Upgrade / Change Plans</h3>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mb-6">Select a subscription plan that suits your business scale.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { key: "starter", title: "Starter", price: "0 AMD", desc: "Freemium plan, standard rank listing.", label: "Starter" },
                    { key: "standard", title: "Standard", price: "20,000 AMD", desc: "Featured rank listing with analytics dashboard.", label: "Standard" },
                    { key: "premium", title: "Premium", price: "50,000 AMD", desc: "High priority rank listing, direct support.", label: "Premium" },
                  ].map((p) => {
                    const isActive = activePlan === p.key;
                    return (
                      <div
                        key={p.key}
                        onClick={() => handlePlanUpgrade(p.key as any)}
                        className={`rounded-xl border p-4 cursor-pointer flex flex-col justify-between min-h-[140px] transition-all hover:scale-[1.01] ${
                          isActive
                            ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5 shadow-sm animate-scale-in"
                            : "border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]/50"
                        }`}
                      >
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-[hsl(var(--muted-foreground))]">{p.title}</h4>
                          <div className="text-lg font-black text-[hsl(var(--foreground))] mt-1">{p.price}</div>
                          <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1.5 leading-relaxed">{p.desc}</p>
                        </div>
                        {!isActive && (
                          <button type="button" className="mt-4 w-full py-1.5 rounded-lg bg-[hsl(var(--primary))]/10 hover:bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))] text-xs font-bold transition-colors cursor-pointer">
                            Select
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Promo Code Entry Form */}
                <div style={{ marginTop: 24, padding: 18, borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--foreground))] mb-1">🎟️ Redemptions & Promo Codes</h4>
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))] mb-4">Enter a code below to activate special subscription discounts or free plans.</p>
                  <form onSubmit={handlePromoApply} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <input
                      type="text"
                      placeholder="ENTER PROMO CODE"
                      value={promoCodeInput}
                      onChange={e => setPromoCodeInput(e.target.value.toUpperCase())}
                      style={{
                        flex: 1,
                        minWidth: 160,
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(0,0,0,0.15)",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: "1px",
                        outline: "none"
                      }}
                    />
                    <button
                      type="submit"
                      disabled={applyingPromo || !promoCodeInput.trim()}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 8,
                        background: "linear-gradient(90deg, #10b981, #059669)",
                        border: "none",
                        color: "#fff",
                        cursor: (applyingPromo || !promoCodeInput.trim()) ? "not-allowed" : "pointer",
                        fontSize: 12,
                        fontWeight: 700,
                        opacity: (applyingPromo || !promoCodeInput.trim()) ? 0.6 : 1,
                        transition: "all 0.15s"
                      }}
                    >
                      {applyingPromo ? "Applying..." : "Apply Code"}
                    </button>
                  </form>
                  {promoMessage && (
                    <div
                      style={{
                        marginTop: 10,
                        padding: 8,
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 500,
                        background: promoMessageType === "success" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                        color: promoMessageType === "success" ? "#10b981" : "#ef4444",
                        border: `1px solid ${promoMessageType === "success" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`
                      }}
                    >
                      {promoMessage}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        )}

        {/* Recent inquiries */}
        <div id="recent-inquiries-section" className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-5 border-b border-[hsl(var(--border))] gap-3">
            <h2 className="text-sm font-semibold">Recent Activity &amp; Feedback</h2>
            <div className="flex gap-1.5 text-xs bg-[hsl(var(--muted))]/50 p-1 rounded-xl self-start sm:self-center">
              {(["all", "bookings", "reviews"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all capitalize ${
                    activeTab === tab
                      ? "bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm"
                      : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] bg-transparent"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-[hsl(var(--border))]">
            {recentInquiries
              .filter((inq) => {
                if (activeTab === "bookings") return inq.type === "booking";
                if (activeTab === "reviews") return inq.type === "review";
                return true;
              })
              .map((inq) => (
                <div key={inq.id} className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 hover:bg-[hsl(var(--muted))]/50 transition-colors gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold">{inq.name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        inq.type === "review"
                          ? inq.status === "reported" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse"
                            : inq.status === "resolved_kept" ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                            : inq.status === "resolved_deleted" ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                          : inq.status === "pending" || inq.status === "new" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                          : inq.status === "confirmed" || inq.status === "replied" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : inq.status === "cancelled" ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      }`}>
                        {inq.type === "review" ? `Review${inq.status && inq.status !== "approved" && inq.status !== "read" ? ` (${inq.status})` : ""}` : inq.status}
                      </span>
                      {inq.type === "review" && inq.rating && (
                        <span className="flex gap-0.5 ml-1 text-amber-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round(inq.rating || 0) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                          ))}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-[hsl(var(--foreground))] mb-2">{inq.subject}</p>

                    {inq.type === "booking" && (inq.phone || inq.timeSlot || inq.price || inq.notes) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))]/30 p-2.5 rounded-xl border border-[hsl(var(--border))]/40 max-w-xl">
                        {inq.phone && <div className="flex items-center gap-1"><span className="font-semibold text-[hsl(var(--foreground))]">Phone:</span><span>{inq.phone}</span></div>}
                        {inq.timeSlot && <div className="flex items-center gap-1"><span className="font-semibold text-[hsl(var(--foreground))]">Time Slot:</span><span>{inq.timeSlot}</span></div>}
                        {inq.price !== undefined && inq.price > 0 && <div className="flex items-center gap-1"><span className="font-semibold text-[hsl(var(--foreground))]">Price:</span><span className="text-emerald-600 font-medium">{inq.price.toLocaleString()} AMD</span></div>}
                        {inq.notes && (
                          <div className="sm:col-span-2 border-t border-[hsl(var(--border))]/20 pt-1.5 mt-0.5">
                            <span className="font-semibold text-[hsl(var(--foreground))]">Notes:</span>
                            <p className="mt-0.5 text-xs italic bg-[hsl(var(--card))]/50 p-1.5 rounded border border-[hsl(var(--border))]/20">&ldquo;{inq.notes}&rdquo;</p>
                          </div>
                        )}
                      </div>
                    )}

                    {inq.type === "review" && inq.notes && (
                      <div className="text-[11px] text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))]/30 p-2.5 rounded-xl border border-[hsl(var(--border))]/40 max-w-xl">
                        <span className="font-semibold text-[hsl(var(--foreground))]">Comment:</span>
                        <p className="mt-0.5 text-xs italic bg-[hsl(var(--card))]/50 p-1.5 rounded border border-[hsl(var(--border))]/20">&ldquo;{inq.notes}&rdquo;</p>
                        {inq.status === "reported" && (
                          <div className="mt-2 text-[10px] text-amber-600 bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-200/30 flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                            <span>Reported: &ldquo;{inq.reportedReason}&rdquo; (Under Review)</span>
                          </div>
                        )}
                        {inq.status === "resolved_kept" && (
                          <div className="mt-2 text-[10px] text-green-600 bg-green-500/10 px-2.5 py-1.5 rounded-lg border border-green-200/30">
                            <div className="font-semibold mb-0.5">Moderator Decision: Kept</div>
                            <p className="italic">&ldquo;{inq.adminReply || "No message provided."}&rdquo;</p>
                          </div>
                        )}
                        {inq.status === "resolved_deleted" && (
                          <div className="mt-2 text-[10px] text-red-600 bg-red-500/10 px-2.5 py-1.5 rounded-lg border border-red-200/30">
                            <div className="font-semibold mb-0.5">Moderator Decision: Deleted</div>
                            <p className="italic">&ldquo;{inq.adminReply || "No message provided."}&rdquo;</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0 self-start sm:self-center">
                    <span className="text-xs text-[hsl(var(--muted-foreground))] font-medium">{inq.time}</span>
                    {inq.type === "booking" && (
                      <div className="flex gap-1.5 mt-1">
                        {inq.status !== "confirmed" && inq.status !== "replied" && (
                          <button onClick={() => handleUpdateStatus(inq.id, "confirmed")} className="px-2.5 py-1 text-[10px] font-semibold bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all shadow-sm cursor-pointer">Confirm</button>
                        )}
                        {inq.status !== "cancelled" && (
                          <button onClick={() => handleUpdateStatus(inq.id, "cancelled")} className="px-2.5 py-1 text-[10px] font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all shadow-sm cursor-pointer">Cancel</button>
                        )}
                        <button onClick={() => handleDeleteBooking(inq.id)} className="px-2.5 py-1 text-[10px] font-semibold bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all shadow-sm cursor-pointer">Delete</button>
                      </div>
                    )}
                    {inq.type === "review" && (
                      <div className="flex gap-1.5 mt-1">
                        {(!inq.status || inq.status === "approved" || inq.status === "read") && (
                          <button onClick={() => handleOpenReportModal(inq.id)} className="px-2.5 py-1 text-[10px] font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all shadow-sm cursor-pointer">Report</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

            {recentInquiries.filter((inq) => {
              if (activeTab === "bookings") return inq.type === "booking";
              if (activeTab === "reviews") return inq.type === "review";
              return true;
            }).length === 0 && (
              <div className="p-8 text-center text-xs text-[hsl(var(--muted-foreground))]">
                {loading ? "Loading activity…" : activeTab === "bookings" ? "No recent bookings." : activeTab === "reviews" ? "No recent reviews." : "No recent activity yet."}
              </div>
            )}
          </div>
        </div>

        {/* Report Review Modal */}
        {reportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-md bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 shadow-2xl">
              <h3 className="text-base font-bold text-[hsl(var(--foreground))] mb-2">Report Review</h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-4">
                Provide a reason why this review should be reviewed by our moderation team.
              </p>
              {reportError && (
                <div className="mb-4 text-xs text-red-600 bg-red-500/10 p-2.5 rounded-xl border border-red-200/30">{reportError}</div>
              )}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Reason *</label>
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="E.g. spam, hate speech, incorrect details, offensive language…"
                  rows={4}
                  className="w-full text-xs rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/10 p-3 outline-none transition-colors focus:border-[hsl(var(--primary))]"
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button onClick={handleCloseReportModal} disabled={isSubmittingReport} className="px-3.5 py-2 text-xs font-medium rounded-xl border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]/50 transition-colors cursor-pointer">Cancel</button>
                <button onClick={handleSubmitReport} disabled={isSubmittingReport || reportReason.trim().length < 5} className="px-3.5 py-2 text-xs font-medium rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90 disabled:opacity-50 transition-colors cursor-pointer">
                  {isSubmittingReport ? "Submitting…" : "Submit Report"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
