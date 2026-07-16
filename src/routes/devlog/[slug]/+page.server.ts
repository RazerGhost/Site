import { error } from '@sveltejs/kit';
import { getDevlogEntry } from '$lib/server/devlog';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const entry = getDevlogEntry(params.slug);

	if (!entry) {
		error(404, 'Devlog entry not found');
	}

	return { entry };
};
