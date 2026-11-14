/*
 * Pembuat laporan PDF (mingguan / bulanan / tahunan) tanpa library tambahan.
 * Menulis file PDF langsung (teks, kotak, garis) dengan font bawaan Helvetica.
 */
import {
  getDoStatus,
  getPhStatus,
  getTdsStatus,
  getTemperatureStatus,
  getTurbidityStatus,
} from "./waterQuality";
import type { SensorStatus, StatusLevel } from "./waterQuality";

export interface ReportPoint {
  timestamp: number;
  dissolvedOxygen: number | null;
  ph: number | null;
  conductivity: number | null;
  turbidity: number | null;
  temperature: number | null;
}

export type ReportPeriod = "weekly" | "monthly" | "yearly";

export interface ReportOptions {
  lang: "en" | "id";
  period: ReportPeriod;
  deviceName: string;
  latitude: number;
  longitude: number;
}

// ---------------------------------------------------------------- teks per bahasa
const TXT = {
  en: {
    titles: {
      weekly: "Weekly Water Quality Report",
      monthly: "Monthly Water Quality Report",
      yearly: "Yearly Water Quality Report",
    },
    system: "Water Quality Monitoring System - Lake Toba, North Sumatra",
    generated: "Generated",
    device: "Device",
    coords: "Coordinates",
    reportType: "Report type",
    periodVal: {
      weekly: "Weekly (last 7 days)",
      monthly: "Monthly (last 1 month)",
      yearly: "Yearly (last 1 year)",
    },
    dataStart: "First reading",
    dataEnd: "Last reading",
    readings: "Total readings",
    s1: "1. Parameter Summary",
    colParam: "Parameter",
    colUnit: "Unit",
    colLatest: "Latest",
    colMin: "Min",
    colAvg: "Average",
    colMax: "Max",
    colStatus: "Status (average)",
    tableNote: "Status is determined from the average value using the water quality classification tables of this project.",
    s2: "2. Overall Conclusion",
    overall: "Overall water quality",
    good: "Good",
    fair: "Fair",
    poor: "Poor",
    allGood: "All measured parameters are within the acceptable range during this period.",
    needAttention: "Parameters that need attention:",
    average: "average",
    s3: "3. Notes",
    notes: [
      "Values are summarized from sensor readings stored in the monitoring database.",
      "Classification refers to the temperature, dissolved oxygen, TDS, pH and turbidity tables in the project document.",
    ],
    trends: "Parameter Trends",
    page: "Page",
    footer: "Water Quality Monitoring System - Lake Toba",
    pDo: "Dissolved Oxygen",
    pPh: "pH",
    pTds: "Total Dissolved Solids",
    pTurb: "Turbidity",
    pTemp: "Temperature",
  },
  id: {
    titles: {
      weekly: "Laporan Mingguan Kualitas Air",
      monthly: "Laporan Bulanan Kualitas Air",
      yearly: "Laporan Tahunan Kualitas Air",
    },
    system: "Sistem Monitoring Kualitas Air - Danau Toba, Sumatera Utara",
    generated: "Dibuat",
    device: "Perangkat",
    coords: "Koordinat",
    reportType: "Jenis laporan",
    periodVal: {
      weekly: "Mingguan (7 hari terakhir)",
      monthly: "Bulanan (1 bulan terakhir)",
      yearly: "Tahunan (1 tahun terakhir)",
    },
    dataStart: "Pembacaan pertama",
    dataEnd: "Pembacaan terakhir",
    readings: "Jumlah pembacaan",
    s1: "1. Ringkasan Parameter",
    colParam: "Parameter",
    colUnit: "Satuan",
    colLatest: "Terakhir",
    colMin: "Min",
    colAvg: "Rata-rata",
    colMax: "Maks",
    colStatus: "Status (rata-rata)",
    tableNote: "Status ditentukan dari nilai rata-rata berdasarkan tabel klasifikasi kualitas air pada proyek ini.",
    s2: "2. Kesimpulan Umum",
    overall: "Kualitas air secara keseluruhan",
    good: "Baik",
    fair: "Cukup",
    poor: "Buruk",
    allGood: "Seluruh parameter yang diukur berada dalam rentang yang dapat diterima pada periode ini.",
    needAttention: "Parameter yang perlu diperhatikan:",
    average: "rata-rata",
    s3: "3. Catatan",
    notes: [
      "Nilai diringkas dari hasil pembacaan sensor yang tersimpan di basis data monitoring.",
      "Klasifikasi mengacu pada tabel suhu, oksigen terlarut, TDS, pH, dan kekeruhan pada dokumen proyek.",
    ],
    trends: "Grafik Tren Parameter",
    page: "Halaman",
    footer: "Sistem Monitoring Kualitas Air - Danau Toba",
    pDo: "Oksigen Terlarut",
    pPh: "pH",
    pTds: "Total Padatan Terlarut",
    pTurb: "Kekeruhan",
    pTemp: "Suhu",
  },
};

