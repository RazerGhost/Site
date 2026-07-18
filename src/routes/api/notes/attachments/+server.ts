import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { error, json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const ALLOWED_TYPES: Record<string, string> = {
	'image/png': 'png',
	'image/jpeg': 'jpg',
	'image/gif': 'gif',
	'image/webp': 'webp'
};
const MAX_BYTES = 8 * 1024 * 1024;

function attachmentsDir(): string {
	const dir =
		env.NOTES_ATTACHMENTS_DIR || path.join(process.cwd(), 'data', 'note-attachments');
	fs.mkdirSync(dir, { recursive: true });
	return dir;
}

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) error(401, 'Unauthorized');

	const data = await request.formData();
	const file = data.get('file');
	if (!(file instanceof File)) error(400, 'No file provided');
	if (file.size > MAX_BYTES) error(413, 'File too large (max 8MB)');

	const ext = ALLOWED_TYPES[file.type];
	if (!ext) error(400, 'Unsupported file type — use PNG, JPEG, GIF, or WebP');

	const filename = `${randomUUID()}.${ext}`;
	const buffer = Buffer.from(await file.arrayBuffer());
	fs.writeFileSync(path.join(attachmentsDir(), filename), buffer);

	return json({ url: `/notes/files/${filename}` });
};
