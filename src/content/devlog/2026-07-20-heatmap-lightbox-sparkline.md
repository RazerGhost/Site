---
title: A weekly heatmap, a project lightbox, and swapping a callout for a sparkline
date: 2026-07-20
tags: [listens, spotify, sqlite, ui]
excerpt: Three small, unrelated features shipped together, tied by the same idea — once data already lives in SQLite, another way to look at it is just another query.
---

Three features, one commit, no shared code between them — but the same
underlying reason they were each cheap to build.

## A weekday × hour listening-habits heatmap

`/listens` already had a GitHub-style yearly activity heatmap and an
hour-of-day listening clock. The natural next chart cross-references them:
weekday on one axis, hour-of-day on the other, play count as intensity —
answering "am I actually a Sunday-morning or Friday-night listener" in one
glance instead of inferring it from two separate charts.

[`getWeekdayHourBreakdown`](src/lib/server/spotify-history-db.ts) is the
whole implementation server-side: `strftime('%w', played_at)` and
`strftime('%H', played_at)` grouped together, one `GROUP BY` over a table
that already exists. Like every other aggregate on that page, it's sparse —
weekday/hour combinations with zero plays are just absent from the result
rather than present with a zero, and the client fills in the gaps when it
renders the grid. Optionally scoped to a single year via the same
`yearRange()` helper the yearly heatmap already used.

Adding the new chart also meant rebalancing `/listens`' card layout — the
grid had grown one card at a time across several earlier passes and had
started to show mismatched-height dead space between cards. Nothing
algorithmic, just a manual pass at grouping the cards that visually belong
together.

## A lightbox for project galleries

Project pages had gallery images that opened at native size with no
zoom — click one, get a big image inline, no way to page through the rest
of the gallery without scrolling back up. [`Lightbox.svelte`](src/lib/components/Lightbox.svelte)
is a small, self-contained overlay: click-to-expand, arrow-key and
on-screen prev/next navigation, an image counter, Escape or a click on the
backdrop to close. `open` and `index` are `$bindable` props, so the project
page itself just needs an array of image URLs and a click handler that sets
the index — no gallery-specific logic lives in the component.

## Swapping the homepage's top-track callout for a sparkline

The homepage previously surfaced "top track" as a static callout — accurate,
but static in a way that didn't reflect anything about *recent* listening,
and a single track name doesn't say much at a glance. It's replaced with a
14-day listening-activity sparkline: a small inline chart showing daily play
counts for the last two weeks, which reads as "here's what I've actually
been doing" rather than a single frozen fact.

[`getRecentDailyPlayCounts`](src/lib/server/spotify-history-db.ts) backs it —
almost identical in shape to the yearly heatmap query, just a rolling
`days`-sized window anchored on today (UTC) instead of a calendar year. Same
sparse-result convention, same memoization pattern as everything else in
that file. The homepage query is cheap enough to run on every request
because, like the rest of `/listens`, the data's already sitting local in
SQLite — no external call, no separate cache layer, just another `GROUP BY`.
