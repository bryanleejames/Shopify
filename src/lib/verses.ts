// TruthWell - Verse data loaded from the designer's curated JSON
// Verses are stored at src/data/verses.json

import versesData from "~/data/verses.json";

export interface Verse {
  id: string;
  text: string;
  reference: string;
  themes: string[];
  prompt: string;
  devotional: string;
}

export type Theme =
  | "Faith"
  | "Hope"
  | "Love"
  | "Peace"
  | "Joy"
  | "Wisdom"
  | "Strength"
  | "Healing"
  | "Gratitude"
  | "Forgiveness"
  | "Courage"
  | "Comfort"
  | "Guidance"
  | "Patience"
  | "Trust";

const allVerses: Verse[] = versesData.verses as Verse[];

// Build an index by theme
const versesByTheme = new Map<string, Verse[]>();
for (const verse of allVerses) {
  for (const theme of verse.themes) {
    const existing = versesByTheme.get(theme) || [];
    existing.push(verse);
    versesByTheme.set(theme, existing);
  }
}

// Get today's verse deterministically based on the day of year
export function getDailyVerse(): Verse {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const dayOfYear = Math.floor(
    (today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
  );
  return allVerses[dayOfYear % allVerses.length];
}

// Get verses by theme
export function getVersesByTheme(theme: Theme): Verse[] {
  return versesByTheme.get(theme) || [];
}

// Get all unique themes
export function getAllThemes(): Theme[] {
  return Array.from(versesByTheme.keys()) as Theme[];
}

// Get a preview of themes (first verse for each theme)
export function getThemePreviews(): { theme: Theme; verses: Verse[] }[] {
  const themes = getAllThemes();
  return themes.map((t) => ({
    theme: t,
    verses: getVersesByTheme(t).slice(0, 2),
  }));
}

export { allVerses };