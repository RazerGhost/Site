import fs from 'node:fs';
import path from 'node:path';
import { error } from '@sveltejs/kit';
import { mediaDir } from '$lib/server/media';
import type { RequestHandler } from './$types';

const CONTENT_TYPES: Record<string, string> = {
	png: 'image/png',
	jpg: 'image/jpeg',
	gif: 'image/gif',
	webp: 'image/webp'
};

// Public — devlog/project cover and gallery images live on public pages,
// unlike note attachments which are served under auth. Only upload/delete
// (src/routes/api/media) require a logged-in admin.
export const GET: RequestHandler = ({ params }) => {
	const filename = path.basename(params.filename);
	const ext = filename.split('.').pop() ?? '';
	const contentType = CONTENT_TYPES[ext];
	if (!contentType) error(404, 'Not found');

	const filePath = path.join(mediaDir(), filename);
	if (!fs.existsSync(filePath)) error(404, 'Not found');

	const body = fs.readFileSync(filePath);
	return new Response(body, {
		headers: { 'content-type': contentType, 'cache-control': 'public, max-age=31536000, immutable' }
	});
};
