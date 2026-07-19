import { getAllDevlogEntries } from '$lib/server/devlog';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return {
		// Newest first for display — getAllDevlogEntries() itself is oldest-first.
		entries: getAllDevlogEntries().toReversed()
	};
};
