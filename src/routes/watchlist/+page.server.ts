import { getLibraryWithFallback, simklConfigured } from '$lib/server/simkl';
import type { PageServerLoad } from './$types';

const EMPTY_LIBRARY = { watching: [], completed: [], planToWatch: [], onHold: [], dropped: [] };

export const load: PageServerLoad = async () => {
	if (!simklConfigured()) {
		return { configured: false, ...EMPTY_LIBRARY, stale: false, staleSince: null };
	}

	try {
		const { library, stale, staleSince } = await getLibraryWithFallback();
		return { configured: true, ...library, stale, staleSince };
	} catch {
		return { configured: true, ...EMPTY_LIBRARY, error: true, stale: false, staleSince: null };
	}
};
