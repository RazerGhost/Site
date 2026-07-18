import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { __setDbForTests, createNote, deleteNote, getNote, listNotes, updateNote } from './notes';

beforeEach(() => {
	vi.useFakeTimers();
	const db = new Database(':memory:');
	db.exec(`
		CREATE TABLE notes (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title TEXT NOT NULL,
			body TEXT NOT NULL,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL
		)
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

	it('deletes a note', () => {
		const note = createNote({ title: 'Gone soon', body: '...' });
		deleteNote(note.id);
		expect(getNote(note.id)).toBeUndefined();
	});
});
