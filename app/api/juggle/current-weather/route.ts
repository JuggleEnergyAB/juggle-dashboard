import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.JUGGLE_API_BASE ?? "https://www.emig.co.uk/p/api";
const API_KEY = process.env.JUGGLE_API_KEY ?? "";
const WEATHER_ID = "WETH:000160";

type ReadingValue = {
  value: number;
  unit: string | null;
};

type WeatherReadingPoint = {
  ts?: string;
  "ts:"?: string;
  poaIrradiance?: ReadingValue;
  ambientTemperature?: ReadingValue;
  moduleTemperature?: ReadingValue;
  windSpeed?: ReadingValue;
  windDirection?: ReadingValue;
};

type WeatherReadingsResponse = {
  emigId: string;
  meterSerial?: string;
  type?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  minIntervalS?: number | string | null;
  readings: WeatherReadingPoint[];
};

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

function safeTs(reading: WeatherReadingPoint): string | null {
  return reading.ts ?? reading["ts:"] ?? null;
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

    const readings = await juggleGet<WeatherReadingsResponse>(
      `/meter/${encodeURIComponent(
        WEATHER_ID,
      )}/readings?startDate=${startDate}&endDate=${endDate}&minIntervalS=300`,
    );

    const sortedReadings = [...(readings.readings ?? [])]
      .filter((r) => safeTs(r))
      .sort((a, b) => {
        const aTs = safeTs(a) ?? "";
        const bTs = safeTs(b) ?? "";
        return new Date(aTs).getTime() - new Date(bTs).getTime();
      });

    const latest = sortedReadings.at(-1) ?? null;

    return NextResponse.json({
      weather: {
        emigId: readings.emigId ?? WEATHER_ID,
        meterSerial: readings.meterSerial ?? null,
        type: readings.type ?? "WEATHER_STATION",
        description: readings.description ?? "Weather Station",
      },
      metrics: {
        irradianceWm2: latest?.poaIrradiance?.value ?? null,
        ambientC: latest?.ambientTemperature?.value ?? null,
        moduleC: latest?.moduleTemperature?.value ?? null,
        windSpeedMs: latest?.windSpeed?.value ?? null,
        windDirectionDeg: latest?.windDirection?.value ?? null,
        ts: latest ? safeTs(latest) : null,
      },
      chartReadings: sortedReadings.map((r) => ({
        ts: safeTs(r),
        poaIrradianceWm2: r.poaIrradiance?.value ?? null,
        ambientC: r.ambientTemperature?.value ?? null,
        moduleC: r.moduleTemperature?.value ?? null,
        windSpeedMs: r.windSpeed?.value ?? null,
        windDirectionDeg: r.windDirection?.value ?? null,
      })),
      raw: {
        latestReading: latest,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}