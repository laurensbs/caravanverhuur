'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
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
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hintVisible, setHintVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSatellite, setIsSatellite] = useState(false);
  const [locating, setLocating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if ((containerRef.current as unknown as { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen) {
        (containerRef.current as unknown as { webkitRequestFullscreen: () => void }).webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as unknown as { webkitExitFullscreen?: () => void }).webkitExitFullscreen) {
        (document as unknown as { webkitExitFullscreen: () => void }).webkitExitFullscreen();
      }
    }
  }, [isFullscreen]);

  useEffect(() => {
    const handler = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      // Invalidate map size after fullscreen change
      setTimeout(() => { mapInstanceRef.current?.invalidateSize(); }, 200);
    };
    document.addEventListener('fullscreenchange', handler);
    document.addEventListener('webkitfullscreenchange', handler);
    return () => {
      document.removeEventListener('fullscreenchange', handler);
      document.removeEventListener('webkitfullscreenchange', handler);
    };
  }, []);

  const toggleSatellite = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const next = !isSatellite;
    setIsSatellite(next);
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    const newUrl = next
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    const newAttr = next
      ? '&copy; Esri'
      : '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    import('leaflet').then((L) => {
      tileLayerRef.current = L.default.tileLayer(newUrl, {
        attribution: newAttr,
        maxZoom: 19,
        ...(next ? {} : { subdomains: 'abcd' }),
      }).addTo(map);
    });
  }, [isSatellite]);

  const locateMe = useCallback(() => {
    if (!navigator.geolocation || !mapInstanceRef.current) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const map = mapInstanceRef.current;
        if (!map) return;
        const { latitude, longitude } = pos.coords;

        import('leaflet').then((L) => {
          // Remove old user marker
          if (userMarkerRef.current) {
            map.removeLayer(userMarkerRef.current);
          }
          // Add user location marker
          const userIcon = L.default.divIcon({
            className: '',
            html: `<div style="width:18px;height:18px;background:#3B82F6;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(59,130,246,.5);"></div>`,
            iconSize: [18, 18],
            iconAnchor: [9, 9],
          });
          userMarkerRef.current = L.default.marker([latitude, longitude], { icon: userIcon })
            .addTo(map)
            .bindPopup('<div style="font-family:DM Sans,system-ui;padding:4px 2px;"><strong style="font-size:13px;">Jouw locatie</strong></div>', { className: 'pretty-popup' });

          // Fit bounds to include user + all destinations
          const allPoints: [number, number][] = [[latitude, longitude], ...destinations.map(d => [d.coordinates.lat, d.coordinates.lng] as [number, number])];
          const bounds = L.default.latLngBounds(allPoints);
          map.flyToBounds(bounds, { padding: [40, 40], maxZoom: 10, duration: 1 });
        });

        setLocating(false);
      },
      () => { setLocating(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [destinations]);

  const fitAll = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map || destinations.length === 0) return;
    import('leaflet').then((L) => {
      const bounds = L.default.latLngBounds(destinations.map(d => [d.coordinates.lat, d.coordinates.lng] as [number, number]));
      map.flyToBounds(bounds, { padding: [40, 40], maxZoom: 11, duration: 0.8 });
    });
  }, [destinations]);

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
      tileLayerRef.current = L.default.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
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
        const color = active ? '#c4650c' : '#1E3A5F';
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
    <div ref={containerRef} className={`relative w-full rounded-2xl overflow-hidden shadow-xl border border-gray-200/60 bg-gray-100 isolate z-0 ${isFullscreen ? 'rounded-none fixed inset-0 z-[60]' : ''}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm font-medium">Kaart laden...</p>
          </div>
        </div>
      )}
      <div ref={mapRef} className={`w-full touch-pan-y ${isFullscreen ? 'h-screen' : 'h-[350px] sm:h-[420px] md:h-[500px] lg:h-[560px]'}`} />

      {/* — Map controls overlay — */}
      {isLoaded && (
        <>
          {/* Top-left: destination counter */}
          <div className="absolute top-3 left-3 z-[9]">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg border border-gray-100 flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-[#1E3A5F] rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-gray-700">{destinations.length} bestemmingen</span>
            </div>
          </div>

          {/* Bottom-left: control buttons */}
          <div className="absolute bottom-3 left-3 z-[9] flex flex-col gap-2">
            {/* Fullscreen toggle */}
            <button
              onClick={toggleFullscreen}
              className="w-9 h-9 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100 flex items-center justify-center text-gray-600 hover:text-primary hover:bg-white transition-all"
              title={isFullscreen ? 'Verkleinen' : 'Volledig scherm'}
            >
              {isFullscreen ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
              )}
            </button>

            {/* Locate me */}
            <button
              onClick={locateMe}
              disabled={locating}
              className="w-9 h-9 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100 flex items-center justify-center text-gray-600 hover:text-primary hover:bg-white transition-all disabled:opacity-50"
              title="Mijn locatie"
            >
              {locating ? (
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><line x1="1.05" y1="12" x2="7" y2="12"/><line x1="17.01" y1="12" x2="22.96" y2="12"/><line x1="12" y1="1" x2="12" y2="7"/><line x1="12" y1="17.01" x2="12" y2="22.96"/></svg>
              )}
            </button>

            {/* Fit all markers */}
            <button
              onClick={fitAll}
              className="w-9 h-9 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100 flex items-center justify-center text-gray-600 hover:text-primary hover:bg-white transition-all"
              title="Alles tonen"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><circle cx="15.5" cy="8.5" r="1.5"/><circle cx="15.5" cy="15.5" r="1.5"/><circle cx="8.5" cy="15.5" r="1.5"/></svg>
            </button>

            {/* Satellite toggle */}
            <button
              onClick={toggleSatellite}
              className={`w-9 h-9 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100 flex items-center justify-center transition-all ${isSatellite ? 'bg-primary text-white' : 'bg-white/95 text-gray-600 hover:text-primary hover:bg-white'}`}
              title={isSatellite ? 'Stratenkaart' : 'Satelliet'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            </button>
          </div>
        </>
      )}

      {/* Mobile gesture hint */}
      {hintVisible && (
        <div className="sm:hidden absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm pointer-events-none animate-pulse z-20">
          Tik op een marker voor info
        </div>
      )}
      <style jsx global>{`
        .leaflet-pane { z-index: 1 !important; }
        .leaflet-top, .leaflet-bottom { z-index: 2 !important; }
        .leaflet-overlay-pane { z-index: 3 !important; }
        .leaflet-marker-pane { z-index: 4 !important; }
        .leaflet-tooltip-pane { z-index: 5 !important; }
        .leaflet-popup-pane { z-index: 6 !important; }
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
          background: linear-gradient(135deg, #1E3A5F, #1E3A5F);
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
