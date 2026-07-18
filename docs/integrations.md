# Small integrations

Widgets that are simpler than the [Watchlist](watchlist.md) / [Listens](listens.md) subsystems — no local database, all live-fetched, all optional/degrade-gracefully.

## Spotify "now playing"

[SpotifyWidget.svelte](../src/lib/components/SpotifyWidget.svelte) + [spotify.ts](../src/lib/server/spotify.ts) + `src/routes/api/spotify/*`.

Uses the OAuth **refresh-token** flow (not authorization-code-per-request) — `SPOTIFY_REFRESH_TOKEN` is minted once during setup (see [.env.example](../.env.example)) and exchanged for a short-lived access token on demand. `getSpotifyAccessToken()` caches that access token **in-memory, per server process** (module-level variable, not per-request) and only re-fetches once it's within 60s of expiring — this means every visitor polling the widget shares one refreshed token instead of each hitting Spotify's token endpoint.

`spotifyConfigured()` gates the widget off entirely (renders "Spotify not connected") when the three env vars aren't all set. The recently-played history section within the widget additionally hides itself if the refresh token was only granted `user-read-currently-playing` without `user-read-recently-played`.

This module is also depended on by the [Listens](listens.md) live-scrobble endpoint, which reuses the same cached-token helper.

## Discord presence

[DiscordPresence.svelte](../src/lib/components/DiscordPresence.svelte) uses [Lanyard](https://github.com/Phineas/lanyard), a free third-party service that surfaces a Discord user's live presence via their public Discord ID (not a secret — Discord IDs are public). Configured via `discordUserId` in [config.ts](../src/lib/config.ts).

No API credentials needed, but Lanyard only has data for accounts that have joined its own Discord server (discord.gg/lanyard) at least once — if presence never shows up, that's the first thing to check, not a code bug.

## GitHub activity

[GithubActivity.svelte](../src/lib/components/GithubActivity.svelte) — pulls recent public activity for `site.githubUsername` from GitHub's public API. No auth required (unauthenticated GitHub API rate limits apply).
