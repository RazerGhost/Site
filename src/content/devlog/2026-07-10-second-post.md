---
title: Picking a design system for a one-person site
date: 2026-07-10
tags: [design, tailwind]
excerpt: Why this site borrows RG Digital's dark/near-black look but swaps the accent to cyan.
---

Didn't want to invent a new visual language just for a link hub, so this site
reuses the same near-black surface system as the other projects — same
spacing scale, same radii, same motion timing. The one deliberate change is
the accent color.

## Lime is spoken for

RG Digital's `#ccff00` lime is specifically that brand's accent — it doesn't
show up anywhere else. This site uses cyan instead:

- `--color-primary` (`#22d3ee`) for anything on screen at rest: links, borders,
  button chrome
- `--color-action` (`#00e5ff`) reserved for triggered/live moments, which this
  site mostly doesn't have yet

Kept it that simple on purpose. A personal devlog doesn't need a component
library — just enough consistency that it doesn't look like a template.
