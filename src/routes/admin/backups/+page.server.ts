import { fail } from '@sveltejs/kit';
import { runBackup, getLastBackupInfo, backupConfigured } from '$lib/server/backup';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const configured = backupConfigured();
	const last = configured ? await getLastBackupInfo() : null;
	return { configured, last };
};

export const actions: Actions = {
	default: async () => {
		if (!backupConfigured()) return fail(503, { error: 'BACKUP_GIT_REMOTE not configured' });
		try {
			const result = await runBackup();
			return { result };
		} catch (e) {
			return fail(500, { error: (e as Error).message });
		}
	}
};
