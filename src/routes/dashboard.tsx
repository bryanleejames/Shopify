import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { getSessionToken, clearSession, validateSession } from "~/lib/session";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [userName, setUserName] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    validateSession().then((session) => {
      if (!session.valid) {
        window.location.href = "/login";
        return;
      }
      setLoggedIn(true);
      setIsPremium(session.user?.isPremium === true);
      setUserName(session.user?.name || "");
      setChecking(false);
    });
  }, []);

  if (checking) {
    return (
      <div className="min-h-dvh bg-surface-warm flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-pulse rounded-lg bg-gradient-to-br from-brand-800 to-brand-950 flex items-center justify-center">
            <span className="text-sm font-bold text-accent-300 font-serif">TW</span>
          </div>
          <p className="text-sm text-text-muted">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="min-h-dvh gradient-hero flex items-center justify-center px-6">
        <div className="w-full max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent-100">
            <span className="text-2xl">✦</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-white sm:text-4xl">
            Premium Access Required
          </h1>
          <p className="mt-4 text-lg text-white/70">
            Upgrade your account to unlock the full TruthWell experience — all themes, journal, audio, and more.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-xl gradient-accent px-8 py-3 text-sm font-bold text-brand-900 shadow-lg transition-all hover:scale-105"
            >
              Upgrade to Premium — $4.99/mo
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
            <a href="/" className="text-sm text-white/60 hover:text-white transition-colors">
              Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-surface-warm">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur-md" style={{ borderColor: "rgba(245, 158, 11, 0.15)" }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <a href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-800 to-brand-950">
              <span className="text-sm font-bold text-accent-300 font-serif">TW</span>
            </div>
            <span className="text-lg font-bold text-brand-800">TruthWell</span>
            <span className="rounded-full bg-accent-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-700">Premium</span>
          </a>
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-muted hidden sm:inline">Hi, {userName}</span>
            <a href="/" className="text-sm text-text-secondary hover:text-brand-700 transition-colors">Home</a>
            <button
              onClick={() => { clearSession(); fetch("/api/logout", { method: "POST" }).catch(() => {}); window.location.href = "/"; }}
              className="text-sm text-text-secondary hover:text-brand-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Sidebar + Content */}
      <div className="mx-auto flex max-w-7xl px-6 py-8 gap-8">
        {/* Sidebar */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="space-y-1 sticky top-24">
            {[
              { href: "/dashboard", label: "Overview", icon: "◈" },
              { href: "/dashboard/themes", label: "Theme Library", icon: "☦" },
              { href: "/dashboard/journal", label: "My Journal", icon: "♰" },
              { href: "/dashboard/audio", label: "Audio", icon: "♪" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all hover:bg-accent-50 hover:text-accent-700"
                style={{
                  color: typeof window !== "undefined" && window.location.pathname === item.href ? "#d97706" : undefined,
                  backgroundColor: typeof window !== "undefined" && window.location.pathname === item.href ? "rgba(245,158,11,0.08)" : undefined,
                }}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </a>
            ))}
          </nav>

          {/* Premium badge */}
          <div className="mt-8 rounded-xl border p-4 text-center" style={{ borderColor: "rgba(245,158,11,0.2)", background: "rgba(245,158,11,0.04)" }}>
            <span className="text-lg">✦</span>
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-accent-600">Premium Member</p>
            <p className="mt-1 text-[10px] text-text-muted">All features unlocked</p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white/95 backdrop-blur-md lg:hidden" style={{ borderColor: "rgba(245,158,11,0.15)" }}>
        <div className="flex items-center justify-around px-2 py-2">
          {[
            { href: "/dashboard", label: "Home", icon: "◈" },
            { href: "/dashboard/themes", label: "Themes", icon: "☦" },
            { href: "/dashboard/journal", label: "Journal", icon: "♰" },
            { href: "/dashboard/audio", label: "Audio", icon: "♪" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium text-text-muted hover:text-accent-600 transition-colors"
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </div>
      </nav>
    </div>
  );
}