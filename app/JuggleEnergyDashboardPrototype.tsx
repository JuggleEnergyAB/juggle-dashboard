"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type ChartMetric = "solar" | "import" | "export" | "consumption" | "battery";

type Device = {
  name: string;
  type: "Inverter" | "Meter" | "Battery" | "Weather";
  status: "Online" | "Offline";
  read: string;
  image: string;
  clickable?: boolean;
  metric?: ChartMetric;
  subread?: string;
  detailLine2?: string;
};

type ChartSeriesRow = {
  ts: string;
  powerKw: number;
  energyKwh: number | null;
};

type HoverPoint = {
  index: number;
  x: number;
  tooltipLeft: number;
  tooltipTop: number;
  importRow: ChartSeriesRow | null;
  solarRow: ChartSeriesRow | null;
};

type LiveInverter = {
  emigId: string;
  name: string;
  serial: string;
  liveKw: number | null;
  avgKwToday?: number | null;
  yieldKwh: number | null;
  ts: string | null;
  status: "Online" | "Offline";
};

type LiveFeedMetrics = {
  generationKwh: number | null;
  powerKw: number | null;
  exportKw: number | null;
  consumptionKw: number | null;
  ts: string | null;
  importKwhToday?: number | null;
};

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
  if (value >= 1000) return `${formatNumber(value / 1000, 3)} MWh`;
  return `${formatNumber(value, 3)} kWh`;
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

