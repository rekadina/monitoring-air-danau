'use client'
import React, { useState, useEffect, useCallback, useRef } from "react";
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
  Download,
  FileText,
  FileSpreadsheet,
  ChevronDown,
} from "lucide-react";
import { SensorCard } from "./components/SensorCard";
import { MapLocation } from "./components/MapLocation";
import { ThemeToggle } from "./components/ThemeToggle";
import { LoRaStatus } from "./components/LoRaStatus";
import { LanguageToggle } from "./components/LanguageToggle";
import { LanguageProvider, useLanguage } from "./lib/i18n";
import { buildXlsx } from "./lib/xlsx";
import { buildReportPdf, ReportPeriod } from "./lib/pdfReport";
import {
  getPhStatus,
  getTemperatureStatus,
  getDoStatus,
  getTdsStatus,
  getTurbidityStatus,
  RANGE,
  SensorStatus,
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

// Interval polling (fetch ulang) per rentang waktu — makin kecil rentangnya, makin sering di-fetch
const POLL_INTERVAL_MS: Record<TimeRangeKey, number> = {
  "5s": 2000,        // fetch tiap 2 detik
  "5m": 5000,        // fetch tiap 5 detik
  "30m": 15000,      // fetch tiap 15 detik
  "1h": 30000,       // fetch tiap 30 detik
  "1d": 60000,       // fetch tiap 1 menit
  "1mo": 5 * 60000,  // fetch tiap 5 menit
  "1y": 15 * 60000,  // fetch tiap 15 menit
};

// Tulis angka dua digit
const pad = (n: number) => String(n).padStart(2, "0");

// Pembungkus: menyediakan bahasa untuk seluruh halaman
export default function App() {
  return (
    <LanguageProvider>
      <Dashboard />
    </LanguageProvider>
  );
}

function Dashboard() {
  const { lang, t } = useLanguage();
  // Pilih label status sesuai bahasa
  const lbl = (s: SensorStatus) => (lang === "id" ? s.labelId : s.label);
  const [mounted, setMounted] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  const [currentData, setCurrentData] = useState<SensorData>({
    dissolvedOxygen: 0,
    ph: 0,
    conductivity: 0,
    turbidity: 0,
    temperature: 0,
    timestamp: new Date(0),
  });

  const [historicalData, setHistoricalData] = useState<HistoricalPoint[]>([]);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const downloadRef = useRef<HTMLDivElement>(null);
  const [timeRange, setTimeRange] = useState<TimeRangeKey>("1h");
  const [gpsLocation] = useState({
    latitude: 2.388634,
    longitude: 99.143356,
    deviceName: "WQ-Monitor-001",
  });

  // Ambil data dari API route (yang query ke InfluxDB pakai Flux)
  const fetchHistoricalData = useCallback(async (range: TimeRangeKey) => {
    try {
      const res = await fetch(`/api/sensor?range=${range}`);
      if (!res.ok) {
        console.error("Failed to fetch sensor data:", res.statusText);
        return;
      }

      const data: HistoricalPoint[] = await res.json();
      setHistoricalData(data);

      // Ambil nilai TERAKHIR YANG TIDAK null untuk tiap sensor,
      // supaya baris terakhir yang kosong sebagian tidak membuat kartu jadi 0.0
      const FIELDS = [
        "dissolvedOxygen",
        "ph",
        "conductivity",
        "turbidity",
        "temperature",
      ] as const;
      const found: Partial<Record<(typeof FIELDS)[number], number>> = {};
      let latestTs = 0;

      for (let i = data.length - 1; i >= 0; i--) {
        for (const f of FIELDS) {
          const v = data[i][f];
          if (found[f] === undefined && typeof v === "number" && Number.isFinite(v)) {
            found[f] = v;
            latestTs = Math.max(latestTs, data[i].timestamp);
          }
        }
        if (FIELDS.every((f) => found[f] !== undefined)) break;
      }

      if (latestTs > 0) {
        setCurrentData((prev) => ({
          dissolvedOxygen: found.dissolvedOxygen ?? prev.dissolvedOxygen,
          ph: found.ph ?? prev.ph,
          conductivity: found.conductivity ?? prev.conductivity,
          turbidity: found.turbidity ?? prev.turbidity,
          temperature: found.temperature ?? prev.temperature,
          timestamp: new Date(latestTs),
        }));
      }
    } catch (error) {
      console.error("Error fetching sensor data:", error);
    }
  }, []);

  // Set mounted setelah render client - cegah hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Tutup menu download saat klik di luar menu atau menekan Escape
  useEffect(() => {
    if (!downloadOpen) return;
    const onClick = (e: MouseEvent) => {
      if (downloadRef.current && !downloadRef.current.contains(e.target as Node)) {
        setDownloadOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDownloadOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [downloadOpen]);

  // Fetch data setiap kali timeRange berubah
  useEffect(() => {
    fetchHistoricalData(timeRange);
  }, [timeRange, fetchHistoricalData]);

  // Polling — fetch ulang secara berkala menggantikan realtime WebSocket
  useEffect(() => {
    const interval = setInterval(() => {
      fetchHistoricalData(timeRange);
    }, POLL_INTERVAL_MS[timeRange]);

    return () => clearInterval(interval);
  }, [timeRange, fetchHistoricalData]);

  // ===== Download laporan: 1 file berisi kelima sensor, sesuai rentang waktu yang dipilih =====
  const REPORT_HEADER = [
    "Timestamp",
    "Dissolved Oxygen (mg/L)",
    "pH",
    "Total Dissolved Solids (mg/L)",
    "Turbidity (NTU)",
    "Temperature (°C)",
  ];

  const reportRows = () =>
    historicalData.map((p) => [
      new Date(p.timestamp),
      p.dissolvedOxygen,
      p.ph,
      p.conductivity,
      p.turbidity,
      p.temperature,
    ]);

  const fileStamp = () => {
    const now = new Date();
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  };

  const saveBlob = (blob: Blob, ext: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `water-quality-${gpsLocation.deviceName}-${timeRange}-${fileStamp()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- CSV ---
  const handleDownloadCsv = () => {
    if (historicalData.length === 0) return;

    const fmtTime = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

    // Format mengikuti bahasa yang dipilih:
    //  EN -> pemisah kolom koma, desimal titik
    //  ID -> pemisah kolom titik koma, desimal koma (Excel dengan pengaturan wilayah Indonesia)
    const isId = lang === "id";
    const sep = isId ? ";" : ",";
    const num = (v: number | null | undefined) =>
      typeof v === "number" && Number.isFinite(v)
        ? isId
          ? String(v).replace(".", ",")
          : String(v)
        : "";

    const lines = reportRows().map((r) => [
      fmtTime(r[0] as Date),
      num(r[1] as number),
      num(r[2] as number),
      num(r[3] as number),
      num(r[4] as number),
      num(r[5] as number),
    ]);

    // "\uFEFF" = BOM supaya Excel membaca UTF-8 dengan benar
    const csv =
      "\uFEFF" + [REPORT_HEADER, ...lines].map((r) => r.join(sep)).join("\r\n");
    saveBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), "csv");
  };

  // --- Excel (.xlsx): angka & waktu tersimpan sebagai angka/tanggal sungguhan, tidak bergantung pengaturan wilayah ---
  const handleDownloadXlsx = () => {
    if (historicalData.length === 0) return;
    const bytes = buildXlsx(REPORT_HEADER, reportRows(), [20, 24, 8, 30, 16, 18]);
    saveBlob(
      new Blob([bytes as BlobPart], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      "xlsx"
    );
  };

  // --- PDF: laporan mingguan / bulanan / tahunan (tidak tergantung rentang waktu yang dipilih di grafik) ---
  const handleDownloadPdf = async (period: ReportPeriod) => {
    setPdfLoading(true);
    try {
      // Mingguan memakai data 1 bulan lalu disaring 7 hari terakhir
      const range = period === "yearly" ? "1y" : "1mo";
      const res = await fetch(`/api/sensor?range=${range}`);
      let rows: HistoricalPoint[] = res.ok ? await res.json() : [];
      if (period === "weekly") {
        const since = Date.now() - 7 * 24 * 3600 * 1000;
        rows = rows.filter((p) => p.timestamp >= since);
      }

      const bytes = buildReportPdf(rows, {
        lang,
        period,
        deviceName: gpsLocation.deviceName,
        latitude: gpsLocation.latitude,
        longitude: gpsLocation.longitude,
      });
      if (!bytes) {
        alert(t("pdfNoData"));
        return;
      }
      const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `water-quality-report-${gpsLocation.deviceName}-${period}-${fileStamp()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error creating PDF report:", error);
      alert(t("pdfNoData"));
    } finally {
      setPdfLoading(false);
    }
  };

  // Ringkasan kualitas air = status terburuk dari kelima sensor
  const allStatuses = [
    getDoStatus(currentData.dissolvedOxygen),
    getPhStatus(currentData.ph),
    getTdsStatus(currentData.conductivity),
    getTurbidityStatus(currentData.turbidity),
    getTemperatureStatus(currentData.temperature),
  ];
  const overall = allStatuses.some((s) => s.level === "critical")
    ? { label: t("qPoor"), color: "text-red-600 dark:text-red-400" }
    : allStatuses.some((s) => s.level === "warning")
    ? { label: t("qFair"), color: "text-yellow-600 dark:text-yellow-400" }
    : { label: t("qGood"), color: "text-green-600 dark:text-green-400" };

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
                  {t("title")}
                </h1>
                <p className="text-blue-100 dark:text-blue-200 text-xs sm:text-sm mt-0.5">
                  {t("subtitle")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-white/20 dark:bg-gray-800/40 backdrop-blur-sm px-3 py-1.5 rounded-lg">
              <Activity className="w-4 h-4 animate-pulse" />
              <span className="font-medium text-xs sm:text-sm">{t("realtimeActive")}</span>
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
              {t("realtimeData")}
            </h2>
            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {mounted
                ? `${t("lastUpdated")}: ${currentData.timestamp.toLocaleTimeString(lang === "id" ? "id-ID" : "en-US")}`
                : t("loading")}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
            <SensorCard
              title={t("doTitle")}
              value={currentData.dissolvedOxygen}
              unit="mg/L"
              icon={Droplets}
              status={getDoStatus(currentData.dissolvedOxygen).level}
              statusLabel={lbl(getDoStatus(currentData.dissolvedOxygen))}
              min={RANGE.dissolvedOxygen.min}
              max={RANGE.dissolvedOxygen.max}
            />
            <SensorCard
              title={t("phTitle")}
              value={currentData.ph}
              unit=""
              icon={TestTube}
              status={getPhStatus(currentData.ph).level}
              statusLabel={lbl(getPhStatus(currentData.ph))}
              min={RANGE.ph.min}
              max={RANGE.ph.max}
            />
            <SensorCard
              title={t("condTitle")}
              value={currentData.conductivity}
              unit="mg/L"
              icon={Zap}
              status={getTdsStatus(currentData.conductivity).level}
              statusLabel={lbl(getTdsStatus(currentData.conductivity))}
              min={RANGE.conductivity.min}
              max={RANGE.conductivity.max}
            />
            <SensorCard
              title={t("turbTitle")}
              value={currentData.turbidity}
              unit="NTU"
              icon={Eye}
              status={getTurbidityStatus(currentData.turbidity).level}
              statusLabel={lbl(getTurbidityStatus(currentData.turbidity))}
              min={RANGE.turbidity.min}
              max={RANGE.turbidity.max}
            />
            <SensorCard
              title={t("tempTitle")}
              value={currentData.temperature}
              unit="°C"
              icon={Thermometer}
              status={getTemperatureStatus(currentData.temperature).level}
              statusLabel={lbl(getTemperatureStatus(currentData.temperature))}
              min={RANGE.temperature.min}
              max={RANGE.temperature.max}
            />
          </div>
        </section>

        {/* Sensor Statistics (Grafana-style) — above the map */}
        <section className="mb-6 sm:mb-8">
          <div className="flex justify-end mb-3">
            <div className="relative" ref={downloadRef}>
              <button
                type="button"
                onClick={() => setDownloadOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={downloadOpen}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs sm:text-sm font-medium hover:bg-blue-700 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>{pdfLoading ? t("pdfPreparing") : t("downloadMenu")}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${downloadOpen ? "rotate-180" : ""}`}
                />
              </button>

              {downloadOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-64 z-20 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden"
                >
                  <div className="px-3 py-2.5">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 mt-0.5 text-red-600 dark:text-red-400 flex-shrink-0" />
                      <span>
                        <span className="block text-sm font-semibold text-gray-800 dark:text-white">PDF</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">{t("dlPdfDesc")}</span>
                      </span>
                    </div>
                    <div className="mt-2 ml-8 flex gap-1.5">
                      {(
                        [
                          ["weekly", "pdfWeekly"],
                          ["monthly", "pdfMonthly"],
                          ["yearly", "pdfYearly"],
                        ] as const
                      ).map(([period, labelKey]) => (
                        <button
                          key={period}
                          type="button"
                          role="menuitem"
                          disabled={pdfLoading}
                          onClick={() => {
                            setDownloadOpen(false);
                            handleDownloadPdf(period);
                          }}
                          className="flex-1 px-2 py-1 rounded-md text-xs font-medium border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                        >
                          {t(labelKey)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    disabled={historicalData.length === 0}
                    onClick={() => {
                      setDownloadOpen(false);
                      handleDownloadXlsx();
                    }}
                    className="w-full flex items-start gap-3 px-3 py-2.5 text-left border-t border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                  >
                    <FileSpreadsheet className="w-5 h-5 mt-0.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <span>
                      <span className="block text-sm font-semibold text-gray-800 dark:text-white">Excel (.xlsx)</span>
                      <span className={`block text-xs ${historicalData.length === 0 ? "text-amber-600 dark:text-amber-400" : "text-gray-500 dark:text-gray-400"}`}>
                        {historicalData.length === 0 ? t("dlNoData") : t("dlXlsxDesc")}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    disabled={historicalData.length === 0}
                    onClick={() => {
                      setDownloadOpen(false);
                      handleDownloadCsv();
                    }}
                    className="w-full flex items-start gap-3 px-3 py-2.5 text-left border-t border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                  >
                    <Download className="w-5 h-5 mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <span>
                      <span className="block text-sm font-semibold text-gray-800 dark:text-white">CSV</span>
                      <span className={`block text-xs ${historicalData.length === 0 ? "text-amber-600 dark:text-amber-400" : "text-gray-500 dark:text-gray-400"}`}>
                        {historicalData.length === 0 ? t("dlNoData") : t("dlCsvDesc")}
                      </span>
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
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

        {/* LoRa Status (kiri) + System Info (kanan) */}
        <section className="mb-6 sm:mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-stretch">
            <LoRaStatus />

            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 sm:p-6 border-2 border-blue-200/50 dark:border-gray-700/50 flex flex-col justify-center divide-y divide-blue-200/50 dark:divide-gray-700/50">
              <div className="py-3 first:pt-0 flex items-center justify-between gap-4">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t("systemStatus")}</p>
                <p className="text-base sm:text-lg font-semibold text-green-600 dark:text-green-400">{t("normalOperation")}</p>
              </div>
              <div className="py-3 flex items-center justify-between gap-4">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t("waterQuality")}</p>
                <p className={`text-base sm:text-lg font-semibold ${overall.color}`}>{overall.label}</p>
              </div>
              <div className="py-3 last:pb-0 flex items-center justify-between gap-4">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t("deviceLocation")}</p>
                <p className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">{t("lakeToba")}</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}