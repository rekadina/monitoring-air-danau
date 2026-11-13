'use client'
import React, { useState, useEffect } from 'react';
import { Radio, Signal, SignalHigh, SignalLow, SignalMedium, PackageX } from 'lucide-react';
import { useLanguage } from '../lib/i18n';

// Data dummy sementara — nanti ganti dengan data asli dari gateway LoRa
const DUMMY_INITIAL = { rssi: -65, snr: 8.5, packetLoss: 0.2 };

export function LoRaStatus() {
  const { t } = useLanguage();
  const [lora, setLora] = useState(DUMMY_INITIAL);

  // Update data dummy tiap 5 detik (nilai acak hanya dibuat di browser, aman dari hydration error)
  useEffect(() => {
    const interval = setInterval(() => {
      setLora({
        rssi: -50 + Math.random() * -40,   // -50 s/d -90 dBm
        snr: 5 + Math.random() * 8,        // 5 s/d 13 dB
        packetLoss: 0.2 + Math.random() * 3, // 0,2 s/d 3,2 %
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const getRssiQuality = (rssi: number) => {
    if (rssi > -60) return { label: t('sigVeryGood'), icon: SignalHigh, color: 'text-green-600 dark:text-green-400' };
    if (rssi > -75) return { label: t('sigGood'), icon: SignalMedium, color: 'text-blue-600 dark:text-blue-400' };
    if (rssi > -85) return { label: t('sigFair'), icon: SignalLow, color: 'text-yellow-600 dark:text-yellow-400' };
    return { label: t('sigWeak'), icon: Signal, color: 'text-red-600 dark:text-red-400' };
  };

  const getLossColor = (loss: number) => {
    if (loss < 2) return 'text-green-600 dark:text-green-400';
    if (loss < 5) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const rssi = getRssiQuality(lora.rssi);
  const RssiIcon = rssi.icon;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-4 sm:p-6 border-2 border-blue-200/50 dark:border-gray-600/50">
      <div className="flex items-center gap-2 mb-4">
        <Radio className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400 animate-pulse" />
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">{t('loraTitle')}</h3>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3 flex-1 content-center">
        {/* RSSI */}
        <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2 sm:p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <RssiIcon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${rssi.color}`} />
            <p className="text-xs text-gray-500 dark:text-gray-400">RSSI</p>
          </div>
          <p className={`text-sm sm:text-base font-semibold ${rssi.color}`}>{lora.rssi.toFixed(1)} dBm</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{rssi.label}</p>
        </div>

        {/* SNR */}
        <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2 sm:p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Signal className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400" />
            <p className="text-xs text-gray-500 dark:text-gray-400">SNR</p>
          </div>
          <p className="text-sm sm:text-base font-semibold text-purple-600 dark:text-purple-400">{lora.snr.toFixed(1)} dB</p>
        </div>

        {/* Packet Loss */}
        <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2 sm:p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <PackageX className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${getLossColor(lora.packetLoss)}`} />
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('packetLoss')}</p>
          </div>
          <p className={`text-sm sm:text-base font-semibold ${getLossColor(lora.packetLoss)}`}>{lora.packetLoss.toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );
}
