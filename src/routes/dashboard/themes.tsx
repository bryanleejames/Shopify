import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getAllThemes, getVersesByTheme, type Theme, allVerses } from "~/lib/verses";
import { useState } from "react";

const getThemeLibraryData = createServerFn({ method: "GET" }).handler(async () => {
  const themes = getAllThemes();
  return themes.map((t) => ({
    theme: t,
    count: getVersesByTheme(t).length,
    preview: getVersesByTheme(t)[0]?.text.slice(0, 100) || "",
    verses: getVersesByTheme(t),
  }));
});

export const Route = createFileRoute("/dashboard/themes")({
  component: DashboardThemes,
  loader: async () => getThemeLibraryData(),
});

const themeColors: Record<string, { accent: string; bg: string }> = {
  Faith: { accent: "#3b82f6", bg: "#3b82f608" },
  Hope: { accent: "#f59e0b", bg: "#f59e0b08" },
  Love: { accent: "#ec4899", bg: "#ec489908" },
  Peace: { accent: "#6366f1", bg: "#6366f108" },
  Joy: { accent: "#fbbf24", bg: "#fbbf2408" },
  Wisdom: { accent: "#8b5cf6", bg: "#8b5cf608" },
  Strength: { accent: "#ef4444", bg: "#ef444408" },
  Healing: { accent: "#10b981", bg: "#10b98108" },
  Gratitude: { accent: "#14b8a6", bg: "#14b8a608" },
  Forgiveness: { accent: "#a855f7", bg: "#a855f708" },
  Courage: { accent: "#f97316", bg: "#f9731608" },
  Comfort: { accent: "#64748b", bg: "#64748b08" },
  Guidance: { accent: "#06b6d4", bg: "#06b6d408" },
  Patience: { accent: "#84cc16", bg: "#84cc1608" },
  Trust: { accent: "#0ea5e9", bg: "#0ea5e908" },
};

const themeIcons: Record<string, string> = {
  Faith: "☦", Hope: "⚓", Love: "♥", Peace: "☮", Joy: "★",
  Wisdom: "🕊", Strength: "⬟", Healing: "✚", Gratitude: "♰",
  Forgiveness: "∞", Courage: "▲", Comfort: "⊹", Guidance: "⌾",
  Patience: "◈", Trust: "✦",
};

const themeDescriptions: Record<string, string> = {
  Faith: "Verses to strengthen your trust in God",
  Hope: "Scripture for enduring with confidence",
  Love: "God's love and our call to love others",
  Peace: "Finding rest and calm in God's presence",
  Joy: "Rejoicing in the Lord always",
  Wisdom: "Biblical insight for daily decisions",
  Strength: "God's power made perfect in weakness",
  Healing: "Restoration for body, mind, and spirit",
  Gratitude: "A heart of thankfulness to God",
  Forgiveness: "Receiving and extending grace",
  Courage: "Bravery through faith in God",
  Comfort: "God's solace in times of sorrow",
  Guidance: "Direction for life's journey",
  Patience: "Waiting on the Lord with hope",
  Trust: "Confidence in God's character",
};

