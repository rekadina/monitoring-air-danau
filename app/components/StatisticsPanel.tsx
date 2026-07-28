import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatisticsProps {
  label: string;
  current: number;
  average: number;
  unit: string;
}

function StatItem({ label, current, average, unit }: StatisticsProps) {
  const difference = current - average;
  const percentChange = (difference / average) * 100;

  const formatValue = (val: number): string => {
    const str = val.toFixed(4);
    return parseFloat(str).toString();
  };

  const getTrendIcon = () => {
    if (Math.abs(percentChange) < 2) return <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
    if (percentChange > 0) return <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
    return <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
  };

  const getTrendColor = () => {
    if (Math.abs(percentChange) < 2) return 'text-gray-500';
    if (percentChange > 0) return 'text-green-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3 sm:p-4">
      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1 sm:mb-2">{label}</p>
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-none">
            {formatValue(current)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
            Rata-rata: {formatValue(average)} {unit}
          </p>
        </div>
        <div className={`flex items-center gap-1 flex-shrink-0 ${getTrendColor()}`}>
          {getTrendIcon()}
          <span className="text-xs sm:text-sm font-medium">{Math.abs(percentChange).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}

export function StatisticsPanel({ data }: { data: StatisticsProps[] }) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-4 sm:p-6 border-2 border-blue-200/50 dark:border-gray-600/50">
      <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-3 sm:mb-4">
        Statistik 30 Hari Terakhir
      </h3>
      {/* 2 kolom di mobile, 3 di tablet ke atas */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
        {data.map((stat, index) => (
          <StatItem key={index} {...stat} />
        ))}
      </div>
    </div>
  );
}