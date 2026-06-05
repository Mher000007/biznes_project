"use client";
import { useState } from "react";
import { Search, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n";

export default function HeroSection() {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { t } = useI18n();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/discover?q=${encodeURIComponent(query)}`);
  };

  return (
    <section className="hero-section pt-24 pb-16 sm:pt-32 sm:pb-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="max-w-3xl">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in-up text-[hsl(var(--foreground))]">
            {t.hero.title}
          </h1>
          <p className="text-lg sm:text-xl text-[hsl(var(--muted-foreground))] mb-10 max-w-2xl leading-relaxed animate-fade-in-up" style={{ animationDelay: "0.08s" }}>
            {t.hero.subtitle}
          </p>
          <form onSubmit={handleSearch} className="animate-fade-in-up" style={{ animationDelay: "0.14s" }}>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center max-w-md">
              <div className="flex-1 w-full flex items-center rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] transition-all focus-within:border-[hsl(var(--muted-foreground))]">
                <Search className="h-4 w-4 text-[hsl(var(--muted-foreground))] ml-3.5 shrink-0" />
                <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.hero.searchPlaceholder} className="flex-1 bg-transparent text-sm outline-none placeholder:text-[hsl(var(--muted-foreground))] py-3 px-3" />
              </div>
              <button type="submit" className="w-full sm:w-auto px-5 py-3 flex items-center justify-center gap-2 rounded-lg btn-primary shrink-0 text-sm font-medium">
                {t.hero.search} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8 mt-12 text-sm animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <span className="text-[hsl(var(--muted-foreground))]"><strong className="text-[hsl(var(--foreground))] font-semibold">900+</strong> {t.hero.businesses}</span>
            <span className="text-[hsl(var(--muted-foreground))]"><strong className="text-[hsl(var(--foreground))] font-semibold">15</strong> {t.hero.cities}</span>
            <span className="text-[hsl(var(--muted-foreground))]"><strong className="text-[hsl(var(--foreground))] font-semibold">8</strong> {t.hero.industries}</span>
          </div>
        </div>
      </div>
    </section>
  );
}