---
title: The whole Watchlist page, built in a day
date: 2026-07-18
tags: [watchlist, simkl]
excerpt: Simkl's bulk sync call doesn't carry genres, overviews, or runtimes — getting those without hammering a per-title endpoint on every load meant a small self-warming cache, plus a full-library snapshot to survive an outage.
---

The [Watchlist page](/watchlist) opened as three static grids off one Simkl
API call. By the end of the day it had search, sorting, genre filters, a
stats section, and a caching layer underneath all of it — same page, same
day, just a lot more of it by the time it shipped.

## The shape of it

`getLibrary()` in `simkl.ts` hits Simkl's `sync/all-items` endpoint once per
media type (shows, anime, movies) with `status=all`, which returns every
bucket — watching, completed, plan-to-watch, on hold, dropped — in one call
per type instead of one call per bucket. Korean dramas and movies mostly live
under the "shows"/"movies" buckets rather than "anime" on Simkl, but querying
all three keeps the page correct even for a title filed somewhere unexpected.

One thing the bulk response gets wrong on its own: poster links. Simkl's
detail URLs need the numeric id (`/tv/<id>/<slug>`), not just the slug — a
slug-only link 404s into the generic discover page instead of the title.

## Genres and overviews aren't in that call

Genres, overview text, and per-episode runtime are a separate, per-title
request — and the library has around 250 titles. Firing all of them on every
page load isn't an option, so `enrichLibrary()` only ever tops up a small,
bounded batch (`DETAIL_BATCH_SIZE = 15`) of missing or stale entries per
request, caching results in `simkl-cache.db`'s `simkl_details` table keyed by
`(simkl_id, media_type)`. A library this size fully warms over a handful of
page loads; anything beyond the batch just renders without genres until its
turn comes up — the same degrade-gracefully approach as the rest of the site.
Cached entries go stale after 60 days (genres don't change often), and rows
cached before `runtime` existed are treated as stale too, so they backfill
instead of waiting out the full window.

## Surviving a Simkl outage

Simkl's API rules explicitly permit caching user data locally, so alongside
the per-title cache, `simkl-cache.ts` also keeps a single-row snapshot of the
*entire* enriched library in `simkl_library_snapshot`. `getLibraryWithFallback()`
tries the live sync call first and saves a fresh snapshot on success; if the
call throws, it serves the last saved snapshot instead of an empty page, with
a `stale` flag the UI turns into a small banner ("showing a cached copy
from…"). `simkl-refresh.ts` also runs the same refresh on a 24-hour timer
independent of page traffic, so the fallback doesn't go stale just because
nobody visited the page in a while.

## What it adds up to

The stats section reads like Simkl's own stats page: watch time in days and
hours (from real per-title runtimes, not an estimate), peak year, most active
weekday, average rating, backlog size with hours-to-clear, completion rate,
and a top-5 genre breakdown — all computed from the same enriched library the
grids already have in memory, no extra queries. It's also the one page on
the site that breaks out of the usual narrow, centered column — search,
sort, and stats all use the full width, since a six-column poster grid needs
the room.

**Surprise me** isn't a one-line text pick that pops a new tab either — it
reveals a full spotlight card in place: poster, rating, genres, overview, an
"Open on Simkl" link, and a "Try another" button to reroll without leaving
the page.

## Two tabs, because anime showed up

Anime titles started showing up in the library alongside the kdramas and
movies, and mixing *Isekai*/*Seinen* genre chips in with kdrama tags didn't
read well as one filter set. The page split into **TV & Movies** and
**Anime** tabs, each with its own stats, its own filters, its own "Surprise
me" — scoped so the shuffle button never hands a TV-and-movies session an
anime pick by accident. [Go see for yourself](/watchlist).
