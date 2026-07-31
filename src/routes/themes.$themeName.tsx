import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getVersesByTheme, allVerses, type Theme } from "~/lib/verses";
import { useState, useEffect } from "react";
import { validateSession } from "~/lib/session";

const getThemeData = createServerFn({ method: "GET" })
  .validator((theme: string) => theme)
  .handler(async ({ data: themeName }) => {
    const normalized = themeName.charAt(0).toUpperCase() + themeName.slice(1).toLowerCase();
    const themes = ["Faith", "Hope", "Love", "Peace", "Joy", "Wisdom", "Strength", "Healing", "Gratitude", "Forgiveness", "Courage", "Comfort", "Guidance", "Patience", "Trust"];
    const theme = themes.find((t) => t.toLowerCase() === themeName.toLowerCase());
    if (!theme) return null;
    const verses = getVersesByTheme(theme as Theme);
    return { theme, verses };
  });

export const Route = createFileRoute("/themes/$themeName")({
  component: SingleThemePage,
  loader: async ({ params }) => {
    const data = await getThemeData({ data: params.themeName });
    if (!data) throw notFound();
    return data;
  },
});

function SingleThemePage() {
  const { theme, verses } = Route.useLoaderData();
  const [isPremium, setIsPremium] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    validateSession().then((session) => {
      setLoggedIn(session.valid);
      setIsPremium(session.valid && session.user?.isPremium === true);
    });
  }, []);

  return (
    <div className="min-h-dvh bg-white">
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-800 to-brand-950">
              <span className="text-sm font-bold text-accent-300 font-serif">TW</span>
            </div>
            <span className="text-xl font-bold text-brand-800">TruthWell</span>
          </a>
          <a href="/themes" className="text-sm font-medium text-text-secondary hover:text-brand-700 transition-colors">← All Themes</a>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <div className="mb-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700">
            <span className="h-2 w-2 rounded-full bg-brand-400" />Theme
          </span>
          <h1 className="mt-4 font-serif text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">{theme}</h1>
          <p className="mt-3 text-text-secondary">{verses.length} {verses.length === 1 ? "verse" : "verses"} in this collection</p>
        </div>

        <div className="space-y-6">
          {verses.map((verse, idx) => {
            const isGated = idx >= 2 && !isPremium;
            return (
              <div key={verse.id} className={"relative rounded-2xl border p-6 transition-all " + (isGated ? "border-gray-200 bg-gray-50/50 opacity-70" : "border-brand-100 bg-white shadow-sm hover:shadow-md")}>
                {isGated && (
                  <div className="absolute right-4 top-4 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                    <span className="flex items-center gap-1">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      Premium
                    </span>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-medium italic leading-relaxed text-text-scripture scripture-text sm:text-xl">"{verse.text}"</p>
                    <div className="mt-3 flex items-center gap-3 flex-wrap">
                      <p className="text-sm font-semibold text-brand-700">{verse.reference}</p>
                    </div>
                    {!isGated && verse.prompt && (
                      <div className="mt-4 rounded-xl bg-brand-50 p-4">
                        <p className="text-sm font-medium text-brand-800"><span className="text-accent-600">Reflect: </span>{verse.prompt}</p>
                      </div>
                    )}
                    {!isGated && verse.devotional && (
                      <div className="mt-3 rounded-xl border border-brand-100 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-brand-500 mb-2">Devotional</p>
                        <p className="text-sm leading-relaxed text-text-secondary">{verse.devotional}</p>
                      </div>
                    )}
                    {isGated && (
                      <div className="mt-4 rounded-xl bg-brand-950/5 p-4 text-center">
                        <p className="text-sm text-text-muted"><span className="font-medium text-brand-700">Unlock this devotional</span> with TruthWell Premium</p>
                        <a href={loggedIn ? "/pricing" : "/signup"} className="mt-2 inline-block rounded-lg gradient-accent px-5 py-2 text-xs font-bold text-brand-900">
                          {loggedIn ? "Upgrade to Premium" : "Sign Up Free"}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!isPremium && (
          <div className="mt-12 text-center rounded-2xl border-2 border-accent-200 bg-gradient-to-br from-accent-50 to-white p-8 shadow-sm">
            <h2 className="font-serif text-2xl font-bold text-brand-900">Premium Access</h2>
            <p className="mt-3 text-text-secondary">Upgrade to Premium for full access to all verses, devotionals, audio, and journal.</p>
            <a href={loggedIn ? "/pricing" : "/signup"} className="mt-6 inline-flex items-center gap-2 rounded-xl gradient-accent px-8 py-3 text-sm font-bold text-brand-900 shadow-lg transition-all hover:scale-105">
              {loggedIn ? "Upgrade Now" : "Start Free Trial"}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
