'use client'
import React, { useState, useEffect } from "react";
import SensorStatsPanel, { TimeRangeKey } from "./components/SensorStatsPanel";
import {
  Droplets,
  TestTube,
  Zap,
  Eye,
  Thermometer,
  Waves,
  Clock,
  Activity,
} from "lucide-react";
import { SensorCard } from "./components/SensorCard";
import { MapLocation } from "./components/MapLocation";
import { ThemeToggle } from "./components/ThemeToggle";
import { LoRaStatus } from "./components/LoRaStatus";
import {
  getPhStatus,
  getTemperatureStatus,
  getDoStatus,
  getTdsStatus,
  getTurbidityStatus,
} from "./lib/waterQuality";

interface SensorData {
  dissolvedOxygen: number;
  ph: number;
  conductivity: number;
  turbidity: number;
  temperature: number;
  timestamp: Date;
}

interface HistoricalPoint {
  timestamp: number;
  dissolvedOxygen: number;
  ph: number;
  conductivity: number;
  turbidity: number;
  temperature: number;
}

export default function App() {
  const [mounted, setMounted] = useState(false);

  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [currentData, setCurrentData] = useState<SensorData>({
    dissolvedOxygen: 6.5,
    ph: 7.2,
    conductivity: 75,
    turbidity: 3.5,
    temperature: 25.5,
    timestamp: new Date(0),
  });

  const [historicalData, setHistoricalData] = useState<HistoricalPoint[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRangeKey>("1h");
  const [gpsLocation] = useState({
    latitude: 2.6869,
    longitude: 98.8738,
    deviceName: "WQ-Monitor-001",
  });

  // Kecepatan update live (tick sliding window) per rentang waktu
  const REFRESH_MS: Record<TimeRangeKey, number> = {
    "1s": 1000,
    "5s": 5000,
    "20s": 20000,
    "15m": 15 * 60 * 1000,
    "1h": 60 * 60 * 1000,
    "1d": 24 * 60 * 60 * 1000,
    "1mo": 30 * 24 * 60 * 60 * 1000,
    "1y": 365 * 24 * 60 * 60 * 1000,
  };

  // Jumlah titik data yang ditampilkan per rentang waktu
  const POINTS_COUNT_MAP: Record<TimeRangeKey, number> = {
    "1s": 30,
    "5s": 30,
    "20s": 30,
    "15m": 30,
    "1h": 60,
    "1d": 24,
    "1mo": 30, // 30 titik x 1 hari = 30 hari terakhir
    "1y": 12,  // 12 titik x 1 bulan = 12 bulan terakhir
  };

  // Jarak antar titik data historis (beda konsep dari REFRESH_MS)
  const DATA_STEP_MS: Record<TimeRangeKey, number> = {
    "1s": 1000,
    "5s": 5000,
    "20s": 20000,
    "15m": 60 * 1000,               // titik tiap 1 menit, total 30 menit
    "1h": 60 * 1000,                // titik tiap 1 menit, total 60 menit
    "1d": 60 * 60 * 1000,           // titik tiap 1 jam, total 24 jam
    "1mo": 24 * 60 * 60 * 1000,     // titik tiap 1 hari, total 30 hari
    "1y": 30 * 24 * 60 * 60 * 1000, // titik tiap 1 bulan, total 12 bulan
  };

  const generateHistoricalData = (range: TimeRangeKey): HistoricalPoint[] => {
    const data: HistoricalPoint[] = [];
    const now = Date.now();
    const points = POINTS_COUNT_MAP[range];
    const step = DATA_STEP_MS[range];

    // Titik awal (starting point) — dari sini berjalan sebagai random walk
    let doVal = 6.5;
    let phVal = 7.2;
    let condVal = 75;
    let turbVal = 3.5;
    let tempVal = 25.5;

    for (let i = points - 1; i >= 0; i--) {
      doVal = Math.max(4, Math.min(9, doVal + (Math.random() - 0.5) * 0.4));
      phVal = Math.max(5, Math.min(10, phVal + (Math.random() - 0.5) * 0.15));
      condVal = Math.max(30, Math.min(130, condVal + (Math.random() - 0.5) * 8));
      turbVal = Math.max(1, Math.min(6, turbVal + (Math.random() - 0.5) * 0.3));
      tempVal = Math.max(12, Math.min(35, tempVal + (Math.random() - 0.5) * 0.4));

      data.push({
        timestamp: now - i * step,
        dissolvedOxygen: doVal,
        ph: phVal,
        conductivity: condVal,
        turbidity: turbVal,
        temperature: tempVal,
      });
    }

    return data;
  };

  // Set mounted setelah render client - cegah hydration mismatch
  useEffect(() => {
    setMounted(true);
    setCurrentData((prev) => ({ ...prev, timestamp: new Date() }));
  }, []);

  // Generate data awal saat timeRange berubah
  useEffect(() => {
    setHistoricalData(generateHistoricalData(timeRange));
  }, [timeRange]);

  // Grafik bergerak (sliding window) sesuai kecepatan rentang waktu yang dipilih
  useEffect(() => {
    const step = REFRESH_MS[timeRange];

    const interval = setInterval(() => {
      setHistoricalData((prev) => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];

        const newPoint: HistoricalPoint = {
          timestamp: Date.now(),
          dissolvedOxygen: Math.max(4, Math.min(9, last.dissolvedOxygen + (Math.random() - 0.5) * 0.4)),
          ph: Math.max(5, Math.min(10, last.ph + (Math.random() - 0.5) * 0.15)),
          conductivity: Math.max(30, Math.min(130, last.conductivity + (Math.random() - 0.5) * 8)),
          turbidity: Math.max(1, Math.min(6, last.turbidity + (Math.random() - 0.5) * 0.3)),
          temperature: Math.max(12, Math.min(35, last.temperature + (Math.random() - 0.5) * 0.4)),
        };

        return [...prev.slice(1), newPoint];
      });
    }, step);

    return () => clearInterval(interval);
  }, [timeRange]);

  // Update card "Data Real-time" tiap 3 detik
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentData((prev) => ({
        dissolvedOxygen: Math.max(4, Math.min(9, prev.dissolvedOxygen + (Math.random() - 0.5) * 0.3)),
        ph: Math.max(5, Math.min(10, prev.ph + (Math.random() - 0.5) * 0.1)),
        conductivity: Math.max(30, Math.min(130, prev.conductivity + (Math.random() - 0.5) * 6)),
        turbidity: Math.max(1, Math.min(6, prev.turbidity + (Math.random() - 0.5) * 0.3)),
        temperature: Math.max(12, Math.min(35, prev.temperature + (Math.random() - 0.5) * 0.3)),
        timestamp: new Date(),
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-teal-50 to-green-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-teal-600 dark:from-blue-900 dark:to-teal-900 text-white shadow-lg">
        <div className="w-full max-w-screen-xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Waves className="w-7 h-7 sm:w-10 sm:h-10 flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-base sm:text-2xl lg:text-3xl font-bold leading-tight">
                  Sistem Monitoring Kualitas Air
                </h1>
                <p className="text-blue-100 dark:text-blue-200 text-xs sm:text-sm mt-0.5">
                  Danau Toba, Sumatera Utara
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
              <ThemeToggle />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <LoRaStatus isCompact={true} />
            <div className="flex items-center gap-1.5 bg-white/20 dark:bg-gray-800/40 backdrop-blur-sm px-3 py-1.5 rounded-lg">
              <Activity className="w-4 h-4 animate-pulse" />
              <span className="font-medium text-xs sm:text-sm">Real-time Active</span>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full max-w-screen-xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* Real-time Data Cards */}
        <section className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-3 sm:mb-4 flex-wrap">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-700 dark:text-blue-400 flex-shrink-0" />
            <h2 className="text-base sm:text-xl font-semibold text-gray-800 dark:text-white">
              Data Real-time
            </h2>
            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {mounted ? `Terakhir diperbarui: ${currentData.timestamp.toLocaleTimeString("id-ID")}` : "Memuat..."}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
            <SensorCard
              title="Oksigen Terlarut"
              value={currentData.dissolvedOxygen}
              unit="mg/L"
              icon={Droplets}
              status={getDoStatus(currentData.dissolvedOxygen).level}
              statusLabel={getDoStatus(currentData.dissolvedOxygen).label}
              min={5}
              max={8}
            />
            <SensorCard
              title="pH Air"
              value={currentData.ph}
              unit=""
              icon={TestTube}
              status={getPhStatus(currentData.ph).level}
              statusLabel={getPhStatus(currentData.ph).label}
              min={6}
              max={9}
            />
            <SensorCard
              title="Konduktivitas"
              value={currentData.conductivity}
              unit="mg/L"
              icon={Zap}
              status={getTdsStatus(currentData.conductivity).level}
              statusLabel={getTdsStatus(currentData.conductivity).label}
              min={46}
              max={110}
            />
            <SensorCard
              title="Kekeruhan"
              value={currentData.turbidity}
              unit="NTU"
              icon={Eye}
              status={getTurbidityStatus(currentData.turbidity).level}
              statusLabel={getTurbidityStatus(currentData.turbidity).label}
              min={3}
              max={4}
            />
            <SensorCard
              title="Suhu Air"
              value={currentData.temperature}
              unit="°C"
              icon={Thermometer}
              status={getTemperatureStatus(currentData.temperature).level}
              statusLabel={getTemperatureStatus(currentData.temperature).label}
              min={23}
              max={28}
            />
          </div>
        </section>

        {/* Statistik Sensor (Grafana-style) — di atas map */}
        <section className="mb-6 sm:mb-8">
          <SensorStatsPanel
            data={historicalData}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />
        </section>

        {/* Map Location */}
        <section className="mb-6 sm:mb-8">
          <MapLocation
            latitude={gpsLocation.latitude}
            longitude={gpsLocation.longitude}
            deviceName={gpsLocation.deviceName}
            isExpanded={isMapExpanded}
            onToggleExpand={() => setIsMapExpanded(!isMapExpanded)}
          />
        </section>

        {/* LoRa Status */}
        <section className="mb-6 sm:mb-8">
          <LoRaStatus />
        </section>

        {/* Footer Info */}
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 sm:p-6 border-2 border-blue-200/50 dark:border-gray-700/50">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 text-center">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Status Sistem</p>
              <p className="text-base sm:text-lg font-semibold text-green-600 dark:text-green-400">Operasional Normal</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Kualitas Air</p>
              <p className="text-base sm:text-lg font-semibold text-blue-600 dark:text-blue-400">Baik</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Lokasi Perangkat</p>
              <p className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">Danau Toba</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}