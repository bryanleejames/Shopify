/**
 * PremiumDashboardConcept
 *
 * Visual design concept components for TruthWell's premium dashboard.
 * These demonstrate the premium look and feel — gold accents,
 * glassmorphism, elegant typography.
 *
 * These are design prototypes, not production-ready pages.
 * The full-stack engineer will build actual routes from these specs.
 */
// Verse interface matching the data structure in verses.json
interface Verse {
  id: string;
  reference: string;
  text: string;
  themes: string[];
  prompt: string;
  devotional: string;
}

/* ---------- Premium Theme Card ---------- */
interface ThemeCardProps {
  name: string;
  description: string;
  verseCount: number;
  accentColor: string;
  icon: string;
}

const themeIcons: Record<string, string> = {
  Faith: "☦",
  Hope: "⚓",
  Love: "♥",
  Peace: "☮",
  Joy: "★",
  Wisdom: "🕊",
  Strength: "⬟",
  Healing: "✚",
  Gratitude: "♰",
  Forgiveness: "∞",
  Courage: "▲",
  Comfort: "⊹",
  Guidance: "⌾",
  Patience: "◈",
};

export function PremiumThemeCard({
  name,
  description,
  verseCount,
  accentColor,
}: ThemeCardProps) {
  return (
    <div
      className="group relative rounded-xl p-6 transition-all duration-500 cursor-pointer"
      style={{
        background: `linear-gradient(135deg, ${accentColor}08, ${accentColor}03)`,
        border: `1px solid ${accentColor}20`,
        boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = `0 12px 40px ${accentColor}20`;
        e.currentTarget.style.borderColor = `${accentColor}40`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.04)";
        e.currentTarget.style.borderColor = `${accentColor}20`;
      }}
    >
      {/* Premium gold corner accent */}
      <div
        className="absolute top-0 right-0 w-12 h-12 rounded-tr-xl opacity-40"
        style={{
          background: "linear-gradient(135deg, transparent 50%, #f59e0b 50%)",
        }}
      />

      {/* Icon */}
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4"
        style={{ backgroundColor: `${accentColor}15` }}
      >
        {themeIcons[name] || "✦"}
      </div>

      {/* Theme name */}
      <h3
        className="font-display text-xl font-bold mb-1.5"
        style={{ fontFamily: "'DM Serif Display', 'Georgia', serif" }}
      >
        {name}
      </h3>

      {/* Description */}
      <p className="text-sm text-[#6b6b80] dark:text-white/60 mb-3 leading-relaxed">
        {description}
      </p>

      {/* Verse count + premium badge */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#9ca3af] dark:text-white/40">
          {verseCount} verses
        </span>
        <span
          className="text-[10px] font-bold tracking-[0.12em] uppercase"
          style={{ color: "#f59e0b" }}
        >
          ✦ Premium
        </span>
      </div>
    </div>
  );
}

/* ---------- Premium Journal Entry ---------- */
export function PremiumJournalEntry({ verse, date }: { verse: Verse; date: string }) {
  return (
    <div className="relative mb-6">
      {/* Ornamental divider */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.3), transparent)" }} />
        <span className="text-[#f59e0b]/40 text-sm">✦</span>
        <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.3), transparent)" }} />
      </div>

      {/* Entry card with glassmorphism */}
      <div
        className="relative rounded-xl p-6 backdrop-blur-sm"
        style={{
          background: "rgba(255, 255, 255, 0.75)",
          border: "1px solid rgba(99, 102, 241, 0.1)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
        }}
      >
        {/* Date */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-[#9ca3af]">{date}</span>
          <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#f59e0b]">✦ Journal</span>
        </div>

        {/* Verse reference */}
        <p className="text-xs font-semibold tracking-wide uppercase text-[#6366f1] mb-2">
          {verse.reference}
        </p>

        {/* Verse text */}
        <p
          className="font-serif text-base italic leading-relaxed text-[#312e81] mb-4"
          style={{ fontFamily: "'Georgia', 'Palatino Linotype', serif" }}
        >
          "{verse.text}"
        </p>

        {/* Journal text area */}
        <div className="border-t border-[#6366f1]/10 pt-4">
          <p className="text-sm text-[#4b5563] leading-relaxed">
            <span className="font-medium text-[#1a1a2e]">My reflection:</span>{" "}
            {verse.prompt}
          </p>
          <p className="mt-2 text-xs text-[#9ca3af] italic">
            — prompted by TruthWell
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Premium Audio Player Concept ---------- */
export function PremiumAudioPlayer() {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-xl px-6 py-3"
      style={{
        background: "rgba(15, 13, 46, 0.9)",
        borderColor: "rgba(245, 158, 11, 0.2)",
      }}
    >
      <div className="mx-auto max-w-6xl flex items-center gap-6">
        {/* Track info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
            style={{ background: "linear-gradient(135deg, #6366f1, #f59e0b)" }}
          >
            ♪
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">
              Psalm 23:4 — The Lord is My Shepherd
            </p>
            <p className="text-xs text-white/40">Narrated by TruthWell</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button className="text-white/60 hover:text-white transition-colors text-lg">⏮</button>
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-transform hover:scale-105"
            style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
          >
            ▶
          </button>
          <button className="text-white/60 hover:text-white transition-colors text-lg">⏭</button>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3 flex-1 max-w-xs">
          <span className="text-xs text-white/40 w-8 text-right">1:24</span>
          <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: "35%",
                background: "linear-gradient(90deg, #6366f1, #f59e0b)",
              }}
            />
          </div>
          <span className="text-xs text-white/40 w-8">3:45</span>
        </div>

        {/* Premium badge */}
        <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-[#f59e0b] flex-shrink-0">
          ✦ Premium Audio
        </span>
      </div>
    </div>
  );
}

/* ---------- Premium page header ---------- */
export function PremiumPageHeader({
  title,
  subtitle,
  isPremium,
}: {
  title: string;
  subtitle?: string;
  isPremium?: boolean;
}) {
  return (
    <div className="text-center mb-12">
      {isPremium && (
        <div className="flex justify-center mb-3">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.15em] uppercase"
            style={{
              background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))",
              color: "#f59e0b",
              border: "1px solid rgba(245,158,11,0.25)",
            }}
          >
            ✦ Premium Feature
          </span>
        </div>
      )}
      <h2
        className="text-3xl sm:text-4xl font-bold text-[#1a1a2e] dark:text-white mb-3"
        style={{ fontFamily: "'DM Serif Display', 'Georgia', serif" }}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="text-lg text-[#6b6b80] dark:text-white/60 max-w-xl mx-auto">
          {subtitle}
        </p>
      )}
      {/* Gold ornament divider */}
      <div className="flex items-center justify-center gap-3 mt-6">
        <div className="h-px w-12" style={{ background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.4))" }} />
        <span className="text-[#f59e0b]/40">✦</span>
        <div className="h-px w-12" style={{ background: "linear-gradient(90deg, rgba(245,158,11,0.4), transparent)" }} />
      </div>
    </div>
  );
}
