import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getAllThemes, getVersesByTheme, type Theme, allVerses } from "~/lib/verses";

const getThemesData = createServerFn({ method: "GET" }).handler(async () => {
  const themes = getAllThemes();
  return themes.map((t) => ({
    theme: t,
    count: getVersesByTheme(t).length,
    preview: getVersesByTheme(t)[0]?.text.slice(0, 100) || "",
  }));
});

export const Route = createFileRoute("/themes")({
  component: ThemesPage,
  loader: async () => {
    return getThemesData();
  },
});

function ThemesPage() {
  const themes = Route.useLoaderData();

  return (
    <div className="min-h-dvh bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-800 to-brand-950">
              <span className="text-sm font-bold text-accent-300 font-serif">TW</span>
            </div>
            <span className="text-xl font-bold text-brand-800">TruthWell</span>
          </a>
          <a href="/" className="text-sm font-medium text-text-secondary hover:text-brand-700 transition-colors">
            ← Back to Home
          </a>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
        <div className="text-center">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
            Browse Scripture by Theme
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-text-secondary">
            Explore our curated collection of 80 Bible verses organized across 15 themes.
            Each verse includes a reflection prompt and devotional to help you go deeper.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {themes.map(({ theme, count, preview }) => (
            <a
              key={theme}
              href={`/themes/${theme.toLowerCase()}`}
              className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md hover:border-brand-200"
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-brand-800">{theme}</h2>
                <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                  {count} {count === 1 ? "verse" : "verses"}
                </span>
              </div>
              <p className="text-xs italic leading-relaxed text-text-secondary scripture-text line-clamp-2">
                "{preview}..."
              </p>
              <div className="mt-4 flex items-center gap-1 text-sm font-medium text-brand-700 group-hover:text-brand-800 transition-colors">
                Browse {theme} verses
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}