'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Destination } from '@/data/destinations';
import type { Camping } from '@/data/campings';

type MapMarkerType = 'destination' | 'camping';

interface MapItem {
  type: MapMarkerType;
  slug: string;
  name: string;
  region: string;
  description: string;
  image: string;
  coordinates: { lat: number; lng: number };
  extra?: string;
}

interface CostaBravaMapProps {
  destinations: Destination[];
  campings?: Camping[];
  activeDestination?: string | null;
  onMarkerClick?: (slug: string) => void;
}

export default function CostaBravaMap({ destinations, campings = [], activeDestination, onMarkerClick }: CostaBravaMapProps) {
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
  const [filter, setFilter] = useState<'all' | 'campings' | 'destinations'>('all');
  const containerRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef(filter);
  filterRef.current = filter;

  const allItems: MapItem[] = [
    ...destinations.map(d => ({
      type: 'destination' as MapMarkerType,
      slug: d.slug, name: d.name, region: d.region, description: d.description,
      image: d.heroImage, coordinates: d.coordinates, extra: d.knownFor || '',
    })),
    ...campings.map(c => ({
      type: 'camping' as MapMarkerType,
      slug: c.slug, name: c.name, region: c.region, description: c.description,
      image: c.photos?.[0] || '', coordinates: c.coordinates,
      extra: c.facilities?.slice(0, 4).join(' \u00b7 ') || '',
    })),
  ];

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) containerRef.current.requestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  }, [isFullscreen]);

  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement);
      setTimeout(() => { mapInstanceRef.current?.invalidateSize(); }, 200);
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleSatellite = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const next = !isSatellite;
    setIsSatellite(next);
    if (tileLayerRef.current) map.removeLayer(tileLayerRef.current);
    import('leaflet').then((L) => {
      tileLayerRef.current = L.default.tileLayer(
        next ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
             : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        { attribution: next ? '&copy; Esri' : '&copy; OSM &copy; CARTO', maxZoom: 19, ...(next ? {} : { subdomains: 'abcd' }) }
      ).addTo(map);
    });
  }, [isSatellite]);

  const locateMe = useCallback(() => {
    if (!navigator.geolocation || !mapInstanceRef.current) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition((pos) => {
      const map = mapInstanceRef.current;
      if (!map) return;
      import('leaflet').then((L) => {
        if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
        userMarkerRef.current = L.default.marker([pos.coords.latitude, pos.coords.longitude], {
          icon: L.default.divIcon({ className: '', html: '<div style="width:18px;height:18px;background:#3B82F6;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(59,130,246,.5);"></div>', iconSize: [18, 18], iconAnchor: [9, 9] })
        }).addTo(map);
        const pts: [number, number][] = [[pos.coords.latitude, pos.coords.longitude], ...allItems.map(i => [i.coordinates.lat, i.coordinates.lng] as [number, number])];
        map.flyToBounds(L.default.latLngBounds(pts), { padding: [40, 40], maxZoom: 10, duration: 1 });
      });
      setLocating(false);
    }, () => setLocating(false), { enableHighAccuracy: true, timeout: 10000 });
  }, [allItems]);

  const fitAll = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map || allItems.length === 0) return;
    import('leaflet').then((L) => {
      map.flyToBounds(L.default.latLngBounds(allItems.map(i => [i.coordinates.lat, i.coordinates.lng] as [number, number])), { padding: [40, 40], maxZoom: 11, duration: 0.8 });
    });
  }, [allItems]);

  // Rebuild markers on filter change
  const rebuildMarkers = useCallback(async () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const L = (await import('leaflet')).default;

    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    const currentFilter = filterRef.current;
    const items = allItems.filter(item => {
      if (currentFilter === 'campings') return item.type === 'camping';
      if (currentFilter === 'destinations') return item.type === 'destination';
      return true;
    });

    const makeSvgIcon = (type: MapMarkerType, active: boolean) => {
      const mob = window.innerWidth < 640;
      const sz = active ? (mob ? 34 : 40) : (mob ? 24 : 28);
      const isC = type === 'camping';
      const col = active ? '#c4650c' : (isC ? '#059669' : '#0F172A');
      const inner = isC
        ? `<circle cx="16" cy="14" r="6" fill="white"/><text x="16" y="17.5" text-anchor="middle" font-size="11" font-weight="bold" fill="${col}">&#9978;</text>`
        : `<circle cx="16" cy="15" r="7" fill="white"/><circle cx="16" cy="15" r="3.5" fill="${col}" opacity="0.7"/>`;
      return L.divIcon({
        className: '',
        html: `<svg width="${sz}" height="${sz + 10}" viewBox="0 0 32 42" fill="none"><filter id="s${active ? 'a' : ''}${isC ? 'c' : 'd'}" x="-20%" y="-10%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-opacity="0.25"/></filter><path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 26 16 26s16-16 16-26C32 7.163 24.837 0 16 0z" fill="${col}" filter="url(#s${active ? 'a' : ''}${isC ? 'c' : 'd'})"/>${inner}</svg>`,
        iconSize: [sz, sz + 10], iconAnchor: [sz / 2, sz + 10], popupAnchor: [0, -(sz + 6)],
      });
    };

    items.forEach((item) => {
      const isActive = activeDestination === item.slug;
      const marker = L.marker([item.coordinates.lat, item.coordinates.lng], { icon: makeSvgIcon(item.type, isActive), riseOnHover: true }).addTo(map);

      const mob = window.innerWidth < 640;
      const isC = item.type === 'camping';
      const typeLabel = isC ? '\u26fa Camping' : '\ud83d\udccd Bestemming';
      const imgSrc = item.image;
      const imgHtml = imgSrc ? `<img src="${imgSrc}" alt="${item.name}" class="map-popup-img" loading="lazy" />` : `<div class="map-popup-img" style="background:#f3f4f6;display:flex;align-items:center;justify-content:center;font-size:28px;">${isC ? '\u26fa' : '\ud83d\udccd'}</div>`;
      const gmUrl = `https://www.google.com/maps/search/?api=1&query=${item.coordinates.lat},${item.coordinates.lng}`;

      marker.bindPopup(`<div class="map-popup-card">${imgHtml}<div class="map-popup-body"><div class="map-popup-type">${typeLabel}</div><h3 class="map-popup-title">${item.name}</h3><p class="map-popup-region">${item.region}${item.extra ? ' \u00b7 ' + item.extra : ''}</p><p class="map-popup-desc">${item.description.substring(0, mob ? 60 : 100)}\u2026</p><div class="map-popup-actions"><a href="/bestemmingen/${item.slug}" class="map-popup-btn">Ontdek \u2192</a><a href="${gmUrl}" target="_blank" rel="noopener noreferrer" class="map-popup-gmaps"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>Maps</a></div></div></div>`,
        { maxWidth: mob ? 240 : 280, className: 'pretty-popup' }
      );

      marker.on('click', () => { onMarkerClick?.(item.slug); map.flyTo([item.coordinates.lat, item.coordinates.lng], 13, { duration: 0.8 }); });
      marker.on('mouseover', () => { if (!isActive) marker.setIcon(makeSvgIcon(item.type, true)); });
      marker.on('mouseout', () => { if (!isActive) marker.setIcon(makeSvgIcon(item.type, false)); });
      markersRef.current.push(marker);
    });
  }, [allItems, activeDestination, onMarkerClick]);

  // Init map once
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

      const map = L.default.map(mapRef.current, {
        scrollWheelZoom: false, zoomControl: false, attributionControl: false,
        fadeAnimation: true, zoomAnimation: true, dragging: !L.default.Browser.mobile,
      } as L.MapOptions).setView([42.0, 3.05], 9);

      L.default.control.attribution({ position: 'bottomright', prefix: '' }).addTo(map);
      L.default.control.zoom({ position: 'topright' }).addTo(map);
      tileLayerRef.current = L.default.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OSM &copy; CARTO', maxZoom: 19, subdomains: 'abcd',
      }).addTo(map);

      if (L.default.Browser.mobile) map.on('click', () => map.dragging.enable());
      map.on('focus', () => map.scrollWheelZoom.enable());
      map.on('blur', () => map.scrollWheelZoom.disable());

      mapInstanceRef.current = map;
      setIsLoaded(true);
      setTimeout(() => setHintVisible(false), 4000);
      setTimeout(() => map.invalidateSize(), 150);

      rebuildMarkers();
    });

    return () => {
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; markersRef.current = []; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rebuild markers when filter changes (after init)
  useEffect(() => {
    if (mapInstanceRef.current) rebuildMarkers();
  }, [filter, rebuildMarkers]);

  const campingCount = campings.length;
  const destCount = destinations.length;
  const shownCount = filter === 'campings' ? campingCount : filter === 'destinations' ? destCount : campingCount + destCount;

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
      <div ref={mapRef} className={`w-full touch-pan-y ${isFullscreen ? 'h-screen' : 'h-[400px] sm:h-[480px] md:h-[540px] lg:h-[600px]'}`} />

      {isLoaded && (
        <>
          {/* Filter tabs */}
          <div className="absolute top-3 left-3 z-[9]">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 flex items-center overflow-hidden">
              {([
                { key: 'all' as const, label: `Alles (${campingCount + destCount})` },
                { key: 'campings' as const, label: `\u26fa ${campingCount}` },
                { key: 'destinations' as const, label: `\ud83d\udccd ${destCount}` },
              ]).map(tab => (
                <button key={tab.key} onClick={() => setFilter(tab.key)}
                  className={`px-2.5 sm:px-3 py-2 text-[11px] sm:text-xs font-semibold transition-colors whitespace-nowrap ${filter === tab.key ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >{tab.label}</button>
              ))}
            </div>
          </div>

          {/* Mobile count */}
          <div className="absolute bottom-3 right-3 z-[9] sm:hidden">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg px-2.5 py-1.5 shadow-lg border border-gray-100 flex items-center gap-1.5">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-[10px] font-semibold text-gray-600">{shownCount} op kaart</span>
            </div>
          </div>

          {/* Controls */}
          <div className="absolute bottom-3 left-3 z-[9] flex flex-col gap-1.5">
            <button onClick={toggleFullscreen} className="w-8 h-8 sm:w-9 sm:h-9 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100 flex items-center justify-center text-gray-600 hover:text-primary transition-all" title="Volledig scherm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
            </button>
            <button onClick={locateMe} disabled={locating} className="w-8 h-8 sm:w-9 sm:h-9 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100 flex items-center justify-center text-gray-600 hover:text-primary transition-all disabled:opacity-50" title="Mijn locatie">
              {locating ? <div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><line x1="1" y1="12" x2="7" y2="12"/><line x1="17" y1="12" x2="23" y2="12"/><line x1="12" y1="1" x2="12" y2="7"/><line x1="12" y1="17" x2="12" y2="23"/></svg>}
            </button>
            <button onClick={fitAll} className="w-8 h-8 sm:w-9 sm:h-9 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100 flex items-center justify-center text-gray-600 hover:text-primary transition-all" title="Alles tonen">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><circle cx="15.5" cy="8.5" r="1.5"/><circle cx="15.5" cy="15.5" r="1.5"/><circle cx="8.5" cy="15.5" r="1.5"/></svg>
            </button>
            <button onClick={toggleSatellite} className={`w-8 h-8 sm:w-9 sm:h-9 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100 flex items-center justify-center transition-all ${isSatellite ? 'bg-primary text-white' : 'bg-white/95 text-gray-600 hover:text-primary'}`} title={isSatellite ? 'Straten' : 'Satelliet'}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            </button>
          </div>
        </>
      )}

      {hintVisible && (
        <div className="sm:hidden absolute bottom-12 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[11px] px-3 py-1.5 rounded-full backdrop-blur-sm pointer-events-none animate-pulse z-20">
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
        .leaflet-control-zoom { border: none !important; box-shadow: 0 2px 12px rgba(0,0,0,.12) !important; border-radius: 10px !important; overflow: hidden; }
        .leaflet-control-zoom a { width: 32px !important; height: 32px !important; line-height: 32px !important; font-size: 16px !important; color: #1a1a2e !important; background: #fff !important; border-bottom: 1px solid #eee !important; }
        .leaflet-control-zoom a:last-child { border-bottom: none !important; }
        .leaflet-control-zoom a:hover { background: #f5f5f5 !important; }
        .pretty-popup .leaflet-popup-content-wrapper { border-radius: 14px !important; padding: 0 !important; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,.15) !important; border: 1px solid rgba(0,0,0,.06); }
        .pretty-popup .leaflet-popup-content { margin: 0 !important; line-height: 1.4 !important; width: 250px !important; }
        @media (min-width: 640px) { .pretty-popup .leaflet-popup-content { width: 270px !important; } }
        .pretty-popup .leaflet-popup-tip { box-shadow: 0 4px 12px rgba(0,0,0,.08); }
        .pretty-popup .leaflet-popup-close-button { color: #fff !important; font-size: 20px !important; z-index: 10; text-shadow: 0 1px 4px rgba(0,0,0,.5); top: 4px !important; right: 6px !important; }
        .map-popup-card { font-family: 'DM Sans', system-ui, sans-serif; }
        .map-popup-img { width: 100%; height: 120px; object-fit: cover; display: block; }
        @media (min-width: 640px) { .map-popup-img { height: 140px; } }
        .map-popup-body { padding: 10px 12px 12px; }
        @media (min-width: 640px) { .map-popup-body { padding: 12px 14px 14px; } }
        .map-popup-type { font-size: 10px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px; }
        .map-popup-title { margin: 0 0 2px; font-size: 15px; font-weight: 700; color: #1a1a2e; }
        @media (max-width: 639px) { .map-popup-title { font-size: 13px; } }
        .map-popup-region { margin: 0 0 4px; font-size: 11px; color: #888; font-weight: 500; }
        .map-popup-desc { margin: 0 0 10px; font-size: 12px; color: #555; line-height: 1.45; }
        @media (max-width: 639px) { .map-popup-desc { font-size: 11px; margin-bottom: 8px; } }
        .map-popup-actions { display: flex; gap: 8px; align-items: center; }
        .map-popup-btn { display: inline-block; background: linear-gradient(135deg, #0F172A, #020617); color: #fff !important; padding: 7px 16px; border-radius: 8px; font-size: 12px; font-weight: 600; text-decoration: none; transition: transform 0.15s; box-shadow: 0 2px 8px rgba(15,23,42,.25); flex: 1; text-align: center; }
        .map-popup-btn:hover { transform: translateY(-1px); }
        .map-popup-gmaps { display: inline-flex; align-items: center; gap: 4px; padding: 7px 10px; border-radius: 8px; font-size: 11px; font-weight: 600; color: #4285F4 !important; background: #EEF4FF; text-decoration: none; transition: background 0.15s; white-space: nowrap; }
        .map-popup-gmaps:hover { background: #D6E4FF; }
        .leaflet-control-attribution { font-size: 10px !important; background: rgba(255,255,255,.7) !important; padding: 2px 6px !important; }
        .leaflet-control-attribution a { color: #888 !important; }
        .leaflet-container { cursor: grab; }
        .leaflet-container:active { cursor: grabbing; }
      `}</style>
    </div>
  );
}
