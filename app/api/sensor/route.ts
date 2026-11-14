import { queryApi, bucket } from "@/app/lib/influxClient";
import { NextResponse } from "next/server";

// Rentang waktu -> awal rentang & ukuran jendela perataan.
// Rentang pendek memakai data mentah; rentang panjang dirata-ratakan supaya
// jumlah titik tetap kecil (sekitar 300-750 titik) dan grafik/laporan tetap ringan.
const RANGES: Record<string, { start: string; every?: string }> = {
  "5s": { start: "-5s" },
  "5m": { start: "-5m" },
  "15m": { start: "-15m" },
  "30m": { start: "-30m" },
  "1h": { start: "-1h" },
  "6h": { start: "-6h", every: "2m" },
  "1d": { start: "-1d", every: "5m" }, // 288 titik
  "1mo": { start: "-30d", every: "1h" }, // 720 titik
  "1y": { start: "-365d", every: "12h" }, // 730 titik
};

// Nama field di InfluxDB -> nama di JSON
// (tambahkan field baru di sini, mis. tegangan aki, selama bertipe angka)
const FIELD_MAP: Record<string, string> = {
  dissolved_oxygen: "dissolvedOxygen",
  ph: "ph",
  conductivity: "conductivity",
  turbidity: "turbidity",
  temperature: "temperature",
  rssi: "rssi",
  snr: "snr",
  latitude: "latitude",
  longitude: "longitude",
};
const FIELD_LIST = Object.keys(FIELD_MAP)
  .map((f) => `"${f}"`)
  .join(", ");

// Kalau jumlah titik pada rentang itu tidak banyak, kirim data mentah apa adanya
// (grafik tetap berbentuk garis). Perataan hanya dipakai saat titiknya terlalu banyak.
const RAW_LIMIT = 1500;

// Hitung jumlah paket pada rentang (memakai satu field saja agar ringan)
async function countPoints(start: string): Promise<number> {
  const q = `
    from(bucket: "${bucket}")
      |> range(start: ${start})
      |> filter(fn: (r) => r._measurement == "sensor_readings" and r._field == "ph")
      |> group()
      |> count()
  `;
  let n = 0;
  for await (const { values, tableMeta } of queryApi.iterateRows(q)) {
    const o = tableMeta.toObject(values);
    if (typeof o._value === "number") n += o._value;
  }
  return n;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "1h";

  try {
    // ---- Nilai terbaru tiap sensor (untuk kartu real-time dan deteksi data basi) ----
    if (range === "latest") {
      const latestQuery = `
        from(bucket: "${bucket}")
          |> range(start: -30d)
          |> filter(fn: (r) => r._measurement == "sensor_readings")
          |> filter(fn: (r) => contains(value: r._field, set: [${FIELD_LIST}]))
          |> last()
      `;
      const latest: Record<string, number> = {};
      let newest = 0;
      for await (const { values, tableMeta } of queryApi.iterateRows(latestQuery)) {
        const o = tableMeta.toObject(values);
        const key = FIELD_MAP[o._field as string];
        if (key && typeof o._value === "number") {
          latest[key] = o._value;
          newest = Math.max(newest, new Date(o._time).getTime());
        }
      }
      return NextResponse.json({ timestamp: newest, ...latest });
    }

    // ---- Riwayat untuk grafik ----
    const cfg = RANGES[range] || RANGES["1h"];
    const needAggregate = cfg.every ? (await countPoints(cfg.start)) > RAW_LIMIT : false;
    const aggregate = cfg.every && needAggregate
      ? `|> aggregateWindow(every: ${cfg.every}, fn: mean, createEmpty: false)`
      : "";

    const fluxQuery = `
      from(bucket: "${bucket}")
        |> range(start: ${cfg.start})
        |> filter(fn: (r) => r._measurement == "sensor_readings")
        |> filter(fn: (r) => contains(value: r._field, set: [${FIELD_LIST}]))
        ${aggregate}
        |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
        |> sort(columns: ["_time"])
    `;

    const rows: any[] = [];
    for await (const { values, tableMeta } of queryApi.iterateRows(fluxQuery)) {
      const obj = tableMeta.toObject(values);
      rows.push({
        timestamp: new Date(obj._time).getTime(),
        dissolvedOxygen: obj.dissolved_oxygen,
        ph: obj.ph,
        conductivity: obj.conductivity,
        turbidity: obj.turbidity,
        temperature: obj.temperature,
        rssi: obj.rssi,
        snr: obj.snr,
        latitude: obj.latitude,
        longitude: obj.longitude,
      });
    }
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
