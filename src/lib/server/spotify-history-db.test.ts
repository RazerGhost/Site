import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { __setDbForTests, getListeningStats, insertPlays } from './spotify-history-db';
import type { PlayRecord } from './spotify-history-db';

beforeEach(() => {
	const db = new Database(':memory:');
	db.exec(`
		CREATE TABLE plays (
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
		)
	`);
	__setDbForTests(db);
});

afterEach(() => {
	__setDbForTests(null);
});

function play(overrides: Partial<PlayRecord> = {}): PlayRecord {
	return {
		playedAt: '2025-06-01T12:00:00.000Z',
		msPlayed: 180000,
		track: 'Song A',
		artist: 'Artist A',
		album: 'Album A',
		spotifyUri: 'spotify:track:abc',
		platform: 'windows',
		shuffle: false,
		skipped: false,
		...overrides
	};
}

describe('insertPlays', () => {
	it('inserts new rows and reports the count', () => {
		const { inserted } = insertPlays([play(), play({ playedAt: '2025-06-01T12:05:00.000Z' })]);
		expect(inserted).toBe(2);
	});

	it('ignores exact duplicates on re-import', () => {
		insertPlays([play()]);
		const { inserted } = insertPlays([play()]);
		expect(inserted).toBe(0);
	});

	it('treats plays with different timestamps as distinct', () => {
		insertPlays([play()]);
		const { inserted } = insertPlays([play({ playedAt: '2025-06-02T12:00:00.000Z' })]);
		expect(inserted).toBe(1);
	});
});

describe('getListeningStats', () => {
	it('returns zeroed stats for an empty library', () => {
		const stats = getListeningStats();
		expect(stats.totalPlays).toBe(0);
		expect(stats.totalMsPlayed).toBe(0);
		expect(stats.firstPlayedAt).toBeNull();
		expect(stats.peakYear).toBeNull();
		expect(stats.topArtists).toEqual([]);
	});

	it('aggregates totals, top artists, and top tracks', () => {
		insertPlays([
			play({ playedAt: '2025-06-01T12:00:00.000Z', artist: 'Artist A', track: 'Song A', msPlayed: 200000 }),
			play({ playedAt: '2025-06-01T13:00:00.000Z', artist: 'Artist A', track: 'Song A', msPlayed: 200000, spotifyUri: 'spotify:track:abc2' }),
			play({ playedAt: '2025-06-02T13:00:00.000Z', artist: 'Artist B', track: 'Song B', msPlayed: 100000, spotifyUri: 'spotify:track:def' })
		]);

		const stats = getListeningStats();
		expect(stats.totalPlays).toBe(3);
		expect(stats.totalMsPlayed).toBe(500000);
		expect(stats.topArtists[0]).toMatchObject({ artist: 'Artist A', plays: 2 });
		expect(stats.topTracks[0]).toMatchObject({ track: 'Song A', artist: 'Artist A', plays: 2 });
	});

	it('finds the peak year and weekday', () => {
		// 2025-06-01 is a Sunday (weekday 0); stack three plays there vs one elsewhere.
		insertPlays([
			play({ playedAt: '2025-06-01T10:00:00.000Z', spotifyUri: 'a' }),
			play({ playedAt: '2025-06-01T11:00:00.000Z', spotifyUri: 'b' }),
			play({ playedAt: '2025-06-01T12:00:00.000Z', spotifyUri: 'c' }),
			play({ playedAt: '2024-01-02T12:00:00.000Z', spotifyUri: 'd' })
		]);

		const stats = getListeningStats();
		expect(stats.peakYear).toBe(2025);
		expect(stats.peakWeekday).toBe(0);
	});
});
