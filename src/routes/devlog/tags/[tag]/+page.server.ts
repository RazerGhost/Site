import { getAllDevlogEntries, getSeriesInfoMap } from '$lib/server/devlog';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const allEntries = getAllDevlogEntries();

	return {
		tag: params.tag,
		// Newest first for display — getAllDevlogEntries() itself is oldest-first.
		entries: allEntries.filter((e) => e.tags.includes(params.tag)).toReversed(),
		allTags: [...new Set(allEntries.flatMap((e) => e.tags))].sort(),
		seriesInfo: Object.fromEntries(getSeriesInfoMap(allEntries))
	};
};
