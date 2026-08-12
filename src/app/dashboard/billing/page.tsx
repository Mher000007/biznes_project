"use client";
import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useI18n } from "@/i18n";
import { useSearchParams } from "next/navigation";
import {
  Award,
  Sparkles,
  Crown,
  Zap,
  CheckCircle2,
  Ticket,
  ShieldCheck,
  CreditCard,
  X,
  Receipt,
  Trash2,
  CheckSquare,
  Square,
  ArrowDownUp,
  Clock
} from "lucide-react";
import PaymentModal from "@/components/ui/PaymentModal";
import AddCardModal from "@/components/ui/AddCardModal";

export default function DashboardBillingPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[hsl(var(--primary))]"></div>
      </div>
    }>
      <DashboardBillingPageInner />
    </Suspense>
  );
}

function DashboardBillingPageInner() {
  const { currentUser } = useAuth();
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "plans";

  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);

  // Subscription & Verification States
  const [activePlan, setActivePlan] = useState<"starter" | "standard" | "premium">("starter");
  const [activeSubscription, setActiveSubscription] = useState<any>(null);
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [promoMessage, setPromoMessage] = useState("");
  const [promoMessageType, setPromoMessageType] = useState<"success" | "error" | "">("");
  const [applyingPromo, setApplyingPromo] = useState(false);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPlanToPay, setSelectedPlanToPay] = useState<"starter" | "standard" | "premium" | null>(null);

  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
  const [savedCards, setSavedCards] = useState([
    { id: "1", type: "Visa", last4: "4083", expiry: "11/28", isDefault: true }
  ]);

  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [receipts, setReceipts] = useState([
    {
      id: "TRX-829481",
      plan: "PREMIUM",
      amount: "50,000 AMD",
      date: "12 Aug 2026",
      method: "4083",
      status: "approved"
    },
    {
      id: "TRX-719302",
      plan: "STANDARD",
      amount: "20,000 AMD",
      date: "15 Jul 2026",
      method: "4083",
      status: "unconfirmed"
    },
    {
      id: "TRX-618401",
      plan: "STARTER",
      amount: "0 AMD",
      date: "10 Jun 2026",
      method: "4083",
      status: "approved"
    }
  ]);
  const [receiptSortOrder, setReceiptSortOrder] = useState<"newest" | "oldest">("newest");
  const [selectedReceipts, setSelectedReceipts] = useState<Set<string>>(new Set());

  const sortedReceipts = [...receipts].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return receiptSortOrder === "newest" ? dateB - dateA : dateA - dateB;
  });

  const toggleReceiptSelection = (id: string) => {
    setSelectedReceipts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const toggleSelectAllReceipts = () => {
    if (selectedReceipts.size === receipts.length && receipts.length > 0) {
      setSelectedReceipts(new Set());
    } else {
      setSelectedReceipts(new Set(receipts.map(r => r.id)));
    }
  };

  const deleteSelectedReceipts = () => {
    setReceipts(prev => prev.filter(r => !selectedReceipts.has(r.id)));
    setSelectedReceipts(new Set());
  };

  const deleteAllReceipts = () => {
    if (window.confirm(t.billing.receipts.confirmDeleteAll)) {
      setReceipts([]);
      setSelectedReceipts(new Set());
    }
  };

  const deleteReceipt = (id: string) => {
    setReceipts(prev => prev.filter(r => r.id !== id));
    setSelectedReceipts(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const handlePlanClick = (plan: "starter" | "standard" | "premium") => {
    if (plan === "starter") {
      handlePlanUpgrade(plan);
    } else {
      setSelectedPlanToPay(plan);
      setIsPaymentModalOpen(true);
    }
  };

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
        setPromoMessage(res.data.message || t.billing.promoSuccess);
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
      setPromoMessage(err.response?.data?.message || t.billing.promoError);
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
      title: t.billing.plans.starter.title,
      price: t.billing.plans.starter.price,
      period: t.billing.plans.starter.period,
      desc: t.billing.plans.starter.desc,
      icon: Zap,
      color: "text-zinc-500",
      bgHover: "hover:border-zinc-500/50",
      features: t.billing.plans.starter.features
    },
    {
      key: "standard",
      title: t.billing.plans.standard.title,
      price: "20,000",
      currency: "AMD",
      period: t.billing.plans.standard.period,
      desc: t.billing.plans.standard.desc,
      icon: Sparkles,
      color: "text-[hsl(var(--primary))]",
      bgHover: "hover:border-[hsl(var(--primary))]/50",
      popular: true,
      features: t.billing.plans.standard.features
    },
    {
      key: "premium",
      title: t.billing.plans.premium.title,
      price: "50,000",
      currency: "AMD",
      period: t.billing.plans.premium.period,
      desc: t.billing.plans.premium.desc,
      icon: Crown,
      color: "text-amber-500",
      bgHover: "hover:border-amber-500/50",
      features: t.billing.plans.premium.features
    }
  ];

  return (
    <ProtectedRoute>
      <div className="max-w-6xl mx-auto pb-16 px-4 sm:px-6 lg:px-8">

        {/* Page Header */}
        <div className="mb-10 text-center max-w-2xl mx-auto pt-6">
          {tab === "plans" && (
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[hsl(var(--foreground))] mb-3">
              {t.billing.title.split(" ").slice(0, -1).join(" ")} <span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(var(--primary))] to-purple-500">{t.billing.title.split(" ").slice(-1)}</span>
            </h1>
          )}
          {tab === "cards" ? (
            <div className="flex flex-col items-center justify-center mt-2">
              <h3 className="text-xl font-bold text-[hsl(var(--foreground))] flex items-center justify-center gap-2">
                <CreditCard className="w-5 h-5 text-[hsl(var(--primary))]" />
                {t.billing.cards.title}
              </h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                {t.billing.cards.subtitle}
              </p>
            </div>
          ) : tab === "receipts" ? (
            <div className="flex flex-col items-center justify-center mt-2">
              <h3 className="text-xl font-bold text-[hsl(var(--foreground))] flex items-center justify-center gap-2">
                <Receipt className="w-5 h-5 text-[hsl(var(--primary))]" />
                {t.billing.receipts.title}
              </h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                {t.billing.receipts.subtitle}
              </p>
            </div>
          ) : (
            <p className="text-[hsl(var(--muted-foreground))] text-sm sm:text-base leading-relaxed">
              {t.billing.subtitle}
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[hsl(var(--primary))]"></div>
          </div>
        ) : (
          <div className="space-y-12 animate-fade-in">

            {/* TOP SECTION: Active Plan & Promo Code */}
            {tab === "plans" && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">

                  {/* Active Subscription Banner */}
                  <div className="relative overflow-hidden rounded-3xl border border-[hsl(var(--border))] bg-gradient-to-br from-[hsl(var(--card))] to-[hsl(var(--muted))]/30 p-8 shadow-sm h-full flex flex-col justify-center text-center">
                    <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none text-emerald-500 -rotate-12">
                      <ShieldCheck className="w-64 h-64" />
                    </div>

                    <div className="relative z-10 flex flex-col items-center justify-center">
                      <span className="inline-block px-3 py-1 bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-[10px] font-black uppercase tracking-widest rounded-full mb-3">
                        {t.billing.currentActivePlan}
                      </span>
                      <div className="flex items-center justify-center gap-3 mb-2">
                        <h2 className="text-2xl sm:text-3xl font-black text-[hsl(var(--foreground))] capitalize">
                          {activePlan === "starter" ? t.billing.startFreemium : activePlan === "standard" ? t.billing.pro : activePlan} {t.billing.plan}
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
                            <span>{t.billing.status}</span>
                            <span className="text-emerald-500 font-bold uppercase">{activeSubscription.status}</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-[hsl(var(--background))] px-3 py-1.5 rounded-lg border border-[hsl(var(--border))]">
                            <span>{t.billing.expires}</span>
                            <span className="text-[hsl(var(--foreground))]">{new Date(activeSubscription.endDate).toLocaleDateString()}</span>
                          </div>

                          {activeSubscription.isGifted && (
                            <div className="flex items-center gap-1.5 bg-purple-500/10 text-purple-500 px-3 py-1.5 rounded-lg border border-purple-500/20">
                              <span>{t.billing.gifted} {activeSubscription.giftReason}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                          {t.billing.freeTierDesc}
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
                          <h4 className="text-lg font-bold text-[hsl(var(--foreground))]">{t.billing.havePromoCode}</h4>
                          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">{t.billing.redeemBelow}</p>
                        </div>
                      </div>

                      <form onSubmit={handlePromoApply} className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={promoCodeInput}
                            onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                            placeholder={t.billing.enterCode}
                            className="w-full pl-4 pr-4 py-3.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm font-bold tracking-widest outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/50 transition-all placeholder:text-[hsl(var(--muted-foreground))]/50 placeholder:font-normal uppercase"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={applyingPromo || !promoCodeInput.trim()}
                          className="sm:w-auto w-full px-8 py-3.5 rounded-xl bg-[hsl(var(--foreground))] text-[hsl(var(--background))] hover:bg-[hsl(var(--foreground))]/90 text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shrink-0"
                        >
                          {applyingPromo ? t.billing.applying : t.billing.redeem}
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
              </>
            )}


            {/* Saved Payment Methods Section */}
            {tab === "cards" && (
              <div className="mt-6 lg:mt-8 max-w-6xl mx-auto animate-fade-in px-4">
                {!isWalletOpen ? (
                  <div
                    className="relative w-full max-w-[360px] mx-auto perspective-1000 mt-24 mb-32 h-[260px] group cursor-pointer animate-in zoom-in-95 duration-500"
                    onClick={() => setIsWalletOpen(true)}
                  >
                    {/* Wallet Back Face */}
                    <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-[2rem] shadow-[inset_0_10px_30px_rgba(0,0,0,0.8)] border border-white/5 z-0 flex items-center justify-center">
                      <span className="text-white/5 font-black text-4xl tracking-widest uppercase rotate-[-10deg]">{t.billing.cards.wallet}</span>
                    </div>

                    {/* Cards Container */}
                    {savedCards.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center z-20">
                        <p className="text-white/40 font-medium text-sm tracking-wider">{t.billing.cards.empty}</p>
                      </div>
                    )}

                    {savedCards.map((card, index) => {
                      const total = savedCards.length;
                      const reverseIndex = total - 1 - index;

                      return (
                        <motion.div
                          layoutId={`card-${card.id}`}
                          layout
                          transition={{ type: "spring", bounce: 0.2, duration: 0.8 }}
                          key={card.id}
                          className="absolute left-4 w-[calc(100%-32px)] aspect-[1.586/1] rounded-[1.2rem] overflow-hidden shadow-[0_-5px_25px_-5px_rgba(0,0,0,0.5),0_15px_35px_-10px_rgba(0,0,0,0.7)] transition-transform duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] transform group-hover:[transform:translateY(var(--hover-y))_scale(1)]"
                          style={{
                            zIndex: 10 + index,
                            transformOrigin: 'bottom center',
                            transform: 'translateY(var(--tucked-y)) scale(var(--tucked-scale))',
                            '--tucked-y': `${index * 12}px`,
                            '--tucked-scale': `${1 - reverseIndex * 0.05}`,
                            '--hover-y': `-${180 + reverseIndex * 70}px`,
                          } as React.CSSProperties}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-5 sm:p-6 flex flex-col justify-between border-t border-white/20 z-0">
                            {/* Shimmer Effect */}
                            <div className="absolute inset-0 w-[200%] h-full bg-gradient-to-tr from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:animate-shimmer z-10 pointer-events-none" />

                            {/* Glow / Lighting */}
                            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none ${card.type === 'Visa' ? 'bg-blue-500/30' : card.type === 'Mastercard' ? 'bg-orange-500/30' : 'bg-emerald-500/30'}`} />

                            <div className="flex justify-between items-start relative z-20">
                              <div className="w-10 h-7 rounded-[4px] bg-gradient-to-br from-yellow-200 to-yellow-500 shadow-sm opacity-90" />
                              <span className="text-white font-black italic drop-shadow-md text-xl tracking-tighter">
                                {card.type.toUpperCase()}
                              </span>
                            </div>

                            <div className="relative z-20 mt-auto">
                              <p className="text-white/90 font-mono text-xl tracking-[0.15em] mb-4 text-shadow-sm">
                                •••• •••• •••• {card.last4}
                              </p>
                              <div className="flex justify-between items-end">
                                <div>
                                  <p className="text-[9px] text-white/50 uppercase tracking-widest font-bold mb-1">{t.billing.cards.expires}</p>
                                  <p className="text-white font-medium tracking-widest font-mono text-sm">{card.expiry}</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  {card.isDefault && (
                                    <span className="bg-white/10 text-white border border-white/20 text-[9px] font-bold px-2 py-0.5 rounded backdrop-blur-md uppercase tracking-wider shadow-sm">
                                      {t.billing.cards.default}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}

                    {/* Wallet Front Face (Pocket) */}
                    <div className="absolute bottom-0 left-0 right-0 h-[65%] bg-gradient-to-t from-neutral-900 via-neutral-800 to-neutral-800 rounded-b-[2rem] rounded-t-xl z-30 shadow-[0_-15px_40px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.1)] border-t border-white/10 flex flex-col justify-end pb-5 items-center backdrop-blur-md pointer-events-none group-hover:translate-y-4 group-hover:rotate-x-12 transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]">
                      {/* Leather Texture Overlay */}
                      <div className="absolute inset-0 opacity-20 mix-blend-overlay rounded-b-[2rem] rounded-t-xl" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

                      {/* Stitching effect */}
                      <div className="absolute bottom-3 left-6 right-6 h-[1px] border-b border-dashed border-white/20" />
                      <div className="absolute top-4 left-6 bottom-3 w-[1px] border-l border-dashed border-white/20" />
                      <div className="absolute top-4 right-6 bottom-3 w-[1px] border-r border-dashed border-white/20" />

                      <div className="w-16 h-1 bg-black/50 rounded-full shadow-[inset_0_1px_1px_rgba(0,0,0,0.5)] mb-3 relative z-10" />
                      <div className="text-[10px] uppercase tracking-[0.4em] text-white/30 font-black relative z-10 drop-shadow-md">{t.billing.cards.clickToOpen}</div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700 mt-8 mb-12">
                    <div className="flex justify-end mb-6">
                      <button
                        onClick={() => setIsWalletOpen(false)}
                        className="px-4 py-2 rounded-lg bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/80 transition-all font-medium text-sm flex items-center gap-2"
                      >
                        {t.billing.cards.closeWallet}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative perspective-1000">
                      {savedCards.length === 0 && (
                        <div className="col-span-full py-12 text-center border-2 border-dashed border-[hsl(var(--border))] rounded-2xl w-full">
                          <p className="text-[hsl(var(--muted-foreground))] font-medium">{t.billing.cards.walletEmptyDesc}</p>
                        </div>
                      )}
                      {savedCards.map((card, index) => (
                        <motion.div
                          layoutId={`card-${card.id}`}
                          layout
                          transition={{ type: "spring", bounce: 0.2, duration: 0.8 }}
                          key={card.id}
                          className="relative w-full aspect-[1.586/1] rounded-[1.5rem] overflow-hidden shadow-[0_15px_35px_-10px_rgba(0,0,0,0.3)] group hover:shadow-[0_20px_45px_-10px_rgba(0,0,0,0.4)] transition-transform duration-300 hover:-translate-y-2 hover:scale-[1.02] cursor-pointer"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-5 sm:p-6 flex flex-col justify-between border border-white/10 z-0">
                            {/* Shimmer Effect */}
                            <div className="absolute inset-0 w-[200%] h-full bg-gradient-to-tr from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:animate-shimmer z-10 pointer-events-none" />

                            {/* Glow / Lighting */}
                            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none ${card.type === 'Visa' ? 'bg-blue-500/30' : card.type === 'Mastercard' ? 'bg-orange-500/30' : 'bg-emerald-500/30'}`} />

                            <div className="flex justify-between items-start relative z-20">
                              <div className="w-10 h-7 rounded-[4px] bg-gradient-to-br from-yellow-200 to-yellow-500 shadow-sm opacity-90" />
                              <span className="text-white font-black italic drop-shadow-md text-xl tracking-tighter">
                                {card.type.toUpperCase()}
                              </span>
                            </div>

                            <div className="relative z-20 mt-auto">
                              <p className="text-white/90 font-mono text-xl tracking-[0.15em] mb-4 text-shadow-sm">
                                •••• •••• •••• {card.last4}
                              </p>
                              <div className="flex justify-between items-end">
                                <div>
                                  <p className="text-[9px] text-white/50 uppercase tracking-widest font-bold mb-1">{t.billing.cards.expires}</p>
                                  <p className="text-white font-medium tracking-widest font-mono text-sm">{card.expiry}</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  {card.isDefault && (
                                    <span className="bg-white/10 text-white border border-white/20 text-[9px] font-bold px-2 py-0.5 rounded backdrop-blur-md uppercase tracking-wider shadow-sm">
                                      {t.billing.cards.default}
                                    </span>
                                  )}
                                  {/* Delete Button Overlay */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSavedCards(cards => cards.filter(c => c.id !== card.id));
                                    }}
                                    className="w-7 h-7 rounded-full bg-red-500/80 text-white hover:bg-red-500 flex items-center justify-center backdrop-blur-md transition-all shadow-lg opacity-0 hover:opacity-100 group-hover:opacity-100"
                                    title="Remove Card"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* BOTTOM SECTION: Pricing Grid */}
            {tab === "plans" && (
              <div className="mt-12 sm:mt-16 animate-fade-in">
                <div className="text-center mb-10">
                  <h3 className="text-2xl md:text-3xl font-extrabold text-[hsl(var(--foreground))]">{t.billing.upgradeBusiness}</h3>
                  <p className="text-sm md:text-base text-[hsl(var(--muted-foreground))] mt-3 max-w-xl mx-auto">{t.billing.upgradeDesc}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 xl:gap-10 items-stretch max-w-6xl mx-auto">
                  {plans.map((p) => {
                    const isActive = activePlan === p.key;
                    const isPro = p.key === "standard";

                    return (
                      <div
                        key={p.key}
                        onClick={() => handlePlanClick(p.key as any)}
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
                              {t.billing.mostPopular}
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
                            handlePlanClick(p.key as any);
                          }}
                          className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all duration-200
                          ${isActive
                              ? "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] cursor-default border border-[hsl(var(--border))]"
                              : p.key === "premium"
                                ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                                : p.key === "standard"
                                  ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                                  : "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] shadow-sm hover:bg-[hsl(var(--secondary))]/80"
                            }
                        `}
                        >
                          {isActive ? t.billing.currentPlanBtn : `${t.billing.upgradeToBtn} ${p.title}`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {tab === "receipts" && (
              <div className="mt-6 lg:mt-8 max-w-6xl mx-auto animate-fade-in">
                {/* Receipts Action Bar */}
                {receipts.length > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-[hsl(var(--card))] p-3 rounded-xl border border-[hsl(var(--border))] shadow-sm">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={toggleSelectAllReceipts}
                        className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                      >
                        {selectedReceipts.size === receipts.length ? (
                          <CheckSquare className="w-4 h-4 text-[hsl(var(--primary))]" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                        {t.billing.receipts.selectAll}
                      </button>
                      
                      <div className="h-4 w-[1px] bg-[hsl(var(--border))]" />
                      
                      <button
                        onClick={() => setReceiptSortOrder(prev => prev === "newest" ? "oldest" : "newest")}
                        className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                      >
                        <ArrowDownUp className="w-4 h-4" />
                        {receiptSortOrder === "newest" ? t.billing.receipts.sortNewest : t.billing.receipts.sortOldest}
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      {selectedReceipts.size > 0 && (
                        <button
                          onClick={deleteSelectedReceipts}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          {t.billing.receipts.delete} ({selectedReceipts.size})
                        </button>
                      )}
                      <button
                        onClick={deleteAllReceipts}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        {t.billing.receipts.deleteAll}
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-4">
                  {receipts.length === 0 && (
                    <div className="col-span-full text-center py-12 text-[hsl(var(--muted-foreground))]">
                      {t.billing.receipts.noHistory}
                    </div>
                  )}
                  {sortedReceipts.map((receipt) => {
                    const isSelected = selectedReceipts.has(receipt.id);
                    return (
                    <div 
                      key={receipt.id} 
                      className={`relative w-full max-w-[280px] mx-auto sm:mx-0 group cursor-pointer perspective-1000 transition-all duration-300 ${isSelected ? "scale-105" : ""}`}
                      onClick={() => toggleReceiptSelection(receipt.id)}
                    >
                      <div className={`w-full bg-[#fcfbfa] flex flex-col pb-6 rounded-t-md relative transition-all duration-500 group-hover:-translate-y-2 border-x border-t ${isSelected ? "border-[hsl(var(--primary))] border-2 drop-shadow-[0_20px_35px_rgba(0,0,0,0.2)]" : "border-slate-200/60 drop-shadow-[0_15px_30px_rgba(0,0,0,0.15)] group-hover:drop-shadow-[0_25px_40px_rgba(0,0,0,0.25)]"}`}
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.04'/%3E%3C/svg%3E")`
                        }}
                      >
                        {/* Faint Watermark (FQ Logo) */}
                        <img src="/fq-logo.png" alt="Watermark" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 opacity-[0.04] grayscale mix-blend-multiply pointer-events-none object-contain" />

                        {/* Selection Checkbox */}
                        <div className="absolute top-4 left-4 z-20">
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-[hsl(var(--primary))]" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-300 group-hover:text-slate-400 transition-colors" />
                          )}
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteReceipt(receipt.id);
                          }}
                          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                          title={t.billing.receipts.deleteReceipt}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        {/* Top of receipt */}
                        <div className="w-full h-4" />

                        {/* Content */}
                        <div className="px-5 text-slate-800 text-center flex-1 relative z-10">
                          <div className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center mb-3 shadow-sm border-2 ${receipt.status === 'approved' ? 'bg-emerald-500 border-emerald-100' : 'bg-amber-500 border-amber-100'}`}>
                            {receipt.status === 'approved' ? <CheckCircle2 className="w-5 h-5 text-white" /> : <Clock className="w-5 h-5 text-white" />}
                          </div>

                          <h3 className={`font-black text-lg mb-1 tracking-tight uppercase ${receipt.status === 'approved' ? 'text-emerald-600' : 'text-amber-600'}`} style={{ fontFamily: 'monospace' }}>
                            {receipt.status === 'approved' ? 'APPROVED' : 'UNCONFIRMED'}
                          </h3>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-4 font-mono">{t.billing.receipts.receiptId} #{receipt.id}</p>

                          <div className="border-t-[1.5px] border-dashed border-slate-400 w-full my-3 opacity-50" />

                          <div className="flex justify-between items-center text-xs mb-2.5 font-mono">
                            <span className="font-bold text-slate-500">{t.billing.receipts.plan}</span>
                            <span className="font-bold text-slate-900">{receipt.plan}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs mb-2.5 font-mono">
                            <span className="font-bold text-slate-500">{t.billing.receipts.amount}</span>
                            <span className="font-black text-slate-900 text-sm">{receipt.amount}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs mb-2.5 font-mono">
                            <span className="font-bold text-slate-500">{t.billing.receipts.date}</span>
                            <span className="font-bold text-slate-800">{receipt.date}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs mb-2.5 font-mono">
                            <span className="font-bold text-slate-500">{t.billing.receipts.method}</span>
                            <span className="font-bold text-slate-800">•••• {receipt.method}</span>
                          </div>

                          <div className="border-t-[1.5px] border-dashed border-slate-400 w-full my-3 opacity-50" />


                          <p className="text-[7px] font-mono mt-1.5 tracking-[0.3em] opacity-50 font-bold">{t.billing.receipts.thankYou}</p>
                        </div>

                        {/* Jagged Bottom Edge */}
                        <div className="absolute bottom-[-10px] left-0 w-full h-[10px]"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 12 10' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0l6 10 6-10z' fill='%23fcfbfa'/%3E%3C/svg%3E")`,
                            backgroundSize: '12px 10px',
                            backgroundRepeat: 'repeat-x'
                          }}
                        />
                      </div>
                    </div>
                  );})}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedPlanToPay && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          plan={selectedPlanToPay}
          onSuccess={(plan) => {
            handlePlanUpgrade(plan);
            const amount = plan === "premium" ? "50,000 AMD" : plan === "standard" ? "20,000 AMD" : "0 AMD";
            setReceipts(prev => [{
              id: `TRX-${Math.floor(100000 + Math.random() * 900000)}`,
              plan: plan.toUpperCase(),
              amount,
              date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
              method: savedCards.find(c => c.isDefault)?.last4 || "4083"
            }, ...prev]);
          }}
        />
      )}
      <AddCardModal
        isOpen={isAddCardModalOpen}
        onClose={() => setIsAddCardModalOpen(false)}
        onAddCard={(newCard) => {
          setSavedCards(prev => [...prev, { ...newCard, id: Date.now().toString() }]);
        }}
      />
    </ProtectedRoute>
  );
}
