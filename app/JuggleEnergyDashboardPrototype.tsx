"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type Device = {
  name: string;
  type: "Inverter" | "Meter" | "Battery";
  status: "Online" | "Offline";
  read: string;
  image: string;
};

type CsvRow = {
  timestamp: string;
  day: string;
  importKwhRel: number;
  importKw: number;
  exportKwhRel: number;
  generationKwhRel: number;
  generationKw: number;
};

type HoverPoint = {
  index: number;
  x: number;
  yGeneration: number;
  yImport: number;
  tooltipLeft: number;
  tooltipTop: number;
  row: CsvRow;
};

function parseNum(value: string | undefined): number {
  if (!value || value.trim() === "") return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function clampDate(dateStr: string, minDate: string, maxDate: string): string {
  if (dateStr < minDate) return minDate;
  if (dateStr > maxDate) return maxDate;
  return dateStr;
}

function daysBetweenInclusive(from: string, to: string): number {
  const start = new Date(`${from}T00:00:00Z`).getTime();
  const end = new Date(`${to}T00:00:00Z`).getTime();
  const diff = Math.max(0, end - start);
  return Math.floor(diff / 86400000) + 1;
}

function formatNumber(value: number, dp = 1): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });
}

function formatEnergyKwh(value: number): string {
  if (value >= 1000) return `${formatNumber(value / 1000, 2)} MWh`;
  return `${formatNumber(value, 0)} kWh`;
}

function buildLinePath(points: { x: number; y: number }[]): string {
  if (!points.length) return "";
  return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
}

function buildAreaPath(points: { x: number; y: number }[], baseline: number): string {
  if (!points.length) return "";
  const first = points[0];
  const last = points[points.length - 1];
  const line = buildLinePath(points);
  return `${line} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`;
}

