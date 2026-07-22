import { getAllDevlogEntries } from '$lib/server/devlog';
import { getAllProjects } from '$lib/server/projects';
import { getActiveDates } from '$lib/server/spotify-history';
import { computeStreaks } from '$lib/server/listening-streaks';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const streaks = computeStreaks(getActiveDates());

	return {
		postCount: getAllDevlogEntries().length,
		projectCount: getAllProjects().length,
		currentStreak: streaks.current?.days ?? null
	};
};
