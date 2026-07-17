import { getAllDevlogEntries } from '$lib/server/devlog';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const allEntries = getAllDevlogEntries();

	return {
		tag: params.tag,
		entries: allEntries.filter((e) => e.tags.includes(params.tag)),
		allTags: [...new Set(allEntries.flatMap((e) => e.tags))].sort()
	};
};
