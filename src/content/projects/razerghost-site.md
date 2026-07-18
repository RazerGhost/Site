---
name: RazerGhost
description: A personal link hub and devlog — the site you're looking at right now.
href: https://github.com/RazerGhost/ghostbase
live: https://razerghost.xyz
tags: [sveltekit, tailwind, self-hosted]
date: 2026-07-16
---

The site you're reading this on. A small, personal corner of the internet —
somewhere to point people instead of a dozen separate profiles, and a running
log of whatever I'm building at the moment.

## Why it exists

The old razerghost.xyz was a static portfolio; that content moved to
[rg-digital.dev](https://rg-digital.dev), which left room for something
smaller and more personal here. No client work, no case studies — just links,
notes, and status.

## How it's built

SvelteKit (Svelte 5) with Tailwind CSS 4, running as a real Node server
(`adapter-node`) in Docker behind Coolify and Traefik — not a static export.
Devlog and project posts alike are plain markdown files with frontmatter,
read straight off disk on every request. No CMS, no database, no build step
for content: push a `.md` file, redeploy, done.

Posts can also embed real, interactive Svelte components inline — a live
counter, a typed-terminal animation, a before/after image slider — mounted
client-side wherever a post drops in `<div data-embed="Name">`.

A few widgets (Spotify now-playing, Discord presence, live GitHub activity)
pull from external APIs and degrade gracefully — they just quietly disappear
or show a fallback state if their env vars or accounts aren't set up, rather
than breaking the page.

## What's here

- [Devlog](/devlog) — build logs, before/afters, TILs, whatever's worth
  writing down
- The homepage itself carries what I'm currently up to, plus live
  Discord/GitHub signal — no separate status page needed
- [Gear](/gear) — the hardware and software I actually use
- This projects page — the same content model as the devlog, for things
  worth a proper writeup instead of just a card
