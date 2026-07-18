import fs from 'node:fs';
import path from 'node:path';
import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const CONTENT_TYPES: Record<string, string> = {
	png: 'image/png',
	jpg: 'image/jpeg',
	gif: 'image/gif',
	webp: 'image/webp'
};

export const GET: RequestHandler = ({ params, locals }) => {
	// +server.ts endpoints don't run the /notes +layout.server.ts auth check
	// (that only applies to page loads), so this needs its own guard.
	if (!locals.user) error(401, 'Unauthorized');

	// params.filename is always a bare `${randomUUID()}.ext` we generated
	// ourselves on upload, but guard against path traversal regardless.
	const filename = path.basename(params.filename);
	const ext = filename.split('.').pop() ?? '';
	const contentType = CONTENT_TYPES[ext];
	if (!contentType) error(404, 'Not found');

	const dir = env.NOTES_ATTACHMENTS_DIR || path.join(process.cwd(), 'data', 'note-attachments');
	const filePath = path.join(dir, filename);
	if (!fs.existsSync(filePath)) error(404, 'Not found');

	const body = fs.readFileSync(filePath);
	return new Response(body, { headers: { 'content-type': contentType, 'cache-control': 'private, max-age=31536000, immutable' } });
};
