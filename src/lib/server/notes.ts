import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { env } from '$env/dynamic/private';

export type Note = {
	id: number;
	title: string;
	body: string;
	created_at: string;
	updated_at: string;
};

const SCHEMA = `
	CREATE TABLE IF NOT EXISTS notes (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		title TEXT NOT NULL,
		body TEXT NOT NULL,
		created_at TEXT NOT NULL,
		updated_at TEXT NOT NULL
	)
`;

let db: Database.Database | null = null;

function openDb(): Database.Database {
	const dbPath = env.NOTES_DB_PATH || path.join(process.cwd(), 'data', 'notes.db');
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

// Test-only escape hatch so notes.test.ts can point at an in-memory database
// instead of the real on-disk one — mirrors the "keep it minimal" spirit of
// content.ts rather than building a full DI container for a single-user table.
export function __setDbForTests(instance: Database.Database | null): void {
	db = instance;
}

export function listNotes(): Pick<Note, 'id' | 'title' | 'updated_at'>[] {
	return getDb()
		.prepare('SELECT id, title, updated_at FROM notes ORDER BY updated_at DESC')
		.all() as Pick<Note, 'id' | 'title' | 'updated_at'>[];
}

export function getNote(id: number): Note | undefined {
	return getDb().prepare('SELECT * FROM notes WHERE id = ?').get(id) as Note | undefined;
}

export function createNote(data: { title: string; body: string }): Note {
	const now = new Date().toISOString();
	const result = getDb()
		.prepare('INSERT INTO notes (title, body, created_at, updated_at) VALUES (?, ?, ?, ?)')
		.run(data.title, data.body, now, now);
	return getNote(result.lastInsertRowid as number)!;
}

export function updateNote(id: number, data: { title: string; body: string }): Note | undefined {
	const now = new Date().toISOString();
	getDb()
		.prepare('UPDATE notes SET title = ?, body = ?, updated_at = ? WHERE id = ?')
		.run(data.title, data.body, now, id);
	return getNote(id);
}

export function deleteNote(id: number): void {
	getDb().prepare('DELETE FROM notes WHERE id = ?').run(id);
}
