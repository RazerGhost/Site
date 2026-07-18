import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { __setDbForTests } from './spotify-history-db';
import { importExtendedHistoryFile } from './spotify-history';

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

describe('importExtendedHistoryFile', () => {
	it('rejects invalid JSON', () => {
		const result = importExtendedHistoryFile('not json');
		expect(result.error).toBe('Not valid JSON.');
		expect(result.inserted).toBe(0);
	});

	it('parses the current export format', () => {
		const json = JSON.stringify([
			{
				ts: '2025-06-01T12:00:00Z',
				ms_played: 210000,
				master_metadata_track_name: 'Song A',
				master_metadata_album_artist_name: 'Artist A',
				master_metadata_album_album_name: 'Album A',
				spotify_track_uri: 'spotify:track:abc',
				platform: 'android',
				shuffle: true,
				skipped: false
			}
		]);

		const result = importExtendedHistoryFile(json);
		expect(result.error).toBeNull();
		expect(result.parsed).toBe(1);
		expect(result.inserted).toBe(1);
	});

	it('parses the older endsong_N.json format', () => {
		const json = JSON.stringify([
			{
				endTime: '2020-01-01 12:00',
				msPlayed: 150000,
				trackName: 'Old Song',
				artistName: 'Old Artist'
			}
		]);

		const result = importExtendedHistoryFile(json);
		expect(result.error).toBeNull();
		expect(result.inserted).toBe(1);
	});

	it('skips podcast episodes and zero-length entries', () => {
		const json = JSON.stringify([
			{ ts: '2025-06-01T12:00:00Z', ms_played: 0, master_metadata_track_name: 'Song A', master_metadata_album_artist_name: 'Artist A' },
			{ ts: '2025-06-01T13:00:00Z', ms_played: 60000, episode_name: 'Some Podcast Episode', episode_show_name: 'A Show' }
		]);

		const result = importExtendedHistoryFile(json);
		expect(result.parsed).toBe(0);
		expect(result.error).toBe('No music plays found in this file.');
	});

	it('deduplicates across two imports of overlapping data', () => {
		const json = JSON.stringify([
			{
				ts: '2025-06-01T12:00:00Z',
				ms_played: 200000,
				master_metadata_track_name: 'Song A',
				master_metadata_album_artist_name: 'Artist A',
				spotify_track_uri: 'spotify:track:abc'
			}
		]);

		const first = importExtendedHistoryFile(json);
		const second = importExtendedHistoryFile(json);
		expect(first.inserted).toBe(1);
		expect(second.inserted).toBe(0);
	});
});
