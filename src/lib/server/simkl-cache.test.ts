import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
	__setDbForTests,
	cacheKey,
	getCachedDetails,
	getLibrarySnapshot,
	saveLibrarySnapshot,
	upsertDetail
} from './simkl-cache';

beforeEach(() => {
	const db = new Database(':memory:');
	db.exec(`
		CREATE TABLE simkl_details (
			simkl_id INTEGER NOT NULL,
			media_type TEXT NOT NULL,
			genres TEXT NOT NULL,
			overview TEXT NOT NULL,
			runtime INTEGER,
			fetched_at TEXT NOT NULL,
			PRIMARY KEY (simkl_id, media_type)
		);
		CREATE TABLE simkl_library_snapshot (
			id INTEGER PRIMARY KEY CHECK (id = 1),
			data TEXT NOT NULL,
			fetched_at TEXT NOT NULL
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

	it('round-trips genres, overview, and runtime', () => {
		upsertDetail(1499576, 'shows', ['Action', 'Drama'], 'A survival game story.', 60);

		const result = getCachedDetails([{ simklId: 1499576, mediaType: 'shows' }]);
		const hit = result.get(cacheKey(1499576, 'shows'));

		expect(hit?.genres).toEqual(['Action', 'Drama']);
		expect(hit?.overview).toBe('A survival game story.');
		expect(hit?.runtime).toBe(60);
	});

	it('keeps shows and movies separate even with the same numeric id', () => {
		upsertDetail(71888, 'shows', ['Drama'], 'A show.', 45);
		upsertDetail(71888, 'movies', ['Romance'], 'A movie.', 110);

		const result = getCachedDetails([
			{ simklId: 71888, mediaType: 'shows' },
			{ simklId: 71888, mediaType: 'movies' }
		]);

		expect(result.get(cacheKey(71888, 'shows'))?.genres).toEqual(['Drama']);
		expect(result.get(cacheKey(71888, 'movies'))?.genres).toEqual(['Romance']);
	});

	it('overwrites an existing entry on upsert', () => {
		upsertDetail(1, 'shows', ['Drama'], 'Old overview.', 30);
		upsertDetail(1, 'shows', ['Comedy'], 'New overview.', 25);

		const hit = getCachedDetails([{ simklId: 1, mediaType: 'shows' }]).get(cacheKey(1, 'shows'));
		expect(hit?.genres).toEqual(['Comedy']);
		expect(hit?.overview).toBe('New overview.');
		expect(hit?.runtime).toBe(25);
	});

	it('handles a null runtime', () => {
		upsertDetail(2, 'shows', ['Drama'], 'No runtime known.', null);

		const hit = getCachedDetails([{ simklId: 2, mediaType: 'shows' }]).get(cacheKey(2, 'shows'));
		expect(hit?.runtime).toBeNull();
	});
});

describe('library snapshot', () => {
	it('returns null when nothing has been saved yet', () => {
		expect(getLibrarySnapshot()).toBeNull();
	});

	it('round-trips an arbitrary payload', () => {
		const library = { watching: [{ title: 'Alice in Borderland' }], completed: [] };
		saveLibrarySnapshot(library);

		const snapshot = getLibrarySnapshot<typeof library>();
		expect(snapshot?.data).toEqual(library);
		expect(snapshot?.fetchedAt).toBeTruthy();
	});

	it('overwrites the previous snapshot rather than accumulating rows', () => {
		saveLibrarySnapshot({ watching: ['old'] });
		saveLibrarySnapshot({ watching: ['new'] });

		const snapshot = getLibrarySnapshot<{ watching: string[] }>();
		expect(snapshot?.data.watching).toEqual(['new']);
	});
});
