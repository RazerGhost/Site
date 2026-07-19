import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	__setDbForTests,
	createLink,
	createNote,
	deleteNote,
	getNote,
	listNotes,
	listRevisions,
	restoreRevision,
	searchNotes,
	undoDeleteNote,
	updateNote
} from './notes';

beforeEach(() => {
	vi.useFakeTimers();
	const db = new Database(':memory:');
	db.exec(`
		CREATE TABLE notes (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title TEXT NOT NULL,
			body TEXT NOT NULL,
			x REAL,
			y REAL,
			tags TEXT NOT NULL DEFAULT '',
			folder TEXT NOT NULL DEFAULT '',
			deleted_at TEXT,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL
		);
		CREATE TABLE note_links (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			source_id INTEGER NOT NULL,
			target_id INTEGER NOT NULL,
			label TEXT,
			directed INTEGER NOT NULL DEFAULT 0,
			created_at TEXT NOT NULL,
			UNIQUE (source_id, target_id)
		);
		CREATE TABLE note_revisions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			note_id INTEGER NOT NULL,
			title TEXT NOT NULL,
			body TEXT NOT NULL,
			created_at TEXT NOT NULL
		);
		CREATE VIRTUAL TABLE notes_fts USING fts5(title, body, content='notes', content_rowid='id');
	`);
	__setDbForTests(db);
});

afterEach(() => {
	__setDbForTests(null);
	vi.useRealTimers();
});

describe('notes CRUD', () => {
	it('creates and retrieves a note', () => {
		const note = createNote({ title: 'Hello', body: 'World' });
		expect(getNote(note.id)).toMatchObject({ title: 'Hello', body: 'World' });
	});

	it('lists notes most-recently-updated first', () => {
		const first = createNote({ title: 'First', body: '...' });
		vi.advanceTimersByTime(1000);
		const second = createNote({ title: 'Second', body: '...' });
		vi.advanceTimersByTime(1000);
		updateNote(first.id, { title: 'First (edited)', body: '...' });

		const listed = listNotes();
		expect(listed.map((n) => n.id)).toEqual([first.id, second.id]);
	});

	it('updates a note and bumps updated_at', () => {
		const note = createNote({ title: 'Title', body: 'Body' });
		vi.advanceTimersByTime(1000);
		const updated = updateNote(note.id, { title: 'New title', body: 'New body' });

		expect(updated?.title).toBe('New title');
		expect(updated?.updated_at).not.toBe(note.updated_at);
		expect(updated?.created_at).toBe(note.created_at);
	});

	it('soft-deletes a note and undo restores it', () => {
		const note = createNote({ title: 'Gone soon', body: '...' });
		deleteNote(note.id);
		expect(getNote(note.id)).toBeUndefined();
		expect(listNotes().map((n) => n.id)).not.toContain(note.id);

		const restored = undoDeleteNote(note.id);
		expect(restored?.id).toBe(note.id);
		expect(getNote(note.id)).toMatchObject({ title: 'Gone soon' });
	});
});

describe('search', () => {
	it('finds notes by title or body content', () => {
		createNote({ title: 'Recipe', body: 'A great pasta dish' });
		createNote({ title: 'Shopping list', body: 'Milk, eggs' });

		expect(searchNotes('pasta').map((n) => n.title)).toEqual(['Recipe']);
		expect(searchNotes('shopping').map((n) => n.title)).toEqual(['Shopping list']);
	});

	it('excludes deleted notes from search results', () => {
		const note = createNote({ title: 'Recipe', body: 'A great pasta dish' });
		deleteNote(note.id);
		expect(searchNotes('pasta')).toEqual([]);
	});

	it('does not duplicate the search index when a soft-deleted note is edited then restored', () => {
		const note = createNote({ title: 'Recipe', body: 'A great pasta dish' });
		deleteNote(note.id);
		// e.g. restoreRevision or a stale editor tab writing to a deleted note —
		// it isn't in the FTS index at this point, so this must not re-index it.
		updateNote(note.id, { title: 'Recipe', body: 'An even better pasta dish' });
		undoDeleteNote(note.id);
		expect(searchNotes('pasta').map((n) => n.id)).toEqual([note.id]);
	});
});

describe('revisions', () => {
	it('snapshots the previous content on update and can restore it', () => {
		const note = createNote({ title: 'v1', body: 'first draft' });
		vi.advanceTimersByTime(3 * 60 * 1000);
		updateNote(note.id, { title: 'v2', body: 'second draft' });

		const revisions = listRevisions(note.id);
		expect(revisions).toHaveLength(1);
		expect(revisions[0].title).toBe('v1');

		const restored = restoreRevision(revisions[0].id);
		expect(restored?.title).toBe('v1');
		expect(restored?.body).toBe('first draft');
	});

	it('throttles snapshots to once per 2 minutes per note', () => {
		const note = createNote({ title: 'v1', body: 'first' });
		updateNote(note.id, { title: 'v2', body: 'second' });
		updateNote(note.id, { title: 'v3', body: 'third' });

		expect(listRevisions(note.id)).toHaveLength(1);
	});
});

describe('links', () => {
	it('normalizes undirected links regardless of argument order', () => {
		const a = createNote({ title: 'A', body: '' });
		const b = createNote({ title: 'B', body: '' });
		const link = createLink(b.id, a.id);
		expect(link?.source_id).toBe(a.id);
		expect(link?.target_id).toBe(b.id);
	});

	it('preserves direction for directed links', () => {
		const a = createNote({ title: 'A', body: '' });
		const b = createNote({ title: 'B', body: '' });
		const link = createLink(b.id, a.id, undefined, true);
		expect(link?.source_id).toBe(b.id);
		expect(link?.target_id).toBe(a.id);
		expect(link?.directed).toBe(1);
	});
});
