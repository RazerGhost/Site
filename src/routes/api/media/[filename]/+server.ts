import { error, json } from '@sveltejs/kit';
import { deleteMediaFile } from '$lib/server/media';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = ({ params, locals }) => {
	if (!locals.user) error(401, 'Unauthorized');
	deleteMediaFile(params.filename);
	return json({ success: true });
};
