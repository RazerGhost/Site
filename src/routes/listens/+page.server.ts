import { getListeningStats, getAvailableYears, getHeatmap, getHourlyBreakdown, getOnThisDay } from '$lib/server/spotify-history';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
	const years = getAvailableYears();
	const yearParam = url.searchParams.get('year');
	const year = yearParam && years.includes(Number(yearParam)) ? Number(yearParam) : null;

	const stats = getListeningStats(year != null ? { year } : {});
	const heatmap = year != null ? getHeatmap(year) : years[0] != null ? getHeatmap(years[0]) : [];
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
		selectedYear: year ?? years[0] ?? null,
		heatmap,
		hourly,
		onThisDay
	};
};
