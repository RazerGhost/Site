---
title: Picking a design system for a one-person site
date: 2026-07-10
tags: [design, tailwind]
excerpt: Why this site borrows RG Digital's dark/near-black look, swaps the accent to cyan, and how one token file covers both light and dark mode.
---

Didn't want to invent a new visual language just for a link hub, so this site
reuses the same near-black surface system as the other projects — same
spacing scale, same radii, same motion timing. The one deliberate change is
the accent color.

## Lime is spoken for

RG Digital's `#ccff00` lime is specifically that brand's accent — it doesn't
show up anywhere else. This site uses cyan instead, split into two tiers
rather than one flat accent color:

- `--color-primary` (`#22d3ee`) for anything on screen at rest: links,
  borders, button chrome, focus rings
- `--color-action` (`#00e5ff`) reserved for triggered/live moments — a flash,
  a fill animation, something reacting to an event that just fired

The rule of thumb is just "if it's on screen at rest, use primary; if it's
reacting to something that just happened, use action." `.flash-in` and
`.pill-fired` are already defined in `tokens.css` for exactly that, but
nothing on the site fires them yet — a rule with no exceptions is easy to
follow later, so it's sitting there waiting rather than getting retrofitted
once something actually needs it.

## One token file, two themes

Light mode isn't a second design system — it's the same token file with a
`[data-theme='light']` override that only touches the neutral surface and
text tokens (`--bg`, `--surface`, `--border`, `--white`, `--gray`, `--dim`).
The accent color, the spacing scale, the radii, and every motion timing stay
byte-identical across both themes. `ThemeToggle.svelte` just flips an
attribute on `<html>` and persists the choice to `localStorage`; there's no
separate light-mode variant of any component to keep in sync.

## Borrowed the boring parts wholesale

Spacing is a 4px-based scale (`4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64`),
radii are `6/8/12px` plus a `full` for pills, and the easing curves are the
same three cubic-beziers RG Digital already uses. The one convention worth
naming: UI-level transitions (hovers, toggles) stay under 300ms, page-level
transitions land around 400ms — copied straight from the source motion
guideline rather than reinvented per component. `prefers-reduced-motion`
turns off the ambient CTA glow and the flash-in animation for anyone who's
asked for less motion.

Kept it that simple on purpose. A personal devlog doesn't need a component
library — just enough consistency that it doesn't look like a template.
