---
title: Hello, world
date: 2026-06-01
tags: [meta, sveltekit]
excerpt: First post on the new devlog — how this site is built and why it exists.
---

This is the first entry in the new devlog. The old razerghost.xyz was a static
portfolio; that content moved to [rg-digital.dev](https://rg-digital.dev). This
site is a smaller, personal thing: a link hub plus a running log of whatever
random project I'm poking at.

## How it works

Posts are plain markdown files in `src/content/devlog/`, read straight off disk
on every request — no static build step, no CMS, no database. Push a new `.md`
file, redeploy, done.

```ts
const entries = getAllDevlogEntries();
```

Some things worth noting:

- No comments, no analytics
- Runs as a real Node server (SvelteKit + `adapter-node`), not a static export
- Posts can embed real, interactive Svelte components — see below

## A live component, embedded right here

Drop `<div data-embed="Counter"></div>` into a post's markdown and it gets
hydrated client-side into an actual Svelte component after the page loads:

<div data-embed="Counter"></div>

Embeds can also take props via `data-*` attributes on the placeholder:

<div data-embed="Terminal"></div>

> Mostly this exists so I have somewhere to write things down.
