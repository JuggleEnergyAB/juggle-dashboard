"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

const mpptHeaders = Array.from({ length: 20 }, (_, i) => i + 1);

const heatmapValues: number[][] = [
  [210, 208, 205, 204, 203, 202, 204, 205, 188, 182, 179, 0, 0, 198, 194, 191, 190, 193, 196, 199],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [120, 121, 119, 118, 117, 118, 119, 120, 110, 108, 107, 0, 116, 115, 114, 113, 112, 111, 110, 109],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [132, 131, 130, 129, 128, 127, 128, 129, 126, 124, 123, 0, 125, 124, 123, 122, 121, 120, 119, 118],
  [128, 127, 126, 125, 124, 123, 124, 125, 120, 119, 118, 0, 121, 120, 119, 118, 117, 116, 115, 114],
  [124, 123, 122, 121, 120, 119, 120, 121, 116, 115, 114, 0, 117, 116, 115, 114, 113, 112, 111, 110],
  [118, 117, 116, 115, 114, 113, 114, 115, 110, 109, 108, 0, 111, 110, 109, 108, 107, 106, 105, 104],
];

function cellStyle(value: number) {
  if (value === 0) return "bg-[#05384d] text-white";
  if (value >= 190) return "bg-[#cb8cc1] text-slate-900";
  if (value >= 150) return "bg-[#a47dad] text-white";
  if (value >= 110) return "bg-[#746d92] text-white";
  return "bg-[#5f638a] text-white";
}

export default function InvertersPage() {
  const pathname = usePathname();

  const onlineCount = inverters.filter((i) => i.status === "On grid").length;
  const offlineCount = inverters.filter((i) => i.status === "Offline").length;

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

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-6">
        <div className="text-2xl font-semibold">Inverters</div>

        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">Inverter String / MPPT Heatmap</h2>
              <div className="mt-1 text-sm text-slate-500">DC Power (String / MPPT)</div>
            </div>

            <div className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-700">
              25/03/2026
            </div>
          </div>

          <div className="mb-6 flex flex-wrap gap-3">
            <div className="rounded-xl border border-slate-700 bg-[#cb8cc1] px-4 py-2 text-slate-900 shadow-sm">
              ○ DC Power / W
            </div>
            <div className="rounded-xl border border-slate-300 bg-[#d7df88] px-4 py-2 text-slate-900 shadow-sm">
              ○ DC Voltage / V
            </div>
            <div className="rounded-xl border border-slate-300 bg-[#e9a79a] px-4 py-2 text-slate-900 shadow-sm">
              ○ DC Current / A
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[1080px]">
              <div className="mb-2 grid grid-cols-[200px_repeat(20,minmax(0,1fr))] gap-0">
                <div />
                {mpptHeaders.map((h) => (
                  <div key={h} className="px-1 text-center text-sm text-slate-700">
                    {h}
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                {heatmapValues.map((row, rowIndex) => (
                  <div
                    key={rowIndex}
                    className="grid grid-cols-[200px_repeat(20,minmax(0,1fr))] gap-1"
                  >
                    <div className="flex items-center pr-2 text-sm text-slate-800">
                      {inverters[rowIndex].name} {inverters[rowIndex].serial}
                    </div>

                    {row.map((value, colIndex) => (
                      <div
                        key={colIndex}
                        className={`h-10 rounded-sm ${cellStyle(value)}`}
                        title={`${inverters[rowIndex].name} / MPPT ${colIndex + 1}: ${value} W`}
                      />
                    ))}
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-sm text-slate-700">
                  <span>5,812.026</span>
                  <span>0</span>
                </div>
                <div className="h-4 rounded-full bg-gradient-to-r from-[#cb8cc1] via-[#746d92] to-[#05384d]" />
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
            {inverters.map((inv) => (
              <div
                key={inv.id}
                className="rounded-3xl border border-slate-200 bg-white p-5"
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