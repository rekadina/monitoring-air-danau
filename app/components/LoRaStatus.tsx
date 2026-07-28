'use client'
import React, { useState, useEffect } from 'react';
import { Radio, Signal, SignalHigh, SignalLow, SignalMedium, Battery, Clock } from 'lucide-react';

interface LoRaStatusProps {
  isCompact?: boolean;
}

export function LoRaStatus({ isCompact = false }: LoRaStatusProps) {
  const [mounted, setMounted] = useState(false);
  const [loraData, setLoraData] = useState({
    connected: true,
    rssi: -65,
    snr: 8.5,
    dataRate: 'SF7BW125',
    frequency: 923.2,
    lastPacket: null as Date | null,
    packetsSent: 1247,
    packetsReceived: 1245,
    batteryLevel: 87
  });

  useEffect(() => {
    setMounted(true);
    setLoraData(prev => ({ ...prev, lastPacket: new Date() }));
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      setLoraData(prev => ({
        ...prev,
        rssi: -50 + Math.random() * -40,
        snr: 5 + Math.random() * 8,
        lastPacket: new Date(),
        packetsSent: prev.packetsSent + 1,
        packetsReceived: prev.packetsReceived + (Math.random() > 0.1 ? 1 : 0),
        batteryLevel: Math.max(10, prev.batteryLevel - Math.random() * 0.01)
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, [mounted]);

  const getSignalStrength = (rssi: number): { level: string; icon: any; color: string } => {
    if (rssi > -60) return { level: 'Sangat Baik', icon: SignalHigh, color: 'text-green-600 dark:text-green-400' };
    if (rssi > -75) return { level: 'Baik', icon: SignalMedium, color: 'text-blue-600 dark:text-blue-400' };
    if (rssi > -85) return { level: 'Sedang', icon: SignalLow, color: 'text-yellow-600 dark:text-yellow-400' };
    return { level: 'Lemah', icon: Signal, color: 'text-red-600 dark:text-red-400' };
  };

  const getBatteryColor = (level: number): string => {
    if (level > 50) return 'text-green-600 dark:text-green-400';
    if (level > 20) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const signal = getSignalStrength(loraData.rssi);
  const SignalIcon = signal.icon;
  const packetLoss = ((loraData.packetsSent - loraData.packetsReceived) / loraData.packetsSent * 100).toFixed(1);

  if (isCompact) {
    return (
      <div className="flex items-center gap-2 sm:gap-3 bg-white/20 dark:bg-gray-800/40 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg flex-wrap">
        <div className="flex items-center gap-1.5">
          <Radio className={`w-4 h-4 sm:w-5 sm:h-5 ${loraData.connected ? 'text-green-400 animate-pulse' : 'text-red-400'}`} />
          <span className="font-medium text-xs sm:text-sm">LoRa</span>
        </div>
        <div className="h-4 w-px bg-white/30" />
        <div className="flex items-center gap-1">
          <SignalIcon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${signal.color}`} />
          <span className="text-xs sm:text-sm">{loraData.rssi.toFixed(0)} dBm</span>
        </div>
        <div className="flex items-center gap-1">
          <Battery className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${getBatteryColor(loraData.batteryLevel)}`} />
          <span className="text-xs sm:text-sm">{loraData.batteryLevel.toFixed(0)}%</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-4 sm:p-6 border-2 border-blue-200/50 dark:border-gray-600/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Radio className={`w-5 h-5 sm:w-6 sm:h-6 ${loraData.connected ? 'text-green-600 dark:text-green-400 animate-pulse' : 'text-red-600 dark:text-red-400'}`} />
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">Status LoRa</h3>
        </div>
        <div className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
          loraData.connected
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
        }`}>
          {loraData.connected ? 'Terhubung' : 'Terputus'}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4">
        <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2 sm:p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <SignalIcon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${signal.color}`} />
            <p className="text-xs text-gray-500 dark:text-gray-400">Sinyal</p>
          </div>
          <p className={`text-sm font-semibold ${signal.color}`}>{signal.level}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{loraData.rssi.toFixed(1)} dBm</p>
        </div>

        <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2 sm:p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Signal className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400" />
            <p className="text-xs text-gray-500 dark:text-gray-400">SNR</p>
          </div>
          <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">{loraData.snr.toFixed(1)} dB</p>
        </div>

        <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2 sm:p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Battery className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${getBatteryColor(loraData.batteryLevel)}`} />
            <p className="text-xs text-gray-500 dark:text-gray-400">Baterai</p>
          </div>
          <p className={`text-sm font-semibold ${getBatteryColor(loraData.batteryLevel)}`}>{loraData.batteryLevel.toFixed(0)}%</p>
        </div>

        <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2 sm:p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
            <p className="text-xs text-gray-500 dark:text-gray-400">Paket Terakhir</p>
          </div>
          {/* Render waktu hanya setelah mounted untuk hindari hydration error */}
          <p className="text-sm font-semibold text-gray-800 dark:text-white">
            {mounted && loraData.lastPacket
              ? loraData.lastPacket.toLocaleTimeString('id-ID')
              : '--:--:--'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-white/40 dark:bg-gray-800/40 rounded-lg p-2 sm:p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Data Rate</p>
          <p className="text-sm font-semibold text-gray-800 dark:text-white">{loraData.dataRate}</p>
        </div>
        <div className="bg-white/40 dark:bg-gray-800/40 rounded-lg p-2 sm:p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Frekuensi</p>
          <p className="text-sm font-semibold text-gray-800 dark:text-white">{loraData.frequency} MHz</p>
        </div>
        <div className="bg-white/40 dark:bg-gray-800/40 rounded-lg p-2 sm:p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Packet Loss</p>
          <p className="text-sm font-semibold text-gray-800 dark:text-white">{packetLoss}%</p>
        </div>
      </div>

      <div className="mt-3 sm:mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>Terkirim: {loraData.packetsSent}</span>
        <span>Diterima: {loraData.packetsReceived}</span>
      </div>
    </div>
  );
}