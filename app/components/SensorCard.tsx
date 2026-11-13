"use client";

import { LucideIcon } from "lucide-react";
import { useLanguage } from "../lib/i18n";

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
    border: "border-green-500/60 dark:border-green-500/30",
    bg: "bg-green-50 dark:bg-green-950/40",
    badge:
      "bg-green-100 text-green-700 border-green-300 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30",
    bar: "from-blue-400 to-teal-400",
  },
  warning: {
    border: "border-yellow-500/60 dark:border-yellow-500/40",
    bg: "bg-yellow-50 dark:bg-yellow-950/40",
    badge:
      "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30",
    bar: "from-yellow-400 to-orange-400",
  },
  critical: {
    border: "border-red-500/60 dark:border-red-500/40",
    bg: "bg-red-50 dark:bg-red-950/40",
    badge:
      "bg-red-100 text-red-700 border-red-300 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30",
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
  const { t } = useLanguage();
  const styles = STATUS_STYLES[status];

  // Posisi progress bar (di-clamp 0-100% biar tidak keluar kalau value di luar min/max)
  const percent = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  return (
    <div
      className={`rounded-xl border-2 p-4 shadow-sm dark:shadow-none ${styles.border} ${styles.bg} transition-colors`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</span>
        <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-blue-600 dark:text-blue-300" />
        </div>
      </div>

      <div className="flex items-baseline gap-1 mb-3">
        <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          {value.toFixed(1)}
        </span>
        {unit && <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{unit}</span>}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden mb-2">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${styles.bar}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
        <span>{t("min")}: {min}</span>
        <span>{t("max")}: {max}</span>
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