import { getStatus } from '$lib/server/status-db';
import { getBackgroundPhoto, defaultUnsplashQuery, unsplashConfigured } from '$lib/server/unsplash';
import { getNewtabSettings, setNewtabUnsplashQuery } from '$lib/server/newtab-settings';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const status = getStatus();
	const settings = getNewtabSettings();
	const unsplashQuery = settings.unsplashQuery || defaultUnsplashQuery();
	const photo = await getBackgroundPhoto(unsplashQuery);

	return {
		statusItems: status.items,
		photo,
		unsplashQuery,
		unsplashConfigured: unsplashConfigured()
	};
};

export const actions: Actions = {
	updateBackground: async ({ request }) => {
		const data = await request.formData();
		const query = String(data.get('query') ?? '').trim();
		setNewtabUnsplashQuery(query || null);
		return { success: true };
	}
};
