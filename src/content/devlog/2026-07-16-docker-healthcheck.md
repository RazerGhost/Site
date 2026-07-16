---
title: A Docker HEALTHCHECK with no curl in the image
date: 2026-07-16
tags: [docker, deployment]
excerpt: node:22-slim ships without curl or wget, so the healthcheck has to shell out to Node itself.
---

Wanted a `HEALTHCHECK` in the Dockerfile so Coolify (and `docker ps`) can see
whether the container is actually serving, not just that the process is
alive. The usual one-liner is a `curl` against a health route — except
`node:22-slim` doesn't ship `curl` or `wget`, and adding either just for a
health check isn't worth the extra image layer.

Node itself can make the request instead:

<div data-embed="Terminal" data-lines='["node -e \"require(&apos;http&apos;).get(&apos;http://localhost:3000/healthz&apos;, r => process.exit(r.statusCode === 200 ? 0 : 1))\""]'></div>

Dropped straight into the Dockerfile as the `HEALTHCHECK CMD`, polling
`/healthz` — a route that already existed for exactly this. `--interval`,
`--timeout`, and `--start-period` keep it from flapping while the server
boots.
