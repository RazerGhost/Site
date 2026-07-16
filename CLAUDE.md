# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

RazerGhost's personal site: a link hub + devlog built with SvelteKit (Svelte 5), Tailwind CSS 4, and mdsvex. Deployed via Docker (adapter-node) behind Coolify/Traefik.

## Commands

Package manager is pnpm (`packageManager: pnpm@11.3.0`).

- `pnpm dev` — start the Vite dev server
- `pnpm build` — production build (adapter-node, outputs to `build/`)
- `pnpm preview` — preview the production build
- `pnpm check` — `svelte-kit sync` + `svelte-check` (type checking; no separate lint script)
- `node build/index.js` — run the built server (what the Docker image's `CMD` does)

There is no test suite/runner in this repo.

## Architecture

**Devlog content pipeline**: Posts live as markdown files with frontmatter in `src/content/devlog/*.md` (named `YYYY-MM-DD-slug.md`). [src/lib/server/devlog.ts](src/lib/server/devlog.ts) reads them off disk at request time with `gray-matter` (frontmatter) + `marked` (render), computes reading time, and sorts by date. `src/routes/devlog/+page.server.ts` and `src/routes/devlog/[slug]/+page.server.ts` call into this module; there's also `src/routes/devlog/rss.xml/+server.ts` for an RSS feed. Content is copied into the Docker runtime image separately from the compiled app (see Dockerfile) since it's read from disk, not bundled.

**Devlog embeds**: Markdown posts can embed interactive Svelte components via `<div data-embed="Name"></div>`. Available components are registered by name in [src/lib/components/devlog-embeds/registry.ts](src/lib/components/devlog-embeds/registry.ts); [src/lib/actions/mount-embeds.ts](src/lib/actions/mount-embeds.ts) is a Svelte action that scans rendered post HTML and mounts the matching component into each placeholder. Add new embeddable components to both the registry and the `devlog-embeds/` folder.

**External integrations, both optional/degrade gracefully**:
- Spotify "now playing" widget ([SpotifyWidget.svelte](src/lib/components/SpotifyWidget.svelte), backed by [src/lib/server/spotify.ts](src/lib/server/spotify.ts) and `src/routes/api/spotify/*`): uses a refresh-token OAuth flow, caches the access token in-memory per server process. `spotifyConfigured()` gates the widget off when env vars are unset — see [.env.example](.env.example) for the one-time setup steps.
- Discord presence ([DiscordPresence.svelte](src/lib/components/DiscordPresence.svelte)): uses Lanyard, keyed off `discordUserId` in [src/lib/config.ts](src/lib/config.ts). No secret required, but the Discord account must have joined Lanyard's Discord server at least once for it to return data.
- GitHub activity widget ([GithubActivity.svelte](src/lib/components/GithubActivity.svelte)).

**Site-wide config**: [src/lib/config.ts](src/lib/config.ts) centralizes site metadata, social links, and nav links — check here before hardcoding any of that elsewhere.

**SEO**: [Seo.svelte](src/lib/components/Seo.svelte) is used per-page to set meta tags; pass `title`, `description`, `path`.

**Styling**: Tailwind CSS 4 via `@tailwindcss/vite` (no separate Tailwind config file — v4 style). Design tokens/custom properties in [src/lib/styles/tokens.css](src/lib/styles/tokens.css). Both light and dark mode are supported ([ThemeToggle.svelte](src/lib/components/ThemeToggle.svelte)).

**Deployment**: Multi-stage Dockerfile builds with full devDependencies, then prunes dev-only packages from the resolved `node_modules` tree rather than doing a fresh `pnpm install --prod` (see comments in [Dockerfile](Dockerfile) for why — peerDependency resolution would otherwise re-pull the whole dev toolchain). `ORIGIN` env var must be set in production (adapter-node needs it to build absolute URLs / validate request origin behind Traefik) — set it in Coolify's environment UI, not in a committed `.env`.

## Icons

Two icon packages are used: `@lucide/svelte` (general icons) and `@icons-pack/svelte-simple-icons` (brand icons). Both ship raw `.svelte` source rather than pre-compiled output, so they're added to `ssr.noExternal` in [vite.config.ts](vite.config.ts) — keep that in mind if adding another icon package that behaves the same way.
