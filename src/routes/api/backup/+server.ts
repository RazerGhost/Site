import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { dumpDatabaseToSql } from '$lib/server/backup';
import type { RequestHandler } from './$types';

const run = promisify(execFile);

const DBS: { name: string; envVar: string; defaultFile: string }[] = [
	{ name: 'notes', envVar: 'NOTES_DB_PATH', defaultFile: 'notes.db' },
	{ name: 'simkl-cache', envVar: 'SIMKL_CACHE_DB_PATH', defaultFile: 'simkl-cache.db' },
	{ name: 'spotify-history', envVar: 'SPOTIFY_HISTORY_DB_PATH', defaultFile: 'spotify-history.db' },
	{ name: 'status', envVar: 'STATUS_DB_PATH', defaultFile: 'status.db' }
];

function dbPath(envVar: string, defaultFile: string): string {
	return env[envVar] || path.join(process.cwd(), 'data', defaultFile);
}

async function git(args: string[], cwd: string) {
	return run('git', args, { cwd, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } });
}

// Backs up the persistent-volume state (the four SQLite DBs, dumped as text
// so they diff cleanly in git — see backup.ts — plus note attachments) to a
// private git repo. Meant to be hit on a schedule (Coolify's Scheduled
// Tasks or an external cron), same pattern as /api/spotify/scrobble.
//
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
	if (provided !== secret) error(401, 'Unauthorized');

	const remote = env.BACKUP_GIT_REMOTE;
	if (!remote) error(503, 'BACKUP_GIT_REMOTE not configured');
	const branch = env.BACKUP_GIT_BRANCH || 'main';
	const userName = env.BACKUP_GIT_USER_NAME || 'ghostbase backup';
	const userEmail = env.BACKUP_GIT_USER_EMAIL || 'backup@localhost';

	const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ghostbase-backup-'));

	try {
		try {
			await git(['clone', '--quiet', '--depth', '1', '--branch', branch, remote, workDir], os.tmpdir());
		} catch {
			// Branch doesn't exist yet (first-ever run against an empty repo).
			await git(['clone', '--quiet', remote, workDir], os.tmpdir());
			await git(['checkout', '--orphan', branch], workDir);
			await git(['rm', '--quiet', '-rf', '--ignore-unmatch', '.'], workDir);
		}

		const dumped: string[] = [];
		for (const { name, envVar, defaultFile } of DBS) {
			const sql = dumpDatabaseToSql(dbPath(envVar, defaultFile));
			if (sql === null) continue;
			fs.writeFileSync(path.join(workDir, `${name}.sql`), sql);
			dumped.push(name);
		}

		const attachmentsSrc =
			env.NOTES_ATTACHMENTS_DIR || path.join(process.cwd(), 'data', 'note-attachments');
		const attachmentsDest = path.join(workDir, 'note-attachments');
		fs.rmSync(attachmentsDest, { recursive: true, force: true });
		if (fs.existsSync(attachmentsSrc)) {
			fs.cpSync(attachmentsSrc, attachmentsDest, { recursive: true });
		}

		await git(['add', '-A'], workDir);
		const { stdout: status } = await git(['status', '--porcelain'], workDir);
		if (status.trim() === '') {
			return json({ committed: false, dbs: dumped, message: 'No changes since last backup' });
		}

		await git(
			['-c', `user.name=${userName}`, '-c', `user.email=${userEmail}`, 'commit', '--quiet', '-m', `backup: ${new Date().toISOString()}`],
			workDir
		);
		await git(['push', '--quiet', 'origin', `HEAD:${branch}`], workDir);

		return json({ committed: true, dbs: dumped, timestamp: new Date().toISOString() });
	} catch (err) {
		console.error('Backup failed:', err);
		error(500, 'Backup failed');
	} finally {
		fs.rmSync(workDir, { recursive: true, force: true });
	}
};
