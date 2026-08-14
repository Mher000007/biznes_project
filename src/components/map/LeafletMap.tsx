"use client";
import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "../../styles/leaflet.css";
import { Maximize2, Minimize2, Bookmark } from "lucide-react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

// Resolve default marker icon asset path issues in Webpack/Vite bundlers
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
}

// ─── Icon builders ────────────────────────────────────────────────────────────

function buildDefaultIcon(plan?: string, isOpen: boolean = true): L.DivIcon {
  const isPremium = plan === 'premium';
  const fillColor = isPremium ? "#eab308" : "#10b981";
  const innerFill = isPremium ? "#eab308" : "#10b981";
  const opacityStyle = isOpen
    ? "opacity: 1;"
    : "opacity: 0.45; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15)) grayscale(0.4);";

  return L.divIcon({
    html: `
      <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg"
           style="filter:drop-shadow(0 3px 6px rgba(0,0,0,0.30));display:block;${opacityStyle}">
        <path d="M14 0C6.268 0 0 6.268 0 14c0 9.5 14 22 14 22S28 23.5 28 14C28 6.268 21.732 0 14 0z"
              fill="${fillColor}"/>
        <circle cx="14" cy="14" r="6.5" fill="white" fill-opacity="0.95"/>
        <rect x="10" y="10" width="8" height="8" rx="0.8" fill="${innerFill}"/>
        <rect x="12" y="14" width="2" height="4" fill="white"/>
        <rect x="11" y="11" width="2.2" height="2.2" fill="white" fill-opacity="0.75"/>
        <rect x="14.8" y="11" width="2.2" height="2.2" fill="white" fill-opacity="0.75"/>
      </svg>
    `,
    className: `leaflet-custom-pin-icon ${isOpen ? '' : 'is-closed-pin'}`,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
    tooltipAnchor: [16, -18],
  });
}

function buildHoveredIcon(): L.DivIcon {
  return L.divIcon({
    html: `
      <div class="pulsing-marker-wrapper">
        <div class="pulsing-marker-dot"></div>
        <div class="pulsing-marker-pulse"></div>
      </div>
    `,
    className: "leaflet-pulsing-marker-container",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    tooltipAnchor: [14, 0],
  });
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LeafletMarkerItem {
  id: string | number;
  companyId?: string | number;
  lat: number;
  lng: number;
  popupContent?: string;
  draggable?: boolean;
  slug?: string;
  name?: string;
  category?: string;
  rating?: number;
  reviewCount?: number;
  plan?: 'starter' | 'standard' | 'premium' | string;
  isOpen?: boolean;
  image?: string;
}

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
  hideFullscreenControl?: boolean;
}

// ─── Subcomponents ──────────────────────────────────────────────────────────

