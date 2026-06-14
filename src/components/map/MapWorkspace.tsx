"use client";
import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import LeafletMap, { LeafletMarkerItem } from "@/components/map/LeafletMap";

// Strict Location Interface
export interface LocationItem {
  id: string | number;
  lat: number;
  lng: number;
  name: string;
  addressDetails?: string;
  category?: string;
  slug?: string;
  rating?: number;
  reviewCount?: number;
}

// Map Component Props
export interface MapWorkspaceProps {
  locations: LocationItem[];
  hoveredLocationId?: string | number | null;
}

export default function MapWorkspace({
  locations,
  hoveredLocationId,
}: MapWorkspaceProps) {
  const theme = useSelector((s: RootState) => s.ui.theme);

  // Yerevan default fallback center coordinates
  const center: [number, number] = locations.length > 0
    ? [locations[0].lat, locations[0].lng]
    : [40.1872, 44.5152];

  // Convert locations data to LeafletMap compatible markers
  const markers: LeafletMarkerItem[] = locations.map((loc) => {
    const popupContent = `
      <div class="popup-content">
        <h4 class="popup-content__title">${loc.name}</h4>
        ${loc.category ? `<p class="popup-content__category">${loc.category}</p>` : ""}
        ${loc.addressDetails ? `<p class="popup-content__address">${loc.addressDetails}</p>` : ""}
      </div>
    `;

    return {
      id: loc.id,
      lat: loc.lat,
      lng: loc.lng,
      popupContent,
      slug: loc.slug,
      name: loc.name,
      category: loc.category,
      rating: loc.rating,
      reviewCount: loc.reviewCount,
    };
  });

  const tileLayerUrl = theme === "dark"
    ? "https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png";

  return (
    <div className="map-viewport-wrapper">
      <LeafletMap
        center={center}
        zoom={locations.length === 1 ? 15 : 13}
        markers={markers}
        height="100%"
        scrollWheelZoom={false}
        zoomControl={true}
        tileLayerUrl={tileLayerUrl}
        tileLayerAttribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        fitAllBounds={true}
        hoveredLocationId={hoveredLocationId}
      />
    </div>
  );
}

