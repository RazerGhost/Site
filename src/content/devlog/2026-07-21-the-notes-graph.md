---
title: Building /notes as a force-directed graph, then rebuilding it for mobile
date: 2026-07-21
tags: [notes, sqlite, svelte, ui]
excerpt: A canvas full of notes connected by springs is a fine idea for a mouse and a keyboard. It has nothing to say to a phone — so the mobile version isn't a responsive tweak, it's a second app sharing one state tree.
---

[/notes](/notes) (GitHub-gated, same login as `/admin`) isn't a list. Every
note is a node on a canvas, connected to other notes by links you draw
yourself, and the whole thing behaves like a tiny physics simulation —
notes repel each other, links pull connected notes together like springs,
everything settles toward the center of the view. It's overkill for "write
things down," and that's sort of the point: the graph *is* the organizing
structure, not a visualization bolted onto one.

## The physics

There's no library here — [`tick()`](src/routes/notes/+page.svelte) is a
hand-rolled force simulation that runs on `requestAnimationFrame` whenever
the graph is disturbed:

- Every pair of notes repels the other with a force proportional to
  `REPEL / distance²`, clamped by a minimum distance so two notes can never
  fully overlap.
- Every link pulls its two notes toward a resting distance (`LINK_DISTANCE`)
  like a spring — too close and it pushes apart, too far and it pulls in.
- A weak constant force pulls every note toward the origin, so the graph
  doesn't drift off toward infinity as repulsion accumulates.
- Velocity is damped each frame (`DAMPING = 0.82`) so the whole thing
  settles instead of oscillating forever.

The loop keeps scheduling itself only while something's still moving faster
than `SETTLE_EPS`, or while a note is actively being dragged — once it's
calm, `simRunning` goes false and the browser stops doing any work at all.
Node radius scales with connection count (`22 + connections × 5`, capped at
46), so a heavily-linked note visibly reads as a hub without any separate
"importance" field to maintain.

Positions aren't recomputed from scratch on every load, either — `x`/`y` are
real columns on the `notes` table (added via an `ALTER TABLE` migration in
[`notes.ts`](src/lib/server/notes.ts)), and dragging a note debounces a save
back to the server 400ms after it stops moving. A note you haven't manually
placed falls back to a golden-angle spiral (`scatterPoint`) so a fresh
database doesn't start with every note stacked at the origin.

## A tool dock instead of remembering modifier keys

Four interactions live on the same canvas — move a note, link two notes,
trace the shortest path between two notes, box-select several notes at
once — and they all start with a pointer-down on a node. Early on that meant
memorizing which modifier key meant what. The fix was a small dock of
sticky tool modes (Pointer / Link / Path / Select) so the current mode is
always visible and doesn't need to be held down. The modifier-key shortcuts
still work underneath (`effectiveTool()` checks `shiftKey`/`ctrlKey`/`altKey`
before falling back to whatever's selected in the dock) — the dock just made
the feature discoverable instead of being the only way to reach it.

**Path mode** is the one with actual logic behind it: click a start note,
click an end note, and `bfsPath()` runs a breadth-first search over the link
graph (undirected, since path-finding doesn't care about link direction) and
highlights every link on the shortest route between them. It's a genuinely
useful question once a graph has more than a dozen notes — "how are these
two ideas connected" — answered with a plain BFS over an adjacency map built
fresh from the current `links` array each time.

**Select mode** turns multi-select into a bulk-linking tool: box-select or
shift-click a set of notes, then click one more note as the "hub" and every
selected note gets linked to it in one pass (`linkSelectedTo`) — useful for
"all of these relate to this one," which used to mean drawing the same link
by hand N times.

## Wiki-links and revisions

Typing `[[Note Title]]` in a note's body and saving auto-creates a real
graph link to the matching note (`autoLinkWikiRefs`, matched case-
insensitively by title) — so a habit borrowed from Obsidian/Roam-style tools
becomes an actual edge in the same graph the canvas draws, not just a
clickable in-text reference.

Edits also snapshot into `note_revisions` before being overwritten —
throttled server-side to once per two minutes per note (`shouldSnapshot` in
`notes.ts`) so autosave firing on every second-long pause while typing
doesn't flood the table with near-duplicate snapshots. A note's last 20
revisions are browsable and one-click restorable from the panel. Deletes are
soft (`deleted_at`, filtered out of every read path but not actually
removed) specifically so a same-session "Undo" can bring a note straight
back, links and all, with no separate trash/restore flow to build.

## Then: none of this works on a phone

The canvas assumes a mouse. Dragging a node, drawing a link by dragging from
one note to another, holding a modifier key, hovering to see a tooltip —
none of it has a touch equivalent that isn't worse than the desktop version.
Rather than trying to retrofit touch gestures onto a pointer-driven
simulation, `/notes` now branches early: `isMobile` is set from
`window.matchMedia('(max-width: 768px)')` (with a `change` listener so
rotating a tablet or resizing a window updates it live), and mobile gets an
entirely different view — a plain scrollable list of notes with a search
box, and tapping one opens a full-screen editor with a title field, a
comma-separated tags field, a write/preview toggle for the markdown body,
and image attach, instead of the floating side panel desktop uses.

The interesting constraint wasn't building the list-and-editor view itself —
that part's straightforward — it's that **both branches have to share the
same state**. `nodes`, `links`, `selectedId`, `panelBody`, autosave timers,
all of it. A note edited from the mobile list view needs to show up
correctly if you resize the window past 768px without a page reload, and
vice versa. So the split is a CSS class toggle on the same `<main>`
(`class="{isMobile ? 'flex' : 'hidden'} …"`) rather than two separately
mounted trees, plus a couple of guard clauses elsewhere — the force
simulation's `$effect` bails out early on mobile, since there's no point
running physics nobody can see or interact with — never a duplicated copy of
the data layer. Even the small stuff carried over deliberately: the mobile
"Back" button flushes any pending autosave before closing the editor
(`mobileBack`), mirroring the exact flush `selectNote` already did on
desktop to avoid a debounced save landing after the panel had already moved
on to different content.

One graph, two very different ways to touch it, zero duplicated state.
