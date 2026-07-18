import { getLibrary, simklConfigured } from '$lib/server/simkl';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	if (!simklConfigured()) {
		return { configured: false, watching: [], completed: [], planToWatch: [] };
	}

	try {
		const library = await getLibrary();
		return { configured: true, ...library };
	} catch {
		return { configured: true, watching: [], completed: [], planToWatch: [], error: true };
	}
};
