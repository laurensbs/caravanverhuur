'use client';

import { useEffect, useRef, useState } from 'react';
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
  const [hintVisible, setHintVisible] = useState(true);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    import('leaflet').then((L) => {
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      if (!mapRef.current) return;

      const isSingle = destinations.length === 1;
      const center: [number, number] = isSingle
        ? [destinations[0].coordinates.lat, destinations[0].coordinates.lng]
        : [42.0, 3.05];

      const map = L.default.map(mapRef.current, {
        scrollWheelZoom: false,
        zoomControl: false,
        attributionControl: false,
        fadeAnimation: true,
        zoomAnimation: true,
        markerZoomAnimation: true,
        dragging: !L.default.Browser.mobile, // disable drag on mobile (use two fingers)
      } as L.MapOptions).setView(center, isSingle ? 12 : 9);

      // Attribution in bottom-right (subtle)
      L.default.control.attribution({ position: 'bottomright', prefix: '' }).addTo(map);

      // Zoom control top-right
      L.default.control.zoom({ position: 'topright' }).addTo(map);

      // CartoDB Voyager tiles – prettier, cleaner than OSM
      L.default.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OST</a> &copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Custom SVG marker
      // On mobile, re-enable dragging after first interaction
      if (L.default.Browser.mobile) {
        map.on('click', () => { map.dragging.enable(); });
      }

      const makeSvgIcon = (active: boolean) => {
        const isMobile = window.innerWidth < 640;
        const size = active ? (isMobile ? 36 : 42) : (isMobile ? 28 : 32);
        const color = active ? '#c4650c' : '#0EA5E9';
        return L.default.divIcon({
          className: '',
          html: `<svg width="${size}" height="${size + 10}" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <filter id="shadow${active ? 'A' : ''}" x="-20%" y="-10%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-opacity="0.25"/>
            </filter>
            <path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 26 16 26s16-16 16-26C32 7.163 24.837 0 16 0z" fill="${color}" filter="url(#shadow${active ? 'A' : ''})" />
            <circle cx="16" cy="15" r="7" fill="white"/>
            <circle cx="16" cy="15" r="3.5" fill="${color}" opacity="0.7"/>
          </svg>`,
          iconSize: [size, size + 10],
          iconAnchor: [size / 2, size + 10],
          popupAnchor: [0, -(size + 6)],
        });
      };

      destinations.forEach((dest) => {
        const isActive = activeDestination === dest.slug;
        const marker = L.default.marker(
          [dest.coordinates.lat, dest.coordinates.lng],
          {
            icon: makeSvgIcon(isActive),
            riseOnHover: true,
          }
        ).addTo(map);

        const isMobile = window.innerWidth < 640;
        marker.bindPopup(`
          <div class="map-popup-card">
            <img src="${dest.heroImage}" alt="${dest.name}" class="map-popup-img" loading="lazy" />
            <div class="map-popup-body">
              <h3 class="map-popup-title">${dest.name}</h3>
              <p class="map-popup-region">${dest.region}</p>
              <p class="map-popup-desc">${dest.description.substring(0, isMobile ? 60 : 90)}…</p>
              <a href="/bestemmingen/${dest.slug}" class="map-popup-btn">Ontdek meer →</a>
            </div>
          </div>
        `, { maxWidth: isMobile ? 220 : 280, className: 'pretty-popup' });

        marker.on('click', () => {
          onMarkerClick?.(dest.slug);
          map.flyTo([dest.coordinates.lat, dest.coordinates.lng], 12, {
            duration: 0.8,
            easeLinearity: 0.25,
          });
        });

        // Hover effect (desktop)
        marker.on('mouseover', () => {
          if (!isActive) marker.setIcon(makeSvgIcon(true));
        });
        marker.on('mouseout', () => {
          if (!isActive) marker.setIcon(makeSvgIcon(false));
        });

        markersRef.current.push(marker);
      });

      // Enable scroll zoom on focus
      map.on('focus', () => { map.scrollWheelZoom.enable(); });
      map.on('blur', () => { map.scrollWheelZoom.disable(); });

      // Touch: enable zoom on two-finger
      map.on('click', () => { map.scrollWheelZoom.enable(); });

      mapInstanceRef.current = map;
      setIsLoaded(true);
      setTimeout(() => setHintVisible(false), 4000);

      setTimeout(() => { map.invalidateSize(); }, 150);
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
    <div className="relative w-full rounded-2xl overflow-hidden shadow-xl border border-gray-200/60 bg-gray-100">
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm font-medium">Kaart laden...</p>
          </div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-[300px] sm:h-[420px] md:h-[500px] lg:h-[560px] touch-pan-y" />
      {/* Mobile gesture hint */}
      {hintVisible && (
        <div className="sm:hidden absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm pointer-events-none animate-pulse z-20">
          Tik op een marker voor info
        </div>
      )}
      <style jsx global>{`
        /* ---- zoom controls ---- */
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 2px 12px rgba(0,0,0,.12) !important;
          border-radius: 12px !important;
          overflow: hidden;
        }
        .leaflet-control-zoom a {
          width: 36px !important;
          height: 36px !important;
          line-height: 36px !important;
          font-size: 18px !important;
          color: #1a1a2e !important;
          background: #fff !important;
          border-bottom: 1px solid #eee !important;
        }
        .leaflet-control-zoom a:last-child {
          border-bottom: none !important;
        }
        .leaflet-control-zoom a:hover {
          background: #f5f5f5 !important;
        }

        /* ---- popup card ---- */
        .pretty-popup .leaflet-popup-content-wrapper {
          border-radius: 16px !important;
          padding: 0 !important;
          overflow: hidden;
          box-shadow: 0 8px 30px rgba(0,0,0,.15) !important;
          border: 1px solid rgba(0,0,0,.06);
        }
        .pretty-popup .leaflet-popup-content {
          margin: 0 !important;
          line-height: 1.4 !important;
          width: 260px !important;
        }
        .pretty-popup .leaflet-popup-tip {
          box-shadow: 0 4px 12px rgba(0,0,0,.08);
        }
        .pretty-popup .leaflet-popup-close-button {
          color: #fff !important;
          font-size: 22px !important;
          z-index: 10;
          text-shadow: 0 1px 4px rgba(0,0,0,.5);
          top: 4px !important;
          right: 6px !important;
        }
        .map-popup-card {
          font-family: 'DM Sans', system-ui, sans-serif;
        }
        .map-popup-img {
          width: 100%;
          height: 130px;
          object-fit: cover;
          display: block;
        }
        @media (max-width: 639px) {
          .map-popup-img {
            height: 100px;
          }
        }
        .map-popup-body {
          padding: 14px 16px 16px;
        }
        @media (max-width: 639px) {
          .map-popup-body {
            padding: 10px 12px 12px;
          }
        }
        .map-popup-title {
          margin: 0 0 2px;
          font-size: 16px;
          font-weight: 700;
          color: #1a1a2e;
        }
        @media (max-width: 639px) {
          .map-popup-title {
            font-size: 14px;
          }
        }
        .map-popup-region {
          margin: 0 0 6px;
          font-size: 12px;
          color: #888;
          font-weight: 500;
        }
        .map-popup-desc {
          margin: 0 0 12px;
          font-size: 12.5px;
          color: #555;
          line-height: 1.5;
        }
        .map-popup-btn {
          display: inline-block;
          background: linear-gradient(135deg, #0EA5E9, #0284C7);
          color: #fff !important;
          padding: 8px 18px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition: transform 0.15s, box-shadow 0.15s;
          box-shadow: 0 2px 8px rgba(14,165,233,.25);
        }
        .map-popup-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(14,165,233,.35);
        }

        /* ---- attribution ---- */
        .leaflet-control-attribution {
          font-size: 10px !important;
          background: rgba(255,255,255,.7) !important;
          padding: 2px 6px !important;
          border-radius: 4px 0 0 0 !important;
        }
        .leaflet-control-attribution a {
          color: #888 !important;
        }

        /* ---- touch hint ---- */
        .leaflet-container {
          cursor: grab;
        }
        .leaflet-container:active {
          cursor: grabbing;
        }
      `}</style>
    </div>
  );
}
