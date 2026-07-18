# Watchlist

`/watchlist` shows currently-watching + full library (TV/anime/movies), sourced from [Simkl](https://simkl.com). Two SQLite-backed layers sit behind the live API: a per-title detail cache, and a full-library fallback snapshot.

## Fetching the library

`getLibrary()` in [simkl.ts](../src/lib/server/simkl.ts) calls Simkl's `sync/all-items/<type>/all` endpoint for `shows`, `anime`, and `movies` in parallel (`status=all` returns every status bucket — watching/completed/plantowatch/hold/dropped — in one call per type, cheaper than one call per bucket). All three type buckets are queried even though Korean dramas/movies mostly live under `shows`/`movies` rather than `anime`, so the page still works correctly if a title happens to be filed differently.

Poster URLs are composed from the path fragment Simkl returns, proxied through `wsrv.nl` for resizing (`_c` = 170×250 compact card size, `q=90`).

## Detail enrichment (genres/overview/runtime)

The bulk sync-all-items response doesn't include genres, overview, or runtime — only a **per-title** detail endpoint does. Fetching that for every title (~250) on every page load would be slow and hammer Simkl's public endpoint, so:

- Results are cached in SQLite (`simkl_details` table, [simkl-cache.ts](../src/lib/server/simkl-cache.ts)), keyed by `(simkl_id, media_type)`.
- `enrichLibrary()` only fetches a bounded batch (`DETAIL_BATCH_SIZE = 15`) of missing or stale entries per call. Stale = older than 60 days, or missing the `runtime` field (added after the initial cache schema — this makes old cache rows get topped up rather than waiting out the full 60-day window).
- Each detail fetch is wrapped in `Promise.allSettled` — one flaky request doesn't sink the rest of enrichment, since the library itself already loaded successfully at that point.
- A library this size fully warms its cache over a handful of page loads; titles beyond the per-request batch just render without genres/overview until their turn comes up — same "degrade gracefully" philosophy as the rest of the site.

## Outage fallback

`getLibraryWithFallback()` is the actual entry point `+page.server.ts` calls. It tries `refreshLibrarySnapshot()` (fetch + enrich + persist as `simkl_library_snapshot`, a single-row table) and, if that throws (Simkl API down), falls back to the last persisted snapshot instead of showing an empty page — rethrowing only if no snapshot exists yet (e.g. first run). The page surfaces `stale: true` + `staleSince` so the UI can show a "data may be outdated" notice.

This caching approach is explicitly permitted by [Simkl's API rules](https://api.simkl.org/api-rules), which encourage local caching of user data.

## Background refresh

[simkl-refresh.ts](../src/lib/server/simkl-refresh.ts) runs `getLibraryWithFallback()` once immediately and then every 24h via `setInterval(...).unref()`, started once from [hooks.server.ts](../src/hooks.server.ts). This keeps the fallback snapshot warm independent of page traffic, so a Simkl outage right after a quiet period doesn't leave a stale snapshot. Uses a `globalThis` symbol flag (not a module-level variable) specifically so Vite's dev-mode HMR re-evaluating this module doesn't stack a second interval on top of the first.

## Testing

[simkl-cache.test.ts](../src/lib/server/simkl-cache.test.ts) uses the same `__setDbForTests` in-memory-DB pattern as [notes.md](notes.md).
