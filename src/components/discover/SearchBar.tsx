"use client";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { setQuery } from "@/store/slices/filterSlice";
import { Search } from "lucide-react";

export default function SearchBar() {
  const dispatch = useDispatch();
  const query = useSelector((s: RootState) => s.filters.query);

  return (
    <div className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2">
      <Search className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
      <input
        type="text"
        value={query}
        onChange={(e) => dispatch(setQuery(e.target.value))}
        placeholder="Search businesses..."
        className="w-full bg-transparent text-sm outline-none placeholder:text-[hsl(var(--muted-foreground))]"
      />
    </div>
  );
}
