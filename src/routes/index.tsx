import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { readFile } from "node:fs/promises";
import { useState, useEffect } from "react";
import { getDailyVerse, getThemePreviews, type Theme } from "~/lib/verses";
import { getSessionToken, clearSession, validateSession } from "~/lib/session";

// Server function to get business name
const getBusinessName = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const cfg = JSON.parse(await readFile("site.json", "utf8")) as {
      businessName?: string;
    };
    return cfg.businessName?.trim() ?? "";
  } catch {
    return "";
  }
});

// Server function to get today's verse
const getTodaysVerse = createServerFn({ method: "GET" }).handler(async () => {
  return getDailyVerse();
});

// Server function to get theme previews
const getThemePreviewsData = createServerFn({ method: "GET" }).handler(async () => {
  return getThemePreviews();
});

export const Route = createFileRoute("/")({
  loader: async () => {
    const [name, dailyVerse, themePreviews] = await Promise.all([
      getBusinessName(),
      getTodaysVerse(),
      getThemePreviewsData(),
    ]);
    return { name, dailyVerse, themePreviews };
  },
  component: Home,
});

function Home() {
  const { name, dailyVerse, themePreviews } = Route.useLoaderData();
  const primaryTheme = dailyVerse.themes[0] || "Faith";
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    validateSession().then((session) => {
      if (session.valid && session.user) {
        setLoggedIn(true);
        setUserName(session.user.name);
      }
    });
  }, []);

  const handleLogout = () => {
    clearSession();
    fetch("/api/logout", { method: "POST" }).catch(() => {});
    setLoggedIn(false);
    window.location.href = "/";
  };

  const scrollTo = (id: string) => {
    if (typeof document !== "undefined") {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-dvh bg-white">
      {/* ─── Navigation ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-800 to-brand-950">
              <span className="text-sm font-bold text-accent-300 font-serif">TW</span>
            </div>
            <span className="text-xl font-bold text-brand-800">{name}</span>
          </div>
          <div className="hidden items-center gap-6 sm:flex">
            <button onClick={() => scrollTo("features")} className="text-sm font-medium text-text-secondary hover:text-brand-700 transition-colors">
              Features
            </button>
            <button onClick={() => scrollTo("daily-verse")} className="text-sm font-medium text-text-secondary hover:text-brand-700 transition-colors">
              Today's Verse
            </button>
            <a href="/themes" className="text-sm font-medium text-text-secondary hover:text-brand-700 transition-colors">
              Themes
            </a>
            {loggedIn ? (
              <>
                <span className="text-sm text-text-muted">Hi, {userName}</span>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-text-secondary hover:text-brand-700 transition-colors"
                >
                  Sign Out
                </button>
                <a
                  href="/themes"
                  className="rounded-lg bg-brand-700 px-5 py-2 text-sm font-medium text-white hover:bg-brand-800 transition-colors"
                >
                  My Dashboard
                </a>
              </>
            ) : (
              <>
                <button onClick={() => scrollTo("pricing")} className="text-sm font-medium text-text-secondary hover:text-brand-700 transition-colors">
                  Pricing
                </button>
                <a
                  href="/signup"
                  className="rounded-lg bg-brand-700 px-5 py-2 text-sm font-medium text-white hover:bg-brand-800 transition-colors"
                >
                  Get Started Free
                </a>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden gradient-hero pt-24">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='white' fill-opacity='0.1'/%3E%3C/svg%3E")`,
            backgroundSize: "60px 60px",
          }}
        />
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-accent-400/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-brand-300/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-16 sm:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-medium text-white/80">Coming to life — join the waitlist</span>
            </div>
            <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
              Daily Scripture,{" "}
              <span className="bg-gradient-to-r from-accent-300 to-accent-400 bg-clip-text text-transparent">
                Peacefully Delivered
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/70 sm:text-xl">
              A curated, ad-free library of Bible verses organized by theme, season,
              and life circumstance. No noise. No distractions. Just Scripture and space to reflect.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 rounded-xl gradient-accent px-8 py-3.5 text-base font-semibold text-brand-900 shadow-lg shadow-accent-500/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-accent-500/30"
              >
                Start Your Free Trial
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              <button
                onClick={() => scrollTo("daily-verse")}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-8 py-3.5 text-base font-medium text-white/80 transition-all hover:border-white/40 hover:text-white"
              >
                Read Today's Verse
              </button>
            </div>
            <p className="mt-6 text-sm text-white/40">No credit card required • Free tier available • Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* ─── Features Section ─── */}
      <section id="features" className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold text-accent-600">Everything you need</h2>
            <p className="mt-2 font-serif text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
              Deepen Your Walk with Scripture
            </p>
            <p className="mt-4 text-lg text-text-secondary">
              TruthWell is designed to help you engage with God's Word in a way that fits your life.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="card-hover group rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700 group-hover:bg-brand-100 transition-colors">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-brand-800">Daily Verse</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                A fresh Scripture verse every day with a thoughtful reflection prompt and devotional to start your morning or end your evening.
              </p>
            </div>

            <div className="card-hover group rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700 group-hover:bg-brand-100 transition-colors">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-brand-800">Themed Collections</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                Browse verses by 15 themes — faith, hope, love, peace, joy, strength, healing, gratitude, courage, comfort, and more.
              </p>
            </div>

            <div className="card-hover group rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700 group-hover:bg-brand-100 transition-colors">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-brand-800">Audio Readings</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                Listen to Scripture read aloud. Perfect for your commute, morning walk, or winding down at night.
              </p>
            </div>

            <div className="card-hover group rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700 group-hover:bg-brand-100 transition-colors">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-brand-800">Personal Journal</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                Capture reflections, prayers, and insights alongside each day's verse. Your private spiritual companion.
              </p>
            </div>

            <div className="card-hover group rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700 group-hover:bg-brand-100 transition-colors">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-brand-800">Life Circumstances</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                Verses for grief, anxiety, celebration, decision-making, marriage, parenting, and every season of life.
              </p>
            </div>

            <div className="card-hover group rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700 group-hover:bg-brand-100 transition-colors">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-brand-800">Offline Access</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                Download verses and audio for offline reading and listening. Your Scripture is always with you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Today's Verse Section ─── */}
      <section id="daily-verse" className="bg-surface-subtle/50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-base font-semibold text-accent-600">Today's Verse</h2>
            <p className="mt-2 font-serif text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
              A Word for You Today
            </p>
            <p className="mt-4 text-lg text-text-secondary">
              Start each day with Scripture that speaks to your heart. Here's today's verse — a free preview of what TruthWell offers.
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-2xl">
            <div className="verse-card">
              <div className="relative z-10">
                <p className="text-xl font-medium italic leading-relaxed text-text-scripture scripture-text sm:text-2xl">
                  "{dailyVerse.text}"
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-4">
                  <div>
                    <p className="font-semibold text-brand-700">{dailyVerse.reference}</p>
                  </div>
                  <span className="rounded-full bg-accent-100 px-3 py-1 text-xs font-medium capitalize text-accent-700">
                    {primaryTheme}
                  </span>
                </div>
                {dailyVerse.prompt && (
                  <div className="mt-4 rounded-xl bg-brand-50 p-4">
                    <p className="text-sm font-medium text-brand-800">
                      <span className="text-accent-600">Reflect: </span>
                      {dailyVerse.prompt}
                    </p>
                  </div>
                )}
                {dailyVerse.devotional && (
                  <div className="mt-3 rounded-xl border border-brand-100 bg-white p-4">
                    <p className="text-xs leading-relaxed text-text-secondary">
                      {dailyVerse.devotional}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-text-muted">
                Want more? Unlock all 15 themes, audio readings, and your personal journal with{' '}
                <a href="#pricing" className="font-medium text-brand-700 hover:text-brand-800 underline">
                  TruthWell Premium
                </a>
                .
              </p>
            </div>
          </div>

          {/* Theme preview grid */}
          <div className="mx-auto mt-16 max-w-5xl">
            <h3 className="mb-8 text-center font-serif text-2xl font-bold text-brand-800">
              Browse by Theme
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {themePreviews.map(({ theme, verses }) => (
                <div
                  key={theme}
                  className="group rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                >
                  <h4 className="text-sm font-semibold capitalize text-brand-800">{theme}</h4>
                  <p className="mt-2 text-xs italic leading-relaxed text-text-secondary scripture-text line-clamp-2">
                    "{verses[0]?.text.slice(0, 80)}..."
                  </p>
                  <p className="mt-1 text-xs text-text-muted">{verses.length} verses</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Pricing Section ─── */}
      <section id="pricing" className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold text-accent-600">Simple, Transparent Pricing</h2>
            <p className="mt-2 font-serif text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
              Choose the Plan That Fits Your Walk
            </p>
            <p className="mt-4 text-lg text-text-secondary">
              Start free. Upgrade when you're ready to go deeper.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-8 lg:grid-cols-2">
            {/* Free Tier */}
            <div className="relative rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-brand-800">Free</h3>
                <p className="mt-1 text-sm text-text-secondary">For daily readers who want a simple start</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-brand-900">$0</span>
                <span className="text-sm text-text-muted">/month</span>
              </div>
              <ul className="mb-8 space-y-3">
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-text-secondary">Daily verse with reflection prompt</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-text-secondary">Browse limited themes</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-text-secondary">Ad-free experience</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-text-secondary">Shareable verse cards</span>
                </li>
                <li className="flex items-start gap-3 text-gray-300">
                  <svg className="mt-0.5 h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-sm">All 15 theme collections</span>
                </li>
                <li className="flex items-start gap-3 text-gray-300">
                  <svg className="mt-0.5 h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-sm">Audio readings</span>
                </li>
                <li className="flex items-start gap-3 text-gray-300">
                  <svg className="mt-0.5 h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-sm">Personal journal</span>
                </li>
                <li className="flex items-start gap-3 text-gray-300">
                  <svg className="mt-0.5 h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-sm">Offline access</span>
                </li>
              </ul>
              <a
                href="#signup"
                className="block w-full rounded-xl border-2 border-brand-200 py-3 text-center text-sm font-semibold text-brand-700 transition-all hover:border-brand-300 hover:bg-brand-50"
              >
                Get Started Free
              </a>
            </div>

            {/* Premium Tier */}
            <div className="relative rounded-2xl border-2 border-accent-400 bg-white p-8 shadow-xl shadow-accent-200/50">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex rounded-full gradient-accent px-4 py-1 text-xs font-bold uppercase tracking-wider text-brand-900">
                  Most Popular
                </span>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-brand-800">Premium</h3>
                <p className="mt-1 text-sm text-text-secondary">For those ready to go deeper in Scripture</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-brand-900">$4.99</span>
                <span className="text-sm text-text-muted">/month</span>
                <p className="mt-1 text-sm text-text-muted">
                  or <span className="font-semibold text-brand-700">$49/year</span> (save 18%)
                </p>
              </div>
              <ul className="mb-8 space-y-3">
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-text-secondary">Daily verse + devotional</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-text-secondary">All 15 theme collections (80+ verses)</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-text-secondary">Audio readings</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-text-secondary">Personal verse journal</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-text-secondary">Offline access</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-text-secondary">Weekly emailed devotionals</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-text-secondary">Shareable verse cards</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-text-secondary">Ad-free experience</span>
                </li>
              </ul>
              <div className="space-y-3">
                <a
                  href="https://buy.stripe.com/6oU9ASdQh2Bw9LO1vR8EM0i"
                  className="block w-full rounded-xl gradient-accent py-3 text-center text-sm font-bold text-brand-900 shadow-lg shadow-accent-300/50 transition-all hover:scale-[1.02] hover:shadow-xl"
                >
                  Subscribe Monthly — $4.99/mo
                </a>
                <a
                  href="https://buy.stripe.com/cNicN43bDcc63nq3DZ8EM0j"
                  className="block w-full rounded-xl border-2 border-accent-300 bg-white py-3 text-center text-sm font-semibold text-brand-800 transition-all hover:border-accent-400 hover:bg-accent-50"
                >
                  Subscribe Annually — $49/yr (save 18%)
                </a>
              </div>
              <p className="mt-3 text-center text-xs text-text-muted">
                Cancel anytime. No questions asked.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="bg-surface-subtle/30 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold text-accent-600">Loved by Readers</h2>
            <p className="mt-2 font-serif text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
              What Our Members Say
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: "Sarah M.",
                text: "TruthWell has become my daily morning anchor. The reflection prompts help me actually apply Scripture, not just read it.",
              },
              {
                name: "David K.",
                text: "The themed collections are incredible. When I was walking through grief, I found exactly the verses I needed. It felt like God speaking directly to me.",
              },
              {
                name: "Pastor Michael R.",
                text: "I love that there are no ads or distractions. Just Scripture and space to reflect. The audio readings are perfect for my commute.",
              },
            ].map((testimonial, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-1 text-accent-500">
                  {[...Array(5)].map((_, s) => (
                    <svg key={s} className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-text-secondary">"{testimonial.text}"</p>
                <div className="mt-4 border-t border-gray-100 pt-3">
                  <p className="text-sm font-semibold text-brand-800">{testimonial.name}</p>
                  <p className="text-xs text-text-muted">Member since 2025</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section id="signup" className="gradient-hero py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-serif text-3xl font-bold text-white sm:text-4xl">
            Ready to Deepen Your Daily Walk?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/70">
            Join TruthWell and receive daily Scripture that speaks to your life. Start your free trial today.
          </p>

          <div className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm text-white placeholder-white/40 outline-none backdrop-blur-sm focus:border-accent-400 focus:ring-1 focus:ring-accent-400"
            />
            <button className="rounded-xl gradient-accent px-6 py-3 text-sm font-bold text-brand-900 shadow-lg shadow-accent-500/25 transition-all hover:scale-105">
              Get Started Free
            </button>
          </div>
          <p className="mt-4 text-xs text-white/40">
            No credit card required. Start your free trial. Cancel anytime.
          </p>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-brand-950 py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-8 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-700 to-brand-900">
                <span className="text-sm font-bold text-accent-300 font-serif">TW</span>
              </div>
              <span className="text-lg font-bold text-white">{name}</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-white/50">
              <a href="#" className="hover:text-white transition-colors">About</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>
          </div>
          <div className="mt-8 border-t border-white/10 pt-8 text-center">
            <p className="text-xs text-white/30">
              &copy; {new Date().getFullYear()} {name}. All rights reserved. Scripture quotations from the NIV and ESV.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}