import { error, json } from '@sveltejs/kit';
import { createNote } from '$lib/server/notes';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) error(401, 'Unauthorized');
	const data = await request.formData();
	const title = String(data.get('title') ?? '').trim() || 'Untitled';
	const body = String(data.get('body') ?? '');
	const x = Number(data.get('x'));
	const y = Number(data.get('y'));
	const folder = data.get('folder');
	const note = createNote({
		title,
		body,
		x: Number.isFinite(x) ? x : undefined,
		y: Number.isFinite(y) ? y : undefined,
		folder: folder === null ? undefined : String(folder)
	});
	return json(note);
};
