import { getAllDevlogEntries } from '$lib/server/devlog';
import { getAllProjects } from '$lib/server/projects';
import { getListeningStats, getActiveDates } from '$lib/server/spotify-history';
import { computeStreaks } from '$lib/server/listening-streaks';
import { getCurrentlyPlaying, spotifyConfigured } from '$lib/server/spotify';
import { getLibraryWithFallback, simklConfigured } from '$lib/server/simkl';
import { getStatus } from '$lib/server/status-db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const listeningStats = getListeningStats();
	const streaks = computeStreaks(getActiveDates());
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

	let nowPlaying = null;
	if (spotifyConfigured()) {
		try {
			const current = await getCurrentlyPlaying();
			nowPlaying = current.playing ? current : null;
		} catch {
			nowPlaying = null;
		}
	}

	return {
		// getAllDevlogEntries() is sorted oldest-first (prev/next math depends
		// on that) — reverse before slicing so "Latest" means newest.
		latest: getAllDevlogEntries().toReversed().slice(0, 3),
		projects: getAllProjects().slice(0, 3),
		topTrack: listeningStats.topTracks[0] ?? null,
		totalPlays: listeningStats.totalPlays,
		currentStreak: streaks.current?.days ?? null,
		watching,
		nowPlaying,
		statusItems: status.items
	};
};
