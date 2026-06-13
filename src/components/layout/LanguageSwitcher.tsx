"use client";
import { useI18n, LOCALE_LABELS, type Locale } from "@/i18n";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const locales: Locale[] = ["en", "hy", "ru"];

  return (
    <div className="flex items-center h-9 rounded-lg border border-[hsl(var(--border))] overflow-hidden bg-[hsl(var(--card))]">
      {locales.map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={`h-full px-3 text-xs font-semibold transition-colors flex items-center justify-center cursor-pointer ${
            locale === l
              ? "bg-[hsl(var(--foreground))] text-[hsl(var(--background))]"
              : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/20"
          }`}
        >
          {LOCALE_LABELS[l]}
        </button>
      ))}
    </div>
  );
}
