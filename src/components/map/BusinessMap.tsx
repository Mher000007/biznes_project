"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Navigation, MapPin, Loader2 } from "lucide-react";

const LocationPicker = dynamic(() => import("@/components/map/LocationPicker"), {
  ssr: false,
  loading: () => <div className="h-[220px] rounded-xl bg-[hsl(var(--muted))] animate-pulse" />,
});

interface BusinessMapProps {
  lat: number;
  lng: number;
  name: string;
  address: string;
}

export default function BusinessMap({ lat, lng, address }: BusinessMapProps) {
  const [resolvedAddress, setResolvedAddress] = useState(address);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await res.json();
        if (data.display_name) setResolvedAddress(data.display_name);
      } catch { /* keep original */ }
      setLoading(false);
    })();
  }, [lat, lng]);

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return (
    <div className="rounded-xl border border-[hsl(var(--border))] overflow-hidden">
      <LocationPicker lat={lat} lng={lng} readonly height="220px" />
      <div className="p-3 space-y-2.5 border-t border-[hsl(var(--border))]">
        <div className="flex items-start gap-2">
          <MapPin className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))] mt-0.5 shrink-0" />
          {loading ? (
            <span className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Loading...</span>
          ) : (
            <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">{resolvedAddress}</p>
          )}
        </div>
        <a href={directionsUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full h-9 rounded-lg text-[13px] font-medium btn-primary">
          <Navigation className="h-3.5 w-3.5" /> Get Directions
        </a>
      </div>
    </div>
  );
}
