'use client'
import React from 'react';
import { Navigation, Satellite } from 'lucide-react';

interface MapLocationProps {
  latitude?: number;
  longitude?: number;
  deviceName?: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const LAT = 2.3928639199458006;
const LNG = 98.9534552452306;

export function MapLocation({
  deviceName = 'WQ-Monitor-001',
}: MapLocationProps) {
  const googleMapsEmbedUrl = `https://maps.google.com/maps?q=${LAT},${LNG}&z=15&output=embed&hl=id`;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-4 sm:p-6 border-2 border-blue-200/50 dark:border-gray-600/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">
            Lokasi Perangkat
          </h3>
        </div>
        {/* Tombol buka di Google Maps */}
        <a
          href={`https://www.google.com/maps?q=${LAT},${LNG}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs sm:text-sm font-medium hover:bg-blue-700 transition-all"
        >
          <Satellite className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Buka Maps</span>
        </a>
      </div>

      {/* Google Maps Embed */}
      <div className="rounded-lg overflow-hidden mb-4 w-full" style={{ height: '300px' }}>
        <iframe
          src={googleMapsEmbedUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Lokasi Perangkat"
        />
      </div>

      {/* Info koordinat */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2 sm:p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Perangkat</p>
          <p className="font-mono text-xs sm:text-sm font-semibold text-gray-800 dark:text-white truncate">
            {deviceName}
          </p>
        </div>
        <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2 sm:p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Latitude</p>
          <p className="font-mono text-xs sm:text-sm font-semibold text-gray-800 dark:text-white">
            {LAT.toFixed(6)}°
          </p>
        </div>
        <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2 sm:p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Longitude</p>
          <p className="font-mono text-xs sm:text-sm font-semibold text-gray-800 dark:text-white">
            {LNG.toFixed(6)}°
          </p>
        </div>
      </div>
    </div>
  );
}