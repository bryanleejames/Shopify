// Journal entry storage for TruthWell premium dashboard
// Stores user journal entries in .data/journal.json

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

export interface JournalEntry {
  id: string;
  userId: string;
  verseId: string;
  verseRef: string;
  verseText: string;
  reflection: string;
  mood: string;
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "journal.json");

async function readJournalStore(): Promise<JournalEntry[]> {
  try {
    const raw = await readFile(STORE_PATH, "utf-8");
    return JSON.parse(raw) as JournalEntry[];
  } catch {
    return [];
  }
}

async function writeJournalStore(entries: JournalEntry[]): Promise<void> {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
  await writeFile(STORE_PATH, JSON.stringify(entries, null, 2), "utf-8");
}

export async function addJournalEntry(
  userId: string,
  verseId: string,
  verseRef: string,
  verseText: string,
  reflection: string,
  mood: string = "reflective"
): Promise<JournalEntry> {
  const entries = await readJournalStore();
  const entry: JournalEntry = {
    id: randomBytes(16).toString("hex"),
    userId,
    verseId,
    verseRef,
    verseText,
    reflection,
    mood,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  entries.push(entry);
  await writeJournalStore(entries);
  return entry;
}

export async function getJournalEntries(
  userId?: string
): Promise<JournalEntry[]> {
  const entries = await readJournalStore();
  if (userId) {
    return entries
      .filter((e) => e.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }
  return entries.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function deleteJournalEntry(
  entryId: string,
  userId: string
): Promise<boolean> {
  const entries = await readJournalStore();
  const idx = entries.findIndex(
    (e) => e.id === entryId && e.userId === userId
  );
  if (idx === -1) return false;
  entries.splice(idx, 1);
  await writeJournalStore(entries);
  return true;
}