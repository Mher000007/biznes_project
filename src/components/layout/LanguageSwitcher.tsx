"use client";
import { useI18n, LOCALE_LABELS, type Locale } from "@/i18n";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const locales: Locale[] = ["en", "hy", "ru"];

  return (
    <div className="flex items-center rounded-lg border border-[hsl(var(--border))] overflow-hidden">
      {locales.map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={`px-2 py-1 text-[11px] font-medium transition-colors ${
            locale === l
              ? "bg-[hsl(var(--foreground))] text-[hsl(var(--background))]"
              : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          }`}
        >
          {LOCALE_LABELS[l]}
        </button>
      ))}
    </div>
  );
}
