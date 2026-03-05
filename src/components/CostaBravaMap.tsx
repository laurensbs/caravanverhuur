'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Destination } from '@/data/destinations';

interface CostaBravaMapProps {
  destinations: Destination[];
  activeDestination?: string | null;
  onMarkerClick?: (slug: string) => void;
}

export default function CostaBravaMap({ destinations, activeDestination, onMarkerClick }: CostaBravaMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Dynamically import Leaflet to avoid SSR issues
    import('leaflet').then((L) => {
      // Load Leaflet CSS
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      if (!mapRef.current) return;

      // Center on Costa Brava
      const map = L.default.map(mapRef.current, {
        scrollWheelZoom: false,
        zoomControl: true,
      }).setView([42.0, 3.05], 9);

      L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      // Custom marker icon
      const defaultIcon = L.default.divIcon({
        className: 'custom-map-marker',
        html: `<div class="marker-pin"></div>`,
        iconSize: [30, 40],
        iconAnchor: [15, 40],
        popupAnchor: [0, -40],
      });

      const activeIcon = L.default.divIcon({
        className: 'custom-map-marker active',
        html: `<div class="marker-pin active"></div>`,
        iconSize: [36, 46],
        iconAnchor: [18, 46],
        popupAnchor: [0, -46],
      });

      destinations.forEach((dest) => {
        const isActive = activeDestination === dest.slug;
        const marker = L.default.marker(
          [dest.coordinates.lat, dest.coordinates.lng],
          { icon: isActive ? activeIcon : defaultIcon }
        ).addTo(map);

        marker.bindPopup(`
          <div style="min-width: 200px; font-family: 'DM Sans', sans-serif;">
            <img src="${dest.heroImage}" alt="${dest.name}" style="width:100%; height:120px; object-fit:cover; border-radius:8px 8px 0 0; margin: -1px -1px 0 -1px; width: calc(100% + 2px);" loading="lazy" />
            <div style="padding: 10px 4px 4px;">
              <h3 style="margin:0 0 4px; font-size:16px; font-weight:700; color:#1a1a2e;">${dest.name}</h3>
              <p style="margin:0 0 4px; font-size:12px; color:#666;">${dest.region}</p>
              <p style="margin:0 0 8px; font-size:12px; color:#444; line-height:1.4;">${dest.description.substring(0, 100)}...</p>
              <a href="/bestemmingen/${dest.slug}" style="display:inline-block; background:#0EA5E9; color:#fff; padding:6px 14px; border-radius:6px; font-size:12px; font-weight:600; text-decoration:none;">Ontdek meer →</a>
            </div>
          </div>
        `, { maxWidth: 260 });

        marker.on('click', () => {
          onMarkerClick?.(dest.slug);
        });

        markersRef.current.push(marker);
      });

      mapInstanceRef.current = map;
      setIsLoaded(true);

      // Invalidate size after render to fix tile loading
      setTimeout(() => { map.invalidateSize(); }, 100);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersRef.current = [];
      }
    };
  }, [destinations, activeDestination, onMarkerClick]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-lg border border-gray-200">
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Kaart laden...</p>
          </div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-[500px] md:h-[600px]" />
      <style jsx global>{`
        .custom-map-marker {
          background: none !important;
          border: none !important;
        }
        .marker-pin {
          width: 30px;
          height: 30px;
          border-radius: 50% 50% 50% 0;
          background: #0EA5E9;
          position: absolute;
          transform: rotate(-45deg);
          left: 50%;
          top: 50%;
          margin: -15px 0 0 -15px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          transition: all 0.3s ease;
        }
        .marker-pin::after {
          content: '';
          width: 14px;
          height: 14px;
          margin: 8px 0 0 8px;
          background: #fff;
          position: absolute;
          border-radius: 50%;
        }
        .marker-pin.active {
          width: 36px;
          height: 36px;
          margin: -18px 0 0 -18px;
          background: #c4650c;
        }
        .marker-pin.active::after {
          width: 16px;
          height: 16px;
          margin: 10px 0 0 10px;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          padding: 0 !important;
          overflow: hidden;
        }
        .leaflet-popup-content {
          margin: 0 !important;
          line-height: 1.4 !important;
        }
        .leaflet-popup-close-button {
          color: #fff !important;
          font-size: 20px !important;
          z-index: 10;
          text-shadow: 0 1px 3px rgba(0,0,0,0.5);
        }
      `}</style>
    </div>
  );
}
