import { error } from '@sveltejs/kit';
import { getAllDevlogEntries, getDevlogEntry, getSeriesInfoMap } from '$lib/server/devlog';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const entry = getDevlogEntry(params.slug);

	if (!entry) {
		error(404, 'Devlog entry not found');
	}

	// getAllDevlogEntries() is sorted oldest-first, so the entry immediately
	// before this one in the array is older and the one after is newer.
	const allEntries = getAllDevlogEntries();
	const index = allEntries.findIndex((e) => e.slug === params.slug);
	const older = index > 0 ? allEntries[index - 1] : null;
	const newer = index >= 0 && index < allEntries.length - 1 ? allEntries[index + 1] : null;

	const related = allEntries
		.filter((e) => e.slug !== params.slug)
		.map((e) => ({ entry: e, shared: e.tags.filter((tag) => entry.tags.includes(tag)).length }))
		.filter((e) => e.shared > 0)
		.sort((a, b) => b.shared - a.shared || (a.entry.date > b.entry.date ? -1 : 1))
		.slice(0, 3)
		.map((e) => e.entry);

	// allEntries is already sorted oldest-first, so filtering to the shared
	// `series` value keeps parts in chronological order for free.
	const series = entry.series
		? (() => {
				const parts = allEntries.filter((e) => e.series === entry.series);
				const part = parts.findIndex((e) => e.slug === params.slug) + 1;
				return { name: entry.series as string, part, total: parts.length, parts };
			})()
		: null;

	return {
		entry,
		older,
		newer,
		related,
		series,
		seriesInfo: Object.fromEntries(getSeriesInfoMap(allEntries))
	};
};
