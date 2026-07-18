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

export function getListeningStats(opts: { year?: number } = {}): ListeningStats {
	const database = getDb();
	const yearFilter = opts.year != null ? `WHERE strftime('%Y', played_at) = @year` : '';
	const params = opts.year != null ? { year: String(opts.year) } : {};

	const totals = database
		.prepare(
			`SELECT COUNT(*) as totalPlays, COALESCE(SUM(ms_played), 0) as totalMsPlayed, MIN(played_at) as firstPlayedAt, MAX(played_at) as lastPlayedAt FROM plays ${yearFilter}`
		)
		.get(params) as { totalPlays: number; totalMsPlayed: number; firstPlayedAt: string | null; lastPlayedAt: string | null };

	// peakYear is always computed across all years, regardless of filter — it's "which year was busiest", not affected by viewing one.
	const peakYearRow = database
		.prepare(
			`SELECT CAST(strftime('%Y', played_at) AS INTEGER) as year, COUNT(*) as plays
			 FROM plays GROUP BY year ORDER BY plays DESC LIMIT 1`
		)
		.get() as { year: number; plays: number } | undefined;

	const peakWeekdayRow = database
		.prepare(
			`SELECT CAST(strftime('%w', played_at) AS INTEGER) as weekday, COUNT(*) as plays
			 FROM plays ${yearFilter} GROUP BY weekday ORDER BY plays DESC LIMIT 1`
		)
		.get(params) as { weekday: number; plays: number } | undefined;

	const topArtists = database
		.prepare(
			`SELECT artist, COUNT(*) as plays, SUM(ms_played) as msPlayed
			 FROM plays ${yearFilter} GROUP BY artist ORDER BY msPlayed DESC LIMIT 5`
		)
		.all(params) as { artist: string; plays: number; msPlayed: number }[];

	const topTracks = database
		.prepare(
			`SELECT track, artist, COUNT(*) as plays, spotify_uri as spotifyUri
			 FROM plays ${yearFilter} GROUP BY track, artist ORDER BY plays DESC LIMIT 5`
		)
		.all(params) as { track: string; artist: string; plays: number; spotifyUri: string | null }[];

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

// Years with at least one play, newest first — powers the year filter dropdown.
export function getAvailableYears(): number[] {
	const rows = getDb()
		.prepare(
			`SELECT DISTINCT CAST(strftime('%Y', played_at) AS INTEGER) as year
			 FROM plays ORDER BY year DESC`
		)
		.all() as { year: number }[];
	return rows.map((r) => r.year);
}

// One row per day with at least one play in `year` — GitHub-style calendar heatmap.
export function getHeatmap(year: number): { date: string; plays: number }[] {
	return getDb()
		.prepare(
			`SELECT date(played_at) as date, COUNT(*) as plays
			 FROM plays WHERE strftime('%Y', played_at) = @year
			 GROUP BY date ORDER BY date`
		)
		.all({ year: String(year) }) as { date: string; plays: number }[];
}

// Play counts by hour-of-day (0-23), across all history — powers a listening-clock chart.
export function getHourlyBreakdown(): { hour: number; plays: number }[] {
	return getDb()
		.prepare(
			`SELECT CAST(strftime('%H', played_at) AS INTEGER) as hour, COUNT(*) as plays
			 FROM plays GROUP BY hour ORDER BY hour`
		)
		.all() as { hour: number; plays: number }[];
}

export type TrackHistory = { plays: number; firstPlayedAt: string; lastPlayedAt: string };

// Looks up a track's full play history by Spotify URI — used to cross-reference
// the currently-playing track against the archive ("you've played this 47 times").
export function getTrackHistory(spotifyUri: string): TrackHistory | null {
	const row = getDb()
		.prepare(
			`SELECT COUNT(*) as plays, MIN(played_at) as firstPlayedAt, MAX(played_at) as lastPlayedAt
			 FROM plays WHERE spotify_uri = @uri`
		)
		.get({ uri: spotifyUri }) as TrackHistory & { plays: number };
	return row.plays > 0 ? row : null;
}

// Count of rows still awaiting the next export to overwrite them with real
// ms_played data — surfaced on /spotify-import so it's obvious how much of
// the archive is still estimate-only.
export function getLiveScrobbleCount(): number {
	const row = getDb()
		.prepare(`SELECT COUNT(*) as count FROM plays WHERE platform = 'live-scrobble'`)
		.get() as { count: number };
	return row.count;
}

// Removes live-scrobbled rows (see scrobble/+server.ts) within [minPlayedAt,
// maxPlayedAt] before importing an export that covers the same range — the
// export has the real ms_played, the scrobble only an estimate (full track
// duration), so the dedup UNIQUE constraint won't catch them as the same
// play and they'd otherwise double-count. Called once per import, right
// before insertPlays.
export function deleteScrobbledRange(minPlayedAt: string, maxPlayedAt: string): number {
	const result = getDb()
		.prepare(
			`DELETE FROM plays WHERE platform = 'live-scrobble' AND played_at BETWEEN @min AND @max`
		)
		.run({ min: minPlayedAt, max: maxPlayedAt });
	return result.changes;
}

// Top tracks for one artist — powers the Top Artists drill-down expand.
export function getArtistTopTracks(
	artist: string
): { track: string; plays: number; spotifyUri: string | null }[] {
	return getDb()
		.prepare(
			`SELECT track, COUNT(*) as plays, spotify_uri as spotifyUri
			 FROM plays WHERE artist = @artist
			 GROUP BY track ORDER BY plays DESC LIMIT 5`
		)
		.all({ artist }) as { track: string; plays: number; spotifyUri: string | null }[];
}

export type OnThisDayEntry = {
	year: number;
	track: string;
	artist: string;
	spotifyUri: string | null;
	plays: number;
};

// The most-played track on `monthDay` (e.g. "07-18") in each past year —
// "on this day" rediscovery. One row per year, newest first, picking the
// year's top play if there were several different tracks that day.
export function getOnThisDay(monthDay: string, excludeYear: number): OnThisDayEntry[] {
	const rows = getDb()
		.prepare(
			`SELECT CAST(strftime('%Y', played_at) AS INTEGER) as year, track, artist,
			        spotify_uri as spotifyUri, COUNT(*) as plays
			 FROM plays
			 WHERE strftime('%m-%d', played_at) = @monthDay
			   AND CAST(strftime('%Y', played_at) AS INTEGER) != @excludeYear
			 GROUP BY year, track, artist
			 ORDER BY year DESC, plays DESC`
		)
		.all({ monthDay, excludeYear }) as OnThisDayEntry[];

	const seenYears = new Set<number>();
	const result: OnThisDayEntry[] = [];
	for (const row of rows) {
		if (seenYears.has(row.year)) continue;
		seenYears.add(row.year);
		result.push(row);
	}
	return result;
}

export type SearchResult = { track: string; artist: string; plays: number; spotifyUri: string | null };

// Simple substring search over track/artist, ranked by play count.
export function searchPlays(query: string): SearchResult[] {
	const like = `%${query}%`;
	return getDb()
		.prepare(
			`SELECT track, artist, COUNT(*) as plays, spotify_uri as spotifyUri
			 FROM plays WHERE track LIKE @like OR artist LIKE @like
			 GROUP BY track, artist ORDER BY plays DESC LIMIT 20`
		)
		.all({ like }) as SearchResult[];
}
