"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getApiUrl } from "@/lib/utils";
import axios from "axios";
import Link from "next/link";
import { Plus, Trash2, Edit2, Coins, Tag, RefreshCw, Heart, Lock } from "lucide-react";

interface ExchangeOffer {
  _id: string;
  title: string;
  description: string;
  category: string;
  cost: number;
  totalQuantity: number;
  claimedQuantity: number;
  isActive: boolean;
  savedBy?: string[];
  likes?: number;
}

export default function DashboardExchange() {
  const { currentUser } = useAuth();
  const [activePlan, setActivePlan] = useState<string>("starter");
  const [offers, setOffers] = useState<ExchangeOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  useEffect(() => {
    const loadPlan = async () => {
      try {
        const token = typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
        if (token) {
          const subRes = await axios.get(`${getApiUrl()}/subscriptions/business/me`, { headers: { Authorization: `Bearer ${token}` } });
          if (subRes.data?.success && subRes.data.data?.plan) {
            setActivePlan(subRes.data.data.plan);
            return;
          }
        }
      } catch {}

      if (typeof window !== "undefined") {
        const profilesStr = window.localStorage.getItem("armbiz-business-profiles");
        if (profilesStr) {
          try {
            const profiles = JSON.parse(profilesStr);
            const myProfile = profiles.find((p: any) => p.ownerUsername === currentUser?.username);
            if (myProfile && myProfile.plan) {
              setActivePlan(myProfile.plan);
            }
          } catch (e) {}
        }
      }
    };
    loadPlan();
  }, [currentUser]);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Food",
    cost: 100 as number | string,
    totalQuantity: 10 as number | string,
    isActive: true,
  });

  const [businessId, setBusinessId] = useState<string | null>(null);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
      if (!token) {
        setLoading(false);
        return;
      }
      const h = { headers: { Authorization: `Bearer ${token}` } };

      let bId = businessId || (currentUser as any)?.businessId || (currentUser as any)?.business?._id;
      if (!bId) {
        const bizRes = await axios.get(`${getApiUrl()}/businesses/me/all`, h);
        bId = bizRes.data?.data?.[0]?._id;
      }

      if (bId) {
        setBusinessId(bId);
        // Fetch exchange offers
        const res = await axios.get(`${getApiUrl()}/exchange-offers/business/${bId}`);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;

    try {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
      const payload = { 
        businessId,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        cost: Number(formData.cost),
        totalQuantity: Number(formData.totalQuantity),
        isActive: formData.isActive
      };
      
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (editingId) {
        await axios.put(`${getApiUrl()}/exchange-offers/${editingId}`, payload, config);
      } else {
        await axios.post(`${getApiUrl()}/exchange-offers`, payload, config);
      }

      setIsModalOpen(false);
      setEditingId(null);
      resetForm();
      fetchOffers();
    } catch (error) {
      console.error("Error saving offer", error);
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
    });
    setEditingId(offer._id);
    setIsModalOpen(true);
  };

  const deleteOffer = async (id: string) => {
    if (!confirm("Արդյո՞ք ցանկանում եք ջնջել այս փոխանակման առաջարկը:")) return;
    try {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
      await axios.delete(`${getApiUrl()}/exchange-offers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchOffers();
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Findy Coin Offers</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Create offers that users can redeem using Findy Coins.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingId(null);
            setIsModalOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Offer
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
          <h3 className="text-xl font-bold text-[hsl(var(--foreground))] mb-2">No Offers Yet</h3>
          <p className="text-[hsl(var(--muted-foreground))] mb-6 max-w-md mx-auto">
            Create your first exchange offer to allow users to spend their Findy Coins at your business.
          </p>
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create First Offer
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => (
            <div
              key={offer._id}
              className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-5 hover:shadow-lg transition-shadow relative overflow-hidden group"
            >
              {!offer.isActive && (
                <div className="absolute top-3 right-3 bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-md">
                  Inactive
                </div>
              )}
              {offer.isActive && (
                <div className="absolute top-3 right-3 bg-emerald-100 text-emerald-600 text-xs font-bold px-2 py-1 rounded-md">
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
                  onClick={() => deleteOffer(offer._id)}
                  className="flex items-center justify-center p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
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
                {editingId ? "Edit Exchange Offer" : "Create Exchange Offer"}
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
                  <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-1.5">Offer Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg px-4 py-2.5 text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="e.g. Free Artisan Coffee"
                  />
                </div>

                <div className="relative">
                  <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-1.5">Category</label>
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
                  <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-1.5">Description</label>
                  <textarea
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg px-4 py-2.5 text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                    placeholder="Describe what the user gets..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-1.5">Coin Cost</label>
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
                    <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-1.5">Total Quantity</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.totalQuantity}
                      onChange={(e) => setFormData({ ...formData, totalQuantity: e.target.value })}
                      className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg px-4 py-2.5 text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      placeholder="e.g. 100"
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
                    Active (visible to users)
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
    </div>
  );
}
