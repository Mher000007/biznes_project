"use client";
import MapWorkspace, { LocationItem } from "@/components/map/MapWorkspace";

interface DiscoverMapProps {
  businesses: any[];
  hoveredBusinessId: string | null;
}

// City coordinates mapping for fallback resolution in Armenia
const CITY_COORDINATES: Record<string, [number, number]> = {
  yerevan: [40.1792, 44.5152],
  gyumri: [40.7829, 43.8465],
  vanadzor: [40.8090, 44.4920],
  dilijan: [40.7406, 44.8625],
  sevan: [40.5562, 44.9542],
  tsaghkadzor: [40.5333, 44.7167],
  abovyan: [40.2725, 44.6272],
  hrazdan: [40.5000, 44.7500],
  echmiadzin: [40.1650, 44.2930],
  goris: [39.5130, 46.3380],
  kapan: [39.2076, 46.4058],
  jermuk: [39.8433, 45.6725],
  alaverdi: [41.0950, 44.6540],
  artashat: [39.9534, 44.5464],
};

export default function DiscoverMap({
  businesses,
  hoveredBusinessId,
}: DiscoverMapProps) {
  // Registry to track duplicates and apply small offsets (jitter) to prevent overlap
  const coordinateRegistry: Record<string, number> = {};

  // Map businesses to strict LocationItem structure with coordinates correction
  const locations: LocationItem[] = (businesses || []).flatMap((biz) => {
    const allLocations: LocationItem[] = [];

    const getJitteredCoords = (rawLat: any, rawLng: any, city: string) => {
      let lat = rawLat;
      let lng = rawLng;
      const cityLower = (city || "").toLowerCase().trim();

      const isDefaultCoords =
        lat === undefined ||
        lng === undefined ||
        (Math.abs(lat - 40.1872) < 0.0001 && Math.abs(lng - 44.5152) < 0.0001);

      if (isDefaultCoords && cityLower && CITY_COORDINATES[cityLower]) {
        const cityCoords = CITY_COORDINATES[cityLower];
        lat = cityCoords[0];
        lng = cityCoords[1];
      } else {
        lat = lat || 40.1792;
        lng = lng || 44.5152;
      }

      const coordKey = `${lat.toFixed(5)},${lng.toFixed(5)}`;
      if (coordinateRegistry[coordKey] !== undefined) {
        coordinateRegistry[coordKey] += 1;
        const count = coordinateRegistry[coordKey];
        const angle = count * 0.8;
        const radius = 0.00015 * count;
        lat += Math.cos(angle) * radius;
        lng += Math.sin(angle) * radius;
      } else {
        coordinateRegistry[coordKey] = 0;
      }
      return { lat, lng };
    };

    const primaryCoords = getJitteredCoords(biz.latitude || biz.coordinates?.latitude, biz.longitude || biz.coordinates?.longitude, biz.city);

    // Add primary location
    allLocations.push({
      id: biz.id || biz._id,
      companyId: biz.id || biz._id,
      lat: primaryCoords.lat,
      lng: primaryCoords.lng,
      name: biz.name,
      addressDetails: biz.address ? `${biz.address}, ${biz.city}` : biz.city,
      category: biz.category?.name,
      slug: biz.slug,
      rating: biz.ratingAvg || biz.rating || 0,
      reviewCount: biz.reviewCount || 0,
    });

    // Add branch locations
    if (biz.locations && Array.isArray(biz.locations)) {
      biz.locations.forEach((branch: any) => {
        const branchCoords = getJitteredCoords(branch.coordinates?.latitude, branch.coordinates?.longitude, branch.city);
        allLocations.push({
          id: branch._id,
          companyId: biz.id || biz._id,
          lat: branchCoords.lat,
          lng: branchCoords.lng,
          name: `${biz.name} - ${branch.name}`,
          addressDetails: `${branch.address}, ${branch.city}`,
          category: biz.category?.name,
          slug: biz.slug,
          rating: biz.ratingAvg || biz.rating || 0,
          reviewCount: biz.reviewCount || 0,
        });
      });
    }

    return allLocations;
  });

  return (
    <MapWorkspace
      locations={locations}
      hoveredLocationId={hoveredBusinessId}
    />
  );
}

