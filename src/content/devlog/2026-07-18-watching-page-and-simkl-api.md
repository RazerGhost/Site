---
title: The whole Watching page, rebuilt in a day
date: 2026-07-18
tags: [watching, simkl]
excerpt: Stats, search, genre filters, a caching layer, ratings, a shuffle button, a whole second tab for anime — every bit of it shipped in one sitting.
---

None of this was a roadmap. The [Watching page](/watching) opened this
morning as three static grids off one API call. By tonight it had a search
box, a sort control, genre filtering, hover synopses backed by their own
SQLite cache, rating badges, progress bars, a shuffle button, and an entire
second tab for anime. Same page, same day.

Honest reason it moved that fast: I wasn't typing most of it. Claude Code
did — the SQLite schema, the batched cache warming, the Docker volume
plumbing, even catching that the poster links were broken in the first
place. I called the shots on what the page should actually do; it did the
part where that turns into working code.

<div data-embed="TerminalReplay" data-lines='["$ open /watching","three grids, one api call, nothing to click","$ notice the poster links go nowhere","fixed — simkl needs the numeric id, not just the slug","$ add search + sort + a stats strip","$ want genres and synopses on the cards","turns out the bulk api doesn&apos;t have them","$ build a cache that warms itself, 15 titles at a time","$ add rating badges, progress bars, up-next episodes","$ add a shuffle button for the backlog","$ anime shows up in the library","$ split the page into two tabs","ship it","one day."]'></div>

## Everything that's actually on the page now

A stats strip up top — completed count, total episodes, completed this
year. A search box and a sort control. Genre chips you can tap to narrow
the grid down. Hover a poster and a synopsis fades in over it. Rated titles
get a star badge; anything with episodes gets a progress bar along the
bottom of the card. A **Surprise me** button picks something random off the
backlog — scoped to TV and movies only, so it never hands you an anime pick
by accident.

## The part that could've taken a week

Genres and synopses aren't in the same API call as everything else — that's
a separate, per-title request, and there are around 250 titles in the
library. Firing all of them on every page load isn't really an option. That
problem alone, on a slower day, would've been its own devlog post: a small
SQLite cache, keyed per title, topping itself up 15 entries at a time on
each visit until the whole library's warm. Today it was just one more thing
that got built on the way to shipping the rest.

## Two tabs, because anime showed up

Somewhere in the middle of all this, anime started showing up in the
library alongside the kdramas and movies. Rather than mixing *Isekai* and
*Seinen* genre chips in with kdrama tags, the page split into **TV & Movies**
and **Anime** — each with its own stats, its own filters, its own everything.
That could've been a whole separate afternoon. It was maybe twenty minutes.

Started the day with a page that did almost nothing. Ended it with a page
that has its own database file. [Go see for yourself](/watching).
