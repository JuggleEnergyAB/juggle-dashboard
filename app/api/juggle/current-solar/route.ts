import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.JUGGLE_API_BASE ?? "https://www.emig.co.uk/p/api";
const API_KEY = process.env.JUGGLE_API_KEY ?? "";
const METER_ID = "MET:002597";

type MeterInfoResponse = {
  emigId: string;
  meterSerial: string;
  type: string;
  description: string;
  importEnergy?: {
    ts: string;
    value: number;
    unit: string;
  };
};

type ReadingValue = {
  value: number;
  unit: string;
};

type ReadingPoint = {
  ts: string;
  importEnergy?: ReadingValue;
  exportEnergy?: ReadingValue;
  importActivePower?: ReadingValue;
  exportActivePower?: ReadingValue;
  currentL1?: ReadingValue;
  voltageL1N?: ReadingValue;
  mainsFrequency?: ReadingValue;
  apparentPower?: ReadingValue;
};

type MeterReadingsResponse = {
  emigId: string;
  meterSerial: string;
  type: string;
  description: string;
  startDate: string;
  endDate: string;
  minIntervalS: number | null;
  readings: ReadingPoint[];
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function juggleGet<T>(path: string): Promise<T> {
  if (!API_KEY) {
    throw new Error("Missing JUGGLE_API_KEY");
  }

  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      Authorization: `token ${API_KEY}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Juggle API ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

function isValidIsoDate(value: string | null): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function formatDateYYYYMMDD(date: Date): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

function isoDateToYYYYMMDD(value: string): string {
  return value.replace(/-/g, "");
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const today = new Date();

    const startDate = isValidIsoDate(fromParam)
      ? isoDateToYYYYMMDD(fromParam)
      : formatDateYYYYMMDD(today);

    const endDate = isValidIsoDate(toParam)
      ? isoDateToYYYYMMDD(toParam)
      : formatDateYYYYMMDD(today);

    const meterInfo = await juggleGet<MeterInfoResponse>(
      `/meter/${encodeURIComponent(METER_ID)}`,
    );

    // Give the upstream API a little breathing room.
    await sleep(1300);

    const readings = await juggleGet<MeterReadingsResponse>(
      `/meter/${encodeURIComponent(
        METER_ID,
      )}/readings?startDate=${startDate}&endDate=${endDate}&minIntervalS=900`,
    );

    const sortedReadings = [...readings.readings].sort(
      (a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime(),
    );

    const latest = sortedReadings.at(-1) ?? null;

    const generationKwh =
      latest?.importEnergy?.value != null
        ? latest.importEnergy.value / 1000
        : meterInfo.importEnergy?.value != null
          ? meterInfo.importEnergy.value / 1000
          : null;

    const powerKw =
      latest?.importActivePower?.value != null
        ? latest.importActivePower.value / 1000
        : null;

    const exportKw =
      latest?.exportActivePower?.value != null
        ? latest.exportActivePower.value / 1000
        : 0;

    const consumptionKw =
      powerKw != null ? powerKw + Math.max(0, exportKw) : null;

    const chartReadings = sortedReadings.map((r) => ({
      ts: r.ts,
      importKw:
        r.importActivePower?.value != null ? r.importActivePower.value / 1000 : 0,
      exportKw:
        r.exportActivePower?.value != null ? r.exportActivePower.value / 1000 : 0,
      importEnergyKwh:
        r.importEnergy?.value != null ? r.importEnergy.value / 1000 : null,
      exportEnergyKwh:
        r.exportEnergy?.value != null ? r.exportEnergy.value / 1000 : null,
    }));

    return NextResponse.json({
      meter: {
        emigId: meterInfo.emigId,
        meterSerial: meterInfo.meterSerial,
        type: meterInfo.type,
        description: meterInfo.description,
      },
      metrics: {
        generationKwh,
        powerKw,
        exportKw,
        consumptionKw,
        ts: latest?.ts ?? meterInfo.importEnergy?.ts ?? null,
      },
      chartReadings,
      raw: {
        meterInfo,
        latestReading: latest,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}