import { queryApi, bucket } from "@/app/lib/influxClient";
import { NextResponse } from "next/server";

// Interval kirim buoy (buoy_pengirim.ino: SEND_INTERVAL_MS = 30000)
const SEND_INTERVAL_S = 30;

// Status LoRa dari data asli: RSSI/SNR paket terakhir + kehilangan paket 1 jam terakhir
export async function GET() {
  const fluxQuery = `
    from(bucket: "${bucket}")
      |> range(start: -1h)
      |> filter(fn: (r) => r._measurement == "sensor_readings" and (r._field == "rssi" or r._field == "snr"))
      |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
      |> sort(columns: ["_time"])
  `;

  try {
    const rows: { t: number; rssi?: number; snr?: number }[] = [];
    for await (const { values, tableMeta } of queryApi.iterateRows(fluxQuery)) {
      const o = tableMeta.toObject(values);
      if (typeof o.rssi === "number") {
        rows.push({ t: new Date(o._time).getTime(), rssi: o.rssi, snr: o.snr });
      }
    }

    if (rows.length === 0) {
      return NextResponse.json({ packets: 0 });
    }

    const first = rows[0].t;
    const last = rows[rows.length - 1];
    // Paket yang seharusnya diterima antara paket pertama dan terakhir dalam 1 jam ini
    const expected = Math.max(1, Math.round((last.t - first) / 1000 / SEND_INTERVAL_S) + 1);
    const packetLoss = Math.max(0, (1 - rows.length / expected) * 100);

    return NextResponse.json({
      packets: rows.length,
      expected,
      packetLoss,
      rssi: last.rssi,
      snr: last.snr,
      lastPacket: last.t,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
