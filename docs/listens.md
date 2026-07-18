# Listens

`/listens` shows listening stats built from Spotify's own **extended streaming history** data export — not the live API alone, which only ever exposes the last ~50 plays via `recently-played`, not historical totals.

## Getting the export

Requested from Spotify at https://support.spotify.com/us/article/understanding-your-data/ — can take up to 30 days to arrive. Ships as several JSON files, uploaded at `/spotify-import` (gated behind the same [GitHub login](auth.md) as `/notes`).

## Import & parsing

[spotify-history.ts](../src/lib/server/spotify-history.ts):`importExtendedHistoryFile` handles one uploaded file at a time:

1. Parse JSON, extract an array of play entries.
2. `parseEntries` normalizes across two export schema versions Spotify has used over the years:
   - current: `ts`, `ms_played`, `master_metadata_track_name`, `master_metadata_album_artist_name`, `master_metadata_album_album_name`, `spotify_track_uri`
   - older (`endsong_N.json`): `endTime`, `msPlayed`, `trackName`, `artistName`
   
   Podcast episodes (no track/artist metadata) and zero-length plays are skipped — this page is scoped to music, same way [Watchlist](watchlist.md) is scoped to TV/movie/anime rather than every Simkl media type.
3. Before inserting, `deleteScrobbledRange(min, max)` removes any *live-scrobbled* rows (see below) that fall within this file's date range — the export has real `ms_played`, a scrobble only an estimate (assumed full track duration), so without this step they'd double-count rather than dedupe (the `UNIQUE` constraint below doesn't consider them the same row since the values differ).
4. `insertPlays` batches an `INSERT OR IGNORE` inside a transaction.

## Idempotency

The `plays` table has `UNIQUE(played_at, spotify_uri, ms_played)` ([spotify-history-db.ts](../src/lib/server/spotify-history-db.ts)). Combined with `INSERT OR IGNORE`, re-uploading the same or an overlapping export file is always safe — already-seen rows are silently skipped rather than duplicated.

## Live scrobbling

[`/api/spotify/scrobble`](../src/routes/api/spotify/scrobble/+server.ts) polls Spotify's `recently-played` endpoint and inserts new plays with `platform: 'live-scrobble'`, filling the gap between manual exports. Meant to be hit on a schedule (every 15–30 min — any longer and Spotify's 50-play cap on that endpoint can silently drop history) via something like Coolify's Scheduled Tasks or a GitHub Actions cron.

- Gated by `?secret=<SPOTIFY_SCROBBLE_SECRET>` since it's a side-effecting (DB-writing) GET endpoint that would otherwise be publicly triggerable.
- 503s if the secret isn't configured at all; 401s on a wrong secret; 403 if the Spotify refresh token lacks the `user-read-recently-played` scope.
- `ms_played` here is only an *estimate* (`recently-played` doesn't report actual listen duration, only the track's full length) — this is exactly why step 3 above needs to happen before a real export supersedes it.

## Stats queries

All backed by SQL aggregate queries in [spotify-history-db.ts](../src/lib/server/spotify-history-db.ts) rather than in-memory JS reduction — the table can grow to tens of thousands of rows:

- `getListeningStats` — totals, first/last played, peak year/weekday, top 5 artists/tracks (optionally scoped to one year; peak year itself is always computed across all years regardless of filter).
- `getAvailableYears` / `getHeatmap` — power the year filter and a GitHub-style calendar heatmap.
- `getHourlyBreakdown` — listening-clock chart, all-time.
- `getTrackHistory` — cross-references the currently-playing track (from the live Spotify widget) against archive history ("you've played this 47 times").
- `getArtistTopTracks` — drill-down for one artist.
- `getOnThisDay` — most-played track on this calendar day in each past year, deduped to one entry per year.
- `searchPlays` — simple `LIKE` substring search over track/artist.

## Testing

[spotify-history.test.ts](../src/lib/server/spotify-history.test.ts) and [spotify-history-db.test.ts](../src/lib/server/spotify-history-db.test.ts) use the same `__setDbForTests` in-memory pattern as [notes.md](notes.md) / [watchlist.md](watchlist.md).
