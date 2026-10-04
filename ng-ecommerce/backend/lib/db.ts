import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { DbFile } from './types';

/** Everything the server saves lives in ./data (commit this folder to git to share the products). */
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');

export async function readDb(): Promise<DbFile> {
  try {
    const raw = await fs.readFile(DB_FILE, 'utf8');
    const db = JSON.parse(raw) as Partial<DbFile>;
    return { counter: db.counter ?? 0, products: db.products ?? [] };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return { counter: 0, products: [] };
    throw err;
  }
}

let queue: Promise<unknown> = Promise.resolve();

/**
 * Runs `fn` on the database one request at a time, then saves it.
 * (Two requests can never overwrite each other's changes.)
 */
export function transaction<T>(fn: (db: DbFile) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const db = await readDb();
    const result = await fn(db);
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}
