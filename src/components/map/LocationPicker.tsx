"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { MapPin, Search, Loader2, X } from "lucide-react";
import LeafletMap from "@/components/map/LeafletMap";

import { ARMENIA_LOCATIONS } from "@/data/locations";
import { transliterateArmenian } from "@/lib/transliterate";

interface LocationPickerProps {
  lat?: number;
  lng?: number;
  onLocationChange?: (lat: number, lng: number, address: string, city?: string) => void;
  readonly?: boolean;
  height?: string;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: Record<string, string>;
}

function matchArmeniaLocation(queryStr: string): string | null {
  if (!queryStr) return null;
  const clean = queryStr.trim().toLowerCase();
  if (clean === "armenia" || clean === "հայաստան") return null;

  for (const reg of ARMENIA_LOCATIONS) {
    const regArm = reg.name.toLowerCase();
    const regEn = transliterateArmenian(reg.name, "en").toLowerCase();
    const regRu = transliterateArmenian(reg.name, "ru").toLowerCase();
    if (clean === regArm || clean === regEn || clean === regRu) return reg.name;

    for (const comm of reg.communities || []) {
      const commArm = comm.name.toLowerCase();
      const commEn = transliterateArmenian(comm.name, "en").toLowerCase();
      const commRu = transliterateArmenian(comm.name, "ru").toLowerCase();
      if (clean === commArm || clean === commEn || clean === commRu) return comm.name;

      for (const dist of comm.districts || []) {
        const distArm = dist.toLowerCase();
        const distEn = transliterateArmenian(dist, "en").toLowerCase();
        const distRu = transliterateArmenian(dist, "ru").toLowerCase();
        if (clean === distArm || clean === distEn || clean === distRu) {
          return `${dist} (${reg.name})`;
        }
      }

      for (const vil of comm.villages || []) {
        const vilArm = vil.toLowerCase();
        const vilEn = transliterateArmenian(vil, "en").toLowerCase();
        const vilRu = transliterateArmenian(vil, "ru").toLowerCase();
        if (clean === vilArm || clean === vilEn || clean === vilRu) return vil;
      }
    }
  }
  return null;
}

function parseCityFromNominatim(data: any): string {
  if (!data) return "";
  const addr = data.address || {};

  const candidates = [
    addr.city,
    addr.town,
    addr.village,
    addr.municipality,
    addr.suburb,
    addr.district,
    addr.county,
    addr.state,
  ].filter(Boolean);

  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) {
      const matched = matchArmeniaLocation(c);
      if (matched) return matched;
    }
  }

  if (data.display_name && typeof data.display_name === "string") {
    const parts = data.display_name.split(",").map((p: string) => p.trim());
    for (const part of parts) {
      if (part && part.toLowerCase() !== "armenia" && !/^\d+$/.test(part)) {
        const matched = matchArmeniaLocation(part);
        if (matched) return matched;
      }
    }
    if (candidates.length > 0) return candidates[0];
    if (parts.length > 0) return parts[0];
  }

  return "";
}

export default function LocationPicker({
  lat = 40.1872,
  lng = 44.5152,
  onLocationChange,
  readonly = false,
  height = "300px",
}: LocationPickerProps) {
  const [position, setPosition] = useState({ lat, lng });
  const [address, setAddress] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [reversing, setReversing] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Reverse geocode
  const reverseGeocode = useCallback(async (rlat: number, rlng: number) => {
    setReversing(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${rlat}&lon=${rlng}&zoom=18&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      if (data.display_name) {
        const extractedCity = parseCityFromNominatim(data);
        setAddress(data.display_name);
        onLocationChange?.(rlat, rlng, data.display_name, extractedCity);
      }
    } catch {
      setAddress(`${rlat.toFixed(5)}, ${rlng.toFixed(5)}`);
    }
    setReversing(false);
  }, [onLocationChange]);

  // Forward search
  const searchAddress = useCallback(async (query: string) => {
    if (query.length < 3) { setSuggestions([]); return; }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=am&limit=5&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      setSuggestions(await res.json());
    } catch { setSuggestions([]); }
    setSearching(false);
  }, []);

  const handleSearchInput = (val: string) => {
    setSearchQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchAddress(val), 400);
  };

  const selectSuggestion = (result: NominatimResult) => {
    const newLat = parseFloat(result.lat);
    const newLng = parseFloat(result.lon);
    setPosition({ lat: newLat, lng: newLng });
    setAddress(result.display_name);
    setSearchQuery("");
    setSuggestions([]);
    const extractedCity = parseCityFromNominatim(result);
    onLocationChange?.(newLat, newLng, result.display_name, extractedCity);
  };

  const handleMapAction = (newLat: number, newLng: number) => {
    if (readonly) return;
    setPosition({ lat: newLat, lng: newLng });
    reverseGeocode(newLat, newLng);
  };

  // Sync with external coordinates updates (e.g. after async loading)
  useEffect(() => {
    const diffLat = Math.abs(position.lat - lat);
    const diffLng = Math.abs(position.lng - lng);
    if (diffLat > 0.0001 || diffLng > 0.0001) {
      setPosition({ lat, lng });
      reverseGeocode(lat, lng);
    }
  }, [lat, lng, reverseGeocode]);

  return (
    <div className="space-y-2">
      {!readonly && (
        <div className="relative">
          <div className="flex items-center rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] transition-colors focus-within:border-[hsl(var(--foreground))]">
            <Search className="h-4 w-4 text-[hsl(var(--muted-foreground))] ml-3 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="Search address in Armenia..."
              className="flex-1 bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-[hsl(var(--muted-foreground))]"
            />
            {searching && <Loader2 className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))] mr-3 animate-spin" />}
            {searchQuery && !searching && (
              <button onClick={() => { setSearchQuery(""); setSuggestions([]); }} className="mr-2 p-0.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {suggestions.length > 0 && (
            <div className="absolute z-[1000] mt-1 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-lg overflow-hidden">
              {suggestions.map((s) => (
                <button
                  key={s.place_id}
                  onClick={() => selectSuggestion(s)}
                  className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-[hsl(var(--muted))] transition-colors border-b border-[hsl(var(--border))] last:border-0"
                >
                  <MapPin className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))] mt-0.5 shrink-0" />
                  <span className="text-xs leading-relaxed">{s.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl border border-[hsl(var(--border))] overflow-hidden">
        <LeafletMap
          center={[position.lat, position.lng]}
          zoom={14}
          markers={[
            {
              id: "picker-marker",
              lat: position.lat,
              lng: position.lng,
              draggable: !readonly,
            }
          ]}
          height={height}
          onMapClick={handleMapAction}
          onMarkerDragEnd={(_, flat, flng) => handleMapAction(flat, flng)}
          readonly={readonly}
          hideFullscreenControl={true}
        />
      </div>

      {!readonly && (
        <div className="rounded-lg bg-[hsl(var(--muted))] px-3 py-2">
          <div className="flex items-start gap-2">
            <MapPin className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))] mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              {reversing ? (
                <span className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Detecting address...</span>
              ) : address ? (
                <p className="text-xs leading-relaxed">{address}</p>
              ) : (
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Click on the map to set location</p>
              )}
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">{position.lat.toFixed(6)}, {position.lng.toFixed(6)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

