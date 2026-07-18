import { error, json } from '@sveltejs/kit';
import { listRevisions } from '$lib/server/notes';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params, locals }) => {
	if (!locals.user) error(401, 'Unauthorized');
	const id = Number(params.id);
	if (!Number.isInteger(id)) error(404, 'Note not found');
	return json(listRevisions(id));
};