function formatLastReadInline(ts: string | null | undefined): string {
  if (!ts) return "Last read —";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "Last read —";
  return `Last read ${d.toLocaleString(undefined, {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function getMetricRing(metric?: ChartMetric): string {
  switch (metric) {
    case "solar":
      return "border-lime-300 ring-lime-300";
    case "import":
      return "border-amber-300 ring-amber-300";
    case "export":
      return "border-blue-300 ring-blue-300";
    case "consumption":
      return "border-purple-300 ring-purple-300";
    case "battery":
      return "border-slate-300 ring-slate-300";
    default:
      return "border-slate-300 ring-slate-300";
  }
}

function toNumberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeChartRows(rows: unknown[]): ChartSeriesRow[] {
  return rows
    .map((raw) => {
      const row = raw as Record<string, unknown>;
      const ts = typeof row.ts === "string" ? row.ts : null;
      if (!ts) return null;

      const powerKw =
        toNumberOrNull(row.importKw) ??
        toNumberOrNull(row.powerKw) ??
        toNumberOrNull(row.solarKw) ??
        toNumberOrNull(row.generationKw) ??
        0;

      const energyKwh =
        toNumberOrNull(row.importEnergyKwh) ??
        toNumberOrNull(row.energyKwh) ??
        toNumberOrNull(row.generationKwh);

      return {
        ts,
        powerKw,
        energyKwh,
      };
    })
    .filter((row): row is ChartSeriesRow => row !== null);
}

export default function JuggleEnergyDashboardPrototype() {
  const pathname = usePathname();
  const chartWrapRef = useRef<HTMLDivElement | null>(null);
  const chartSvgRef = useRef<SVGSVGElement | null>(null);

  const [heroCollapsed, setHeroCollapsed] = useState(false);
  const [heroReady, setHeroReady] = useState(false);

  const [liveMeter, setLiveMeter] = useState<LiveFeedMetrics | null>(null);
  const [liveSolar, setLiveSolar] = useState<LiveFeedMetrics | null>(null);

  const [todayImportKwh, setTodayImportKwh] = useState<number | null>(null);
  const [todaySolarKwh, setTodaySolarKwh] = useState<number | null>(null);
  const [liveInverters, setLiveInverters] = useState<LiveInverter[]>([]);

  const [importChartRows, setImportChartRows] = useState<ChartSeriesRow[]>([]);
  const [solarChartRows, setSolarChartRows] = useState<ChartSeriesRow[]>([]);
  const [loadingChart, setLoadingChart] = useState(true);
  const [chartError, setChartError] = useState<string | null>(null);

  const [dataMinDate, setDataMinDate] = useState("2026-02-01");
  const [dataMaxDate, setDataMaxDate] = useState(new Date().toISOString().slice(0, 10));

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [rangeLabel, setRangeLabel] = useState("Today");

  const [showImportKw, setShowImportKw] = useState(true);
  const [showSolarKw, setShowSolarKw] = useState(false);
  const [showImportKwh, setShowImportKwh] = useState(true);
  const [showSolarKwh, setShowSolarKwh] = useState(false);

  const [activeMetric, setActiveMetric] = useState<ChartMetric>("import");
  const [activeKpiMetrics, setActiveKpiMetrics] = useState<ChartMetric[]>(["import"]);
  const [activeDeviceName, setActiveDeviceName] = useState<string | null>(null);

  const [hovered, setHovered] = useState<HoverPoint | null>(null);

  const [isDraggingRange, setIsDraggingRange] = useState(false);
  const [dragStartIndex, setDragStartIndex] = useState<number | null>(null);
  const [dragCurrentIndex, setDragCurrentIndex] = useState<number | null>(null);

  const [downloadInterval, setDownloadInterval] = useState<"5" | "15" | "30">("30");

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

    async function loadLiveSolar() {
      try {
        const res = await fetch("/api/juggle/current-solar", {
          cache: "no-store",
        });

        if (!res.ok) throw new Error("Failed to load live solar data");

        const json = await res.json();

        if (!cancelled) {
          setLiveSolar(json.metrics ?? null);
        }
      } catch (err) {
        console.error("Live solar error:", err);
        if (!cancelled) {
          setLiveSolar(null);
        }
      }
    }

    loadLiveSolar();
    const interval = setInterval(loadLiveSolar, 300000);

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
        const rows = normalizeChartRows((json.chartReadings ?? []) as unknown[]);

        let value = 0;
        if (rows.length > 0) {
          const first = rows[0]?.energyKwh ?? 0;
          const last = rows[rows.length - 1]?.energyKwh ?? 0;
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
    let cancelled = false;

    async function loadTodaySolarKwh() {
      try {
        const today = new Date().toISOString().slice(0, 10);

        const res = await fetch(`/api/juggle/current-solar?from=${today}&to=${today}`, {
          cache: "no-store",
        });

        if (!res.ok) throw new Error("Failed to load today's solar energy");

        const json = await res.json();
        const rows = normalizeChartRows((json.chartReadings ?? []) as unknown[]);

        let value = 0;
        if (rows.length > 0) {
          const first = rows[0]?.energyKwh ?? 0;
          const last = rows[rows.length - 1]?.energyKwh ?? 0;
          value = Math.max(0, last - first);
        }

        if (!cancelled) {
          setTodaySolarKwh(value);
        }
      } catch (err) {
        console.error("Today's solar energy error:", err);
        if (!cancelled) {
          setTodaySolarKwh(null);
        }
      }
    }

    loadTodaySolarKwh();
    const interval = setInterval(loadTodaySolarKwh, 300000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadLiveInverters() {
      try {
        const res = await fetch("/api/juggle/inverters/current", {
          cache: "no-store",
        });

        if (!res.ok) throw new Error("Failed to load inverter data");

        const json = await res.json();

        if (!cancelled) {
          setLiveInverters(json.inverters ?? []);
        }
      } catch (err) {
        console.error("Inverter live data error:", err);
        if (!cancelled) {
          setLiveInverters([]);
        }
      }
    }

    loadLiveInverters();
    const interval = setInterval(loadLiveInverters, 300000);

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

        const [importRes, solarRes] = await Promise.all([
          fetch(`/api/juggle/current-meter?from=${dateFrom}&to=${dateTo}`, {
            cache: "no-store",
          }),
          fetch(`/api/juggle/current-solar?from=${dateFrom}&to=${dateTo}`, {
            cache: "no-store",
          }),
        ]);

        if (!importRes.ok) throw new Error("Failed to load import chart data");
        if (!solarRes.ok) throw new Error("Failed to load solar chart data");

        const [importJson, solarJson] = await Promise.all([importRes.json(), solarRes.json()]);

        if (!cancelled) {
          setImportChartRows(normalizeChartRows((importJson.chartReadings ?? []) as unknown[]));
          setSolarChartRows(normalizeChartRows((solarJson.chartReadings ?? []) as unknown[]));
        }
      } catch (err) {
        if (!cancelled) {
          setChartError(err instanceof Error ? err.message : "Failed to load chart data.");
          setImportChartRows([]);
          setSolarChartRows([]);
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

  useEffect(() => {
    const solarActive = activeKpiMetrics.includes("solar");
    const importActive = activeKpiMetrics.includes("import");

    if (activeDeviceName === null) {
      setShowSolarKw(solarActive);
      setShowSolarKwh(solarActive);
      setShowImportKw(importActive);
      setShowImportKwh(importActive);
    }
  }, [activeKpiMetrics, activeDeviceName]);

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

  const latestImportChartRow = useMemo(() => {
    return importChartRows.length ? importChartRows[importChartRows.length - 1] : null;
  }, [importChartRows]);

  const latestSolarChartRow = useMemo(() => {
    return solarChartRows.length ? solarChartRows[solarChartRows.length - 1] : null;
  }, [solarChartRows]);

  const currentGridKw = liveMeter?.powerKw ?? latestImportChartRow?.powerKw ?? 0;
  const currentSolarKw = liveSolar?.powerKw ?? latestSolarChartRow?.powerKw ?? 0;
  const currentExportKw = liveMeter?.exportKw ?? 0;
  const importKwhToday = liveMeter?.importKwhToday ?? todayImportKwh;
  const currentLoadKw = Math.max(0, currentGridKw + currentSolarKw - currentExportKw);

  function toggleKpiMetric(metric: ChartMetric) {
    setActiveDeviceName(null);
    setActiveMetric(metric);

    setActiveKpiMetrics((prev) => {
      const exists = prev.includes(metric);
      if (exists) {
        return prev.filter((m) => m !== metric);
      }
      return [...prev, metric];
    });
  }

  const handleDownloadCsv = () => {
    if (!importChartRows.length && !solarChartRows.length) return;

    const parseTs = (ts: string) => {
      const d = new Date(ts);
      return Number.isNaN(d.getTime()) ? null : d;
    };

    const floorToInterval = (date: Date, minutes: number) => {
      const d = new Date(date);
      d.setSeconds(0, 0);
      const mins = d.getMinutes();
      d.setMinutes(Math.floor(mins / minutes) * minutes);
      return d;
    };

    const bucketKey = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      const hh = String(date.getHours()).padStart(2, "0");
      const mm = String(date.getMinutes()).padStart(2, "0");
      return `${y}-${m}-${d} ${hh}:${mm}:00`;
    };

    const intervalMinutes = Number(downloadInterval);

    const grouped = new Map<
      string,
      {
        ts: string;
        importKw: number | null;
        solarKw: number | null;
        importEnergyKwh: number | null;
        solarEnergyKwh: number | null;
        countImport: number;
        countSolar: number;
      }
    >();

    for (const row of importChartRows) {
      const parsed = parseTs(row.ts);
      if (!parsed) continue;
      const key = bucketKey(floorToInterval(parsed, intervalMinutes));
      const existing = grouped.get(key);

      if (!existing) {
        grouped.set(key, {
          ts: key,
          importKw: row.powerKw,
          solarKw: null,
          importEnergyKwh: row.energyKwh,
          solarEnergyKwh: null,
          countImport: 1,
          countSolar: 0,
        });
      } else {
        existing.importKw = (existing.importKw ?? 0) + row.powerKw;
        existing.importEnergyKwh = row.energyKwh ?? existing.importEnergyKwh;
        existing.countImport += 1;
      }
    }

    for (const row of solarChartRows) {
      const parsed = parseTs(row.ts);
      if (!parsed) continue;
      const key = bucketKey(floorToInterval(parsed, intervalMinutes));
      const existing = grouped.get(key);

      if (!existing) {
        grouped.set(key, {
          ts: key,
          importKw: null,
          solarKw: row.powerKw,
          importEnergyKwh: null,
          solarEnergyKwh: row.energyKwh,
          countImport: 0,
          countSolar: 1,
        });
      } else {
        existing.solarKw = (existing.solarKw ?? 0) + row.powerKw;
        existing.solarEnergyKwh = row.energyKwh ?? existing.solarEnergyKwh;
        existing.countSolar += 1;
      }
    }

    const aggregatedRows = Array.from(grouped.values())
      .map((row) => ({
        ts: row.ts,
        importKw:
          row.importKw != null && row.countImport > 0 ? row.importKw / row.countImport : null,
        solarKw:
          row.solarKw != null && row.countSolar > 0 ? row.solarKw / row.countSolar : null,
        importEnergyKwh: row.importEnergyKwh,
        solarEnergyKwh: row.solarEnergyKwh,
      }))
      .sort((a, b) => a.ts.localeCompare(b.ts));

    const headers = [
      "timestamp",
      "import_kw",
      "solar_kw",
      "import_energy_kwh",
      "solar_energy_kwh",
      "interval_import_kwh",
      "interval_solar_kwh",
    ];

    const rows = aggregatedRows.map((row, index) => {
      const prev = index > 0 ? aggregatedRows[index - 1] : null;

      const intervalImport =
        prev && row.importEnergyKwh != null && prev.importEnergyKwh != null
          ? Math.max(0, row.importEnergyKwh - prev.importEnergyKwh)
          : "";

      const intervalSolar =
        prev && row.solarEnergyKwh != null && prev.solarEnergyKwh != null
          ? Math.max(0, row.solarEnergyKwh - prev.solarEnergyKwh)
          : "";

      return [
        row.ts,
        row.importKw != null ? row.importKw.toFixed(3) : "",
        row.solarKw != null ? row.solarKw.toFixed(3) : "",
        row.importEnergyKwh != null ? row.importEnergyKwh.toFixed(3) : "",
        row.solarEnergyKwh != null ? row.solarEnergyKwh.toFixed(3) : "",
        intervalImport !== "" ? Number(intervalImport).toFixed(3) : "",
        intervalSolar !== "" ? Number(intervalSolar).toFixed(3) : "",
      ];
    });

    const csv = [headers, ...rows]
      .map((cols) =>
        cols
          .map((value) => {
            const str = String(value ?? "");
            if (str.includes(",") || str.includes('"') || str.includes("\n")) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `juggle-${downloadInterval}min-data-${dateFrom}-to-${dateTo}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const inverterDevices: Device[] = liveInverters.map((inv) => ({
    name: inv.name,
    type: "Inverter",
    status: inv.status,
    read: inv.liveKw != null ? `${formatNumber(inv.liveKw, 3)} kW` : "—",
    subread:
      inv.yieldKwh != null
        ? `Total Yield ${formatNumber(inv.yieldKwh, 3)} kWh`
        : "Total Yield —",
    detailLine2:
      inv.avgKwToday != null
        ? `AVG kW today ${formatNumber(inv.avgKwToday, 3)}`
        : undefined,
    image: "/device-inverter.png",
    clickable: true,
    metric: "solar",
  }));

  const devices: Device[] = [
    {
      name: "Weather Station",
      type: "Weather",
      status: "Online",
      read: "22°C • 720 W/m²",
      subread: "Instant read",
      image: "/device-weather.png",
      clickable: true,
      metric: "solar",
    },
    ...inverterDevices,
    {
      name: "Generation Meter",
      type: "Meter",
      status: liveSolar?.ts ? "Online" : "Offline",
      read: liveSolar?.powerKw != null ? `${formatNumber(liveSolar.powerKw, 3)} kW` : "—",
      subread:
        liveSolar?.generationKwh != null
          ? `Total Yield ${formatNumber(liveSolar.generationKwh, 3)} kWh`
          : "Total Yield —",
      detailLine2: formatLastReadInline(liveSolar?.ts),
      image: "/device-meter.png",
      clickable: true,
      metric: "solar",
    },
    {
      name: "Grid Import Meter",
      type: "Meter",
      status: liveMeter?.ts ? "Online" : "Offline",
      read: liveMeter?.powerKw != null ? `${formatNumber(liveMeter.powerKw, 3)} kW` : "—",
      subread:
        liveMeter?.generationKwh != null
          ? `Total Import ${formatNumber(liveMeter.generationKwh, 3)} kWh`
          : "Total Import —",
      detailLine2: formatLastReadInline(liveMeter?.ts),
      image: "/device-meter.png",
      clickable: true,
      metric: "import",
    },
    {
      name: "Battery PCS",
      type: "Battery",
      status: "Online",
      read: "18.3 kW",
      subread: "Instant read",
      image: "/device-battery.png",
      clickable: false,
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
      now:
        liveSolar?.powerKw != null
          ? `${formatNumber(liveSolar.powerKw, 3)} kW`
          : "—",
      sub:
        todaySolarKwh != null
          ? `${formatNumber(todaySolarKwh, 3)} kWh today`
          : "Live solar power",
      accent: "bg-lime-600",
      text: "text-lime-700",
      activeRing: "ring-lime-300",
      clickable: true,
    },
    {
      id: "import" as const,
      title: "Grid Import",
      now:
        liveMeter?.powerKw != null
          ? `${formatNumber(liveMeter.powerKw, 3)} kW`
          : "—",
      sub:
        importKwhToday != null
          ? `${formatNumber(importKwhToday, 3)} kWh today`
          : "Live import power",
      accent: "bg-amber-500",
      text: "text-amber-600",
      activeRing: "ring-amber-300",
      clickable: true,
    },
    {
      id: "export" as const,
      title: "Grid Export",
      now: liveMeter?.exportKw != null ? `${formatNumber(liveMeter.exportKw, 3)} kW` : "—",
      sub: "Live export power",
      accent: "bg-blue-500",
      text: "text-blue-600",
      activeRing: "ring-blue-300",
      clickable: false,
    },
    {
      id: "consumption" as const,
      title: "Consumption",
      now:
        liveMeter?.powerKw != null || liveSolar?.powerKw != null
          ? `${formatNumber(currentLoadKw, 3)} kW`
          : "—",
      sub: "Grid + solar - export",
      accent: "bg-purple-500",
      text: "text-purple-600",
      activeRing: "ring-purple-300",
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
      clickable: false,
    },
  ];

  const chartWidth = 760;
  const chartHeight = 180;
  const padLeft = 38;
  const padRight = 68;
  const padTop = 30;
  const padBottom = 30;
  const plotWidth = chartWidth - padLeft - padRight;
  const plotHeight = chartHeight - padTop - padBottom;

  const chartLength = Math.max(importChartRows.length, solarChartRows.length);
  const chartRowsForTicks =
    importChartRows.length >= solarChartRows.length ? importChartRows : solarChartRows;

  const activeKwValues = [
    ...(showImportKw ? importChartRows.map((r) => r.powerKw) : []),
    ...(showSolarKw ? solarChartRows.map((r) => r.powerKw) : []),
  ];

  const kwMaxRaw = Math.max(1, ...activeKwValues);

  const kwDomainTop = (() => {
    if (activeKpiMetrics.length === 1 && activeKpiMetrics.includes("solar")) {
      return Math.max(2, Math.ceil(kwMaxRaw / 2) * 2);
    }

    if (activeKpiMetrics.length === 1 && activeKpiMetrics.includes("import")) {
      return Math.max(2, Math.ceil(kwMaxRaw / 2) * 2);
    }

    return Math.max(2, Math.ceil(kwMaxRaw / 2) * 2);
  })();

  const kwhDomainTop =
    Math.ceil(
      Math.max(
        1,
        ...importChartRows.map((r) => r.energyKwh ?? 0),
        ...solarChartRows.map((r) => r.energyKwh ?? 0),
      ) / 10,
    ) * 10;

  const valueToYLeft = (value: number) =>
    padTop + plotHeight - (value / Math.max(kwDomainTop, 1)) * plotHeight;

  const valueToYRight = (value: number) =>
    padTop + plotHeight - (value / Math.max(kwhDomainTop, 1)) * plotHeight;

  const baselineY = padTop + plotHeight;

  const xForIndex = (idx: number) =>
    padLeft +
    (chartLength <= 1 ? plotWidth / 2 : (idx / (chartLength - 1)) * plotWidth);

  const importKwPoints = importChartRows.map((r, idx) => ({
    x: xForIndex(idx),
    y: valueToYLeft(r.powerKw),
  }));

  const solarKwPoints = solarChartRows.map((r, idx) => ({
    x: xForIndex(idx),
    y: valueToYLeft(r.powerKw),
  }));

  const importKwhPoints = importChartRows.map((r, idx) => ({
    x: xForIndex(idx),
    y: valueToYRight(r.energyKwh ?? 0),
  }));

  const solarKwhPoints = solarChartRows.map((r, idx) => ({
    x: xForIndex(idx),
    y: valueToYRight(r.energyKwh ?? 0),
  }));

  const importKwLine = buildLinePath(importKwPoints);
  const solarKwLine = buildLinePath(solarKwPoints);
  const importKwhLine = buildLinePath(importKwhPoints);
  const importKwhArea = buildAreaPath(importKwhPoints, baselineY);
  const solarKwhLine = buildLinePath(solarKwhPoints);
  const solarKwhArea = buildAreaPath(solarKwhPoints, baselineY);

  const xTickIndices = useMemo(() => {
    if (chartRowsForTicks.length === 0) return [];
    const tickCount = 6;
    const idxs: number[] = [];
    for (let i = 0; i < tickCount; i++) {
      const idx = Math.round((i / (tickCount - 1)) * (chartRowsForTicks.length - 1));
      idxs.push(idx);
    }
    return Array.from(new Set(idxs));
  }, [chartRowsForTicks]);

  const yTicksLeft = useMemo(() => {
    const steps = 4;
    return Array.from({ length: steps + 1 }, (_, i) => (kwDomainTop / steps) * i);
  }, [kwDomainTop]);

  const yTicksRight = useMemo(() => {
    const steps = 4;
    return Array.from({ length: steps + 1 }, (_, i) => (kwhDomainTop / steps) * i);
  }, [kwhDomainTop]);

  const totalImportEnergyInRange = useMemo(() => {
    if (!importChartRows.length) return 0;
    const first = importChartRows[0]?.energyKwh ?? 0;
    const last = importChartRows[importChartRows.length - 1]?.energyKwh ?? 0;
    return Math.max(0, last - first);
  }, [importChartRows]);

  const solarRangeEnergy = useMemo(() => {
    if (!solarChartRows.length) return 0;
    const first = solarChartRows[0]?.energyKwh ?? 0;
    const last = solarChartRows[solarChartRows.length - 1]?.energyKwh ?? 0;
    return Math.max(0, last - first);
  }, [solarChartRows]);

  const averageImportKw = useMemo(() => {
    if (!importChartRows.length) return 0;
    const sum = importChartRows.reduce((acc, row) => acc + row.powerKw, 0);
    return sum / importChartRows.length;
  }, [importChartRows]);

  const solarAverageKw = useMemo(() => {
    if (!solarChartRows.length) return 0;
    const sum = solarChartRows.reduce((acc, row) => acc + row.powerKw, 0);
    return sum / solarChartRows.length;
  }, [solarChartRows]);

  const selectedSummaryCards = useMemo(() => {
    const cards: Array<{
      key: string;
      label: string;
      energyLabel: string;
      energyValue: number;
      averageLabel: string;
      averageValue: number;
      todayLabel: string;
      todayValue: number | null;
      accent: string;
    }> = [];

    if (activeKpiMetrics.includes("import")) {
      cards.push({
        key: "import",
        label: "Import",
        energyLabel: "Range Energy",
        energyValue: totalImportEnergyInRange,
        averageLabel: "Average Import kW",
        averageValue: averageImportKw,
        todayLabel: "Grid Import Today",
        todayValue: importKwhToday,
        accent: "border-amber-200",
      });
    }

    if (activeKpiMetrics.includes("solar")) {
      cards.push({
        key: "solar",
        label: "Solar",
        energyLabel: "Range Energy",
        energyValue: solarRangeEnergy,
        averageLabel: "Average Generation kW",
        averageValue: solarAverageKw,
        todayLabel: "Generation Today",
        todayValue: todaySolarKwh,
        accent: "border-lime-200",
      });
    }

    return cards;
  }, [
    activeKpiMetrics,
    totalImportEnergyInRange,
    averageImportKw,
    importKwhToday,
    solarRangeEnergy,
    solarAverageKw,
    todaySolarKwh,
  ]);

  const getPlotBoundsPx = () => {
    if (!chartSvgRef.current) return null;

    const rect = chartSvgRef.current.getBoundingClientRect();
    const plotLeftPx = (padLeft / chartWidth) * rect.width;
    const plotRightPx = ((chartWidth - padRight) / chartWidth) * rect.width;

    return {
      rect,
      plotLeftPx,
      plotRightPx,
      plotWidthPx: plotRightPx - plotLeftPx,
    };
  };

  const indexFromClientX = (clientX: number) => {
    if (!chartLength) return null;

    const bounds = getPlotBoundsPx();
    if (!bounds) return null;

    const localX = clientX - bounds.rect.left;
    const clampedX = Math.max(bounds.plotLeftPx, Math.min(bounds.plotRightPx, localX));
    const ratio =
      bounds.plotWidthPx > 0 ? (clampedX - bounds.plotLeftPx) / bounds.plotWidthPx : 0;

    const idx = Math.round(ratio * (chartLength - 1));
    return Math.max(0, Math.min(chartLength - 1, idx));
  };

  const hoverIndexFromClientX = (clientX: number) => indexFromClientX(clientX);

  const updateHover = (index: number, clientX?: number, clientY?: number) => {
    const importRow = importChartRows[index] ?? null;
    const solarRow = solarChartRows[index] ?? null;
    if (!importRow && !solarRow) return;

    const x = xForIndex(index);

    let tooltipLeft = 20;
    let tooltipTop = 20;

    if (chartSvgRef.current && clientX !== undefined && clientY !== undefined) {
      const svgRect = chartSvgRef.current.getBoundingClientRect();
      const wrapRect = chartWrapRef.current?.getBoundingClientRect() ?? svgRect;

      const localXInSvg = clientX - svgRect.left;
      const localYInSvg = clientY - svgRect.top;

      const svgOffsetLeftInWrap = svgRect.left - wrapRect.left;
      const svgOffsetTopInWrap = svgRect.top - wrapRect.top;

      const tooltipWidth = 256;
      const tooltipHeight = 210;

      tooltipLeft = Math.max(
        12,
        Math.min(svgOffsetLeftInWrap + localXInSvg + 18, wrapRect.width - tooltipWidth - 12),
      );

      tooltipTop = Math.max(
        12,
        Math.min(svgOffsetTopInWrap + localYInSvg - 20, wrapRect.height - tooltipHeight - 12),
      );
    }

    setHovered({
      index,
      x,
      tooltipLeft,
      tooltipTop,
      importRow,
      solarRow,
    });
  };

  const handleChartMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const idx = indexFromClientX(e.clientX);
    if (idx === null) return;

    setIsDraggingRange(true);
    setDragStartIndex(idx);
    setDragCurrentIndex(idx);
    setHovered(null);
  };

  const handleChartMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingRange) {
      const idx = indexFromClientX(e.clientX);
      if (idx === null) return;
      setDragCurrentIndex(idx);
      return;
    }

    const idx = hoverIndexFromClientX(e.clientX);
    if (idx === null) return;
    updateHover(idx, e.clientX, e.clientY);
  };

  const handleChartMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRange) return;

    const endIdx = indexFromClientX(e.clientX);
    const startIdx = dragStartIndex;

    setIsDraggingRange(false);

    if (startIdx === null || endIdx === null) {
      setDragStartIndex(null);
      setDragCurrentIndex(null);
      return;
    }

    const first = Math.min(startIdx, endIdx);
    const last = Math.max(startIdx, endIdx);

    if (last - first < 1) {
      setDragStartIndex(null);
      setDragCurrentIndex(null);
      return;
    }

    const sourceRows = chartRowsForTicks;
    const fromTs = sourceRows[first]?.ts;
    const toTs = sourceRows[last]?.ts;

    if (fromTs && toTs) {
      const fromDate = new Date(fromTs).toISOString().slice(0, 10);
      const toDate = new Date(toTs).toISOString().slice(0, 10);

      setDateFrom(fromDate);
      setDateTo(toDate);
      setRangeLabel("Custom");
    }

    setDragStartIndex(null);
    setDragCurrentIndex(null);
    setHovered(null);
  };

  const handleChartMouseLeave = () => {
    if (!isDraggingRange) {
      setHovered(null);
    }
  };

  const selectionStartX = dragStartIndex !== null ? xForIndex(dragStartIndex) : null;
  const selectionEndX = dragCurrentIndex !== null ? xForIndex(dragCurrentIndex) : null;

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
                  {liveSolar?.powerKw != null ? formatNumber(liveSolar.powerKw, 3) : "—"}
                  <span className="ml-1 text-sm font-medium text-slate-500">kW</span>
                </div>
              </div>

              <div className="absolute left-1/2 top-[38px] -translate-x-1/2 rounded-2xl border border-white/60 bg-white/78 px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.10)] backdrop-blur-md">
                <div className="mt-1 text-[22px] font-semibold leading-none tracking-tight text-slate-900">
                  {liveMeter?.powerKw != null || liveSolar?.powerKw != null
                    ? formatNumber(currentLoadKw, 3)
                    : "—"}
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
                <div className="mt-1 text-xl font-semibold">
                  {liveSolar?.powerKw != null ? `${formatNumber(liveSolar.powerKw, 3)} kW` : "—"}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                <div className="text-sm text-slate-500">Building</div>
                <div className="mt-1 text-xl font-semibold">
                  {liveMeter?.powerKw != null || liveSolar?.powerKw != null
                    ? `${formatNumber(currentLoadKw, 3)} kW`
                    : "—"}
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
            const isActive = activeDeviceName === null && activeKpiMetrics.includes(card.id);

            return (
              <button
                key={card.title}
                type="button"
                onClick={() => {
                  if (!card.clickable) return;
                  toggleKpiMetric(card.id);
                }}
                className={`rounded-2xl bg-white px-4 py-3 text-left shadow-sm transition ${
                  card.clickable
                    ? "cursor-pointer hover:-translate-y-[1px] hover:shadow-md"
                    : "cursor-default"
                } ${isActive ? `ring-2 ${card.activeRing}` : "ring-1 ring-slate-200"}`}
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
                  Real API meter data with solar and import overlay
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

                  <button
                    onClick={() => setPresetRange("30D")}
                    className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50"
                  >
                    Reset zoom
                  </button>
                </div>

                <div className="flex flex-wrap items-end gap-3">
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

                  <div className="rounded-2xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
                    <label className="block text-xs text-slate-500">CSV interval</label>
                    <select
                      value={downloadInterval}
                      onChange={(e) => setDownloadInterval(e.target.value as "5" | "15" | "30")}
                      className="mt-1 bg-transparent text-sm font-medium outline-none"
                    >
                      <option value="5">5 min</option>
                      <option value="15">15 min</option>
                      <option value="30">30 min</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadCsv}
                    disabled={(!importChartRows.length && !solarChartRows.length) || loadingChart}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-[1px] hover:bg-slate-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Download CSV
                  </button>
                </div>
              </div>
            </div>

            <div className="mb-3 flex flex-wrap gap-4 text-sm">
              {showImportKw && (
                <div className="flex items-center gap-2 text-slate-600">
                  <span className="inline-block h-3 w-3 rounded-full bg-amber-500" />
                  Import kW
                </div>
              )}
              {showSolarKw && (
                <div className="flex items-center gap-2 text-slate-600">
                  <span className="inline-block h-3 w-3 rounded-full bg-lime-600" />
                  Solar kW
                </div>
              )}
              {showImportKwh && (
                <div className="flex items-center gap-2 text-slate-600">
                  <span className="inline-block h-3 w-3 rounded-full bg-amber-300" />
                  Import kWh
                </div>
              )}
              {showSolarKwh && (
                <div className="flex items-center gap-2 text-slate-600">
                  <span className="inline-block h-3 w-3 rounded-full bg-lime-300" />
                  Solar kWh
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
                Import kW
              </label>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={showSolarKw}
                  onChange={(e) => setShowSolarKw(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Solar kW
              </label>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={showImportKwh}
                  onChange={(e) => setShowImportKwh(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Import kWh
              </label>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={showSolarKwh}
                  onChange={(e) => setShowSolarKwh(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Solar kWh
              </label>
            </div>

            <div
              ref={chartWrapRef}
              className={`relative overflow-hidden rounded-2xl bg-slate-50 p-3 ${
                isDraggingRange ? "cursor-ew-resize" : "cursor-crosshair"
              }`}
              onMouseDown={handleChartMouseDown}
              onMouseMove={handleChartMouseMove}
              onMouseUp={handleChartMouseUp}
              onMouseLeave={handleChartMouseLeave}
            >
              {loadingChart ? (
                <div className="flex h-80 items-center justify-center text-slate-500">
                  Loading API chart data…
                </div>
              ) : chartError ? (
                <div className="flex h-80 items-center justify-center px-6 text-center text-red-600">
                  {chartError}
                </div>
              ) : chartLength === 0 ? (
                <div className="flex h-80 items-center justify-center text-slate-500">
                  No API data in selected date range.
                </div>
              ) : !showImportKw && !showSolarKw && !showImportKwh && !showSolarKwh ? (
                <div className="flex h-80 items-center justify-center text-slate-500">
                  Select at least one series to display.
                </div>
              ) : (
                <>
                  <svg
                    ref={chartSvgRef}
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="block h-80 w-full select-none"
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
                            stroke={tick === 0 ? "rgba(51,65,85,0.5)" : "rgba(148,163,184,0.18)"}
                            strokeWidth={tick === 0 ? "1.5" : "1"}
                          />
                          <text
                            x={padLeft - 10}
                            y={y + 4}
                            textAnchor="end"
                            fontSize="9"
                            fill="#334155"
                          >
                            {tick.toFixed(1)}
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
                            fontSize="9"
                            fill="#334155"
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
                            y={chartHeight - 6}
                            textAnchor="middle"
                            fontSize="9"
                            fill="#334155"
                            fontWeight="500"
                          >
                            {formatAxisDate(chartRowsForTicks[idx].ts)}
                          </text>
                        </g>
                      );
                    })}

                    <text
                      x={padLeft - 10}
                      y={padTop - 12}
                      textAnchor="end"
                      fontSize="11"
                      fill="rgba(30,41,59,0.8)"
                      fontWeight="600"
                    >
                      kW
                    </text>
                    <text
                      x={chartWidth - padRight + 10}
                      y={padTop - 12}
                      textAnchor="start"
                      fontSize="11"
                      fill="rgba(30,41,59,0.8)"
                      fontWeight="600"
                    >
                      kWh
                    </text>

                    {showImportKwh && importKwhPoints.length > 0 && (
                      <>
                        <path d={importKwhArea} fill="rgba(245,158,11,0.10)" />
                        <path
                          d={importKwhLine}
                          fill="none"
                          stroke="rgba(245,158,11,0.45)"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </>
                    )}

                    {showSolarKwh && solarKwhPoints.length > 0 && (
                      <>
                        <path d={solarKwhArea} fill="rgba(190,242,100,0.10)" />
                        <path
                          d={solarKwhLine}
                          fill="none"
                          stroke="rgba(132,204,22,0.45)"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </>
                    )}

                    {showImportKw && importKwPoints.length > 0 && (
                      <path
                        d={importKwLine}
                        fill="none"
                        stroke="rgba(245,158,11,0.95)"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {showSolarKw && solarKwPoints.length > 0 && (
                      <path
                        d={solarKwLine}
                        fill="none"
                        stroke="rgba(101,163,13,0.95)"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {isDraggingRange && selectionStartX !== null && selectionEndX !== null && (
                      <rect
                        x={Math.min(selectionStartX, selectionEndX)}
                        y={padTop}
                        width={Math.abs(selectionEndX - selectionStartX)}
                        height={plotHeight}
                        fill="rgba(15,23,42,0.08)"
                        stroke="rgba(15,23,42,0.18)"
                        strokeWidth="1"
                        rx="2"
                      />
                    )}

                    {hovered && !isDraggingRange && (
                      <>
                        <line
                          x1={hovered.x}
                          y1={padTop}
                          x2={hovered.x}
                          y2={padTop + plotHeight}
                          stroke="rgba(15,23,42,0.35)"
                          strokeDasharray="4 4"
                        />
                        {showImportKw && hovered.importRow && (
                          <circle
                            cx={hovered.x}
                            cy={valueToYLeft(hovered.importRow.powerKw)}
                            r="4"
                            fill="rgba(245,158,11,0.95)"
                            stroke="white"
                            strokeWidth="2"
                          />
                        )}
                        {showSolarKw && hovered.solarRow && (
                          <circle
                            cx={hovered.x}
                            cy={valueToYLeft(hovered.solarRow.powerKw)}
                            r="4"
                            fill="rgba(101,163,13,0.95)"
                            stroke="white"
                            strokeWidth="2"
                          />
                        )}
                        {showImportKwh && hovered.importRow && (
                          <circle
                            cx={hovered.x}
                            cy={valueToYRight(hovered.importRow.energyKwh ?? 0)}
                            r="4"
                            fill="rgba(245,158,11,0.45)"
                            stroke="white"
                            strokeWidth="2"
                          />
                        )}
                        {showSolarKwh && hovered.solarRow && (
                          <circle
                            cx={hovered.x}
                            cy={valueToYRight(hovered.solarRow.energyKwh ?? 0)}
                            r="4"
                            fill="rgba(132,204,22,0.45)"
                            stroke="white"
                            strokeWidth="2"
                          />
                        )}
                      </>
                    )}
                  </svg>

                  {hovered && !isDraggingRange && (
                    <div
                      className="pointer-events-none absolute z-10 w-64 rounded-2xl bg-white px-4 py-3 text-sm shadow-lg ring-1 ring-slate-200"
                      style={{
                        left: hovered.tooltipLeft,
                        top: hovered.tooltipTop,
                      }}
                    >
                      <div className="font-semibold text-slate-900">
                        {formatTooltipTime(
                          hovered.importRow?.ts ??
                            hovered.solarRow?.ts ??
                            chartRowsForTicks[hovered.index]?.ts,
                        )}
                      </div>

                      {showImportKw && hovered.importRow && (
                        <div className="mt-2 flex items-center gap-2 text-slate-700">
                          <span className="inline-block h-3 w-3 rounded-full bg-amber-500" />
                          Import kW:
                          <span className="font-semibold">
                            {formatNumber(hovered.importRow.powerKw, 3)} kW
                          </span>
                        </div>
                      )}

                      {showSolarKw && hovered.solarRow && (
                        <div className="mt-1 flex items-center gap-2 text-slate-700">
                          <span className="inline-block h-3 w-3 rounded-full bg-lime-600" />
                          Solar kW:
                          <span className="font-semibold">
                            {formatNumber(hovered.solarRow.powerKw, 3)} kW
                          </span>
                        </div>
                      )}

                      {showImportKwh && hovered.importRow && (
                        <div className="mt-1 flex items-center gap-2 text-slate-700">
                          <span className="inline-block h-3 w-3 rounded-full bg-amber-300" />
                          Import kWh:
                          <span className="font-semibold">
                            {hovered.importRow.energyKwh != null
                              ? `${formatNumber(hovered.importRow.energyKwh, 3)} kWh`
                              : "—"}
                          </span>
                        </div>
                      )}

                      {showSolarKwh && hovered.solarRow && (
                        <div className="mt-1 flex items-center gap-2 text-slate-700">
                          <span className="inline-block h-3 w-3 rounded-full bg-lime-300" />
                          Solar kWh:
                          <span className="font-semibold">
                            {hovered.solarRow.energyKwh != null
                              ? `${formatNumber(hovered.solarRow.energyKwh, 3)} kWh`
                              : "—"}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div
              className={`mt-4 grid gap-3 ${
                selectedSummaryCards.length > 1 ? "md:grid-cols-2" : "md:grid-cols-4"
              }`}
            >
              {selectedSummaryCards.map((summary) => (
                <div
                  key={summary.key}
                  className={`rounded-2xl border bg-slate-50 px-4 py-3 ${summary.accent}`}
                >
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {summary.label}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <div className="text-sm text-slate-500">{summary.energyLabel}</div>
                      <div className="text-xl font-semibold">
                        {formatEnergyKwh(summary.energyValue)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">{summary.averageLabel}</div>
                      <div className="text-xl font-semibold">
                        {formatNumber(summary.averageValue, 3)} kW
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">{summary.todayLabel}</div>
                      <div className="text-xl font-semibold">
                        {summary.todayValue != null
                          ? `${formatNumber(summary.todayValue, 3)} kWh`
                          : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">Selected Period</div>
                      <div className="text-xl font-semibold">{selectedPeriodLabel}</div>
                    </div>
                  </div>
                </div>
              ))}

              {selectedSummaryCards.length === 0 && (
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="text-sm text-slate-500">Selected Period</div>
                  <div className="text-xl font-semibold">{selectedPeriodLabel}</div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Device Overview</h2>
              <div className="text-sm text-slate-500">{devices.length} devices</div>
            </div>

            <div className="space-y-2">
              {devices.map((device) => {
                const isSelected = activeDeviceName === device.name;
                const activeRing = getMetricRing(device.metric);

                return (
                  <button
                    key={device.name}
                    type="button"
                    onClick={() => {
                      if (!device.clickable || !device.metric) return;

                      if (activeDeviceName === device.name) {
                        setActiveDeviceName(null);
                        const solarActive = activeKpiMetrics.includes("solar");
                        const importActive = activeKpiMetrics.includes("import");

                        setShowSolarKw(solarActive);
                        setShowSolarKwh(solarActive);
                        setShowImportKw(importActive);
                        setShowImportKwh(importActive);
                        return;
                      }

                      setActiveDeviceName(device.name);
                      setActiveMetric(device.metric);

                      if (device.metric === "solar") {
                        setShowSolarKw(true);
                        setShowSolarKwh(true);
                      }

                      if (device.metric === "import") {
                        setShowImportKw(true);
                        setShowImportKwh(true);
                      }
                    }}
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                      device.clickable ? "cursor-pointer hover:shadow-sm" : "cursor-default"
                    } ${isSelected ? `ring-2 ${activeRing}` : "border-slate-200"}`}
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
                        <img
                          src={device.image}
                          alt={device.type}
                          className="h-full w-full object-contain p-0.5"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{device.name}</div>
                        <div className="text-xs text-slate-500">
                          <span
                            className={
                              device.status === "Online" ? "text-emerald-600" : "text-red-500"
                            }
                          >
                            {device.status}
                          </span>
                          {device.type === "Inverter" ? (
                            <span className="ml-2 text-slate-500">
                              •{" "}
                              {formatLastReadInline(
                                liveInverters.find((inv) => inv.name === device.name)?.ts,
                              )}
                            </span>
                          ) : null}
                          {device.type === "Meter" && device.detailLine2 ? (
                            <span className="ml-2 text-slate-500">• {device.detailLine2}</span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="ml-3 text-right">
                      <div className="text-sm font-semibold">{device.read}</div>
                      {device.detailLine2 && device.type === "Inverter" && (
                        <div className="text-xs text-slate-500">{device.detailLine2}</div>
                      )}
                      <div className="text-xs text-slate-500">
                        {device.type === "Inverter" || device.name === "Generation Meter"
                          ? device.subread ?? "Total Yield —"
                          : device.subread ?? (device.clickable ? "Click to plot" : "Instant read")}
                      </div>
                    </div>
                  </button>
                );
              })}
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