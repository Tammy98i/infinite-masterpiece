import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seedDatabase } from './seed.js';
import { seedAdminIfMissing, seedCatalogIfEmpty, seedDemoLecturersIfMissing, seedFounderLecturers } from './catalogSeed.js';
import { migrateSchema } from './migrate.js';
import { seedWebinarConfigIfMissing } from '../services/webinarService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'onboarding.db');

let db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (db) return db;

  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const isNew = !fs.existsSync(DB_PATH);
  db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');

  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  db.exec(schema);
  migrateSchema(db);

  if (isNew) {
    seedDatabase(db);
  }
  seedCatalogIfEmpty(db);
  seedFounderLecturers(db);
  seedAdminIfMissing(db);
  seedDemoLecturersIfMissing(db);
  seedWebinarConfigIfMissing();

  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export type SqliteDb = DatabaseSync;
