import { getAllDevlogEntries, getSeriesInfoMap } from '$lib/server/devlog';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const allEntries = getAllDevlogEntries();
	return {
		// Newest first for display — getAllDevlogEntries() itself is oldest-first.
		entries: allEntries.toReversed(),
		seriesInfo: Object.fromEntries(getSeriesInfoMap(allEntries))
	};
};
