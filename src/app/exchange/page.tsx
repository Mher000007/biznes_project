"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import { ExchangeIllustration } from "@/components/ui/ExchangeIllustration";
import { ArrowDown, Coins, ShieldCheck, Zap, X, UserPlus, Gift, Send } from "lucide-react";
import { useI18n } from "@/i18n";

const OFFERS = [
  {
    id: 1,
    title: "Free Artisan Coffee",
    business: "Cafe Central",
    cost: 150,
    category: "Food & Drink",
    bgClass: "bg-emerald-500/10",
    textClass: "text-emerald-600 dark:text-emerald-400",
    icon: Coins,
    description: "Start your morning right! Redeem this offer for any medium-sized artisan coffee or tea at Cafe Central. Valid for dine-in or takeout. Limit one per customer."
  },
  {
    id: 2,
    title: "20% Off Dinner Menu",
    business: "Bistro Noir",
    cost: 500,
    category: "Food & Drink",
    bgClass: "bg-blue-500/10",
    textClass: "text-blue-600 dark:text-blue-400",
    icon: Zap,
    description: "Enjoy a luxurious evening at Bistro Noir with a 20% discount on all dinner menu items. Excludes alcoholic beverages. Reservation required."
  },
  {
    id: 3,
    title: "1 Month Gym Access",
    business: "FitLife Gym",
    cost: 2500,
    category: "Fitness & Health",
    bgClass: "bg-purple-500/10",
    textClass: "text-purple-600 dark:text-purple-400",
    icon: ShieldCheck,
    description: "Get fully unlimited access to all FitLife Gym facilities, group classes, and sauna for one entire month. Start your premium fitness journey today!"
  }
];

export default function ExchangePage() {
  const { t } = useI18n();
  const [selectedOffer, setSelectedOffer] = useState<any>(null);

  const [offerCategory, setOfferCategory] = useState<string>('All');

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
              {/* Categories */}
              <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                {['All', 'Food & Drink', 'Fitness & Health', 'Services'].map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setOfferCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${offerCategory === cat ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] border border-transparent'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Offers Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {OFFERS.filter(o => offerCategory === 'All' || o.category === offerCategory).map((offer) => (
                  <div 
                    key={offer.id}
                    onClick={() => setSelectedOffer(offer)}
                    className="group bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col cursor-pointer"
                  >
                    <div className={`absolute top-0 right-0 w-32 h-32 ${offer.bgClass} rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110`} />
                    <div className={`w-12 h-12 rounded-2xl ${offer.bgClass} ${offer.textClass} flex items-center justify-center mb-6`}>
                      <offer.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-[hsl(var(--foreground))] mb-2">{offer.title}</h3>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6 flex-1">Offered by <span className="font-semibold text-[hsl(var(--foreground))]">{offer.business}</span></p>
                    
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
                
                {OFFERS.filter(o => offerCategory === 'All' || o.category === offerCategory).length === 0 && (
                  <div className="col-span-full py-12 text-center text-[hsl(var(--muted-foreground))]">
                    No offers found in this category.
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
              
              <div className={`w-16 h-16 rounded-2xl bg-[hsl(var(--card))] shadow-sm ${selectedOffer.textClass} flex items-center justify-center mb-4`}>
                <selectedOffer.icon className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-[hsl(var(--foreground))]">{selectedOffer.title}</h2>
              <p className="text-sm font-medium opacity-80 mt-1">Offered by <span className="font-bold">{selectedOffer.business}</span></p>
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
                <button className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-md shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all">
                  Confirm Exchange
                </button>
              </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
