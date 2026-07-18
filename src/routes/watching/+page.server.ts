import { enrichLibrary, getLibrary, simklConfigured } from '$lib/server/simkl';
import type { PageServerLoad } from './$types';

const EMPTY_LIBRARY = { watching: [], completed: [], planToWatch: [], onHold: [], dropped: [] };

export const load: PageServerLoad = async () => {
	if (!simklConfigured()) {
		return { configured: false, ...EMPTY_LIBRARY };
	}

	try {
		const library = await enrichLibrary(await getLibrary());
		return { configured: true, ...library };
	} catch {
		return { configured: true, ...EMPTY_LIBRARY, error: true };
	}
};
