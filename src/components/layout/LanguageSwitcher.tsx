"use client";
import { useI18n, type Locale } from "@/i18n";
import { useState, useRef, useEffect } from "react";

const FLAGS: Record<Locale, string> = {
  en: "🇺🇸",
  hy: "🇦🇲",
  ru: "🇷🇺",
};

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const locales: Locale[] = ["en", "hy", "ru"];
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="language-switcher-btn flex items-center justify-between min-w-[50px] h-9 px-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-base transition-colors hover:bg-[hsl(var(--muted))]/50"
      >
        <span>{FLAGS[locale]}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`ml-1.5 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1.5 min-w-[50px] max-h-[130px] rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-lg overflow-y-auto z-50 flex flex-col">
          {locales.map((l) => (
            <button
              key={l}
              onClick={() => {
                setLocale(l);
                setIsOpen(false);
              }}
              className={`px-3 py-2 text-base text-center transition-colors ${
                locale === l
                  ? "bg-[hsl(var(--muted))]"
                  : "hover:bg-[hsl(var(--muted))]/50"
              }`}
            >
              {FLAGS[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
