"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";

type Inverter = {
  id: string;
  name: string;
  serial: string;
  status: "On grid" | "Offline";
  instantRead: string;
  yieldToday: string;
  yield7Days: string;
  totalYield: string;
  pr: string;
  avgPr: string;
  maxAcKw: string;
};

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

const inverters: Inverter[] = [
  {
    id: "INVERT:002800",
    name: "Inverter 1",
    serial: "6T2259051089",
    status: "On grid",
    instantRead: "36.1 kW",
    yieldToday: "126 kWh",
    yield7Days: "842 kWh",
    totalYield: "128.4 MWh",
    pr: "83%",
    avgPr: "86%",
    maxAcKw: "100.0 Max AC kW",
  },
  {
    id: "INVERT:002801",
    name: "Inverter 2",
    serial: "6T2259051148",
    status: "On grid",
    instantRead: "28.4 kW",
    yieldToday: "129 kWh",
    yield7Days: "857 kWh",
    totalYield: "129.9 MWh",
    pr: "84%",
    avgPr: "87%",
    maxAcKw: "100.0 Max AC kW",
  },
  {
    id: "INVERT:002802",
    name: "Inverter 3",
    serial: "6T2259051076",
    status: "Offline",
    instantRead: "0.0 kW",
    yieldToday: "0 kWh",
    yield7Days: "0 kWh",
    totalYield: "121.2 MWh",
    pr: "0%",
    avgPr: "82%",
    maxAcKw: "100.0 Max AC kW",
  },
  {
    id: "INVERT:002803",
    name: "Inverter 4",
    serial: "6T2259050984",
    status: "On grid",
    instantRead: "31.2 kW",
    yieldToday: "122 kWh",
    yield7Days: "811 kWh",
    totalYield: "126.7 MWh",
    pr: "82%",
    avgPr: "85%",
    maxAcKw: "100.0 Max AC kW",
  },
  {
    id: "INVERT:002804",
    name: "Inverter 5",
    serial: "6T2259051085",
    status: "On grid",
    instantRead: "29.7 kW",
    yieldToday: "118 kWh",
    yield7Days: "794 kWh",
    totalYield: "124.1 MWh",
    pr: "81%",
    avgPr: "84%",
    maxAcKw: "100.0 Max AC kW",
  },
  {
    id: "INVERT:002805",
    name: "Inverter 6",
    serial: "6T2259051069",
    status: "On grid",
    instantRead: "33.8 kW",
    yieldToday: "124 kWh",
    yield7Days: "826 kWh",
    totalYield: "127.2 MWh",
    pr: "83%",
    avgPr: "85%",
    maxAcKw: "100.0 Max AC kW",
  },
  {
    id: "INVERT:002806",
    name: "Inverter 7",
    serial: "6T2259051034",
    status: "On grid",
    instantRead: "30.1 kW",
    yieldToday: "119 kWh",
    yield7Days: "801 kWh",
    totalYield: "123.8 MWh",
    pr: "81%",
    avgPr: "84%",
    maxAcKw: "100.0 Max AC kW",
  },
  {
    id: "INVERT:002807",
    name: "Inverter 8",
    serial: "6T2259051136",
    status: "On grid",
    instantRead: "27.9 kW",
    yieldToday: "115 kWh",
    yield7Days: "778 kWh",
    totalYield: "122.6 MWh",
    pr: "80%",
    avgPr: "83%",
    maxAcKw: "100.0 Max AC kW",
  },
  {
    id: "INVERT:002808",
    name: "Inverter 9",
    serial: "6T2259051131",
    status: "On grid",
    instantRead: "26.8 kW",
    yieldToday: "111 kWh",
    yield7Days: "761 kWh",
    totalYield: "121.4 MWh",
    pr: "79%",
    avgPr: "82%",
    maxAcKw: "100.0 Max AC kW",
  },
];

const mpptHeaders = Array.from({ length: 12 }, (_, i) => i + 1);

const heatmapValues: number[][] = [
  [520, 515, 508, 502, 498, 492, 486, 475, 468, 460, 454, 448],
  [505, 500, 494, 489, 482, 478, 470, 462, 455, 448, 441, 435],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [498, 494, 489, 482, 478, 472, 466, 460, 454, 448, 441, 438],
  [487, 482, 478, 472, 466, 460, 454, 448, 442, 436, 431, 425],
  [512, 506, 500, 494, 488, 482, 476, 470, 464, 458, 452, 446],
  [493, 487, 481, 475, 470, 464, 458, 452, 446, 439, 433, 427],
  [479, 473, 468, 462, 456, 451, 445, 439, 433, 427, 421, 416],
  [468, 462, 456, 450, 444, 438, 432, 426, 420, 414, 408, 402],
];

function getHeatColor(value: number) {
  if (value === 0) {
    return {
      bg: "bg-slate-200",
      text: "text-slate-500",
      border: "border-slate-300",
    };
  }
  if (value >= 500) {
    return {
      bg: "bg-emerald-500/90",
      text: "text-white",
      border: "border-emerald-600",
    };
  }
  if (value >= 470) {
    return {
      bg: "bg-emerald-400/85",
      text: "text-slate-900",
      border: "border-emerald-500",
    };
  }
  if (value >= 440) {
    return {
      bg: "bg-sky-300/85",
      text: "text-slate-900",
      border: "border-sky-400",
    };
  }
  return {
    bg: "bg-indigo-300/85",
    text: "text-slate-900",
    border: "border-indigo-400",
  };
}

