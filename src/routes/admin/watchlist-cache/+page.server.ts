import { fail } from '@sveltejs/kit';
import { listAllDetails, getCachedDetails, cacheKey } from '$lib/server/simkl-cache';
import { getLibraryTitleMap, refreshCachedDetail, simklConfigured, type SimklType } from '$lib/server/simkl';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const titles = getLibraryTitleMap();
	const entries = listAllDetails().map((row) => ({
		...row,
		title: titles.get(cacheKey(row.simklId, row.mediaType)) ?? `#${row.simklId}`
	}));

	return { entries, configured: simklConfigured() };
};

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export const actions: Actions = {
	refresh: async ({ request }) => {
		const data = await request.formData();
		const simklId = Number(data.get('simklId'));
		const mediaType = String(data.get('mediaType') ?? '') as SimklType;
		if (!Number.isInteger(simklId) || !mediaType) return fail(400, { error: 'Invalid entry' });

		const ok = await refreshCachedDetail(simklId, mediaType);
		if (!ok) return fail(502, { error: 'Simkl fetch failed' });
		return { success: true };
	},

	// Tops up every row missing a runtime — sequential with a short delay
	// between calls so a full-library backfill doesn't hammer Simkl's API.
	// A successful fetch doesn't guarantee a runtime comes back: some titles
	// genuinely have no runtime in Simkl's own database, so re-fetching them
	// re-stores null. Track that separately from actual fetch failures so the
	// summary doesn't imply "fixed" when the source data just isn't there.
	refreshMissing: async () => {
		const targets = listAllDetails().filter((row) => row.runtime == null);
		let filled = 0;
		let stillMissing = 0;
		let failed = 0;
		for (const { simklId, mediaType } of targets) {
			const ok = await refreshCachedDetail(simklId, mediaType as SimklType);
			if (!ok) {
				failed++;
			} else {
				const refreshedRow = getCachedDetails([{ simklId, mediaType }]).get(cacheKey(simklId, mediaType));
				if (refreshedRow?.runtime != null) filled++;
				else stillMissing++;
			}
			await sleep(250);
		}
		return { success: true, bulk: true, filled, stillMissing, failed, total: targets.length };
	}
};
