---
title: Two things the Dockerfile had to get right
date: 2026-07-16
tags: [docker, deployment]
excerpt: pnpm's autoInstallPeers quietly defeats a --prod reinstall, and node:22-slim ships without curl for the HEALTHCHECK to shell out to.
---

Getting this shipped to Coolify meant a Dockerfile, and two things in it
turned out to be less obvious than they looked.

## `--prod` doesn't mean what it sounds like

The build stage installs everything — devDependencies included — compiles
the app, then the runtime stage only needs the production deps. The
obvious move is a fresh `pnpm install --prod` there. That doesn't actually
shrink anything here: the icon packages (`@lucide/svelte`,
`@icons-pack/svelte-simple-icons`) declare `svelte` as a peerDependency,
and pnpm's `autoInstallPeers` resolves that whole peer chain —
`svelte` → `@sveltejs/kit` → `vite` → `esbuild`/`rollup`/`lightningcss` —
regardless of `--prod`, since peerDependencies aren't classified as dev
dependencies. The entire dev toolchain comes back anyway, just through a
different door.

The fix is to prune the *already-resolved* tree from the build stage
instead of asking pnpm to resolve a fresh one:

<div data-embed="CodeDiff" data-lines='["-RUN pnpm install --prod","+RUN pnpm prune --prod && rm -rf \\","+  node_modules/.pnpm/typescript@* node_modules/.pnpm/vite@* \\","+  node_modules/.pnpm/esbuild@* node_modules/.pnpm/rollup@* \\","+  node_modules/.pnpm/@sveltejs+kit@*"]'></div>

`pnpm prune --prod` alone still leaves the dev toolchain physically on
disk, for the same peer-chain reason — so the leftover `.pnpm` directories
get removed explicitly afterward. Confirmed nothing on that list is ever
`require()`'d at runtime by grepping the compiled `build/` output:
adapter-node's output is self-contained.

## No curl for the HEALTHCHECK

Both stages run on `node:22-slim`, which doesn't ship `curl` or `wget` —
and installing either just for a `HEALTHCHECK` isn't worth the extra image
layer. Node itself can make the request instead:

<div data-embed="Terminal" data-lines='["node -e \"require(&apos;http&apos;).get(&apos;http://localhost:3000/healthz&apos;, r => process.exit(r.statusCode === 200 ? 0 : 1))\""]'></div>

Dropped straight into the Dockerfile as the `HEALTHCHECK CMD`, polling
`/healthz` — a route that already existed for exactly this — so Coolify
(and `docker ps`) can see whether the container is actually serving, not
just that the process is alive. `--interval`, `--timeout`, and
`--start-period` keep it from flapping while the server boots.