export default function InvertersPage() {
  const pathname = usePathname();
  const [selectedInverter, setSelectedInverter] = useState<number | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const onlineCount = inverters.filter((i) => i.status === "On grid").length;
  const offlineCount = inverters.filter((i) => i.status === "Offline").length;

  const selectInverter = (index: number) => {
    setSelectedInverter(index);
    const el = cardRefs.current[index];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
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

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <div className="text-2xl font-semibold">Inverters</div>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">Inverter String / MPPT Heatmap</h2>
              <p className="mt-1 text-sm text-slate-500">
                Click any inverter row or cell to jump to its detailed performance card
              </p>
            </div>

            <div className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-700 shadow-sm">
              25/03/2026
            </div>
          </div>

          <div className="mb-5 flex flex-wrap gap-3">
            <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
              ● DC Power / W
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-500">
              ○ DC Voltage / V
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-500">
              ○ DC Current / A
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-3 text-sm">
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
              <span className="inline-block h-3 w-3 rounded-full bg-emerald-500" />
              <span>High output</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
              <span className="inline-block h-3 w-3 rounded-full bg-sky-300" />
              <span>Normal output</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
              <span className="inline-block h-3 w-3 rounded-full bg-indigo-300" />
              <span>Lower output</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
              <span className="inline-block h-3 w-3 rounded-full bg-slate-300" />
              <span>Offline / zero</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[980px]">
              <div className="mb-2 grid grid-cols-[220px_repeat(12,minmax(0,1fr))] gap-2">
                <div />
                {mpptHeaders.map((h) => (
                  <div
                    key={h}
                    className="text-center text-sm font-medium text-slate-600"
                  >
                    {h}
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                {heatmapValues.map((row, rowIndex) => (
                  <div
                    key={rowIndex}
                    className="grid grid-cols-[220px_repeat(12,minmax(0,1fr))] gap-2"
                  >
                    <button
                      type="button"
                      onClick={() => selectInverter(rowIndex)}
                      className={`flex items-center rounded-2xl px-3 py-2 text-left text-sm ring-1 transition ${
                        selectedInverter === rowIndex
                          ? "bg-fuchsia-50 ring-fuchsia-300"
                          : "bg-slate-50 ring-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <div>
                        <div className="font-medium">{inverters[rowIndex].name}</div>
                        <div className="text-slate-500">{inverters[rowIndex].serial}</div>
                      </div>
                    </button>

                    {row.map((value, colIndex) => {
                      const style = getHeatColor(value);

                      return (
                        <button
                          key={colIndex}
                          type="button"
                          onClick={() => selectInverter(rowIndex)}
                          className={`flex h-14 items-center justify-center rounded-xl border text-sm font-semibold shadow-sm transition hover:scale-[1.02] ${style.bg} ${style.text} ${style.border} ${
                            selectedInverter === rowIndex
                              ? "ring-2 ring-fuchsia-300"
                              : ""
                          }`}
                          title={`${inverters[rowIndex].name} / MPPT ${colIndex + 1}: ${value} W`}
                        >
                          {value === 0 ? "—" : value}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                  <span>0 W</span>
                  <span>520 W</span>
                </div>
                <div className="h-4 rounded-full bg-gradient-to-r from-slate-300 via-indigo-300 via-sky-300 to-emerald-500" />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-semibold">Inverter Performance</h2>
              <p className="mt-1 text-slate-500">
                Instant output, yield and performance ratio by inverter
              </p>
            </div>
            <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
              {onlineCount} online / {offlineCount} offline
            </div>
          </div>

          <div className="space-y-4">
            {inverters.map((inv, index) => (
              <div
                key={inv.id}
                ref={(el) => {
                  cardRefs.current[index] = el;
                }}
                className={`rounded-3xl border bg-white p-5 transition ${
                  selectedInverter === index
                    ? "border-fuchsia-300 ring-2 ring-fuchsia-200"
                    : "border-slate-200"
                }`}
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-500 ring-1 ring-slate-200">
                      INV
                    </div>
                    <div>
                      <div className="text-2xl font-semibold">{inv.name}</div>
                      <div className="mt-1 text-sm text-slate-500">{inv.id}</div>
                      <div className="text-sm text-slate-500">{inv.serial}</div>
                      <div
                        className={`mt-1 text-sm font-medium ${
                          inv.status === "On grid"
                            ? "text-emerald-600"
                            : "text-red-500"
                        }`}
                      >
                        {inv.status}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-slate-500">Instant read</div>
                    <div className="text-3xl font-semibold">{inv.instantRead}</div>
                    <div className="mt-1 text-sm text-slate-500">{inv.maxAcKw}</div>
                    <div className="mt-2 text-fuchsia-600">Daily Energy CSV</div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.3fr,0.7fr]">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="mb-3 text-lg font-semibold">Yield</div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                        <div className="text-sm text-slate-500">Yield today</div>
                        <div className="mt-1 text-2xl font-semibold">
                          {inv.yieldToday}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                        <div className="text-sm text-slate-500">Yield last 7 days</div>
                        <div className="mt-1 text-2xl font-semibold">
                          {inv.yield7Days}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                        <div className="text-sm text-slate-500">Total yield</div>
                        <div className="mt-1 text-2xl font-semibold">
                          {inv.totalYield}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="mb-3 text-lg font-semibold">Performance Ratio</div>
                    <div className="grid gap-3">
                      <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                        <div className="text-sm text-slate-500">PR</div>
                        <div className="mt-1 text-2xl font-semibold">{inv.pr}</div>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                        <div className="text-sm text-slate-500">Average PR</div>
                        <div className="mt-1 text-2xl font-semibold">{inv.avgPr}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}