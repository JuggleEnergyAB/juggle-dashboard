import { NextResponse } from "next/server";

type InverterReading = {
  ts?: string;
  importActivePower?: { value?: number; unit?: string };
  importEnergy?: { value?: number; unit?: string };
};

type InverterApiResponse = {
  emigId: string;
  meterSerial?: string;
  description?: string;
  readings?: InverterReading[];
};

const INVERTERS = [
  { emigId: "INVERT:003453", name: "Inverter 1" },
  { emigId: "INVERT:003454", name: "Inverter 2" },
  { emigId: "INVERT:003338", name: "Inverter 3" },
];

function yyyymmdd(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

async function fetchInverter(
  apiKey: string,
  emigId: string,
  name: string,
  dateStr: string,
) {
  const url =
    `https://www.emig.co.uk/p/api/meter/${encodeURIComponent(emigId)}` +
    `/readings?startDate=${dateStr}&endDate=${dateStr}&minIntervalS=300`;

  const res = await fetch(url, {
    headers: {
      Authorization: `token ${apiKey}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return {
      emigId,
      name,
      serial: "",
      liveKw: null,
      avgKwToday: null,
      yieldKwh: null,
      ts: null,
      status: "Offline" as const,
      error: `HTTP ${res.status}`,
    };
  }

  const json = (await res.json()) as InverterApiResponse;
  const readings = json.readings ?? [];
  const last = readings.length ? readings[readings.length - 1] : undefined;

  const liveKw =
    typeof last?.importActivePower?.value === "number"
      ? last.importActivePower.value / 1000
      : null;

  const yieldKwh =
    typeof last?.importEnergy?.value === "number"
      ? last.importEnergy.value / 1000
      : null;

  const validPowerReadings = readings
    .map((r) => r.importActivePower?.value)
    .filter((v): v is number => typeof v === "number");

  const avgKwToday =
    validPowerReadings.length > 0
      ? validPowerReadings.reduce((sum, v) => sum + v, 0) / validPowerReadings.length / 1000
      : null;

  return {
    emigId,
    name,
    serial: json.meterSerial ?? "",
    liveKw,
    avgKwToday,
    yieldKwh,
    ts: last?.ts ?? null,
    status: last ? ("Online" as const) : ("Offline" as const),
  };
}

export async function GET() {
  const apiKey = process.env.JUGGLE_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing JUGGLE_API_KEY" },
      { status: 500 },
    );
  }

  const today = yyyymmdd(new Date());

  const results = await Promise.all(
    INVERTERS.map((inv) => fetchInverter(apiKey, inv.emigId, inv.name, today)),
  );

  return NextResponse.json({
    date: today,
    inverters: results,
  });
}