'use client'
import React, { useState, useEffect } from 'react';
import { Radio, Signal, SignalHigh, SignalLow, SignalMedium, PackageX } from 'lucide-react';
import { useLanguage } from '../lib/i18n';

// Data asli dari gateway LoRa (Raspberry Pi -> InfluxDB), lewat /api/lora
interface LoraData {
  packets: number;
  expected?: number;
  packetLoss?: number;
  rssi?: number;
  snr?: number;
  lastPacket?: number;
}

const POLL_MS = 15000;
const OFFLINE_AFTER_MS = 120000;

export function LoRaStatus() {
  const { t } = useLanguage();
  const [lora, setLora] = useState<LoraData | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/lora');
        if (res.ok && !cancelled) setLora(await res.json());
      } catch {}
      if (!cancelled) setNow(Date.now());
    };
    load();
    const interval = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
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

  const rssiVal = lora && lora.packets > 0 && typeof lora.rssi === 'number' ? lora.rssi : null;
  const snrVal = lora && typeof lora.snr === 'number' ? lora.snr : null;
  const lastPacket = lora && typeof lora.lastPacket === 'number' ? lora.lastPacket : null;
  const hasData = rssiVal !== null;
  const rssi = rssiVal !== null ? getRssiQuality(rssiVal) : null;
  const RssiIcon = rssi ? rssi.icon : Signal;
  const loss = lora && typeof lora.packetLoss === 'number' ? lora.packetLoss : 0;
  const packets = lora ? lora.packets : 0;
  const expected = lora && typeof lora.expected === 'number' ? lora.expected : 0;
  const offline = hasData && now > 0 && lastPacket !== null && now - lastPacket > OFFLINE_AFTER_MS;
  const lastTime = lastPacket !== null ? new Date(lastPacket).toLocaleTimeString() : '';

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-4 sm:p-6 border-2 border-blue-200/50 dark:border-gray-600/50">
      <div className="flex items-center gap-2 mb-4">
        <Radio className={`w-5 h-5 sm:w-6 sm:h-6 ${hasData && !offline ? 'text-green-600 dark:text-green-400 animate-pulse' : 'text-gray-400'}`} />
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">{t('loraTitle')}</h3>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3 flex-1 content-center">
        {/* RSSI */}
        <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2 sm:p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <RssiIcon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${rssi ? rssi.color : 'text-gray-400'}`} />
            <p className="text-xs text-gray-500 dark:text-gray-400">RSSI</p>
          </div>
          <p className={`text-sm sm:text-base font-semibold ${rssi ? rssi.color : 'text-gray-400'}`}>
            {rssiVal !== null ? `${rssiVal.toFixed(0)} dBm` : '—'}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{rssi ? rssi.label : t('loraNoData')}</p>
        </div>

        {/* SNR */}
        <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2 sm:p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Signal className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400" />
            <p className="text-xs text-gray-500 dark:text-gray-400">SNR</p>
          </div>
          <p className="text-sm sm:text-base font-semibold text-purple-600 dark:text-purple-400">
            {hasData && snrVal !== null ? `${snrVal.toFixed(1)} dB` : '—'}
          </p>
        </div>

        {/* Packet Loss */}
        <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2 sm:p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <PackageX className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${hasData ? getLossColor(loss) : 'text-gray-400'}`} />
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('packetLoss')}</p>
          </div>
          <p className={`text-sm sm:text-base font-semibold ${hasData ? getLossColor(loss) : 'text-gray-400'}`}>
            {hasData ? `${loss.toFixed(1)}%` : '—'}
          </p>
          {hasData && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              {packets}/{expected}
            </p>
          )}
        </div>
      </div>

      {hasData && (
        <p className={`mt-3 text-xs ${offline ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
          {offline ? t('loraOffline') : `${t('loraLastPacket')}: ${lastTime}`} · {t('packetLoss')}: {t('loraLossNote')}
        </p>
      )}
    </div>
  );
}
