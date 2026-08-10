"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import {
  Award,
  Sparkles,
  Crown,
  Zap,
  CheckCircle2,
  Ticket,
  ShieldCheck,
  CreditCard
} from "lucide-react";

export default function DashboardBillingPage() {
  const { currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);

  // Subscription & Verification States
  const [activePlan, setActivePlan] = useState<"starter" | "standard" | "premium">("starter");
  const [activeSubscription, setActiveSubscription] = useState<any>(null);
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [promoMessage, setPromoMessage] = useState("");
  const [promoMessageType, setPromoMessageType] = useState<"success" | "error" | "">("");
  const [applyingPromo, setApplyingPromo] = useState(false);

  // Listen for plan updates
  useEffect(() => {
    const handlePlanUpdate = () => {
      const demoPlan = window.localStorage.getItem("demo_active_plan");
      if (demoPlan) setActivePlan(demoPlan as any);
    };
    handlePlanUpdate();
    window.addEventListener("plan_updated", handlePlanUpdate);
    return () => window.removeEventListener("plan_updated", handlePlanUpdate);
  }, []);

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
          if (typeof window !== "undefined") {
            localStorage.setItem("demo_active_plan", subRes.data.data.plan);
            window.dispatchEvent(new Event("plan_updated"));
          }
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
    async function loadData() {
      if (!currentUser) return;
      try {
        const bizRes = await api.get("/businesses/me/all");
        const businesses = bizRes.data?.data || [];

        if (businesses.length === 0) {
          setLoading(false);
          return;
        }

        const biz = businesses[0];
        setBusinessId(biz._id);

        try {
          const subRes = await api.get(`/subscriptions/business/${biz._id}`);
          if (subRes.data?.success && subRes.data.data) {
            if (typeof window === "undefined" || !window.localStorage.getItem("demo_active_plan")) {
              setActivePlan(subRes.data.data.plan);
            }
            setActiveSubscription(subRes.data.data);
          }
        } catch (e) {
          console.warn("Failed to load subscription details");
        }
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentUser]);

  if (currentUser && (currentUser.accountType === "personal" || currentUser.role === "user")) {
    return null;
  }

  const plans = [
    {
      key: "starter",
      title: "Start",
      price: "Free",
      period: "Forever",
      desc: "Perfect for new businesses just getting started.",
      icon: Zap,
      color: "text-zinc-500",
      bgHover: "hover:border-zinc-500/50",
      features: [
        "Standard rank listing",
        "Basic business profile",
        "Community support",
      ]
    },
    {
      key: "standard",
      title: "Pro",
      price: "20,000",
      currency: "AMD",
      period: "/month",
      desc: "Unlock powerful tools to grow your customer base.",
      icon: Sparkles,
      color: "text-[hsl(var(--primary))]",
      bgHover: "hover:border-[hsl(var(--primary))]/50",
      popular: true,
      features: [
        "Featured rank listing",
        "Advanced analytics dashboard",
        "Menus & Offers feature",
        "Stories & Highlights",
        "Priority support",
      ]
    },
    {
      key: "premium",
      title: "Premium",
      price: "50,000",
      currency: "AMD",
      period: "/month",
      desc: "Maximum visibility and elite concierge service.",
      icon: Crown,
      color: "text-amber-500",
      bgHover: "hover:border-amber-500/50",
      features: [
        "Top priority rank listing",
        "Direct concierge support",
        "Exclusive promotional spots",
        "Verified badge priority",
        "All Pro features included",
      ]
    }
  ];

  return (
    <ProtectedRoute>
      <div className="max-w-6xl mx-auto pb-16 px-4 sm:px-6 lg:px-8">

        {/* Page Header */}
        <div className="mb-10 text-center max-w-2xl mx-auto pt-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[hsl(var(--foreground))] mb-3">
            Billing & <span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(var(--primary))] to-purple-500">Plans</span>
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm sm:text-base leading-relaxed">
            Manage your subscription, upgrade your plan to unlock premium features, or apply promo codes for exclusive discounts.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[hsl(var(--primary))]"></div>
          </div>
        ) : (
          <div className="space-y-12 animate-fade-in">

            {/* TOP SECTION: Active Plan & Promo Code */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">

              {/* Active Subscription Banner */}
              <div className="relative overflow-hidden rounded-3xl border border-[hsl(var(--border))] bg-gradient-to-br from-[hsl(var(--card))] to-[hsl(var(--muted))]/30 p-8 shadow-sm h-full flex flex-col justify-center text-center">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none text-emerald-500 -rotate-12">
                  <ShieldCheck className="w-64 h-64" />
                </div>

                <div className="relative z-10 flex flex-col items-center justify-center">
                  <span className="inline-block px-3 py-1 bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-[10px] font-black uppercase tracking-widest rounded-full mb-3">
                    Current Active Plan
                  </span>
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <h2 className="text-2xl sm:text-3xl font-black text-[hsl(var(--foreground))] capitalize">
                      {activePlan === "starter" ? "Start (Freemium)" : activePlan === "standard" ? "Pro" : activePlan} Plan
                    </h2>
                    {activePlan !== "starter" && (
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    )}
                  </div>

                  {activeSubscription ? (
                    <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-[hsl(var(--muted-foreground))] mt-4">
                      <div className="flex items-center gap-1.5 bg-[hsl(var(--background))] px-3 py-1.5 rounded-lg border border-[hsl(var(--border))]">
                        <span>Status:</span>
                        <span className="text-emerald-500 font-bold uppercase">{activeSubscription.status}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-[hsl(var(--background))] px-3 py-1.5 rounded-lg border border-[hsl(var(--border))]">
                        <span>Expires:</span>
                        <span className="text-[hsl(var(--foreground))]">{new Date(activeSubscription.endDate).toLocaleDateString()}</span>
                      </div>

                      {activeSubscription.isGifted && (
                        <div className="flex items-center gap-1.5 bg-purple-500/10 text-purple-500 px-3 py-1.5 rounded-lg border border-purple-500/20">
                          <span>🎁 Gifted: {activeSubscription.giftReason}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                      You are currently on the free tier. No active billing cycle.
                    </p>
                  )}
                </div>
              </div>

              {/* Promo Code Section */}
              <div className="relative overflow-hidden rounded-3xl border border-[hsl(var(--border))] bg-gradient-to-bl from-[hsl(var(--card))] to-[hsl(var(--muted))]/30 p-8 shadow-sm h-full flex flex-col justify-center text-center">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none text-emerald-500 rotate-12">
                  <Ticket className="w-64 h-64" />
                </div>

                <div className="relative z-10 flex flex-col items-center justify-center">
                  <div className="flex flex-col items-center gap-3 mb-6">
                    <div className="w-12 h-12 shrink-0 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center">
                      <Ticket className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-[hsl(var(--foreground))]">Have a Promo Code?</h4>
                      <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Redeem it below for special discounts.</p>
                    </div>
                  </div>

                  <form onSubmit={handlePromoApply} className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={promoCodeInput}
                        onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                        placeholder="ENTER CODE"
                        className="w-full pl-4 pr-4 py-3.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm font-bold tracking-widest outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/50 transition-all placeholder:text-[hsl(var(--muted-foreground))]/50 placeholder:font-normal uppercase"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={applyingPromo || !promoCodeInput.trim()}
                      className="sm:w-auto w-full px-8 py-3.5 rounded-xl bg-[hsl(var(--foreground))] text-[hsl(var(--background))] hover:bg-[hsl(var(--foreground))]/90 text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shrink-0"
                    >
                      {applyingPromo ? "Applying..." : "Redeem"}
                    </button>
                  </form>

                  {promoMessage && (
                    <div className={`mt-4 p-3 rounded-xl text-xs font-bold animate-fade-in w-full
                      ${promoMessageType === "success"
                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        : "bg-red-500/10 text-red-500 border border-red-500/20"
                      }`}
                    >
                      {promoMessage}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* BOTTOM SECTION: Pricing Grid */}
            <div className="mt-12 sm:mt-16">
              <div className="text-center mb-10">
                <h3 className="text-2xl md:text-3xl font-extrabold text-[hsl(var(--foreground))]">Upgrade Your Business</h3>
                <p className="text-sm md:text-base text-[hsl(var(--muted-foreground))] mt-3 max-w-xl mx-auto">Select the plan that best fits your goals and scale. Unlock powerful tools to grow your customer base.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 xl:gap-10 items-stretch max-w-6xl mx-auto">
                {plans.map((p) => {
                  const isActive = activePlan === p.key;
                  const isPro = p.key === "standard";

                  return (
                    <div
                      key={p.key}
                      onClick={() => handlePlanUpgrade(p.key as any)}
                      className={`relative flex flex-col rounded-3xl p-6 lg:p-8 cursor-pointer transition-all duration-300 ease-in-out
                        ${isActive
                          ? "ring-2 ring-[hsl(var(--primary))] bg-[hsl(var(--primary))]/[0.02] scale-[1.02] shadow-xl shadow-[hsl(var(--primary))]/10"
                          : `border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:scale-[1.02] hover:shadow-lg ${p.bgHover}`
                        }
                      `}
                    >
                      {isPro && !isActive && (
                        <div className="absolute -top-4 left-0 right-0 flex justify-center">
                          <span className="bg-gradient-to-r from-[hsl(var(--primary))] to-emerald-500 text-white text-[10px] font-black uppercase tracking-widest py-1.5 px-4 rounded-full shadow-md">
                            Most Popular
                          </span>
                        </div>
                      )}

                      {isActive && (
                        <div className="absolute top-4 right-4 text-[hsl(var(--primary))]">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                      )}

                      <div className="mb-6 flex flex-col items-center text-center">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${p.key === 'premium' ? 'bg-amber-500/10' :
                          p.key === 'standard' ? 'bg-[hsl(var(--primary))]/10' :
                            'bg-zinc-500/10'
                          }`}>
                          <p.icon className={`w-7 h-7 ${p.color}`} />
                        </div>
                        <h4 className="text-xl font-bold text-[hsl(var(--foreground))]">{p.title}</h4>
                        <div className="mt-3 flex items-baseline justify-center gap-1">
                          <span className="text-4xl font-black text-[hsl(var(--foreground))]">{p.price}</span>
                          {p.currency && <span className="text-sm font-bold text-[hsl(var(--muted-foreground))]">{p.currency}</span>}
                          <span className="text-sm font-medium text-[hsl(var(--muted-foreground))] ml-1">{p.period}</span>
                        </div>
                        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-4 leading-relaxed min-h-[3rem]">
                          {p.desc}
                        </p>
                      </div>

                      <div className="flex-1">
                        <ul className="space-y-3 mb-8">
                          {p.features.map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-sm">
                              <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${isActive ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]'}`} />
                              <span className="text-[hsl(var(--foreground))] font-medium">{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlanUpgrade(p.key as any);
                        }}
                        className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all duration-200
                          ${isActive
                            ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-md hover:bg-[hsl(var(--primary))]/90"
                            : isPro
                              ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/20"
                              : "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--border))]"
                          }
                        `}
                      >
                        {isActive ? "Current Plan" : `Upgrade to ${p.title}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
