---
title: Building /listens from a Spotify data export instead of an API
date: 2026-07-18
tags: [spotify, listens, sqlite]
excerpt: Spotify's API only gives you the last ~50 plays. Getting real history — and years of stats out of it — meant starting from my own data export instead.
---

The [Listens page](/listens) isn't backed by a live feed. Spotify's own API
only exposes the last ~50 recently-played tracks — fine for a "now playing"
widget, useless for "what have I actually listened to since 2019." Real
history only exists in one place: Spotify's own "extended streaming history"
export, the one you request from their privacy settings and wait a few days
for.

## The shape of it

The export lands as a pile of JSON files, one play per entry — track, artist,
album, timestamp, milliseconds played, the works. `spotify-history.ts`
parses and normalizes them; `spotify-history-db.ts` writes the result into
`spotify-history.db`, a SQLite file on the persistent data volume.
`/spotify-import` (gated behind the same GitHub login as `/admin`) is where
the files actually get uploaded.

Inserts are idempotent on `(played_at, spotify_uri, ms_played)`, which
matters more than it sounds like it should — Spotify's exports overlap at
the edges, and re-uploading the same file (or a newer export that reaches
back further) needs to be a no-op for anything already in the database, not
a pile of duplicate plays.

## Filling the gap between exports

An export is a snapshot, not a subscription — the moment it's imported it
starts going stale. `/api/spotify/scrobble` closes that gap: a secret-gated
endpoint that polls Spotify's recently-played on a schedule (a Coolify
Scheduled Task hits it periodically) and inserts anything new. Its
`ms_played` is only an estimate, so importing a fresh export later calls
`deleteScrobbledRange` first — anything scrobbled that the new export's date
range now covers for real gets replaced rather than double-counted.

## What the data turns into

Once a few years of plays are sitting in SQLite, the interesting part is
what you can compute from them cheaply: total listening time broken into
days/hours/minutes, peak year, most active weekday, top artists and tracks
(with a drill-down into which tracks made up an artist's plays), a
GitHub-style activity heatmap per year, an hour-of-day listening clock, and
an "on this day" section pulling matching dates across every year in the
history. All of it's just `GROUP BY` and a bit of date math over one table —
no external calls, no caching layer needed, because it's already local.

## Search, twice

The search box went through two versions. The first was a dropdown list of
text results — functional, but it needed a click-outside handler to dismiss
and gave you nothing to look at but track names. The second pass replaced it
with an inline grid of cards, each lazily fetching its own album art from
Spotify's public oEmbed endpoint — no auth, no token, just a fetch keyed and
cached by track URI, degrading to a plain music icon if it fails. A proper
"no matches" state and a clear button replaced the dismiss-by-clicking-
elsewhere behavior along the way.

Same idea as [building Watchlist](/devlog/2026-07-18-watching-page-and-simkl-api):
a page that started as "just show the data" kept growing search, filters,
and visual polish on top, one pass at a time, because once the underlying
data's already sitting in a local database, adding another way to look at it
is cheap.
