import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.DATABASE_PATH || './fluxpay.db';

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(path.resolve(DB_PATH));
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
  }
}