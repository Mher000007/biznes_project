"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { en, type Translations } from "./en";
import { hy } from "./hy";
import { ru } from "./ru";

export type Locale = "en" | "hy" | "ru";

const translations: Record<Locale, Translations> = { en, hy, ru };

export const LOCALE_LABELS: Record<Locale, string> = { en: "EN", hy: "HY", ru: "RU" };

interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextType>({ locale: "en", setLocale: () => { }, t: en });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const saved = localStorage.getItem("armbiz-locale") as Locale;
    if (saved && translations[saved]) {
      setLocaleState(saved);
      if (!document.cookie.includes("NEXT_LOCALE=")) {
        document.cookie = `NEXT_LOCALE=${saved}; path=/; max-age=31536000; SameSite=Lax`;
      }
    }
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("armbiz-locale", l);
    document.cookie = `NEXT_LOCALE=${l}; path=/; max-age=31536000; SameSite=Lax`;
    document.documentElement.lang = l;
    
    // Refresh the router so Server Components re-run and pick up the new cookie
    window.location.reload();
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: translations[locale] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() { return useContext(I18nContext); }
