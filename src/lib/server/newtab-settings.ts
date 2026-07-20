import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { env } from '$env/dynamic/private';

export type NewtabSettings = { unsplashQuery: string | null };

export type QuickLink = { id: number; label: string; url: string; position: number; clicks: number };

export type CachedPhoto = {
	url: string;
	photographerName: string;
	photographerProfileUrl: string;
	photoPageUrl: string;
};

export type PhotoCacheEntry = { query: string; fetchedAt: number; photo: CachedPhoto };

export type PhotoHistoryEntry = CachedPhoto & { id: number; favorited: boolean; fetchedAt: number };

export type FocusStats = { sessionsToday: number; focusMinutesToday: number };

// Single-row table, same shape as status-db.ts — lets the /newtab background
// query be changed from the page's own settings panel instead of requiring
// an env var edit + redeploy. photo_cache persists the last fetched photo
// alongside the in-memory cache in unsplash.ts, so a server restart (which
// happens on every redeploy, and often during local dev) doesn't force an
// immediate re-fetch and eat into Unsplash's 50-requests/hour demo quota.
const SCHEMA = `
	CREATE TABLE IF NOT EXISTS newtab_settings (
		id INTEGER PRIMARY KEY CHECK (id = 1),
		unsplash_query TEXT,
		photo_cache TEXT,
		quick_links TEXT
	);

	CREATE TABLE IF NOT EXISTS quick_links (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		label TEXT NOT NULL,
		url TEXT NOT NULL,
		position INTEGER NOT NULL,
		clicks INTEGER NOT NULL DEFAULT 0
	);

	-- One row per fetched background photo, capped/pruned in addPhotoHistory
	-- so cycling through past photos (see cyclePhoto in +page.server.ts)
	-- doesn't require a fresh Unsplash call and doesn't touch the hourly quota.
	CREATE TABLE IF NOT EXISTS photo_history (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		query TEXT NOT NULL,
		url TEXT NOT NULL,
		photographer_name TEXT NOT NULL,
		photographer_profile_url TEXT NOT NULL,
		photo_page_url TEXT NOT NULL,
		favorited INTEGER NOT NULL DEFAULT 0,
		fetched_at INTEGER NOT NULL
	);

	CREATE TABLE IF NOT EXISTS focus_sessions (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		kind TEXT NOT NULL,
		completed INTEGER NOT NULL,
		started_at TEXT NOT NULL,
		ended_at TEXT NOT NULL
	);

	CREATE TABLE IF NOT EXISTS search_history (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		query TEXT NOT NULL,
		searched_at TEXT NOT NULL
	);
`;

// quick_links used to live as a single JSON blob in newtab_settings.quick_links
// (pre-table version). Migrate any leftover blob into real rows once, then
// leave the column alone (harmless dead column, simpler than a DROP COLUMN
// migration on better-sqlite3).
function migrateLegacyQuickLinksBlob(instance: Database.Database): void {
	const row = instance.prepare('SELECT quick_links FROM newtab_settings WHERE id = 1').get() as
		| { quick_links: string | null }
		| undefined;
	if (!row?.quick_links) return;

	const alreadyMigrated = instance.prepare('SELECT COUNT(*) AS n FROM quick_links').get() as { n: number };
	if (alreadyMigrated.n > 0) return;

	try {
		const legacy = JSON.parse(row.quick_links) as { label: string; url: string }[];
		const insert = instance.prepare(
			'INSERT INTO quick_links (label, url, position, clicks) VALUES (?, ?, ?, 0)'
		);
		instance.transaction(() => {
			legacy.forEach((link, i) => insert.run(link.label, link.url, i));
		})();
	} catch {
		// Malformed legacy blob — nothing worth recovering.
	}

	instance.prepare('UPDATE newtab_settings SET quick_links = NULL WHERE id = 1').run();
}

function migrateColumns(instance: Database.Database): void {
	const columns = instance.prepare('PRAGMA table_info(newtab_settings)').all() as { name: string }[];
	if (!columns.some((col) => col.name === 'photo_cache')) {
		instance.exec('ALTER TABLE newtab_settings ADD COLUMN photo_cache TEXT');
	}
	if (!columns.some((col) => col.name === 'quick_links')) {
		instance.exec('ALTER TABLE newtab_settings ADD COLUMN quick_links TEXT');
	}
}

let db: Database.Database | null = null;

