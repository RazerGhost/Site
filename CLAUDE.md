# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

RazerGhost's personal site: a link hub + devlog built with SvelteKit (Svelte 5), Tailwind CSS 4, and mdsvex. Deployed via Docker (adapter-node) behind Coolify/Traefik.

## Commands

Package manager is pnpm (`packageManager: pnpm@11.3.0`).

- `pnpm dev` — start the Vite dev server
- `pnpm build` — production build (adapter-node, outputs to `build/`)
- `pnpm preview` — preview the production build
- `pnpm check` — `svelte-kit sync` + `svelte-check` (type checking; no separate lint script)
- `node build/index.js` — run the built server (what the Docker image's `CMD` does)

- `pnpm test` — runs the Vitest suite (`src/**/*.test.ts`)

## Architecture

**Devlog content pipeline**: Posts live as markdown files with frontmatter in `src/content/devlog/*.md` (named `YYYY-MM-DD-slug.md`). [src/lib/server/devlog.ts](src/lib/server/devlog.ts) reads them off disk at request time with `gray-matter` (frontmatter) + `marked` (render), computes reading time, and sorts by date. `src/routes/devlog/+page.server.ts` and `src/routes/devlog/[slug]/+page.server.ts` call into this module; there's also `src/routes/devlog/rss.xml/+server.ts` for an RSS feed. Content is copied into the Docker runtime image separately from the compiled app (see Dockerfile) since it's read from disk, not bundled.

**Devlog embeds**: Markdown posts can embed interactive Svelte components via `<div data-embed="Name"></div>`. Available components are registered by name in [src/lib/components/devlog-embeds/registry.ts](src/lib/components/devlog-embeds/registry.ts); [src/lib/actions/mount-embeds.ts](src/lib/actions/mount-embeds.ts) is a Svelte action that scans rendered post HTML and mounts the matching component into each placeholder. Add new embeddable components to both the registry and the `devlog-embeds/` folder.

**External integrations, both optional/degrade gracefully**:
- Spotify "now playing" widget ([SpotifyWidget.svelte](src/lib/components/SpotifyWidget.svelte), backed by [src/lib/server/spotify.ts](src/lib/server/spotify.ts) and `src/routes/api/spotify/*`): uses a refresh-token OAuth flow, caches the access token in-memory per server process. `spotifyConfigured()` gates the widget off when env vars are unset — see [docs/environment.md](docs/environment.md) for the one-time setup steps.
- Discord presence ([DiscordPresence.svelte](src/lib/components/DiscordPresence.svelte)): uses Lanyard, keyed off `discordUserId` in [src/lib/config.ts](src/lib/config.ts). No secret required, but the Discord account must have joined Lanyard's Discord server at least once for it to return data.
- GitHub activity widget ([GithubActivity.svelte](src/lib/components/GithubActivity.svelte)).

**Listens page** ([/listens](src/routes/listens/+page.svelte)): built from Spotify's own "extended streaming history" data export, not the live API alone — that only exposes the last ~50 plays, not historical totals. The export's JSON files are uploaded at `/spotify-import` (gated behind the same GitHub login as `/notes`), parsed and deduplicated into `spotify-history.db` by [spotify-history.ts](src/lib/server/spotify-history.ts) / [spotify-history-db.ts](src/lib/server/spotify-history-db.ts). Re-uploading the same or overlapping export files is safe — inserts are idempotent on `(played_at, spotify_uri, ms_played)`. A live scrobbling endpoint ([src/routes/api/spotify/scrobble/+server.ts](src/routes/api/spotify/scrobble/+server.ts), secret-gated via `SPOTIFY_SCROBBLE_SECRET`) polls Spotify's recently-played and inserts between exports — intended to be hit on a schedule (e.g. Coolify's Scheduled Tasks). Re-importing an export automatically clears out any live-scrobbled rows the export's date range now covers (`deleteScrobbledRange`), since scrobbled `ms_played` is only an estimate and would otherwise double-count against the export's real value.

**Site-wide config**: [src/lib/config.ts](src/lib/config.ts) centralizes site metadata, social links, and nav links — check here before hardcoding any of that elsewhere.

**SEO**: [Seo.svelte](src/lib/components/Seo.svelte) is used per-page to set meta tags; pass `title`, `description`, `path`.

**Styling**: Tailwind CSS 4 via `@tailwindcss/vite` (no separate Tailwind config file — v4 style). Design tokens/custom properties in [src/lib/styles/tokens.css](src/lib/styles/tokens.css). Both light and dark mode are supported ([ThemeToggle.svelte](src/lib/components/ThemeToggle.svelte)).

