import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { env } from '$env/dynamic/private';

export type CachedDetail = { genres: string[]; overview: string; fetchedAt: string };

const SCHEMA = `
	CREATE TABLE IF NOT EXISTS simkl_details (
		simkl_id INTEGER NOT NULL,
		media_type TEXT NOT NULL,
		genres TEXT NOT NULL,
		overview TEXT NOT NULL,
		fetched_at TEXT NOT NULL,
		PRIMARY KEY (simkl_id, media_type)
	)
`;

let db: Database.Database | null = null;

function openDb(): Database.Database {
	const dbPath = env.SIMKL_CACHE_DB_PATH || path.join(process.cwd(), 'data', 'simkl-cache.db');
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

// Test-only escape hatch, mirrors notes.ts.
export function __setDbForTests(instance: Database.Database | null): void {
	db = instance;
}

export function cacheKey(simklId: number, mediaType: string): string {
	return `${simklId}:${mediaType}`;
}

export function getCachedDetails(keys: { simklId: number; mediaType: string }[]): Map<string, CachedDetail> {
	const result = new Map<string, CachedDetail>();
	if (keys.length === 0) return result;

	const stmt = getDb().prepare(
		'SELECT genres, overview, fetched_at FROM simkl_details WHERE simkl_id = ? AND media_type = ?'
	);
	for (const { simklId, mediaType } of keys) {
		const row = stmt.get(simklId, mediaType) as
			| { genres: string; overview: string; fetched_at: string }
			| undefined;
		if (row) {
			result.set(cacheKey(simklId, mediaType), {
				genres: JSON.parse(row.genres),
				overview: row.overview,
				fetchedAt: row.fetched_at
			});
		}
	}
	return result;
}

export function upsertDetail(simklId: number, mediaType: string, genres: string[], overview: string): void {
	getDb()
		.prepare(
			`INSERT INTO simkl_details (simkl_id, media_type, genres, overview, fetched_at)
			 VALUES (?, ?, ?, ?, ?)
			 ON CONFLICT(simkl_id, media_type) DO UPDATE SET
			 	genres = excluded.genres, overview = excluded.overview, fetched_at = excluded.fetched_at`
		)
		.run(simklId, mediaType, JSON.stringify(genres), overview, new Date().toISOString());
}
