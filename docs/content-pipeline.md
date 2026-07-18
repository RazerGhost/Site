# Content pipeline

Devlog posts and project entries are both markdown files with YAML frontmatter, read off disk **at request time** (not bundled by Vite) via [content.ts](../src/lib/server/content.ts)'s shared `readEntryFile`/`toDateString` helpers, then rendered independently by [devlog.ts](../src/lib/server/devlog.ts) and `projects.ts`.

`content.ts` is deliberately small: only the identical file-reading and date-normalization logic is shared. `devlog.ts`'s and `projects.ts`'s actual `toMeta()`/`getAll()`/`get()` functions are separate, since their output shapes genuinely differ (devlog has series/toc/searchText/footnotes; projects has name/href/live) — this was a conscious choice not to force a shared abstraction over two things that only look similar at the file-I/O layer.

## Frontmatter date handling

`gray-matter` (via `js-yaml`) parses an unquoted frontmatter date like `date: 2026-06-01` into a native JS `Date`, not a string. `String(date)` on that yields a verbose, timezone-dependent format that doesn't sort lexicographically — `toDateString()` normalizes any such value to `YYYY-MM-DD` so list sorting and prev/next comparisons work correctly regardless of how the date was written in frontmatter.

## Devlog rendering ([devlog.ts](../src/lib/server/devlog.ts))

- **Reading time**: word count / 200wpm, rounded, minimum 1 minute.
- **Search text**: `toSearchText()` strips markdown syntax (code fences, inline code, images, links, footnote refs/defs, HTML tags, remaining markdown punctuation) down to lowercased plain text, so the devlog list page can search post bodies client-side without shipping raw markdown into the match.
- **Footnotes**: hand-rolled (not a `marked` plugin) — `applyFootnotes()` extracts `[^label]: text` block definitions and rewrites `[^label]` refs into numbered `<sup>` anchors, run on raw markdown *before* `marked.parse`. Chosen to stay independent of `marked`'s renderer API rather than pulling in a plugin for something this narrow in scope.
- **Heading anchors / TOC**: `addHeadingAnchors()` post-processes rendered HTML (not a `marked` renderer hook, same rationale as footnotes) to give every `<h2>`/`<h3>` a stable, de-duplicated slug id, building the table-of-contents list as a side effect. `decodeHtmlEntities()` exists because heading text also gets used as plain text (TOC labels via Svelte's `{text}` interpolation, which doesn't decode entities the way `{@html}` does) — without it, a heading like `--prod doesn't mean...` would show a literal `&#39;` in the TOC.
- **Drafts**: `draft: true` in frontmatter excludes a post from `getAllDevlogEntries()` — which backs the list page, RSS, sitemap, tag pages, and prev/next/related computations, so setting it once hides the post everywhere at once. `getDevlogEntry(slug)` (the single-post loader) deliberately does **not** filter drafts, so a draft post is still viewable by direct URL — useful for previewing before publishing, but be aware an unlisted draft is not actually access-controlled.

## Devlog embeds

Markdown posts can embed interactive Svelte components via `<div data-embed="Name"></div>`. Available components (Counter, Callout, Terminal, TerminalReplay, CodeDiff, BeforeAfter, Mermaid — see `src/lib/components/devlog-embeds/`) are registered by name in [registry.ts](../src/lib/components/devlog-embeds/registry.ts). [mount-embeds.ts](../src/lib/actions/mount-embeds.ts) is a Svelte action that scans rendered post HTML client-side and mounts the matching component into each placeholder div.

**Adding a new embeddable component** requires two steps: create the component in `devlog-embeds/`, and register it by name in `registry.ts`.

## OG images & RSS

[og.ts](../src/lib/server/og.ts) generates per-post/per-project Open Graph preview images (used by `[slug]/og.png/+server.ts` routes) using `satori` + `resvg` — this needs real font bytes rather than system fonts, which is why `src/lib/server/fonts/*.woff` are read from disk at request time and explicitly copied into the Docker runtime image (see [deployment.md](deployment.md)), rather than routed through Vite's asset pipeline like other static assets.

[xml.ts](../src/lib/server/xml.ts) is a shared helper for the RSS feeds (`devlog/rss.xml`, `projects/rss.xml`) and `sitemap.xml`.
