import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { env } from '$env/dynamic/private';

export type Note = {
	id: number;
	title: string;
	body: string;
	x: number | null;
	y: number | null;
	tags: string;
	folder: string;
	deleted_at: string | null;
	created_at: string;
	updated_at: string;
};

export type NoteLink = {
	id: number;
	source_id: number;
	target_id: number;
	label: string | null;
	directed: number;
};

export type NoteRevision = {
	id: number;
	note_id: number;
	title: string;
	body: string;
	created_at: string;
};

const SCHEMA = `
	CREATE TABLE IF NOT EXISTS notes (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		title TEXT NOT NULL,
		body TEXT NOT NULL,
		created_at TEXT NOT NULL,
		updated_at TEXT NOT NULL
	);

	CREATE TABLE IF NOT EXISTS note_links (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		source_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
		target_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
		created_at TEXT NOT NULL,
		UNIQUE (source_id, target_id)
	);

	CREATE TABLE IF NOT EXISTS note_revisions (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		note_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
		title TEXT NOT NULL,
		body TEXT NOT NULL,
		created_at TEXT NOT NULL
	);

	CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(title, body, content='notes', content_rowid='id');
`;

// note_links stores undirected pairs with source_id < target_id so a link
// between two notes can't be inserted twice in reversed order. Directed
// links skip that normalization — A->B and B->A are meaningfully different.
function orderPair(a: number, b: number): [number, number] {
	return a < b ? [a, b] : [b, a];
}

let db: Database.Database | null = null;

