import { getListeningStats } from '$lib/server/spotify-history';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const stats = getListeningStats();
	return { stats, configured: stats.totalPlays > 0 };
};
