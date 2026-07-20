import { getAllDevlogEntries } from '$lib/server/devlog';
import { getAllProjects } from '$lib/server/projects';
import { getListeningStats, getActiveDates, getRecentDailyPlayCounts } from '$lib/server/spotify-history';
import { computeStreaks } from '$lib/server/listening-streaks';
import { getLibraryWithFallback, simklConfigured } from '$lib/server/simkl';
import { getStatus } from '$lib/server/status-db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const listeningStats = getListeningStats();
	const streaks = computeStreaks(getActiveDates());
	const recentDaily = getRecentDailyPlayCounts(14);
	const status = getStatus();

	let watching = null;
	if (simklConfigured()) {
		try {
			const { library } = await getLibraryWithFallback();
			watching = library.watching[0] ?? null;
		} catch {
			watching = null;
		}
	}

	return {
		// getAllDevlogEntries() is sorted oldest-first (prev/next math depends
		// on that) — reverse before slicing so "Latest" means newest.
		latest: getAllDevlogEntries().toReversed().slice(0, 3),
		projects: getAllProjects().slice(0, 3),
		totalPlays: listeningStats.totalPlays,
		currentStreak: streaks.current?.days ?? null,
		recentDaily,
		watching,
		statusItems: status.items
	};
};
