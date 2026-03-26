"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function JuggleEnergyDashboardPrototype() {
  const pathname = usePathname();
  const [heroCollapsed, setHeroCollapsed] = useState(false);
  const [heroReady, setHeroReady] = useState(false);
  const [dateFrom, setDateFrom] = useState("2026-03-18");
  const [dateTo, setDateTo] = useState("2026-03-24");
  const [rangeLabel, setRangeLabel] = useState("7D");

  useEffect(() => {
    const saved = window.localStorage.getItem("dashboard-hero-collapsed");
    if (saved === "true") setHeroCollapsed(true);
    setHeroReady(true);
  }, []);

  const toggleHero = () => {
    const next = !heroCollapsed;
    setHeroCollapsed(next);
    window.localStorage.setItem("dashboard-hero-collapsed", String(next));
  };

  const setPresetRange = (preset: "7D" | "30D" | "MTD" | "YTD") => {
    setRangeLabel(preset);
    if (preset === "7D") {
      setDateFrom("2026-03-18");
      setDateTo("2026-03-24");
    } else if (preset === "30D") {
      setDateFrom("2026-02-24");
      setDateTo("2026-03-24");
    } else if (preset === "MTD") {
      setDateFrom("2026-03-01");
      setDateTo("2026-03-24");
    } else if (preset === "YTD") {
      setDateFrom("2026-01-01");
      setDateTo("2026-03-24");
    }
  };

  const devices = [
    { name: "Inverter 1", type: "Inverter", status: "Online", read: "18.5 kW" },
    { name: "Inverter 2", type: "Inverter", status: "Online", read: "18.8 kW" },
    { name: "Meter 1", type: "Meter", status: "Online", read: "156.0 kW" },
    { name: "Inverter 3", type: "Inverter", status: "Offline", read: "0.0 kW" },
    { name: "Meter 2", type: "Meter", status: "Online", read: "92.0 kW" },
    { name: "Battery PCS", type: "Battery", status: "Online", read: "18.3 kW" },
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
            <div className="relative h-[320px] overflow-hidden">
              <img
                src="/solar-dashboard.png"
                alt="Solar dashboard hero"
                className="h-full w-full object-cover"
              />

              <div className="absolute left-6 top-6 rounded-2xl bg-white px-4 py-2 shadow">
                <span className="font-semibold">☀ Irradiance 722 W/m²</span>
              </div>

              <div className="absolute left-[140px] top-[80px] rounded-2xl bg-white px-4 py-2 shadow">
                <span className="text-xl font-medium">104.2 kW</span>
              </div>

              <div className="absolute top-10 left-1/2 -translate-x-1/2 rounded-2xl bg-white px-4 py-2 shadow">
                <span className="text-xl font-medium">156 kW</span>
              </div>

              <div className="absolute top-16 right-24 rounded-2xl bg-white px-4 py-2 shadow">
                <span className="text-xl font-medium">92.0 kW</span>
              </div>

              <div className="absolute bottom-6 right-10 rounded-2xl bg-white px-4 py-2 shadow text-emerald-700">
                <span className="text-xl font-medium">94%</span>
              </div>
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

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Weekly Energy</h2>
                <div className="mt-1 text-sm text-slate-500">
                  Select a custom reporting period
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  {["7D", "30D", "MTD", "YTD"].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setPresetRange(preset as "7D" | "30D" | "MTD" | "YTD")}
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

            <div className="relative h-52 overflow-hidden rounded-2xl bg-slate-50">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.15)_1px,transparent_1px),linear-gradient(to_top,rgba(148,163,184,0.15)_1px,transparent_1px)] bg-[size:48px_48px]" />
              <svg viewBox="0 0 700 220" className="absolute inset-0 h-full w-full">
                <path
                  d="M0 195 C 90 195, 130 182, 190 140 S 300 40, 390 62 S 500 190, 560 182 S 610 96, 700 118"
                  fill="rgba(163,191,89,0.18)"
                  stroke="rgba(132,153,52,0.95)"
                  strokeWidth="4"
                />
              </svg>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="text-sm text-slate-500">Range Energy</div>
                <div className="text-xl font-semibold">4.3 MWh</div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="text-sm text-slate-500">Average / day</div>
                <div className="text-xl font-semibold">614 kWh</div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="text-sm text-slate-500">Selected Period</div>
                <div className="text-xl font-semibold">{rangeLabel === "Custom" ? "Custom" : rangeLabel}</div>
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
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                      {device.type === "Meter"
                        ? "M"
                        : device.type === "Battery"
                        ? "B"
                        : "INV"}
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
    </div>
  );
}