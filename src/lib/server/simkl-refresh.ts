import { getLibraryWithFallback, simklConfigured } from './simkl';

const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;

// globalThis (not a module-level flag) so this survives Vite's dev-mode HMR
// re-instantiating this module — without it, editing an unrelated file could
// spin up a second interval stacked on top of the first.
const STARTED_KEY = Symbol.for('razerghost.simklRefreshStarted');

// Keeps the library snapshot (simkl-cache.ts) warm independent of page
// traffic, so a Simkl outage right after a quiet period doesn't leave the
// fallback stale. Call once from hooks.server.ts at module load.
export function startSimklRefreshLoop(): void {
	const g = globalThis as typeof globalThis & { [STARTED_KEY]?: boolean };
	if (g[STARTED_KEY] || !simklConfigured()) return;
	g[STARTED_KEY] = true;

	const run = () => {
		getLibraryWithFallback().catch((err) => {
			console.error('Simkl background refresh failed:', err);
		});
	};

	run();
	setInterval(run, REFRESH_INTERVAL_MS).unref();
}