**Deployment**: Multi-stage Dockerfile builds with full devDependencies, then prunes dev-only packages from the resolved `node_modules` tree rather than doing a fresh `pnpm install --prod` (see comments in [Dockerfile](Dockerfile) for why — peerDependency resolution would otherwise re-pull the whole dev toolchain). `ORIGIN` env var must be set in production (adapter-node needs it to build absolute URLs / validate request origin behind Traefik) — set it in Coolify's environment UI, not in a committed `.env`.

**Persistent data volume**: Five SQLite files live under `data/` at the repo/container root — `notes.db` (private notes, [notes.ts](src/lib/server/notes.ts)), `simkl-cache.db` (cached Simkl genre/synopsis/runtime lookups *and* a full-library snapshot used as a fallback if Simkl's API is unreachable, [simkl-cache.ts](src/lib/server/simkl-cache.ts)), `spotify-history.db` (imported Spotify listening history, [spotify-history-db.ts](src/lib/server/spotify-history-db.ts)), `status.db` (the homepage's "Right now" status items, [status-db.ts](src/lib/server/status-db.ts), edited from `/admin/status`), and `newtab-settings.db` (the `/newtab` dashboard's background-photo search query, [newtab-settings.ts](src/lib/server/newtab-settings.ts), edited from the settings panel on `/newtab` itself). All default to `./data/*.db` (overridable via `NOTES_DB_PATH` / `SIMKL_CACHE_DB_PATH` / `SPOTIFY_HISTORY_DB_PATH` / `STATUS_DB_PATH` / `NEWTAB_SETTINGS_DB_PATH`, see [.env.example](.env.example)) and the Dockerfile declares `/app/data` as a `VOLUME`, but that alone does **not** persist anything across a Coolify redeploy — Coolify replaces the container from the image each deploy, so an anonymous volume goes with it. In Coolify, under the app's **Storages** tab, add a persistent volume mounted at `/app/data` (any volume name) *before* the first real deploy. Losing `notes.db` or `spotify-history.db` loses real content (the latter can only be rebuilt by re-requesting and re-importing the Spotify export — not something that "just re-warms"); losing `simkl-cache.db` just means the Watchlist page's genre/synopsis/runtime data goes cold and re-warms itself over the next several page loads (see `enrichLibrary` in [simkl.ts](src/lib/server/simkl.ts)) — not destructive; losing `status.db` just reverts the homepage's status items to whatever's hardcoded as the fallback in [status-db.ts](src/lib/server/status-db.ts); losing `newtab-settings.db` just reverts the background query to its hardcoded default.

**Private notes** (`/notes/*`, gated by GitHub login): the notes graph itself — search, tags, folders, saved views ([notes.ts](src/lib/server/notes.ts)).

**Private admin area** (`/admin/*`, gated by the same GitHub login, dashboard at [+page.svelte](src/routes/admin/+page.svelte)): `/admin/devlog` and `/admin/projects` are markdown-file editors for `src/content/devlog` and `src/content/projects` — they write straight to disk, so they're meant for use against `pnpm dev` locally, then commit + push to actually publish (those content dirs are baked into the Docker image at build time, not on the persistent volume, so editing them in prod wouldn't survive a redeploy). `/admin/status` edits the DB-backed status content shown in the homepage's "Right now" card (the old standalone `/status` route was folded in and removed), since that's a small enough content model to live in SQLite instead. `/admin/watchlist-cache` inspects/force-refreshes `simkl-cache.db` rows and can bulk-refresh missing/stale runtimes.

**Backups**: [src/routes/api/backup/+server.ts](src/routes/api/backup/+server.ts), secret-gated via `BACKUP_SECRET` (same pattern as the scrobble endpoint above), dumps all four `data/` SQLite DBs to plain-text SQL ([backup.ts](src/lib/server/backup.ts) — schema + `INSERT` statements, not the raw binary file, so it diffs cleanly in git) plus `note-attachments/`, and commits + pushes them to a private git repo (`BACKUP_GIT_REMOTE`, an HTTPS URL with an embedded PAT). Intended to be hit on a schedule the same way the scrobble endpoint is. Requires `git` in the runtime image (see [Dockerfile](Dockerfile)).

## Icons

Two icon packages are used: `@lucide/svelte` (general icons) and `@icons-pack/svelte-simple-icons` (brand icons). Both ship raw `.svelte` source rather than pre-compiled output, so they're added to `ssr.noExternal` in [vite.config.ts](vite.config.ts) — keep that in mind if adding another icon package that behaves the same way.
