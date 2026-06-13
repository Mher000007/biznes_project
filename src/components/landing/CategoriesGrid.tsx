"use client";
import Link from "next/link";
import { Monitor, Wheat, UtensilsCrossed, ShoppingBag, Building2, Landmark, Heart, GraduationCap, Hammer } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Monitor, Wheat, UtensilsCrossed, ShoppingBag, Building2, Landmark, Heart, GraduationCap, Hammer,
};

export default function CategoriesGrid() {
  return (
    <section className="py-16 sm:py-24 border-t border-[hsl(var(--border))]">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="mb-12">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-2 text-[hsl(var(--foreground))]">Browse by category</h2>
          <p className="text-base text-[hsl(var(--muted-foreground))]">Explore businesses across all major industries in Armenia</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
          {CATEGORIES.map((cat) => {
            const Icon = ICON_MAP[cat.icon] || Monitor;
            return (
              <Link
                key={cat.id}
                href={`/discover?category=${cat.slug}`}
                className="group category-card flex flex-col items-start gap-3 p-5 transition-all"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[hsl(var(--foreground))]">{cat.name}</h3>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{cat.count} listed</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
