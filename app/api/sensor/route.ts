import { queryApi, bucket } from "@/app/lib/influxClient";
import { NextResponse } from "next/server";

const RANGE_MAP: Record<string, string> = {
  "5s": "-5s",
  "5m": "-5m",
  "30m": "-30m",
  "1h": "-1h",
  "1d": "-1d",
  "1mo": "-30d",
  "1y": "-365d",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "1h";
  const fluxRange = RANGE_MAP[range] || "-1h";

  const fluxQuery = `
    from(bucket: "${bucket}")
      |> range(start: ${fluxRange})
      |> filter(fn: (r) => r._measurement == "sensor_readings")
      |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
      |> sort(columns: ["_time"])
  `;

  try {
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
      });
    }
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}