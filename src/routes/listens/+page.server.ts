import { getListeningStats, getAvailableYears, getHeatmap, getHourlyBreakdown, getOnThisDay } from '$lib/server/spotify-history';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
	const years = getAvailableYears();
	const yearParam = url.searchParams.get('year');
	const explicitYear = yearParam && years.includes(Number(yearParam)) ? Number(yearParam) : null;
	// "all" is a real, explicit choice — only fall back to the latest year when
	// there's no year param in the URL at all (first load).
	const year = yearParam ? explicitYear : (years[0] ?? null);

	const stats = getListeningStats(year != null ? { year } : {});
	const heatmap = year != null ? getHeatmap(year) : [];
	const hourly = getHourlyBreakdown();

	const today = new Date();
	const monthDay = `${String(today.getUTCMonth() + 1).padStart(2, '0')}-${String(today.getUTCDate()).padStart(2, '0')}`;
	const onThisDay = getOnThisDay(monthDay, today.getUTCFullYear());

	return {
		stats,
		// Any year with plays means history has been imported — cheaper than a
		// second, unfiltered getListeningStats() pass just for this flag.
		configured: years.length > 0,
		years,
		selectedYear: year,
		heatmap,
		hourly,
		onThisDay
	};
};
