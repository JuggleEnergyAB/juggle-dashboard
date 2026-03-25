export default function JuggleEnergyDashboardPrototype() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-semibold">Juggle Energy</h1>
            <p className="text-sm text-slate-500">
              Smithy&apos;s Mushrooms PH1 • Solar PV Installation • AMP:00028
            </p>
          </div>
          <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
            Live mock view
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="relative h-[320px] bg-gradient-to-br from-sky-50 via-white to-slate-100">
            <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_30%_20%,rgba(255,220,120,0.35),transparent_25%),radial-gradient(circle_at_70%_10%,rgba(255,255,255,0.9),transparent_30%)]" />
            <div className="absolute left-14 top-24 flex items-end gap-10">
              <div className="flex flex-col items-center gap-2">
                <div className="h-20 w-2 rounded-full bg-slate-300" />
                <div className="h-16 w-24 -skew-x-12 rounded-xl border border-sky-900/30 bg-[linear-gradient(135deg,#1e3a8a,#60a5fa)] shadow-lg" />
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="h-28 w-3 rounded-full bg-slate-300" />
                <div className="h-20 w-36 -skew-x-12 rounded-xl border border-sky-900/30 bg-[linear-gradient(135deg,#1e3a8a,#60a5fa)] shadow-xl" />
              </div>
            </div>

            <div className="absolute left-20 top-20 rounded-2xl bg-white/95 px-4 py-2 shadow ring-1 ring-slate-200">
              <span className="font-semibold">Irradiance: 722 W/m²</span>
            </div>

            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-10 pb-8">
              <div className="h-16 w-56 rounded-t-[4rem] bg-green-600/80" />
              <div className="h-24 w-[420px] rounded-t-[2rem] bg-slate-200 ring-1 ring-slate-300" />
              <div className="h-16 w-64 rounded-t-[4rem] bg-green-700/80" />
            </div>

            <div className="absolute bottom-8 left-[36%] h-40 w-[360px] rounded-t-xl rounded-b-md bg-slate-200 shadow-xl ring-1 ring-slate-300">
              <div className="absolute inset-x-4 top-4 h-10 rounded-md bg-slate-300" />
              <div className="absolute inset-x-8 top-16 h-16 rounded-md bg-slate-900/10" />
              <div className="absolute bottom-0 left-0 right-0 h-10 rounded-b-md bg-slate-300" />
            </div>

            <div className="absolute bottom-10 right-16 grid h-28 w-44 grid-cols-3 gap-2 rounded-2xl border border-slate-300 bg-white/90 p-3 shadow-lg">
              <div className="rounded bg-emerald-100" />
              <div className="rounded bg-emerald-200" />
              <div className="rounded bg-emerald-300" />
              <div className="rounded bg-emerald-200" />
              <div className="rounded bg-emerald-300" />
              <div className="rounded bg-emerald-400" />
            </div>

            <div className="absolute right-12 top-20 rounded-2xl bg-white/95 px-4 py-2 shadow ring-1 ring-slate-200">
              <span className="font-semibold text-emerald-700">
                Battery charging: 18.3 kW
              </span>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="text-sm text-slate-500">Solar Generated</div>
            <div className="mt-3 text-3xl font-semibold">123 kW</div>
            <div className="text-sm text-slate-500">721 kWh today</div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="text-sm text-slate-500">Building Consumption</div>
            <div className="mt-3 text-3xl font-semibold">156 kW</div>
            <div className="text-sm text-slate-500">860 kWh today</div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="text-sm text-slate-500">Battery Storage</div>
            <div className="mt-3 text-3xl font-semibold">94%</div>
            <div className="text-sm text-slate-500">18.3 kW charging</div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Weekly Energy</h2>
                <div className="text-sm text-slate-500">24/03/2026</div>
              </div>

              <div className="relative h-64 overflow-hidden rounded-2xl bg-slate-50">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.15)_1px,transparent_1px),linear-gradient(to_top,rgba(148,163,184,0.15)_1px,transparent_1px)] bg-[size:56px_56px]" />
                <svg viewBox="0 0 600 240" className="absolute inset-0 h-full w-full">
                  <path
                    d="M0 220 C 80 220, 110 210, 150 150 S 240 40, 300 65 S 380 220, 420 220 S 455 70, 475 95 S 500 220, 520 220 S 540 90, 560 120 S 585 220, 600 120"
                    fill="rgba(163,191,89,0.25)"
                    stroke="rgba(132,153,52,0.9)"
                    strokeWidth="3"
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
                <h2 className="text-xl font-semibold">Device Overview</h2>
                <div className="text-sm text-slate-500">6 devices</div>
              </div>

              <div className="space-y-3">
                {[
                  ["Inverter 1", "Online", "18.5 kW"],
                  ["Inverter 2", "Online", "18.8 kW"],
                  ["Meter 1", "Online", "156.0 kW"],
                  ["Inverter 3", "Offline", "0.0 kW"],
                  ["Meter 2", "Online", "92.0 kW"],
                  ["Battery PCS", "Online", "18.3 kW"],
                ].map(([name, status, read]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"
                  >
                    <div>
                      <div className="font-medium">{name}</div>
                      <div
                        className={`text-sm ${
                          status === "Online" ? "text-emerald-600" : "text-red-500"
                        }`}
                      >
                        {status}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{read}</div>
                      <div className="text-sm text-slate-500">Instant read</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-semibold">Critical Alarms</h2>
              <div className="mt-4 space-y-3">
                {[
                  "Inverter 3 offline",
                  "Grid import high",
                  "Weather station stale data",
                ].map((alarm) => (
                  <div
                    key={alarm}
                    className="rounded-2xl bg-red-50 px-4 py-3 text-red-700"
                  >
                    {alarm}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-semibold">System Status</h2>
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