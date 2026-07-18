import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
	__setDbForTests,
	getListeningStats,
	insertPlays,
	getAvailableYears,
	getHeatmap,
	getHourlyBreakdown,
	getTrackHistory,
	searchPlays,
	getOnThisDay
} from './spotify-history-db';
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

	it('filters totals and top lists by year', () => {
		insertPlays([
			play({ playedAt: '2025-06-01T12:00:00.000Z', artist: 'Artist A', spotifyUri: 'a' }),
			play({ playedAt: '2024-01-02T12:00:00.000Z', artist: 'Artist B', spotifyUri: 'b' })
		]);

		const stats2025 = getListeningStats({ year: 2025 });
		expect(stats2025.totalPlays).toBe(1);
		expect(stats2025.topArtists).toEqual([expect.objectContaining({ artist: 'Artist A' })]);
	});
});

describe('getAvailableYears', () => {
	it('returns distinct years, newest first', () => {
		insertPlays([
			play({ playedAt: '2023-01-01T00:00:00.000Z', spotifyUri: 'a' }),
			play({ playedAt: '2025-01-01T00:00:00.000Z', spotifyUri: 'b' }),
			play({ playedAt: '2023-06-01T00:00:00.000Z', spotifyUri: 'c' })
		]);
		expect(getAvailableYears()).toEqual([2025, 2023]);
	});
});

describe('getHeatmap', () => {
	it('groups plays by day within a year', () => {
		insertPlays([
			play({ playedAt: '2025-06-01T10:00:00.000Z', spotifyUri: 'a' }),
			play({ playedAt: '2025-06-01T11:00:00.000Z', spotifyUri: 'b' }),
			play({ playedAt: '2025-06-02T10:00:00.000Z', spotifyUri: 'c' }),
			play({ playedAt: '2024-06-02T10:00:00.000Z', spotifyUri: 'd' })
		]);
		expect(getHeatmap(2025)).toEqual([
			{ date: '2025-06-01', plays: 2 },
			{ date: '2025-06-02', plays: 1 }
		]);
	});
});

describe('getHourlyBreakdown', () => {
	it('groups plays by hour of day', () => {
		insertPlays([
			play({ playedAt: '2025-06-01T10:15:00.000Z', spotifyUri: 'a' }),
			play({ playedAt: '2025-06-02T10:45:00.000Z', spotifyUri: 'b' })
		]);
		expect(getHourlyBreakdown()).toEqual([{ hour: 10, plays: 2 }]);
	});
});

describe('getTrackHistory', () => {
	it('returns null for an unknown uri', () => {
		expect(getTrackHistory('spotify:track:missing')).toBeNull();
	});

	it('returns play count and date range for a known uri', () => {
		insertPlays([
			play({ playedAt: '2024-01-01T00:00:00.000Z', spotifyUri: 'spotify:track:abc' }),
			play({ playedAt: '2025-01-01T00:00:00.000Z', spotifyUri: 'spotify:track:abc' })
		]);
		expect(getTrackHistory('spotify:track:abc')).toMatchObject({
			plays: 2,
			firstPlayedAt: '2024-01-01T00:00:00.000Z',
			lastPlayedAt: '2025-01-01T00:00:00.000Z'
		});
	});
});

describe('getOnThisDay', () => {
	it('returns the top-played track per past year matching the given month-day', () => {
		insertPlays([
			play({ playedAt: '2023-07-18T10:00:00.000Z', track: 'Song A', spotifyUri: 'a' }),
			play({ playedAt: '2023-07-18T11:00:00.000Z', track: 'Song A', spotifyUri: 'a' }),
			play({ playedAt: '2023-07-18T12:00:00.000Z', track: 'Song B', spotifyUri: 'b' }),
			play({ playedAt: '2022-07-18T09:00:00.000Z', track: 'Song C', spotifyUri: 'c' }),
			play({ playedAt: '2023-07-19T09:00:00.000Z', track: 'Song D', spotifyUri: 'd' }), // wrong day
			play({ playedAt: '2025-07-18T09:00:00.000Z', track: 'Song E', spotifyUri: 'e' }) // excluded year
		]);

		const result = getOnThisDay('07-18', 2025);
		expect(result).toEqual([
			expect.objectContaining({ year: 2023, track: 'Song A', plays: 2 }),
			expect.objectContaining({ year: 2022, track: 'Song C', plays: 1 })
		]);
	});

	it('returns an empty list when nothing matches', () => {
		expect(getOnThisDay('01-01', 2025)).toEqual([]);
	});
});

describe('searchPlays', () => {
	it('matches by track or artist substring, ranked by plays', () => {
		insertPlays([
			play({ track: 'Song A', artist: 'Zeta', spotifyUri: 'a' }),
			play({ track: 'Song A', artist: 'Zeta', spotifyUri: 'a', playedAt: '2025-06-02T12:00:00.000Z' }),
			play({ track: 'Other', artist: 'Alpha Band', spotifyUri: 'b' })
		]);
		expect(searchPlays('a')).toEqual([
			expect.objectContaining({ track: 'Song A', plays: 2 }),
			expect.objectContaining({ track: 'Other', plays: 1 })
		]);
	});
});
