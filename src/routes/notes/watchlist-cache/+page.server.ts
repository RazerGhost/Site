import { fail } from '@sveltejs/kit';
import { listAllDetails, cacheKey } from '$lib/server/simkl-cache';
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

export const actions: Actions = {
	refresh: async ({ request }) => {
		const data = await request.formData();
		const simklId = Number(data.get('simklId'));
		const mediaType = String(data.get('mediaType') ?? '') as SimklType;
		if (!Number.isInteger(simklId) || !mediaType) return fail(400, { error: 'Invalid entry' });

		const ok = await refreshCachedDetail(simklId, mediaType);
		if (!ok) return fail(502, { error: 'Simkl fetch failed' });
		return { success: true };
	}
};