function DashboardThemes() {
  const themes = Route.useLoaderData();
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [expandedVerse, setExpandedVerse] = useState<string | null>(null);

  const currentTheme = selectedTheme
    ? themes.find((t) => t.theme === selectedTheme)
    : null;

  if (selectedTheme && currentTheme) {
    const color = themeColors[selectedTheme] || { accent: "#6366f1", bg: "#6366f108" };
    const icon = themeIcons[selectedTheme] || "✦";
    const desc = themeDescriptions[selectedTheme] || "";

    return (
      <div>
        <button
          onClick={() => { setSelectedTheme(null); setExpandedVerse(null); }}
          className="mb-6 flex items-center gap-1 text-sm text-text-secondary hover:text-brand-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to all themes
        </button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl" style={{ backgroundColor: `${color.accent}15` }}>
              {icon}
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-brand-900">{selectedTheme}</h2>
              <p className="text-sm text-text-secondary">{desc}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-text-muted">{currentTheme.count} verses</span>
            <span className="rounded-full bg-accent-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-700">✦ Premium</span>
          </div>
        </div>

        <div className="space-y-4">
          {currentTheme.verses.map((verse) => {
            const isExpanded = expandedVerse === verse.id;
            return (
              <div
                key={verse.id}
                className="rounded-xl border bg-white p-5 shadow-sm transition-all cursor-pointer"
                style={{ borderColor: isExpanded ? `${color.accent}30` : "rgba(0,0,0,0.08)" }}
                onClick={() => setExpandedVerse(isExpanded ? null : verse.id)}
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold" style={{ backgroundColor: `${color.accent}15`, color: color.accent }}>
                    {currentTheme.verses.indexOf(verse) + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium italic leading-relaxed text-text-scripture scripture-text">
                      "{verse.text}"
                    </p>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-semibold text-brand-700">{verse.reference}</p>
                      {verse.themes.filter(t => t !== selectedTheme).map(t => (
                        <span key={t} className="rounded-full bg-accent-50 px-2 py-0.5 text-[10px] font-medium text-accent-700">{t}</span>
                      ))}
                    </div>

                    {isExpanded && (
                      <div className="mt-4 space-y-3 border-t pt-3" style={{ borderColor: "rgba(99,102,241,0.1)" }}>
                        {verse.prompt && (
                          <div className="rounded-lg bg-brand-50 p-3">
                            <p className="text-xs font-semibold text-accent-600 uppercase tracking-wider mb-1">Reflect</p>
                            <p className="text-sm text-brand-800">{verse.prompt}</p>
                          </div>
                        )}
                        {verse.devotional && (
                          <div className="rounded-lg border bg-white p-3" style={{ borderColor: "rgba(99,102,241,0.08)" }}>
                            <p className="text-xs font-semibold text-brand-500 uppercase tracking-wider mb-1">Devotional</p>
                            <p className="text-sm text-text-secondary">{verse.devotional}</p>
                          </div>
                        )}
                        <a
                          href={`/dashboard/journal?verse=${encodeURIComponent(verse.id)}&ref=${encodeURIComponent(verse.reference)}&text=${encodeURIComponent(verse.text)}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-accent-600 hover:text-accent-700 transition-colors"
                        >
                          + Save to Journal
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Theme grid view
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-brand-900 sm:text-3xl">Theme Library</h1>
        <p className="mt-1 text-text-secondary">All 15 themes unlocked. Click any theme to explore.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {themes.map(({ theme, count, preview }) => {
          const color = themeColors[theme] || { accent: "#6366f1", bg: "#6366f108" };
          const icon = themeIcons[theme] || "✦";
          const desc = themeDescriptions[theme] || "";

          return (
            <div
              key={theme}
              onClick={() => setSelectedTheme(theme)}
              className="group relative rounded-xl p-6 transition-all duration-300 cursor-pointer hover:-translate-y-1"
              style={{
                background: `linear-gradient(135deg, ${color.accent}08, ${color.accent}03)`,
                border: `1px solid ${color.accent}20`,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 12px 40px ${color.accent}20`; e.currentTarget.style.borderColor = `${color.accent}40`; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = ""; e.currentTarget.style.borderColor = `${color.accent}20`; }}
            >
              <div className="absolute top-0 right-0 w-12 h-12 rounded-tr-xl opacity-40"
                style={{ background: "linear-gradient(135deg, transparent 50%, #f59e0b 50%)" }}
              />
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl mb-4"
                style={{ backgroundColor: `${color.accent}15` }}
              >
                {icon}
              </div>
              <h3 className="font-serif text-xl font-bold mb-1 text-brand-900">{theme}</h3>
              <p className="text-sm text-text-secondary mb-3 leading-relaxed">{desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-muted">{count} verses</span>
                <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: "#f59e0b" }}>✦ Premium</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}