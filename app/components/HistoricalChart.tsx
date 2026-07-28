import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Clock } from 'lucide-react';

interface HistoricalChartProps {
  data: any[];
  onTimeRangeChange: (range: string) => void;
}

const timeRanges = [
  { value: '1hour', label: '1 Jam' },
  { value: '12hours', label: '12 Jam' },
  { value: '1day', label: '1 Hari' },
  { value: '1month', label: '1 Bulan' },
  { value: '1year', label: '1 Tahun' }
];

export function HistoricalChart({ data, onTimeRangeChange }: HistoricalChartProps) {
  const [selectedRange, setSelectedRange] = useState('1month');
  const [chartKey, setChartKey] = useState(0);

  const handleRangeChange = (range: string) => {
    setSelectedRange(range);
    setChartKey(prev => prev + 1);
    onTimeRangeChange(range);
  };

  const formatTooltipValue = (value: number) => {
    return parseFloat(value.toFixed(4)).toString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 dark:bg-gray-800/95 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-gray-800 dark:text-white mb-2 text-sm">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-xs">
              {entry.name}: {formatTooltipValue(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-3 sm:p-6 border-2 border-blue-200/50 dark:border-gray-700/50 w-full">
      {/* Header: judul di atas, tombol di bawah (mobile) — satu baris di desktop */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-700 dark:text-blue-400 flex-shrink-0" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">
            Grafik Historis
          </h3>
        </div>

        {/* Tombol waktu — wrap otomatis jika tidak muat */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {timeRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => handleRangeChange(range.value)}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all flex-shrink-0 ${
                selectedRange === range.value
                  ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart — lebih pendek di mobile */}
      <ResponsiveContainer width="100%" height={220} key={chartKey}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="time"
            stroke="#666"
            style={{ fontSize: '10px' }}
            tick={{ fontSize: 10 }}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="#666"
            style={{ fontSize: '10px' }}
            tick={{ fontSize: 10 }}
            width={35}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
          />
          <Line
            type="monotone"
            dataKey="dissolvedOxygen"
            stroke="#10b981"
            strokeWidth={2}
            name="Dissolved O₂ (mg/L)"
            dot={{ r: 2 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="ph"
            stroke="#3b82f6"
            strokeWidth={2}
            name="pH"
            dot={{ r: 2 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="conductivity"
            stroke="#f59e0b"
            strokeWidth={2}
            name="Conductivity (μS/cm)"
            dot={{ r: 2 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="turbidity"
            stroke="#8b5cf6"
            strokeWidth={2}
            name="Turbidity (NTU)"
            dot={{ r: 2 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="temperature"
            stroke="#ef4444"
            strokeWidth={2}
            name="Temperature (°C)"
            dot={{ r: 2 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}