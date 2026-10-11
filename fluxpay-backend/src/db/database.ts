import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.resolve(process.env.DATABASE_PATH || './fluxpay.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    // Ensure the parent directory exists (e.g. a mounted volume in containers)
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = undefined as unknown as Database.Database;
  }
}