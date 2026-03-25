import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow">
        <h1 className="text-2xl font-semibold mb-6">Juggle Energy Login</h1>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
          />

          <Link
            href="/dashboard"
            className="block w-full rounded-xl bg-slate-900 px-4 py-3 text-center text-white"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}