"use client";
import React from 'react';
import dynamic from 'next/dynamic';
import type { BusinessSuggestion } from '@/store/slices/chatSlice';
import 'leaflet/dist/leaflet.css';

// Dynamic import for Leaflet map to prevent SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

let customIcon: any = null;
if (typeof window !== 'undefined') {
  const L = require('leaflet');
  customIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
}

export default function ChatMap({ suggestions }: { suggestions: BusinessSuggestion[] }) {
  // Filter suggestions that have valid coordinates
  const markers = suggestions.filter(s => s.latitude && s.longitude);

  if (markers.length === 0) {
    return (
      <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl text-center text-sm text-slate-500">
        Տվյալների բազայում չկան կոորդինատներ այս վայրերի համար:
      </div>
    );
  }

  // Calculate center based on first marker
  const center: [number, number] = [markers[0].latitude!, markers[0].longitude!];

  return (
    <div className="h-64 w-full rounded-xl overflow-hidden border border-[hsl(var(--border))] shadow-md relative z-10 mt-2">
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {markers.map((marker) => (
          <Marker 
            key={marker.id} 
            position={[marker.latitude!, marker.longitude!]} 
            icon={customIcon}
          >
            <Popup>
              <div className="font-sans">
                <h4 className="font-bold text-sm text-slate-900">{marker.name}</h4>
                <p className="text-xs text-slate-600 mt-1">{marker.shortDescription}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
