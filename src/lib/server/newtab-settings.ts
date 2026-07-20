import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { env } from '$env/dynamic/private';

export type NewtabSettings = { unsplashQuery: string | null };

// Single-row table, same shape as status-db.ts — lets the /newtab background
// query be changed from the page's own settings panel instead of requiring
// an env var edit + redeploy.
const SCHEMA = `
	CREATE TABLE IF NOT EXISTS newtab_settings (
		id INTEGER PRIMARY KEY CHECK (id = 1),
		unsplash_query TEXT
	)
`;

let db: Database.Database | null = null;

function openDb(): Database.Database {
	const dbPath = env.NEWTAB_SETTINGS_DB_PATH || path.join(process.cwd(), 'data', 'newtab-settings.db');
	fs.mkdirSync(path.dirname(dbPath), { recursive: true });
	const instance = new Database(dbPath);
	instance.pragma('journal_mode = WAL');
	instance.exec(SCHEMA);
	return instance;
}

function getDb(): Database.Database {
	if (!db) db = openDb();
	return db;
}

// Test-only escape hatch, mirrors notes.ts / status-db.ts.
export function __setDbForTests(instance: Database.Database | null): void {
	db = instance;
}

export function getNewtabSettings(): NewtabSettings {
	const row = getDb().prepare('SELECT unsplash_query FROM newtab_settings WHERE id = 1').get() as
		| { unsplash_query: string | null }
		| undefined;
	return { unsplashQuery: row?.unsplash_query || null };
}

export function setNewtabUnsplashQuery(query: string | null): void {
	getDb()
		.prepare(
			`INSERT INTO newtab_settings (id, unsplash_query) VALUES (1, ?)
			 ON CONFLICT(id) DO UPDATE SET unsplash_query = excluded.unsplash_query`
		)
		.run(query);
}
