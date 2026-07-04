"use client";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { setCategory, setCity, resetFilters } from "@/store/slices/filterSlice";
import { CATEGORIES } from "@/lib/constants";
import { LocationSelect } from "@/components/ui/LocationSelect";
import { SlidersHorizontal, X } from "lucide-react";
import { useI18n } from "@/i18n";

export default function FilterPanel() {
  const dispatch = useDispatch();
  const filters = useSelector((s: RootState) => s.filters);
  const { t } = useI18n();

  const hasFilters = filters.category || filters.city;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <SlidersHorizontal className="h-4 w-4" /> {t.discover.filters}
        </div>
        {hasFilters && (
          <button onClick={() => dispatch(resetFilters())} className="flex items-center gap-1 text-xs text-[hsl(var(--primary))] hover:underline">
            <X className="h-3 w-3" /> {t.discover.clear}
          </button>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-xs font-medium mb-2 text-[hsl(var(--muted-foreground))]">{t.register.category}</label>
        <select
          value={filters.category}
          onChange={(e) => dispatch(setCategory(e.target.value))}
          className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/20"
        >
          <option value="">{t.discover.allCategories}</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* City */}
      <div>
        <label className="block text-xs font-medium mb-2 text-[hsl(var(--muted-foreground))]">{t.register.city}</label>
        <LocationSelect
          value={filters.city}
          onChange={(e) => dispatch(setCity(e.target.value))}
          className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/20"
          placeholder={t.discover.allCities}
          disablePlaceholder={false}
        />
      </div>
    </div>
  );
}