function openDb(): Database.Database {
	const dbPath = env.NEWTAB_SETTINGS_DB_PATH || path.join(process.cwd(), 'data', 'newtab-settings.db');
	fs.mkdirSync(path.dirname(dbPath), { recursive: true });
	const instance = new Database(dbPath);
	instance.pragma('journal_mode = WAL');
	instance.exec(SCHEMA);
	migrateColumns(instance);
	migrateLegacyQuickLinksBlob(instance);
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

// --- Quick links -----------------------------------------------------------

export function getQuickLinks(): QuickLink[] {
	const rows = getDb()
		.prepare('SELECT id, label, url, position, clicks FROM quick_links ORDER BY position ASC, id ASC')
		.all() as QuickLink[];
	return rows;
}

export function addQuickLink(label: string, url: string): QuickLink {
	const db = getDb();
	const maxPosition = db.prepare('SELECT COALESCE(MAX(position), -1) AS max FROM quick_links').get() as {
		max: number;
	};
	const result = db
		.prepare('INSERT INTO quick_links (label, url, position, clicks) VALUES (?, ?, ?, 0)')
		.run(label, url, maxPosition.max + 1);
	return { id: Number(result.lastInsertRowid), label, url, position: maxPosition.max + 1, clicks: 0 };
}

export function removeQuickLink(id: number): void {
	getDb().prepare('DELETE FROM quick_links WHERE id = ?').run(id);
}

export function incrementQuickLinkClicks(id: number): void {
	getDb().prepare('UPDATE quick_links SET clicks = clicks + 1 WHERE id = ?').run(id);
}

// --- Photo history -----------------------------------------------------------

const PHOTO_HISTORY_LIMIT = 12;

export function addPhotoHistory(query: string, photo: CachedPhoto): void {
	const db = getDb();
	db.prepare(
		`INSERT INTO photo_history (query, url, photographer_name, photographer_profile_url, photo_page_url, favorited, fetched_at)
		 VALUES (?, ?, ?, ?, ?, 0, ?)`
	).run(query, photo.url, photo.photographerName, photo.photographerProfileUrl, photo.photoPageUrl, Date.now());

	// Prune down to the cap, oldest first, but never delete favorited photos —
	// those are the whole point of letting someone pin one.
	const overflow = db
		.prepare(
			`SELECT id FROM photo_history WHERE favorited = 0
			 ORDER BY fetched_at DESC LIMIT -1 OFFSET ?`
		)
		.all(PHOTO_HISTORY_LIMIT) as { id: number }[];
	if (overflow.length) {
		const del = db.prepare('DELETE FROM photo_history WHERE id = ?');
		db.transaction(() => overflow.forEach((row) => del.run(row.id)))();
	}
}

type PhotoHistoryRow = Omit<PhotoHistoryEntry, 'favorited'> & { favorited: number };

export function listPhotoHistory(): PhotoHistoryEntry[] {
	const rows = getDb()
		.prepare(
			`SELECT id, query, url, photographer_name AS photographerName, photographer_profile_url AS photographerProfileUrl,
			        photo_page_url AS photoPageUrl, favorited, fetched_at AS fetchedAt
			 FROM photo_history ORDER BY fetched_at DESC`
		)
		.all() as PhotoHistoryRow[];
	return rows.map((row) => ({ ...row, favorited: Boolean(row.favorited) }));
}

export function toggleFavoritePhoto(id: number): void {
	getDb().prepare('UPDATE photo_history SET favorited = NOT favorited WHERE id = ?').run(id);
}

// Picks a different cached photo at random — used by the "cycle" button so
// browsing past backgrounds never counts against the Unsplash API quota.
export function pickRandomPhotoHistory(excludeUrl?: string): PhotoHistoryEntry | null {
	const rows = listPhotoHistory().filter((p) => p.url !== excludeUrl);
	if (!rows.length) return null;
	return rows[Math.floor(Math.random() * rows.length)];
}

export function getPhotoCache(): PhotoCacheEntry | null {
	const row = getDb().prepare('SELECT photo_cache FROM newtab_settings WHERE id = 1').get() as
		| { photo_cache: string | null }
		| undefined;
	if (!row?.photo_cache) return null;
	try {
		return JSON.parse(row.photo_cache) as PhotoCacheEntry;
	} catch {
		return null;
	}
}

export function setPhotoCache(entry: PhotoCacheEntry): void {
	getDb()
		.prepare(
			`INSERT INTO newtab_settings (id, photo_cache) VALUES (1, ?)
			 ON CONFLICT(id) DO UPDATE SET photo_cache = excluded.photo_cache`
		)
		.run(JSON.stringify(entry));
	addPhotoHistory(entry.query, entry.photo);
}

// --- Focus sessions -----------------------------------------------------------

export function logFocusSession(kind: 'focus' | 'break', completed: boolean, startedAt: string, endedAt: string): void {
	getDb()
		.prepare('INSERT INTO focus_sessions (kind, completed, started_at, ended_at) VALUES (?, ?, ?, ?)')
		.run(kind, completed ? 1 : 0, startedAt, endedAt);
}

export function getFocusStats(): FocusStats {
	const todayStart = new Date();
	todayStart.setHours(0, 0, 0, 0);
	const rows = getDb()
		.prepare(
			`SELECT started_at AS startedAt, ended_at AS endedAt FROM focus_sessions
			 WHERE kind = 'focus' AND completed = 1 AND started_at >= ?`
		)
		.all(todayStart.toISOString()) as { startedAt: string; endedAt: string }[];

	const focusMinutesToday = rows.reduce((sum, row) => {
		const ms = new Date(row.endedAt).getTime() - new Date(row.startedAt).getTime();
		return sum + Math.max(0, Math.round(ms / 60000));
	}, 0);

	return { sessionsToday: rows.length, focusMinutesToday };
}

// --- Search history -----------------------------------------------------------

const SEARCH_HISTORY_LIMIT = 8;

export function logSearch(query: string): void {
	const trimmed = query.trim();
	if (!trimmed) return;
	const db = getDb();
	db.prepare('DELETE FROM search_history WHERE query = ?').run(trimmed);
	db.prepare('INSERT INTO search_history (query, searched_at) VALUES (?, ?)').run(trimmed, new Date().toISOString());

	const overflow = db
		.prepare('SELECT id FROM search_history ORDER BY searched_at DESC LIMIT -1 OFFSET ?')
		.all(SEARCH_HISTORY_LIMIT) as { id: number }[];
	if (overflow.length) {
		const del = db.prepare('DELETE FROM search_history WHERE id = ?');
		db.transaction(() => overflow.forEach((row) => del.run(row.id)))();
	}
}

export function getRecentSearches(limit = 5): string[] {
	const rows = getDb()
		.prepare('SELECT query FROM search_history ORDER BY searched_at DESC LIMIT ?')
		.all(limit) as { query: string }[];
	return rows.map((r) => r.query);
}
