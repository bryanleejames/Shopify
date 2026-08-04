import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { DatabaseSync } from "node:sqlite";

const DB_PATH = "/home/agent-backend-engineer/fluxpay-backend/fluxpay.db";
const ADMIN_KEY = "fluxpay-admin-2026";

interface WaitlistEntry {
  id: string;
  email: string;
  source: string;
  created_at: string;
}

// Server function to fetch waitlist entries (with admin key check)
const fetchWaitlist = createServerFn({ method: "GET" }).handler(
  async ({ data }: { data: { key: string } }) => {
    if (data.key !== ADMIN_KEY) {
      return { success: false, error: "Invalid admin key" };
    }

    try {
      const db = new DatabaseSync(DB_PATH, { readonly: true });
      const rows = db.prepare(
        "SELECT id, email, source, created_at FROM waitlist ORDER BY created_at DESC LIMIT 200"
      ).all() as WaitlistEntry[];
      db.close();
      return { success: true, entries: rows };
    } catch (error: any) {
      console.error("Admin fetch error:", error);
      return { success: false, error: "Failed to read data" };
    }
  }
);

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  const [key, setKey] = useState("");
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await fetchWaitlist({ data: { key } });
    if (result.success && result.entries) {
      setEntries(result.entries);
      setAuthenticated(true);
    } else {
      setError(result.error || "Authentication failed");
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    setLoading(true);
    const result = await fetchWaitlist({ data: { key } });
    if (result.success && result.entries) {
      setEntries(result.entries);
    }
    setLoading(false);
  };

  if (!authenticated) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-flux-500 text-white">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">FluxPay Admin</h1>
            <p className="mt-1 text-sm text-gray-500">Waitlist Dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="rounded-xl bg-white p-6 shadow-sm">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Admin Key
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Enter admin key"
              className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-flux-500 focus:outline-none focus:ring-1 focus:ring-flux-500"
              autoFocus
            />
            {error && (
              <p className="mb-3 text-sm text-red-500">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !key}
              className="w-full rounded-lg bg-flux-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-flux-600 disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-flux-500 text-white">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-gray-900">FluxPay Admin</h1>
            <span className="rounded-full bg-flux-100 px-2.5 py-0.5 text-xs font-medium text-flux-700">
              {entries.length} signup{entries.length !== 1 ? "s" : ""}
            </span>
          </div>

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </header>

      {/* Table */}
      <main className="mx-auto max-w-5xl px-6 py-8">
        {entries.length === 0 ? (
          <div className="rounded-xl bg-white py-16 text-center shadow-sm">
            <p className="text-gray-500">No waitlist signups yet.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-6 py-3 font-semibold text-gray-600">Email</th>
                    <th className="px-6 py-3 font-semibold text-gray-600">Source</th>
                    <th className="px-6 py-3 font-semibold text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-gray-900">
                        {entry.email}
                      </td>
                      <td className="px-6 py-3">
                        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 capitalize">
                          {entry.source || "website"}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-500">
                        {new Date(entry.created_at + "Z").toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