// ---------------------------------------------------------------- lebar huruf Helvetica (ASCII 32..126)
const W_REG = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584];
const W_BOLD = [278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584];

function textWidth(s: string, size: number, bold = false): number {
  const tbl = bold ? W_BOLD : W_REG;
  let w = 0;
  for (const ch of s) {
    const c = ch.charCodeAt(0);
    w += c >= 32 && c <= 126 ? tbl[c - 32] : c === 176 ? 400 : 556;
  }
  return (w * size) / 1000;
}

// Ubah teks ke string literal PDF (WinAnsi); karakter di luar jangkauan jadi "?"
function pdfStr(s: string): string {
  let out = "";
  for (const ch of s) {
    const c = ch.charCodeAt(0);
    if (ch === "(" || ch === ")" || ch === "\\") out += "\\" + ch;
    else if (c >= 32 && c <= 126) out += ch;
    else if (c >= 160 && c <= 255) out += "\\" + c.toString(8).padStart(3, "0");
    else if (c === 0x2013 || c === 0x2014) out += "-";
    else out += "?";
  }
  return "(" + out + ")";
}

// ---------------------------------------------------------------- penulis PDF
const PW = 595.28;
const PH = 841.89;

const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => (v / 255).toFixed(3)).join(" ");
};
const f2 = (n: number) => n.toFixed(2);

class PdfDoc {
  pages: string[] = [];
  private cur = "";

  newPage() {
    if (this.cur) this.pages.push(this.cur);
    this.cur = "";
  }
  finish() {
    if (this.cur) this.pages.push(this.cur);
    this.cur = "";
  }

  rect(x: number, y: number, w: number, h: number, opt: { fill?: string; stroke?: string; lw?: number }) {
    const py = PH - y - h;
    let ops = "";
    if (opt.fill) ops += `${rgb(opt.fill)} rg `;
    if (opt.stroke) ops += `${rgb(opt.stroke)} RG ${f2(opt.lw ?? 0.5)} w `;
    const paint = opt.fill && opt.stroke ? "B" : opt.fill ? "f" : "S";
    this.cur += `${ops}${f2(x)} ${f2(py)} ${f2(w)} ${f2(h)} re ${paint}\n`;
  }

  line(x1: number, y1: number, x2: number, y2: number, color: string, lw = 0.5, dash = false) {
    this.cur += `${rgb(color)} RG ${f2(lw)} w ${dash ? "[2 2] 0 d" : "[] 0 d"} ${f2(x1)} ${f2(PH - y1)} m ${f2(x2)} ${f2(PH - y2)} l S [] 0 d\n`;
  }

  polyline(pts: [number, number][], color: string, lw = 1) {
    if (pts.length < 2) return;
    let d = `${rgb(color)} RG ${f2(lw)} w 1 j 1 J [] 0 d ${f2(pts[0][0])} ${f2(PH - pts[0][1])} m `;
    for (let i = 1; i < pts.length; i++) d += `${f2(pts[i][0])} ${f2(PH - pts[i][1])} l `;
    this.cur += d + "S\n";
  }

  text(
    s: string,
    x: number,
    y: number,
    size: number,
    opt: { bold?: boolean; color?: string; align?: "left" | "right" | "center" } = {}
  ) {
    const bold = !!opt.bold;
    const w = textWidth(s, size, bold);
    const px = opt.align === "right" ? x - w : opt.align === "center" ? x - w / 2 : x;
    this.cur += `BT /${bold ? "F2" : "F1"} ${f2(size)} Tf ${rgb(opt.color ?? "#111827")} rg ${f2(px)} ${f2(PH - y)} Td ${pdfStr(s)} Tj ET\n`;
  }

