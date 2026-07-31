import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getDailyVerse, getThemePreviews, type Theme } from "~/lib/verses";
import { useState, useEffect } from "react";
import { validateSession } from "~/lib/session";

const getDashboardData = createServerFn({ method: "GET" }).handler(async () => {
  const dailyVerse = getDailyVerse();
  const themePreviews = getThemePreviews();
  return { dailyVerse, themePreviews };
});

const getEntryCount = createServerFn({ method: "POST" })
  .validator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    const { getJournalEntries } = await import("~/lib/journal.server");
    const entries = await getJournalEntries(userId);
    return { count: entries.length };
  });

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
  loader: async () => getDashboardData(),
});

function DashboardHome() {
  const { dailyVerse, themePreviews } = Route.useLoaderData();
  const [entryCount, setEntryCount] = useState(0);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    validateSession().then((s) => {
      if (s.valid && s.user) {
        setUserName(s.user.name);
        getEntryCount({ data: s.user.id }).then(r => setEntryCount(r.count)).catch(() => {});
      }
    });
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-brand-900 sm:text-3xl">
          Welcome{userName ? `, ${userName}` : ""}
        </h1>
        <p className="mt-1 text-text-secondary">Here's your daily overview</p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-5 shadow-sm" style={{ borderColor: "rgba(245,158,11,0.15)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-600">Themes</p>
          <p className="mt-1 font-serif text-3xl font-bold text-brand-900">{themePreviews.length}</p>
          <p className="text-xs text-text-muted">All unlocked</p>
        </div>
        <div className="rounded-xl border border-brand-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Journal</p>
          <p className="mt-1 font-serif text-3xl font-bold text-brand-900">{entryCount}</p>
          <p className="text-xs text-text-muted">Entries saved</p>
        </div>
        <div className="rounded-xl border border-brand-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Daily Verse</p>
          <p className="mt-1 font-serif text-3xl font-bold text-brand-900">{dailyVerse.themes[0]}</p>
          <p className="text-xs text-text-muted">Today's theme</p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-muted">Today's Verse</h2>
        <div className="verse-card">
          <div className="relative z-10">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-accent-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-700">✦ Premium</span>
              <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">{dailyVerse.themes.join(" · ")}</span>
            </div>
            <p className="text-xl font-medium italic leading-relaxed text-text-scripture scripture-text sm:text-2xl">
              "{dailyVerse.text}"
            </p>
            <div className="mt-4 flex items-center justify-between border-t pt-3" style={{ borderColor: "rgba(99,102,241,0.1)" }}>
              <p className="text-sm font-semibold text-brand-700">{dailyVerse.reference}</p>
              <a href="/dashboard/journal" className="text-xs font-medium text-accent-600 hover:text-accent-700 transition-colors">+ Save to Journal</a>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-muted">Quick Access</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <a href="/dashboard/themes" className="group rounded-xl border bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md" style={{ borderColor: "rgba(245,158,11,0.15)" }}>
            <span className="text-2xl">☦</span>
            <h3 className="mt-2 font-serif text-lg font-bold text-brand-900">Theme Library</h3>
            <p className="mt-1 text-xs text-text-secondary">Browse all 80 verses</p>
          </a>
          <a href="/dashboard/journal" className="group rounded-xl border bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md" style={{ borderColor: "rgba(245,158,11,0.15)" }}>
            <span className="text-2xl">♰</span>
            <h3 className="mt-2 font-serif text-lg font-bold text-brand-900">My Journal</h3>
            <p className="mt-1 text-xs text-text-secondary">Reflect and remember</p>
          </a>
          <a href="/dashboard/audio" className="group rounded-xl border bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md" style={{ borderColor: "rgba(245,158,11,0.15)" }}>
            <span className="text-2xl">♪</span>
            <h3 className="mt-2 font-serif text-lg font-bold text-brand-900">Audio</h3>
            <p className="mt-1 text-xs text-text-secondary">Listen to Scripture</p>
          </a>
        </div>
      </div>
    </div>
  );
}