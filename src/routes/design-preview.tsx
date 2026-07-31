import { createFileRoute } from "@tanstack/react-router";
import versesData from "~/data/verses.json";
import { VerseCard, VerseCardShare } from "~/components/VerseCard";
import {
  PremiumThemeCard,
  PremiumJournalEntry,
  PremiumAudioPlayer,
  PremiumPageHeader,
} from "~/components/PremiumDashboardConcept";

export const Route = createFileRoute("/design-preview")({
  component: DesignPreview,
});

const { verses } = versesData;

const themesList = [
  { name: "Faith", description: "Trusting in God's character and promises", count: 6, color: "#3b82f6" },
  { name: "Hope", description: "Confident expectation in God's goodness", count: 6, color: "#f59e0b" },
  { name: "Love", description: "Selfless, patient, kind — reflecting God's heart", count: 6, color: "#ec4899" },
  { name: "Peace", description: "Tranquility that surpasses understanding", count: 6, color: "#6366f1" },
  { name: "Joy", description: "Deep gladness rooted in God's presence", count: 6, color: "#fbbf24" },
  { name: "Wisdom", description: "Seeing life from God's perspective", count: 6, color: "#8b5cf6" },
];

function DesignPreview() {
  const sampleVerses = {
    faith: verses.find((v: { id: string }) => v.id === "faith-001")!,
    hope: verses.find((v: { id: string }) => v.id === "hope-001")!,
    peace: verses.find((v: { id: string }) => v.id === "peace-001")!,
    joy: verses.find((v: { id: string }) => v.id === "joy-001")!,
    love: verses.find((v: { id: string }) => v.id === "love-001")!,
  };

  return (
    <div className="min-h-dvh bg-[#faf8f4] dark:bg-[#0f0d2e] py-16 px-6">
      <div className="mx-auto max-w-6xl">
        {/* Page header */}
        <div className="text-center mb-16">
          <span className="inline-block rounded-full bg-[#f59e0b]/10 px-3 py-1 text-xs font-bold tracking-[0.15em] uppercase text-[#f59e0b] mb-4">
            ✦ TruthWell Design Preview
          </span>
          <h1
            className="text-4xl sm:text-5xl font-bold text-[#1a1a2e] dark:text-white mb-4"
            style={{ fontFamily: "'DM Serif Display', 'Georgia', serif" }}
          >
            Social Verse Cards
            <br />
            <span className="text-gradient">& Premium Dashboard</span>
          </h1>
          <p className="text-lg text-[#6b6b80] dark:text-white/60 max-w-xl mx-auto">
            Design concepts for shareable social media cards and the premium
            subscriber experience.
          </p>
        </div>

        {/* ========== SECTION 1: VERSE CARDS ========== */}
        <section className="mb-24">
          <div className="mb-12 text-center">
            <h2
              className="text-3xl sm:text-4xl font-bold text-[#1a1a2e] dark:text-white mb-3"
              style={{ fontFamily: "'DM Serif Display', 'Georgia', serif" }}
            >
              Shareable Verse Cards
            </h2>
            <p className="text-lg text-[#6b6b80] dark:text-white/60 max-w-xl mx-auto">
              1200×630 optimized for Open Graph, Twitter, and social sharing
            </p>
          </div>

          {/* Inline / web versions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div>
              <h3 className="text-sm font-semibold text-[#6b6b80] dark:text-white/50 mb-4 uppercase tracking-wider">
                Faith — Hebrews 11:1
              </h3>
              <VerseCard verse={sampleVerses.faith} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#6b6b80] dark:text-white/50 mb-4 uppercase tracking-wider">
                Hope — Jeremiah 29:11
              </h3>
              <VerseCard verse={sampleVerses.hope} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#6b6b80] dark:text-white/50 mb-4 uppercase tracking-wider">
                Peace — Philippians 4:6-7
              </h3>
              <VerseCard verse={sampleVerses.peace} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#6b6b80] dark:text-white/50 mb-4 uppercase tracking-wider">
                Joy — Nehemiah 8:10
              </h3>
              <VerseCard verse={sampleVerses.joy} />
            </div>
          </div>

          {/* Social share format */}
          <div className="bg-[#1a1a2e] rounded-2xl p-8 mb-6 overflow-hidden">
            <h3 className="text-sm font-semibold text-white/50 mb-6 uppercase tracking-wider">
              Social Share Format (1200×630 OG Card)
            </h3>
            <div className="overflow-hidden rounded-xl shadow-2xl max-w-full" style={{ transform: "scale(0.6)", transformOrigin: "top left", width: "1200px", height: "630px" }}>
              <VerseCardShare verse={sampleVerses.love} />
            </div>
          </div>

          {/* Generated image cards */}
          <div className="mt-16">
            <div className="text-center mb-10">
              <h2
                className="text-3xl sm:text-4xl font-bold text-[#1a1a2e] dark:text-white mb-3"
                style={{ fontFamily: "'DM Serif Display', 'Georgia', serif" }}
              >
                AI-Generated Cards
              </h2>
              <p className="text-lg text-[#6b6b80] dark:text-white/60 max-w-xl mx-auto">
                High-quality generated images with verse text overlaid
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <h4 className="text-xs font-semibold text-[#6b6b80] dark:text-white/50 mb-3 uppercase tracking-wider">
                  Faith — Hebrews 11:1
                </h4>
                <img
                  src="/images/verse-cards/faith-hebrews11-1.png"
                  alt="Faith verse card"
                  className="w-full rounded-xl shadow-lg"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-semibold text-[#6b6b80] dark:text-white/50 mb-3 uppercase tracking-wider">
                    Hope — Jeremiah 29:11
                  </h4>
                  <img
                    src="/images/verse-cards/hope-jeremiah29-11.png"
                    alt="Hope verse card"
                    className="w-full rounded-xl shadow-lg"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#6b6b80] dark:text-white/50 mb-3 uppercase tracking-wider">
                    Peace — Philippians 4:6-7
                  </h4>
                  <img
                    src="/images/verse-cards/peace-philippians4-6.png"
                    alt="Peace verse card"
                    className="w-full rounded-xl shadow-lg"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#6b6b80] dark:text-white/50 mb-3 uppercase tracking-wider">
                    Joy — Nehemiah 8:10
                  </h4>
                  <img
                    src="/images/verse-cards/joy-nehemiah8-10.png"
                    alt="Joy verse card"
                    className="w-full rounded-xl shadow-lg"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#6b6b80] dark:text-white/50 mb-3 uppercase tracking-wider">
                    Love — 1 Corinthians 13:4-5
                  </h4>
                  <img
                    src="/images/verse-cards/love-1corinthians13-4.png"
                    alt="Love verse card"
                    className="w-full rounded-xl shadow-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========== SECTION 2: PREMIUM DASHBOARD CONCEPTS ========== */}
        <section className="mb-24">
          <div className="flex items-center justify-center gap-3 my-16">
            <div className="h-px flex-1 max-w-24" style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.3), transparent)" }} />
            <span className="text-2xl text-brand-400 font-serif">✦</span>
            <div className="h-px flex-1 max-w-24" style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.3), transparent)" }} />
          </div>

          {/* Premium Theme Library */}
          <PremiumPageHeader
            title="Premium Theme Library"
            subtitle="Every season of life, beautifully organized — exclusive to premium subscribers"
            isPremium
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
            {themesList.map((t) => (
              <PremiumThemeCard
                key={t.name}
                name={t.name}
                description={t.description}
                verseCount={t.count}
                accentColor={t.color}
                icon={t.name[0]}
              />
            ))}
          </div>

          {/* Verse Journal */}
          <PremiumPageHeader
            title="Verse Journal"
            subtitle="Capture what God is speaking to you — every reflection preserved"
            isPremium
          />
          <div className="max-w-2xl mx-auto mb-20">
            <PremiumJournalEntry
              verse={sampleVerses.faith}
              date="July 4, 2026"
            />
            <PremiumJournalEntry
              verse={sampleVerses.peace}
              date="July 3, 2026"
            />
            <PremiumJournalEntry
              verse={sampleVerses.joy}
              date="July 2, 2026"
            />
          </div>

          {/* Audio Player */}
          <PremiumPageHeader
            title="Audio Devotionals"
            subtitle="Listen to Scripture read aloud — ad-free for premium members"
            isPremium
          />
        </section>

        {/* ========== FOOTER ========== */}
        <div className="text-center border-t border-[#6366f1]/10 pt-10">
          <p className="text-sm text-[#6b6b80] dark:text-white/50">
            TruthWell — Design Preview • July 2026
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-xs text-[#9ca3af] dark:text-white/30">
              These are design concepts. Premium features require subscription.
            </span>
          </div>
        </div>
      </div>

      {/* Audio player preview (fixed bottom) */}
      <PremiumAudioPlayer />
    </div>
  );
}