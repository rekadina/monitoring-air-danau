"use client";

import { LucideIcon } from "lucide-react";

interface SensorCardProps {
  title: string;
  value: number;
  unit: string;
  icon: LucideIcon;
  status: "good" | "warning" | "critical";
  statusLabel?: string;
  min: number;
  max: number;
}

const STATUS_STYLES = {
  good: {
    border: "border-green-500/40 dark:border-green-500/30",
    bg: "bg-green-950/30 dark:bg-green-950/40",
    badge: "bg-green-500/20 text-green-400 border-green-500/30",
    bar: "from-blue-400 to-teal-400",
  },
  warning: {
    border: "border-yellow-500/50 dark:border-yellow-500/40",
    bg: "bg-yellow-950/30 dark:bg-yellow-950/40",
    badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    bar: "from-yellow-400 to-orange-400",
  },
  critical: {
    border: "border-red-500/50 dark:border-red-500/40",
    bg: "bg-red-950/30 dark:bg-red-950/40",
    badge: "bg-red-500/20 text-red-400 border-red-500/30",
    bar: "from-red-400 to-orange-500",
  },
};

export function SensorCard({
  title,
  value,
  unit,
  icon: Icon,
  status,
  statusLabel,
  min,
  max,
}: SensorCardProps) {
  const styles = STATUS_STYLES[status];

  // Posisi progress bar (di-clamp 0-100% biar tidak keluar kalau value di luar min/max)
  const percent = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  return (
    <div
      className={`rounded-xl border-2 p-4 ${styles.border} ${styles.bg} transition-colors`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-300">{title}</span>
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-blue-300" />
        </div>
      </div>

      <div className="flex items-baseline gap-1 mb-3">
        <span className="text-2xl sm:text-3xl font-bold text-white">
          {value.toFixed(1)}
        </span>
        {unit && <span className="text-xs sm:text-sm text-gray-400">{unit}</span>}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-2">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${styles.bar}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
        <span>Min: {min}</span>
        <span>Max: {max}</span>
      </div>

      {/* Status badge */}
      {statusLabel && (
        <div
          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${styles.badge}`}
        >
          {statusLabel}
        </div>
      )}
    </div>
  );
}