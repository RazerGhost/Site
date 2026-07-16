import { getAllDevlogEntries } from '$lib/server/devlog';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return {
		latest: getAllDevlogEntries().slice(0, 3)
	};
};
