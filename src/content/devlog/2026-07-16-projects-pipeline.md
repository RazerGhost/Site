---
title: Giving Projects the same treatment as the devlog
date: 2026-07-16
tags: [sveltekit, projects]
excerpt: The projects page was a hardcoded array with one entry. Now it's markdown, like everything else here.
---

The projects page started as a single hardcoded object in the page
component — fine for one project, awkward the moment there's a second one
worth writing more than two sentences about.

## The shape

Same pattern as the devlog: frontmatter'd markdown in
`src/content/projects/`, read off disk at request time.

```ts
export interface ProjectMeta {
	slug: string;
	name: string;
	description: string;
	href?: string;
	live?: string;
	cover?: string;
	images: string[];
	tags: string[];
	stack: string[];
	status: ProjectStatus;
	featured: boolean;
	readingTime: number;
	searchText: string;
	draft: boolean;
	date: string;
}
```

`getAllProjects()` lists them for the grid, `getProject(slug)` renders one
in full at `/projects/[slug]` — a straight copy of how `devlog.ts` already
works, down to reusing `gray-matter` for frontmatter and `marked` for the
body.

## What this unlocks

Each project now gets its own page instead of just a card that links out to
GitHub — room for a real writeup, screenshots, a live-site link, source
link, and tags, without touching a single line of Svelte. Add a `.md` file,
redeploy, done. Exactly the same deal the devlog already had.

This post is itself the first entry that isn't a devlog post *about*
something built — it's the writeup for a feature that's also visible one
click away, on [the projects page](/projects) itself.

## Update: the copy became a share

That "straight copy" didn't stay a copy for long. `devlog.ts` and
`projects.ts` ended up with byte-identical `readEntryFile()` and
`toDateString()` functions — same `gray-matter` call, same
slug-from-filename logic, same fix for `gray-matter` parsing unquoted
frontmatter dates into `Date` objects instead of strings. Two copies of the
same fix is one more place for it to drift, so both now import
`readEntryFile`/`toDateString` from a shared `src/lib/server/content.ts`
instead of defining their own.

Their `toMeta()`/`getAll()`/`get()` functions stayed separate, though —
devlog posts have grown `series`, a table of contents, search text, and
footnotes that projects don't need, so forcing both into one shape would've
cost more than the duplication it removed. Share the part that's actually
identical, not the part that just looks similar today.
