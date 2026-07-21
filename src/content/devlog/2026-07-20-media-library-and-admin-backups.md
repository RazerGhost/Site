---
title: A media library, an admin area that feels like one, and backups that diff
date: 2026-07-20
tags: [admin, sqlite, backups, media]
excerpt: Three admin-area gaps that all trace back to the same root cause — nothing here persisted or gave feedback the way it should — and the git-based backup job that ties them together.
---

Three separate admin-area problems, fixed in quick succession, that turned
out to share one root cause: the private tooling around this site had grown
faster than its plumbing.

## Images had nowhere real to live

The devlog and project editors' cover/gallery fields were plain text paths —
whatever you typed had to already exist under `static/`, which meant
manually dropping a file into the repo before you could reference it. That's
fine for a handful of images added at commit time, and useless from a
running prod session: `static/` is baked into the Docker image at build
time, so anything added there doesn't survive a redeploy and can't be
touched by the running server at all.

The fix mirrors a pattern the site already had for note attachments: a media
library backed by the persistent data volume. [`media.ts`](src/lib/server/media.ts)
is deliberately small — save/list/delete against a `data/media/` directory,
filenames are `{uuid}-{slugified-original-name}.{ext}` so collisions can't
happen and the original name survives for readability, uploads are capped at
8MB and restricted to PNG/JPEG/GIF/WebP by MIME type. An admin-gated API
route handles upload/list/delete, a public `/media/[filename]` route serves
the files, and `/admin/media` is a browsable explorer with drag-and-drop
upload and multi-select bulk delete. A `MediaPicker` component then plugs
into the devlog/project cover field, the gallery field (multi-select), and
the post body itself.

## The admin area itself needed the same care its data model got

Once there was real functionality worth protecting, the rough edges around
it stood out more: no link back to the dashboard from any sub-page, saves
that did a silent full-page reload with no confirmation, deletes gated by a
native `window.confirm()`, and nothing to filter with once the devlog/project
lists grew past a handful of entries. All fixed together — a shared
`+layout.svelte` with a back-to-dashboard link, `use:enhance`-based save
feedback instead of relying on the reload itself as confirmation, a reusable
`ConfirmDialog` component, and client-side filter/sort on the list and
watchlist-cache pages. Small, but it's the difference between an admin area
that feels maintained and one that just happens to work.

## Backups that diff instead of just existing

The persistent Coolify volume protects `data/` across a redeploy, but not
against losing the server itself — a host failure, a bad migration, a fat
finger against the volume. `/api/backup` (same secret-gated, hit-on-a-schedule
pattern as the Spotify scrobble endpoint) closes that gap by dumping the
SQLite databases and pushing them to a private git repo.

The interesting decision is *how* it dumps them. Committing the raw `.db`
files would work, but SQLite's on-disk format means a single changed row can
shuffle bytes across the whole file — every backup would look like a full
rewrite in `git diff`, and years of backups would compress and diff badly.
Instead, [`dumpDatabaseToSql`](src/lib/server/backup.ts) reproduces what
`sqlite3 <file> .dump` does: schema statements plus one `INSERT` per row, in
plain text. Two details made that not-quite-trivial:

- `pragma_table_list()` distinguishes real tables from FTS5's internal
  shadow tables (`notes_fts_data`, `notes_fts_config`, etc.) — those have
  reserved names SQLite refuses to `CREATE`/`INSERT` into directly, and
  they're rebuilt automatically alongside their parent virtual table, so
  they have to be skipped rather than dumped.
- Virtual tables themselves (the FTS5 index) hold no data of their own to
  dump — only their schema statement is written; the app backfills the
  index from the real table on next startup anyway.

The result: five SQLite databases (`notes`, `simkl-cache`, `spotify-history`,
`status`, `newtab-settings`) as five `.sql` files, plus the note-attachments
and media directories copied wholesale, all committed to a fresh temp clone
of the backup repo and pushed. `git status --porcelain` after staging tells
it whether anything actually changed — a no-op run skips the commit instead
of creating an empty one every time the schedule fires. `/admin/backups`
surfaces the last commit's timestamp (read via a shallow clone of the backup
branch, no extra state of its own needed) and a "run backup now" button for
out-of-band peace of mind.