  // Pecah teks menjadi beberapa baris sesuai lebar
  wrap(s: string, maxW: number, size: number, bold = false): string[] {
    const words = s.split(" ");
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const test = cur ? cur + " " + w : w;
      if (textWidth(test, size, bold) <= maxW || !cur) cur = test;
      else {
        lines.push(cur);
        cur = w;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  }

  // Susun file PDF (semua karakter <= 255 sehingga 1 karakter = 1 byte)
  build(title: string): Uint8Array {
    const objs: string[] = [];
    const pageCount = this.pages.length;
    // 1 katalog, 2 daftar halaman, 3 & 4 font, 5 info, lalu pasangan (halaman, isi)
    const firstPage = 6;
    const kids = this.pages.map((_, i) => `${firstPage + i * 2} 0 R`).join(" ");

    objs[1] = `<< /Type /Catalog /Pages 2 0 R >>`;
    objs[2] = `<< /Type /Pages /Kids [${kids}] /Count ${pageCount} >>`;
    objs[3] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`;
    objs[4] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`;
    objs[5] = `<< /Title ${pdfStr(title)} /Producer (Water Quality Monitoring System) >>`;

    this.pages.forEach((content, i) => {
      const pn = firstPage + i * 2;
      objs[pn] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${f2(PW)} ${f2(PH)}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${pn + 1} 0 R >>`;
      objs[pn + 1] = `<< /Length ${content.length} >>\nstream\n${content}endstream`;
    });

    let out = "%PDF-1.4\n%\u00e2\u00e3\u00cf\u00d3\n";
    const offsets: number[] = [];
    for (let i = 1; i < objs.length; i++) {
      offsets[i] = out.length;
      out += `${i} 0 obj\n${objs[i]}\nendobj\n`;
    }
    const xref = out.length;
    out += `xref\n0 ${objs.length}\n0000000000 65535 f \n`;
    for (let i = 1; i < objs.length; i++) out += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
    out += `trailer\n<< /Size ${objs.length} /Root 1 0 R /Info 5 0 R >>\nstartxref\n${xref}\n%%EOF`;

    const bytes = new Uint8Array(out.length);
    for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 255;
    return bytes;
  }
}

// ---------------------------------------------------------------- data & statistik
type SensorKey = "dissolvedOxygen" | "ph" | "conductivity" | "turbidity" | "temperature";

interface SensorDef {
  key: SensorKey;
  nameKey: "pDo" | "pPh" | "pTds" | "pTurb" | "pTemp";
  unit: string;
  decimals: number;
  status: (v: number) => SensorStatus;
}

const SENSORS: SensorDef[] = [
  { key: "temperature", nameKey: "pTemp", unit: "°C", decimals: 1, status: getTemperatureStatus },
  { key: "ph", nameKey: "pPh", unit: "", decimals: 2, status: getPhStatus },
  { key: "conductivity", nameKey: "pTds", unit: "ppm", decimals: 1, status: getTdsStatus },
  { key: "turbidity", nameKey: "pTurb", unit: "NTU", decimals: 1, status: getTurbidityStatus },
  { key: "dissolvedOxygen", nameKey: "pDo", unit: "mg/L", decimals: 2, status: getDoStatus },
];

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

const LEVEL_COLORS: Record<StatusLevel, { fg: string; bg: string }> = {
  good: { fg: "#15803d", bg: "#dcfce7" },
  warning: { fg: "#a16207", bg: "#fef9c3" },
  critical: { fg: "#b91c1c", bg: "#fee2e2" },
};

const pad = (n: number) => String(n).padStart(2, "0");

// Kurangi jumlah titik agar grafik ringan (rata-rata per kelompok)
function downsample(pts: [number, number][], max: number): [number, number][] {
  if (pts.length <= max) return pts;
  const size = Math.ceil(pts.length / max);
  const out: [number, number][] = [];
  for (let i = 0; i < pts.length; i += size) {
    const g = pts.slice(i, i + size);
    out.push([g[Math.floor(g.length / 2)][0], g.reduce((s, p) => s + p[1], 0) / g.length]);
  }
  return out;
}

// ---------------------------------------------------------------- pembuat laporan
export function buildReportPdf(data: ReportPoint[], opt: ReportOptions): Uint8Array | null {
  const L = TXT[opt.lang];
  const isId = opt.lang === "id";
  const locale = isId ? "id-ID" : "en-US";

  if (!data || data.length === 0) return null;

  const num = (v: number, dec: number) => {
    const s = v.toFixed(dec);
    return isId ? s.replace(".", ",") : s;
  };
  const dateLong = (ms: number) => {
    const d = new Date(ms);
    return `${d.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" })} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  // statistik per sensor
  const stats = SENSORS.map((s) => {
    const series: [number, number][] = [];
    for (const p of data) {
      const v = p[s.key];
      if (isNum(v)) series.push([p.timestamp, v]);
    }
    if (series.length === 0) return { def: s, series, n: 0, min: 0, max: 0, avg: 0, latest: 0 };
    const vals = series.map((p) => p[1]);
    return {
      def: s,
      series,
      n: series.length,
      min: Math.min(...vals),
      max: Math.max(...vals),
      avg: vals.reduce((a, b) => a + b, 0) / vals.length,
      latest: vals[vals.length - 1],
    };
  });
  if (stats.every((s) => s.n === 0)) return null;

  const times = data.map((p) => p.timestamp);
  const t0 = Math.min(...times);
  const t1 = Math.max(...times);

  const doc = new PdfDoc();
  const M = 40;
  const CW = PW - M * 2;

  const drawFooter = (pageNo: number, total: number) => {
    doc.line(M, 806, PW - M, 806, "#d1d5db", 0.6);
    doc.text(L.footer, M, 820, 8, { color: "#6b7280" });
    doc.text(`${L.page} ${pageNo} / ${total}`, PW - M, 820, 8, { color: "#6b7280", align: "right" });
  };

  // ============================ HALAMAN 1 ============================
  doc.rect(0, 0, PW, 86, { fill: "#1d4ed8" });
  doc.rect(0, 86, PW, 4, { fill: "#0d9488" });
  doc.text(L.titles[opt.period], M, 40, 21, { bold: true, color: "#ffffff" });
  doc.text(L.system, M, 60, 10, { color: "#dbeafe" });
  doc.text(`${L.generated}: ${dateLong(Date.now())}`, PW - M, 60, 8.5, { color: "#dbeafe", align: "right" });

  // kotak info
  doc.rect(M, 106, CW, 66, { fill: "#f3f4f6" });
  const info: [string, string][][] = [
    [
      [L.device, opt.deviceName],
      [L.coords, `${num(opt.latitude, 6)}, ${num(opt.longitude, 6)}`],
      [L.reportType, L.periodVal[opt.period]],
    ],
    [
      [L.dataStart, dateLong(t0)],
      [L.dataEnd, dateLong(t1)],
      [L.readings, String(data.length)],
    ],
  ];
  info.forEach((col, ci) => {
    col.forEach(([label, value], ri) => {
      const x = M + 14 + ci * (CW / 2);
      const y = 126 + ri * 19;
      doc.text(label, x, y, 8, { color: "#6b7280" });
      doc.text(value, x + 92, y, 9, { bold: true });
    });
  });

  // tabel ringkasan
  doc.text(L.s1, M, 198, 12, { bold: true });
  doc.line(M, 204, M + CW, 204, "#0d9488", 1.2);

  const cols = [140, 42, 56, 56, 58, 56, 107]; // total 515
  const colX: number[] = [];
  cols.reduce((x, w) => (colX.push(x), x + w), M);
  const headers = [L.colParam, L.colUnit, L.colLatest, L.colMin, L.colAvg, L.colMax, L.colStatus];
  const ty = 214;
  doc.rect(M, ty, CW, 22, { fill: "#1f2937" });
  headers.forEach((h, i) => {
    const right = i >= 2 && i <= 5;
    const x = right ? colX[i] + cols[i] - 8 : colX[i] + 8;
    doc.text(h, x, ty + 14.5, 8.5, { bold: true, color: "#ffffff", align: right ? "right" : "left" });
  });

  const levels: { def: SensorDef; status: SensorStatus }[] = [];
  stats.forEach((s, i) => {
    const y = ty + 22 + i * 26;
    doc.rect(M, y, CW, 26, { fill: i % 2 === 0 ? "#ffffff" : "#f9fafb" });
    doc.line(M, y + 26, M + CW, y + 26, "#e5e7eb", 0.5);
    const name = L[s.def.nameKey];
    doc.text(name, colX[0] + 8, y + 16, 9, { bold: true });
    doc.text(s.def.unit || "-", colX[1] + 8, y + 16, 9, { color: "#4b5563" });
    if (s.n === 0) {
      doc.text("-", colX[6] + 8, y + 16, 9, { color: "#6b7280" });
      return;
    }
    const vals = [s.latest, s.min, s.avg, s.max];
    vals.forEach((v, k) => {
      doc.text(num(v, s.def.decimals), colX[2 + k] + cols[2 + k] - 8, y + 16, 9, { align: "right" });
    });
    const st = s.def.status(s.avg);
    levels.push({ def: s.def, status: st });
    const c = LEVEL_COLORS[st.level];
    const label = isId ? st.labelId : st.label;
    // sesuaikan label panjang dengan lebar kolom
    let size = 7.5;
    while (textWidth(label, size, true) > cols[6] - 16 && size > 5.5) size -= 0.25;
    doc.rect(colX[6] + 4, y + 5, cols[6] - 8, 16, { fill: c.bg });
    doc.text(label, colX[6] + cols[6] / 2, y + 16, size, { bold: true, color: c.fg, align: "center" });
  });
  const tableEnd = ty + 22 + stats.length * 26;
  doc.text(L.tableNote, M, tableEnd + 14, 7.5, { color: "#6b7280" });

  // kesimpulan
  let y = tableEnd + 44;
  doc.text(L.s2, M, y, 12, { bold: true });
  doc.line(M, y + 6, M + CW, y + 6, "#0d9488", 1.2);
  y += 20;

  const worst: StatusLevel = levels.some((l) => l.status.level === "critical")
    ? "critical"
    : levels.some((l) => l.status.level === "warning")
    ? "warning"
    : "good";
  const overallLabel = worst === "critical" ? L.poor : worst === "warning" ? L.fair : L.good;
  const oc = LEVEL_COLORS[worst];

  const attention = stats.filter((s) => s.n > 0 && s.def.status(s.avg).level !== "good");
  const bodyLines: string[] = [];
  if (attention.length === 0) {
    bodyLines.push(...doc.wrap(L.allGood, CW - 36, 9));
  } else {
    bodyLines.push(L.needAttention);
    attention.forEach((s) => {
      const st = s.def.status(s.avg);
      const txt = `- ${L[s.def.nameKey]}: ${isId ? st.labelId : st.label} (${L.average} ${num(s.avg, s.def.decimals)}${s.def.unit ? " " + s.def.unit : ""})`;
      bodyLines.push(...doc.wrap(txt, CW - 36, 9));
    });
  }
  const boxH = 44 + bodyLines.length * 13;
  doc.rect(M, y, CW, boxH, { fill: oc.bg });
  doc.rect(M, y, 5, boxH, { fill: oc.fg });
  doc.text(`${L.overall}:`, M + 18, y + 20, 10, { color: "#374151" });
  doc.text(overallLabel, M + 18 + textWidth(`${L.overall}: `, 10) + 2, y + 20, 12, { bold: true, color: oc.fg });
  bodyLines.forEach((ln, i) => doc.text(ln, M + 18, y + 40 + i * 13, 9, { color: "#1f2937" }));
  y += boxH + 26;

  // catatan
  doc.text(L.s3, M, y, 12, { bold: true });
  doc.line(M, y + 6, M + CW, y + 6, "#0d9488", 1.2);
  y += 22;
  L.notes.forEach((n) => {
    doc.wrap(n, CW - 14, 8.5).forEach((ln, i) => {
      if (i === 0) doc.text("-", M + 2, y, 8.5, { color: "#374151" });
      doc.text(ln, M + 12, y, 8.5, { color: "#374151" });
      y += 12.5;
    });
    y += 2;
  });

  // ============================ HALAMAN 2: GRAFIK ============================
  doc.newPage();
  doc.rect(0, 0, PW, 56, { fill: "#1d4ed8" });
  doc.rect(0, 56, PW, 3, { fill: "#0d9488" });
  doc.text(L.trends, M, 36, 16, { bold: true, color: "#ffffff" });

  const spanMs = t1 - t0;
  const shortSpan = spanMs <= 2 * 24 * 3600 * 1000;
  const longSpan = spanMs > 200 * 24 * 3600 * 1000;
  const xLabel = (ms: number) => {
    const d = new Date(ms);
    if (shortSpan) return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    if (longSpan) return d.toLocaleDateString(locale, { month: "short", year: "2-digit" });
    return d.toLocaleDateString(locale, { day: "2-digit", month: "short" });
  };

  const gap = 16;
  const cw = (CW - gap) / 2;
  const chH = 218;
  stats.forEach((s, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = M + col * (cw + gap);
    const cy = 78 + row * (chH + 14);
    doc.rect(cx, cy, cw, chH, { fill: "#ffffff", stroke: "#d1d5db", lw: 0.7 });

    const name = L[s.def.nameKey];
    doc.text(name, cx + 10, cy + 18, 10, { bold: true });
    if (s.n === 0) return;
    doc.text(`${num(s.latest, s.def.decimals)}${s.def.unit ? " " + s.def.unit : ""}`, cx + cw - 10, cy + 18, 9, {
      color: "#6b7280",
      align: "right",
    });

    // area plot
    const px = cx + 40;
    const pw = cw - 40 - 12;
    const py = cy + 32;
    const ph = chH - 32 - 52;

    let lo = s.min;
    let hi = s.max;
    if (hi - lo < 1e-9) {
      lo -= 1;
      hi += 1;
    }
    const padV = (hi - lo) * 0.08;
    lo -= padV;
    hi += padV;
    if (s.min >= 0 && lo < 0) lo = 0; // nilai sensor tidak negatif, sumbu tidak perlu turun ke bawah 0
    const tickDec = hi - lo < 1 ? 2 : hi - lo < 10 ? 1 : 0;

    // grid + label sumbu Y
    for (let k = 0; k <= 4; k++) {
      const gy = py + (ph * k) / 4;
      doc.line(px, gy, px + pw, gy, "#e5e7eb", 0.5, true);
      const v = hi - ((hi - lo) * k) / 4;
      doc.text(num(v, tickDec), px - 5, gy + 3, 7, { color: "#6b7280", align: "right" });
    }
    doc.line(px, py, px, py + ph, "#9ca3af", 0.7);
    doc.line(px, py + ph, px + pw, py + ph, "#9ca3af", 0.7);

    // label sumbu X
    for (let k = 0; k <= 3; k++) {
      const ms = t0 + (spanMs * k) / 3;
      const gx = px + (pw * k) / 3;
      doc.text(xLabel(ms), gx, py + ph + 12, 7, {
        color: "#6b7280",
        align: k === 0 ? "left" : k === 3 ? "right" : "center",
      });
    }

    // garis data
    const pts = downsample(s.series, 220).map(
      ([t, v]): [number, number] => [
        px + (spanMs > 0 ? ((t - t0) / spanMs) * pw : pw / 2),
        py + ph - ((v - lo) / (hi - lo)) * ph,
      ]
    );
    doc.polyline(pts, "#16a34a", 1.1);

    // ringkasan di bawah grafik
    const sum = `Min ${num(s.min, s.def.decimals)}   |   ${L.colAvg} ${num(s.avg, s.def.decimals)}   |   ${L.colMax} ${num(s.max, s.def.decimals)}${s.def.unit ? " " + s.def.unit : ""}`;
    doc.text(sum, cx + cw / 2, cy + chH - 10, 8, { color: "#374151", align: "center" });
  });

  // nomor halaman
  doc.finish();
  const total = doc.pages.length;
  // footer ditulis per halaman: sisipkan ke konten masing-masing halaman
  const original = doc.pages.slice();
  doc.pages = [];
  original.forEach((content, idx) => {
    doc.newPage();
    (doc as unknown as { cur: string }).cur = content;
    drawFooter(idx + 1, total);
    doc.newPage();
  });
  doc.finish();

  return doc.build(`${L.titles[opt.period]} - ${opt.deviceName}`);
}
