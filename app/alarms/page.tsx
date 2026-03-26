import Link from "next/link";

export default function AlarmsPage() {
  const alarms = [
    {
      title: "Inverter 3 offline",
      severity: "Critical",
      status: "Active",
      startTime: "24/03/2026 08:14",
      deviceName: "Inverter 3",
      serialNumber: "SMA-STP110-60-00318472",
      code: "INV-OFFLINE-001",
      description: "No live telemetry received from inverter for longer than expected polling interval.",
    },
    {
      title: "Grid import high",
      severity: "High",
      status: "Active",
      startTime: "24/03/2026 10:32",
      deviceName: "Meter 1",
      serialNumber: "MTR-SDM630-00981234",
      code: "GRID-IMPORT-014",
      description: "Site import has exceeded configured threshold for sustained period.",
    },
    {
      title: "Weather station stale data",
      severity: "Medium",
      status: "Active",
      startTime: "24/03/2026 07:55",
      deviceName: "Weather Station",
      serialNumber: "WS-IRR-00277195",
      code: "WX-STALE-003",
      description: "Irradiance and meteorological values have not updated within expected interval.",
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
          <div className="rounded-full bg-red-50 px-4 py-2 text-sm text-red-700">
            3 active alarms
          </div>
        </div>

        <nav className="mx-auto flex max-w-7xl flex-wrap gap-2 px-6 pb-4 text-sm text-slate-500">
          {navItems.map((item) => {
            const isActive = item.name === "Alarms";
            const isAlarmTab = item.name === "Alarms";

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
        <div className="space-y-4">
          {alarms.map((alarm) => (
            <div
              key={alarm.code}
              className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
            >
              <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold">{alarm.title}</h2>
                  <div className="mt-1 text-sm text-slate-500">Alarm code: {alarm.code}</div>
                </div>

                <div className="flex gap-2">
                  <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-700">
                    {alarm.severity}
                  </span>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
                    {alarm.status}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="text-sm text-slate-500">Start time</div>
                  <div className="mt-1 font-semibold">{alarm.startTime}</div>
                </div>

                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="text-sm text-slate-500">Device</div>
                  <div className="mt-1 font-semibold">{alarm.deviceName}</div>
                </div>

                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="text-sm text-slate-500">Serial number</div>
                  <div className="mt-1 font-semibold">{alarm.serialNumber}</div>
                </div>

                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="text-sm text-slate-500">Status</div>
                  <div className="mt-1 font-semibold">{alarm.status}</div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-4">
                <div className="text-sm text-slate-500">Description</div>
                <div className="mt-1">{alarm.description}</div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}