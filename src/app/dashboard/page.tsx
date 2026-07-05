"use client";
import { useState, useEffect } from "react";
import { Eye, MessageSquare, Star, TrendingUp, ArrowUpRight, Award, Gem, AlertTriangle, Lock, ShieldAlert, Sparkles, CheckCircle, Bell } from "lucide-react";
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

        // Load bookings
        let bookingCount = 0;
        try {
          const bookingsRes = await axios.get(`${API}/bookings/business/${biz._id}`, { headers: authHeader() });
          if (bookingsRes.data?.success) {
            bookingCount = (bookingsRes.data.data || []).length;
          }
        } catch { /* bookings endpoint may not exist yet */ }


        const rankVal = views > 0 ? `#${Math.max(1, 15 - Math.floor(views / 10))}` : "#–";

        setStats([
          { label: "Total Views", value: views.toLocaleString(), change: views > 0 ? `+${(views * 0.125).toFixed(1)}%` : "+0%", icon: Eye },
          { label: "Inquiries", value: bookingCount.toLocaleString(), change: "+0%", icon: MessageSquare },
          { label: "Avg. Rating", value: `${rating.toFixed(1)} (${reviewCount} review${reviewCount !== 1 ? "s" : ""})`, change: "+0.0", icon: Star },
          { label: "Profile Rank", value: rankVal, change: "+0", icon: TrendingUp },
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

  return (
    <ProtectedRoute>
      {!loading && businessId && !isVerified ? (
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-6 animate-fade-in">
          <div className="mb-6 rounded-full bg-amber-100 p-6 dark:bg-amber-900/30">
            <Lock className="h-12 w-12 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Pending Admin Approval</h2>
          <p className="max-w-md text-[hsl(var(--muted-foreground))]">
            Your business account is currently under review by our administration team. You will be notified and gain full access to your vendor dashboard once your account is verified and approved.
          </p>
        </div>
      ) : (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold tracking-tight mb-1">Dashboard</h1>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Welcome back, {displayName}! Here&apos;s your business overview.</p>
            </div>
            <div className="flex items-center gap-3">
              <DashboardPublish />
            </div>
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
                          className={`rounded-xl border p-4 cursor-pointer flex flex-col justify-between min-h-[140px] transition-all hover:scale-[1.01] ${isActive
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

        </div>
      )}
    </ProtectedRoute>
  );
}
