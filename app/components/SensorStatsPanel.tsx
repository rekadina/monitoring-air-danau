"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Droplet, Gauge, Zap, Eye, Thermometer } from "lucide-react";
import { useLanguage, TKey } from "../lib/i18n";

interface HistoricalPoint {
  timestamp: number; // epoch ms — posisi horizontal asli
  dissolvedOxygen: number;
  ph: number;
  conductivity: number;
  turbidity: number;
  temperature: number;
}

type SensorKey = keyof Omit<HistoricalPoint, "timestamp">;

interface SensorConfig {
  key: SensorKey;
  labelKey: TKey;
  unit: string;
  icon: React.ElementType;
}

// Urutan sama dengan kartu sensor di atas: DO, pH, TDS, Turbidity, Temperature
const SENSORS: SensorConfig[] = [
  { key: "dissolvedOxygen", labelKey: "chartDo", unit: "mg/L", icon: Droplet },
  { key: "ph", labelKey: "chartPh", unit: "", icon: Gauge },
  { key: "conductivity", labelKey: "chartTds", unit: "mg/L", icon: Zap },
  { key: "turbidity", labelKey: "chartTurb", unit: "NTU", icon: Eye },
  { key: "temperature", labelKey: "chartTemp", unit: "°C", icon: Thermometer },
];

export const TIME_RANGES = [
  { key: "5s", labelKey: "range5s" },
  { key: "5m", labelKey: "range5m" },
  { key: "30m", labelKey: "range30m" },
  { key: "1h", labelKey: "range1h" },
  { key: "1d", labelKey: "range1d" },
  { key: "1mo", labelKey: "range1mo" },
  { key: "1y", labelKey: "range1y" },
] as const satisfies ReadonlyArray<{ key: string; labelKey: TKey }>;

export type TimeRangeKey = (typeof TIME_RANGES)[number]["key"];

export function formatAxisTime(
  ts: number,
  range: TimeRangeKey,
  locale: string = "en-US"
): string {
  const date = new Date(ts);
  switch (range) {
    case "5s":
      return date.toLocaleTimeString(locale, { minute: "2-digit", second: "2-digit" });
    case "5m":
    case "30m":
    case "1h":
      return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
    case "1d":
      return date.toLocaleTimeString(locale, { hour: "2-digit" });
    case "1mo":
      return date.toLocaleDateString(locale, { day: "2-digit", month: "short" });
    case "1y":
      return date.toLocaleDateString(locale, { month: "short", year: "numeric" });
  }
}

// Warna grafik per tema (recharts butuh nilai warna langsung, bukan class Tailwind)
const COLORS = {
  light: { grid: "#e5e7eb", axis: "#d1d5db", tick: "#4b5563", line: "#16a34a" },
  dark: { grid: "#2a2f3a", axis: "#2a2f3a", tick: "#6b7280", line: "#4ade80" },
};

// Deteksi mode gelap dari class "dark" di <html> (diatur oleh ThemeToggle)
function useIsDark(): boolean {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

interface SensorStatsPanelProps {
  data: HistoricalPoint[];
  timeRange?: TimeRangeKey;
  onTimeRangeChange: (range: TimeRangeKey) => void;
}

function CustomTooltip({ active, payload, label, unit, timeRange, locale }: any) {
  if (!active || !payload || !payload.length || !isNum(payload[0].value)) return null;
  return (
    <div className="bg-white dark:bg-[#1a1f2e] border border-gray-200 dark:border-gray-700 rounded px-3 py-2 text-xs shadow-md">
      <div className="text-gray-500 dark:text-gray-400 mb-1">
        {formatAxisTime(label, timeRange, locale)}
      </div>
      <div className="text-green-600 dark:text-green-400 font-medium">
        {payload[0].value.toFixed(2)} {unit}
      </div>
    </div>
  );
}

export default function SensorStatsPanel({
  data,
  timeRange = "1h",
  onTimeRangeChange,
}: SensorStatsPanelProps) {
  const { lang, t } = useLanguage();
  const locale = lang === "id" ? "id-ID" : "en-US";
  const isDark = useIsDark();
  const c = isDark ? COLORS.dark : COLORS.light;

  const isLoading = !data || data.length === 0;
  const domain: [number, number] | undefined =
    data.length > 0 ? [data[0].timestamp, data[data.length - 1].timestamp] : undefined;

  // Border antar kartu grafik: garis atas (kecuali baris pertama) dan garis kanan di kolom kiri
  const cellBorder = (i: number) =>
    [
      i === 1 ? "border-t md:border-t-0" : i >= 2 ? "border-t" : "",
      i % 2 === 0 && i !== SENSORS.length - 1 ? "md:border-r" : "",
      "border-gray-200 dark:border-gray-800",
    ].join(" ");

  return (
    <div className="bg-white dark:bg-[#111318] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-none overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex-wrap gap-2">
        <h2 className="text-sm font-medium text-gray-800 dark:text-gray-200">
          📊 {t("panelTitle")}
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {TIME_RANGES.map((range) => (
            <button
              key={range.key}
              onClick={() => onTimeRangeChange(range.key)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                timeRange === range.key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300 dark:bg-[#1a1f2e] dark:text-gray-400 dark:hover:bg-[#232838] dark:border-gray-700"
              }`}
            >
              {t(range.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-wrap justify-center">
          {SENSORS.map((sensor, i) => (
            <div
              key={sensor.key}
              className={`h-64 animate-pulse bg-gray-100/70 dark:bg-gray-800/30 w-full md:w-1/2 ${cellBorder(i)}`}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap justify-center">
          {SENSORS.map((sensor, i) => {
            const Icon = sensor.icon;

            // Nilai terakhir yang valid (abaikan null di ujung data)
            let current: number | null = null;
            for (let k = data.length - 1; k >= 0; k--) {
              const v = data[k][sensor.key];
              if (isNum(v)) {
                current = v;
                break;
              }
            }

            return (
              <div key={sensor.key} className={`p-3 w-full md:w-1/2 ${cellBorder(i)}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {t(sensor.labelKey)}
                  </span>
                  <span className="text-xs text-gray-500 ml-auto">
                    {current !== null ? current.toFixed(2) : "--"} {sensor.unit}
                  </span>
                </div>

                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
                      <XAxis
                        dataKey="timestamp"
                        type="number"
                        domain={domain}
                        scale="time"
                        tickFormatter={(v) => formatAxisTime(v, timeRange, locale)}
                        tick={{ fill: c.tick, fontSize: 10 }}
                        axisLine={{ stroke: c.axis }}
                        tickLine={false}
                        minTickGap={40}
                      />
                      <YAxis
                        tick={{ fill: c.tick, fontSize: 10 }}
                        axisLine={{ stroke: c.axis }}
                        tickLine={false}
                        width={45}
                      />
                      <Tooltip
                        content={
                          <CustomTooltip
                            unit={sensor.unit}
                            timeRange={timeRange}
                            locale={locale}
                          />
                        }
                        cursor={{ stroke: c.line, strokeWidth: 1, strokeDasharray: "3 3" }}
                      />
                      <Line
                        type="linear"
                        dataKey={sensor.key}
                        stroke={c.line}
                        strokeWidth={1.5}
                        dot={false}
                        connectNulls
                        isAnimationActive={false}
                        activeDot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex items-center gap-1.5 mt-1 pl-1">
                  <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: c.line }} />
                  <span className="text-[10px] text-gray-500">{t("legendAvg")}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
