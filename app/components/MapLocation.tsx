'use client'
import React, { useEffect, useRef } from 'react';
import { Navigation, Satellite } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { useLanguage } from '../lib/i18n';

interface MapLocationProps {
  latitude?: number;
  longitude?: number;
  deviceName?: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

// Lokasi bawaan perangkat; bisa ditimpa lewat props dari page.tsx
const DEFAULT_LAT = 2.388634;
const DEFAULT_LNG = 99.143356;
const ZOOM = 15;

export function MapLocation({
  latitude = DEFAULT_LAT,
  longitude = DEFAULT_LNG,
  deviceName = 'WQ-Monitor-001',
}: MapLocationProps) {
  const { t } = useLanguage();
  const mapEl = useRef<HTMLDivElement>(null);
  const layerMap = t('layerMap');
  const layerSat = t('layerSatellite');

  useEffect(() => {
    if (!mapEl.current) return;
    let map: import('leaflet').Map | null = null;
    let cancelled = false;

    // Leaflet hanya boleh dimuat di browser (butuh `window`), jadi di-import di dalam effect
    import('leaflet').then((L) => {
      if (cancelled || !mapEl.current) return;

      map = L.map(mapEl.current, { scrollWheelZoom: false }).setView([latitude, longitude], ZOOM);

      const peta = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      });
      const satelit = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 19,
          attribution: 'Tiles &copy; Esri',
        }
      );
      peta.addTo(map);
      L.control
        .layers({ [layerMap]: peta, [layerSat]: satelit }, undefined, { collapsed: true })
        .addTo(map);

      // Marker pakai SVG bawaan (divIcon) supaya tidak perlu file gambar marker Leaflet
      const icon = L.divIcon({
        className: '',
        iconSize: [32, 42],
        iconAnchor: [16, 42],
        popupAnchor: [0, -38],
        html: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
          <path d="M16 0C7.2 0 0 7 0 15.6 0 27 16 42 16 42s16-15 16-26.4C32 7 24.8 0 16 0z" fill="#2563eb" stroke="#fff" stroke-width="2"/>
          <circle cx="16" cy="15.5" r="6" fill="#fff"/>
        </svg>`,
      });

      L.marker([latitude, longitude], { icon })
        .addTo(map)
        .bindPopup(`<strong>${deviceName}</strong><br/>${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);

      // Pastikan ukuran peta benar kalau container berubah ukuran (mis. layout bergeser)
      const ro = new ResizeObserver(() => map?.invalidateSize());
      ro.observe(mapEl.current);
      (map as unknown as { _ro?: ResizeObserver })._ro = ro;
    });

    return () => {
      cancelled = true;
      if (map) {
        (map as unknown as { _ro?: ResizeObserver })._ro?.disconnect();
        map.remove();
        map = null;
      }
    };
  }, [deviceName, latitude, longitude, layerMap, layerSat]);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-4 sm:p-6 border-2 border-blue-200/50 dark:border-gray-600/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">
            {t('deviceLocation')}
          </h3>
        </div>
        {/* Tombol buka di OpenStreetMap */}
        <a
          href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=${ZOOM}/${latitude}/${longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs sm:text-sm font-medium hover:bg-blue-700 transition-all"
        >
          <Satellite className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>{t('openMaps')}</span>
        </a>
      </div>

      {/* Peta Leaflet */}
      <div
        ref={mapEl}
        className="rounded-lg overflow-hidden mb-4 w-full relative z-0"
        style={{ height: '300px' }}
        aria-label={t('deviceLocation')}
      />

      {/* Info koordinat */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2 sm:p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('device')}</p>
          <p className="font-mono text-xs sm:text-sm font-semibold text-gray-800 dark:text-white truncate">
            {deviceName}
          </p>
        </div>
        <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2 sm:p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('latitude')}</p>
          <p className="font-mono text-xs sm:text-sm font-semibold text-gray-800 dark:text-white">
            {latitude.toFixed(6)}°
          </p>
        </div>
        <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2 sm:p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('longitude')}</p>
          <p className="font-mono text-xs sm:text-sm font-semibold text-gray-800 dark:text-white">
            {longitude.toFixed(6)}°
          </p>
        </div>
      </div>
    </div>
  );
}
