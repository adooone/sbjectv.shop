import { Database } from 'bun:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { env } from '@/env';
import * as schema from './schema';

const MIGRATIONS_FOLDER = new URL('../../drizzle', import.meta.url).pathname;

export const createDb = (url: string = env.DATABASE_URL) => {
  if (url !== ':memory:') mkdirSync(dirname(url), { recursive: true });
  const sqlite = new Database(url);
  sqlite.exec('PRAGMA journal_mode = WAL;');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  return db;
};

export type Db = ReturnType<typeof createDb>;
