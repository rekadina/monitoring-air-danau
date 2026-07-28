export type StatusLevel = "good" | "warning" | "critical";

export interface SensorStatus {
  level: StatusLevel;
  label: string;
}

// ===== pH =====
export function getPhStatus(value: number): SensorStatus {
  if (value < 6) return { level: "critical", label: "Asam" };
  if (value > 9) return { level: "critical", label: "Basa" };
  return { level: "good", label: "Normal" };
}

// ===== Suhu (°C) =====
export function getTemperatureStatus(value: number): SensorStatus {
  if (value > 110) return { level: "critical", label: "Sangat Panas" };
  if (value > 70) return { level: "critical", label: "Panas" };
  if (value > 31) return { level: "warning", label: "Hangat" };
  if (value > 28) return { level: "warning", label: "Cukup Panas" };
  if (value < 14) return { level: "critical", label: "Sangat Dingin" };
  if (value < 18) return { level: "critical", label: "Dingin" };
  if (value < 23) return { level: "warning", label: "Cukup Dingin" };
  return { level: "good", label: "Normal" };
}

// ===== Dissolved Oxygen (mg/L) =====
export function getDoStatus(value: number): SensorStatus {
  if (value < 5) return { level: "critical", label: "Kadar Rendah" };
  if (value > 8) return { level: "warning", label: "Kadar Tinggi" };
  return { level: "good", label: "Normal" };
}

// ===== TDS / Konduktivitas (mg/L atau PPM) =====
export function getTdsStatus(value: number): SensorStatus {
  if (value < 46) return { level: "critical", label: "Kadar Sangat Rendah" };
  if (value > 110) return { level: "critical", label: "Kadar Sangat Tinggi" };
  return { level: "good", label: "Normal" };
}

// ===== Turbidity / Kekeruhan (NTU) =====
export function getTurbidityStatus(value: number): SensorStatus {
  if (value < 3) return { level: "critical", label: "Kadar Sangat Rendah" };
  if (value > 4) return { level: "critical", label: "Kadar Sangat Tinggi" };
  return { level: "good", label: "Normal" };
}