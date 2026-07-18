import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { __setDbForTests, cacheKey, getCachedDetails, upsertDetail } from './simkl-cache';

beforeEach(() => {
	const db = new Database(':memory:');
	db.exec(`
		CREATE TABLE simkl_details (
			simkl_id INTEGER NOT NULL,
			media_type TEXT NOT NULL,
			genres TEXT NOT NULL,
			overview TEXT NOT NULL,
			fetched_at TEXT NOT NULL,
			PRIMARY KEY (simkl_id, media_type)
		)
	`);
	__setDbForTests(db);
});

afterEach(() => {
	__setDbForTests(null);
});

describe('simkl details cache', () => {
	it('returns nothing for an uncached key', () => {
		const result = getCachedDetails([{ simklId: 1, mediaType: 'shows' }]);
		expect(result.size).toBe(0);
	});

	it('round-trips genres and overview', () => {
		upsertDetail(1499576, 'shows', ['Action', 'Drama'], 'A survival game story.');

		const result = getCachedDetails([{ simklId: 1499576, mediaType: 'shows' }]);
		const hit = result.get(cacheKey(1499576, 'shows'));

		expect(hit?.genres).toEqual(['Action', 'Drama']);
		expect(hit?.overview).toBe('A survival game story.');
	});

	it('keeps shows and movies separate even with the same numeric id', () => {
		upsertDetail(71888, 'shows', ['Drama'], 'A show.');
		upsertDetail(71888, 'movies', ['Romance'], 'A movie.');

		const result = getCachedDetails([
			{ simklId: 71888, mediaType: 'shows' },
			{ simklId: 71888, mediaType: 'movies' }
		]);

		expect(result.get(cacheKey(71888, 'shows'))?.genres).toEqual(['Drama']);
		expect(result.get(cacheKey(71888, 'movies'))?.genres).toEqual(['Romance']);
	});

	it('overwrites an existing entry on upsert', () => {
		upsertDetail(1, 'shows', ['Drama'], 'Old overview.');
		upsertDetail(1, 'shows', ['Comedy'], 'New overview.');

		const hit = getCachedDetails([{ simklId: 1, mediaType: 'shows' }]).get(cacheKey(1, 'shows'));
		expect(hit?.genres).toEqual(['Comedy']);
		expect(hit?.overview).toBe('New overview.');
	});
});
