export type StatusLevel = "good" | "warning" | "critical";

export interface SensorStatus {
  level: StatusLevel;
  label: string;   // English
  labelId: string; // Indonesia
}

/*
 * Klasifikasi mengikuti Tabel 2.1 - 2.5 pada dokumen.
 * Celah antar rentang di tabel (mis. 19 -> 20, 4,0 -> 4,1) ditutup dengan
 * menjadikan batas bawah kelas berikutnya sebagai batas atas kelas sebelumnya.
 */

// ===== Rentang optimal untuk Min/Max di kartu =====
export const RANGE = {
  dissolvedOxygen: { min: 5.1, max: 7 },
  ph: { min: 6.5, max: 8.5 },
  conductivity: { min: 0, max: 1000 }, // TDS
  turbidity: { min: 0, max: 25 },
  temperature: { min: 25, max: 30 },
};

// ===== pH (Tabel 2.4) =====
export function getPhStatus(value: number): SensorStatus {
  if (value < 5) return { level: "critical", label: "Strong Acid", labelId: "Asam Kuat" };
  if (value < 6.5) return { level: "warning", label: "Weak Acid", labelId: "Asam Lemah" }; // 6,0 - 6,5 tidak ada di tabel, digabung ke Weak Acid
  if (value <= 8.5) return { level: "good", label: "Optimal", labelId: "Optimal" };
  return { level: "warning", label: "Alkaline", labelId: "Basa" };
}

// ===== Suhu °C (Tabel 2.1) =====
export function getTemperatureStatus(value: number): SensorStatus {
  if (value < 15) return { level: "critical", label: "Below Range", labelId: "Di Bawah Rentang" };
  if (value < 20) return { level: "critical", label: "Low - At Risk", labelId: "Rendah - Berisiko" };
  if (value < 25) return { level: "warning", label: "Suboptimal", labelId: "Suboptimal" };
  if (value <= 30) return { level: "good", label: "Optimal", labelId: "Optimal" };
  if (value <= 35) return { level: "warning", label: "High - Thermal Stress", labelId: "Tinggi - Stres Termal" };
  return { level: "critical", label: "Critical", labelId: "Kritis" };
}

// ===== Dissolved Oxygen mg/L (Tabel 2.2) =====
export function getDoStatus(value: number): SensorStatus {
  if (value < 2) return { level: "critical", label: "Very Poor", labelId: "Sangat Buruk" };
  if (value < 4.1) return { level: "critical", label: "Poor", labelId: "Buruk" };
  if (value < 5.1) return { level: "warning", label: "Fair", labelId: "Cukup" };
  if (value <= 7) return { level: "good", label: "Good", labelId: "Baik" };
  return { level: "good", label: "Very Good", labelId: "Sangat Baik" };
}

// ===== TDS ppm (Tabel 2.3 memakai mg/L; untuk air tawar 1 ppm = 1 mg/L, jadi batasnya sama) =====
export function getTdsStatus(value: number): SensorStatus {
  if (value < 1000) return { level: "good", label: "Safe - Meets Standard", labelId: "Aman - Memenuhi Baku Mutu" };
  return { level: "critical", label: "Unsafe - Polluted", labelId: "Tidak Aman - Tercemar" };
}

// ===== Kekeruhan NTU (Tabel 2.5) =====
export function getTurbidityStatus(value: number): SensorStatus {
  if (value < 25) return { level: "good", label: "Optimal / Clear", labelId: "Optimal / Jernih" };
  if (value < 50) return { level: "warning", label: "Moderate Turbidity", labelId: "Kekeruhan Sedang" };
  if (value <= 100) return { level: "critical", label: "High Turbidity", labelId: "Kekeruhan Tinggi" };
  return { level: "critical", label: "Very Critical", labelId: "Sangat Kritis" };
}
