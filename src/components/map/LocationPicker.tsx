"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { MapPin, Search, Loader2, X } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LocationPickerProps {
  lat?: number;
  lng?: number;
  onLocationChange?: (lat: number, lng: number, address: string) => void;
  readonly?: boolean;
  height?: string;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export default function LocationPicker({
  lat = 40.1872,
  lng = 44.5152,
  onLocationChange,
  readonly = false,
  height = "300px",
}: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [position, setPosition] = useState({ lat, lng });
  const [address, setAddress] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [reversing, setReversing] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const markerIcon = L.divIcon({
    className: "",
    html: `<div style="width:36px;height:36px;background:#111;border-radius:50%;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });

  // Move map + marker to position
  const flyTo = useCallback((newLat: number, newLng: number) => {
    const map = mapInstance.current;
    const marker = markerRef.current;
    if (map && marker) {
      marker.setLatLng([newLat, newLng]);
      map.flyTo([newLat, newLng], 17, { duration: 1 });
    }
  }, []);

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
        setAddress(data.display_name);
        onLocationChange?.(rlat, rlng, data.display_name);
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
    onLocationChange?.(newLat, newLng, result.display_name);
    setTimeout(() => flyTo(newLat, newLng), 50);
  };

  // Init map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: !readonly,
      scrollWheelZoom: !readonly,
      dragging: !readonly,
      attributionControl: false,
    }).setView([lat, lng], 14);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    L.control.attribution({ position: "bottomright", prefix: false })
      .addAttribution('© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>')
      .addTo(map);

    const marker = L.marker([lat, lng], { icon: markerIcon, draggable: !readonly }).addTo(map);
    markerRef.current = marker;
    mapInstance.current = map;

    if (!readonly) {
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        setPosition({ lat: pos.lat, lng: pos.lng });
        reverseGeocode(pos.lat, pos.lng);
      });

      map.on("click", (e: L.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
        reverseGeocode(e.latlng.lat, e.latlng.lng);
      });

      reverseGeocode(lat, lng);
    }

    // Fix tile rendering on container resize
    const resizeTimer = setTimeout(() => {
      if (mapInstance.current) {
        map.invalidateSize();
      }
    }, 200);

    return () => {
      clearTimeout(resizeTimer);
      map.remove();
      mapInstance.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync with external coordinates updates (e.g. after async loading)
  useEffect(() => {
    if (mapInstance.current && markerRef.current) {
      const currentPos = markerRef.current.getLatLng();
      const diffLat = Math.abs(currentPos.lat - lat);
      const diffLng = Math.abs(currentPos.lng - lng);
      if (diffLat > 0.0001 || diffLng > 0.0001) {
        setPosition({ lat, lng });
        markerRef.current.setLatLng([lat, lng]);
        mapInstance.current.setView([lat, lng], mapInstance.current.getZoom());
        reverseGeocode(lat, lng);
      }
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

      <div ref={mapRef} style={{ height }} className="rounded-xl border border-[hsl(var(--border))] overflow-hidden" />

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
