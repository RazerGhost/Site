import { error, json } from '@sveltejs/kit';
import { searchNotes } from '$lib/server/notes';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url, locals }) => {
	if (!locals.user) error(401, 'Unauthorized');
	const q = url.searchParams.get('q') ?? '';
	return json(searchNotes(q));
};
