import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { env } from '$env/dynamic/private';

export type PlayRecord = {
	playedAt: string;
	msPlayed: number;
	track: string;
	artist: string;
	album: string | null;
	spotifyUri: string | null;
	platform: string | null;
	shuffle: boolean | null;
	skipped: boolean | null;
};

const SCHEMA = `
	CREATE TABLE IF NOT EXISTS plays (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		played_at TEXT NOT NULL,
		ms_played INTEGER NOT NULL,
		track TEXT NOT NULL,
		artist TEXT NOT NULL,
		album TEXT,
		spotify_uri TEXT,
		platform TEXT,
		shuffle INTEGER,
		skipped INTEGER,
		UNIQUE(played_at, spotify_uri, ms_played)
	);
	CREATE INDEX IF NOT EXISTS idx_plays_played_at ON plays(played_at);
`;

let db: Database.Database | null = null;

function openDb(): Database.Database {
	const dbPath = env.SPOTIFY_HISTORY_DB_PATH || path.join(process.cwd(), 'data', 'spotify-history.db');
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

// Test-only escape hatch, mirrors notes.ts / simkl-cache.ts.
export function __setDbForTests(instance: Database.Database | null): void {
	db = instance;
}

// UNIQUE(played_at, spotify_uri, ms_played) + INSERT OR IGNORE makes this
// idempotent — re-uploading the same (or an overlapping, re-requested)
// export just skips rows already seen instead of duplicating listening time.
export function insertPlays(records: PlayRecord[]): { inserted: number } {
	const stmt = getDb().prepare(
		`INSERT OR IGNORE INTO plays
			(played_at, ms_played, track, artist, album, spotify_uri, platform, shuffle, skipped)
		 VALUES (@playedAt, @msPlayed, @track, @artist, @album, @spotifyUri, @platform, @shuffle, @skipped)`
	);
	const insertAll = getDb().transaction((rows: PlayRecord[]) => {
		let inserted = 0;
		for (const row of rows) {
			const result = stmt.run({
				...row,
				shuffle: row.shuffle == null ? null : row.shuffle ? 1 : 0,
				skipped: row.skipped == null ? null : row.skipped ? 1 : 0
			});
			if (result.changes > 0) inserted++;
		}
		return inserted;
	});
	return { inserted: insertAll(records) };
}

export type ListeningStats = {
	totalPlays: number;
	totalMsPlayed: number;
	firstPlayedAt: string | null;
	lastPlayedAt: string | null;
	peakYear: number | null;
	peakWeekday: number | null; // 0 = Sunday, matches JS Date#getDay
	topArtists: { artist: string; plays: number; msPlayed: number }[];
	topTracks: { track: string; artist: string; plays: number; spotifyUri: string | null }[];
};

export function getListeningStats(): ListeningStats {
	const database = getDb();

	const totals = database
		.prepare(
			'SELECT COUNT(*) as totalPlays, COALESCE(SUM(ms_played), 0) as totalMsPlayed, MIN(played_at) as firstPlayedAt, MAX(played_at) as lastPlayedAt FROM plays'
		)
		.get() as { totalPlays: number; totalMsPlayed: number; firstPlayedAt: string | null; lastPlayedAt: string | null };

	const peakYearRow = database
		.prepare(
			`SELECT CAST(strftime('%Y', played_at) AS INTEGER) as year, COUNT(*) as plays
			 FROM plays GROUP BY year ORDER BY plays DESC LIMIT 1`
		)
		.get() as { year: number; plays: number } | undefined;

	const peakWeekdayRow = database
		.prepare(
			`SELECT CAST(strftime('%w', played_at) AS INTEGER) as weekday, COUNT(*) as plays
			 FROM plays GROUP BY weekday ORDER BY plays DESC LIMIT 1`
		)
		.get() as { weekday: number; plays: number } | undefined;

	const topArtists = database
		.prepare(
			`SELECT artist, COUNT(*) as plays, SUM(ms_played) as msPlayed
			 FROM plays GROUP BY artist ORDER BY msPlayed DESC LIMIT 5`
		)
		.all() as { artist: string; plays: number; msPlayed: number }[];

	const topTracks = database
		.prepare(
			`SELECT track, artist, COUNT(*) as plays, spotify_uri as spotifyUri
			 FROM plays GROUP BY track, artist ORDER BY plays DESC LIMIT 5`
		)
		.all() as { track: string; artist: string; plays: number; spotifyUri: string | null }[];

	return {
		totalPlays: totals.totalPlays,
		totalMsPlayed: totals.totalMsPlayed,
		firstPlayedAt: totals.firstPlayedAt,
		lastPlayedAt: totals.lastPlayedAt,
		peakYear: peakYearRow?.year ?? null,
		peakWeekday: peakWeekdayRow?.weekday ?? null,
		topArtists,
		topTracks
	};
}
