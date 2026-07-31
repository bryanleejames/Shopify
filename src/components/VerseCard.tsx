// Verse type extracted from the verses JSON data structure
interface Verse {
  id: string;
  reference: string;
  text: string;
  themes: string[];
  prompt: string;
  devotional: string;
}

interface VerseCardProps {
  verse: Verse;
  size?: "social" | "inline";
  showPrompt?: boolean;
}

/**
 * The theme accent colors mapped from the design tokens.
 */
const themeAccents: Record<string, { bg: string; text: string; dot: string }> =
  {
    Faith: { bg: "from-[#3b82f6]/20 to-[#1e3a5f]", text: "#3b82f6", dot: "#3b82f6" },
    Hope: { bg: "from-[#f59e0b]/20 to-[#1e1b4b]", text: "#f59e0b", dot: "#f59e0b" },
    Peace: { bg: "from-[#6366f1]/20 to-[#1e1b4b]", text: "#aaaaff", dot: "#6366f1" },
    Joy: { bg: "from-[#fbbf24]/20 to-[#1e1b4b]", text: "#fbbf24", dot: "#fbbf24" },
    Love: { bg: "from-[#ec4899]/20 to-[#1e1b4b]", text: "#f9a8d4", dot: "#ec4899" },
    default: { bg: "from-[#6366f1]/20 to-[#0f0d2e]", text: "#c7d2fe", dot: "#6366f1" },
  };

/**
 * VerseCard
 *
 * A beautiful, shareable card displaying a Bible verse with theme treatment.
 * Designed for both inline display and Open Graph social sharing (1200x630).
 * Uses fixed dimensions with aspect-ratio for social card sizing.
 */
export function VerseCard({ verse, size = "inline", showPrompt = false }: VerseCardProps) {
  const theme = verse.themes[0] || "default";
  const accent = themeAccents[theme] || themeAccents.default;

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl border border-white/10
        ${size === "social" ? "w-[1200px] h-[630px]" : "w-full max-w-lg"}
        bg-gradient-to-br ${accent.bg}
        shadow-2xl
      `}
    >
      {/* Subtle background ambient glow */}
      <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-20 blur-3xl"
        style={{ background: `radial-gradient(circle, ${accent.dot}, transparent)` }}
      />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full opacity-10 blur-2xl"
        style={{ background: `radial-gradient(circle, ${accent.dot}, transparent)` }}
      />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center items-center h-full px-10 py-8 text-center">
        {/* Theme tag */}
        <div className="mb-4 sm:mb-5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
          style={{
            backgroundColor: `${accent.dot}15`,
            color: accent.text,
            border: `1px solid ${accent.dot}30`,
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent.dot }} />
          {verse.themes.join(" · ")}
        </div>

        {/* Verse ornament */}
        <div className="mb-3 sm:mb-4 text-white/20 font-serif text-2xl leading-none">✦</div>

        {/* Verse text */}
        <blockquote className="font-serif text-lg sm:text-xl md:text-2xl leading-relaxed text-white/95 max-w-lg font-light italic"
          style={{ fontFamily: "'Georgia', 'Palatino Linotype', serif" }}
        >
          "{verse.text}"
        </blockquote>

        {/* Reference */}
        <p className="mt-3 sm:mt-4 text-sm font-medium tracking-wide text-white/60">
          — {verse.reference}
        </p>

        {/* Optional reflective prompt */}
        {showPrompt && verse.prompt && (
          <div className="mt-4 pt-4 border-t border-white/10 max-w-md">
            <p className="text-xs text-white/40 italic">{verse.prompt}</p>
          </div>
        )}

        {/* TruthWell watermark */}
        <div className="absolute bottom-4 right-6 opacity-30">
          <span
            className="text-xs font-bold tracking-[0.15em] uppercase"
            style={{
              background: "linear-gradient(135deg, #6366f1, #f59e0b)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            TruthWell
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * VerseCardShare — an alternative layout optimized for tighter social card composition
 * with the verse text more prominent and the reference larger.
 */
export function VerseCardShare({ verse }: { verse: Verse }) {
  const theme = verse.themes[0] || "default";
  const accent = themeAccents[theme] || themeAccents.default;

  return (
    <div
      className="relative w-[1200px] h-[630px] overflow-hidden"
      style={{
        background: `linear-gradient(135deg, #0f0d2e 0%, #1e1b4b 50%, ${accent.dot}22 100%)`,
      }}
    >
      {/* Ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.12] blur-3xl"
        style={{ background: `radial-gradient(circle, ${accent.dot}, transparent)` }}
      />

      {/* Subtle gold accent line at top */}
      <div className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ background: "linear-gradient(90deg, transparent, #f59e0b66, transparent)" }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center h-full px-16 text-center">
        {/* Ornament */}
        <span className="text-[#f59e0b]/30 font-serif text-3xl mb-5">✦</span>

        {/* Verse */}
        <blockquote className="font-serif text-[28px] leading-[1.6] text-white/95 max-w-2xl font-light italic">
          "{verse.text}"
        </blockquote>

        <p className="mt-5 text-lg font-medium tracking-wide text-white/50">
          — {verse.reference}
        </p>

        {/* Theme badges */}
        <div className="mt-6 flex gap-2">
          {verse.themes.map((t) => {
            const a = themeAccents[t] || themeAccents.default;
            return (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]"
                style={{
                  backgroundColor: `${a.dot}15`,
                  color: a.text,
                  border: `1px solid ${a.dot}30`,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: a.dot }} />
                {t}
              </span>
            );
          })}
        </div>

        {/* Watermark */}
        <div className="absolute bottom-6 right-8">
          <span className="text-sm font-bold tracking-[0.2em] uppercase opacity-25"
            style={{
              background: "linear-gradient(135deg, #6366f1, #f59e0b)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            TruthWell
          </span>
        </div>
      </div>
    </div>
  );
}