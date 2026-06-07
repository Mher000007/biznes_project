import Link from "next/link";
import { Star, MapPin, BadgeCheck } from "lucide-react";
import type { Business } from "@/types/business";

export default function BusinessCard({ business }: { business: Business }) {
  return (
    <Link href={`/business/${business.slug}`}
      className="group rounded-xl border border-[hsl(var(--border))] p-4 transition-all hover:shadow-md hover:border-[hsl(var(--muted-foreground))]/20">
      <div className="flex items-center gap-3 mb-3">
        {business.logoUrl ? (
          <img 
            src={business.logoUrl} 
            alt={business.name} 
            className="h-10 w-10 shrink-0 rounded-lg object-cover" 
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--muted))] text-sm font-semibold text-[hsl(var(--muted-foreground))]">
            {business.name[0]}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-sm font-medium truncate group-hover:text-[hsl(var(--accent))] transition-colors">{business.name}</h3>
          <p className="text-[11px] text-[hsl(var(--muted-foreground))]">{business.category.name}</p>
        </div>
        {business.isVerified && <BadgeCheck className="h-4 w-4 text-[hsl(var(--accent))] shrink-0 ml-auto" />}
      </div>
      <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-2 mb-3">{business.shortDescription}</p>
      <div className="flex items-center justify-between text-[11px] text-[hsl(var(--muted-foreground))]">
        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{business.city}</span>
        <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{business.ratingAvg}</span>
      </div>
    </Link>
  );
}
