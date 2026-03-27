"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type Device = {
  name: string;
  type: "Inverter" | "Meter" | "Battery" | "Weather";
  status: "Online" | "Offline";
  read: string;
  image: string;
};

type ApiChartRow = {
  ts: string;
  importKw: number;
  exportKw: number;
  importEnergyKwh: number | null;
  exportEnergyKwh: number | null;
};

type HoverPoint = {
  index: number;
  x: number;
  tooltipLeft: number;
  tooltipTop: number;
  row: ApiChartRow;
};

type ChartMetric = "solar" | "import" | "export" | "consumption" | "battery";

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

  const [liveMeter, setLiveMeter] = useState<{
    generationKwh: number | null;
    powerKw: number | null;
    exportKw: number | null;
    consumptionKw: number | null;
    ts: string | null;
    importKwhToday?: number | null;
  } | null>(null);

  const [todayImportKwh, setTodayImportKwh] = useState<number | null>(null);

  const [chartRows, setChartRows] = useState<ApiChartRow[]>([]);
  const [loadingChart, setLoadingChart] = useState(true);
  const [chartError, setChartError] = useState<string | null>(null);

  const [dataMinDate, setDataMinDate] = useState("2026-02-01");
  const [dataMaxDate, setDataMaxDate] = useState(new Date().toISOString().slice(0, 10));

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [rangeLabel, setRangeLabel] = useState("Today");

  const [showImportKw, setShowImportKw] = useState(true);
  const [showImportKwh, setShowImportKwh] = useState(false);
  const [activeMetric, setActiveMetric] = useState<ChartMetric>("import");

  const [hovered, setHovered] = useState<HoverPoint | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("dashboard-hero-collapsed");
    if (saved === "true") setHeroCollapsed(true);
    setHeroReady(true);
  }, []);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setDataMaxDate(today);
    setDateFrom(today);
    setDateTo(today);
    setRangeLabel("Today");
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadLiveMeter() {
      try {
        const res = await fetch("/api/juggle/current-meter", {
          cache: "no-store",
        });

        if (!res.ok) throw new Error("Failed to load live meter data");

        const json = await res.json();

        if (!cancelled) {
          setLiveMeter(json.metrics ?? null);
        }
      } catch (err) {
        console.error("Live meter error:", err);
        if (!cancelled) {
          setLiveMeter(null);
        }
      }
    }

    loadLiveMeter();
    const interval = setInterval(loadLiveMeter, 300000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadTodayImportKwh() {
      try {
        const today = new Date().toISOString().slice(0, 10);

        const res = await fetch(`/api/juggle/current-meter?from=${today}&to=${today}`, {
          cache: "no-store",
        });

        if (!res.ok) throw new Error("Failed to load today's import energy");

        const json = await res.json();
        const rows = (json.chartReadings ?? []) as ApiChartRow[];

        let value = 0;

        if (rows.length > 0) {
          const first = rows[0]?.importEnergyKwh ?? 0;
          const last = rows[rows.length - 1]?.importEnergyKwh ?? 0;
          value = Math.max(0, last - first);
        }

        if (!cancelled) {
          setTodayImportKwh(value);
        }
      } catch (err) {
        console.error("Today's import energy error:", err);
        if (!cancelled) {
          setTodayImportKwh(null);
        }
      }
    }

    loadTodayImportKwh();
    const interval = setInterval(loadTodayImportKwh, 300000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!dateFrom || !dateTo) return;

    let cancelled = false;

    async function loadChartData() {
      try {
        setLoadingChart(true);
        setChartError(null);

        const res = await fetch(`/api/juggle/current-meter?from=${dateFrom}&to=${dateTo}`, {
          cache: "no-store",
        });

        if (!res.ok) throw new Error("Failed to load chart data");

        const json = await res.json();
        const rows = (json.chartReadings ?? []) as ApiChartRow[];

        if (!cancelled) {
          setChartRows(rows);
        }
      } catch (err) {
        if (!cancelled) {
          setChartError(err instanceof Error ? err.message : "Failed to load chart data.");
          setChartRows([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingChart(false);
        }
      }
    }

    loadChartData();

    return () => {
      cancelled = true;
    };
  }, [dateFrom, dateTo]);

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

  const selectedPeriodLabel =
    rangeLabel === "Custom" && dateFrom && dateTo
      ? `${daysBetweenInclusive(dateFrom, dateTo)} days`
      : rangeLabel;

  const latestChartRow = useMemo(() => {
    return chartRows.length ? chartRows[chartRows.length - 1] : null;
  }, [chartRows]);

  const currentGridKw = liveMeter?.powerKw ?? latestChartRow?.importKw ?? 0;
  const currentExportKw = liveMeter?.exportKw ?? latestChartRow?.exportKw ?? 0;
  const importKwhToday = liveMeter?.importKwhToday ?? todayImportKwh;

  const currentSolarKw = currentGridKw;
  const currentLoadKw = Math.max(0, currentGridKw + currentSolarKw - currentExportKw);

  const chartTheme = useMemo(() => {
    switch (activeMetric) {
      case "solar":
        return {
          line: "rgba(101,163,13,0.95)",
          area: "rgba(101,163,13,0.10)",
          secondary: "rgba(101,163,13,0.45)",
        };
      case "export":
        return {
          line: "rgba(59,130,246,0.95)",
          area: "rgba(59,130,246,0.10)",
          secondary: "rgba(59,130,246,0.45)",
        };
      case "consumption":
        return {
          line: "rgba(168,85,247,0.95)",
          area: "rgba(168,85,247,0.10)",
          secondary: "rgba(168,85,247,0.45)",
        };
      case "battery":
        return {
          line: "rgba(51,65,85,0.95)",
          area: "rgba(51,65,85,0.10)",
          secondary: "rgba(51,65,85,0.45)",
        };
      case "import":
      default:
        return {
          line: "rgba(245,158,11,0.95)",
          area: "rgba(245,158,11,0.10)",
          secondary: "rgba(245,158,11,0.45)",
        };
    }
  }, [activeMetric]);

  const primarySeriesLabel = activeMetric === "solar" ? "Solar kW" : "Import kW";
  const secondarySeriesLabel = activeMetric === "solar" ? "Solar kWh" : "Import kWh";

  const devices: Device[] = [
    {
      name: "Weather Station",
      type: "Weather",
      status: "Online",
      read: "22°C • 720 W/m²",
      image: "/device-weather.png",
    },
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
      name: "Grid Import Meter",
      type: "Meter",
      status: "Online",
      read:
        liveMeter?.powerKw != null ? `${formatNumber(liveMeter.powerKw, 3)} kW` : "—",
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

  const kpiCards = [
    {
      id: "solar" as const,
      title: "Solar Generation",
      now: `${formatNumber(currentSolarKw, 3)} kW`,
      sub:
        importKwhToday != null
          ? `${formatNumber(importKwhToday, 3)} kWh today`
          : "Temporary mirrored import feed",
      accent: "bg-lime-600",
      text: "text-lime-700",
      activeRing: "ring-lime-300",
      activeBg: "bg-lime-50",
      clickable: true,
    },
    {
      id: "import" as const,
      title: "Grid Import",
      now:
        liveMeter?.powerKw != null ? `${formatNumber(liveMeter.powerKw, 3)} kW` : "—",
      sub:
        importKwhToday != null
          ? `${formatNumber(importKwhToday, 3)} kWh today`
          : "Live import power",
      accent: "bg-amber-500",
      text: "text-amber-600",
      activeRing: "ring-amber-300",
      activeBg: "bg-amber-50",
      clickable: true,
    },
    {
      id: "export" as const,
      title: "Grid Export",
      now:
        liveMeter?.exportKw != null ? `${formatNumber(liveMeter.exportKw, 3)} kW` : "—",
      sub: "Live export power",
      accent: "bg-blue-500",
      text: "text-blue-600",
      activeRing: "ring-blue-300",
      activeBg: "bg-blue-50",
      clickable: false,
    },
    {
      id: "consumption" as const,
      title: "Consumption",
      now:
        liveMeter?.powerKw != null ? `${formatNumber(currentLoadKw, 3)} kW` : "—",
      sub: "Grid + solar - export",
      accent: "bg-purple-500",
      text: "text-purple-600",
      activeRing: "ring-purple-300",
      activeBg: "bg-purple-50",
      clickable: false,
    },
    {
      id: "battery" as const,
      title: "Battery Storage",
      now: "94%",
      sub: "18.3 kW charging",
      accent: "bg-slate-700",
      text: "text-slate-600",
      activeRing: "ring-slate-300",
      activeBg: "bg-slate-50",
      clickable: false,
    },
  ];

  const chartWidth = 860;
  const chartHeight = 310;
  const padLeft = 68;
  const padRight = 68;
  const padTop = 22;
  const padBottom = 54;
  const plotWidth = chartWidth - padLeft - padRight;
  const plotHeight = chartHeight - padTop - padBottom;

  const kwMaxRaw = Math.max(1, ...chartRows.map((r) => r.importKw));
  const kwDomainTop = Math.ceil(kwMaxRaw / 10) * 10;

  const kwhDomainTop =
    Math.ceil(Math.max(1, ...chartRows.map((r) => r.importEnergyKwh ?? 0)) / 10) * 10;

  const valueToYLeft = (value: number) =>
    padTop + plotHeight - (value / Math.max(kwDomainTop, 1)) * plotHeight;

  const valueToYRight = (value: number) =>
    padTop + plotHeight - (value / Math.max(kwhDomainTop, 1)) * plotHeight;

  const baselineY = padTop + plotHeight;

  const xForIndex = (idx: number) =>
    padLeft +
    (chartRows.length <= 1 ? plotWidth / 2 : (idx / (chartRows.length - 1)) * plotWidth);

  const importKwPoints = chartRows.map((r, idx) => ({
    x: xForIndex(idx),
    y: valueToYLeft(r.importKw),
  }));

  const importKwhPoints = chartRows.map((r, idx) => ({
    x: xForIndex(idx),
    y: valueToYRight(r.importEnergyKwh ?? 0),
  }));

  const importKwLine = buildLinePath(importKwPoints);
  const importKwhLine = buildLinePath(importKwhPoints);
  const importKwhArea = buildAreaPath(importKwhPoints, baselineY);

  const xTickIndices = useMemo(() => {
    if (chartRows.length === 0) return [];
    const tickCount = 6;
    const idxs: number[] = [];
    for (let i = 0; i < tickCount; i++) {
      const idx = Math.round((i / (tickCount - 1)) * (chartRows.length - 1));
      idxs.push(idx);
    }
    return Array.from(new Set(idxs));
  }, [chartRows.length]);

  const yTicksLeft = useMemo(() => {
    const steps = 4;
    return Array.from({ length: steps + 1 }, (_, i) => (kwDomainTop / steps) * i);
  }, [kwDomainTop]);

  const yTicksRight = useMemo(() => {
    const steps = 4;
    return Array.from({ length: steps + 1 }, (_, i) => (kwhDomainTop / steps) * i);
  }, [kwhDomainTop]);

  const totalImportEnergyInRange = useMemo(() => {
    if (!chartRows.length) return 0;
    const first = chartRows[0]?.importEnergyKwh ?? 0;
    const last = chartRows[chartRows.length - 1]?.importEnergyKwh ?? 0;
    return Math.max(0, last - first);
  }, [chartRows]);

  const averageImportKw = useMemo(() => {
    if (!chartRows.length) return 0;
    const sum = chartRows.reduce((acc, row) => acc + row.importKw, 0);
    return sum / chartRows.length;
  }, [chartRows]);

  const hoverIndexFromClientX = (clientX: number) => {
    if (!chartWrapRef.current || chartRows.length === 0) return null;
    const rect = chartWrapRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const normalized = Math.max(0, Math.min(rect.width, x));
    const ratio = rect.width > 0 ? normalized / rect.width : 0;
    const idx = Math.round(ratio * (chartRows.length - 1));
    return Math.max(0, Math.min(chartRows.length - 1, idx));
  };

  const updateHover = (index: number, clientX?: number, clientY?: number) => {
    const row = chartRows[index];
    if (!row) return;

    const x = xForIndex(index);

    let tooltipLeft = 20;
    let tooltipTop = 20;

    if (chartWrapRef.current && clientX !== undefined && clientY !== undefined) {
      const rect = chartWrapRef.current.getBoundingClientRect();
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;

      tooltipLeft = Math.min(localX + 18, rect.width - 250);
      tooltipTop = Math.max(12, Math.min(localY - 20, rect.height - 150));
    }

    setHovered({
      index,
      x,
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
            <div className="text-3xl font-semibold">Juggle&apos;s Office</div>
            <div className="text-lg text-slate-600">Solar PV Installation MDC:00005</div>
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

              <div className="absolute left-6 top-[60px] rounded-2xl border border-white/60 bg-white/80 px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.10)] backdrop-blur-md">
                <div className="mt-1 text-xl font-semibold text-slate-900">722 W/m²</div>
              </div>

              <div className="absolute left-[170px] top-[20px] rounded-2xl border border-white/60 bg-white/78 px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.10)] backdrop-blur-md">
                <div className="mt-1 text-[22px] font-semibold leading-none tracking-tight text-slate-900">
                  {formatNumber(currentSolarKw, 3)}
                  <span className="ml-1 text-sm font-medium text-slate-500">kW</span>
                </div>
              </div>

              <div className="absolute left-1/2 top-[38px] -translate-x-1/2 rounded-2xl border border-white/60 bg-white/78 px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.10)] backdrop-blur-md">
                <div className="mt-1 text-[22px] font-semibold leading-none tracking-tight text-slate-900">
                  {liveMeter?.powerKw != null ? formatNumber(currentLoadKw, 3) : "—"}
                  <span className="ml-1 text-sm font-medium text-slate-500">kW</span>
                </div>
              </div>

              <div className="absolute right-12 top-5 rounded-2xl border border-white/60 bg-white/78 px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.10)] backdrop-blur-md">
                <div className="mt-1 text-[22px] font-semibold leading-none tracking-tight text-slate-900">
                  {liveMeter?.powerKw != null ? formatNumber(liveMeter.powerKw, 3) : "—"}
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

                <g filter="url(#sparkGlow)">
                  <path
                    d="M -4 -6 L 1 -2 L -1 -2 L 4 6 L -1 2 L 1 2 Z"
                    fill="rgba(252, 236, 179, 0.98)"
                  />
                  <animateMotion
                    dur="3.9s"
                    begin="0s;gridspark.end+8s"
                    repeatCount="indefinite"
                    rotate="auto"
                    path="M930 118 C 845 118, 770 118, 690 118"
                  />
                  <animate
                    id="gridspark"
                    attributeName="opacity"
                    values="0;1;1;0"
                    dur="3.9s"
                    begin="0s;gridspark.end+8s"
                    repeatCount="indefinite"
                  />
                </g>
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
                <div className="mt-1 text-xl font-semibold">{formatNumber(currentSolarKw, 3)} kW</div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                <div className="text-sm text-slate-500">Building</div>
                <div className="mt-1 text-xl font-semibold">
                  {liveMeter?.powerKw != null ? `${formatNumber(currentLoadKw, 3)} kW` : "—"}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                <div className="text-sm text-slate-500">Grid</div>
                <div className="mt-1 text-xl font-semibold">
                  {liveMeter?.powerKw != null ? `${formatNumber(liveMeter.powerKw, 3)} kW` : "—"}
                </div>
              </div>
              <div className="rounded-2xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200">
                <div className="text-sm text-emerald-700">Battery</div>
                <div className="mt-1 text-xl font-semibold text-emerald-700">94%</div>
              </div>
            </div>
          </section>
        )}

        <section className="mt-5 grid gap-3 md:grid-cols-5">
          {kpiCards.map((card) => {
            const isActive = activeMetric === card.id;

            return (
              <button
                key={card.title}
                type="button"
                onClick={() => {
                  if (!card.clickable) return;
                  setActiveMetric(card.id);

                  if (card.id === "import" || card.id === "solar") {
                    setShowImportKw(true);
                  }
                }}
            className={`rounded-2xl bg-white px-4 py-3 text-left shadow-sm transition ${
  card.clickable
    ? "cursor-pointer hover:-translate-y-[1px] hover:shadow-md"
    : "cursor-default"
} ${
  isActive
    ? `ring-2 ${card.activeRing}`
    : "ring-1 ring-slate-200"
}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className={`text-xs font-semibold uppercase tracking-[0.12em] ${card.text}`}>
                      {card.title}
                    </div>
                    <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                      {card.now}
                    </div>
                    <div className="mt-0.5 text-sm text-slate-500">{card.sub}</div>

                   
                  </div>

                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${card.accent}`} />
                </div>
              </button>
            );
          })}
        </section>

        <section className="mt-6">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Energy Overview</h2>
                <div className="mt-1 text-sm text-slate-500">
                  Real API meter data with dual-axis overlay and series toggles
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
              {showImportKw && (
                <div className="flex items-center gap-2 text-slate-600">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: chartTheme.line }}
                  />
                  {primarySeriesLabel}
                </div>
              )}
              {showImportKwh && (
                <div className="flex items-center gap-2 text-slate-600">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: chartTheme.secondary }}
                  />
                  {secondarySeriesLabel}
                </div>
              )}
            </div>

            <div className="mb-3 flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={showImportKw}
                  onChange={(e) => setShowImportKw(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                {primarySeriesLabel}
              </label>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={showImportKwh}
                  onChange={(e) => setShowImportKwh(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                {secondarySeriesLabel}
              </label>
            </div>

            <div
              ref={chartWrapRef}
              className="relative overflow-hidden rounded-2xl bg-slate-50 p-3"
              onMouseMove={handleChartMouseMove}
              onMouseLeave={handleChartMouseLeave}
            >
              {loadingChart ? (
                <div className="flex h-72 items-center justify-center text-slate-500">
                  Loading API chart data…
                </div>
              ) : chartError ? (
                <div className="flex h-72 items-center justify-center px-6 text-center text-red-600">
                  {chartError}
                </div>
              ) : chartRows.length === 0 ? (
                <div className="flex h-72 items-center justify-center text-slate-500">
                  No API data in selected date range.
                </div>
              ) : !showImportKw && !showImportKwh ? (
                <div className="flex h-72 items-center justify-center text-slate-500">
                  Select at least one series to display.
                </div>
              ) : (
                <>
                  <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="h-72 w-full"
                    preserveAspectRatio="none"
                  >
                    {yTicksLeft.map((tick, i) => {
                      const y = valueToYLeft(tick);
                      return (
                        <g key={`left-${i}`}>
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

                    {yTicksRight.map((tick, i) => {
                      const y = valueToYRight(tick);
                      return (
                        <g key={`right-${i}`}>
                          <text
                            x={chartWidth - padRight + 10}
                            y={y + 4}
                            textAnchor="start"
                            fontSize="11"
                            fill="#64748b"
                          >
                            {tick >= 10 ? Math.round(tick) : formatNumber(tick, 2)}
                          </text>
                        </g>
                      );
                    })}

                    {xTickIndices.map((idx) => {
                      const x = xForIndex(idx);
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
                            {formatAxisDate(chartRows[idx].ts)}
                          </text>
                        </g>
                      );
                    })}

                    <text x={padLeft - 14} y={padTop - 8} fontSize="12" fill="#64748b">
                      kW
                    </text>
                    <text
                      x={chartWidth - padRight + 14}
                      y={padTop - 8}
                      fontSize="12"
                      fill="#64748b"
                    >
                      kWh
                    </text>

                    {showImportKwh && (
                      <>
                        <path d={importKwhArea} fill={chartTheme.area} />
                        <path
                          d={importKwhLine}
                          fill="none"
                          stroke={chartTheme.secondary}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </>
                    )}

                    {showImportKw && (
                      <path
                        d={importKwLine}
                        fill="none"
                        stroke={chartTheme.line}
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

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
                        {showImportKw && (
                          <circle
                            cx={hovered.x}
                            cy={valueToYLeft(hovered.row.importKw)}
                            r="4"
                            fill={chartTheme.line}
                            stroke="white"
                            strokeWidth="2"
                          />
                        )}
                        {showImportKwh && (
                          <circle
                            cx={hovered.x}
                            cy={valueToYRight(hovered.row.importEnergyKwh ?? 0)}
                            r="4"
                            fill={chartTheme.secondary}
                            stroke="white"
                            strokeWidth="2"
                          />
                        )}
                      </>
                    )}
                  </svg>

                  {hovered && (
                    <div
                      className="pointer-events-none absolute z-10 w-64 rounded-2xl bg-white px-4 py-3 text-sm shadow-lg ring-1 ring-slate-200"
                      style={{
                        left: hovered.tooltipLeft,
                        top: hovered.tooltipTop,
                      }}
                    >
                      <div className="font-semibold text-slate-900">
                        {formatTooltipTime(hovered.row.ts)}
                      </div>

                      {showImportKw && (
                        <div className="mt-2 flex items-center gap-2 text-slate-700">
                          <span
                            className="inline-block h-3 w-3 rounded-full"
                            style={{ backgroundColor: chartTheme.line }}
                          />
                          {primarySeriesLabel}:
                          <span className="font-semibold">
                            {formatNumber(hovered.row.importKw, 3)} kW
                          </span>
                        </div>
                      )}

                      {showImportKwh && (
                        <div className="mt-1 flex items-center gap-2 text-slate-700">
                          <span
                            className="inline-block h-3 w-3 rounded-full"
                            style={{ backgroundColor: chartTheme.secondary }}
                          />
                          {secondarySeriesLabel}:
                          <span className="font-semibold">
                            {hovered.row.importEnergyKwh != null
                              ? `${formatNumber(hovered.row.importEnergyKwh, 3)} kWh`
                              : "—"}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="text-sm text-slate-500">Range Energy</div>
                <div className="text-xl font-semibold">{formatEnergyKwh(totalImportEnergyInRange)}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="text-sm text-slate-500">Average Import kW</div>
                <div className="text-xl font-semibold">{formatNumber(averageImportKw, 3)} kW</div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="text-sm text-slate-500">Grid Import Today</div>
                <div className="text-xl font-semibold">
                  {importKwhToday != null ? `${formatNumber(importKwhToday, 3)} kWh` : "—"}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="text-sm text-slate-500">Selected Period</div>
                <div className="text-xl font-semibold">{selectedPeriodLabel}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Device Overview</h2>
              <div className="text-sm text-slate-500">7 devices</div>
            </div>

            <div className="space-y-2">
              {devices.map((device) => (
                <div
                  key={device.name}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
                      <img
                        src={device.image}
                        alt={device.type}
                        className="h-full w-full object-contain p-0.5"
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{device.name}</div>
                      <div
                        className={`text-xs ${
                          device.status === "Online" ? "text-emerald-600" : "text-red-500"
                        }`}
                      >
                        {device.status}
                      </div>
                    </div>
                  </div>

                  <div className="ml-3 text-right">
                    <div className="text-sm font-semibold">{device.read}</div>
                    <div className="text-xs text-slate-500">Instant read</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-2xl font-semibold">Critical Alarms</h2>
              <div className="mt-3 space-y-2">
                {[
                  "Inverter 3 offline - Last read - 18:23 25/03/26",
                  "Grid Export Limit Breach - 12:03 26/03/26",
                  "Weather station - Wind speed no reading - 08:02 01/03/26",
                ].map((alarm) => (
                  <div
                    key={alarm}
                    className="rounded-xl bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700 ring-1 ring-red-100"
                  >
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