function formatTooltipTime(ts: string): string {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAxisDate(ts: string): string {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts.slice(5, 10);
  return d.toLocaleDateString(undefined, {
    month: "2-digit",
    day: "2-digit",
  });
}

export default function JuggleEnergyDashboardPrototype() {
  const pathname = usePathname();
  const chartWrapRef = useRef<HTMLDivElement | null>(null);

  const [heroCollapsed, setHeroCollapsed] = useState(false);
  const [heroReady, setHeroReady] = useState(false);

  const [rawRows, setRawRows] = useState<CsvRow[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const [dataMinDate, setDataMinDate] = useState("");
  const [dataMaxDate, setDataMaxDate] = useState("");

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [rangeLabel, setRangeLabel] = useState("7D");

  const [hovered, setHovered] = useState<HoverPoint | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("dashboard-hero-collapsed");
    if (saved === "true") setHeroCollapsed(true);
    setHeroReady(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadCsv() {
      try {
        setLoadingData(true);
        setDataError(null);

        const res = await fetch("/data/site-data-15min.csv");
        if (!res.ok) {
          throw new Error("Could not load CSV from /public/data/site-data-15min.csv");
        }

        const text = await res.text();
        const lines = text
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean);

        if (lines.length < 2) throw new Error("CSV appears to be empty.");

        const headers = lines[0].split(",");

        const timestampIdx = headers.findIndex((h) => h.includes("Date / Time"));
        const importKwhRelIdx = headers.findIndex((h) =>
          h.includes("Import/Export Meter Import / kWh (Relative)"),
        );
        const importKwIdx = headers.findIndex((h) =>
          h.includes("Import/Export Meter Power / kW"),
        );
        const exportKwhRelIdx = headers.findIndex((h) =>
          h.includes("Import/Export Meter Export / kWh (Relative)"),
        );
        const generationKwhRelIdx = headers.findIndex((h) =>
          h.includes("Inverter 1 Gen Meter Generation / kWh (Relative)"),
        );

        if (timestampIdx === -1) throw new Error("Could not find the Date / Time column.");
        if (generationKwhRelIdx === -1) {
          throw new Error("Could not find the generation relative kWh column.");
        }

        const parsed: CsvRow[] = lines.slice(1).map((line) => {
          const cols = line.split(",");
          const timestamp = cols[timestampIdx] || "";
          const day = timestamp.slice(0, 10);
          const generationKwhRel = parseNum(cols[generationKwhRelIdx]);

          return {
            timestamp,
            day,
            importKwhRel: importKwhRelIdx >= 0 ? parseNum(cols[importKwhRelIdx]) : 0,
            importKw: importKwIdx >= 0 ? parseNum(cols[importKwIdx]) : 0,
            exportKwhRel: exportKwhRelIdx >= 0 ? parseNum(cols[exportKwhRelIdx]) : 0,
            generationKwhRel,
            generationKw: generationKwhRel * 4,
          };
        });

        const validRows = parsed.filter((r) => r.day);
        if (!validRows.length) throw new Error("No valid data rows were found.");

        const minDate = validRows[0].day;
        const maxDate = validRows[validRows.length - 1].day;

        if (!cancelled) {
          setRawRows(validRows);
          setDataMinDate(minDate);
          setDataMaxDate(maxDate);

          const defaultTo = maxDate;
          const defaultFrom = clampDate(shiftDate(maxDate, -6), minDate, maxDate);

          setDateFrom(defaultFrom);
          setDateTo(defaultTo);
          setRangeLabel("7D");
        }
      } catch (err) {
        if (!cancelled) {
          setDataError(err instanceof Error ? err.message : "Failed to load data.");
        }
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    }

    loadCsv();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleHero = () => {
    const next = !heroCollapsed;
    setHeroCollapsed(next);
    window.localStorage.setItem("dashboard-hero-collapsed", String(next));
  };

  const setPresetRange = (preset: "Today" | "Yesterday" | "7D" | "30D" | "MTD" | "YTD") => {
    if (!dataMaxDate || !dataMinDate) return;

    setRangeLabel(preset);

    if (preset === "Today") {
      setDateFrom(dataMaxDate);
      setDateTo(dataMaxDate);
    } else if (preset === "Yesterday") {
      const yesterday = clampDate(shiftDate(dataMaxDate, -1), dataMinDate, dataMaxDate);
      setDateFrom(yesterday);
      setDateTo(yesterday);
    } else if (preset === "7D") {
      setDateFrom(clampDate(shiftDate(dataMaxDate, -6), dataMinDate, dataMaxDate));
      setDateTo(dataMaxDate);
    } else if (preset === "30D") {
      setDateFrom(clampDate(shiftDate(dataMaxDate, -29), dataMinDate, dataMaxDate));
      setDateTo(dataMaxDate);
    } else if (preset === "MTD") {
      const startOfMonth = `${dataMaxDate.slice(0, 8)}01`;
      setDateFrom(clampDate(startOfMonth, dataMinDate, dataMaxDate));
      setDateTo(dataMaxDate);
    } else if (preset === "YTD") {
      const startOfYear = `${dataMaxDate.slice(0, 4)}-01-01`;
      setDateFrom(clampDate(startOfYear, dataMinDate, dataMaxDate));
      setDateTo(dataMaxDate);
    }
  };

  const filteredRows = useMemo(() => {
    if (!dateFrom || !dateTo) return [];
    return rawRows.filter((row) => row.day >= dateFrom && row.day <= dateTo);
  }, [rawRows, dateFrom, dateTo]);

  const totalGenerationKwh = useMemo(
    () => filteredRows.reduce((sum, r) => sum + r.generationKwhRel, 0),
    [filteredRows],
  );

  const averagePerDayKwh = useMemo(() => {
    const days = Math.max(1, daysBetweenInclusive(dateFrom || "2026-01-01", dateTo || "2026-01-01"));
    return totalGenerationKwh / days;
  }, [dateFrom, dateTo, totalGenerationKwh]);

  const selectedPeriodLabel =
    rangeLabel === "Custom" ? `${daysBetweenInclusive(dateFrom, dateTo)} days` : rangeLabel;

  const devices: Device[] = [
    {
      name: "Inverter 1",
      type: "Inverter",
      status: "Online",
      read: "18.5 kW",
      image: "/device-inverter.png",
    },
    {
      name: "Inverter 2",
      type: "Inverter",
      status: "Online",
      read: "18.8 kW",
      image: "/device-inverter.png",
    },
    {
      name: "Meter 1",
      type: "Meter",
      status: "Online",
      read: "156.0 kW",
      image: "/device-meter.png",
    },
    {
      name: "Inverter 3",
      type: "Inverter",
      status: "Offline",
      read: "0.0 kW",
      image: "/device-inverter.png",
    },
    {
      name: "Meter 2",
      type: "Meter",
      status: "Online",
      read: "92.0 kW",
      image: "/device-meter.png",
    },
    {
      name: "Battery PCS",
      type: "Battery",
      status: "Online",
      read: "18.3 kW",
      image: "/device-battery.png",
    },
  ];

  const navItems = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Energy & CO₂", href: "#" },
    { name: "Carbon", href: "#" },
    { name: "Plot & Report", href: "#" },
    { name: "Daily Energy", href: "#" },
    { name: "Monthly Energy", href: "#" },
    { name: "Yearly Comparison", href: "#" },
    { name: "Alarms", href: "/alarms" },
    { name: "Meters", href: "#" },
    { name: "Inverters", href: "/inverters" },
    { name: "Signals", href: "#" },
    { name: "Staff", href: "#" },
    { name: "Billing", href: "#" },
  ];

  const chartWidth = 860;
  const chartHeight = 310;
  const padLeft = 68;
  const padRight = 22;
  const padTop = 22;
  const padBottom = 54;
  const plotWidth = chartWidth - padLeft - padRight;
  const plotHeight = chartHeight - padTop - padBottom;

  const maxPositiveRaw = Math.max(
    1,
    ...filteredRows.flatMap((r) => [r.generationKw, Math.max(r.importKw, 0)]),
  );
  const maxPositive = Math.ceil(maxPositiveRaw / 10) * 10;

  const minNegativeRaw = Math.min(0, ...filteredRows.map((r) => Math.min(r.importKw, 0)));
  const minNegative = minNegativeRaw < 0 ? Math.floor(minNegativeRaw / 10) * 10 : 0;

  const domainTop = maxPositive;
  const domainBottom = minNegative;
  const domainSpan = domainTop - domainBottom || 1;

  const valueToY = (value: number) =>
    padTop + plotHeight - ((value - domainBottom) / domainSpan) * plotHeight;

  const zeroY = valueToY(0);

  const generationPoints = filteredRows.map((r, idx) => ({
    x:
      padLeft +
      (filteredRows.length <= 1 ? plotWidth / 2 : (idx / (filteredRows.length - 1)) * plotWidth),
    y: valueToY(r.generationKw),
  }));

  const importPoints = filteredRows.map((r, idx) => ({
    x:
      padLeft +
      (filteredRows.length <= 1 ? plotWidth / 2 : (idx / (filteredRows.length - 1)) * plotWidth),
    y: valueToY(r.importKw),
  }));

  const generationLine = buildLinePath(generationPoints);
  const generationArea = buildAreaPath(generationPoints, zeroY);
  const importLine = buildLinePath(importPoints);

  const xTickIndices = useMemo(() => {
    if (filteredRows.length === 0) return [];
    const tickCount = 6;
    const idxs: number[] = [];
    for (let i = 0; i < tickCount; i++) {
      const idx = Math.round((i / (tickCount - 1)) * (filteredRows.length - 1));
      idxs.push(idx);
    }
    return Array.from(new Set(idxs));
  }, [filteredRows.length]);

  const yTicks = useMemo(() => {
    const ticks = [domainBottom];
    if (domainBottom < 0) ticks.push(domainBottom / 2);
    ticks.push(0);
    if (domainTop > 0) ticks.push(domainTop / 2, domainTop);
    return Array.from(new Set(ticks)).sort((a, b) => a - b);
  }, [domainBottom, domainTop]);

  const hoverIndexFromClientX = (clientX: number) => {
    if (!chartWrapRef.current || filteredRows.length === 0) return null;
    const rect = chartWrapRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const normalized = Math.max(0, Math.min(rect.width, x));
    const ratio = rect.width > 0 ? normalized / rect.width : 0;
    const idx = Math.round(ratio * (filteredRows.length - 1));
    return Math.max(0, Math.min(filteredRows.length - 1, idx));
  };

  const updateHover = (index: number, clientX?: number, clientY?: number) => {
    const row = filteredRows[index];
    if (!row) return;

    const x =
      padLeft +
      (filteredRows.length <= 1 ? plotWidth / 2 : (index / (filteredRows.length - 1)) * plotWidth);

    let tooltipLeft = 20;
    let tooltipTop = 20;

    if (chartWrapRef.current && clientX !== undefined && clientY !== undefined) {
      const rect = chartWrapRef.current.getBoundingClientRect();
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;

      tooltipLeft = Math.min(localX + 18, rect.width - 250);
      tooltipTop = Math.max(12, Math.min(localY - 20, rect.height - 130));
    }

    setHovered({
      index,
      x,
      yGeneration: valueToY(row.generationKw),
      yImport: valueToY(row.importKw),
      tooltipLeft,
      tooltipTop,
      row,
    });
  };

  const handleChartMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const idx = hoverIndexFromClientX(e.clientX);
    if (idx === null) return;
    updateHover(idx, e.clientX, e.clientY);
  };

  const handleChartMouseLeave = () => {
    setHovered(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              <div className="relative h-7 w-7">
                <span className="absolute left-0 top-1 h-4 w-4 rounded-full border-2 border-fuchsia-500" />
                <span className="absolute right-0 top-0 h-4 w-4 rounded-full border-2 border-orange-400" />
                <span className="absolute bottom-0 left-2 h-4 w-4 rounded-full border-2 border-lime-500" />
              </div>
            </div>
            <h1 className="text-3xl font-light tracking-tight">
              Juggle <span className="font-medium">Energy</span>
            </h1>
          </div>

          <button className="rounded-full border border-fuchsia-300 px-4 py-2 text-sm font-medium text-fuchsia-700 hover:bg-fuchsia-50">
            Share
          </button>
        </div>

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 pb-4">
          <div>
            <div className="text-3xl font-semibold">Smithy&apos;s Mushrooms PH1</div>
            <div className="text-lg text-slate-600">Solar PV Installation AMP:00028</div>
          </div>
          <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
            Live mock view
          </div>
        </div>

        <nav className="mx-auto flex max-w-7xl flex-wrap gap-2 px-6 pb-4 text-sm text-slate-500">
          {navItems.map((item) => {
            const isAlarmTab = item.name === "Alarms";
            const isActive =
              item.href !== "#" &&
              (pathname === item.href || pathname.startsWith(item.href + "/"));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`relative inline-flex items-center gap-2 rounded-xl px-3 py-2 transition ${
                  isActive
                    ? "border border-slate-300 bg-white text-slate-900 shadow-sm"
                    : "hover:bg-slate-100"
                }`}
              >
                {item.name}
                {isAlarmTab && (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-100 px-1.5 text-[11px] font-semibold text-red-700 ring-1 ring-red-200">
                    3
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-4 flex justify-end">
          <button
            onClick={toggleHero}
            disabled={!heroReady}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
          >
            {heroCollapsed ? "Expand image" : "Collapse image"}
          </button>
        </div>

        {!heroCollapsed ? (
          <section className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200">
            <div className="relative h-[340px] overflow-hidden bg-slate-100">
              <img
                src="/solar-dashboard.png"
                alt="Solar dashboard hero"
                className="h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04),rgba(15,23,42,0.05))]" />

              <div className="absolute left-6 top-6 rounded-2xl border border-white/60 bg-white/80 px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.10)] backdrop-blur-md">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Irradiance
                </div>
                <div className="mt-1 text-xl font-semibold text-slate-900">722 W/m²</div>
              </div>

              <div className="absolute left-[132px] top-[88px] rounded-2xl border border-white/60 bg-white/78 px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.10)] backdrop-blur-md">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                  Solar
                </div>
                <div className="mt-1 text-[28px] font-semibold leading-none tracking-tight text-slate-900">
                  104.2
                  <span className="ml-1 text-sm font-medium text-slate-500">kW</span>
                </div>
              </div>

              <div className="absolute left-1/2 top-9 -translate-x-1/2 rounded-2xl border border-white/60 bg-white/78 px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.10)] backdrop-blur-md">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                  Building load
                </div>
                <div className="mt-1 text-[28px] font-semibold leading-none tracking-tight text-slate-900">
                  156
                  <span className="ml-1 text-sm font-medium text-slate-500">kW</span>
                </div>
              </div>

              <div className="absolute right-24 top-16 rounded-2xl border border-white/60 bg-white/78 px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.10)] backdrop-blur-md">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                  Grid
                </div>
                <div className="mt-1 text-[28px] font-semibold leading-none tracking-tight text-slate-900">
                  92.0
                  <span className="ml-1 text-sm font-medium text-slate-500">kW</span>
                </div>
              </div>

              <div className="absolute bottom-6 right-8 rounded-2xl border border-white/60 bg-white/82 px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.10)] backdrop-blur-md">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                  Battery
                </div>
                <div className="mt-1 text-[28px] font-semibold leading-none tracking-tight text-slate-900">
                  94
                  <span className="ml-1 text-sm font-medium text-slate-500">%</span>
                </div>
              </div>

              <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                viewBox="0 0 1200 340"
                preserveAspectRatio="none"
              >
                <defs>
                  <filter id="sparkGlow" x="-100%" y="-100%" width="300%" height="300%">
                    <feGaussianBlur stdDeviation="2.8" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>


                <circle r="6.8" fill="rgba(252, 236, 179, 0.98)" filter="url(#sparkGlow)">
                  <animateMotion
                    dur="3.4s"
                    begin="0s;gridspark.end+8s"
                    repeatCount="indefinite"
                    rotate="auto"
                    path="M930 118 C 845 118, 770 118, 690 118"
                  />
                  <animate
                    id="gridspark"
                    attributeName="opacity"
                    values="0;1;1;0"
                    dur="3.4s"
                    begin="0s;gridspark.end+8s"
                    repeatCount="indefinite"
                  />
                </circle>
              </svg>
            </div>
          </section>
        ) : (
          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Live Site Summary</h2>
                <p className="text-sm text-slate-500">
                  Hero image collapsed. Preference saved on this browser.
                </p>
              </div>
              <div className="rounded-full bg-slate-50 px-3 py-1 text-sm text-slate-600 ring-1 ring-slate-200">
                Compact mode
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                <div className="text-sm text-slate-500">Irradiance</div>
                <div className="mt-1 text-xl font-semibold">722 W/m²</div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                <div className="text-sm text-slate-500">Solar</div>
                <div className="mt-1 text-xl font-semibold">104.2 kW</div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                <div className="text-sm text-slate-500">Building</div>
                <div className="mt-1 text-xl font-semibold">156 kW</div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                <div className="text-sm text-slate-500">Grid</div>
                <div className="mt-1 text-xl font-semibold">92.0 kW</div>
              </div>
              <div className="rounded-2xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200">
                <div className="text-sm text-emerald-700">Battery</div>
                <div className="mt-1 text-xl font-semibold text-emerald-700">94%</div>
              </div>
            </div>
          </section>
        )}

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { title: "Solar Panel Generated", now: "123 kW", today: "721 kWh today" },
            { title: "Building Consumption", now: "156 kW", today: "860 kWh today" },
            { title: "Battery Storage", now: "94%", today: "18.3 kW charging" },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
            >
              <div className="text-sm font-medium text-slate-500">{card.title}</div>
              <div className="mt-3 text-4xl font-semibold tracking-tight">{card.now}</div>
              <div className="mt-1 text-sm text-slate-500">{card.today}</div>
            </div>
          ))}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Weekly Energy</h2>
                <div className="mt-1 text-sm text-slate-500">
                  15-minute site data with hover readout
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  {["Today", "Yesterday", "7D", "30D", "MTD", "YTD"].map((preset) => (
                    <button
                      key={preset}
                      onClick={() =>
                        setPresetRange(
                          preset as "Today" | "Yesterday" | "7D" | "30D" | "MTD" | "YTD",
                        )
                      }
                      className={`rounded-xl px-3 py-2 text-sm font-medium ring-1 transition ${
                        rangeLabel === preset
                          ? "bg-slate-900 text-white ring-slate-900"
                          : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3">
                  <div className="rounded-2xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
                    <label className="block text-xs text-slate-500">From</label>
                    <input
                      type="date"
                      min={dataMinDate || undefined}
                      max={dataMaxDate || undefined}
                      value={dateFrom}
                      onChange={(e) => {
                        setDateFrom(e.target.value);
                        setRangeLabel("Custom");
                      }}
                      className="mt-1 bg-transparent text-sm font-medium outline-none"
                    />
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
                    <label className="block text-xs text-slate-500">To</label>
                    <input
                      type="date"
                      min={dataMinDate || undefined}
                      max={dataMaxDate || undefined}
                      value={dateTo}
                      onChange={(e) => {
                        setDateTo(e.target.value);
                        setRangeLabel("Custom");
                      }}
                      className="mt-1 bg-transparent text-sm font-medium outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-3 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <span className="inline-block h-3 w-3 rounded-full bg-lime-600" />
                Generation kW
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <span className="inline-block h-3 w-3 rounded-full bg-amber-500" />
                Import / Export kW
              </div>
            </div>

            <div
              ref={chartWrapRef}
              className="relative overflow-hidden rounded-2xl bg-slate-50 p-3"
              onMouseMove={handleChartMouseMove}
              onMouseLeave={handleChartMouseLeave}
            >
              {loadingData ? (
                <div className="flex h-72 items-center justify-center text-slate-500">
                  Loading 15-minute data…
                </div>
              ) : dataError ? (
                <div className="flex h-72 items-center justify-center px-6 text-center text-red-600">
                  {dataError}
                </div>
              ) : filteredRows.length === 0 ? (
                <div className="flex h-72 items-center justify-center text-slate-500">
                  No data in selected date range.
                </div>
              ) : (
                <>
                  <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="h-72 w-full"
                    preserveAspectRatio="none"
                  >
                    {yTicks.map((tick, i) => {
                      const y = valueToY(tick);
                      return (
                        <g key={i}>
                          <line
                            x1={padLeft}
                            y1={y}
                            x2={chartWidth - padRight}
                            y2={y}
                            stroke={tick === 0 ? "rgba(71,85,105,0.35)" : "rgba(148,163,184,0.18)"}
                            strokeWidth={tick === 0 ? "1.5" : "1"}
                          />
                          <text
                            x={padLeft - 10}
                            y={y + 4}
                            textAnchor="end"
                            fontSize="11"
                            fill="#64748b"
                          >
                            {Math.round(tick)}
                          </text>
                        </g>
                      );
                    })}

                    {xTickIndices.map((idx) => {
                      const x =
                        padLeft +
                        (filteredRows.length <= 1
                          ? plotWidth / 2
                          : (idx / (filteredRows.length - 1)) * plotWidth);
                      return (
                        <g key={idx}>
                          <line
                            x1={x}
                            y1={padTop}
                            x2={x}
                            y2={padTop + plotHeight}
                            stroke="rgba(148,163,184,0.12)"
                            strokeWidth="1"
                          />
                          <text
                            x={x}
                            y={chartHeight - 12}
                            textAnchor="middle"
                            fontSize="11"
                            fill="#64748b"
                          >
                            {formatAxisDate(filteredRows[idx].timestamp)}
                          </text>
                        </g>
                      );
                    })}

                    <text x={padLeft - 14} y={padTop - 8} fontSize="12" fill="#64748b">
                      kW
                    </text>

                    <path d={generationArea} fill="rgba(132,153,52,0.14)" />
                    <path
                      d={generationLine}
                      fill="none"
                      stroke="rgba(132,153,52,0.98)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d={importLine}
                      fill="none"
                      stroke="rgba(245,158,11,0.92)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {hovered && (
                      <>
                        <line
                          x1={hovered.x}
                          y1={padTop}
                          x2={hovered.x}
                          y2={padTop + plotHeight}
                          stroke="rgba(15,23,42,0.35)"
                          strokeDasharray="4 4"
                        />
                        <circle
                          cx={hovered.x}
                          cy={hovered.yGeneration}
                          r="4"
                          fill="rgba(132,153,52,1)"
                          stroke="white"
                          strokeWidth="2"
                        />
                        <circle
                          cx={hovered.x}
                          cy={hovered.yImport}
                          r="4"
                          fill="rgba(245,158,11,1)"
                          stroke="white"
                          strokeWidth="2"
                        />
                      </>
                    )}
                  </svg>

                  {hovered && (
                    <div
                      className="pointer-events-none absolute z-10 w-56 rounded-2xl bg-white px-4 py-3 text-sm shadow-lg ring-1 ring-slate-200"
                      style={{
                        left: hovered.tooltipLeft,
                        top: hovered.tooltipTop,
                      }}
                    >
                      <div className="font-semibold text-slate-900">
                        {formatTooltipTime(hovered.row.timestamp)}
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-slate-700">
                        <span className="inline-block h-3 w-3 rounded-full bg-lime-600" />
                        Generation:{" "}
                        <span className="font-semibold">
                          {formatNumber(hovered.row.generationKw, 2)} kW
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-slate-700">
                        <span className="inline-block h-3 w-3 rounded-full bg-amber-500" />
                        Import / Export:{" "}
                        <span className="font-semibold">
                          {formatNumber(hovered.row.importKw, 2)} kW
                        </span>
                      </div>
                      <div className="mt-1 text-slate-600">
                        Interval energy:{" "}
                        <span className="font-semibold">
                          {formatNumber(hovered.row.generationKwhRel, 4)} kWh
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="text-sm text-slate-500">Range Energy</div>
                <div className="text-xl font-semibold">{formatEnergyKwh(totalGenerationKwh)}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="text-sm text-slate-500">Average / day</div>
                <div className="text-xl font-semibold">{formatEnergyKwh(averagePerDayKwh)}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="text-sm text-slate-500">Selected Period</div>
                <div className="text-xl font-semibold">{selectedPeriodLabel}</div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Device Overview</h2>
              <div className="text-sm text-slate-500">6 devices</div>
            </div>

            <div className="space-y-2">
              {devices.map((device) => (
                <div
                  key={device.name}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
                      <img
                        src={device.image}
                        alt={device.type}
                        className="h-full w-full object-contain p-1"
                      />
                    </div>

                    <div>
                      <div className="font-medium">{device.name}</div>
                      <div
                        className={`text-sm ${
                          device.status === "Online" ? "text-emerald-600" : "text-red-500"
                        }`}
                      >
                        {device.status}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-semibold">{device.read}</div>
                    <div className="text-sm text-slate-500">Instant read</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1fr,1fr]">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-2xl font-semibold">Critical Alarms</h2>
            <div className="mt-4 space-y-3">
              {[
                "Inverter 3 offline",
                "Grid import high",
                "Weather station stale data",
              ].map((alarm) => (
                <div key={alarm} className="rounded-2xl bg-red-50 px-4 py-3 text-red-700">
                  {alarm}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-2xl font-semibold">System Status</h2>
            <div className="mt-4 grid gap-3">
              {[
                ["G100 export limit", "OK"],
                ["Switchgear", "OK"],
                ["Weather station", "Online"],
                ["JBox signal", "Fair"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
                >
                  <span className="text-slate-600">{label}</span>
                  <span className="font-semibold">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <style jsx global>{`
        @media (prefers-reduced-motion: reduce) {
          svg animateMotion,
          svg animate {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}