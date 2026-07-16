# Build stage — installs all deps (incl. devDependencies) and compiles
# the SvelteKit app via adapter-node.
FROM node:22-slim AS build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.3.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# Prune devDependencies from the already-resolved node_modules, rather than
# doing a fresh `pnpm install --prod` in the runtime stage: some deps here
# (the icon packages) declare `svelte` as a peerDependency, and a from-
# scratch --prod install re-resolves peers via autoInstallPeers, pulling in
# the entire dev toolchain (svelte, vite, typescript, esbuild, rollup...)
# despite --prod. Pruning the existing tree avoids that re-resolution.
#
# `pnpm prune --prod` still leaves the dev toolchain physically installed:
# the icon packages peer-require @sveltejs/kit, which itself peer-requires
# vite (pulling in esbuild/rollup/lightningcss too) — pnpm's autoInstallPeers
# satisfies that whole chain even under --prod, since peerDependencies aren't
# classified as dev. Verified via grep against the compiled build/server
# output that none of these are ever require()'d at runtime (adapter-node's
# build is self-contained), so it's safe to drop them explicitly.
RUN pnpm prune --prod \
	&& rm -rf \
		node_modules/.pnpm/typescript@* \
		node_modules/.pnpm/vite@* \
		node_modules/.pnpm/esbuild@* \
		node_modules/.pnpm/@esbuild+* \
		node_modules/.pnpm/rollup@* \
		node_modules/.pnpm/@rollup+* \
		node_modules/.pnpm/lightningcss* \
		node_modules/.pnpm/@sveltejs+kit@* \
		node_modules/.pnpm/@sveltejs+vite-plugin-svelte@*

# Runtime stage — only the compiled build output, the pruned production
# node_modules, and the markdown content read from disk at request time.
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY src/content ./src/content

EXPOSE 3000

# node:22-slim has neither curl nor wget, so the check shells out to Node's
# own http client instead of a missing binary.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
	CMD node -e "require('http').get('http://localhost:3000/healthz', res => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "build/index.js"]