function MapSaveButton({ business }: { business: LeafletMarkerItem }) {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const isBusinessUser = currentUser?.role === "business_owner" || currentUser?.accountType === "business";

  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    if (!currentUser || isBusinessUser || !business) {
      setIsFavorited(false);
      return;
    }
    if (typeof window !== "undefined") {
      try {
        const uKey = currentUser.username || currentUser.email || (currentUser as any).id || (currentUser as any)._id || "";
        const userFavsKey = `armbiz_favorites_${uKey}`;
        const favsStr = localStorage.getItem(userFavsKey);
        if (favsStr) {
          const favs: string[] = JSON.parse(favsStr);
          if (favs.includes(String(business.id)) || (business.slug && favs.includes(business.slug))) {
            setIsFavorited(true);
          } else {
            setIsFavorited(false);
          }
        } else {
          setIsFavorited(false);
        }
      } catch (e) { }
    }
  }, [business.id, business.slug, currentUser, isBusinessUser]);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isBusinessUser) return;

    if (!currentUser) {
      showToast();
      return;
    }

    if (typeof window === "undefined") return;

    try {
      const uKey = currentUser.username || currentUser.email || (currentUser as any).id || (currentUser as any)._id || "";
      if (!uKey) return;
      const userFavsKey = `armbiz_favorites_${uKey}`;
      const userItemsKey = `armbiz_favorites_items_${uKey}`;

      const favsStr = localStorage.getItem(userFavsKey);
      const itemsStr = localStorage.getItem(userItemsKey);

      let favs: string[] = favsStr ? JSON.parse(favsStr) : [];
      let itemsMap: Record<string, any> = itemsStr ? JSON.parse(itemsStr) : {};

      const key = business.slug || String(business.id);
      const isCurrentlyFav = favs.includes(String(business.id)) || (business.slug && favs.includes(business.slug));

      if (isCurrentlyFav) {
        favs = favs.filter((id) => id !== String(business.id) && id !== business.slug);
        delete itemsMap[String(business.id)];
        if (business.slug) delete itemsMap[business.slug];
        setIsFavorited(false);
      } else {
        if (key && !favs.includes(key)) favs.push(key);
        itemsMap[key] = {
          id: String(business.id),
          slug: business.slug || String(business.id),
          name: business.name ? String(business.name).slice(0, 100) : "",
          city: "Yerevan",
          category: business.category,
          ratingAvg: business.rating || 5.0,
          logo: business.image || "",
          logoUrl: business.image || ""
        };
        setIsFavorited(true);

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const startX = rect.left + rect.width / 2;
        const startY = rect.top + rect.height / 2;

        const event = new CustomEvent("fly-to-bookmark", {
          detail: { x: startX, y: startY },
        });
        window.dispatchEvent(event);
      }

      localStorage.setItem(userFavsKey, JSON.stringify(favs));
      localStorage.setItem(userItemsKey, JSON.stringify(itemsMap));
      window.dispatchEvent(new Event("favoritesUpdated"));
    } catch (e) {
      console.error("Failed to update favorites:", e);
    }
  };

  return (
    <button className={`save-btn ${isFavorited ? 'active' : ''}`} aria-label="Save" onClick={toggleFavorite}>
      <Bookmark size={14} className={isFavorited ? 'fill-current text-[#111111]' : ''} color={isFavorited ? '#111111' : 'currentColor'} />
    </button>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

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
  hideFullscreenControl = false,
}: LeafletMapProps) {
  const router = useRouter();
  const { locale, t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Update zoom button titles dynamically for English / Armenian / Russian
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const zoomInTitle = locale === 'hy' ? 'Մոտեցնել' : locale === 'ru' ? 'Увеличить' : 'Zoom in';
    const zoomOutTitle = locale === 'hy' ? 'Հեռացնել' : locale === 'ru' ? 'Уменьшить' : 'Zoom out';

    const inBtn = container.querySelector('.leaflet-control-zoom-in');
    const outBtn = container.querySelector('.leaflet-control-zoom-out');
    if (inBtn) {
      inBtn.setAttribute('title', zoomInTitle);
      inBtn.setAttribute('aria-label', zoomInTitle);
    }
    if (outBtn) {
      outBtn.setAttribute('title', zoomOutTitle);
      outBtn.setAttribute('aria-label', zoomOutTitle);
    }
  }, [locale]);

  // Registry: id → Leaflet marker instance (to swap icons without rebuilding)
  const markerRegistryRef = useRef<Map<string | number, L.Marker>>(new Map());
  const markerCompanyRegistryRef = useRef<Map<string | number, string | number>>(new Map());

  // Tracks the currently highlighted id so we can restore it on the next hover
  const prevHoveredIdRef = useRef<string | number | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [internalHoveredCompanyId, setInternalHoveredCompanyId] = useState<string | number | null>(null);

  // Store latest bounds fn so ResizeObserver / fullscreen can call it
  const fitBoundsFnRef = useRef<((animate: boolean) => void) | null>(null);

  // ── 1. Init map ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Clear any existing leaflet container property to prevent re-initialization error
    const container = containerRef.current as any;
    if (container._leaflet_id) {
      container._leaflet_id = null;
    }

    const safeCenter: [number, number] = [
      !isFinite(Number(center[0])) ? 40.1872 : Number(center[0]),
      !isFinite(Number(center[1])) ? 44.5152 : Number(center[1]),
    ];

    const map = L.map(container, {
      zoomControl: zoomControl && !readonly,
      scrollWheelZoom,
      dragging: !readonly,
      attributionControl: false,
      // smoother panning
      inertia: true,
      inertiaDeceleration: 2000,
      inertiaMaxSpeed: 1200,
    }).setView(safeCenter, zoom);

    const tileLayer = L.tileLayer(tileLayerUrl, {
      attribution: tileLayerAttribution,
      maxZoom: 19,
      // preload adjacent tiles for smoother scroll
      keepBuffer: 4,
    }).addTo(map);
    tileLayerRef.current = tileLayer;


    if (!readonly) {
      map.on("focus", () => map.scrollWheelZoom.enable());
      map.on("click", () => {
        map.scrollWheelZoom.enable();
        setInternalHoveredCompanyId(null);
      });
      map.on("blur", () => map.scrollWheelZoom.disable());
    }

    if (onMapClick && !readonly) {
      map.on("click", (e: L.LeafletMouseEvent) => onMapClick(e.latlng.lat, e.latlng.lng));
    }

    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;
    mapRef.current = map;

    // Let the browser paint before we call invalidateSize
    const sizeTimer = setTimeout(() => map.invalidateSize(), 100);
    return () => {
      clearTimeout(sizeTimer);
      if (map) {
        try {
          map.stop();
          map.off();
          map.remove();
        } catch (e) {
          console.error("Leaflet cleanup error", e);
        }
      }
      mapRef.current = null;
      tileLayerRef.current = null;
      markersGroupRef.current = null;
      markerRegistryRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 1b. Tile layer swap (theme changes) ───────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    tileLayerRef.current?.remove();
    tileLayerRef.current = L.tileLayer(tileLayerUrl, {
      attribution: tileLayerAttribution,
      maxZoom: 19,
      keepBuffer: 4,
    }).addTo(map);
  }, [tileLayerUrl, tileLayerAttribution]);

  // ── 2. Rebuild markers ONLY when marker data changes (NOT on hover) ───────
  useEffect(() => {
    const map = mapRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    map.stop(); // Stop any ongoing flyTo/zoom animations before clearing layers
    markersGroup.clearLayers();
    markerRegistryRef.current.clear();
    markerCompanyRegistryRef.current.clear();

    const bounds = L.latLngBounds([]);
    const validList: [number, number][] = [];

    const openText = t.business?.openNow || (locale === 'hy' ? 'Բաց է' : locale === 'ru' ? 'Открыто' : 'Open Now');
    const closedText = t.business?.closed || (locale === 'hy' ? 'Փակ է' : locale === 'ru' ? 'Закрыто' : 'Closed');

    if (markers && markers.length > 0) {
      markers.forEach((m) => {
        const lat = Number(m.lat);
        const lng = Number(m.lng);
        if (!isFinite(lat) || !isFinite(lng)) return;

        const marker = L.marker([lat, lng], {
          draggable: m.draggable && !readonly,
          icon: buildDefaultIcon(m.plan, m.isOpen ?? true),
        });

        if (!m.name && m.popupContent) {
          marker.bindPopup(m.popupContent);
        }

        if (m.slug && !readonly) {
          marker.on("click", () => {
            const isMobileOrTouch = typeof window !== "undefined" && (
              window.innerWidth <= 768 || 
              window.matchMedia("(hover: none)").matches || 
              ('ontouchstart' in window) || 
              navigator.maxTouchPoints > 0
            );
            if (isMobileOrTouch && m.companyId) {
              if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
              setInternalHoveredCompanyId(m.companyId!);
            } else {
              router.push(`/business/${m.slug}`);
            }
          });
        }

        if (m.draggable && !readonly && onMarkerDragEnd) {
          marker.on("dragend", () => {
            const pos = marker.getLatLng();
            onMarkerDragEnd(m.id, pos.lat, pos.lng);
          });
        }

        if (!readonly && m.companyId) {
          marker.on("mouseover", () => {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
            setInternalHoveredCompanyId(m.companyId!);
          });
          marker.on("mouseout", () => {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = setTimeout(() => {
              setInternalHoveredCompanyId(null);
            }, 300);
          });
        }

        marker.addTo(markersGroup);
        markerRegistryRef.current.set(m.id, marker);
        markerCompanyRegistryRef.current.set(m.id, m.companyId || m.id);
        bounds.extend([lat, lng]);
        validList.push([lat, lng]);
      });
    }

    const safeCenter: [number, number] = [
      !isFinite(Number(center[0])) ? 40.1872 : Number(center[0]),
      !isFinite(Number(center[1])) ? 44.5152 : Number(center[1]),
    ];

    const doFitBounds = (animate: boolean) => {
      const m = mapRef.current;
      if (!m) return;
      const size = m.getSize();
      if (size.x === 0 || size.y === 0) return; // Prevent NaN errors if container is hidden

      m.invalidateSize({ animate: false });
      if (fitAllBounds && validList.length > 1) {
        m.fitBounds(bounds, { padding: [40, 40], maxZoom: 14, animate, duration: animate ? 0.6 : undefined });
      } else if (fitAllBounds && validList.length === 1) {
        m.setView(validList[0], 14, { animate });
      } else {
        m.setView(safeCenter, zoom, { animate });
      }
    };

    fitBoundsFnRef.current = doFitBounds;

    // Initial fit (only on first load — skip if a hover is already active)
    if (!hoveredLocationId && !internalHoveredCompanyId) {
      doFitBounds(true);
    }

    // Stabilisation passes (no animation after first)
    const timers = [200, 600, 1200].map((delay) =>
      setTimeout(() => {
        const m = mapRef.current;
        if (!m) return;
        const { x, y } = m.getSize();
        if (x > 0 && y > 0 && !hoveredLocationId && !internalHoveredCompanyId) {
          m.invalidateSize({ animate: false });
        }
      }, delay)
    );

    return () => timers.forEach(clearTimeout);
    // hoveredLocationId intentionally excluded — handle it in a separate effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers, center, zoom, readonly, onMarkerDragEnd, fitAllBounds, router]);

  // ── 3. Handle hover: swap icons + flyTo (no marker rebuild) ──────────────
  useEffect(() => {
    const map = mapRef.current;
    const registry = markerRegistryRef.current;
    const companyRegistry = markerCompanyRegistryRef.current;

    // Reset all markers to default
    registry.forEach((marker, id) => {
      const m = markers.find(m => m.id === id);
      marker.setIcon(buildDefaultIcon(m?.plan));
    });

    let activeCompanyId: string | number | null = null;
    if (internalHoveredCompanyId) {
      activeCompanyId = internalHoveredCompanyId;
    } else if (hoveredLocationId) {
      if (companyRegistry.has(hoveredLocationId)) {
        activeCompanyId = companyRegistry.get(hoveredLocationId) || null;
      } else {
        const values = Array.from(companyRegistry.values());
        if (values.includes(hoveredLocationId)) {
          activeCompanyId = hoveredLocationId;
        }
      }
    }

    if (activeCompanyId) {
      let targetForFlyTo: L.Marker | null = null;

      registry.forEach((marker, id) => {
        if (companyRegistry.get(id) === activeCompanyId) {
          marker.setIcon(buildHoveredIcon());
          marker.setOpacity(1); // Ensure it's visible
          if (id === hoveredLocationId) {
            targetForFlyTo = marker;
          }
        } else {
          // Keep all other markers visible but slightly dimmed for focus
          marker.setOpacity(0.6);
        }
      });

      // If triggered by external hover (list card), fly to the markers
      if (hoveredLocationId && map) {
        const size = map.getSize();
        if (size.x > 0 && size.y > 0) {
          // Collect all markers for the active company
          const companyMarkersLatLng: [number, number][] = [];
          registry.forEach((marker, id) => {
            if (companyRegistry.get(id) === activeCompanyId) {
              const { lat, lng } = marker.getLatLng();
              if (isFinite(lat) && isFinite(lng)) {
                companyMarkersLatLng.push([lat, lng]);
              }
            }
          });

          if (companyMarkersLatLng.length > 0) {
            if (companyMarkersLatLng.length === 1) {
              map.flyTo(companyMarkersLatLng[0], Math.max(map.getZoom(), 14), {
                animate: true,
                duration: 0.55,
                easeLinearity: 0.2,
              });
            } else {
              // We need to use the Leaflet `latLngBounds` constructor directly. 
              // Since L is global inside LeafletMap (imported from 'leaflet'), we can use it.
              // Wait, L might not be directly available, we can just map to Leaflet latLngs and use map.flyToBounds.
              const boundsObj = companyMarkersLatLng; // flyToBounds accepts LatLngBoundsExpression which is LatLngTuple[]
              map.flyToBounds(boundsObj, {
                animate: true,
                duration: 0.55,
                padding: [50, 50],
                maxZoom: 14
              });
            }
          }
        }
      }
    } else {
      // If no active hover, ensure all markers are visible
      registry.forEach((marker) => {
        marker.setOpacity(1);
      });
    }
    // Track prev ID so we can optimize next render if needed
    prevHoveredIdRef.current = hoveredLocationId ?? null;
  }, [hoveredLocationId, internalHoveredCompanyId]);

  // ── 4. Fullscreen toggle ──────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    document.body.classList.toggle("map-fullscreen-active", isFullscreen);
    const t = setTimeout(() => {
      const size = map.getSize();
      if (size.x > 0 && size.y > 0) {
        map.invalidateSize({ animate: false });
        if (fitBoundsFnRef.current) fitBoundsFnRef.current(false);
      }
    }, 150);
    return () => {
      document.body.classList.remove("map-fullscreen-active");
      clearTimeout(t);
    };
  }, [isFullscreen]);

  // ── 5. ResizeObserver ─────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    const container = containerRef.current;
    if (!map || !container) return;

    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const { width, height: h } = e.contentRect;
        if (width > 0 && h > 0) map.invalidateSize({ animate: false });
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────

  const activeHoveredId = internalHoveredCompanyId || hoveredLocationId;
  const activeMarkerData = activeHoveredId 
    ? markers.find(m => m.companyId === activeHoveredId || m.id === activeHoveredId)
    : null;

  const openText = t.business?.openNow || (locale === 'hy' ? 'Բաց է' : locale === 'ru' ? 'Открыто' : 'Open Now');
  const closedText = t.business?.closed || (locale === 'hy' ? 'Փակ է' : locale === 'ru' ? 'Закрыто' : 'Closed');

  return (
    <div
      className={`leaflet-map-outer-wrapper ${isFullscreen ? "fullscreen-mode" : ""} ${className}`}
      style={{ width: "100%", height: isFullscreen ? "100vh" : height, position: "relative" }}
    >
      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%", position: "relative", zIndex: 1 }}
        className="leaflet-map-wrapper leaflet-container"
      />
      
      {activeMarkerData && activeMarkerData.name && (
        <div className="map-bottom-hover-card"
             onMouseEnter={() => {
               if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
               setInternalHoveredCompanyId(activeMarkerData.companyId || activeMarkerData.id);
             }}
             onMouseLeave={() => {
               setInternalHoveredCompanyId(null);
             }}>
          <div className="map-bottom-hover-card-inner">
            <div className="image-container" style={{ cursor: 'pointer' }} onClick={() => activeMarkerData.slug && router.push(`/business/${activeMarkerData.slug}`)}>
              {activeMarkerData.image ? (
                <img src={activeMarkerData.image} alt={activeMarkerData.name} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #f0f0f0, #e0e0e0)' }} />
              )}
            </div>
            <div className="info-container">
              <div className="header-row">
                <strong className="name" style={{ cursor: 'pointer' }} onClick={() => activeMarkerData.slug && router.push(`/business/${activeMarkerData.slug}`)}>
                  {activeMarkerData.name}
                </strong>
                <MapSaveButton business={activeMarkerData} />
              </div>
              {activeMarkerData.category && <span className="category">{activeMarkerData.category}</span>}
              <div className="meta-row">
                {activeMarkerData.rating ? (
                  <span className="rating">
                    &#9733; {(Math.round(activeMarkerData.rating * 10) / 10).toFixed(1)}
                    {activeMarkerData.reviewCount && <span className="reviews">({activeMarkerData.reviewCount})</span>}
                  </span>
                ) : <span />}
                <span className={`status ${activeMarkerData.isOpen === false ? 'is-closed' : 'is-open'}`}>
                  {activeMarkerData.isOpen === false ? closedText : openText}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {!hideFullscreenControl && (
        <button
          type="button"
          onClick={() => setIsFullscreen((prev) => !prev)}
          className="leaflet-fullscreen-toggle-btn"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      )}
    </div>
  );
}
