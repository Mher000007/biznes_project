"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import Link from "next/link";
import { useI18n } from "@/i18n";
import { Plus, Trash2, Edit2, Coins, Tag, RefreshCw, Heart, Lock, Image as ImageIcon, Camera, Upload, X } from "lucide-react";

interface ExchangeOffer {
  _id: string;
  title: string;
  description: string;
  category: string;
  cost: number;
  totalQuantity: number;
  claimedQuantity: number;
  isActive: boolean;
  image?: string;
  imageUrl?: string;
  savedBy?: string[];
  likes?: number;
}

export default function DashboardExchange() {
  const { t, locale } = useI18n();
  const { currentUser } = useAuth();
  const [activePlan, setActivePlan] = useState<string>("starter");
  const [offers, setOffers] = useState<ExchangeOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

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
    const loadPlan = async () => {
      if (typeof window !== "undefined") {
        const demoPlan = window.localStorage.getItem("demo_active_plan");
        if (demoPlan) {
          setActivePlan(demoPlan);
          return;
        }
      }
      try {
        if (currentUser) {
          const bizRes = await api.get("/businesses/me/all");
          const bizId = bizRes.data?.data?.[0]?._id;
          if (bizId) {
            const subRes = await api.get(`/subscriptions/business/${bizId}`);
            if (subRes.data?.success && subRes.data.data?.plan) {
              setActivePlan(subRes.data.data.plan);
              return;
            }
          }
        }
      } catch {}
    };
    loadPlan();
  }, [currentUser]);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Food",
    cost: 100 as number | string,
    totalQuantity: 10 as number | string,
    isActive: true,
    imageUrl: "",
  });

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") resolve(reader.result);
        else reject(new Error("File conversion failed"));
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert("File size exceeds 3MB limit");
        return;
      }
      convertFileToBase64(file)
        .then((base64) => setFormData((prev) => ({ ...prev, imageUrl: base64 })))
        .catch(console.error);
    }
  };

  const [businessId, setBusinessId] = useState<string | null>(null);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      if (!currentUser) {
        setLoading(false);
        return;
      }

      let bId = businessId || (currentUser as any)?.businessId || (currentUser as any)?.business?._id;
      if (!bId) {
        const bizRes = await api.get("/businesses/me/all");
        bId = bizRes.data?.data?.[0]?._id;
      }

      if (bId) {
        setBusinessId(bId);
        // Fetch exchange offers
        const res = await api.get(`/exchange-offers/business/${bId}`);
        setOffers(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch exchange offers", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    }
  }, [isModalOpen]);

  const isProPlan = activePlan === "pro" || activePlan === "standard";
  const isPremiumPlan = activePlan === "premium" || activePlan === "vip";
  const isLimitReached = !editingId && isProPlan && offers.length >= 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) {
      alert("Business context missing.");
      return;
    }

    if (isLimitReached) {
      alert("Pro փաթեթի դեպքում կարող եք հրապարակել առավելագույնը 3 առաջարկ: Անսահմանափակ առաջարկների համար թարմացրեք փաթեթը Premium-ի:");
      return;
    }

    try {
      const payload = { 
        businessId,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        cost: Number(formData.cost),
        totalQuantity: Number(formData.totalQuantity),
        isActive: formData.isActive,
        imageUrl: formData.imageUrl,
        image: formData.imageUrl
      };
      
      if (editingId) {
        await api.put(`/exchange-offers/${editingId}`, payload);
      } else {
        await api.post("/exchange-offers", payload);
      }

      setIsModalOpen(false);
      setEditingId(null);
      resetForm();
      fetchOffers();
    } catch (error: any) {
      console.error("Error saving offer", error);
      alert(error.response?.data?.error || "Error saving offer");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "Food",
      cost: 100,
      totalQuantity: 10,
      isActive: true,
      imageUrl: "",
    });
  };

  const openEdit = (offer: ExchangeOffer) => {
    setFormData({
      title: offer.title,
      description: offer.description,
      category: offer.category || "Food",
      cost: offer.cost,
      totalQuantity: offer.totalQuantity,
      isActive: offer.isActive,
      imageUrl: offer.imageUrl || offer.image || "",
    });
    setEditingId(offer._id);
    setIsModalOpen(true);
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleOpenAddModal = () => {
    if (isProPlan && offers.length >= 3) {
      alert("Pro փաթեթի դեպքում կարող եք հրապարակել առավելագույնը 3 առաջարկ: Անսահմանափակ առաջարկներ հրապարակելու համար թարմացրեք փաթեթը Premium-ի:");
      return;
    }
    resetForm();
    setEditingId(null);
    setIsModalOpen(true);
  };

  const executeDelete = async (id: string) => {
    try {
      await api.delete(`/exchange-offers/${id}`);
      fetchOffers();
      setDeleteConfirmId(null);
    } catch (error) {
      console.error("Error deleting offer", error);
    }
  };

  const isStarterPlan = activePlan === "starter" || activePlan === "start" || activePlan === "free";

  if (isStarterPlan) {
    return (
      <div className="p-6 max-w-lg mx-auto mt-12">
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-3xl p-8 text-center shadow-xl">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-500 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[hsl(var(--foreground))] mb-2">Exchange Feature Locked</h2>
          <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] mb-6 leading-relaxed">
            The Findy Coin Exchange feature is not available on the Start plan. Upgrade your plan to Pro or Premium to manage exchange offers.
          </p>
          <Link href="/dashboard/settings" className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm transition-all inline-block shadow-lg shadow-emerald-500/20 hover:scale-105">
            Upgrade Plan
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">{t.dashboard.exchangeOffers.title}</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            {t.dashboard.exchangeOffers.subtitle}
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          disabled={isProPlan && offers.length >= 3}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          {t.dashboard.exchangeOffers.addOffer}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
        </div>
      ) : offers.length === 0 ? (
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Coins className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold text-[hsl(var(--foreground))] mb-2">{(t.dashboard.exchangeOffers as any).noOffersYet || "No Offers Yet"}</h3>
          <p className="text-[hsl(var(--muted-foreground))] mb-6 max-w-md mx-auto">
            {(t.dashboard.exchangeOffers as any).noOffersSubtitle || "Create your first exchange offer to allow users to spend their Findy Coins at your business."}
          </p>
          <button
            onClick={handleOpenAddModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            {(t.dashboard.exchangeOffers as any).createFirstOffer || "Create First Offer"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => (
            <div
              key={offer._id}
              className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl overflow-hidden hover:shadow-lg transition-shadow relative group flex flex-col"
            >
              {(offer.imageUrl || offer.image) && (
                <div className="h-40 w-full overflow-hidden relative border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]/20">
                  <img
                    src={offer.imageUrl || offer.image}
                    alt={offer.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}

              <div className="p-5 flex-1 flex flex-col">
                {!offer.isActive && (
                  <div className="absolute top-3 right-3 z-10 bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                    Inactive
                  </div>
                )}
                {offer.isActive && (
                  <div className="absolute top-3 right-3 z-10 bg-emerald-100 text-emerald-600 text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                    Active
                  </div>
                )}
              
              <div className="flex items-center gap-3 mb-4 mt-2">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Coins className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h3 className="font-bold text-[hsl(var(--foreground))] text-lg leading-tight">
                    {offer.title}
                  </h3>
                  <div className="text-sm font-semibold text-emerald-500 flex items-center gap-1 mt-0.5">
                    {offer.cost} Coins
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4 line-clamp-3">
                {offer.description}
              </p>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
                  <span className="text-xs font-medium text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] px-2 py-0.5 rounded-md">
                    {offer.category || "Uncategorized"}
                  </span>
                </div>
                
                <div className="flex items-center gap-1.5 text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] px-2 py-0.5 rounded-md">
                  <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                  <span className="text-xs font-bold">{offer.savedBy?.length || 0}</span>
                </div>
              </div>
              
              <div className="bg-[hsl(var(--muted))] rounded-lg p-3 mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Claimed</span>
                  <span className="text-xs font-bold text-[hsl(var(--foreground))]">{offer.claimedQuantity} / {offer.totalQuantity}</span>
                </div>
                <div className="w-full bg-[hsl(var(--border))] rounded-full h-1.5">
                  <div 
                    className="bg-emerald-500 h-1.5 rounded-full" 
                    style={{ width: `${Math.min(100, (offer.claimedQuantity / offer.totalQuantity) * 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-[hsl(var(--border))]">
                <button
                  onClick={() => openEdit(offer)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-[hsl(var(--muted))] hover:bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] rounded-lg transition-colors text-sm font-medium"
                >
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
                <button
                  onClick={() => setDeleteConfirmId(offer._id)}
                  className="flex items-center justify-center p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
          <div className="bg-[hsl(var(--card))] w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-[hsl(var(--border))] flex justify-between items-center bg-[hsl(var(--muted))]">
              <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">
                {editingId ? t.dashboard.exchangeOffers.editModalTitle : t.dashboard.exchangeOffers.addOffer}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] p-1 rounded-md hover:bg-[hsl(var(--background))]"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form id="offerForm" onSubmit={handleSubmit} className="space-y-5">
                
                <div>
                  <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-1.5">{t.dashboard.exchangeOffers.offerTitle}</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg px-4 py-2.5 text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder={t.dashboard.exchangeOffers.offerTitlePlaceholder}
                  />
                </div>

                <div className="relative">
                  <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-1.5">{t.dashboard.exchangeOffers.category}</label>
                  <div 
                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                    className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg px-4 py-2.5 text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer flex justify-between items-center group transition-all"
                  >
                    <span className="font-medium">{formData.category}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-[hsl(var(--muted-foreground))] transition-transform duration-300 ${isCategoryOpen ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                  
                  {isCategoryOpen && (
                    <div className="absolute z-50 w-full mt-2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      {["Food", "Drink", "Hookah"].map((cat) => (
                        <div 
                          key={cat}
                          onClick={() => {
                            setFormData({ ...formData, category: cat });
                            setIsCategoryOpen(false);
                          }}
                          className="px-4 py-3 hover:bg-[hsl(var(--muted))] cursor-pointer text-sm font-medium transition-colors flex items-center justify-between"
                        >
                          {cat}
                          {formData.category === cat && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M20 6 9 17l-5-5"/></svg>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-1.5">{t.dashboard.exchangeOffers.description}</label>
                  <textarea
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg px-4 py-2.5 text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                    placeholder={t.dashboard.exchangeOffers.descPlaceholder}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-1.5">{t.dashboard.exchangeOffers.coinCost}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Coins className="h-4 w-4 text-emerald-500" />
                      </div>
                      <input
                        type="number"
                        min="1"
                        required
                        value={formData.cost}
                        onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                        className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg pl-10 pr-4 py-2.5 text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-1.5">{t.dashboard.exchangeOffers.totalQuantity}</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.totalQuantity}
                      onChange={(e) => setFormData({ ...formData, totalQuantity: e.target.value })}
                      className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg px-4 py-2.5 text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      placeholder={t.dashboard.exchangeOffers.quantityPlaceholder}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded border-[hsl(var(--border))] focus:ring-emerald-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-[hsl(var(--foreground))]">
                    {t.dashboard.exchangeOffers.activeVisible}
                  </label>
                </div>

              </form>
            </div>

            <div className="p-6 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))] flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-lg text-sm font-medium bg-[hsl(var(--background))] border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="offerForm"
                className="px-5 py-2.5 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-2"
              >
                {editingId ? "Save Changes" : "Create Offer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-scale-in text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[hsl(var(--foreground))]">
                {locale === "hy" ? "Ջնջե՞լ առաջարկը" : locale === "ru" ? "Удалить предложение?" : "Delete Offer?"}
              </h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1.5 leading-relaxed">
                {locale === "hy"
                  ? "Վստա՞հ եք, որ ցանկանում եք ջնջել այս առաջարկը: Այս գործողությունը հնարավոր չէ չեղարկել:"
                  : locale === "ru"
                  ? "Вы уверены, что хотите удалить это предложение? Это действие нельзя отменить."
                  : "Are you sure you want to delete this offer? This action cannot be undone."}
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-[hsl(var(--border))] text-xs font-semibold hover:bg-[hsl(var(--muted))] transition-colors cursor-pointer text-[hsl(var(--foreground))]"
              >
                {locale === "hy" ? "Չեղարկել" : locale === "ru" ? "Отмена" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={() => {
                  const idToDelete = deleteConfirmId;
                  setDeleteConfirmId(null);
                  executeDelete(idToDelete);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold shadow-md shadow-red-500/20 transition-all cursor-pointer"
              >
                {locale === "hy" ? "Ջնջել" : locale === "ru" ? "Удалить" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
