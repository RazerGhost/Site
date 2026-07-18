import { fail } from '@sveltejs/kit';
import { importExtendedHistoryFile } from '$lib/server/spotify-history';
import { getListeningStats, getLiveScrobbleCount } from '$lib/server/spotify-history-db';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const stats = getListeningStats();
	return {
		totalPlays: stats.totalPlays,
		firstPlayedAt: stats.firstPlayedAt,
		lastPlayedAt: stats.lastPlayedAt,
		pendingScrobbles: getLiveScrobbleCount()
	};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const files = data.getAll('files').filter((f): f is File => f instanceof File && f.size > 0);

		if (files.length === 0) {
			return fail(400, { error: 'Choose at least one JSON file from your extended streaming history export.' });
		}

		const results: { name: string; parsed: number; inserted: number; replacedScrobbles: number; error: string | null }[] = [];
		for (const file of files) {
			const text = await file.text();
			const result = importExtendedHistoryFile(text);
			results.push({ name: file.name, ...result });
		}

		const totalInserted = results.reduce((sum, r) => sum + r.inserted, 0);
		const totalParsed = results.reduce((sum, r) => sum + r.parsed, 0);
		const totalReplacedScrobbles = results.reduce((sum, r) => sum + r.replacedScrobbles, 0);

		return { results, totalInserted, totalParsed, totalReplacedScrobbles };
	}
};
