'use client'
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type Lang = 'en' | 'id';

const en = {
  title: 'Water Quality Monitoring System',
  subtitle: 'Lake Toba, North Sumatra',
  realtimeActive: 'Real-time Active',
  realtimeData: 'Real-time Data',
  lastUpdated: 'Last updated',
  loading: 'Loading...',
  doTitle: 'Dissolved Oxygen',
  phTitle: 'Water pH',
  condTitle: 'Total Dissolved Solids',
  turbTitle: 'Turbidity',
  tempTitle: 'Water Temperature',
  min: 'Min',
  max: 'Max',
  downloadCsv: 'Download Report (CSV)',
  downloadXlsx: 'Download Report (Excel)',
  downloadPdf: 'Monthly Report (PDF)',
  downloadMenu: 'Download Report',
  dlPdfDesc: 'Summary report with charts',
  pdfWeekly: 'Weekly',
  pdfMonthly: 'Monthly',
  pdfYearly: 'Yearly',
  dlNoData: 'No data in this time range',
  dlXlsxDesc: 'Data for the selected time range',
  dlCsvDesc: 'Plain data, for other software',
  pdfPreparing: 'Preparing...',
  pdfNoData: 'No data available for this report period.',
  systemStatus: 'System Status',
  normalOperation: 'Normal Operation',
  waterQuality: 'Water Quality',
  deviceLocation: 'Device Location',
  lakeToba: 'Lake Toba',
  qGood: 'Good',
  qFair: 'Fair',
  qPoor: 'Poor',
  openMaps: 'Open Maps',
  device: 'Device',
  latitude: 'Latitude',
  longitude: 'Longitude',
  layerMap: 'Map',
  layerSatellite: 'Satellite',
  loraTitle: 'LoRa Status',
  packetLoss: 'Packet Loss',
  loraNoData: 'No data yet',
  loraLastPacket: 'Last packet',
  loraOffline: 'No packets for over 2 minutes',
  loraLossNote: 'last 1 hour, 1 packet per 30 s',
  gpsDefault: 'Default location (no GPS fix yet)',
  gpsLive: 'Position from buoy GPS',
  sigVeryGood: 'Very Good',
  sigGood: 'Good',
  sigFair: 'Fair',
  sigWeak: 'Weak',
  themeLight: 'Light',
  themeDark: 'Dark',
  panelTitle: 'Lake Toba - Monitoring',
  chartTemp: 'Temperature',
  chartPh: 'pH',
  chartTds: 'Total Dissolved Solids',
  chartTurb: 'Turbidity',
  chartDo: 'Dissolved Oxygen',
  legendAvg: 'Average',
  range5s: '5 Seconds',
  range5m: '5 Minutes',
  range30m: '30 Minutes',
  range1h: '1 Hour',
  range1d: '1 Day',
  range1mo: '1 Month',
  range1y: '1 Year',
};

export type TKey = keyof typeof en;

const id: Record<TKey, string> = {
  title: 'Sistem Monitoring Kualitas Air',
  subtitle: 'Danau Toba, Sumatera Utara',
  realtimeActive: 'Real-time Aktif',
  realtimeData: 'Data Real-time',
  lastUpdated: 'Terakhir diperbarui',
  loading: 'Memuat...',
  doTitle: 'Oksigen Terlarut',
  phTitle: 'pH Air',
  condTitle: 'Total Padatan Terlarut',
  turbTitle: 'Kekeruhan',
  tempTitle: 'Suhu Air',
  min: 'Min',
  max: 'Maks',
  downloadCsv: 'Unduh Laporan (CSV)',
  downloadXlsx: 'Unduh Laporan (Excel)',
  downloadPdf: 'Laporan Bulanan (PDF)',
  downloadMenu: 'Unduh Laporan',
  dlPdfDesc: 'Laporan ringkasan beserta grafik',
  pdfWeekly: 'Mingguan',
  pdfMonthly: 'Bulanan',
  pdfYearly: 'Tahunan',
  dlNoData: 'Tidak ada data pada rentang waktu ini',
  dlXlsxDesc: 'Data sesuai rentang waktu terpilih',
  dlCsvDesc: 'Data mentah, untuk aplikasi lain',
  pdfPreparing: 'Menyiapkan...',
  pdfNoData: 'Tidak ada data untuk periode laporan ini.',
  systemStatus: 'Status Sistem',
  normalOperation: 'Beroperasi Normal',
  waterQuality: 'Kualitas Air',
  deviceLocation: 'Lokasi Perangkat',
  lakeToba: 'Danau Toba',
  qGood: 'Baik',
  qFair: 'Cukup',
  qPoor: 'Buruk',
  openMaps: 'Buka Peta',
  device: 'Perangkat',
  latitude: 'Lintang',
  longitude: 'Bujur',
  layerMap: 'Peta',
  layerSatellite: 'Satelit',
  loraTitle: 'Status LoRa',
  packetLoss: 'Kehilangan Paket',
  loraNoData: 'Belum ada data',
  loraLastPacket: 'Paket terakhir',
  loraOffline: 'Tidak ada paket lebih dari 2 menit',
  loraLossNote: '1 jam terakhir, 1 paket per 30 detik',
  gpsDefault: 'Lokasi bawaan (GPS belum mendapat sinyal)',
  gpsLive: 'Posisi dari GPS buoy',
  sigVeryGood: 'Sangat Baik',
  sigGood: 'Baik',
  sigFair: 'Cukup',
  sigWeak: 'Lemah',
  themeLight: 'Terang',
  themeDark: 'Gelap',
  panelTitle: 'Danau Toba - Monitoring',
  chartTemp: 'Suhu',
  chartPh: 'pH',
  chartTds: 'Total Padatan Terlarut',
  chartTurb: 'Kekeruhan',
  chartDo: 'Oksigen Terlarut',
  legendAvg: 'Rata-rata',
  range5s: '5 Detik',
  range5m: '5 Menit',
  range30m: '30 Menit',
  range1h: '1 Jam',
  range1d: '1 Hari',
  range1mo: '1 Bulan',
  range1y: '1 Tahun',
};

const DICT: Record<Lang, Record<TKey, string>> = { en, id };

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TKey) => string;
}

// Nilai bawaan kalau komponen dipakai di luar Provider (bahasa Inggris)
const LangContext = createContext<LangContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (key) => en[key],
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  // Baca pilihan bahasa yang tersimpan (hanya di browser)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lang');
      if (saved === 'en' || saved === 'id') {
        setLangState(saved);
        document.documentElement.lang = saved;
      }
    } catch {}
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    document.documentElement.lang = l;
    try {
      localStorage.setItem('lang', l);
    } catch {}
  }, []);

  const t = useCallback((key: TKey) => DICT[lang][key], [lang]);

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export function useLanguage() {
  return useContext(LangContext);
}
