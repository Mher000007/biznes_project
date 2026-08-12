"use client";

import React, { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";

interface CustomServiceSelectProps {
  value: any;
  onChange: (val: string) => void;
  businessOffers: any[];
  businessServices: any[];
  locale: string;
}

export default function CustomServiceSelect({
  value,
  onChange,
  businessOffers = [],
  businessServices = [],
  locale = "en"
}: CustomServiceSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Find the selected item's label
  let selectedLabel = locale === 'hy' ? "Ընդհանուր այցելություն (General Appointment)" : locale === 'ru' ? "Обычная запись (General Appointment)" : "General Appointment";
  if (value && value !== "General Appointment") {
    const offerMatch = businessOffers.find(o => (o._id || o.packageName) === value);
    if (offerMatch) {
      selectedLabel = `${offerMatch.packageName} — ${offerMatch.price ? Number(offerMatch.price).toLocaleString() + " AMD" : ""}`;
    } else {
      const srvMatch = businessServices.find(s => (s._id || s.id || s.name) === value);
      if (srvMatch) {
        selectedLabel = `${srvMatch.name} ${srvMatch.price ? "— " + Number(srvMatch.price).toLocaleString() + " AMD" : ""}`;
      }
    }
  }

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]/50 rounded-xl px-3 py-2.5 text-xs text-[hsl(var(--foreground))] outline-none transition-all duration-200 font-semibold cursor-pointer shadow-sm group"
      >
        <span className="truncate pr-2">{selectedLabel}</span>
        <ChevronDown className={`w-4 h-4 text-[hsl(var(--muted-foreground))] transition-transform duration-300 ${isOpen ? "rotate-180 text-[hsl(var(--primary))]" : "group-hover:text-[hsl(var(--foreground))]"}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-[100] bg-[hsl(var(--card))] border border-[hsl(var(--border))]/70 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.15)] rounded-2xl overflow-hidden animate-in fade-in zoom-in-[0.98] duration-200 backdrop-blur-xl">
          <div className="max-h-64 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {/* General Appointment */}
            <div
              onClick={() => handleSelect("General Appointment")}
              className={`px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center justify-between ${
                value === "General Appointment" || !value
                  ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"
                  : "hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]"
              }`}
            >
              <span>{locale === 'hy' ? "Ընդհանուր այցելություն (General Appointment)" : locale === 'ru' ? "Обычная запись (General Appointment)" : "General Appointment"}</span>
              {(value === "General Appointment" || !value) && <Check className="w-4 h-4" />}
            </div>

            {/* Offers Group */}
            {businessOffers.length > 0 && (
              <div className="pt-2">
                <div className="px-3 pb-1.5 flex items-center gap-2">
                  <div className="h-px flex-1 bg-[hsl(var(--border))]/50"></div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
                    <span className="text-sm">🍽️</span> {locale === 'hy' ? "Menus & Offers Առաջարկներ" : locale === 'ru' ? "Предложения Menus & Offers" : "Menus & Offers Packages"}
                  </span>
                  <div className="h-px flex-1 bg-[hsl(var(--border))]/50"></div>
                </div>
                <div className="space-y-0.5">
                  {businessOffers.map((off: any) => {
                    const val = off._id || off.packageName;
                    const isSelected = value === val;
                    return (
                      <div
                        key={val}
                        onClick={() => handleSelect(val)}
                        className={`px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center justify-between group ${
                          isSelected
                            ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"
                            : "hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]"
                        }`}
                      >
                        <div className="flex flex-col gap-0.5 pr-2">
                          <span className="truncate">{off.packageName}</span>
                          <span className={`text-[10px] ${isSelected ? "text-[hsl(var(--primary))]/70" : "text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))]/70"}`}>
                            {off.price ? `${Number(off.price).toLocaleString()} AMD` : ""} • {off.pax || 1} {locale === 'hy' ? "անձ" : locale === 'ru' ? "чел." : "pax"}
                          </span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Services Group */}
            {businessServices && businessServices.length > 0 && (
              <div className="pt-2">
                <div className="px-3 pb-1.5 flex items-center gap-2">
                  <div className="h-px flex-1 bg-[hsl(var(--border))]/50"></div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
                    <span className="text-sm">💼</span> {locale === 'hy' ? "Ծառայություններ" : locale === 'ru' ? "Услуги" : "Services"}
                  </span>
                  <div className="h-px flex-1 bg-[hsl(var(--border))]/50"></div>
                </div>
                <div className="space-y-0.5">
                  {businessServices.map((srv: any, idx: number) => {
                    const val = srv._id || srv.id || srv.name;
                    const isSelected = value === val;
                    return (
                      <div
                        key={val || idx}
                        onClick={() => handleSelect(val)}
                        className={`px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center justify-between group ${
                          isSelected
                            ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"
                            : "hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]"
                        }`}
                      >
                        <div className="flex flex-col gap-0.5 pr-2">
                          <span className="truncate">{srv.name}</span>
                          {srv.price && (
                            <span className={`text-[10px] ${isSelected ? "text-[hsl(var(--primary))]/70" : "text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))]/70"}`}>
                              {Number(srv.price).toLocaleString()} AMD
                            </span>
                          )}
                        </div>
                        {isSelected && <Check className="w-4 h-4 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
