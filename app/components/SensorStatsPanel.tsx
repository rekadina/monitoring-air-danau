"use client";

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

interface HistoricalPoint {
  timestamp: number; // epoch ms — posisi horizontal asli
  dissolvedOxygen: number;
  ph: number;
  conductivity: number;
  turbidity: number;
  temperature: number;
}

interface SensorConfig {
  key: keyof Omit<HistoricalPoint, "timestamp">;
  label: string;
  unit: string;
  color: string;
  icon: React.ElementType;
}

const SENSORS: SensorConfig[] = [
  { key: "temperature", label: "Temperature", unit: "°C", color: "#4ade80", icon: Thermometer },
  { key: "ph", label: "pH", unit: "", color: "#4ade80", icon: Gauge },
  { key: "conductivity", label: "TDS / Konduktivitas", unit: "PPM", color: "#4ade80", icon: Zap },
  { key: "turbidity", label: "Turbidity", unit: "NTU", color: "#4ade80", icon: Eye },
  { key: "dissolvedOxygen", label: "Dissolved Oxygen", unit: "mg/L", color: "#4ade80", icon: Droplet },
];

export const TIME_RANGES = [
  { key: "1s", label: "1 Detik" },
  { key: "5s", label: "5 Detik" },
  { key: "20s", label: "20 Detik" },
  { key: "15m", label: "15 Menit" },
  { key: "1h", label: "1 Jam" },
  { key: "1d", label: "1 Hari" },
  { key: "1mo", label: "1 Bulan" },
  { key: "1y", label: "1 Tahun" },
] as const;

export type TimeRangeKey = (typeof TIME_RANGES)[number]["key"];

// Format label sumbu X sesuai rentang waktu
export function formatAxisTime(ts: number, range: TimeRangeKey): string {
  const date = new Date(ts);
  switch (range) {
    case "1s":
    case "5s":
    case "20s":
      return date.toLocaleTimeString("id-ID", { minute: "2-digit", second: "2-digit" });
    case "15m":
    case "1h":
      return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    case "1d":
      return date.toLocaleTimeString("id-ID", { hour: "2-digit" });
    case "1mo":
      // Tambah tahun supaya tidak ada label duplikat kalau rentang datanya lebih dari 1 tahun
      return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "2-digit" });
    case "1y":
      return date.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
  }
}

interface SensorStatsPanelProps {
  data: HistoricalPoint[];
  timeRange?: TimeRangeKey;
  onTimeRangeChange: (range: TimeRangeKey) => void;
}

function CustomTooltip({ active, payload, label, unit, timeRange }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-[#1a1f2e] border border-gray-700 rounded px-3 py-2 text-xs">
      <div className="text-gray-400 mb-1">{formatAxisTime(label, timeRange)}</div>
      <div className="text-green-400 font-medium">
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
  const isLoading = !data || data.length === 0;
  const domain: [number, number] | undefined =
    data.length > 0 ? [data[0].timestamp, data[data.length - 1].timestamp] : undefined;

  return (
    <div className="bg-[#111318] rounded-xl border border-gray-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 flex-wrap gap-2">
        <h2 className="text-sm font-medium text-gray-200">📊 Danau Toba - Monitoring</h2>
        <div className="flex flex-wrap gap-1.5">
          {TIME_RANGES.map((range) => (
            <button
              key={range.key}
              onClick={() => onTimeRangeChange(range.key)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                timeRange === range.key
                  ? "bg-blue-600 text-white"
                  : "bg-[#1a1f2e] text-gray-400 hover:bg-[#232838] border border-gray-700"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-wrap justify-center gap-px bg-gray-800">
          {SENSORS.map((sensor) => (
            <div key={sensor.key} className="bg-[#111318] h-64 animate-pulse w-full md:w-[calc(50%-1px)]" />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-px bg-gray-800">
          {SENSORS.map((sensor) => {
            const Icon = sensor.icon;
            const values = data.map((d) => d[sensor.key] as number);
            const current = values[values.length - 1];

            return (
              <div key={sensor.key} className="bg-[#111318] p-3 w-full md:w-[calc(50%-1px)]">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-xs font-medium text-gray-300">{sensor.label}</span>
                  <span className="text-xs text-gray-500 ml-auto">
                    {current.toFixed(2)} {sensor.unit}
                  </span>
                </div>

                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3a" />
                      <XAxis
                        dataKey="timestamp"
                        type="number"
                        domain={domain}
                        scale="time"
                        tickFormatter={(v) => formatAxisTime(v, timeRange)}
                        tick={{ fill: "#6b7280", fontSize: 10 }}
                        axisLine={{ stroke: "#2a2f3a" }}
                        tickLine={false}
                        minTickGap={40}
                      />
                      <YAxis
                        tick={{ fill: "#6b7280", fontSize: 10 }}
                        axisLine={{ stroke: "#2a2f3a" }}
                        tickLine={false}
                        width={45}
                      />
                      <Tooltip
                        content={<CustomTooltip unit={sensor.unit} timeRange={timeRange} />}
                        cursor={{ stroke: "#4ade80", strokeWidth: 1, strokeDasharray: "3 3" }}
                      />
                      <Line
                        type="linear"
                        dataKey={sensor.key}
                        stroke={sensor.color}
                        strokeWidth={1.5}
                        dot={false}
                        isAnimationActive={false}
                        activeDot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex items-center gap-1.5 mt-1 pl-1">
                  <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: sensor.color }} />
                  <span className="text-[10px] text-gray-500">sensor.mean</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}