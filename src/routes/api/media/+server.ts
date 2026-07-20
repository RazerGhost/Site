import { error, json } from '@sveltejs/kit';
import { saveMediaFile, listMediaFiles } from '$lib/server/media';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ locals }) => {
	if (!locals.user) error(401, 'Unauthorized');
	return json({ files: listMediaFiles() });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) error(401, 'Unauthorized');

	const data = await request.formData();
	const file = data.get('file');
	if (!(file instanceof File)) error(400, 'No file provided');

	try {
		const saved = await saveMediaFile(file, file.name);
		return json(saved);
	} catch (e) {
		error(400, (e as Error).message);
	}
};
