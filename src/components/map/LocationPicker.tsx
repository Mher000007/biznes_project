"use client";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { MapPin, Search, Loader2, X } from "lucide-react";
import LeafletMap from "@/components/map/LeafletMap";
import { useI18n } from "@/i18n";
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

const EMPTY_MARKERS: any[] = [];

export default function LocationPicker({
  lat = 40.1872,
  lng = 44.5152,
  onLocationChange,
  readonly = false,
  height = "300px",
}: LocationPickerProps) {
  const { t, locale } = useI18n();
  const [position, setPosition] = useState({ lat, lng });
  const [mapCenter, setMapCenter] = useState({ lat, lng });
  const [address, setAddress] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [reversing, setReversing] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const [mapModalOpen, setMapModalOpen] = useState(false);

  const memoizedCenter = useMemo(() => [mapCenter.lat, mapCenter.lng] as [number, number], [mapCenter.lat, mapCenter.lng]);

  // Reverse geocode
  const reverseGeocode = useCallback(async (rlat: number, rlng: number) => {
    setReversing(true);
    try {
      const res = await fetch(
        `/api/geocode?lat=${rlat}&lon=${rlng}`,
        { headers: { "Accept-Language": locale } }
      );
      if (!res.ok) throw new Error("Reverse geocode failed");
      const data = await res.json();
      if (data.display_name) {
        const extractedCity = parseCityFromNominatim(data);
        setAddress(data.display_name);
        setSearchQuery(data.display_name);
        onLocationChange?.(rlat, rlng, data.display_name, extractedCity);
      } else {
        const fallback = `${rlat.toFixed(5)}, ${rlng.toFixed(5)}`;
        setAddress(fallback);
        setSearchQuery(fallback);
      }
    } catch {
      const fallback = `${rlat.toFixed(5)}, ${rlng.toFixed(5)}`;
      setAddress(fallback);
      setSearchQuery(fallback);
    }
    setReversing(false);
  }, [onLocationChange, locale]);

  // Forward search
  const searchAddress = useCallback(async (query: string) => {
    if (query.length < 3) { setSuggestions([]); return; }
    setSearching(true);
    try {
      const res = await fetch(
        `/api/geocode?q=${encodeURIComponent(query)}`,
        { headers: { "Accept-Language": locale } }
      );
      if (!res.ok) throw new Error("Search failed");
      setSuggestions(await res.json());
    } catch { setSuggestions([]); }
    setSearching(false);
  }, [locale]);

  const handleSearchInput = (val: string) => {
    setSearchQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchAddress(val), 400);
  };

  const selectSuggestion = (result: NominatimResult) => {
    const newLat = parseFloat(result.lat);
    const newLng = parseFloat(result.lon);
    setPosition({ lat: newLat, lng: newLng });
    setMapCenter({ lat: newLat, lng: newLng });
    setAddress(result.display_name);
    setSearchQuery(result.display_name);
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
      setMapCenter({ lat, lng });
      reverseGeocode(lat, lng);
    }
  }, [lat, lng, reverseGeocode]);

  return (
    <div className="space-y-2 w-full">
      {!readonly ? (
        <>
          <button 
            type="button" 
            onClick={() => {
              if (address) {
                setSearchQuery(address);
              } else {
                reverseGeocode(position.lat, position.lng);
              }
              setMapModalOpen(true);
            }} 
            className="w-full text-left rounded-lg bg-[hsl(var(--muted))] hover:bg-[hsl(var(--border))] transition-colors px-4 py-3 cursor-pointer border border-transparent flex items-center justify-between group"
          >
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="p-2 bg-[hsl(var(--background))] rounded-full shrink-0 group-hover:scale-110 transition-transform">
                <MapPin className="h-4 w-4 text-[hsl(var(--primary))]" />
              </div>
              <div className="min-w-0 flex-1">
                {reversing ? (
                  <span className="text-sm font-medium text-[hsl(var(--muted-foreground))] flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" /> {t.locationPicker.detecting}</span>
                ) : address ? (
                  <p className="text-sm leading-relaxed font-medium text-[hsl(var(--foreground))]">{address}</p>
                ) : (
                  <p className="text-sm font-medium text-[hsl(var(--foreground))]">{t.locationPicker.clickToSet}</p>
                )}
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 font-mono bg-[hsl(var(--background))]/50 inline-block px-1.5 py-0.5 rounded">{position.lat.toFixed(6)}, {position.lng.toFixed(6)}</p>
              </div>
            </div>
            <div className="shrink-0 pl-3">
              <span className="text-xs font-bold text-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 px-2.5 py-1.5 rounded-lg">{t.locationPicker.openMap}</span>
            </div>
          </button>

          {mapModalOpen && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-[hsl(var(--background))] border border-[hsl(var(--border))] w-full max-w-3xl h-[85vh] md:h-[75vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                
                <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] shrink-0">
                  <h3 className="font-bold text-[hsl(var(--foreground))] flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-[hsl(var(--primary))]" />
                    {t.locationPicker.setLocation}
                  </h3>
                  <button type="button" onClick={() => setMapModalOpen(false)} className="p-2 bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] rounded-full hover:bg-[hsl(var(--border))] transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
                </div>
                
                <div className="p-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))] shrink-0">
                  <div className="relative">
                    <div className="flex items-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] transition-colors focus-within:border-[hsl(var(--primary))] shadow-sm px-1">
                      <Search className="h-4.5 w-4.5 text-[hsl(var(--muted-foreground))] ml-3 shrink-0" />
                      <input
                        type="text"
                        value={reversing ? "" : searchQuery}
                        onChange={(e) => handleSearchInput(e.target.value)}
                        placeholder={reversing ? t.locationPicker.detecting : t.locationPicker.searchAddress}
                        className="flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-[hsl(var(--muted-foreground))]"
                        disabled={reversing}
                      />
                      {(searching || reversing) && <Loader2 className="h-4 w-4 text-[hsl(var(--primary))] mr-3 animate-spin" />}
                      {searchQuery && !searching && !reversing && (
                        <button onClick={() => { setSearchQuery(""); setSuggestions([]); }} className="mr-2 p-1.5 bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] rounded-md hover:text-[hsl(var(--foreground))] cursor-pointer">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    {suggestions.length > 0 && (
                      <div className="absolute z-[1000] mt-1.5 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-xl overflow-hidden max-h-56 overflow-y-auto">
                        {suggestions.map((s) => (
                          <button
                            key={s.place_id}
                            onClick={() => selectSuggestion(s)}
                            className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-[hsl(var(--muted))] transition-colors border-b border-[hsl(var(--border))]/50 last:border-0 cursor-pointer"
                          >
                            <MapPin className="h-4 w-4 text-[hsl(var(--primary))] mt-0.5 shrink-0" />
                            <span className="text-sm leading-relaxed font-medium">{s.display_name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 relative bg-[hsl(var(--muted))]/30 z-0">
                  <LeafletMap
                    center={memoizedCenter}
                    zoom={15}
                    fixedCenterMarker={!readonly}
                    onMapMoveEnd={handleMapAction}
                    markers={readonly ? [
                      {
                        id: "picker-marker",
                        lat: position.lat,
                        lng: position.lng,
                        draggable: false,
                      }
                    ] : EMPTY_MARKERS}
                    height="100%"
                    scrollWheelZoom={true}
                    hideFullscreenControl={true}
                    hideRadarControl={true}
                    zoomControl={false}
                  />
                </div>

                <div className="p-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--card))] flex justify-between items-center shrink-0">
                  <p className="text-xs text-[hsl(var(--muted-foreground))] hidden sm:block">{t.locationPicker.moveMapHint}</p>
                  <div className="flex gap-3 w-full sm:w-auto justify-end">
                    <button type="button" onClick={() => setMapModalOpen(false)} className="px-5 py-2.5 text-sm font-semibold rounded-xl hover:bg-[hsl(var(--muted))] transition-colors cursor-pointer">{t.locationPicker.cancel}</button>
                    <button type="button" onClick={() => setMapModalOpen(false)} className="btn-primary px-6 py-2.5 text-sm font-bold shadow-md cursor-pointer">{t.locationPicker.confirmLocation}</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl border border-[hsl(var(--border))] overflow-hidden shadow-sm">
          <LeafletMap
            center={[position.lat, position.lng]}
            zoom={14}
            markers={[
              {
                id: "picker-marker",
                lat: position.lat,
                lng: position.lng,
                draggable: false,
              }
            ]}
            height={height}
            readonly={true}
            hideFullscreenControl={true}
          />
        </div>
      )}
    </div>
  );
}

