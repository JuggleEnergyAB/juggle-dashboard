export default function JuggleEnergyDashboardPrototype() {
  const devices = [
    { name: "Inverter 1", type: "Inverter", status: "Online", read: "18.5 kW" },
    { name: "Inverter 2", type: "Inverter", status: "Online", read: "18.8 kW" },
    { name: "Meter 1", type: "Meter", status: "Online", read: "156.0 kW" },
    { name: "Inverter 3", type: "Inverter", status: "Offline", read: "0.0 kW" },
    { name: "Meter 2", type: "Meter", status: "Online", read: "92.0 kW" },
    { name: "Battery PCS", type: "Battery", status: "Online", read: "18.3 kW" },
  ];

  const navItems = [
    "Dashboard",
    "Energy & CO₂",
    "Carbon",
    "Plot & Report",
    "Daily Energy",
    "Monthly Energy",
    "Yearly Comparison",
    "Alarms",
    "Meters",
    "Inverters",
    "Signals",
    "Staff",
    "Billing",
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
            <div>
              <h1 className="text-3xl font-light tracking-tight">
                Juggle <span className="font-medium">Energy</span>
              </h1>
            </div>
          </div>

          <button className="rounded-full border border-fuchsia-300 px-4 py-2 text-sm font-medium text-fuchsia-700 transition hover:bg-fuchsia-50">
            Share
          </button>
        </div>

        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 pb-4">
          <div>
            <div className="text-3xl font-semibold tracking-tight">
              Smithy&apos;s Mushrooms PH1
            </div>
            <div className="text-lg font-medium text-slate-700">
              Solar PV Installation AMP:00028
            </div>
          </div>
          <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
            Live mock view
          </div>
        </div>

        <nav className="mx-auto flex max-w-7xl flex-wrap gap-2 px-6 pb-4 text-sm text-slate-500">
          {navItems.map((item, index) => {
            const isActive = index === 0;
            const isAlarmTab = item === "Alarms";

            return (
              <button
                key={item}
                className={`relative rounded-xl px-3 py-2 transition ${
                  isActive
                    ? "border border-slate-300 bg-white text-slate-900 shadow-sm"
                    : "hover:bg-slate-100"
                }`}
              >
                <span className="flex items-center gap-2">
                  {item}
                  {isAlarmTab && (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-100 px-1.5 text-[11px] font-semibold text-red-700 ring-1 ring-red-200">
                      3
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <section className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200">
          <div className="relative h-[320px] overflow-hidden bg-gradient-to-br from-slate-50 via-sky-50 to-slate-100">
            <img
              src="/solar-dashboard.png"
              alt="Solar dashboard hero"
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-r from-white/15 via-transparent to-transparent pointer-events-none" />

            <div className="absolute left-6 top-6 rounded-2xl bg-white/95 px-4 py-2 shadow-md backdrop-blur ring-1 ring-slate-200">
              <span className="font-semibold text-slate-800">☀ Irradiance 722 W/m²</span>
            </div>

            <div className="absolute left-[140px] top-[78px] rounded-2xl bg-white/95 px-4 py-2 shadow-md backdrop-blur ring-1 ring-slate-200">
              <div className="font-semibold text-slate-900">104.2 kW</div>
            </div>

            <div className="absolute top-10 left-1/2 -translate-x-1/2 rounded-2xl bg-white/95 px-4 py-2 shadow-md backdrop-blur ring-1 ring-slate-200">
              <div className="font-semibold text-slate-900">156 kW</div>
            </div>

            <div className="absolute top-16 right-24 rounded-2xl bg-white/95 px-4 py-2 shadow-md backdrop-blur ring-1 ring-slate-200">
              <div className="font-semibold text-slate-900">92.0 kW</div>
            </div>

            <div className="absolute bottom-6 right-10 rounded-2xl bg-white/95 px-4 py-2 shadow-md backdrop-blur ring-1 ring-slate-200">
              <div className="font-semibold text-emerald-700">94%</div>
            </div>
          </div>
        </section>

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

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Weekly Energy</h2>
                <div className="text-sm text-slate-500">24/03/2026</div>
              </div>

              <div className="relative h-72 overflow-hidden rounded-2xl bg-slate-50">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.15)_1px,transparent_1px),linear-gradient(to_top,rgba(148,163,184,0.15)_1px,transparent_1px)] bg-[size:56px_56px]" />
                <svg viewBox="0 0 700 280" className="absolute inset-0 h-full w-full">
                  <path
                    d="M0 250 C 120 250, 160 240, 220 180 S 330 50, 420 80 S 520 250, 560 250 S 590 120, 610 145 S 640 250, 665 250 S 680 120, 700 150"
                    fill="rgba(163,191,89,0.18)"
                    stroke="rgba(132,153,52,0.95)"
                    strokeWidth="4"
                  />
                </svg>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="text-sm text-slate-500">Week</div>
                  <div className="text-xl font-semibold">4.3 MWh</div>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="text-sm text-slate-500">Month</div>
                  <div className="text-xl font-semibold">18.2 MWh</div>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="text-sm text-slate-500">This year</div>
                  <div className="text-xl font-semibold">32.9 MWh</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Device Overview</h2>
                <div className="text-sm text-slate-500">6 devices</div>
              </div>

              <div className="space-y-3">
                {devices.map((device) => (
                  <div
                    key={device.name}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
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
          </div>
        </section>
      </main>
    </div>
  );
}