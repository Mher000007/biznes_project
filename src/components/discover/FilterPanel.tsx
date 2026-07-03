"use client";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { setCategory, setCity, resetFilters } from "@/store/slices/filterSlice";
import { CATEGORIES } from "@/lib/constants";
import { LocationSelect } from "@/components/ui/LocationSelect";
import { SlidersHorizontal, X } from "lucide-react";

export default function FilterPanel() {
  const dispatch = useDispatch();
  const filters = useSelector((s: RootState) => s.filters);

  const hasFilters = filters.category || filters.city;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <SlidersHorizontal className="h-4 w-4" /> Filters
        </div>
        {hasFilters && (
          <button onClick={() => dispatch(resetFilters())} className="flex items-center gap-1 text-xs text-[hsl(var(--primary))] hover:underline">
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-xs font-medium mb-2 text-[hsl(var(--muted-foreground))]">Category</label>
        <select
          value={filters.category}
          onChange={(e) => dispatch(setCategory(e.target.value))}
          className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/20"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* City */}
      <div>
        <label className="block text-xs font-medium mb-2 text-[hsl(var(--muted-foreground))]">City</label>
        <LocationSelect
          value={filters.city}
          onChange={(e) => dispatch(setCity(e.target.value))}
          className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/20"
          placeholder="All Cities"
          disablePlaceholder={false}
        />
      </div>
    </div>
  );
}
