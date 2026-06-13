"use client";
import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "../../styles/leaflet.css";
import { Maximize2, Minimize2 } from "lucide-react";
import { useRouter } from "next/navigation";

// Resolve default marker icon asset path issues in Webpack/Vite bundlers
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
}

// Marker Item Type
export interface LeafletMarkerItem {
  id: string | number;
  lat: number;
  lng: number;
  popupContent?: string;
  draggable?: boolean;
  slug?: string;
}

// Shared LeafletMap Prop Interface
export interface LeafletMapProps {
  center: [number, number];
  zoom: number;
  markers?: LeafletMarkerItem[];
  height?: string;
  scrollWheelZoom?: boolean;
  zoomControl?: boolean;
  className?: string;
  onMapClick?: (lat: number, lng: number) => void;
  onMarkerDragEnd?: (id: string | number, lat: number, lng: number) => void;
  tileLayerUrl?: string;
  tileLayerAttribution?: string;
  readonly?: boolean;
  fitAllBounds?: boolean;
  hoveredLocationId?: string | number | null;
}

export default function LeafletMap({
  center = [40.1872, 44.5152],
  zoom = 13,
  markers = [],
  height = "100%",
  scrollWheelZoom = false,
  zoomControl = true,
  className = "",
  onMapClick,
  onMarkerDragEnd,
  tileLayerUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  tileLayerAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  readonly = false,
  fitAllBounds = false,
  hoveredLocationId = null,
}: LeafletMapProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const performViewAdjustmentRef = useRef<((animate?: boolean) => void) | null>(null);

  // 1. Initialize Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const centerLat = Number(center[0]);
    const centerLng = Number(center[1]);
    const validCenter: [number, number] = [
      isNaN(centerLat) ? 40.1872 : centerLat,
      isNaN(centerLng) ? 44.5152 : centerLng
    ];

    const map = L.map(containerRef.current, {
      zoomControl: zoomControl && !readonly,
      scrollWheelZoom: scrollWheelZoom,
      dragging: !readonly,
      attributionControl: false,
    }).setView(validCenter, zoom);

    // Setup Tile Layer
    const tileLayer = L.tileLayer(tileLayerUrl, {
      attribution: tileLayerAttribution,
      maxZoom: 19,
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    // Setup Attribution control at bottom right
    L.control.attribution({ position: "bottomright", prefix: false })
      .addAttribution(tileLayerAttribution)
      .addTo(map);

    // Scroll wheel zoom toggle on focus/click/blur
    if (!readonly) {
      const enableScroll = () => map.scrollWheelZoom.enable();
      const disableScroll = () => map.scrollWheelZoom.disable();

      map.on("focus", enableScroll);
      map.on("click", enableScroll);
      map.on("blur", disableScroll);
    }

    // Map Click Listener
    if (onMapClick && !readonly) {
      map.on("click", (e: L.LeafletMouseEvent) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      });
    }

    // Add Layer Group to hold markers dynamically
    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;
    mapRef.current = map;

    // Force map to recalculate container size on load to prevent tile offsets
    const sizeTimer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(sizeTimer);
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      markersGroupRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 1b. Setup dynamic Tile Layer updates
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    const newTileLayer = L.tileLayer(tileLayerUrl, {
      attribution: tileLayerAttribution,
      maxZoom: 19,
    }).addTo(map);
    tileLayerRef.current = newTileLayer;
  }, [tileLayerUrl, tileLayerAttribution]);

  // 2. React to dynamic center & zoom updates
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const centerLat = Number(center[0]);
    const centerLng = Number(center[1]);
    const validCenter: [number, number] = [
      isNaN(centerLat) ? 40.1872 : centerLat,
      isNaN(centerLng) ? 44.5152 : centerLng
    ];

    const currentCenter = map.getCenter();
    const latDiff = Math.abs(currentCenter.lat - validCenter[0]);
    const lngDiff = Math.abs(currentCenter.lng - validCenter[1]);

    if (latDiff > 0.0001 || lngDiff > 0.0001) {
      map.setView(validCenter, zoom);
    }
  }, [center, zoom]);

  // 3. React to dynamic markers updates and handle layout stabilization view centering
  useEffect(() => {
    const map = mapRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    // Clean old markers
    markersGroup.clearLayers();

    const bounds = L.latLngBounds([]);
    const validMarkersList: [number, number][] = [];

    if (markers && markers.length > 0) {
      markers.forEach((m) => {
        const markerLat = Number(m.lat);
        const markerLng = Number(m.lng);
        if (isNaN(markerLat) || isNaN(markerLng)) return;

        const isHovered = m.id === hoveredLocationId;
        let iconOptions = {};

        if (isHovered) {
          iconOptions = {
            icon: L.divIcon({
              html: `
                <div class="pulsing-marker-wrapper">
                  <div class="pulsing-marker-dot"></div>
                  <div class="pulsing-marker-pulse"></div>
                </div>
              `,
              className: "leaflet-pulsing-marker-container",
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            })
          };
        }

        const marker = L.marker([markerLat, markerLng], {
          draggable: m.draggable && !readonly,
          ...iconOptions,
        });

        if (m.popupContent) {
          marker.bindPopup(m.popupContent);
        }

        // Route to page on click
        if (m.slug && !readonly) {
          marker.on("click", () => {
            router.push(`/business/${m.slug}`);
          });
        }

        // Drag Listener
        if (m.draggable && !readonly && onMarkerDragEnd) {
          marker.on("dragend", () => {
            const newPos = marker.getLatLng();
            onMarkerDragEnd(m.id, newPos.lat, newPos.lng);
          });
        }

        marker.addTo(markersGroup);
        bounds.extend([markerLat, markerLng]);
        validMarkersList.push([markerLat, markerLng]);
      });
    }

    const centerLat = Number(center[0]);
    const centerLng = Number(center[1]);
    const validCenter: [number, number] = [
      isNaN(centerLat) ? 40.1872 : centerLat,
      isNaN(centerLng) ? 44.5152 : centerLng
    ];

    // Unified helper to invalidate size and adjust map view/bounds
    const performViewAdjustment = (animate = false) => {
      if (!mapRef.current) return;
      mapRef.current.invalidateSize({ animate: false });
      if (fitAllBounds && validMarkersList.length > 1) {
        mapRef.current.fitBounds(bounds, {
          padding: [40, 40],
          maxZoom: 15,
          animate: animate,
          duration: animate ? 0.8 : undefined,
        });
      } else if (fitAllBounds && validMarkersList.length === 1) {
        mapRef.current.setView(validMarkersList[0], 15, { animate: animate });
      } else {
        // Fallback: center the map on the user-specified center and zoom
        mapRef.current.setView(validCenter, zoom, { animate: animate });
      }
    };

    performViewAdjustmentRef.current = performViewAdjustment;

    // Perform immediately on markers update
    performViewAdjustment(true);

    // Re-perform view adjustments as parent container sizes stabilize
    const timers = [100, 350, 750, 1500, 3000].map(delay => 
      setTimeout(() => {
        const m = mapRef.current;
        if (!m) return;
        const size = m.getSize();
        if (size.x > 0 && size.y > 0) {
          performViewAdjustment(false);
        }
      }, delay)
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [markers, center, zoom, readonly, onMarkerDragEnd, fitAllBounds, hoveredLocationId, router]);

  // 4. Force invalidate size on fullscreen toggle and handle body class
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (isFullscreen) {
      document.body.classList.add("map-fullscreen-active");
    } else {
      document.body.classList.remove("map-fullscreen-active");
    }

    const timer = setTimeout(() => {
      if (performViewAdjustmentRef.current) {
        performViewAdjustmentRef.current(false);
      } else {
        map.invalidateSize();
      }
    }, 150);

    return () => {
      document.body.classList.remove("map-fullscreen-active");
      clearTimeout(timer);
    };
  }, [isFullscreen]);

  // 5. Safe ResizeObserver to keep map container sized correctly and re-center on size changes
  useEffect(() => {
    const map = mapRef.current;
    const container = containerRef.current;
    if (!map || !container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          if (performViewAdjustmentRef.current) {
            performViewAdjustmentRef.current(false);
          } else {
            map.invalidateSize({ animate: false });
          }
        }
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // 5b. Centering map view on hovered marker coords
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !hoveredLocationId || !markers || markers.length === 0) return;

    const matched = markers.find((m) => m.id === hoveredLocationId);
    if (matched) {
      map.setView([matched.lat, matched.lng], 15, {
        animate: true,
        duration: 0.6,
      });
    }
  }, [hoveredLocationId, markers]);

  return (
    <div 
      className={`leaflet-map-outer-wrapper ${isFullscreen ? "fullscreen-mode" : ""} ${className}`}
      style={{ width: "100%", height: isFullscreen ? "100vh" : height, position: "relative" }}
    >
      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%" }}
        className="leaflet-map-wrapper leaflet-container"
      />
      <button
        type="button"
        onClick={() => setIsFullscreen(prev => !prev)}
        className="leaflet-fullscreen-toggle-btn"
        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
      >
        {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
      </button>
    </div>
  );
}
