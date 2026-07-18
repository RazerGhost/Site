# Docs index

In-depth, implementation-level documentation. Start with the top-level [README.md](../README.md) for setup and a quick tour — these docs go deeper on *how* each subsystem actually works, for when you're modifying it rather than just running it.

- [content-pipeline.md](content-pipeline.md) — devlog + projects markdown pipeline, embeds, RSS/OG image generation
- [auth.md](auth.md) — GitHub OAuth login gate, session cookies
- [notes.md](notes.md) — `/notes` data model, full-text search, revisions, soft delete
- [watchlist.md](watchlist.md) — Simkl integration, detail enrichment, outage fallback
- [listens.md](listens.md) — Spotify extended history import, live scrobbling, stats queries
- [integrations.md](integrations.md) — Spotify "now playing" widget, Discord presence, GitHub activity
- [deployment.md](deployment.md) — Docker build, Coolify/Traefik, persistent volumes, health checks

Each doc assumes you've read the top-level README's environment variable table.
