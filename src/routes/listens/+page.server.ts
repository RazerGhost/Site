import {
	getListeningStats,
	getAvailableYears,
	getHeatmap,
	getHourlyBreakdown,
	getOnThisDay,
	getTopAlbums,
	getSkipShuffleStats,
	getMonthlyTrend,
	getDiscoveries,
	getActiveDates
} from '$lib/server/spotify-history';
import { computeStreaks } from '$lib/server/listening-streaks';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
	const years = getAvailableYears();
	const yearParam = url.searchParams.get('year');
	// "All time" needs its own sentinel ("year=all") rather than just omitting
	// the param — an omitted param is indistinguishable from a fresh /listens
	// load with no selection yet, which should default to the latest year.
	const year =
		yearParam === 'all'
			? null
			: yearParam && years.includes(Number(yearParam))
				? Number(yearParam)
				: (years[0] ?? null);
	const yearOpts = year != null ? { year } : {};

	const stats = getListeningStats(yearOpts);
	const heatmap = year != null ? getHeatmap(year) : [];
	const hourly = getHourlyBreakdown();
	const topAlbums = getTopAlbums(yearOpts);
	const skipShuffle = getSkipShuffleStats(yearOpts);
	const monthlyTrend = getMonthlyTrend(yearOpts);
	const discoveries = year != null ? getDiscoveries(year) : [];
	const streaks = computeStreaks(getActiveDates());

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
		onThisDay,
		topAlbums,
		skipShuffle,
		monthlyTrend,
		discoveries,
		streaks
	};
};
