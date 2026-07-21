import { timingSafeEqual } from 'node:crypto';
import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { runBackup } from '$lib/server/backup';
import type { RequestHandler } from './$types';

// Gated by BACKUP_SECRET since this endpoint has side effects (writes to a
// remote repo) and embeds git credentials in BACKUP_GIT_REMOTE. Prefer the
// `Authorization: Bearer <secret>` header over `?secret=`, which can end up
// in proxy/access logs.
export const GET: RequestHandler = async ({ url, request }) => {
	const secret = env.BACKUP_SECRET;
	if (!secret) error(503, 'Backups not configured');
	const provided =
		request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
		url.searchParams.get('secret');
	const a = Buffer.from(provided ?? '');
	const b = Buffer.from(secret);
	if (a.length !== b.length || !timingSafeEqual(a, b)) error(401, 'Unauthorized');

	try {
		return json(await runBackup());
	} catch (err) {
		console.error('Backup failed:', err);
		error(500, 'Backup failed');
	}
};
