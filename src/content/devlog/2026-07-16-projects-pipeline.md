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
	tags: string[];
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
