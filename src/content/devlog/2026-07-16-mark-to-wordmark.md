---
title: Swapping the mark for a wordmark on wide layouts
date: 2026-07-16
tags: [design, embeds]
excerpt: A before/after look at when the ghost mark alone stops being enough, plus the embed that makes this comparison possible.
---

The ghost mark on its own works fine in the nav at narrow widths, but on
anything wide it reads as a favicon floating in a lot of empty space. Past a
breakpoint it's worth switching to the full wordmark instead.

<div data-embed="BeforeAfter" data-before="/brand/ghost-mark.svg" data-after="/brand/logo-wordmark-ghost.svg"></div>

Drag the slider — that's a real `BeforeAfter` embed, not a static image, using
the same two brand assets already sitting in `static/brand/`. The component
takes `before`/`after` as plain image URLs via `data-*` attributes on the
placeholder `<div>`, same mechanism the `Terminal` embed uses for its
`lines` prop.

Nothing shipped from this post yet — just confirming the embed works with
real assets before wiring it into the actual layout breakpoint logic.
