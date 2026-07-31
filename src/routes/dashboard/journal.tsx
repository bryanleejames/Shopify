import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { validateSession } from "~/lib/session";
import { useState, useEffect } from "react";

const addEntryFn = createServerFn({ method: "POST" })
  .validator((d: { userId: string; verseId: string; verseRef: string; verseText: string; reflection: string; mood: string }) => d)
  .handler(async ({ data }) => {
    const { addJournalEntry } = await import("~/lib/journal.server");
    return addJournalEntry(data.userId, data.verseId, data.verseRef, data.verseText, data.reflection, data.mood);
  });

const getEntriesFn = createServerFn({ method: "POST" })
  .validator((userId: string) => userId)
  .handler(async ({ data }) => {
    const { getJournalEntries } = await import("~/lib/journal.server");
    return getJournalEntries(data);
  });

const deleteEntryFn = createServerFn({ method: "POST" })
  .validator((d: { entryId: string; userId: string }) => d)
  .handler(async ({ data }) => {
    const { deleteJournalEntry } = await import("~/lib/journal.server");
    return deleteJournalEntry(data.entryId, data.userId);
  });

export const Route = createFileRoute("/dashboard/journal")({
  component: DashboardJournal,
});

const moods = ["reflective", "grateful", "joyful", "peaceful", "convicted", "hopeful", "sorrowful", "encouraged"];

function DashboardJournal() {
  const [entries, setEntries] = useState<any[]>([]);
  const [userId, setUserId] = useState("");
  const [reflection, setReflection] = useState("");
  const [mood, setMood] = useState("reflective");
  const [saving, setSaving] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Get pre-filled verse from URL params
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const prefillVerseId = params.get("verse") || "";
  const prefillRef = params.get("ref") || "";
  const prefillText = params.get("text") || "";

  useEffect(() => {
    validateSession().then((s) => {
      if (s.valid && s.user) {
        setUserId(s.user.id);
        getEntriesFn({ data: s.user.id }).then(setEntries);
      }
    });
  }, []);

  const handleSave = async () => {
    if (!reflection.trim()) return;
    setSaving(true);
    const newEntry = await addEntryFn({
      data: {
        userId,
        verseId: prefillVerseId || "custom",
        verseRef: prefillRef || "Personal Reflection",
        verseText: prefillText || "",
        reflection: reflection.trim(),
        mood,
      },
    });
    setEntries([newEntry, ...entries]);
    setReflection("");
    setMood("reflective");
    setShowNew(false);
    setSaving(false);
  };

  const handleDelete = async (entryId: string) => {
    await deleteEntryFn({ data: { entryId, userId } });
    setEntries(entries.filter((e) => e.id !== entryId));
  };

  const filteredEntries = searchTerm
    ? entries.filter(
        (e) =>
          e.verseRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.reflection.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : entries;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-brand-900 sm:text-3xl">My Journal</h1>
          <p className="mt-1 text-text-secondary">Capture your reflections on Scripture</p>
        </div>
        <button
          onClick={() => setShowNew(!showNew)}
          className="inline-flex items-center gap-1.5 rounded-xl gradient-accent px-4 py-2.5 text-xs font-bold text-brand-900 shadow-lg transition-all hover:scale-105"
        >
          + New Entry
        </button>
      </div>

      {/* New entry form */}
      {showNew && (
        <div className="mb-8 rounded-xl border bg-white p-6 shadow-sm" style={{ borderColor: "rgba(245,158,11,0.2)" }}>
          {prefillRef && (
            <div className="mb-3 rounded-lg bg-brand-50 p-3">
              <p className="text-xs font-semibold text-brand-500 uppercase tracking-wider">Verse</p>
              <p className="text-sm font-medium text-text-scripture scripture-text italic mt-1">"{prefillText}"</p>
              <p className="text-xs text-brand-700 mt-0.5">— {prefillRef}</p>
            </div>
          )}
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="What is God speaking to you through this verse?"
            rows={4}
            className="w-full rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-accent-400 focus:ring-1 focus:ring-accent-400 resize-none"
          />
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">Mood:</span>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs outline-none focus:border-accent-400"
              >
                {moods.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowNew(false)} className="rounded-lg border border-gray-200 px-4 py-1.5 text-xs font-medium text-text-secondary hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!reflection.trim() || saving}
                className="rounded-lg gradient-accent px-4 py-1.5 text-xs font-bold text-brand-900 disabled:opacity-50 transition-all hover:scale-105"
              >
                {saving ? "Saving..." : "Save Entry"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search journal entries by verse or keyword..."
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-accent-400 focus:ring-1 focus:ring-accent-400"
        />
      </div>

      {/* Entries */}
      {filteredEntries.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <span className="text-4xl">♰</span>
          <h3 className="mt-3 font-serif text-xl font-bold text-brand-900">Start Your Journal</h3>
          <p className="mt-2 text-sm text-text-secondary">
            Save reflections on verses you read. Click "New Entry" or save from any verse in the Theme Library.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry) => (
            <div key={entry.id} className="group relative rounded-xl border bg-white/75 p-6 backdrop-blur-sm shadow-sm"
              style={{ borderColor: "rgba(99,102,241,0.1)" }}
            >
              {/* Gold ornament */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.3), transparent)" }} />
                <span className="text-accent-300/60 text-sm">✦</span>
                <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.3), transparent)" }} />
              </div>

              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-text-muted">{formatDate(entry.createdAt)}</span>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-accent-50 px-2.5 py-0.5 text-[10px] font-medium capitalize text-accent-700">{entry.mood}</span>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-accent-500">✦ Journal</span>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="hidden group-hover:inline text-xs text-red-400 hover:text-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <p className="text-xs font-semibold uppercase tracking-wide text-brand-500 mb-2">{entry.verseRef}</p>
              {entry.verseText && (
                <p className="font-serif text-sm italic leading-relaxed text-text-scripture mb-4">"{entry.verseText}"</p>
              )}
              <div className="border-t pt-3" style={{ borderColor: "rgba(99,102,241,0.08)" }}>
                <p className="text-sm text-text-secondary leading-relaxed">
                  <span className="font-semibold text-brand-800">My reflection: </span>
                  {entry.reflection}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}