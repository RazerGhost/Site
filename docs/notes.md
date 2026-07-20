# Notes

`/notes` is a private, single-user note-taking area (graph-style, with tags/folders) gated behind [auth](auth.md). Backed by SQLite via [notes.ts](../src/lib/server/notes.ts).

## Schema

- **`notes`** — `id, title, body, x, y, tags, folder, deleted_at, created_at, updated_at`. `x`/`y` persist node position on the graph view. `tags`/`folder` are added via `ALTER TABLE` migrations run at every startup (see `openDb`) rather than a migration framework — each column addition checks `PRAGMA table_info` first so it's idempotent across restarts.
- **`note_links`** — edges between notes, `source_id, target_id, label, directed`. Undirected links are normalized so `source_id < target_id` (`orderPair`), preventing a duplicate reverse-direction insert; directed links skip that normalization since A→B and B→A are meaningfully different.
- **`note_revisions`** — snapshots of a note's previous `title`/`body` right before an overwrite.
- **`notes_fts`** — an FTS5 virtual table (external-content, backed by `notes`) for full-text search.

## Full-text search

`searchNotes` splits the query into words, appends `*` to each for prefix matching, and joins them as an FTS5 `MATCH` query, ranked by FTS5's built-in `rank`. Deleted notes (`deleted_at IS NOT NULL`) are excluded via a join back to `notes`.

The FTS index is kept in sync manually — `ftsInsert`/`ftsDelete` are called explicitly from `createNote`, `updateNote` (only when title/body actually changed), and `deleteNote`/`undoDeleteNote` — there's no SQLite trigger doing this automatically. On startup, a one-time backfill (`INSERT INTO notes_fts ... WHERE id NOT IN (...)`) catches any row inserted before the FTS table existed; safe to run every boot since it only touches missing rows.

## Revisions

`updateNote` snapshots the *old* title/body into `note_revisions` before applying an update, but only if:
- the content actually changed (`contentChanged`), and
- `shouldSnapshot` says more than 2 minutes have passed since the last revision for that note.

That throttle exists because the notes editor autosaves on every ~1s typing pause — without it, a single editing session would flood the revisions table. `restoreRevision` just calls `updateNote` with the revision's old title/body, which itself creates a new revision of the *current* state first (so restoring is itself undoable).

## Soft delete

`deleteNote` sets `deleted_at` rather than removing the row, and removes it from the FTS index. `undoDeleteNote` clears `deleted_at` and re-adds it to FTS. There's no purge job — at single-user scale, a handful of soft-deleted rows lingering forever costs nothing, so this was a deliberate scope cut rather than an oversight.

## Attachments

Images pasted/uploaded into note bodies go through `src/routes/api/notes/attachments/+server.ts` to a directory configured by `NOTES_ATTACHMENTS_DIR` (default `./data/note-attachments`), served back via `src/routes/notes/files/[filename]/+server.ts` — gated behind the same login as `/notes`, since attachments are private. The `/admin/media` library ([environment.md#media_dir](environment.md)) is a sibling pattern for images that need to be *publicly* viewable (devlog/project covers, galleries, body images) — same shape, but served without auth.

## Testing

[notes.test.ts](../src/lib/server/notes.test.ts) uses `__setDbForTests` to point the module at an in-memory `better-sqlite3` instance instead of the real on-disk file — a deliberate minimal escape hatch rather than a full DI container, since this is a single-table-family module used by one route family.
