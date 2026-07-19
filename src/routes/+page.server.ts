import { getAllDevlogEntries } from '$lib/server/devlog';
import { getListeningStats } from '$lib/server/spotify-history';
import { getLibraryWithFallback, simklConfigured } from '$lib/server/simkl';
import { getStatus } from '$lib/server/status-db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const listeningStats = getListeningStats();
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
		topTrack: listeningStats.topTracks[0] ?? null,
		totalPlays: listeningStats.totalPlays,
		watching,
		statusItems: status.items
	};
};
