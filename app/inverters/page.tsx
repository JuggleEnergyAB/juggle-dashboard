import Link from "next/link";

export default function InvertersPage() {
  const inverters = [
    {
      name: "Inverter 1",
      status: "Online",
      instantRead: "18.5 kW",
      yieldToday: "126 kWh",
      yield7Days: "842 kWh",
      totalYield: "128.4 MWh",
      pr: "83%",
      avgPr: "86%",
    },
    {
      name: "Inverter 2",
      status: "Online",
      instantRead: "18.8 kW",
      yieldToday: "129 kWh",
      yield7Days: "857 kWh",
      totalYield: "129.9 MWh",
      pr: "84%",
      avgPr: "87%",
    },
    {
      name: "Inverter 3",
      status: "Offline",
      instantRead: "0.0 kW",
      yieldToday: "0 kWh",
      yield7Days: "0 kWh",
      totalYield: "121.2 MWh",
      pr: "0%",
      avgPr: "82%",
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
    { name: "Alarms", href: "#" },
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
          {navItems.map((item) => {
            const isActive = item.name === "Inverters";
            const isAlarmTab = item.name === "Alarms";

            return (
              <Link key={item.name} href={item.href}>
                <span
                  className={`relative inline-flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 transition ${
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
                </span>
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-semibold">Inverter Performance</h2>
              <p className="mt-1 text-slate-500">
                Instant output, yield and performance ratio by inverter
              </p>
            </div>
            <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
              2 online / 1 offline
            </div>
          </div>

          <div className="space-y-4">
            {inverters.map((inv) => (
              <div
                key={inv.name}
                className="rounded-3xl border border-slate-200 bg-white p-5"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-500 ring-1 ring-slate-200">
                      INV
                    </div>
                    <div>
                      <div className="text-2xl font-semibold">{inv.name}</div>
                      <div
                        className={`text-sm font-medium ${
                          inv.status === "Online"
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
                    <div className="text-3xl font-semibold">
                      {inv.instantRead}
                    </div>
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
                        <div className="mt-1 text-2xl font-semibold">
                          {inv.pr}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                        <div className="text-sm text-slate-500">Average PR</div>
                        <div className="mt-1 text-2xl font-semibold">
                          {inv.avgPr}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}