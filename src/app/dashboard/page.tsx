"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, MessageSquare, Star, TrendingUp, TrendingDown, Minus, ArrowUpRight, Award, Gem, AlertTriangle, Lock, ShieldAlert, Sparkles, CheckCircle, Bell, MapPin, BadgeCheck, Bookmark } from "lucide-react";
import DashboardPublish from "./DashboardPublish";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import styles from "@/components/dashboard/Dashboard.module.scss";
import TotalViewsChart from "@/components/dashboard/TotalViewsChart";
import dynamic from "next/dynamic";
import RatingChart from "@/components/dashboard/RatingChart";
import TopBusinesses from "@/components/dashboard/TopBusinesses";

const LeafletMap = dynamic(() => import("@/components/map/LeafletMap"), { ssr: false });

interface StatItem {
  label: string;
  value: string;
  change: string;
  icon: any;
  iconColor?: string;
  iconBg?: string;
  iconAnimate?: string;
  badge?: string;
}

const DEFAULT_STATS: StatItem[] = [
  { label: "Total Views", value: "0", change: "+0%", icon: Eye, iconColor: "text-cyan-500 fill-cyan-500", iconBg: "bg-cyan-500/10", iconAnimate: "animate-eye-glow" },
  { label: "Inquiries", value: "0", change: "+0%", icon: MessageSquare, iconColor: "text-blue-500 fill-blue-500", iconBg: "bg-blue-500/10", iconAnimate: "animate-message-pop" },
  { label: "Avg. Rating", value: "0.0", change: "", icon: Star, iconColor: "text-amber-400 fill-amber-400", iconBg: "bg-amber-400/10", iconAnimate: "animate-gold-twinkle" },
  { label: "Profile Rank", value: "#–", change: "", icon: TrendingUp },
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

import UserProfileDashboard from "@/components/dashboard/UserProfileDashboard";

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const displayName = currentUser?.name || currentUser?.username || "User";

  const [stats, setStats] = useState(DEFAULT_STATS);
  const [totalViews, setTotalViews] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [userBusinesses, setUserBusinesses] = useState<any[]>([]);
  const [bookingBreakdown, setBookingBreakdown] = useState<any[]>([]);
  const [showInquiriesPopover, setShowInquiriesPopover] = useState(false);

  // Subscription & Verification States
  const [activePlan, setActivePlan] = useState<"starter" | "standard" | "premium">("starter");
  const [activeSubscription, setActiveSubscription] = useState<any>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [promoMessage, setPromoMessage] = useState("");
  const [promoMessageType, setPromoMessageType] = useState<"success" | "error" | "">("");
  const [applyingPromo, setApplyingPromo] = useState(false);

  const handlePlanUpgrade = async (plan: "starter" | "standard" | "premium") => {
    setActivePlan(plan);
    if (typeof window !== "undefined") {
      localStorage.setItem("demo_active_plan", plan);
      window.dispatchEvent(new Event("plan_updated"));
    }
    try {
      if (businessId) {
        await api.post("/subscriptions/subscribe", {
          businessId,
          plan
        });
        // Reload subscription details
        const subRes = await api.get(`/subscriptions/business/${businessId}`);
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
      const res = await api.post(
        "/subscriptions/promo/activate",
        {
          businessId,
          code: promoCodeInput.trim(),
        }
      );
      if (res.data?.success) {
        setPromoMessageType("success");
        setPromoMessage(res.data.message || "Promo code applied successfully!");
        setPromoCodeInput("");
        // Reload subscription details
        const subRes = await api.get(`/subscriptions/business/${businessId}`);
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
    // Client-side initialization of activePlan from localStorage
    const savedPlan = localStorage.getItem("demo_active_plan");
    if (savedPlan && ["starter", "standard", "premium"].includes(savedPlan)) {
      setActivePlan(savedPlan as any);
    }

    async function loadDashboardData() {
      if (!currentUser) return;
      try {
        const bizRes = await api.get("/businesses/me/all");
        const businesses = bizRes.data?.data || [];

        if (businesses.length === 0) {
          setStats(DEFAULT_STATS);
          setLoading(false);
          return;
        }

        setUserBusinesses(businesses);

        const biz = businesses[0];
        setBusinessId(biz._id);
        setIsVerified(biz.verified || false);

        // Load active subscription
        try {
          const subRes = await api.get(`/subscriptions/business/${biz._id}`);
          if (subRes.data?.success && subRes.data.data) {
            setActivePlan(subRes.data.data.plan);
            setActiveSubscription(subRes.data.data);
          }
        } catch (e) {
          console.warn("Could not load subscription details", e);
        }

        const views = biz.views || 0;
        setTotalViews(views);
        const saves = biz.savedCount || 0;
        setSavedCount(saves);
        const rating = biz.rating || 0;
        let reviewCount = biz.reviewCount || 0;

        // Load bookings
        let bookingCount = 0;
        let breakdown: any[] = [];
        try {
          const bookingsRes = await api.get(`/bookings/business/${biz._id}`);
          if (bookingsRes.data?.success) {
            const allBookings = bookingsRes.data.data || [];
            bookingCount = allBookings.length;

            // Group by locationId
            const countsMap = allBookings.reduce((acc: any, b: any) => {
              const locId = b.locationId || "unspecified";
              acc[locId] = (acc[locId] || 0) + 1;
              return acc;
            }, {});

            // Map locationIds to addresses
            if (biz.locations && biz.locations.length > 0) {
              breakdown = Object.keys(countsMap).map(locId => {
                const locObj = biz.locations.find((l: any) => (l._id || l.id || l.address) === locId);
                return {
                  address: locObj ? locObj.address : "Այլ / Ընդհանուր",
                  count: countsMap[locId]
                };
              });
            } else {
              breakdown = [{ address: "Ընդհանուր", count: bookingCount }];
            }
          }
        } catch { /* bookings endpoint may not exist yet */ }
        setBookingBreakdown(breakdown);

        const rankVal = biz.rank ? `#${biz.rank}` : (views > 0 ? `#${Math.max(1, 15 - Math.floor(views / 10))}` : "#–");

        let rankIcon = TrendingUp;
        let rankIconColor = "text-[hsl(var(--primary))]";
        let rankIconBg = "bg-[hsl(var(--primary))]/10";
        let rankAnimate = "";

        if (biz.rankTrend === 'up') {
          rankIcon = TrendingUp;
          rankIconColor = "text-green-600";
          rankIconBg = "bg-green-600/10";
          rankAnimate = "animate-bounce";
        } else if (biz.rankTrend === 'down') {
          rankIcon = TrendingDown;
          rankIconColor = "text-red-600";
          rankIconBg = "bg-red-600/10";
          rankAnimate = "animate-pulse";
        } else {
          rankIcon = Minus;
          rankIconColor = "text-gray-500";
          rankIconBg = "bg-gray-500/10";
        }

        const isTop5 = biz.rank && biz.rank <= 5;

        setStats([
          { label: "Total Views", value: views.toLocaleString(), change: views > 0 ? `+${(views * 0.125).toFixed(1)}%` : "+0%", icon: Eye, iconColor: "text-cyan-500 fill-cyan-500", iconBg: "bg-cyan-500/10", iconAnimate: "animate-eye-glow" },
          { label: "Inquiries", value: bookingCount.toLocaleString(), change: "+0%", icon: MessageSquare, iconColor: "text-blue-500 fill-blue-500", iconBg: "bg-blue-500/10", iconAnimate: "animate-message-pop" },
          { label: "Avg. Rating", value: `${rating.toFixed(1)} (${reviewCount} review${reviewCount !== 1 ? "s" : ""})`, change: "", icon: Star, iconColor: "text-amber-400 fill-amber-400", iconBg: "bg-amber-400/10", iconAnimate: "animate-gold-twinkle" },
          { label: "Profile Rank", value: rankVal, change: "", icon: rankIcon, iconColor: rankIconColor, iconBg: rankIconBg, iconAnimate: rankAnimate, badge: isTop5 ? "Top 5 in Armenia" : undefined },
          { label: "Saves", value: saves.toLocaleString(), change: saves > 0 ? `+${saves}` : "+0", icon: Bookmark, iconColor: "text-purple-500 fill-purple-500", iconBg: "bg-purple-500/10", iconAnimate: "animate-pulse" },
        ]);
      } catch (err) {
        console.warn("Dashboard data load failed", err);
        setStats(DEFAULT_STATS);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && (currentUser.accountType === "personal" || currentUser.role === "user")) {
      router.replace("/profile");
    }
  }, [currentUser, router]);

  if (currentUser && (currentUser.accountType === "personal" || currentUser.role === "user")) {
    return null;
  }

  return (
    <ProtectedRoute>
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
              {activePlan === "premium" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-200 to-yellow-400 px-2 py-0.5 text-[0.65rem] font-bold text-amber-950 shadow-sm border border-amber-300 uppercase tracking-wide">
                  <BadgeCheck className="h-3 w-3" /> Premium Partner
                </span>
              )}
              {activePlan === "standard" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-slate-200 to-gray-300 px-2 py-0.5 text-[0.65rem] font-bold text-slate-800 shadow-sm border border-slate-400 uppercase tracking-wide">
                  <BadgeCheck className="h-3 w-3" /> Pro Partner
                </span>
              )}
              {activePlan === "starter" && (
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-bold text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border))] uppercase tracking-wide">
                  <BadgeCheck className="h-3 w-3" /> Partner
                </span>
              )}
            </div>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Welcome back, {displayName}! Here&apos;s your business overview.</p>
          </div>
          <div className="flex items-center gap-3">
            <DashboardPublish />
          </div>
        </div>

        <div className={`grid grid-cols-1 sm:grid-cols-2 ${activePlan === "starter" ? "xl:grid-cols-2" : "xl:grid-cols-5"} gap-4 mb-8`}>
          {stats
            .filter((stat) => {
              if (activePlan === "starter") {
                return stat.label !== "Inquiries" && stat.label !== "Avg. Rating" && stat.label !== "Saves";
              }
              if (activePlan === "standard" || activePlan === "premium") {
                return true;
              }
              return stat.label !== "Saves";
            })
            .map((stat) => (
              <div
                key={stat.label}
                className={`rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 relative ${stat.label === "Inquiries" ? "cursor-pointer hover:border-[hsl(var(--primary))] transition-colors" : ""}`}
                onClick={() => { if (stat.label === "Inquiries") setShowInquiriesPopover(!showInquiriesPopover); }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.iconBg || 'bg-[hsl(var(--primary))]/10'} ${stat.iconColor || 'text-[hsl(var(--primary))]'} ${(stat as any).iconAnimate || ''}`}>
                    <stat.icon className="h-4 w-4" />
                  </div>
                  {stat.change && (activePlan === "standard" || activePlan === "premium") && (
                    <span className="flex items-center gap-0.5 text-xs font-medium text-green-600">
                      {stat.change} <ArrowUpRight className="h-3 w-3" />
                    </span>
                  )}
                </div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{stat.label}</div>

                {/* Click Popover for Inquiries Breakdown */}
                {stat.label === "Inquiries" && bookingBreakdown.length > 0 && showInquiriesPopover && (
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-[105%] mb-2 w-max min-w-[220px] max-w-[300px] p-3 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl shadow-xl z-50 animate-in fade-in slide-in-from-bottom-2">
                    <h4 className="text-xs font-bold text-[hsl(var(--foreground))] mb-2 border-b border-[hsl(var(--border))] pb-2">Ամրագրումներ ըստ հասցեի</h4>
                    <ul className="flex flex-col gap-2">
                      {bookingBreakdown.map((item, idx) => (
                        <li key={idx} className="flex items-center justify-between text-xs gap-4">
                          <span className="text-[hsl(var(--muted-foreground))] truncate max-w-[200px]" title={item.address}>{item.address}</span>
                          <span className="font-bold text-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 px-2 py-0.5 rounded">{item.count}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 rotate-45 bg-[hsl(var(--card))] border-b border-r border-[hsl(var(--border))]"></div>
                  </div>
                )}
              </div>
            ))}
        </div>

        {/* Analytics Charts - Visible ONLY on Pro (standard) and Premium plans */}
        {!loading && (activePlan === "standard" || activePlan === "premium") && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <TotalViewsChart totalViews={totalViews} businessId={businessId || ""} />
            </div>
            <div className="lg:col-span-1">
              {businessId && <RatingChart businessId={businessId} />}
            </div>
          </div>
        )}

        {/* Locked Analytics Banner when on Starter Plan */}
        {!loading && activePlan === "starter" && (
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm animate-scale-in">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[hsl(var(--primary))]/10 rounded-xl text-[hsl(var(--primary))] shrink-0">
                <Lock className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[hsl(var(--foreground))] mb-1">
                  Այցելությունների և գնահատականների վերլուծություն (Analytics)
                </h3>
                <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed max-w-2xl">
                  Դիտումների դինամիկայի և գնահատականների բաշխման գրաֆիկները հասանելի են միայն <strong className="text-[hsl(var(--foreground))]">Pro</strong> և <strong className="text-[hsl(var(--foreground))]">Premium</strong> փաթեթներում:
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                router.push("/dashboard/billing");
              }}
              className="shrink-0 px-4 py-2 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-semibold text-xs transition-transform hover:scale-105 shadow-sm cursor-pointer"
            >
              Ակտիվացնել Pro / Premium
            </button>
          </div>
        )}

        {!loading && (
          <div className="mb-8">
            <TopBusinesses />
          </div>
        )}

      </div>
    </ProtectedRoute>
  );
}

// Force cache invalidation