function openDb(): Database.Database {
	const dbPath = env.NOTES_DB_PATH || path.join(process.cwd(), 'data', 'notes.db');
	fs.mkdirSync(path.dirname(dbPath), { recursive: true });
	const instance = new Database(dbPath);
	instance.pragma('journal_mode = WAL');
	instance.pragma('foreign_keys = ON');
	instance.exec(SCHEMA);

	const columns = instance.prepare('PRAGMA table_info(notes)').all() as { name: string }[];
	if (!columns.some((c) => c.name === 'x')) {
		instance.exec('ALTER TABLE notes ADD COLUMN x REAL');
	}
	if (!columns.some((c) => c.name === 'y')) {
		instance.exec('ALTER TABLE notes ADD COLUMN y REAL');
	}
	if (!columns.some((c) => c.name === 'tags')) {
		instance.exec("ALTER TABLE notes ADD COLUMN tags TEXT NOT NULL DEFAULT ''");
	}
	if (!columns.some((c) => c.name === 'folder')) {
		instance.exec("ALTER TABLE notes ADD COLUMN folder TEXT NOT NULL DEFAULT ''");
	}
	if (!columns.some((c) => c.name === 'deleted_at')) {
		instance.exec('ALTER TABLE notes ADD COLUMN deleted_at TEXT');
	}

	const linkColumns = instance.prepare('PRAGMA table_info(note_links)').all() as {
		name: string;
	}[];
	if (!linkColumns.some((c) => c.name === 'label')) {
		instance.exec('ALTER TABLE note_links ADD COLUMN label TEXT');
	}
	if (!linkColumns.some((c) => c.name === 'directed')) {
		instance.exec('ALTER TABLE note_links ADD COLUMN directed INTEGER NOT NULL DEFAULT 0');
	}

	// notes_fts is an external-content FTS5 index (no text of its own), so
	// pre-existing rows from before this table existed need a one-time
	// backfill. Safe to run every startup — only inserts rows still missing.
	instance.exec(`
		INSERT INTO notes_fts(rowid, title, body)
		SELECT id, title, body FROM notes
		WHERE deleted_at IS NULL AND id NOT IN (SELECT rowid FROM notes_fts)
	`);

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

function ftsDelete(id: number, title: string, body: string): void {
	getDb()
		.prepare("INSERT INTO notes_fts(notes_fts, rowid, title, body) VALUES ('delete', ?, ?, ?)")
		.run(id, title, body);
}

function ftsInsert(id: number, title: string, body: string): void {
	getDb().prepare('INSERT INTO notes_fts(rowid, title, body) VALUES (?, ?, ?)').run(id, title, body);
}

export function listNotes(): Pick<Note, 'id' | 'title' | 'updated_at'>[] {
	return getDb()
		.prepare('SELECT id, title, updated_at FROM notes WHERE deleted_at IS NULL ORDER BY updated_at DESC')
		.all() as Pick<Note, 'id' | 'title' | 'updated_at'>[];
}

// Bypasses the deleted_at filter — used internally by delete/undo, which
// need to read a note regardless of its current soft-delete state.
function getNoteRaw(id: number): Note | undefined {
	return getDb().prepare('SELECT * FROM notes WHERE id = ?').get(id) as Note | undefined;
}

export function getNote(id: number): Note | undefined {
	const note = getNoteRaw(id);
	return note && !note.deleted_at ? note : undefined;
}

export function searchNotes(query: string): Pick<Note, 'id' | 'title' | 'updated_at'>[] {
	const terms = query
		.trim()
		.split(/\s+/)
		.filter(Boolean)
		.map((w) => `${w.replace(/["*]/g, '')}*`);
	if (terms.length === 0) return [];
	return getDb()
		.prepare(
			`SELECT n.id, n.title, n.updated_at
			 FROM notes_fts
			 JOIN notes n ON n.id = notes_fts.rowid
			 WHERE notes_fts MATCH ? AND n.deleted_at IS NULL
			 ORDER BY rank
			 LIMIT 20`
		)
		.all(terms.join(' ')) as Pick<Note, 'id' | 'title' | 'updated_at'>[];
}

export function createNote(data: {
	title: string;
	body: string;
	x?: number;
	y?: number;
	tags?: string;
	folder?: string;
}): Note {
	const now = new Date().toISOString();
	const result = getDb()
		.prepare(
			'INSERT INTO notes (title, body, x, y, tags, folder, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
		)
		.run(
			data.title,
			data.body,
			data.x ?? null,
			data.y ?? null,
			data.tags ?? '',
			data.folder ?? '',
			now,
			now
		);
	const id = result.lastInsertRowid as number;
	ftsInsert(id, data.title, data.body);
	return getNote(id)!;
}

export function listNotesForGraph(): Pick<
	Note,
	'id' | 'title' | 'x' | 'y' | 'tags' | 'folder' | 'updated_at'
>[] {
	return getDb()
		.prepare(
			'SELECT id, title, x, y, tags, folder, updated_at FROM notes WHERE deleted_at IS NULL ORDER BY id ASC'
		)
		.all() as Pick<Note, 'id' | 'title' | 'x' | 'y' | 'tags' | 'folder' | 'updated_at'>[];
}

export function updateNotePosition(id: number, x: number, y: number): void {
	getDb().prepare('UPDATE notes SET x = ?, y = ? WHERE id = ?').run(x, y, id);
}

export function listLinks(): NoteLink[] {
	return getDb()
		.prepare('SELECT id, source_id, target_id, label, directed FROM note_links')
		.all() as NoteLink[];
}

export function createLink(
	a: number,
	b: number,
	label?: string,
	directed?: boolean
): NoteLink | undefined {
	if (a === b) return undefined;
	const [source_id, target_id] = directed ? [a, b] : orderPair(a, b);
	const now = new Date().toISOString();
	getDb()
		.prepare(
			'INSERT OR IGNORE INTO note_links (source_id, target_id, label, directed, created_at) VALUES (?, ?, ?, ?, ?)'
		)
		.run(source_id, target_id, label ?? null, directed ? 1 : 0, now);
	return getDb()
		.prepare(
			'SELECT id, source_id, target_id, label, directed FROM note_links WHERE source_id = ? AND target_id = ?'
		)
		.get(source_id, target_id) as NoteLink | undefined;
}

export function updateLinkLabel(id: number, label: string): void {
	getDb()
		.prepare('UPDATE note_links SET label = ? WHERE id = ?')
		.run(label.trim() ? label.trim() : null, id);
}

export function deleteLink(id: number): void {
	getDb().prepare('DELETE FROM note_links WHERE id = ?').run(id);
}

// Revisions snapshot the *previous* state right before an update overwrites
// it, throttled to once per 2 minutes per note so autosave (which fires on
// every ~1s pause while typing) doesn't flood the table.
function shouldSnapshot(noteId: number): boolean {
	const last = getDb()
		.prepare('SELECT created_at FROM note_revisions WHERE note_id = ? ORDER BY id DESC LIMIT 1')
		.get(noteId) as { created_at: string } | undefined;
	if (!last) return true;
	return Date.now() - new Date(last.created_at).getTime() > 2 * 60 * 1000;
}

export function updateNote(
	id: number,
	data: { title: string; body: string; tags?: string; folder?: string }
): Note | undefined {
	const now = new Date().toISOString();
	const old = getNoteRaw(id);
	if (!old) return undefined;

	const contentChanged = old.title !== data.title || old.body !== data.body;
	if (contentChanged && shouldSnapshot(id)) {
		getDb()
			.prepare(
				'INSERT INTO note_revisions (note_id, title, body, created_at) VALUES (?, ?, ?, ?)'
			)
			.run(id, old.title, old.body, old.updated_at);
	}

	const tags = data.tags ?? old.tags;
	const folder = data.folder ?? old.folder;
	getDb()
		.prepare('UPDATE notes SET title = ?, body = ?, tags = ?, folder = ?, updated_at = ? WHERE id = ?')
		.run(data.title, data.body, tags, folder, now, id);

	if (contentChanged) {
		ftsDelete(id, old.title, old.body);
		ftsInsert(id, data.title, data.body);
	}

	return getNote(id);
}

export function listRevisions(noteId: number): Pick<NoteRevision, 'id' | 'title' | 'created_at'>[] {
	return getDb()
		.prepare(
			'SELECT id, title, created_at FROM note_revisions WHERE note_id = ? ORDER BY id DESC LIMIT 20'
		)
		.all(noteId) as Pick<NoteRevision, 'id' | 'title' | 'created_at'>[];
}

export function getRevision(id: number): NoteRevision | undefined {
	return getDb().prepare('SELECT * FROM note_revisions WHERE id = ?').get(id) as
		| NoteRevision
		| undefined;
}

export function restoreRevision(revisionId: number): Note | undefined {
	const revision = getRevision(revisionId);
	if (!revision) return undefined;
	return updateNote(revision.note_id, { title: revision.title, body: revision.body });
}

// Soft delete: keeps the row (and its links/revisions) so a same-session
// "Undo" can restore it. There's no purge job — at this app's single-user
// scale a handful of soft-deleted rows lingering forever costs nothing.
export function deleteNote(id: number): void {
	const note = getNoteRaw(id);
	if (!note) return;
	getDb().prepare('UPDATE notes SET deleted_at = ? WHERE id = ?').run(new Date().toISOString(), id);
	ftsDelete(id, note.title, note.body);
}

export function undoDeleteNote(id: number): Note | undefined {
	const note = getNoteRaw(id);
	if (!note || !note.deleted_at) return undefined;
	getDb().prepare('UPDATE notes SET deleted_at = NULL WHERE id = ?').run(id);
	ftsInsert(id, note.title, note.body);
	return getNote(id);
}
