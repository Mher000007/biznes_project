"use client";

import React, { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/layout/Navbar";
import { ExchangeIllustration } from "@/components/ui/ExchangeIllustration";
import { ArrowDown, ArrowUp, ArrowUpDown, Coins, ShieldCheck, Zap, X, UserPlus, Gift, Send, Heart } from "lucide-react";
import { useI18n } from "@/i18n";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import axios from "axios";
import { getApiUrl } from "@/lib/utils";

const MOCK_OFFERS = [
  {
    id: "1",
    title: "Free Artisan Coffee",
    business: "Cafe Central",
    cost: 150,
    category: "Food",
    bgClass: "bg-emerald-500/10",
    textClass: "text-emerald-600 dark:text-emerald-400",
    icon: Gift,
    description: "Enjoy a freshly brewed artisanal coffee of your choice from Cafe Central. Valid for espresso, cappuccino, or latte. Redeemable anytime this month!",
    totalQuantity: 50,
    claimedQuantity: 32
  },
  {
    id: "2",
    title: "20% Off Hookah Session",
    business: "Chill Lounge",
    cost: 300,
    category: "Hookah",
    bgClass: "bg-purple-500/10",
    textClass: "text-purple-600 dark:text-purple-400",
    icon: Zap,
    description: "Get a 20% discount on any premium hookah blend at Chill Lounge. Perfect for an evening with friends. Minimum spend 10,000 AMD.",
    totalQuantity: 30,
    claimedQuantity: 12
  },
  {
    id: "3",
    title: "1 Month Gym Pass",
    business: "FitLife Gym",
    cost: 1000,
    category: "Food",
    bgClass: "bg-blue-500/10",
    textClass: "text-blue-600 dark:text-blue-400",
    icon: ShieldCheck,
    description: "Get fully unlimited access to all FitLife Gym facilities, group classes, and sauna for one entire month. Start your premium fitness journey today!",
    totalQuantity: 20,
    claimedQuantity: 19
  }
];

export default function ExchangePage() {
  const { locale, t } = useI18n();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const isBusinessUser = currentUser?.role === "business_owner" || currentUser?.accountType === "business";
  
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [offerCategory, setOfferCategory] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<'default' | 'highToLow' | 'lowToHigh'>('default');
  const [savedOffers, setSavedOffers] = useState<string[]>([]);
  const [offers, setOffers] = useState<any[]>(MOCK_OFFERS);

  const sortedOffers = useMemo(() => {
    let list = offers.filter(o =>
      offerCategory === 'All'
        ? true
        : offerCategory === 'Saved'
        ? savedOffers.includes(o.id)
        : o.category === offerCategory
    );

    if (sortOrder === 'highToLow') {
      return [...list].sort((a, b) => (Number(b.cost) || 0) - (Number(a.cost) || 0));
    }
    if (sortOrder === 'lowToHigh') {
      return [...list].sort((a, b) => (Number(a.cost) || 0) - (Number(b.cost) || 0));
    }
    return list;
  }, [offers, offerCategory, savedOffers, sortOrder]);

  const handleConfirmExchange = () => {
    if (!currentUser) {
      showToast();
      return;
    }
    alert("Exchange request confirmed!");
    setSelectedOffer(null);
  };

  const toggleSavedOffer = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!currentUser) {
      showToast();
      return;
    }
    setSavedOffers(prev => 
      prev.includes(id) ? prev.filter(offerId => offerId !== id) : [...prev, id]
    );
    const token = typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
    if (token && id !== "1" && id !== "2" && id !== "3") {
      try {
        await axios.post(`${getApiUrl()}/exchange-offers/${id}/toggle-save`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error("Failed to toggle save offer", err);
      }
    }
  };

  useEffect(() => {
    if (selectedOffer) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedOffer]);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await axios.get(`${getApiUrl()}/exchange-offers`);
        if (res.data.success && res.data.data.length > 0) {
          const loadedSaved: string[] = [];
          const mappedOffers = res.data.data.map((o: any, idx: number) => {
            if (currentUser && (o.savedBy || []).some((userId: any) => userId === currentUser?.id || userId === (currentUser as any)?._id)) {
              loadedSaved.push(o._id);
            }
            const colors = [
              { bgClass: "bg-emerald-500/10", textClass: "text-emerald-600 dark:text-emerald-400", barClass: "bg-emerald-500", icon: Coins },
              { bgClass: "bg-blue-500/10", textClass: "text-blue-600 dark:text-blue-400", barClass: "bg-blue-500", icon: Zap },
              { bgClass: "bg-purple-500/10", textClass: "text-purple-600 dark:text-purple-400", barClass: "bg-purple-500", icon: ShieldCheck }
            ];
            const c = colors[idx % colors.length];
            return {
              id: o._id,
              title: o.title,
              business: o.business?.name || "Unknown Business",
              businessLogo: o.business?.logo || null,
              cost: o.cost,
              category: o.category || "Food",
              description: o.description,
              totalQuantity: o.totalQuantity,
              claimedQuantity: o.claimedQuantity,
              ...c
            };
          });
          setOffers(mappedOffers);
          if (loadedSaved.length > 0) {
            setSavedOffers(prev => Array.from(new Set([...prev, ...loadedSaved])));
          }
        }
      } catch (e) {
        console.error("Failed to fetch offers", e);
      }
    };
    fetchOffers();
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <Navbar />


      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 relative">

        {/* STICKY COINS COUNTER */}
        <div className="sticky top-24 z-50 flex justify-center mb-12">
          <div className="relative group cursor-default inline-block">
            {/* Glowing gradient aura */}
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/40 via-teal-400/40 to-emerald-500/40 rounded-full blur-md opacity-70 group-hover:opacity-100 transition duration-500 animate-pulse"></div>
            
            {/* Glassmorphic pill */}
            <div className="relative bg-[hsl(var(--background))]/80 backdrop-blur-xl px-6 py-2.5 rounded-full border border-emerald-500/30 shadow-2xl flex items-center gap-2.5 transition-transform duration-300 hover:scale-105">
              
              {/* Coin Icon */}
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-green-300 shadow-[0_0_12px_rgba(16,185,129,0.5)]">
                <Coins className="w-4 h-4 text-emerald-950" />
              </div>

              {/* Text */}
              <h3 className="text-2xl font-black text-[hsl(var(--foreground))] tracking-tight flex items-baseline gap-1.5">
                0 <span className="text-emerald-500 text-[11px] font-extrabold uppercase tracking-[0.15em] drop-shadow-sm">Coins</span>
              </h3>
            </div>
          </div>
        </div>

        {/* HERO SECTION */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">

          {/* Left Illustration (Swapped) */}
          <div className="flex-1 w-full max-w-[650px] lg:max-w-[750px] relative">
            <style>{`
              @keyframes float-gentle {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-12px); }
              }
              .animate-float-gentle {
                animation: float-gentle 6s ease-in-out infinite;
              }
            `}</style>

            {/* Softened background (reduced opacity) */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-transparent dark:from-white/15 dark:to-white/5 dark:bg-white/5 blur-[80px] rounded-full opacity-60 dark:opacity-100 mix-blend-normal" />

            <div className="relative animate-float-gentle">
              <img
                src="/images/exchange-3d-green.png"
                alt="Exchange Coins"
                className="w-full h-auto object-contain drop-shadow-xl scale-110 lg:scale-[1.15]"
              />
            </div>
          </div>

          {/* Right Content (Swapped) */}
          <div className="flex-1 space-y-8 text-center lg:text-left z-10">

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
              Earn And <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600">Exchange</span>
            </h1>

            <p className="text-lg text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto lg:mx-0">
              {t.exchange.heroDesc}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <a href="#premium-offers" className="w-full sm:w-auto px-8 py-4 bg-emerald-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-emerald-500/20 hover:scale-105 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2">
                {t.exchange.startExchanging}
                <ArrowDown className="w-5 h-5 animate-bounce" />
              </a>
            </div>


          </div>

        </div>

        {/* PREMIUM OFFERS SECTION */}
        <div id="premium-offers" className="mt-32 border-t border-[hsl(var(--border))]/50 pt-20 scroll-mt-28">
          
          <div className="flex flex-col mb-8 space-y-6">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[hsl(var(--foreground))]">
              Exclusive <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">Offers</span>
            </h2>
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            
            {/* OFFERS SECTION */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Categories Bar */}
              <div className="flex justify-start items-center gap-3 md:gap-6 mb-8 flex-wrap sm:flex-nowrap overflow-visible relative z-30">
                {/* Primary Filters */}
                <div className="inline-flex items-center p-1.5 bg-[hsl(var(--muted))]/30 border border-[hsl(var(--border))]/50 rounded-full shadow-inner backdrop-blur-md shrink-0">
                  {/* All Button with Price Sort Hover Dropdown */}
                  <div className="relative group/all inline-block">
                    <button 
                      onClick={() => setOfferCategory('All')}
                      className={`relative px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                        offerCategory === 'All'
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                          : 'bg-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/80'
                      }`}
                    >
                      <span>All</span>
                      {sortOrder === 'highToLow' && <ArrowDown className="w-3.5 h-3.5 text-white" />}
                      {sortOrder === 'lowToHigh' && <ArrowUp className="w-3.5 h-3.5 text-white" />}
                    </button>

                    {/* Hover Dropdown Popup for Price Sorting */}
                    <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover/all:opacity-100 group-hover/all:visible group-hover/all:translate-y-0 translate-y-2 transition-all duration-300 z-[100] pointer-events-none group-hover/all:pointer-events-auto">
                      <div className="inline-flex items-center p-1 bg-[hsl(var(--card))]/95 border border-[hsl(var(--border))] rounded-2xl shadow-2xl backdrop-blur-xl ring-1 ring-[hsl(var(--border))]/50 whitespace-nowrap">
                        <button
                          onClick={() => setSortOrder(prev => prev === 'highToLow' ? 'default' : 'highToLow')}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                            sortOrder === 'highToLow'
                              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                              : 'bg-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/60'
                          }`}
                        >
                          <span>{locale === "hy" ? "Թանկից էժան" : locale === "ru" ? "От дорогих к дешевым" : "Expensive to Cheap"}</span>
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSortOrder(prev => prev === 'lowToHigh' ? 'default' : 'lowToHigh')}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                            sortOrder === 'lowToHigh'
                              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                              : 'bg-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/60'
                          }`}
                        >
                          <span>{locale === "hy" ? "Էժանից թանկ" : locale === "ru" ? "От дешевых к дорогим" : "Cheap to Expensive"}</span>
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => setOfferCategory('Saved')}
                    className={`relative px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 cursor-pointer ${
                      offerCategory === 'Saved'
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                        : 'bg-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/80'
                    }`}
                  >
                    Saved
                  </button>
                </div>

                <div className="w-px h-8 bg-[hsl(var(--border))] shrink-0"></div>

                {/* Categories */}
                <div className="inline-flex items-center p-1.5 bg-[hsl(var(--muted))]/30 border border-[hsl(var(--border))]/50 rounded-full shadow-inner backdrop-blur-md shrink-0">
                  {['Food', 'Drink', 'Hookah'].map(cat => {
                    const isActive = offerCategory === cat;
                    return (
                      <button 
                        key={cat}
                        onClick={() => setOfferCategory(cat)}
                        className={`relative px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                          isActive 
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                            : 'bg-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/80'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Offers Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedOffers.map((offer) => (
                  <div 
                    key={offer.id}
                    onClick={() => setSelectedOffer(offer)}
                    className="group bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col cursor-pointer"
                  >
                    <div className={`absolute top-0 right-0 w-32 h-32 ${offer.bgClass} rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110`} />
                    
                    {/* Save Offer Button */}
                    <button 
                      onClick={(e) => toggleSavedOffer(e, offer.id)}
                      className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-[hsl(var(--background))]/50 backdrop-blur-md border border-[hsl(var(--border))]/50 hover:bg-[hsl(var(--card))] hover:shadow-md transition-all duration-200 group/btn"
                    >
                      <Heart className={`w-5 h-5 transition-colors ${savedOffers.includes(offer.id) ? 'fill-red-500 text-red-500' : 'text-[hsl(var(--muted-foreground))] group-hover/btn:text-[hsl(var(--foreground))]'}`} />
                    </button>

                    <div className="flex items-center gap-3 mb-5">
                      <div className={`w-10 h-10 rounded-xl ${offer.bgClass} ${offer.textClass} flex items-center justify-center overflow-hidden shrink-0`}>
                        {offer.businessLogo ? (
                          <img src={offer.businessLogo.startsWith('data:') || offer.businessLogo.startsWith('http') ? offer.businessLogo : getApiUrl().replace('/api', '') + offer.businessLogo} alt={offer.business} className="w-full h-full object-cover" />
                        ) : (
                          <offer.icon className="w-5 h-5" />
                        )}
                      </div>
                      <span className="font-semibold text-sm text-[hsl(var(--foreground))]">{offer.business}</span>
                    </div>
                    <h3 className="text-xl font-bold text-[hsl(var(--foreground))] mb-4 flex-1">{offer.title}</h3>
                    
                    {/* Progress Bar */}
                    <div className="mb-5 mt-auto">
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-2">
                        <span>{offer.totalQuantity - offer.claimedQuantity} Left</span>
                        <span>{Math.round((offer.claimedQuantity / offer.totalQuantity) * 100)}% Claimed</span>
                      </div>
                      <div className="w-full bg-[hsl(var(--border))] rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${offer.barClass}`} 
                          style={{ width: `${(offer.claimedQuantity / offer.totalQuantity) * 100}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-[hsl(var(--border))]/50">
                      <div className="flex items-center gap-1.5">
                        <Coins className="w-4 h-4 text-emerald-500" />
                        <span className="font-black text-lg text-[hsl(var(--foreground))]">{offer.cost}</span>
                      </div>
                      <button className="px-5 py-2 bg-[hsl(var(--foreground))] text-[hsl(var(--background))] rounded-xl text-sm font-bold shadow-md hover:scale-105 active:scale-95 transition-transform pointer-events-none">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
                
                {sortedOffers.length === 0 && (
                  <div className="col-span-full py-12 text-center text-[hsl(var(--muted-foreground))]">
                    {offerCategory === 'Saved' ? "You haven't saved any offers yet." : "No offers found in this category."}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* OFFER DETAILS MODAL */}
      {selectedOffer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedOffer(null)}
          />
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-3xl w-full max-w-lg relative z-10 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className={`p-8 pb-6 ${selectedOffer.bgClass} relative`}>
              <button 
                onClick={() => setSelectedOffer(null)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 text-black/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-14 h-14 rounded-2xl bg-[hsl(var(--card))] shadow-sm ${selectedOffer.textClass} flex items-center justify-center overflow-hidden shrink-0`}>
                  {selectedOffer.businessLogo ? (
                    <img src={selectedOffer.businessLogo.startsWith('data:') || selectedOffer.businessLogo.startsWith('http') ? selectedOffer.businessLogo : getApiUrl().replace('/api', '') + selectedOffer.businessLogo} alt={selectedOffer.business} className="w-full h-full object-cover" />
                  ) : (
                    <selectedOffer.icon className="w-7 h-7" />
                  )}
                </div>
                <span className="font-bold text-lg text-[hsl(var(--foreground))]">{selectedOffer.business}</span>
              </div>
              <h2 className="text-3xl font-black text-[hsl(var(--foreground))] leading-tight">{selectedOffer.title}</h2>
            </div>

            {/* Modal Body */}
            <div className="p-8 pt-6">
              <h4 className="font-bold text-[hsl(var(--foreground))] mb-2 uppercase text-xs tracking-wider opacity-60">About this offer</h4>
              <p className="text-[hsl(var(--muted-foreground))] leading-relaxed mb-8">
                {selectedOffer.description}
              </p>
              
              <div className="flex items-center justify-between pt-6 border-t border-[hsl(var(--border))]/50">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-1">Cost</p>
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-emerald-500" />
                    <span className="font-black text-2xl text-[hsl(var(--foreground))]">{selectedOffer.cost}</span>
                  </div>
                </div>
                {!isBusinessUser ? (
                  <button
                    onClick={handleConfirmExchange}
                    className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-md shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    Confirm Exchange
                  </button>
                ) : (
                  <button disabled className="px-8 py-3.5 bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] rounded-xl font-bold cursor-not-allowed">
                    Not available for business
                  </button>
                )}
              </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
