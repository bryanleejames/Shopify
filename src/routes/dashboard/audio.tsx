import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getVersesByTheme, getAllThemes, type Theme } from "~/lib/verses";
import { useState } from "react";

const getPlaylistData = createServerFn({ method: "GET" }).handler(async () => {
  const themes = getAllThemes();
  return themes.slice(0, 8).map((t) => ({
    theme: t,
    verses: getVersesByTheme(t).slice(0, 3),
  }));
});

export const Route = createFileRoute("/dashboard/audio")({
  component: DashboardAudio,
  loader: async () => getPlaylistData(),
});

function DashboardAudio() {
  const playlist = Route.useLoaderData();
  const [currentTrack, setCurrentTrack] = useState<{ theme: string; ref: string; text: string } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const handlePlay = (theme: string, ref: string, text: string) => {
    setCurrentTrack({ theme, ref, text });
    setIsPlaying(true);
  };

  return (
    <div className="pb-24">
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-brand-900 sm:text-3xl">Audio Readings</h1>
        <p className="mt-1 text-text-secondary">Listen to Scripture read aloud. Audio files coming soon.</p>
      </div>

      {/* Current track bar (placeholder) */}
      <div className="mb-8 rounded-xl p-5" style={{
        background: "rgba(15, 13, 46, 0.9)",
        border: "1px solid rgba(245, 158, 11, 0.2)",
      }}>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
            style={{ background: "linear-gradient(135deg, #6366f1, #f59e0b)" }}
          >
            <span className="text-white text-lg font-bold">♪</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {currentTrack ? `${currentTrack.ref} — ${currentTrack.theme}` : "Select a track to play"}
            </p>
            <p className="text-xs text-white/40">Narrated by TruthWell</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-white/60 hover:text-white transition-colors text-lg">⏮</button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex h-10 w-10 items-center justify-center rounded-full transition-transform hover:scale-105"
              style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
            >
              <span className="text-white text-sm">{isPlaying ? "⏸" : "▶"}</span>
            </button>
            <button className="text-white/60 hover:text-white transition-colors text-lg">⏭</button>
          </div>
          <div className="hidden md:flex items-center gap-3 flex-1 max-w-xs">
            <span className="text-xs text-white/40">0:00</span>
            <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full w-0 rounded-full transition-all" style={{ background: "linear-gradient(90deg, #6366f1, #f59e0b)" }} />
            </div>
            <span className="text-xs text-white/40">3:00</span>
          </div>
          <span className="hidden sm:inline text-[10px] font-bold tracking-wider uppercase text-accent-400">✦ Premium Audio</span>
        </div>
      </div>

      {/* Playlist by theme */}
      <div className="space-y-6">
        {playlist.map(({ theme, verses }) => (
          <div key={theme}>
            <h3 className="mb-3 font-serif text-lg font-bold text-brand-900">{theme}</h3>
            <div className="space-y-2">
              {verses.map((verse) => (
                <div
                  key={verse.id}
                  className="flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm transition-all hover:shadow-md cursor-pointer"
                  style={{
                    borderColor: currentTrack?.ref === verse.reference ? "rgba(245,158,11,0.4)" : "rgba(0,0,0,0.06)",
                    borderLeft: currentTrack?.ref === verse.reference ? "3px solid #f59e0b" : "3px solid transparent",
                  }}
                  onClick={() => handlePlay(theme, verse.reference, verse.text)}
                >
                  <button
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all hover:scale-105"
                    style={{ background: currentTrack?.ref === verse.reference && isPlaying ? "linear-gradient(135deg, #f59e0b, #d97706)" : "rgba(99,102,241,0.1)" }}
                  >
                    <span className="text-xs" style={{ color: currentTrack?.ref === verse.reference && isPlaying ? "#fff" : "#4f46e5" }}>
                      {currentTrack?.ref === verse.reference && isPlaying ? "⏸" : "▶"}
                    </span>
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-800 truncate">{verse.reference}</p>
                    <p className="text-xs italic text-text-secondary truncate">"{verse.text.slice(0, 60)}..."</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700">{theme}</span>
                    <span className="text-[10px] text-text-muted">3:00</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Speed control */}
      <div className="mt-6 flex items-center gap-2">
        <span className="text-xs text-text-muted">Speed:</span>
        {[0.75, 1, 1.25, 1.5, 2].map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              speed === s ? "gradient-accent text-brand-900" : "border border-gray-200 text-text-secondary hover:bg-gray-50"
            }`}
          >
            {s}x
          </button>
        ))}
        <span className="ml-auto text-[10px] text-text-muted">Audio files coming soon</span>
      </div>
    </div>
  );
}